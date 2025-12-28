'use client'

import { useEffect, useState } from 'react'
import Card from '@/components/Card'
import { formatRupiah, formatPercent } from '@/lib/utils'
import { useLoading } from '@/components/LoadingBar'

interface DashboardData {
  portfolio: {
    totalStocks: number
    totalModal: number
    totalCurrentValue: number
    totalProfitLoss: number
    totalProfitLossPercent: number
  }
  dividend: {
    totalAllTime: number
    totalCurrentYear: number
    byMonth: { month: number; monthName: string; total: number }[]
    currentYear: number
  }
}

// Animated Ring Chart Component
function RingChart({
  value,
  maxValue,
  color,
  label,
  size = 120
}: {
  value: number
  maxValue: number
  color: 'green' | 'red' | 'blue'
  label: string
  size?: number
}) {
  const [progress, setProgress] = useState(0)
  const percentage = Math.min(Math.abs(value / maxValue) * 100, 100)
  const strokeWidth = 8
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (progress / 100) * circumference

  useEffect(() => {
    const timer = setTimeout(() => {
      setProgress(percentage)
    }, 100)
    return () => clearTimeout(timer)
  }, [percentage])

  const colorClasses = {
    green: 'stroke-emerald-500',
    red: 'stroke-red-500',
    blue: 'stroke-blue-500'
  }

  const bgColorClasses = {
    green: 'stroke-emerald-100 dark:stroke-emerald-900/30',
    red: 'stroke-red-100 dark:stroke-red-900/30',
    blue: 'stroke-blue-100 dark:stroke-blue-900/30'
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          <circle
            className={bgColorClasses[color]}
            strokeWidth={strokeWidth}
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
          <circle
            className={`${colorClasses[color]} transition-all duration-1000 ease-out`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: offset
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-xl font-bold ${color === 'green' ? 'text-emerald-600 dark:text-emerald-400' : color === 'red' ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
            {progress.toFixed(0)}%
          </span>
        </div>
      </div>
      <span className="mt-2 text-sm text-gray-600 dark:text-gray-400">{label}</span>
    </div>
  )
}

// Animated Bar Chart Component
function AnimatedBarChart({
  data,
  maxValue
}: {
  data: { month: number; monthName: string; total: number }[]
  maxValue: number
}) {
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100)
    return () => clearTimeout(timer)
  }, [])

  // Fill all 12 months
  const allMonths = Array.from({ length: 12 }, (_, i) => {
    const monthData = data.find(d => d.month === i + 1)
    return {
      month: i + 1,
      monthName: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'][i],
      total: monthData?.total || 0
    }
  })

  return (
    <div className="flex items-end justify-between gap-1 sm:gap-2 h-52 px-2">
      {allMonths.map((item, index) => {
        const height = animated && maxValue > 0 ? Math.max((item.total / maxValue) * 100, item.total > 0 ? 8 : 0) : 0
        return (
          <div
            key={item.month}
            className="flex-1 flex flex-col items-center group relative"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="relative w-full flex justify-center mb-2 h-40">
              <div
                className={`w-full max-w-[32px] rounded-t-md transition-all duration-700 ease-out relative overflow-hidden ${
                  item.total > 0
                    ? 'bg-gradient-to-t from-blue-600 to-cyan-400 dark:from-blue-500 dark:to-cyan-300'
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
                style={{
                  height: item.total > 0 ? `${height}%` : '4px',
                  marginTop: 'auto'
                }}
              >
                {item.total > 0 && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                )}
              </div>
              {/* Tooltip */}
              {item.total > 0 && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                  {formatRupiah(item.total)}
                </div>
              )}
            </div>
            <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium">{item.monthName}</span>
          </div>
        )
      })}
    </div>
  )
}

// Animated Counter Component
function AnimatedValue({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const duration = 1000
    const steps = 30
    const increment = value / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= value) {
        setDisplayValue(value)
        clearInterval(timer)
      } else {
        setDisplayValue(current)
      }
    }, duration / steps)
    return () => clearInterval(timer)
  }, [value])

  return <>{prefix}{formatRupiah(displayValue)}{suffix}</>
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const { startLoading, stopLoading } = useLoading()

  useEffect(() => {
    startLoading()
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(setData)
      .finally(() => {
        setLoading(false)
        stopLoading()
      })
  }, [])

  if (loading) {
    return <div className="h-64" />
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Failed to load data</div>
      </div>
    )
  }

  const { portfolio, dividend } = data
  const plColor = portfolio.totalProfitLoss >= 0 ? 'green' : 'red'
  const maxDividend = Math.max(...dividend.byMonth.map(d => d.total), 1)

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>

      {/* Portfolio Summary Cards */}
      <section>
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">Ringkasan Portofolio</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card
            title="Total Saham"
            value={portfolio.totalStocks.toString()}
            subtitle="emiten"
          />
          <Card
            title="Total Modal"
            value={formatRupiah(portfolio.totalModal)}
          />
          <Card
            title="Nilai Saat Ini"
            value={formatRupiah(portfolio.totalCurrentValue)}
          />
          <Card
            title="Profit/Loss"
            value={formatRupiah(portfolio.totalProfitLoss)}
            subtitle={formatPercent(portfolio.totalProfitLossPercent)}
            color={plColor}
          />
        </div>
      </section>

      {/* Portfolio Performance Chart */}
      {portfolio.totalModal > 0 && (
        <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-colors">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Performa Portofolio</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center">
              <RingChart
                value={portfolio.totalProfitLoss}
                maxValue={portfolio.totalModal}
                color={portfolio.totalProfitLoss >= 0 ? 'green' : 'red'}
                label="Return"
                size={140}
              />
              <div className="mt-4 text-center">
                <p className={`text-2xl font-bold ${portfolio.totalProfitLoss >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  {portfolio.totalProfitLoss >= 0 ? '+' : ''}{formatRupiah(portfolio.totalProfitLoss)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Profit/Loss</p>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <RingChart
                value={portfolio.totalCurrentValue}
                maxValue={portfolio.totalModal + portfolio.totalModal * 0.5}
                color="blue"
                label="Nilai Aset"
                size={140}
              />
              <div className="mt-4 text-center">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {formatRupiah(portfolio.totalCurrentValue)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Nilai Saat Ini</p>
              </div>
            </div>

            <div className="flex flex-col justify-center space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Modal Investasi</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{formatRupiah(portfolio.totalModal)}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Jumlah Emiten</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{portfolio.totalStocks} <span className="text-sm font-normal text-gray-500">saham</span></p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Dividend Summary */}
      <section>
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">Ringkasan Dividen</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card
            title="Total Dividen (Semua)"
            value={formatRupiah(dividend.totalAllTime)}
          />
          <Card
            title={`Total Dividen ${dividend.currentYear}`}
            value={formatRupiah(dividend.totalCurrentYear)}
          />
        </div>

        {/* Monthly Dividend Bar Chart */}
        {dividend.byMonth.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-colors">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Dividen Bulanan {dividend.currentYear}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <div className="w-3 h-3 rounded bg-gradient-to-r from-blue-600 to-cyan-400"></div>
                <span>Dividen</span>
              </div>
            </div>

            <AnimatedBarChart data={dividend.byMonth} maxValue={maxDividend} />

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{dividend.byMonth.length}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Bulan Dividen</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatRupiah(dividend.totalCurrentYear / Math.max(dividend.byMonth.length, 1))}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Rata-rata/Bulan</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {formatRupiah(Math.max(...dividend.byMonth.map(d => d.total)))}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Tertinggi</p>
              </div>
            </div>
          </div>
        )}

        {dividend.byMonth.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center transition-colors">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-500 dark:text-gray-400">Belum ada data dividen untuk tahun {dividend.currentYear}</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Tambahkan dividen dari menu Dividen</p>
          </div>
        )}
      </section>
    </div>
  )
}
