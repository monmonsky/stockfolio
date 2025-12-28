'use client'

import { useEffect, useState } from 'react'
import { formatRupiah, formatPercent } from '@/lib/utils'
import Card from '@/components/Card'
import { useLoading } from '@/components/LoadingBar'

interface Overview {
  totalDividends: number
  totalInvestment: number
  overallYield: number
  totalDividendCount: number
  uniqueStocks: number
  yearsActive: number
  averagePerDividend: number
}

interface YearlyPerformance {
  year: number
  totalDividend: number
  dividendCount: number
  stockCount: number
  yield: number
}

interface StockPerformance {
  stockCode: string
  totalDividend: number
  dividendCount: number
  yearsReceived: number
  investment: number
  yield: number
}

interface Projection {
  estimatedYearly: number
  estimatedMonthly: number
  basedOnYear: number
}

interface PerformanceData {
  overview: Overview
  yearlyPerformance: YearlyPerformance[]
  stockPerformance: StockPerformance[]
  projection: Projection | null
}

export default function DividendPerformancePage() {
  const [data, setData] = useState<PerformanceData | null>(null)
  const [loading, setLoading] = useState(true)

  const { startLoading, stopLoading } = useLoading()

  useEffect(() => {
    const fetchData = async () => {
      startLoading()
      try {
        const res = await fetch('/api/dividends/performance')
        const result = await res.json()
        if (result.success) {
          setData(result.data)
        }
      } finally {
        setLoading(false)
        stopLoading()
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Gagal memuat data</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Performa Dividen</h1>
        <p className="text-sm text-gray-500 mt-1">Analisis lengkap pendapatan dividen</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          title="Total Dividen"
          value={formatRupiah(data.overview.totalDividends)}
          subtitle={`${data.overview.totalDividendCount} kali penerimaan`}
          color="green"
        />
        <Card
          title="Total Investasi"
          value={formatRupiah(data.overview.totalInvestment)}
          subtitle={`${data.overview.uniqueStocks} saham`}
        />
        <Card
          title="Dividend Yield"
          value={formatPercent(data.overview.overallYield)}
          subtitle="dari total investasi"
          color={data.overview.overallYield >= 5 ? 'green' : undefined}
        />
        <Card
          title="Rata-rata per Dividen"
          value={formatRupiah(data.overview.averagePerDividend)}
          subtitle={`${data.overview.yearsActive} tahun aktif`}
        />
      </div>

      {/* Projection */}
      {data.projection && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Proyeksi Dividen
            <span className="text-sm font-normal text-gray-500 ml-2">
              (berdasarkan tahun {data.projection.basedOnYear})
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">Estimasi Tahunan</p>
              <p className="text-3xl font-bold text-blue-600">
                {formatRupiah(data.projection.estimatedYearly)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">Estimasi Bulanan</p>
              <p className="text-3xl font-bold text-blue-600">
                {formatRupiah(data.projection.estimatedMonthly)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Yearly Performance */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Performa per Tahun</h2>
        {data.yearlyPerformance.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Belum ada data dividen</p>
        ) : (
          <div className="space-y-4">
            {data.yearlyPerformance.map(year => (
              <div
                key={year.year}
                className="flex items-center gap-4 p-4 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors"
              >
                <div className="w-16 text-center">
                  <span className="text-xl font-bold text-gray-900">{year.year}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.max((year.totalDividend / Math.max(...data.yearlyPerformance.map(y => y.totalDividend))) * 100, 5)}%`
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      {year.dividendCount} dividen dari {year.stockCount} saham
                    </span>
                    <span className="font-medium text-emerald-600">
                      Yield: {formatPercent(year.yield)}
                    </span>
                  </div>
                </div>
                <div className="w-32 text-right">
                  <span className="text-xl font-bold text-emerald-600">
                    {formatRupiah(year.totalDividend)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stock Performance */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Performa per Saham</h2>
        </div>
        {data.stockPerformance.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Belum ada data dividen</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Saham</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Total Dividen</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Investasi</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Yield</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase">Frekuensi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.stockPerformance.map(stock => (
                  <tr key={stock.stockCode} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-semibold text-gray-900">{stock.stockCode}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="font-semibold text-emerald-600">
                        {formatRupiah(stock.totalDividend)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900">
                      {formatRupiah(stock.investment)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        stock.yield >= 5
                          ? 'bg-emerald-50 text-emerald-700'
                          : stock.yield >= 2
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {formatPercent(stock.yield)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-gray-600">
                        {stock.dividendCount}x ({stock.yearsReceived} tahun)
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
