"use client"

import { useState, useEffect } from "react"
import type { MultiplierRange } from "@/components/types/multiplier"

// Default multiplier ranges to use if API fails
const DEFAULT_MULTIPLIER_RANGES: MultiplierRange[] = [
  { min: 0.1, max: 3.0, probability: 0.75 },
  { min: 3.1, max: 6.0, probability: 0.2 },
  { min: 6.1, max: 11.0, probability: 0.04 },
  { min: 11.1, max: 20.0, probability: 0.01 },
]

export function useMultiplierData() {
  const [multiplierRanges, setMultiplierRanges] = useState<MultiplierRange[]>(DEFAULT_MULTIPLIER_RANGES)
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [dataError, setDataError] = useState<string | null>(null)
  const [useDefaultAlgorithm, setUseDefaultAlgorithm] = useState(true)

  // Fetch game data from API
  useEffect(() => {
    const fetchMultiplierData = async () => {
      setIsLoadingData(true)
      setDataError(null)

      try {
        console.log("Fetching multiplier data...")
        const response = await fetch("/api/crash-multipliers")

        if (!response.ok) {
          throw new Error(`Failed to fetch multipliers: ${response.status} ${response.statusText}`)
        }
        const data = await response.json()
        console.log("Multipliers data:", data)

        setUseDefaultAlgorithm(data.useDefault)

        if (!data.useDefault && data.multipliers && Array.isArray(data.multipliers)) {
          // Normalize probabilities from 0-100 to 0-1 if needed
          const normalizedMultipliers = data.multipliers.map((m: MultiplierRange) => ({
            ...m,
            probability: m.probability > 1 ? m.probability / 100 : m.probability,
          }))

          setMultiplierRanges(normalizedMultipliers)

          // Validate total probability
          const totalProb = normalizedMultipliers.reduce((sum: number, m: MultiplierRange) => sum + m.probability, 0)

          if (Math.abs(totalProb - 1) > 0.01) {
            console.warn(`Total probability (${totalProb}) does not add up to 1. This may affect game balance.`)
          }
        } else {
          console.log("Using default JetX algorithm")
          setMultiplierRanges(DEFAULT_MULTIPLIER_RANGES)
        }
      } catch (error) {
        console.error("Error fetching multipliers:", error)
        setDataError(error instanceof Error ? error.message : "Failed to load multipliers")
        // Keep using defaults if there's an error
        setMultiplierRanges(DEFAULT_MULTIPLIER_RANGES)
      } finally {
        setIsLoadingData(false)
      }
    }

    fetchMultiplierData()
  }, [])

  return {
    multiplierRanges,
    isLoadingData,
    dataError,
    useDefaultAlgorithm,
  }
}
