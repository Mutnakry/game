"use client"

import { useState } from "react"
import { db } from "@/components/firebase-config"
import { collection, addDoc } from "firebase/firestore"

export function useCrashData() {
  const [isSavingCrash, setIsSavingCrash] = useState(false)
  const [crashSaveError, setCrashSaveError] = useState<string | null>(null)
  const [crashHistory, setCrashHistory] = useState<any[]>([])

  // Save crash data to Firebase
  const saveCrashData = async (crashPoint: number) => {
    setIsSavingCrash(true)
    setCrashSaveError(null)

    try {
      const crashData = {
        timestamp: new Date().toISOString(),
        crashPoint: crashPoint,
        // Since we don't have betting functionality yet, we'll set these to default values
        betAmount: 0,
        cashoutMultiplier: 0,
        userCashedOut: false,
        winRate: 0,
        expectedValue: 0,
        profit: 0,
      }

      console.log("💾 Saving crash data on crash:", crashData)

      await addDoc(collection(db, "crashHistory"), crashData)
      console.log("✅ Crash data saved to Firebase")

      // Update local crash history
      setCrashHistory((prev) => [crashData, ...prev].slice(0, 10)) // Keep only the 10 most recent crashes
    } catch (error) {
      console.error("❌ Error saving crash data:", error)
      setCrashSaveError(error instanceof Error ? error.message : "Failed to save crash data")
    } finally {
      setIsSavingCrash(false)
    }
  }

  return {
    saveCrashData,
    isSavingCrash,
    crashSaveError,
    crashHistory,
  }
}
