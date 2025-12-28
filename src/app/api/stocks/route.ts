import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// GET all stocks
export async function GET() {
  try {
    const stocks = await prisma.stock.findMany({
      orderBy: { createdAt: 'desc' },
      include: { dividends: true }
    })

    // Calculate profit/loss for each stock
    const stocksWithPL = stocks.map(stock => {
      const totalShares = stock.lotQuantity * 100
      const buyTotal = Number(stock.buyPrice) * totalShares + Number(stock.brokerFee)
      const currentTotal = stock.currentPrice ? Number(stock.currentPrice) * totalShares : 0
      const profitLoss = currentTotal - buyTotal
      const profitLossPercent = buyTotal > 0 ? (profitLoss / buyTotal) * 100 : 0

      return {
        ...stock,
        buyPrice: Number(stock.buyPrice),
        brokerFee: Number(stock.brokerFee),
        currentPrice: stock.currentPrice ? Number(stock.currentPrice) : null,
        totalShares,
        buyTotal,
        currentTotal,
        profitLoss,
        profitLossPercent
      }
    })

    return NextResponse.json(stocksWithPL)
  } catch (error) {
    console.error('Error fetching stocks:', error)
    return NextResponse.json({ error: 'Failed to fetch stocks' }, { status: 500 })
  }
}

// POST create new stock
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { stockCode, stockName, lotQuantity, buyPrice, buyDate, brokerFee, currentPrice } = body

    const stock = await prisma.stock.create({
      data: {
        stockCode: stockCode.toUpperCase(),
        stockName,
        lotQuantity: parseInt(lotQuantity),
        buyPrice: parseFloat(buyPrice),
        buyDate: new Date(buyDate),
        brokerFee: brokerFee ? parseFloat(brokerFee) : 0,
        currentPrice: currentPrice ? parseFloat(currentPrice) : null
      }
    })

    return NextResponse.json(stock, { status: 201 })
  } catch (error) {
    console.error('Error creating stock:', error)
    return NextResponse.json({ error: 'Failed to create stock' }, { status: 500 })
  }
}
