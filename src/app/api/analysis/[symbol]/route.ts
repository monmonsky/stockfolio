import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Get stock analysis data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params
    const upperSymbol = symbol.toUpperCase()

    // Get from MarketStock cache
    const marketStock = await prisma.marketStock.findUnique({
      where: { symbol: upperSymbol }
    })

    // Get portfolio holdings for this stock
    const holdings = await prisma.stock.findMany({
      where: { stockCode: upperSymbol }
    })

    // Get dividends history
    const dividends = await prisma.dividend.findMany({
      where: { stockCode: upperSymbol },
      orderBy: { paymentYear: 'desc' }
    })

    // Calculate portfolio stats
    const portfolioStats = holdings.length > 0 ? {
      totalLots: holdings.reduce((sum, h) => sum + h.lotQuantity, 0),
      totalShares: holdings.reduce((sum, h) => sum + h.lotQuantity * 100, 0),
      avgBuyPrice: holdings.reduce((sum, h) => sum + Number(h.buyPrice) * h.lotQuantity, 0) /
                   holdings.reduce((sum, h) => sum + h.lotQuantity, 0),
      totalInvestment: holdings.reduce((sum, h) => sum + Number(h.buyPrice) * h.lotQuantity * 100 + Number(h.brokerFee), 0),
      currentValue: marketStock ? holdings.reduce((sum, h) => sum + Number(marketStock.price) * h.lotQuantity * 100, 0) : null,
      firstBuyDate: holdings.reduce((oldest, h) =>
        !oldest || new Date(h.buyDate) < new Date(oldest) ? h.buyDate.toISOString() : oldest,
        '' as string
      )
    } : null

    // Calculate dividend stats
    const dividendStats = dividends.length > 0 ? {
      totalReceived: dividends.reduce((sum, d) => sum + Number(d.totalDividend), 0),
      lastDividend: dividends[0] ? {
        amount: Number(dividends[0].dividendPerShare),
        date: dividends[0].paymentDate,
        year: dividends[0].paymentYear
      } : null,
      dividendCount: dividends.length,
      yearlyDividends: Object.entries(
        dividends.reduce((acc, d) => {
          const year = d.paymentYear
          acc[year] = (acc[year] || 0) + Number(d.totalDividend)
          return acc
        }, {} as Record<number, number>)
      ).map(([year, total]) => ({ year: parseInt(year), total }))
    } : null

    // Calculate P/L if we have both
    let profitLoss = null
    let profitLossPercent = null
    if (portfolioStats?.totalInvestment && portfolioStats?.currentValue) {
      profitLoss = portfolioStats.currentValue - portfolioStats.totalInvestment
      profitLossPercent = (profitLoss / portfolioStats.totalInvestment) * 100
    }

    return NextResponse.json({
      success: true,
      data: {
        symbol: upperSymbol,
        companyName: marketStock?.companyName || null,
        logo: marketStock?.logo || null,
        price: marketStock ? Number(marketStock.price) : null,
        change: marketStock ? Number(marketStock.change) : null,
        changePercent: marketStock ? Number(marketStock.changePercent) : null,
        volume: marketStock ? Number(marketStock.volume) : null,
        open: marketStock?.open ? Number(marketStock.open) : null,
        high: marketStock?.high ? Number(marketStock.high) : null,
        low: marketStock?.low ? Number(marketStock.low) : null,
        updatedAt: marketStock?.updatedAt || null,
        portfolio: portfolioStats ? {
          ...portfolioStats,
          profitLoss,
          profitLossPercent
        } : null,
        dividends: dividendStats,
        inWatchlist: await prisma.watchlist.findUnique({ where: { symbol: upperSymbol } }) !== null,
        inPortfolio: holdings.length > 0
      }
    })
  } catch (error) {
    console.error('Error fetching stock analysis:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stock analysis' },
      { status: 500 }
    )
  }
}
