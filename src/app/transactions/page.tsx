'use client'

import { useEffect, useState } from 'react'
import { formatRupiah } from '@/lib/utils'
import Modal from '@/components/Modal'
import Input from '@/components/Input'
import Button from '@/components/Button'
import { useLoading } from '@/components/LoadingBar'

interface Transaction {
  id: number
  stockCode: string
  stockName: string | null
  type: 'BUY' | 'SELL'
  lotQuantity: number
  pricePerShare: number
  totalAmount: number
  brokerFee: number
  transactionDate: string
  notes: string | null
}

interface Summary {
  totalBuy: number
  totalSell: number
  netFlow: number
  transactionCount: number
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [filterType, setFilterType] = useState<string>('')
  const [filterYear, setFilterYear] = useState<string>('')
  const [formData, setFormData] = useState({
    stockCode: '',
    stockName: '',
    type: 'BUY',
    lotQuantity: '',
    pricePerShare: '',
    brokerFee: '',
    transactionDate: '',
    notes: ''
  })

  const { startLoading, stopLoading } = useLoading()

  const fetchTransactions = async () => {
    startLoading()
    try {
      const params = new URLSearchParams()
      if (filterType) params.set('type', filterType)
      if (filterYear) params.set('year', filterYear)

      const res = await fetch(`/api/transactions?${params}`)
      const data = await res.json()
      if (data.success) {
        setTransactions(data.data)
        setSummary(data.summary)
      }
    } finally {
      setLoading(false)
      stopLoading()
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [filterType, filterYear])

  const resetForm = () => {
    setFormData({
      stockCode: '',
      stockName: '',
      type: 'BUY',
      lotQuantity: '',
      pricePerShare: '',
      brokerFee: '',
      transactionDate: '',
      notes: ''
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })

    const data = await res.json()
    if (!data.success) {
      alert(data.error || 'Gagal menyimpan')
    }

    setSaving(false)
    setShowForm(false)
    resetForm()
    fetchTransactions()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus transaksi ini?')) return
    await fetch(`/api/transactions/${id}`, { method: 'DELETE' })
    fetchTransactions()
  }

  const handleExport = () => {
    const params = new URLSearchParams()
    if (filterYear) params.set('year', filterYear)
    window.open(`/api/transactions/export?${params}`, '_blank')
  }

  const handleClose = () => {
    setShowForm(false)
    resetForm()
  }

  // Generate year options
  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i)

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
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Riwayat Transaksi</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Catatan beli dan jual saham</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={handleExport}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </Button>
          <Button onClick={() => { resetForm(); setShowForm(true) }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tambah Transaksi
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 transition-colors">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Pembelian</p>
            <p className="text-xl font-bold text-red-600 dark:text-red-400">{formatRupiah(summary.totalBuy)}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 transition-colors">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Penjualan</p>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatRupiah(summary.totalSell)}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 transition-colors">
            <p className="text-sm text-gray-500 dark:text-gray-400">Net Cash Flow</p>
            <p className={`text-xl font-bold ${summary.netFlow >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatRupiah(summary.netFlow)}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 transition-colors">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Transaksi</p>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{summary.transactionCount}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4">
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-700 dark:text-gray-100"
        >
          <option value="">Semua Tipe</option>
          <option value="BUY">Beli</option>
          <option value="SELL">Jual</option>
        </select>
        <select
          value={filterYear}
          onChange={e => setFilterYear(e.target.value)}
          className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-700 dark:text-gray-100"
        >
          <option value="">Semua Tahun</option>
          {yearOptions.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      {/* Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={handleClose}
        title="Tambah Transaksi"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Kode Saham"
              type="text"
              value={formData.stockCode}
              onChange={e => setFormData({ ...formData, stockCode: e.target.value.toUpperCase() })}
              placeholder="BBCA"
              required
            />
            <Input
              label="Nama Emiten"
              type="text"
              value={formData.stockName}
              onChange={e => setFormData({ ...formData, stockName: e.target.value })}
              placeholder="Bank Central Asia"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipe Transaksi</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="BUY"
                  checked={formData.type === 'BUY'}
                  onChange={e => setFormData({ ...formData, type: e.target.value })}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-gray-700 dark:text-gray-300">Beli</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="SELL"
                  checked={formData.type === 'SELL'}
                  onChange={e => setFormData({ ...formData, type: e.target.value })}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-gray-700 dark:text-gray-300">Jual</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Jumlah Lot"
              type="number"
              value={formData.lotQuantity}
              onChange={e => setFormData({ ...formData, lotQuantity: e.target.value })}
              placeholder="10"
              required
            />
            <Input
              label="Harga per Lembar"
              type="number"
              value={formData.pricePerShare}
              onChange={e => setFormData({ ...formData, pricePerShare: e.target.value })}
              placeholder="9500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Tanggal Transaksi"
              type="date"
              value={formData.transactionDate}
              onChange={e => setFormData({ ...formData, transactionDate: e.target.value })}
              required
            />
            <Input
              label="Biaya Broker"
              type="number"
              value={formData.brokerFee}
              onChange={e => setFormData({ ...formData, brokerFee: e.target.value })}
              placeholder="15000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Catatan (Opsional)
            </label>
            <textarea
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Catatan transaksi..."
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>

          {/* Preview */}
          {formData.lotQuantity && formData.pricePerShare && (
            <div className={`rounded-xl p-4 space-y-2 ${
              formData.type === 'BUY'
                ? 'bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/30 dark:to-orange-900/30'
                : 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30'
            }`}>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Total Lembar</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {(parseInt(formData.lotQuantity) * 100).toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Total {formData.type === 'BUY' ? 'Pembelian' : 'Penjualan'}</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {formatRupiah(
                    parseInt(formData.lotQuantity) * 100 * parseFloat(formData.pricePerShare)
                  )}
                </span>
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

      {/* Transactions Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-gray-900/50">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Tanggal</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Saham</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Tipe</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Lot</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Harga</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Total</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <p className="text-gray-500 dark:text-gray-400">Belum ada transaksi</p>
                      <Button onClick={() => setShowForm(true)} variant="secondary">
                        Tambah Transaksi Pertama
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                transactions.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400">
                      {new Date(t.transactionDate).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{t.stockCode}</span>
                      {t.stockName && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[150px]">{t.stockName}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        t.type === 'BUY'
                          ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      }`}>
                        {t.type === 'BUY' ? 'Beli' : 'Jual'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900 dark:text-gray-100">
                      {t.lotQuantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900 dark:text-gray-100">
                      {formatRupiah(t.pricePerShare)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-right font-semibold ${
                      t.type === 'BUY' ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {formatRupiah(t.totalAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleDelete(t.id)}
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
