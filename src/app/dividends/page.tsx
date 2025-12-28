'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatRupiah, monthNames } from '@/lib/utils'
import Modal from '@/components/Modal'
import Input, { Select } from '@/components/Input'
import Button from '@/components/Button'
import { useLoading } from '@/components/LoadingBar'

interface Dividend {
  id: number
  stockCode: string
  dividendPerShare: number
  totalShares: number
  totalDividend: number
  cumDate: string | null
  paymentDate: string | null
  paymentMonth: number
  paymentYear: number
}

interface Stock {
  id: number
  stockCode: string
  stockName: string | null
  lotQuantity: number
}

interface MonthlySummary {
  year: number
  month: number
  monthName: string
  totalDividend: number
}

export default function DividendsPage() {
  const [dividends, setDividends] = useState<Dividend[]>([])
  const [stocks, setStocks] = useState<Stock[]>([])
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [filterYear, setFilterYear] = useState(new Date().getFullYear())
  const [formData, setFormData] = useState({
    stockId: '',
    stockCode: '',
    dividendPerShare: '',
    totalShares: '',
    cumDate: '',
    paymentDate: '',
    paymentMonth: '',
    paymentYear: new Date().getFullYear().toString()
  })

  const { startLoading, stopLoading } = useLoading()

  const fetchData = async () => {
    startLoading()
    try {
      const [dividendsRes, stocksRes, summaryRes] = await Promise.all([
        fetch(`/api/dividends?year=${filterYear}`),
        fetch('/api/stocks'),
        fetch(`/api/dividends/summary?year=${filterYear}`)
      ])

      const [dividendsData, stocksData, summaryData] = await Promise.all([
        dividendsRes.json(),
        stocksRes.json(),
        summaryRes.json()
      ])

      setDividends(dividendsData)
      setStocks(stocksData)
      setMonthlySummary(summaryData.monthlySummary || [])
    } finally {
      setLoading(false)
      stopLoading()
    }
  }

  useEffect(() => {
    fetchData()
  }, [filterYear])

  const resetForm = () => {
    setFormData({
      stockId: '',
      stockCode: '',
      dividendPerShare: '',
      totalShares: '',
      cumDate: '',
      paymentDate: '',
      paymentMonth: '',
      paymentYear: new Date().getFullYear().toString()
    })
  }

  const handleStockSelect = (stockId: string) => {
    const stock = stocks.find(s => s.id === parseInt(stockId))
    if (stock) {
      setFormData({
        ...formData,
        stockId,
        stockCode: stock.stockCode,
        totalShares: (stock.lotQuantity * 100).toString()
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    await fetch('/api/dividends', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })

    setSaving(false)
    setShowForm(false)
    resetForm()
    fetchData()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus data dividen ini?')) return
    await fetch(`/api/dividends/${id}`, { method: 'DELETE' })
    fetchData()
  }

  const handleClose = () => {
    setShowForm(false)
    resetForm()
  }

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dividen</h1>
        <div className="flex gap-3">
          <select
            value={filterYear}
            onChange={e => setFilterYear(parseInt(e.target.value))}
            className="px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <Link
            href="/dividend-performance"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-teal-600 transition-all shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Performa
          </Link>
          <Button onClick={() => setShowForm(true)}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tambah Dividen
          </Button>
        </div>
      </div>

      {/* Monthly Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-colors">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Ringkasan Per Bulan ({filterYear})</h2>
        {monthlySummary.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">Belum ada data dividen untuk tahun {filterYear}</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {monthlySummary.map(item => (
              <div key={`${item.year}-${item.month}`} className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-xl p-4 text-center border border-emerald-100 dark:border-emerald-800">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{item.monthName}</div>
                <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatRupiah(item.totalDividend)}</div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400 font-medium">Total Dividen {filterYear}</span>
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatRupiah(monthlySummary.reduce((sum, m) => sum + m.totalDividend, 0))}
            </span>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      <Modal isOpen={showForm} onClose={handleClose} title="Tambah Dividen">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Select
            label="Pilih Saham"
            value={formData.stockId}
            onChange={e => handleStockSelect(e.target.value)}
            required
          >
            <option value="">-- Pilih Saham --</option>
            {stocks.map(stock => (
              <option key={stock.id} value={stock.id}>
                {stock.stockCode} - {stock.stockName || 'N/A'}
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Dividen/Lembar"
              type="number"
              step="0.01"
              value={formData.dividendPerShare}
              onChange={e => setFormData({ ...formData, dividendPerShare: e.target.value })}
              placeholder="250"
              required
            />
            <Input
              label="Jumlah Lembar"
              type="number"
              value={formData.totalShares}
              onChange={e => setFormData({ ...formData, totalShares: e.target.value })}
              placeholder="1000"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Cum Date"
              type="date"
              value={formData.cumDate}
              onChange={e => setFormData({ ...formData, cumDate: e.target.value })}
            />
            <Input
              label="Payment Date"
              type="date"
              value={formData.paymentDate}
              onChange={e => setFormData({ ...formData, paymentDate: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Bulan Terima"
              value={formData.paymentMonth}
              onChange={e => setFormData({ ...formData, paymentMonth: e.target.value })}
              required
            >
              <option value="">-- Pilih Bulan --</option>
              {monthNames.slice(1).map((name, i) => (
                <option key={i + 1} value={i + 1}>{name}</option>
              ))}
            </Select>
            <Input
              label="Tahun Terima"
              type="number"
              value={formData.paymentYear}
              onChange={e => setFormData({ ...formData, paymentYear: e.target.value })}
              required
            />
          </div>

          {/* Preview Total */}
          {formData.dividendPerShare && formData.totalShares && (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-xl p-4 border border-emerald-100 dark:border-emerald-800">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Dividen yang Diterima</div>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatRupiah(parseFloat(formData.dividendPerShare) * parseInt(formData.totalShares))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={handleClose} className="flex-1">
              Batal
            </Button>
            <Button type="submit" loading={saving} className="flex-1">
              {saving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Dividends Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-gray-900/50">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Kode</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Div/Lembar</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Jml Lembar</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Bulan Terima</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
              {dividends.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-gray-500 dark:text-gray-400">Belum ada data dividen untuk tahun {filterYear}</p>
                      <Button onClick={() => setShowForm(true)} variant="secondary">
                        Tambah Dividen Pertama
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                dividends.map(div => (
                  <tr key={div.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{div.stockCode}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900 dark:text-gray-100">
                      {formatRupiah(div.dividendPerShare)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900 dark:text-gray-100">
                      {div.totalShares.toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatRupiah(div.totalDividend)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                        {monthNames[div.paymentMonth]} {div.paymentYear}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleDelete(div.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        title="Hapus"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
