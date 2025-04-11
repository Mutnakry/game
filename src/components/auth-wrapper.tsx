"use client"

import { type ReactNode, useState, useEffect } from "react"
import { AuthProvider } from "./auth/auth-context"

export default function AuthWrapper({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <h3 className="text-red-800 font-medium">Authentication Error</h3>
        <p className="text-red-600">{error.message}</p>
        <button
          onClick={() => (window.location.href = "/login")}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Go to Login
        </button>
      </div>
    )
  }

  if (!mounted) {
    // Return a placeholder or loading state
    return <div className="p-4">{children}</div>
  }

  return <AuthProvider>{children}</AuthProvider>
}
