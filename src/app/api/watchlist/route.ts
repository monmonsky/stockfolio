import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Fetch all watchlist items with current prices
export async function GET() {
  try {
    const watchlist = await prisma.watchlist.findMany({
      orderBy: { createdAt: 'desc' }
    })

    // Get current prices from MarketStock
    const symbols = watchlist.map(w => w.symbol)
    const marketStocks = await prisma.marketStock.findMany({
      where: { symbol: { in: symbols } }
    })

    const priceMap = new Map(marketStocks.map(m => [m.symbol, m]))

    const data = watchlist.map(item => {
      const market = priceMap.get(item.symbol)
      return {
        id: item.id,
        symbol: item.symbol,
        companyName: item.companyName || market?.companyName || null,
        logo: item.logo || market?.logo || null,
        targetPrice: item.targetPrice ? Number(item.targetPrice) : null,
        notes: item.notes,
        currentPrice: market ? Number(market.price) : null,
        change: market ? Number(market.change) : null,
        changePercent: market ? Number(market.changePercent) : null,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }
    })

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error fetching watchlist:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch watchlist' },
      { status: 500 }
    )
  }
}

// POST - Add stock to watchlist
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { symbol, targetPrice, notes } = body

    if (!symbol) {
      return NextResponse.json(
        { success: false, error: 'Symbol is required' },
        { status: 400 }
      )
    }

    // Check if already in watchlist
    const existing = await prisma.watchlist.findUnique({
      where: { symbol: symbol.toUpperCase() }
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Saham sudah ada di watchlist' },
        { status: 400 }
      )
    }

    // Get stock info from MarketStock if available
    const marketStock = await prisma.marketStock.findUnique({
      where: { symbol: symbol.toUpperCase() }
    })

    const watchlistItem = await prisma.watchlist.create({
      data: {
        symbol: symbol.toUpperCase(),
        companyName: marketStock?.companyName || null,
        logo: marketStock?.logo || null,
        targetPrice: targetPrice ? parseFloat(targetPrice) : null,
        notes: notes || null
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        id: watchlistItem.id,
        symbol: watchlistItem.symbol,
        companyName: watchlistItem.companyName,
        logo: watchlistItem.logo,
        targetPrice: watchlistItem.targetPrice ? Number(watchlistItem.targetPrice) : null,
        notes: watchlistItem.notes,
        currentPrice: marketStock ? Number(marketStock.price) : null,
        change: marketStock ? Number(marketStock.change) : null,
        changePercent: marketStock ? Number(marketStock.changePercent) : null
      }
    })
  } catch (error) {
    console.error('Error adding to watchlist:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to add to watchlist' },
      { status: 500 }
    )
  }
}
