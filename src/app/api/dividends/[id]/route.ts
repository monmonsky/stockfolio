import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// GET single dividend
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const dividend = await prisma.dividend.findUnique({
      where: { id: parseInt(id) },
      include: { stock: true }
    })

    if (!dividend) {
      return NextResponse.json({ error: 'Dividend not found' }, { status: 404 })
    }

    return NextResponse.json({
      ...dividend,
      dividendPerShare: Number(dividend.dividendPerShare),
      totalDividend: Number(dividend.totalDividend)
    })
  } catch (error) {
    console.error('Error fetching dividend:', error)
    return NextResponse.json({ error: 'Failed to fetch dividend' }, { status: 500 })
  }
}

// PUT update dividend
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { stockId, stockCode, dividendPerShare, totalShares, cumDate, paymentDate, paymentMonth, paymentYear } = body

    const updateData: Record<string, unknown> = {}
    if (stockId !== undefined) updateData.stockId = stockId ? parseInt(stockId) : null
    if (stockCode) updateData.stockCode = stockCode.toUpperCase()
    if (dividendPerShare) updateData.dividendPerShare = parseFloat(dividendPerShare)
    if (totalShares) updateData.totalShares = parseInt(totalShares)
    if (cumDate !== undefined) updateData.cumDate = cumDate ? new Date(cumDate) : null
    if (paymentDate !== undefined) updateData.paymentDate = paymentDate ? new Date(paymentDate) : null
    if (paymentMonth) updateData.paymentMonth = parseInt(paymentMonth)
    if (paymentYear) updateData.paymentYear = parseInt(paymentYear)

    // Recalculate total if both values provided
    if (dividendPerShare && totalShares) {
      updateData.totalDividend = parseFloat(dividendPerShare) * parseInt(totalShares)
    }

    const dividend = await prisma.dividend.update({
      where: { id: parseInt(id) },
      data: updateData
    })

    return NextResponse.json({
      ...dividend,
      dividendPerShare: Number(dividend.dividendPerShare),
      totalDividend: Number(dividend.totalDividend)
    })
  } catch (error) {
    console.error('Error updating dividend:', error)
    return NextResponse.json({ error: 'Failed to update dividend' }, { status: 500 })
  }
}

// DELETE dividend
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.dividend.delete({
      where: { id: parseInt(id) }
    })

    return NextResponse.json({ message: 'Dividend deleted successfully' })
  } catch (error) {
    console.error('Error deleting dividend:', error)
    return NextResponse.json({ error: 'Failed to delete dividend' }, { status: 500 })
  }
}
