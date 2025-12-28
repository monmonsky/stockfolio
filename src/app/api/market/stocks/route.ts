import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Get all market stocks for dropdown
export async function GET() {
  try {
    const stocks = await prisma.marketStock.findMany({
      select: {
        symbol: true,
        companyName: true,
        price: true
      },
      orderBy: { symbol: 'asc' }
    })

    return NextResponse.json({
      success: true,
      data: stocks.map(s => ({
        symbol: s.symbol,
        companyName: s.companyName,
        price: Number(s.price)
      }))
    })
  } catch (error) {
    console.error('Error fetching market stocks:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch market stocks' },
      { status: 500 }
    )
  }
}
