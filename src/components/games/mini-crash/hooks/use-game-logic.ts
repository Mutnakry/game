"use client"

import { useState, useRef } from "react"
import type { MultiplierRange } from "@/components/types/multiplier"

export function useGameLogic(
  multiplierRanges: MultiplierRange[],
  saveCrashData: (crashPoint: number) => Promise<void>,
) {
  const [multiplier, setMultiplier] = useState<number | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showMultiplier, setShowMultiplier] = useState(false)
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
    setShowMultiplier(true)
    setCountingMultiplier(0)
    setIsCounting(true)

    // Generate the final multiplier value
    const newMultiplier = generateRandomMultiplier()
    setMultiplier(newMultiplier)
    crashPointRef.current = newMultiplier // Store the crash point for saving to database

    // Start the counting animation
    let startTime: number | null = null
    const duration = 2000 // 2 seconds

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

  // Convert probability from decimal (0-1) to percentage (0-100) for display
  const formatProbability = (prob: number): string => {
    const percentage = prob > 1 ? prob : prob * 100
    return `${Math.round(percentage)}%`
  }

  return {
    multiplier,
    isAnimating,
    showMultiplier,
    countingMultiplier,
    isCounting,
    handleStart,
    generateRandomMultiplier,
    formatProbability,
  }
}
