'use client'

import { useEffect, useState } from 'react'
import { formatRupiah, formatPercent } from '@/lib/utils'
import Modal from '@/components/Modal'
import Input from '@/components/Input'
import Button from '@/components/Button'
import { useLoading } from '@/components/LoadingBar'

interface Stock {
  id: number
  stockCode: string
  stockName: string | null
  lotQuantity: number
  buyPrice: number
  buyDate: string
  brokerFee: number
  currentPrice: number | null
  totalShares: number
  buyTotal: number
  currentTotal: number
  profitLoss: number
  profitLossPercent: number
}

interface MarketStock {
  symbol: string
  companyName: string
  price: number
}

type SortField = 'stockCode' | 'stockName' | 'lotQuantity' | 'buyPrice' | 'currentPrice' | 'profitLoss' | 'profitLossPercent'
type SortDirection = 'asc' | 'desc'

export default function StocksPage() {
  const [stocks, setStocks] = useState<Stock[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingStock, setEditingStock] = useState<Stock | null>(null)
  const [sortField, setSortField] = useState<SortField>('stockCode')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [marketStocks, setMarketStocks] = useState<MarketStock[]>([])
  const [showStockDropdown, setShowStockDropdown] = useState(false)
  const [stockSearchQuery, setStockSearchQuery] = useState('')
  const [formData, setFormData] = useState({
    stockCode: '',
    stockName: '',
    lotQuantity: '',
    buyPrice: '',
    buyDate: '',
    brokerFee: '',
    currentPrice: ''
  })

  const { startLoading, stopLoading } = useLoading()

  const fetchStocks = () => {
    startLoading()
    fetch('/api/stocks')
      .then(res => res.json())
      .then(setStocks)
      .finally(() => {
        setLoading(false)
        stopLoading()
      })
  }

  useEffect(() => {
    fetchStocks()
    fetchMarketStocks()
  }, [])

  const fetchMarketStocks = async () => {
    try {
      const response = await fetch('/api/market/stocks')
      const data = await response.json()
      if (data.success) {
        setMarketStocks(data.data)
      }
    } catch (error) {
      console.error('Error fetching market stocks:', error)
    }
  }

  const filteredMarketStocks = marketStocks.filter(stock =>
    stock.symbol.toLowerCase().includes(stockSearchQuery.toLowerCase()) ||
    stock.companyName.toLowerCase().includes(stockSearchQuery.toLowerCase())
  ).slice(0, 10)

  const handleSelectStock = (stock: MarketStock) => {
    setFormData({
      ...formData,
      stockCode: stock.symbol,
      stockName: stock.companyName,
      currentPrice: stock.price.toString()
    })
    setShowStockDropdown(false)
    setStockSearchQuery('')
  }

  const resetForm = () => {
    setFormData({
      stockCode: '',
      stockName: '',
      lotQuantity: '',
      buyPrice: '',
      buyDate: '',
      brokerFee: '',
      currentPrice: ''
    })
    setEditingStock(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const url = editingStock ? `/api/stocks/${editingStock.id}` : '/api/stocks'
    const method = editingStock ? 'PUT' : 'POST'

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })

    setSaving(false)
    setShowForm(false)
    resetForm()
    fetchStocks()
  }

  const handleEdit = (stock: Stock) => {
    setEditingStock(stock)
    setFormData({
      stockCode: stock.stockCode,
      stockName: stock.stockName || '',
      lotQuantity: stock.lotQuantity.toString(),
      buyPrice: stock.buyPrice.toString(),
      buyDate: new Date(stock.buyDate).toISOString().split('T')[0],
      brokerFee: stock.brokerFee.toString(),
      currentPrice: stock.currentPrice?.toString() || ''
    })
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus saham ini?')) return
    await fetch(`/api/stocks/${id}`, { method: 'DELETE' })
    fetchStocks()
  }

  const handleClose = () => {
    setShowForm(false)
    resetForm()
    setShowStockDropdown(false)
    setStockSearchQuery('')
  }

  const handleRefreshPrices = async () => {
    setRefreshing(true)
    startLoading()
    try {
      const response = await fetch('/api/stocks/refresh-prices', { method: 'POST' })
      const result = await response.json()
      if (result.success) {
        setLastRefresh(result.timestamp)
        fetchStocks()
      } else {
        alert('Gagal mengupdate harga: ' + (result.error || 'Unknown error'))
      }
    } catch (error) {
      alert('Gagal mengupdate harga')
    } finally {
      setRefreshing(false)
      stopLoading()
    }
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedStocks = [...stocks].sort((a, b) => {
    let comparison = 0
    const aValue = a[sortField]
    const bValue = b[sortField]

    if (aValue === null || aValue === undefined) return 1
    if (bValue === null || bValue === undefined) return -1

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      comparison = aValue.localeCompare(bValue)
    } else {
      comparison = (aValue as number) - (bValue as number)
    }

    return sortDirection === 'asc' ? comparison : -comparison
  })

  const SortIcon = ({ field }: { field: SortField }) => (
    <svg className={`w-4 h-4 inline-block ml-1 transition-transform ${sortField === field ? 'opacity-100' : 'opacity-30'} ${sortField === field && sortDirection === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
    </svg>
  )

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
          <h1 className="text-2xl font-bold text-gray-900">Portofolio Saham</h1>
          {lastRefresh && (
            <p className="text-xs text-gray-500 mt-1">
              Terakhir update: {new Date(lastRefresh).toLocaleString('id-ID')}
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={handleRefreshPrices}
            loading={refreshing}
            disabled={refreshing}
          >
            <svg className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {refreshing ? 'Updating...' : 'Refresh Harga'}
          </Button>
          <Button
            onClick={() => {
              resetForm()
              setShowForm(true)
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tambah Saham
          </Button>
        </div>
      </div>

      {/* Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={handleClose}
        title={editingStock ? 'Edit Saham' : 'Tambah Saham Baru'}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Stock Selection with Dropdown */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Saham</label>
            <div className="relative">
              <input
                type="text"
                value={showStockDropdown ? stockSearchQuery : (formData.stockCode ? `${formData.stockCode} - ${formData.stockName}` : '')}
                onChange={e => {
                  setStockSearchQuery(e.target.value)
                  setShowStockDropdown(true)
                }}
                onFocus={() => setShowStockDropdown(true)}
                placeholder="Cari kode atau nama saham..."
                className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900 dark:text-gray-100"
              />
              {formData.stockCode && !showStockDropdown && (
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, stockCode: '', stockName: '', currentPrice: '' })
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Dropdown List */}
            {showStockDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                {filteredMarketStocks.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                    {marketStocks.length === 0 ? 'Belum ada data saham. Refresh dari Market.' : 'Tidak ditemukan'}
                  </div>
                ) : (
                  filteredMarketStocks.map(stock => (
                    <button
                      key={stock.symbol}
                      type="button"
                      onClick={() => handleSelectStock(stock)}
                      className="w-full px-4 py-3 text-left hover:bg-blue-50 dark:hover:bg-gray-700 flex justify-between items-center border-b border-gray-50 dark:border-gray-700 last:border-b-0"
                    >
                      <div>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">{stock.symbol}</span>
                        <span className="text-gray-500 dark:text-gray-400 ml-2 text-sm">{stock.companyName}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{formatRupiah(stock.price)}</span>
                    </button>
                  ))
                )}
                <button
                  type="button"
                  onClick={() => setShowStockDropdown(false)}
                  className="w-full px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 border-t border-gray-100 dark:border-gray-700"
                >
                  Tutup
                </button>
              </div>
            )}
          </div>

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
              label="Harga Beli"
              type="number"
              value={formData.buyPrice}
              onChange={e => setFormData({ ...formData, buyPrice: e.target.value })}
              placeholder="9500"
              required
            />
          </div>

          <Input
            label="Tanggal Beli"
            type="date"
            value={formData.buyDate}
            onChange={e => setFormData({ ...formData, buyDate: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Biaya Broker"
              type="number"
              value={formData.brokerFee}
              onChange={e => setFormData({ ...formData, brokerFee: e.target.value })}
              placeholder="15000"
            />
            <Input
              label="Harga Saat Ini"
              type="number"
              value={formData.currentPrice}
              onChange={e => setFormData({ ...formData, currentPrice: e.target.value })}
              placeholder="10200"
            />
          </div>

          {/* Preview Calculation */}
          {formData.lotQuantity && formData.buyPrice && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Total Lembar</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {(parseInt(formData.lotQuantity) * 100).toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Total Modal</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {formatRupiah(
                    parseInt(formData.lotQuantity) * 100 * parseFloat(formData.buyPrice) +
                    (parseFloat(formData.brokerFee) || 0)
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

      {/* Stocks Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-gray-900/50">
                <th
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => handleSort('stockCode')}
                >
                  Kode <SortIcon field="stockCode" />
                </th>
                <th
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => handleSort('stockName')}
                >
                  Nama <SortIcon field="stockName" />
                </th>
                <th
                  className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => handleSort('lotQuantity')}
                >
                  Lot <SortIcon field="lotQuantity" />
                </th>
                <th
                  className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => handleSort('buyPrice')}
                >
                  Avg Buy <SortIcon field="buyPrice" />
                </th>
                <th
                  className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => handleSort('currentPrice')}
                >
                  Harga Skrg <SortIcon field="currentPrice" />
                </th>
                <th
                  className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => handleSort('profitLoss')}
                >
                  P/L <SortIcon field="profitLoss" />
                </th>
                <th
                  className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => handleSort('profitLossPercent')}
                >
                  P/L % <SortIcon field="profitLossPercent" />
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
              {sortedStocks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <p className="text-gray-500 dark:text-gray-400">Belum ada data saham</p>
                      <Button onClick={() => setShowForm(true)} variant="secondary">
                        Tambah Saham Pertama
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedStocks.map(stock => (
                  <tr key={stock.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{stock.stockCode}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400">
                      {stock.stockName || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900 dark:text-gray-100">
                      {stock.lotQuantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900 dark:text-gray-100">
                      {formatRupiah(stock.buyPrice)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900 dark:text-gray-100">
                      {stock.currentPrice ? formatRupiah(stock.currentPrice) : '-'}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-right font-semibold ${
                      stock.profitLoss >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {formatRupiah(stock.profitLoss)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        stock.profitLossPercent >= 0
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {formatPercent(stock.profitLossPercent)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleEdit(stock)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(stock.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          title="Hapus"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
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
