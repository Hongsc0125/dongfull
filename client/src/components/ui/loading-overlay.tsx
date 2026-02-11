"use client"

import { cn } from "@/lib/utils"
import { LoadingSpinner } from "./loading-spinner"
import { useEffect, useState } from "react"

interface LoadingOverlayProps {
  isVisible: boolean
  message?: string
  className?: string
  blur?: boolean
}

export function LoadingOverlay({
  isVisible,
  message = "로딩 중...",
  className,
  blur = true
}: LoadingOverlayProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !isVisible) return null

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center",
        blur && "backdrop-blur-sm bg-background/80",
        !blur && "bg-background/90",
        className
      )}
    >
      <div className="flex flex-col items-center gap-4 p-6 rounded-lg bg-card border shadow-lg">
        <LoadingSpinner size="lg" />
        <p className="text-sm font-medium text-foreground">{message}</p>
      </div>
    </div>
  )
}

// 카드나 섹션용 로딩 오버레이
export function SectionLoadingOverlay({
  isVisible,
  message = "로딩 중...",
  className
}: LoadingOverlayProps) {
  if (!isVisible) return null

  return (
    <div
      className={cn(
        "absolute inset-0 z-10 flex items-center justify-center",
        "bg-background/80 backdrop-blur-sm rounded-lg",
        className
      )}
    >
      <div className="flex flex-col items-center gap-2">
        <LoadingSpinner size="md" />
        <p className="text-xs text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}