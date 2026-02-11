import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

const sizeMap = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8"
}

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  return (
    <Loader2
      className={cn(
        "animate-spin text-muted-foreground",
        sizeMap[size],
        className
      )}
    />
  )
}

// 인라인 로딩 표시기
export function InlineLoading({ children, className }: { children?: React.ReactNode, className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <LoadingSpinner size="sm" />
      {children && <span className="text-sm text-muted-foreground">{children}</span>}
    </div>
  )
}

// 버튼용 로딩 스피너
export function ButtonLoading({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <LoadingSpinner size="sm" className="text-current" />
      {children}
    </div>
  )
}