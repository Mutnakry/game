"use client"

import dynamic from "next/dynamic"
import { Suspense } from "react"

// Dynamically import the SpaceMan component to avoid SSR issues with canvas
const SpaceMan = dynamic(() => import("@/components/games/spaceman"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen bg-black text-white">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
        <p className="mt-4">Loading game...</p>
      </div>
    </div>
  ),
})

export default function SpaceManGamePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SpaceMan />
    </Suspense>
  )
}
