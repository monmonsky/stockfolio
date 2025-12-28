import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

interface GoAPIStockData {
  symbol: string
  company?: {
    symbol: string
    name: string
    logo: string
  }
  close: number
  change: number
  change_pct: number
  volume: number
  open: number
  high: number
  low: number
}

interface GoAPIResponse {
  status: string
  message: string
  data: {
    results: GoAPIStockData[]
  }
}

// Fetch multiple stock prices at once (max 50 per request)
async function fetchStockPrices(stockCodes: string[]): Promise<Record<string, GoAPIStockData>> {
  const priceMap: Record<string, GoAPIStockData> = {}

  try {
    const apiKey = process.env.GOAPI_KEY
    const symbols = stockCodes.join(',')

    const response = await fetch(
      `https://api.goapi.io/stock/idx/prices?symbols=${symbols}`,
      {
        headers: {
          'X-API-KEY': apiKey || '',
          'Accept': 'application/json'
        },
        cache: 'no-store'
      }
    )

    if (!response.ok) {
      console.error(`Failed to fetch prices: ${response.status}`)
      return priceMap
    }

    const data: GoAPIResponse = await response.json()

    if (data.status === 'success' && data.data?.results) {
      for (const stock of data.data.results) {
        priceMap[stock.symbol] = stock
      }
    }
  } catch (error) {
    console.error('Error fetching prices:', error)
  }

  return priceMap
}

export async function POST() {
  try {
    // Get all unique stock codes from portfolio
    const stocks = await prisma.stock.findMany({
      select: { id: true, stockCode: true }
    })

    const uniqueCodes = [...new Set(stocks.map(s => s.stockCode))]
    const errors: string[] = []

    // Fetch all prices in one request (API supports max 50)
    const priceMap = await fetchStockPrices(uniqueCodes)

    // Update portfolio stocks with new prices
    const updates = await Promise.all(
      stocks.map(async (stock) => {
        const stockData = priceMap[stock.stockCode]
        if (stockData?.close !== undefined) {
          return prisma.stock.update({
            where: { id: stock.id },
            data: { currentPrice: stockData.close }
          })
        } else {
          errors.push(stock.stockCode)
        }
        return null
      })
    )

    // Also update MarketStock table for caching
    for (const [symbol, stockData] of Object.entries(priceMap)) {
      try {
        await prisma.marketStock.upsert({
          where: { symbol },
          update: {
            companyName: stockData.company?.name || symbol,
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
            symbol,
            companyName: stockData.company?.name || symbol,
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
      } catch {
        // Skip if upsert fails
      }
    }

    const updatedCount = updates.filter(u => u !== null).length

    return NextResponse.json({
      success: true,
      message: `Updated ${updatedCount} stocks`,
      updated: updatedCount,
      failed: errors,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error refreshing prices:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to refresh prices' },
      { status: 500 }
    )
  }
}
