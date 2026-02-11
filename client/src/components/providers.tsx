"use client"

import { SessionProvider } from "next-auth/react"
import { LoadingProvider } from "@/contexts/loading-context"

export function Providers({
  children,
  session
}: {
  children: React.ReactNode
  session: any
}) {
  return (
    <SessionProvider session={session}>
      <LoadingProvider>
        {children}
      </LoadingProvider>
    </SessionProvider>
  )
}