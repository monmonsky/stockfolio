import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface GoAPITrendingStock {
  symbol?: string
  ticker?: string
  company_name?: string
  name?: string
  close?: number
  price?: number
  change?: number
  percent?: number
  change_percent?: number
  volume?: number
  val?: number
  company?: {
    symbol?: string
    name?: string
    logo?: string
  }
}

interface GoAPITrendingResponse {
  status: string
  data: {
    results?: GoAPITrendingStock[]
  } | GoAPITrendingStock[]
}

// GET - Read from database
export async function GET() {
  try {
    const [gainers, losers, mostActive] = await Promise.all([
      prisma.trendingStock.findMany({
        where: { category: 'gainer' },
        orderBy: { rank: 'asc' },
        take: 10
      }),
      prisma.trendingStock.findMany({
        where: { category: 'loser' },
        orderBy: { rank: 'asc' },
        take: 10
      }),
      prisma.trendingStock.findMany({
        where: { category: 'active' },
        orderBy: { rank: 'asc' },
        take: 10
      })
    ])

    const formatStocks = (stocks: typeof gainers) =>
      stocks.map(stock => ({
        symbol: stock.symbol,
        companyName: stock.companyName,
        logo: stock.logo,
        price: Number(stock.price),
        change: Number(stock.change),
        changePercent: Number(stock.changePercent),
        volume: Number(stock.volume)
      }))

    // Get latest update time
    const latestUpdate = [...gainers, ...losers, ...mostActive]
      .map(s => s.updatedAt)
      .sort((a, b) => b.getTime() - a.getTime())[0]

    return NextResponse.json({
      success: true,
      data: {
        gainers: formatStocks(gainers),
        losers: formatStocks(losers),
        mostActive: formatStocks(mostActive)
      },
      fromCache: true,
      updatedAt: latestUpdate || null
    })
  } catch (error) {
    console.error('Error fetching trending stocks:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch trending stocks' },
      { status: 500 }
    )
  }
}

// POST - Refresh from API and save to database
export async function POST() {
  try {
    const apiKey = process.env.GOAPI_KEY

    // Fetch all trending data from API
    const [gainersResponse, losersResponse, activeResponse] = await Promise.all([
      fetch('https://api.goapi.io/stock/idx/top_gainer', {
        headers: { 'X-API-KEY': apiKey || '', 'Accept': 'application/json' },
        cache: 'no-store'
      }),
      fetch('https://api.goapi.io/stock/idx/top_loser', {
        headers: { 'X-API-KEY': apiKey || '', 'Accept': 'application/json' },
        cache: 'no-store'
      }),
      fetch('https://api.goapi.io/stock/idx/most_active', {
        headers: { 'X-API-KEY': apiKey || '', 'Accept': 'application/json' },
        cache: 'no-store'
      })
    ])

    const [gainersData, losersData, activeData] = await Promise.all([
      gainersResponse.ok ? gainersResponse.json() : { status: 'error', data: [] },
      losersResponse.ok ? losersResponse.json() : { status: 'error', data: [] },
      activeResponse.ok ? activeResponse.json() : { status: 'error', data: [] }
    ]) as [GoAPITrendingResponse, GoAPITrendingResponse, GoAPITrendingResponse]

    // Log the response structure for debugging
    console.log('Gainers data structure:', JSON.stringify(gainersData).substring(0, 500))

    // Helper to extract stocks array from various response formats
    const extractStocks = (response: GoAPITrendingResponse): GoAPITrendingStock[] => {
      if (Array.isArray(response.data)) {
        return response.data
      }
      if (response.data?.results && Array.isArray(response.data.results)) {
        return response.data.results
      }
      return []
    }

    // Clear old data first (wait for completion)
    await prisma.trendingStock.deleteMany({})

    const saveStocks = async (stocks: GoAPITrendingStock[], category: string) => {
      const data = (stocks || []).slice(0, 10).map((stock, index) => ({
        symbol: stock.symbol || stock.ticker || 'N/A',
        companyName: stock.company?.name || stock.company_name || stock.name || null,
        logo: stock.company?.logo || null,
        price: stock.close || stock.price || 0,
        change: stock.change || 0,
        changePercent: stock.percent || stock.change_percent || 0,
        volume: BigInt(stock.volume || stock.val || 0),
        category,
        rank: index + 1
      }))

      console.log(`Saving ${data.length} stocks for category: ${category}`)

      if (data.length > 0) {
        await prisma.trendingStock.createMany({ data })
        console.log(`Saved ${data.length} stocks for category: ${category}`)
      }
    }

    // Save stocks sequentially to avoid race conditions
    await saveStocks(extractStocks(gainersData), 'gainer')
    await saveStocks(extractStocks(losersData), 'loser')
    await saveStocks(extractStocks(activeData), 'active')

    // Fetch updated data from database
    const [gainers, losers, mostActive] = await Promise.all([
      prisma.trendingStock.findMany({
        where: { category: 'gainer' },
        orderBy: { rank: 'asc' }
      }),
      prisma.trendingStock.findMany({
        where: { category: 'loser' },
        orderBy: { rank: 'asc' }
      }),
      prisma.trendingStock.findMany({
        where: { category: 'active' },
        orderBy: { rank: 'asc' }
      })
    ])

    const formatStocks = (stocks: typeof gainers) =>
      stocks.map(stock => ({
        symbol: stock.symbol,
        companyName: stock.companyName,
        logo: stock.logo,
        price: Number(stock.price),
        change: Number(stock.change),
        changePercent: Number(stock.changePercent),
        volume: Number(stock.volume)
      }))

    return NextResponse.json({
      success: true,
      data: {
        gainers: formatStocks(gainers),
        losers: formatStocks(losers),
        mostActive: formatStocks(mostActive)
      },
      fromCache: false,
      updatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error refreshing trending stocks:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to refresh trending stocks' },
      { status: 500 }
    )
  }
}
