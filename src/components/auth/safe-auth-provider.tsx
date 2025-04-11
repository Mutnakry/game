"use client"

import { type ReactNode, useState, useEffect } from "react"
import { AuthProvider } from "./auth-context"

export default function SafeAuthProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <>{children}</>
  }

  return <AuthProvider>{children}</AuthProvider>
}
