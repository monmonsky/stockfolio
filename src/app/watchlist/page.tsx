'use client'

import { useEffect, useState } from 'react'
import { formatRupiah, formatPercent } from '@/lib/utils'
import Modal from '@/components/Modal'
import Input from '@/components/Input'
import Button from '@/components/Button'
import { useLoading } from '@/components/LoadingBar'

interface WatchlistItem {
  id: number
  symbol: string
  companyName: string | null
  logo: string | null
  targetPrice: number | null
  notes: string | null
  currentPrice: number | null
  change: number | null
  changePercent: number | null
  createdAt: string
}

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<WatchlistItem | null>(null)
  const [formData, setFormData] = useState({
    symbol: '',
    targetPrice: '',
    notes: ''
  })

  const { startLoading, stopLoading } = useLoading()

  const fetchWatchlist = async () => {
    startLoading()
    try {
      const res = await fetch('/api/watchlist')
      const data = await res.json()
      if (data.success) {
        setWatchlist(data.data)
      }
    } finally {
      setLoading(false)
      stopLoading()
    }
  }

  useEffect(() => {
    fetchWatchlist()
  }, [])

  const resetForm = () => {
    setFormData({ symbol: '', targetPrice: '', notes: '' })
    setEditingItem(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const url = editingItem ? `/api/watchlist/${editingItem.id}` : '/api/watchlist'
    const method = editingItem ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
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
    fetchWatchlist()
  }

  const handleEdit = (item: WatchlistItem) => {
    setEditingItem(item)
    setFormData({
      symbol: item.symbol,
      targetPrice: item.targetPrice?.toString() || '',
      notes: item.notes || ''
    })
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus dari watchlist?')) return
    await fetch(`/api/watchlist/${id}`, { method: 'DELETE' })
    fetchWatchlist()
  }

  const handleClose = () => {
    setShowForm(false)
    resetForm()
  }

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Watchlist</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Pantau saham yang menarik perhatianmu</p>
        </div>
        <Button
          onClick={() => {
            resetForm()
            setShowForm(true)
          }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tambah Watchlist
        </Button>
      </div>

      {/* Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={handleClose}
        title={editingItem ? 'Edit Watchlist' : 'Tambah ke Watchlist'}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Kode Saham"
            type="text"
            value={formData.symbol}
            onChange={e => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
            placeholder="BBCA"
            required
            disabled={!!editingItem}
          />

          <Input
            label="Target Harga (Opsional)"
            type="number"
            value={formData.targetPrice}
            onChange={e => setFormData({ ...formData, targetPrice: e.target.value })}
            placeholder="10000"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Catatan (Opsional)
            </label>
            <textarea
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Alasan memantau saham ini..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>

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

      {/* Watchlist Grid */}
      {watchlist.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center transition-colors">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400 mb-4">Belum ada saham di watchlist</p>
          <Button onClick={() => setShowForm(true)} variant="secondary">
            Tambah Saham Pertama
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {watchlist.map(item => (
            <div
              key={item.id}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 hover:shadow-md dark:hover:shadow-gray-900/50 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-gray-600">
                    {item.logo ? (
                      <img
                        src={item.logo}
                        alt={item.symbol}
                        className="w-full h-full object-contain p-1"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                          e.currentTarget.nextElementSibling?.classList.remove('hidden')
                        }}
                      />
                    ) : null}
                    <span className={`text-xs font-bold text-gray-600 dark:text-gray-300 ${item.logo ? 'hidden' : ''}`}>
                      {item.symbol.substring(0, 2)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{item.symbol}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[150px]">
                      {item.companyName || 'Unknown'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(item)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Harga Saat Ini</span>
                  <div className="text-right">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {item.currentPrice ? formatRupiah(item.currentPrice) : '-'}
                    </span>
                    {item.changePercent !== null && (
                      <span className={`ml-2 text-xs font-medium ${
                        item.changePercent >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {formatPercent(item.changePercent)}
                      </span>
                    )}
                  </div>
                </div>

                {item.targetPrice && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Target Harga</span>
                    <span className="font-medium text-blue-600 dark:text-blue-400">
                      {formatRupiah(item.targetPrice)}
                    </span>
                  </div>
                )}

                {item.targetPrice && item.currentPrice && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Selisih Target</span>
                    <span className={`font-medium ${
                      item.currentPrice >= item.targetPrice ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                    }`}>
                      {formatPercent(((item.targetPrice - item.currentPrice) / item.currentPrice) * 100)}
                    </span>
                  </div>
                )}

                {item.notes && (
                  <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{item.notes}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
