"use client"

import { useState } from "react"
import { LoadingButton } from "@/components/ui/loading-button"

interface RefreshButtonProps {
  className?: string
  children: React.ReactNode
}

export function RefreshButton({ className, children }: RefreshButtonProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = () => {
    setIsRefreshing(true)
    // 짧은 지연 후 새로고침하여 로딩 상태를 보여줌
    setTimeout(() => {
      window.location.reload()
    }, 300)
  }

  return (
    <LoadingButton
      className={className}
      onClick={handleRefresh}
      loading={isRefreshing}
      loadingText="새로고침 중..."
    >
      {children}
    </LoadingButton>
  )
}