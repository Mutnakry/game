"use client"

import MiniCrash from "@/components/crash-predictor-with-firebase"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.replace("/login")
    }
  }, [])
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-black">
      <MiniCrash />
    </main>
  )
}