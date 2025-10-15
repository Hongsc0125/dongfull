import * as React from "react"
import { Button, type buttonVariants } from "./button"
import { ButtonLoading } from "./loading-spinner"
import { cn } from "@/lib/utils"
import { type VariantProps } from "class-variance-authority"

interface LoadingButtonProps extends
  React.ComponentProps<"button">,
  VariantProps<typeof buttonVariants> {
  loading?: boolean
  loadingText?: string
  asChild?: boolean
}

export function LoadingButton({
  children,
  loading = false,
  loadingText,
  disabled,
  className,
  ...props
}: LoadingButtonProps) {
  return (
    <Button
      disabled={disabled || loading}
      className={cn(
        loading && "cursor-not-allowed",
        className
      )}
      {...props}
    >
      {loading ? (
        <ButtonLoading>
          {loadingText || children}
        </ButtonLoading>
      ) : (
        children
      )}
    </Button>
  )
}