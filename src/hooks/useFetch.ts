'use client'

import { useState, useEffect, useCallback } from 'react'
import { useLoading } from '@/components/LoadingBar'

interface UseFetchOptions {
  immediate?: boolean
}

export function useFetch<T>(url: string, options: UseFetchOptions = { immediate: true }) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { startLoading, stopLoading } = useLoading()

  const fetchData = useCallback(async (showGlobalLoading = true) => {
    setLoading(true)
    setError(null)

    if (showGlobalLoading) {
      startLoading()
    }

    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch')
      }
      const result = await response.json()
      setData(result)
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      return null
    } finally {
      setLoading(false)
      if (showGlobalLoading) {
        stopLoading()
      }
    }
  }, [url, startLoading, stopLoading])

  useEffect(() => {
    if (options.immediate) {
      fetchData()
    }
  }, []) // Only run on mount

  return { data, error, loading, refetch: fetchData, setData }
}

export function useMultiFetch<T extends Record<string, unknown>>(
  urls: Record<keyof T, string>
) {
  const [data, setData] = useState<Partial<T>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { startLoading, stopLoading } = useLoading()

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    startLoading()

    try {
      const entries = Object.entries(urls) as [keyof T, string][]
      const results = await Promise.all(
        entries.map(async ([key, url]) => {
          const response = await fetch(url)
          if (!response.ok) throw new Error(`Failed to fetch ${String(key)}`)
          const result = await response.json()
          return [key, result] as const
        })
      )

      const newData = Object.fromEntries(results) as T
      setData(newData)
      return newData
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      return null
    } finally {
      setLoading(false)
      stopLoading()
    }
  }, [urls, startLoading, stopLoading])

  useEffect(() => {
    fetchAll()
  }, []) // Only run on mount

  return { data, error, loading, refetch: fetchAll }
}
