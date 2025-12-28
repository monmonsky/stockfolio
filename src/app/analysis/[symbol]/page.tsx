'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { formatRupiah, formatPercent } from '@/lib/utils'
import Button from '@/components/Button'
import { useLoading } from '@/components/LoadingBar'

interface StockAnalysis {
  symbol: string
  companyName: string | null
  logo: string | null
  price: number | null
  change: number | null
  changePercent: number | null
  volume: number | null
  open: number | null
  high: number | null
  low: number | null
  updatedAt: string | null
  portfolio: {
    totalLots: number
    totalShares: number
    avgBuyPrice: number
    totalInvestment: number
    currentValue: number | null
    profitLoss: number | null
    profitLossPercent: number | null
    firstBuyDate: string
  } | null
  dividends: {
    totalReceived: number
    lastDividend: {
      amount: number
      date: string | null
      year: number
    } | null
    dividendCount: number
    yearlyDividends: { year: number; total: number }[]
  } | null
  inWatchlist: boolean
  inPortfolio: boolean
}

export default function StockAnalysisPage() {
  const params = useParams()
  const router = useRouter()
  const symbol = params.symbol as string

  const [data, setData] = useState<StockAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const { startLoading, stopLoading } = useLoading()

  const fetchAnalysis = async () => {
    startLoading()
    try {
      const res = await fetch(`/api/analysis/${symbol}`)
      const result = await res.json()
      if (result.success) {
        setData(result.data)
      }
    } finally {
      setLoading(false)
      stopLoading()
    }
  }

  const handleRefreshPrice = async () => {
    setRefreshing(true)
    startLoading()
    try {
      const res = await fetch(`/api/market/search?symbol=${symbol}`, { method: 'POST' })
      const result = await res.json()
      if (result.success) {
        fetchAnalysis()
      }
    } finally {
      setRefreshing(false)
      stopLoading()
    }
  }

  const handleAddToWatchlist = async () => {
    const res = await fetch('/api/watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol })
    })
    const result = await res.json()
    if (result.success) {
      setData(prev => prev ? { ...prev, inWatchlist: true } : null)
    } else {
      alert(result.error || 'Gagal menambahkan ke watchlist')
    }
  }

  useEffect(() => {
    if (symbol) {
      fetchAnalysis()
    }
  }, [symbol])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-gray-500">Data tidak ditemukan</p>
        <Button onClick={() => router.back()}>Kembali</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden border border-gray-200">
            {data.logo ? (
              <img src={data.logo} alt={data.symbol} className="w-full h-full object-contain p-2" />
            ) : (
              <span className="text-lg font-bold text-gray-600">{data.symbol.substring(0, 2)}</span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{data.symbol}</h1>
            <p className="text-gray-500">{data.companyName || 'Unknown'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {!data.inWatchlist && (
            <Button variant="secondary" onClick={handleAddToWatchlist}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Watchlist
            </Button>
          )}
          <Button variant="secondary" onClick={handleRefreshPrice} loading={refreshing}>
            <svg className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </Button>
        </div>
      </div>

      {/* Price Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">Harga Saat Ini</p>
            <p className="text-4xl font-bold text-gray-900">
              {data.price ? formatRupiah(data.price) : '-'}
            </p>
            {data.changePercent !== null && (
              <div className={`flex items-center gap-2 mt-2 ${
                data.changePercent >= 0 ? 'text-emerald-600' : 'text-red-600'
              }`}>
                <span className="font-semibold">
                  {data.change !== null && (data.change >= 0 ? '+' : '')}{data.change}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-sm font-medium ${
                  data.changePercent >= 0 ? 'bg-emerald-50' : 'bg-red-50'
                }`}>
                  {formatPercent(data.changePercent)}
                </span>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-6 text-right">
            <div>
              <p className="text-xs text-gray-500">Open</p>
              <p className="font-semibold text-gray-900">{data.open ? formatRupiah(data.open) : '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Volume</p>
              <p className="font-semibold text-gray-900">
                {data.volume ? data.volume.toLocaleString('id-ID') : '-'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Low</p>
              <p className="font-semibold text-gray-900">{data.low ? formatRupiah(data.low) : '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">High</p>
              <p className="font-semibold text-gray-900">{data.high ? formatRupiah(data.high) : '-'}</p>
            </div>
          </div>
        </div>
        {data.updatedAt && (
          <p className="text-xs text-gray-400 mt-4">
            Terakhir update: {new Date(data.updatedAt).toLocaleString('id-ID')}
          </p>
        )}
      </div>

      {/* Portfolio Holdings */}
      {data.portfolio && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Kepemilikan Portofolio</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-500">Total Lot</p>
              <p className="text-2xl font-bold text-gray-900">{data.portfolio.totalLots}</p>
              <p className="text-xs text-gray-400">{data.portfolio.totalShares.toLocaleString('id-ID')} lembar</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Avg Buy Price</p>
              <p className="text-2xl font-bold text-gray-900">{formatRupiah(data.portfolio.avgBuyPrice)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Investasi</p>
              <p className="text-2xl font-bold text-gray-900">{formatRupiah(data.portfolio.totalInvestment)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Nilai Saat Ini</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.portfolio.currentValue ? formatRupiah(data.portfolio.currentValue) : '-'}
              </p>
            </div>
          </div>

          {data.portfolio.profitLoss !== null && (
            <div className={`mt-6 p-4 rounded-xl ${
              data.portfolio.profitLoss >= 0
                ? 'bg-gradient-to-r from-emerald-50 to-teal-50'
                : 'bg-gradient-to-r from-red-50 to-orange-50'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Profit/Loss</p>
                  <p className={`text-2xl font-bold ${
                    data.portfolio.profitLoss >= 0 ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {formatRupiah(data.portfolio.profitLoss)}
                  </p>
                </div>
                <div className={`px-4 py-2 rounded-full text-lg font-bold ${
                  (data.portfolio.profitLossPercent ?? 0) >= 0
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {formatPercent(data.portfolio.profitLossPercent ?? 0)}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dividend History */}
      {data.dividends && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Riwayat Dividen</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-6">
            <div>
              <p className="text-sm text-gray-500">Total Diterima</p>
              <p className="text-2xl font-bold text-emerald-600">
                {formatRupiah(data.dividends.totalReceived)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Jumlah Dividen</p>
              <p className="text-2xl font-bold text-gray-900">{data.dividends.dividendCount}x</p>
            </div>
            {data.dividends.lastDividend && (
              <div>
                <p className="text-sm text-gray-500">Dividen Terakhir</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatRupiah(data.dividends.lastDividend.amount)}/lembar
                </p>
                <p className="text-xs text-gray-400">Tahun {data.dividends.lastDividend.year}</p>
              </div>
            )}
          </div>

          {data.dividends.yearlyDividends.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-500">Dividen per Tahun</p>
              {data.dividends.yearlyDividends.map(({ year, total }) => (
                <div key={year} className="flex items-center">
                  <span className="w-16 text-sm text-gray-600">{year}</span>
                  <div className="flex-1 mx-4 bg-gray-100 rounded-full h-6 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full"
                      style={{
                        width: `${Math.max((total / Math.max(...data.dividends!.yearlyDividends.map(d => d.total))) * 100, 5)}%`
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-32 text-right">
                    {formatRupiah(total)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Status badges */}
      <div className="flex gap-3">
        {data.inPortfolio && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-blue-50 text-blue-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Di Portofolio
          </span>
        )}
        {data.inWatchlist && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-amber-50 text-amber-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Di Watchlist
          </span>
        )}
      </div>
    </div>
  )
}
