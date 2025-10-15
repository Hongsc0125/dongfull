"use client"

import { useState, useCallback } from 'react'

interface UseAsyncState<T> {
  data: T | null
  loading: boolean
  error: Error | null
}

interface UseAsyncReturn<T> extends UseAsyncState<T> {
  execute: (...args: any[]) => Promise<T | null>
  reset: () => void
}

export function useAsync<T = any>(
  asyncFunction: (...args: any[]) => Promise<T>,
  immediate = false
): UseAsyncReturn<T> {
  const [state, setState] = useState<UseAsyncState<T>>({
    data: null,
    loading: immediate,
    error: null,
  })

  const execute = useCallback(
    async (...args: any[]): Promise<T | null> => {
      setState(prev => ({ ...prev, loading: true, error: null }))

      try {
        const result = await asyncFunction(...args)
        setState(prev => ({ ...prev, data: result, loading: false }))
        return result
      } catch (error) {
        setState(prev => ({
          ...prev,
          error: error as Error,
          loading: false,
        }))
        return null
      }
    },
    [asyncFunction]
  )

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    })
  }, [])

  return {
    ...state,
    execute,
    reset,
  }
}

// API 호출용 특화된 훅
export function useApiCall<T = any>(
  apiFunction: (...args: any[]) => Promise<Response>,
  immediate = false
): UseAsyncReturn<T> & {
  executeApi: (...args: any[]) => Promise<T | null>
} {
  const asyncWrapper = useCallback(
    async (...args: any[]): Promise<T> => {
      const response = await apiFunction(...args)

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`API Error ${response.status}: ${errorData}`)
      }

      return await response.json()
    },
    [apiFunction]
  )

  const asyncState = useAsync<T>(asyncWrapper, immediate)

  return {
    ...asyncState,
    executeApi: asyncState.execute,
  }
}