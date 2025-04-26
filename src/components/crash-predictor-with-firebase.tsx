
"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Flame, History, Table, ChevronDown, ChevronUp, Sparkles, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import type { Particle } from "@/components/types/particles"
import type { MultiplierRange } from "@/components/types/multiplier"
import useAutoLogout from "@/components/auth/useAutoLogout"
import { db } from "./firebase-config"
import { collection, addDoc } from "firebase/firestore"

// Default multiplier ranges to use if API fails
const DEFAULT_MULTIPLIER_RANGES: MultiplierRange[] = [
  { min: 0.1, max: 3.0, probability: 0.75 },
  { min: 3.1, max: 6.0, probability: 0.2 },
  { min: 6.1, max: 11.0, probability: 0.04 },
  { min: 11.1, max: 20.0, probability: 0.01 },
]

export default function MiniCrash() {
  const router = useRouter()
  const [multiplier, setMultiplier] = useState<number | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showMultiplier, setShowMultiplier] = useState(false)
  const [countingMultiplier, setCountingMultiplier] = useState(0)
  const [isCounting, setIsCounting] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const animationFrameIdRef = useRef<number | null>(null)
  const crashPointRef = useRef<number>(0)
  const [showProbabilities, setShowProbabilities] = useState(false)
  const [showHistory, setShowHistory] = useState(true)

  // State for multiplier data from API
  const [multiplierRanges, setMultiplierRanges] = useState<MultiplierRange[]>(DEFAULT_MULTIPLIER_RANGES)
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [dataError, setDataError] = useState<string | null>(null)
  const [useDefaultAlgorithm, setUseDefaultAlgorithm] = useState(true)

  // State for crash history
  const [isSavingCrash, setIsSavingCrash] = useState(false)
  const [crashSaveError, setCrashSaveError] = useState<string | null>(null)
  const [crashHistory, setCrashHistory] = useState<any[]>([])

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
          console.log("Using default crash algorithm")
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

  // Auto logout check
  useEffect(() => {
    const loginTime = localStorage.getItem("loginTime")
    const token = localStorage.getItem("token")

    if (!token || !loginTime) return

    const checkSessionExpiry = () => {
      const currentTime = new Date().getTime()
      const loginTimeMs = Number.parseInt(loginTime, 10)
      const sessionDuration = 30 * 60 * 1000 // 30 minutes in milliseconds

      if (currentTime - loginTimeMs > sessionDuration) {
        handleBack()
      }
    }

    const interval = setInterval(checkSessionExpiry, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [])

  // Initialize canvas and handle resize
  useEffect(() => {
    // Initialize particles
    const initParticles = () => {
      const newParticles: Particle[] = []
      for (let i = 0; i < 100; i++) {
        newParticles.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          size: Math.random() * 3,
          speedX: (Math.random() - 0.5) * 0.3,
          speedY: (Math.random() - 0.5) * 0.3,
        })
      }
      particlesRef.current = newParticles
    }

    initParticles()

    // Handle window resize
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth
        canvasRef.current.height = window.innerHeight
      }
    }

    window.addEventListener("resize", handleResize)
    return () => {
      window.removeEventListener("resize", handleResize)
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current)
      }
    }
  }, [])

  // Animate star particles
  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const animate = () => {
      if (!ctx) return

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Create a gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
      gradient.addColorStop(0, "rgba(20, 20, 35, 0.8)")
      gradient.addColorStop(1, "rgba(10, 10, 20, 0.8)")
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const particles = particlesRef.current

      for (let i = 0; i < particles.length; i++) {
        const particle = particles[i]

        particle.x += particle.speedX
        particle.y += particle.speedY

        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.width
        if (particle.x > canvas.width) particle.x = 0
        if (particle.y < 0) particle.y = canvas.height
        if (particle.y > canvas.height) particle.y = 0

        // Create a glow effect
        const glow = ctx.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, particle.size * 2)
        glow.addColorStop(0, "rgba(255, 255, 255, 0.8)")
        glow.addColorStop(1, "rgba(255, 255, 255, 0)")

        ctx.fillStyle = glow
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2)
        ctx.fill()

        // Draw the star
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)"
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size / 2, 0, Math.PI * 2)
        ctx.fill()
      }

      animationFrameIdRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current)
      }
    }
  }, [])

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

  useAutoLogout()
  const handleBack = () => {
    router.replace("/home")
  }

  // Convert probability from decimal (0-1) to percentage (0-100) for display
  const formatProbability = (prob: number): string => {
    const percentage = prob > 1 ? prob : prob * 100
    return `${Math.round(percentage)}%`
  }

  return (
    <div className="relative w-full min-h-screen flex flex-col items-center justify-center overflow-hidden">
      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />

      {/* Glass overlay for better readability */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-purple-900/10 to-blue-900/10 backdrop-blur-[2px]"></div>

      {/* Logout button */}
      <div className="absolute top-4 right-4 z-20">
        <Button
          onClick={handleBack}
          variant="outline"
          size="sm"
          className="bg-black/30 backdrop-blur-md border border-white/20 text-white hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-4 w-4 mr-2" />
         Back
        </Button>
      </div>

      <div className="relative z-10 w-full max-w-md flex flex-col items-center justify-center px-4 py-8">
        {/* Game title */}
        <div className="flex flex-col items-center justify-center text-center mb-4">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500">
            <img src="/LOGO CRASH-02.png" alt="Logo" className="mx-auto" />
          </h1>
          <img src="/aviator.png" className="h-28 mx-auto" alt="Aviator" />
        </div>

        {isLoadingData ? (
          <div className="w-full max-w-sm bg-black/30 backdrop-blur-md rounded-xl p-6 border border-white/10 shadow-xl mb-6">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse delay-150"></div>
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse delay-300"></div>
              <span className="text-white ml-2">Loading game data...</span>
            </div>
          </div>
        ) : dataError ? (
          <div className="w-full max-w-sm bg-red-900/30 backdrop-blur-md rounded-xl p-4 border border-red-500/30 shadow-xl mb-6">
            <div className="text-red-300 text-center">
              <p className="font-bold">Error loading game data</p>
              <p className="text-sm">{dataError}</p>
              <p className="text-xs mt-1 text-red-400">Using default values</p>
            </div>
          </div>
        ) : null}

        <div className="relative w-full flex flex-col items-center justify-center mb-8">
          <AnimatePresence>
            {showMultiplier && (
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                className="relative"
              >
                {/* Outer glow effect */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-500 to-pink-500 blur-xl opacity-30 scale-125" />

                {/* Animated ring */}
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-red-500/50 scale-[1.15]"
                  animate={{
                    rotate: 360,
                    borderColor: ["rgba(239,68,68,0.5)", "rgba(236,72,153,0.5)", "rgba(239,68,68,0.5)"],
                  }}
                  transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                />

                {/* Inner circle with pulsing animation */}
                <motion.div
                  className="w-48 h-48 rounded-full border-4 border-red-500 flex items-center justify-center bg-gradient-to-br from-red-900/40 to-pink-900/40 backdrop-blur-sm relative"
                  animate={{
                    boxShadow: [
                      "0 0 10px 2px rgba(239,68,68,0.6), inset 0 0 15px rgba(239,68,68,0.3)",
                      "0 0 20px 5px rgba(239,68,68,0.6), inset 0 0 25px rgba(239,68,68,0.3)",
                      "0 0 10px 2px rgba(239,68,68,0.6), inset 0 0 15px rgba(239,68,68,0.3)",
                    ],
                  }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                >
                  {/* Flame effect at the top */}
                  <motion.div
                    className="absolute -top-10 text-red-500"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.8, 1, 0.8],
                    }}
                    transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                  >
                    <Flame size={50} className="text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                  </motion.div>

                  {/* Sparkles around the multiplier */}
                  <motion.div
                    className="absolute -top-4 -right-4"
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.6, 1, 0.6],
                    }}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, delay: 0.5 }}
                  >
                    <Sparkles size={20} className="text-yellow-400" />
                  </motion.div>

                  <motion.div
                    className="absolute -bottom-2 -left-4"
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.6, 1, 0.6],
                    }}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, delay: 1 }}
                  >
                    <Sparkles size={20} className="text-yellow-400" />
                  </motion.div>

                  {/* Multiplier text with gradient */}
                  <div className="flex flex-col items-center">
                    <div className="text-white text-5xl font-bold drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-red-500">
                        {countingMultiplier.toFixed(2)} X
                      </span>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="w-full max-w-sm z-10">
          <Button
            onClick={handleStart}
            disabled={isAnimating || isLoadingData || isSavingCrash}
            className="relative overflow-hidden bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-bold py-4 px-12 rounded-full w-full shadow-[0_0_15px_rgba(239,68,68,0.6)] transition-all duration-300 ease-out transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoadingData ? (
              <span className="flex items-center justify-center">
                <motion.div
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                />
                Loading...
              </span>
            ) : isSavingCrash ? (
              <span className="flex items-center justify-center">
                <motion.div
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                />
                Saving...
              </span>
            ) : (
              <>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-transparent"
                  animate={{
                    x: ["100%", "-100%"],
                  }}
                  transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, repeatType: "loop" }}
                />
                START
              </>
            )}
          </Button>

          {crashSaveError && (
            <div className="mt-2 text-red-400 text-xs text-center bg-red-900/30 backdrop-blur-sm p-2 rounded-md border border-red-500/30">
              Error saving crash data: {crashSaveError}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 w-full text-center text-gray-500 text-xs mt-8 mb-4">
        <p>© {new Date().getFullYear()} Mini Crash Game. All rights reserved.</p>
      </div>
    </div>
  )
}
