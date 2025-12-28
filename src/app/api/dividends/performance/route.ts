import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get all dividends
    const dividends = await prisma.dividend.findMany({
      orderBy: [
        { paymentYear: 'desc' },
        { paymentMonth: 'desc' }
      ]
    })

    // Get all stocks for investment calculation
    const stocks = await prisma.stock.findMany()

    // Calculate total investment
    const totalInvestment = stocks.reduce((sum, s) => {
      return sum + (Number(s.buyPrice) * s.lotQuantity * 100) + Number(s.brokerFee)
    }, 0)

    // Group dividends by year
    const byYear: Record<number, { total: number; count: number; stocks: Set<string> }> = {}
    dividends.forEach(d => {
      if (!byYear[d.paymentYear]) {
        byYear[d.paymentYear] = { total: 0, count: 0, stocks: new Set() }
      }
      byYear[d.paymentYear].total += Number(d.totalDividend)
      byYear[d.paymentYear].count += 1
      byYear[d.paymentYear].stocks.add(d.stockCode)
    })

    const yearlyPerformance = Object.entries(byYear)
      .map(([year, data]) => ({
        year: parseInt(year),
        totalDividend: data.total,
        dividendCount: data.count,
        stockCount: data.stocks.size,
        yield: totalInvestment > 0 ? (data.total / totalInvestment) * 100 : 0
      }))
      .sort((a, b) => b.year - a.year)

    // Group by stock
    const byStock: Record<string, { total: number; count: number; years: Set<number> }> = {}
    dividends.forEach(d => {
      if (!byStock[d.stockCode]) {
        byStock[d.stockCode] = { total: 0, count: 0, years: new Set() }
      }
      byStock[d.stockCode].total += Number(d.totalDividend)
      byStock[d.stockCode].count += 1
      byStock[d.stockCode].years.add(d.paymentYear)
    })

    const stockPerformance = Object.entries(byStock)
      .map(([stockCode, data]) => {
        // Find stock investment
        const stockHoldings = stocks.filter(s => s.stockCode === stockCode)
        const stockInvestment = stockHoldings.reduce((sum, s) => {
          return sum + (Number(s.buyPrice) * s.lotQuantity * 100) + Number(s.brokerFee)
        }, 0)

        return {
          stockCode,
          totalDividend: data.total,
          dividendCount: data.count,
          yearsReceived: data.years.size,
          investment: stockInvestment,
          yield: stockInvestment > 0 ? (data.total / stockInvestment) * 100 : 0
        }
      })
      .sort((a, b) => b.totalDividend - a.totalDividend)

    // Calculate projections (based on last year average)
    const currentYear = new Date().getFullYear()
    const lastYearData = byYear[currentYear - 1]
    const projection = lastYearData ? {
      estimatedYearly: lastYearData.total,
      estimatedMonthly: lastYearData.total / 12,
      basedOnYear: currentYear - 1
    } : null

    // Overall stats
    const totalDividends = dividends.reduce((sum, d) => sum + Number(d.totalDividend), 0)
    const uniqueStocks = new Set(dividends.map(d => d.stockCode)).size
    const yearsActive = new Set(dividends.map(d => d.paymentYear)).size

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalDividends,
          totalInvestment,
          overallYield: totalInvestment > 0 ? (totalDividends / totalInvestment) * 100 : 0,
          totalDividendCount: dividends.length,
          uniqueStocks,
          yearsActive,
          averagePerDividend: dividends.length > 0 ? totalDividends / dividends.length : 0
        },
        yearlyPerformance,
        stockPerformance,
        projection
      }
    })
  } catch (error) {
    console.error('Error fetching dividend performance:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dividend performance' },
      { status: 500 }
    )
  }
}
