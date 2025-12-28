import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Get all stocks
    const stocks = await prisma.stock.findMany()

    // Get all dividends
    const dividends = await prisma.dividend.findMany()

    // Calculate portfolio summary
    let totalModal = 0
    let totalCurrentValue = 0

    stocks.forEach(stock => {
      const totalShares = stock.lotQuantity * 100
      const buyTotal = Number(stock.buyPrice) * totalShares + Number(stock.brokerFee)
      const currentTotal = stock.currentPrice ? Number(stock.currentPrice) * totalShares : buyTotal

      totalModal += buyTotal
      totalCurrentValue += currentTotal
    })

    const totalProfitLoss = totalCurrentValue - totalModal
    const totalProfitLossPercent = totalModal > 0 ? (totalProfitLoss / totalModal) * 100 : 0

    // Calculate total dividends
    const totalDividend = dividends.reduce((sum, d) => sum + Number(d.totalDividend), 0)

    // Get current year dividends by month
    const currentYear = new Date().getFullYear()
    const currentYearDividends = dividends.filter(d => d.paymentYear === currentYear)

    const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
    const monthlyDividends: Record<number, number> = {}

    currentYearDividends.forEach(d => {
      monthlyDividends[d.paymentMonth] = (monthlyDividends[d.paymentMonth] || 0) + Number(d.totalDividend)
    })

    const dividendByMonth = Object.entries(monthlyDividends).map(([month, total]) => ({
      month: parseInt(month),
      monthName: monthNames[parseInt(month)],
      total
    })).sort((a, b) => a.month - b.month)

    return NextResponse.json({
      portfolio: {
        totalStocks: stocks.length,
        totalModal,
        totalCurrentValue,
        totalProfitLoss,
        totalProfitLossPercent
      },
      dividend: {
        totalAllTime: totalDividend,
        totalCurrentYear: currentYearDividends.reduce((sum, d) => sum + Number(d.totalDividend), 0),
        byMonth: dividendByMonth,
        currentYear
      }
    })
  } catch (error) {
    console.error('Error fetching dashboard:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
  }
}
