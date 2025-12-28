import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Fetch all transactions with filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const stockCode = searchParams.get('stockCode')
    const type = searchParams.get('type')
    const year = searchParams.get('year')

    const where: Record<string, unknown> = {}

    if (stockCode) {
      where.stockCode = stockCode.toUpperCase()
    }

    if (type && (type === 'BUY' || type === 'SELL')) {
      where.type = type
    }

    if (year) {
      const yearNum = parseInt(year)
      where.transactionDate = {
        gte: new Date(`${yearNum}-01-01`),
        lt: new Date(`${yearNum + 1}-01-01`)
      }
    }

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { transactionDate: 'desc' }
    })

    const data = transactions.map(t => ({
      id: t.id,
      stockCode: t.stockCode,
      stockName: t.stockName,
      type: t.type,
      lotQuantity: t.lotQuantity,
      pricePerShare: Number(t.pricePerShare),
      totalAmount: Number(t.totalAmount),
      brokerFee: Number(t.brokerFee),
      transactionDate: t.transactionDate,
      notes: t.notes,
      createdAt: t.createdAt
    }))

    // Get summary stats
    const buyTotal = data
      .filter(t => t.type === 'BUY')
      .reduce((sum, t) => sum + t.totalAmount + t.brokerFee, 0)

    const sellTotal = data
      .filter(t => t.type === 'SELL')
      .reduce((sum, t) => sum + t.totalAmount - t.brokerFee, 0)

    return NextResponse.json({
      success: true,
      data,
      summary: {
        totalBuy: buyTotal,
        totalSell: sellTotal,
        netFlow: sellTotal - buyTotal,
        transactionCount: data.length
      }
    })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}

// POST - Add new transaction
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      stockCode,
      stockName,
      type,
      lotQuantity,
      pricePerShare,
      brokerFee,
      transactionDate,
      notes
    } = body

    if (!stockCode || !type || !lotQuantity || !pricePerShare || !transactionDate) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const totalShares = parseInt(lotQuantity) * 100
    const totalAmount = totalShares * parseFloat(pricePerShare)

    const transaction = await prisma.transaction.create({
      data: {
        stockCode: stockCode.toUpperCase(),
        stockName: stockName || null,
        type: type.toUpperCase(),
        lotQuantity: parseInt(lotQuantity),
        pricePerShare: parseFloat(pricePerShare),
        totalAmount,
        brokerFee: brokerFee ? parseFloat(brokerFee) : 0,
        transactionDate: new Date(transactionDate),
        notes: notes || null
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        id: transaction.id,
        stockCode: transaction.stockCode,
        stockName: transaction.stockName,
        type: transaction.type,
        lotQuantity: transaction.lotQuantity,
        pricePerShare: Number(transaction.pricePerShare),
        totalAmount: Number(transaction.totalAmount),
        brokerFee: Number(transaction.brokerFee),
        transactionDate: transaction.transactionDate,
        notes: transaction.notes
      }
    })
  } catch (error) {
    console.error('Error creating transaction:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create transaction' },
      { status: 500 }
    )
  }
}
