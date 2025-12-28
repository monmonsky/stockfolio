import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// GET single stock
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const stock = await prisma.stock.findUnique({
      where: { id: parseInt(id) },
      include: { dividends: true }
    })

    if (!stock) {
      return NextResponse.json({ error: 'Stock not found' }, { status: 404 })
    }

    return NextResponse.json(stock)
  } catch (error) {
    console.error('Error fetching stock:', error)
    return NextResponse.json({ error: 'Failed to fetch stock' }, { status: 500 })
  }
}

// PUT update stock
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { stockCode, stockName, lotQuantity, buyPrice, buyDate, brokerFee, currentPrice } = body

    const stock = await prisma.stock.update({
      where: { id: parseInt(id) },
      data: {
        stockCode: stockCode?.toUpperCase(),
        stockName,
        lotQuantity: lotQuantity ? parseInt(lotQuantity) : undefined,
        buyPrice: buyPrice ? parseFloat(buyPrice) : undefined,
        buyDate: buyDate ? new Date(buyDate) : undefined,
        brokerFee: brokerFee !== undefined ? parseFloat(brokerFee) : undefined,
        currentPrice: currentPrice !== undefined ? (currentPrice ? parseFloat(currentPrice) : null) : undefined
      }
    })

    return NextResponse.json(stock)
  } catch (error) {
    console.error('Error updating stock:', error)
    return NextResponse.json({ error: 'Failed to update stock' }, { status: 500 })
  }
}

// DELETE stock
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.stock.delete({
      where: { id: parseInt(id) }
    })

    return NextResponse.json({ message: 'Stock deleted successfully' })
  } catch (error) {
    console.error('Error deleting stock:', error)
    return NextResponse.json({ error: 'Failed to delete stock' }, { status: 500 })
  }
}
