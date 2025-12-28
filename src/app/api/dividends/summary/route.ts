import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// GET dividend summary by month
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const year = searchParams.get('year')

    const where: Record<string, unknown> = {}
    if (year) where.paymentYear = parseInt(year)

    // Get monthly summary
    const dividends = await prisma.dividend.findMany({
      where,
      orderBy: [{ paymentYear: 'desc' }, { paymentMonth: 'desc' }]
    })

    // Group by month
    const monthlySum: Record<string, number> = {}
    const monthNames = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

    dividends.forEach(d => {
      const key = `${d.paymentYear}-${d.paymentMonth}`
      monthlySum[key] = (monthlySum[key] || 0) + Number(d.totalDividend)
    })

    const monthlySummary = Object.entries(monthlySum).map(([key, total]) => {
      const [y, m] = key.split('-').map(Number)
      return {
        year: y,
        month: m,
        monthName: monthNames[m],
        totalDividend: total
      }
    }).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year
      return b.month - a.month
    })

    // Calculate total
    const totalDividend = dividends.reduce((sum, d) => sum + Number(d.totalDividend), 0)

    return NextResponse.json({
      monthlySummary,
      totalDividend,
      year: year ? parseInt(year) : null
    })
  } catch (error) {
    console.error('Error fetching dividend summary:', error)
    return NextResponse.json({ error: 'Failed to fetch dividend summary' }, { status: 500 })
  }
}
