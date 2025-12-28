'use client'

import { useEffect, useState } from 'react'
import { formatRupiah } from '@/lib/utils'
import Button from '@/components/Button'
import Input from '@/components/Input'
import { useLoading } from '@/components/LoadingBar'

interface StockData {
  symbol: string
  companyName: string
  logo?: string | null
  price: number
  change: number
  changePercent: number
  volume?: number
  open?: number | null
  high?: number | null
  low?: number | null
}

interface NewsItem {
  title: string
  description: string
  url: string
  image: string
  publishedAt: string
  source: string
}

interface TrendingData {
  gainers: StockData[]
  losers: StockData[]
  mostActive: StockData[]
}

export default function MarketPage() {
  const [searchSymbol, setSearchSymbol] = useState('')
  const [searchResults, setSearchResults] = useState<StockData[]>([])
  const [notFoundSymbols, setNotFoundSymbols] = useState<string[]>([])
  const [searchUpdatedAt, setSearchUpdatedAt] = useState<string | null>(null)
  const [searching, setSearching] = useState(false)
  const [refreshingSearch, setRefreshingSearch] = useState(false)
  const [searchError, setSearchError] = useState('')

  const [trending, setTrending] = useState<TrendingData | null>(null)
  const [trendingLoading, setTrendingLoading] = useState(true)
  const [trendingRefreshing, setTrendingRefreshing] = useState(false)
  const [trendingUpdatedAt, setTrendingUpdatedAt] = useState<string | null>(null)

  const [news, setNews] = useState<NewsItem[]>([])
  const [newsLoading, setNewsLoading] = useState(true)
  const [newsRefreshing, setNewsRefreshing] = useState(false)
  const [newsUpdatedAt, setNewsUpdatedAt] = useState<string | null>(null)

  const [activeTab, setActiveTab] = useState<'gainers' | 'losers' | 'active'>('gainers')

  const { startLoading, stopLoading } = useLoading()

  useEffect(() => {
    fetchTrending()
    fetchNews()
  }, [])

  // Fetch trending from database
  const fetchTrending = async () => {
    setTrendingLoading(true)
    try {
      const response = await fetch('/api/market/trending')
      const data = await response.json()
      if (data.success) {
        setTrending(data.data)
        setTrendingUpdatedAt(data.updatedAt)
      }
    } finally {
      setTrendingLoading(false)
    }
  }

  // Refresh trending from API
  const refreshTrending = async () => {
    setTrendingRefreshing(true)
    startLoading()
    try {
      const response = await fetch('/api/market/trending', { method: 'POST' })
      const data = await response.json()
      if (data.success) {
        setTrending(data.data)
        setTrendingUpdatedAt(data.updatedAt)
      } else {
        alert('Gagal refresh trending: ' + (data.error || 'Unknown error'))
      }
    } catch {
      alert('Gagal refresh trending')
    } finally {
      setTrendingRefreshing(false)
      stopLoading()
    }
  }

  // Fetch news from database
  const fetchNews = async () => {
    setNewsLoading(true)
    try {
      const response = await fetch('/api/market/news')
      const data = await response.json()
      if (data.success) {
        setNews(data.data)
        setNewsUpdatedAt(data.updatedAt)
      }
    } finally {
      setNewsLoading(false)
    }
  }

  // Refresh news from API
  const refreshNews = async () => {
    setNewsRefreshing(true)
    startLoading()
    try {
      const response = await fetch('/api/market/news', { method: 'POST' })
      const data = await response.json()
      if (data.success) {
        setNews(data.data)
        setNewsUpdatedAt(data.updatedAt)
      } else {
        alert('Gagal refresh berita: ' + (data.error || 'Unknown error'))
      }
    } catch {
      alert('Gagal refresh berita')
    } finally {
      setNewsRefreshing(false)
      stopLoading()
    }
  }

  // Search stock from database
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchSymbol.trim()) return

    setSearching(true)
    setSearchError('')
    setSearchResults([])
    setNotFoundSymbols([])
    startLoading()

    try {
      const response = await fetch(`/api/market/search?symbols=${encodeURIComponent(searchSymbol.trim())}`)
      const data = await response.json()

      if (data.success) {
        // Handle both single and multiple results
        const results = Array.isArray(data.data) ? data.data : [data.data]
        setSearchResults(results)
        setNotFoundSymbols(data.notFound || [])
        setSearchUpdatedAt(data.updatedAt)
      } else {
        setSearchError(data.error || 'Saham tidak ditemukan')
      }
    } catch {
      setSearchError('Gagal mencari saham')
    } finally {
      setSearching(false)
      stopLoading()
    }
  }

  // Refresh search from API
  const handleRefreshSearch = async () => {
    if (!searchSymbol.trim()) return

    setRefreshingSearch(true)
    setSearchError('')
    startLoading()

    try {
      const response = await fetch(`/api/market/search?symbols=${encodeURIComponent(searchSymbol.trim())}`, { method: 'POST' })
      const data = await response.json()

      if (data.success) {
        // Handle both single and multiple results
        const results = Array.isArray(data.data) ? data.data : [data.data]
        setSearchResults(results)
        setNotFoundSymbols(data.notFound || [])
        setSearchUpdatedAt(data.updatedAt)
      } else {
        setSearchError(data.error || 'Saham tidak ditemukan')
      }
    } catch {
      setSearchError('Gagal refresh saham')
    } finally {
      setRefreshingSearch(false)
      stopLoading()
    }
  }

  const getTrendingStocks = () => {
    if (!trending) return []
    switch (activeTab) {
      case 'gainers': return trending.gainers
      case 'losers': return trending.losers
      case 'active': return trending.mostActive
    }
  }

  const formatVolume = (volume: number) => {
    if (volume >= 1000000000) return `${(volume / 1000000000).toFixed(1)}B`
    if (volume >= 1000000) return `${(volume / 1000000).toFixed(1)}M`
    if (volume >= 1000) return `${(volume / 1000).toFixed(1)}K`
    return volume.toString()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatUpdateTime = (dateString: string | null) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleString('id-ID')
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Market</h1>

      {/* Search Section */}
      <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-colors">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Cari Saham</h2>
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="flex-1">
            <Input
              type="text"
              value={searchSymbol}
              onChange={e => setSearchSymbol(e.target.value.toUpperCase())}
              placeholder="Masukkan kode saham (misal: BBCA atau BBCA, ADRO, BBNI)"
            />
          </div>
          <Button type="submit" loading={searching} disabled={searching}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Cari
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleRefreshSearch}
            loading={refreshingSearch}
            disabled={refreshingSearch || !searchSymbol.trim()}
          >
            <svg className={`w-5 h-5 ${refreshingSearch ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </Button>
        </form>

        {/* Search Result */}
        {searchError && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/30 rounded-xl border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400">
            {searchError}
          </div>
        )}

        {/* Not Found Symbols Warning */}
        {notFoundSymbols.length > 0 && (
          <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/30 rounded-xl border border-amber-100 dark:border-amber-800 text-amber-700 dark:text-amber-400">
            <span className="font-medium">Tidak ditemukan:</span> {notFoundSymbols.join(', ')}
            <span className="text-sm ml-2">(Gunakan tombol Refresh untuk mengambil dari API)</span>
          </div>
        )}

        {searchResults.length > 0 && (
          <div className="mt-4 space-y-4">
            {searchUpdatedAt && (
              <p className="text-xs text-gray-400">
                Update: {formatUpdateTime(searchUpdatedAt)} • {searchResults.length} saham ditemukan
              </p>
            )}

            {/* Grid for multiple results */}
            <div className={`grid gap-4 ${searchResults.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
              {searchResults.map((stock) => (
                <div key={stock.symbol} className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl p-5 border border-blue-100 dark:border-blue-800">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-start gap-3">
                      {/* Logo */}
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-gray-600 flex-shrink-0">
                        {stock.logo ? (
                          <img
                            src={stock.logo}
                            alt={stock.symbol}
                            className="w-full h-full object-contain p-1"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                              target.parentElement!.innerHTML = `<span class="text-xs font-bold text-gray-600 dark:text-gray-300">${stock.symbol.substring(0, 2)}</span>`
                            }}
                          />
                        ) : (
                          <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
                            {stock.symbol.substring(0, 2)}
                          </span>
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{stock.symbol}</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm truncate max-w-[150px]" title={stock.companyName}>{stock.companyName}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{formatRupiah(stock.price)}</div>
                    <div className={`flex items-center gap-1 ${
                      stock.change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d={stock.change >= 0 ? "M5 10l7-7m0 0l7 7m-7-7v18" : "M19 14l-7 7m0 0l-7-7m7 7V3"}
                        />
                      </svg>
                      <span className="font-semibold text-sm">
                        {stock.change >= 0 ? '+' : ''}{formatRupiah(stock.change)} ({stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%)
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-2">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Open</div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{formatRupiah(stock.open || 0)}</div>
                    </div>
                    <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-2">
                      <div className="text-xs text-gray-500 dark:text-gray-400">High</div>
                      <div className="font-semibold text-emerald-600 dark:text-emerald-400 text-sm">{formatRupiah(stock.high || 0)}</div>
                    </div>
                    <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-2">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Low</div>
                      <div className="font-semibold text-red-600 dark:text-red-400 text-sm">{formatRupiah(stock.low || 0)}</div>
                    </div>
                    <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-2">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Volume</div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{formatVolume(stock.volume || 0)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Trending Section */}
      <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-colors">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Trending Saham</h2>
            {trendingUpdatedAt && (
              <p className="text-xs text-gray-400 mt-1">
                Update: {formatUpdateTime(trendingUpdatedAt)}
              </p>
            )}
          </div>
          <Button
            variant="secondary"
            onClick={refreshTrending}
            loading={trendingRefreshing}
            disabled={trendingRefreshing}
          >
            <svg className={`w-4 h-4 ${trendingRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {trendingRefreshing ? 'Updating...' : 'Refresh'}
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('gainers')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'gainers'
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'
            }`}
          >
            Top Gainers
          </button>
          <button
            onClick={() => setActiveTab('losers')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'losers'
                ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'
            }`}
          >
            Top Losers
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'active'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'
            }`}
          >
            Most Active
          </button>
        </div>

        {trendingLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : getTrendingStocks().length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400 mb-4">Belum ada data trending</p>
            <Button variant="secondary" onClick={refreshTrending} loading={trendingRefreshing}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Ambil Data dari API
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <th className="text-left py-3 w-12 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase"></th>
                  <th className="text-left py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Symbol</th>
                  <th className="text-left py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Nama</th>
                  <th className="text-right py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Harga</th>
                  <th className="text-right py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Change</th>
                  <th className="text-right py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">%</th>
                </tr>
              </thead>
              <tbody>
                {getTrendingStocks().map((stock, index) => (
                  <tr key={`${stock.symbol}-${index}`} className="border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-700/50">
                    <td className="py-3 w-12">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-gray-600">
                        {stock.logo ? (
                          <img
                            src={stock.logo}
                            alt={stock.symbol}
                            className="w-full h-full object-contain p-1"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                              target.parentElement!.innerHTML = `<span class="text-xs font-bold text-gray-600 dark:text-gray-300">${stock.symbol.substring(0, 2)}</span>`
                            }}
                          />
                        ) : (
                          <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
                            {stock.symbol.substring(0, 2)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{stock.symbol}</span>
                    </td>
                    <td className="py-3 text-gray-600 dark:text-gray-400 text-sm max-w-[200px] truncate" title={stock.companyName || '-'}>
                      {stock.companyName || '-'}
                    </td>
                    <td className="py-3 text-right font-medium text-gray-900 dark:text-gray-100">{formatRupiah(stock.price)}</td>
                    <td className={`py-3 text-right font-medium ${stock.change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      {stock.change >= 0 ? '+' : ''}{formatRupiah(stock.change)}
                    </td>
                    <td className="py-3 text-right">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                        stock.changePercent >= 0
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* News Section */}
      <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-colors">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Berita Investasi</h2>
            {newsUpdatedAt && (
              <p className="text-xs text-gray-400 mt-1">
                Update: {formatUpdateTime(newsUpdatedAt)}
              </p>
            )}
          </div>
          <Button
            variant="secondary"
            onClick={refreshNews}
            loading={newsRefreshing}
            disabled={newsRefreshing}
          >
            <svg className={`w-4 h-4 ${newsRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {newsRefreshing ? 'Updating...' : 'Refresh'}
          </Button>
        </div>

        {newsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : news.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400 mb-4">Belum ada berita</p>
            <Button variant="secondary" onClick={refreshNews} loading={newsRefreshing}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Ambil Berita dari API
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {news.map((item, index) => (
              <a
                key={index}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-gray-50 dark:bg-gray-700 rounded-xl overflow-hidden hover:shadow-md dark:hover:shadow-gray-900/50 transition-shadow"
              >
                {item.image && (
                  <div className="h-40 bg-gray-200 dark:bg-gray-600 overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm line-clamp-2 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-xs line-clamp-2 mb-3">
                    {item.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>{item.source}</span>
                    <span>{formatDate(item.publishedAt)}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
