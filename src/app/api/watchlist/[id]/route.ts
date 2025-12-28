import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PUT - Update watchlist item
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { targetPrice, notes } = body

    const watchlistItem = await prisma.watchlist.update({
      where: { id: parseInt(id) },
      data: {
        targetPrice: targetPrice ? parseFloat(targetPrice) : null,
        notes: notes || null
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        id: watchlistItem.id,
        symbol: watchlistItem.symbol,
        targetPrice: watchlistItem.targetPrice ? Number(watchlistItem.targetPrice) : null,
        notes: watchlistItem.notes
      }
    })
  } catch (error) {
    console.error('Error updating watchlist:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update watchlist' },
      { status: 500 }
    )
  }
}

// DELETE - Remove from watchlist
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.watchlist.delete({
      where: { id: parseInt(id) }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting from watchlist:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete from watchlist' },
      { status: 500 }
    )
  }
}
