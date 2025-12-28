import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Export transactions as CSV
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const year = searchParams.get('year')

    const where: Record<string, unknown> = {}

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

    // Create CSV content
    const headers = [
      'Tanggal',
      'Kode Saham',
      'Nama Emiten',
      'Tipe',
      'Lot',
      'Lembar',
      'Harga per Lembar',
      'Total',
      'Biaya Broker',
      'Catatan'
    ]

    const rows = transactions.map(t => [
      new Date(t.transactionDate).toLocaleDateString('id-ID'),
      t.stockCode,
      t.stockName || '',
      t.type === 'BUY' ? 'Beli' : 'Jual',
      t.lotQuantity.toString(),
      (t.lotQuantity * 100).toString(),
      Number(t.pricePerShare).toLocaleString('id-ID'),
      Number(t.totalAmount).toLocaleString('id-ID'),
      Number(t.brokerFee).toLocaleString('id-ID'),
      t.notes || ''
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const filename = year
      ? `transaksi-${year}.csv`
      : `transaksi-semua.csv`

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })
  } catch (error) {
    console.error('Error exporting transactions:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to export transactions' },
      { status: 500 }
    )
  }
}
