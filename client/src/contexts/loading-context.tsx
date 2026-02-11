"use client"

import React, { createContext, useContext, useState, ReactNode } from 'react'
import { LoadingOverlay } from '@/components/ui/loading-overlay'

interface LoadingContextType {
  isLoading: boolean
  setLoading: (loading: boolean, message?: string) => void
  showLoading: (message?: string) => void
  hideLoading: () => void
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined)

export function useLoading() {
  const context = useContext(LoadingContext)
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider')
  }
  return context
}

interface LoadingProviderProps {
  children: ReactNode
}

export function LoadingProvider({ children }: LoadingProviderProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState<string>('로딩 중...')

  const setLoading = (loading: boolean, message = '로딩 중...') => {
    setIsLoading(loading)
    setLoadingMessage(message)
  }

  const showLoading = (message = '로딩 중...') => {
    setLoading(true, message)
  }

  const hideLoading = () => {
    setLoading(false)
  }

  const value: LoadingContextType = {
    isLoading,
    setLoading,
    showLoading,
    hideLoading,
  }

  return (
    <LoadingContext.Provider value={value}>
      {children}
      <LoadingOverlay isVisible={isLoading} message={loadingMessage} />
    </LoadingContext.Provider>
  )
}

// API 호출에 특화된 훅
export function useApiLoading() {
  const { showLoading, hideLoading } = useLoading()

  const withLoading = async <T,>(
    apiCall: () => Promise<T>,
    message?: string
  ): Promise<T> => {
    showLoading(message)
    try {
      const result = await apiCall()
      return result
    } finally {
      hideLoading()
    }
  }

  return { withLoading }
}