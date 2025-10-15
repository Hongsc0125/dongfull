"use client"

import { Button } from "@/components/ui/button"

interface RefreshButtonProps {
  className?: string
  children: React.ReactNode
}

export function RefreshButton({ className, children }: RefreshButtonProps) {
  return (
    <Button
      className={className}
      onClick={() => window.location.reload()}
    >
      {children}
    </Button>
  )
}