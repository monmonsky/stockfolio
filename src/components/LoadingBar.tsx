'use client'

import { useEffect, useState, createContext, useContext, useCallback } from 'react'

interface LoadingContextType {
  isLoading: boolean
  startLoading: () => void
  stopLoading: () => void
}

const LoadingContext = createContext<LoadingContextType>({
  isLoading: false,
  startLoading: () => {},
  stopLoading: () => {}
})

export function useLoading() {
  return useContext(LoadingContext)
}

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)

  const startLoading = useCallback(() => {
    setVisible(true)
    setIsLoading(true)
    setProgress(30)
  }, [])

  const stopLoading = useCallback(() => {
    setProgress(100)
    setIsLoading(false)
    setTimeout(() => {
      setVisible(false)
      setProgress(0)
    }, 400)
  }, [])

  useEffect(() => {
    if (isLoading && progress < 90) {
      const timer = setTimeout(() => {
        setProgress(prev => {
          if (prev < 50) return prev + 10
          if (prev < 70) return prev + 5
          if (prev < 90) return prev + 2
          return prev
        })
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isLoading, progress])

  return (
    <LoadingContext.Provider value={{ isLoading, startLoading, stopLoading }}>
      {/* Simple Progress Bar */}
      <div
        className="fixed top-0 left-0 right-0 z-[9999] h-[3px] pointer-events-none"
        style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.3s ease' }}
      >
        <div
          className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.7)]"
          style={{
            width: `${progress}%`,
            transition: isLoading
              ? 'width 0.3s ease-out'
              : 'width 0.2s ease-in',
          }}
        />
      </div>
      {children}
    </LoadingContext.Provider>
  )
}
