import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// GET all dividends with optional filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const year = searchParams.get('year')
    const month = searchParams.get('month')
    const stockCode = searchParams.get('stockCode')

    const where: Record<string, unknown> = {}
    if (year) where.paymentYear = parseInt(year)
    if (month) where.paymentMonth = parseInt(month)
    if (stockCode) where.stockCode = stockCode.toUpperCase()

    const dividends = await prisma.dividend.findMany({
      where,
      orderBy: [{ paymentYear: 'desc' }, { paymentMonth: 'desc' }],
      include: { stock: true }
    })

    // Convert Decimal to number
    const dividendsFormatted = dividends.map(d => ({
      ...d,
      dividendPerShare: Number(d.dividendPerShare),
      totalDividend: Number(d.totalDividend)
    }))

    return NextResponse.json(dividendsFormatted)
  } catch (error) {
    console.error('Error fetching dividends:', error)
    return NextResponse.json({ error: 'Failed to fetch dividends' }, { status: 500 })
  }
}

// POST create new dividend
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { stockId, stockCode, dividendPerShare, totalShares, cumDate, paymentDate, paymentMonth, paymentYear } = body

    const totalDividend = parseFloat(dividendPerShare) * parseInt(totalShares)

    const dividend = await prisma.dividend.create({
      data: {
        stockId: stockId ? parseInt(stockId) : null,
        stockCode: stockCode.toUpperCase(),
        dividendPerShare: parseFloat(dividendPerShare),
        totalShares: parseInt(totalShares),
        totalDividend,
        cumDate: cumDate ? new Date(cumDate) : null,
        paymentDate: paymentDate ? new Date(paymentDate) : null,
        paymentMonth: parseInt(paymentMonth),
        paymentYear: parseInt(paymentYear)
      }
    })

    return NextResponse.json(dividend, { status: 201 })
  } catch (error) {
    console.error('Error creating dividend:', error)
    return NextResponse.json({ error: 'Failed to create dividend' }, { status: 500 })
  }
}
