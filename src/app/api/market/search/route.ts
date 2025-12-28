import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface GoAPIStockData {
  symbol: string
  company: {
    symbol: string
    name: string
    logo: string
  }
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  change: number
  change_pct: number
}

interface GoAPIStockResponse {
  status: string
  message: string
  data: {
    results: GoAPIStockData[]
  }
}

// Helper to format stock data
function formatStockData(stock: Awaited<ReturnType<typeof prisma.marketStock.findUnique>>) {
  if (!stock) return null
  return {
    symbol: stock.symbol,
    companyName: stock.companyName,
    logo: stock.logo,
    price: Number(stock.price),
    change: Number(stock.change),
    changePercent: Number(stock.changePercent),
    volume: Number(stock.volume),
    open: stock.open ? Number(stock.open) : null,
    high: stock.high ? Number(stock.high) : null,
    low: stock.low ? Number(stock.low) : null,
    updatedAt: stock.updatedAt
  }
}

// GET - Search from database (supports multiple symbols with comma separated)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const symbolParam = searchParams.get('symbol') || searchParams.get('symbols')

  if (!symbolParam) {
    return NextResponse.json(
      { success: false, error: 'Symbol is required' },
      { status: 400 }
    )
  }

  try {
    // Parse symbols (comma separated, max 50)
    const symbols = symbolParam
      .split(',')
      .map(s => s.trim().toUpperCase())
      .filter(s => s.length > 0)
      .slice(0, 50)

    if (symbols.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Symbol is required' },
        { status: 400 }
      )
    }

    // Single symbol - return single object
    if (symbols.length === 1) {
      const cached = await prisma.marketStock.findUnique({
        where: { symbol: symbols[0] }
      })

      if (cached) {
        return NextResponse.json({
          success: true,
          data: formatStockData(cached),
          fromCache: true,
          updatedAt: cached.updatedAt
        })
      }

      return NextResponse.json({
        success: false,
        error: 'Saham tidak ditemukan di database. Gunakan tombol refresh untuk mengambil data dari API.'
      }, { status: 404 })
    }

    // Multiple symbols - return array
    const cached = await prisma.marketStock.findMany({
      where: { symbol: { in: symbols } }
    })

    const foundSymbols = cached.map(c => c.symbol)
    const notFound = symbols.filter(s => !foundSymbols.includes(s))

    return NextResponse.json({
      success: true,
      data: cached.map(formatStockData),
      notFound,
      fromCache: true,
      count: cached.length
    })
  } catch (error) {
    console.error('Error searching stock:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to search stock' },
      { status: 500 }
    )
  }
}

// POST - Refresh from API and save to database (supports multiple symbols, max 50)
export async function POST(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const symbolParam = searchParams.get('symbol') || searchParams.get('symbols')

  if (!symbolParam) {
    return NextResponse.json(
      { success: false, error: 'Symbol is required' },
      { status: 400 }
    )
  }

  try {
    // Parse symbols (comma separated, max 50)
    const symbols = symbolParam
      .split(',')
      .map(s => s.trim().toUpperCase())
      .filter(s => s.length > 0)
      .slice(0, 50)

    if (symbols.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Symbol is required' },
        { status: 400 }
      )
    }

    const apiKey = process.env.GOAPI_KEY
    // Use /stock/idx/prices endpoint with symbols query parameter
    const apiUrl = `https://api.goapi.io/stock/idx/prices?symbols=${symbols.join(',')}`

    console.log('Searching stocks:', symbols.join(','))
    console.log('API Key exists:', !!apiKey)

    const response = await fetch(apiUrl, {
      headers: {
        'X-API-KEY': apiKey || '',
        'Accept': 'application/json'
      },
      cache: 'no-store'
    })

    console.log('GoAPI response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('GoAPI error response:', errorText)
      return NextResponse.json(
        { success: false, error: `Stock not found: ${response.status}` },
        { status: 404 }
      )
    }

    const data: GoAPIStockResponse = await response.json()

    if (data.status === 'success' && data.data?.results && data.data.results.length > 0) {
      const savedStocks = []
      const notFound: string[] = []

      // Save all stocks to database
      for (const stockData of data.data.results) {
        const saved = await prisma.marketStock.upsert({
          where: { symbol: stockData.symbol },
          update: {
            companyName: stockData.company?.name || stockData.symbol,
            logo: stockData.company?.logo || null,
            price: stockData.close,
            change: stockData.change,
            changePercent: stockData.change_pct,
            volume: stockData.volume || 0,
            open: stockData.open,
            high: stockData.high,
            low: stockData.low
          },
          create: {
            symbol: stockData.symbol,
            companyName: stockData.company?.name || stockData.symbol,
            logo: stockData.company?.logo || null,
            price: stockData.close,
            change: stockData.change,
            changePercent: stockData.change_pct,
            volume: stockData.volume || 0,
            open: stockData.open,
            high: stockData.high,
            low: stockData.low
          }
        })
        savedStocks.push(formatStockData(saved))
      }

      // Find symbols that were not returned by API
      const foundSymbols = data.data.results.map(s => s.symbol)
      symbols.forEach(s => {
        if (!foundSymbols.includes(s)) {
          notFound.push(s)
        }
      })

      // Single symbol request - return single object for backward compatibility
      if (symbols.length === 1 && savedStocks.length === 1) {
        return NextResponse.json({
          success: true,
          data: savedStocks[0],
          fromCache: false,
          updatedAt: new Date().toISOString()
        })
      }

      // Multiple symbols - return array
      return NextResponse.json({
        success: true,
        data: savedStocks,
        notFound,
        fromCache: false,
        count: savedStocks.length,
        updatedAt: new Date().toISOString()
      })
    }

    return NextResponse.json(
      { success: false, error: 'Saham tidak ditemukan' },
      { status: 404 }
    )
  } catch (error) {
    console.error('Error refreshing stock:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to refresh stock' },
      { status: 500 }
    )
  }
}
