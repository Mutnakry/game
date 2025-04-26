"use client"

import { useState, useRef } from "react"
import type { MultiplierRange } from "@/components/types/multiplier"

export function useGameLogic(
  multiplierRanges: MultiplierRange[],
  saveCrashData: (crashPoint: number) => Promise<void>,
) {
  const [multiplier, setMultiplier] = useState<number | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showJet, setShowJet] = useState(false)
  const [countingMultiplier, setCountingMultiplier] = useState(0)
  const [isCounting, setIsCounting] = useState(false)
  const crashPointRef = useRef<number>(0)

  // Function to generate a random multiplier based on the probability distribution
  const generateRandomMultiplier = () => {
    const random = Math.random()
    let cumulativeProbability = 0

    for (const range of multiplierRanges) {
      cumulativeProbability += range.probability

      if (random <= cumulativeProbability) {
        // Generate a random number within the selected range
        const randomMultiplier = range.min + Math.random() * (range.max - range.min)
        return Number.parseFloat(randomMultiplier.toFixed(2))
      }
    }

    // Fallback (should never reach here if probabilities sum to 1)
    return 1.0
  }

  const handleStart = () => {
    if (isAnimating) return

    setIsAnimating(true)
    setShowJet(true)
    setCountingMultiplier(0)
    setIsCounting(true)

    // Generate the final multiplier value
    const newMultiplier = generateRandomMultiplier()
    setMultiplier(newMultiplier)
    crashPointRef.current = newMultiplier // Store the crash point for saving to database

    // Start the counting animation
    let startTime: number | null = null
    const duration = 3000 // 3 seconds for JetX (slightly longer than MiniCrash)

    const animateCount = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = (timestamp - startTime) / duration

      if (progress < 1) {
        // Calculate the current value based on progress
        const currentValue = progress * newMultiplier
        setCountingMultiplier(currentValue)
        requestAnimationFrame(animateCount)
      } else {
        // Animation complete
        setCountingMultiplier(newMultiplier)
        setIsCounting(false)
        setIsAnimating(false)

        // Save crash data to Firebase
        saveCrashData(newMultiplier)
      }
    }

    requestAnimationFrame(animateCount)
  }

  return {
    multiplier,
    isAnimating,
    showJet,
    countingMultiplier,
    isCounting,
    handleStart,
    generateRandomMultiplier,
  }
}
