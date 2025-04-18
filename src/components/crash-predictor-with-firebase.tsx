"use client"

import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
// // Add Firebase imports at the top of the file
import { db } from "./firebase-config"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { useRouter } from "next/navigation"


type MultiplierRange = {
  id: string
  min: number
  max: number
  probability: number
}

type Preset = {
  id?: string
  value: number
  label: string
}

export default function CrashGame() {
  // Game state
  const [betAmount, setBetAmount] = useState(1.0)
  const [cashoutMultiplier, setCashoutMultiplier] = useState(2.0)
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [hasCrashed, setHasCrashed] = useState(false)
  const [isBetting, setIsBetting] = useState(false)
  const [multiplier, setMultiplier] = useState(1.0)
  const [profit, setProfit] = useState<number | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [winRate, setWinRate] = useState<number | null>(null)
  const [expectedValue, setExpectedValue] = useState<number | null>(null)
  const [isPointRevealed, setIsPointRevealed] = useState(false)
  const [showGridAnimation, setShowGridAnimation] = useState(false)
  const [demoMode, setDemoMode] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [activeTab, setActiveTab] = useState<"bet" | "auto">("bet")
  const [betPlaced, setBetPlaced] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string>("")

  // Initialize with default presets that will be replaced when data loads
  const [presets, setPresets] = useState<Preset[]>([
    { value: 10.0, label: "10.00" },
    { value: 20.0, label: "20.00" },
    { value: 50.0, label: "50.00" },
    { value: 100.0, label: "100.00" },
    { value: 200.0, label: "200.00" },
  ])

  const [multiplierRanges, setMultiplierRanges] = useState<MultiplierRange[]>([])
  const [useDefaultAlgorithm, setUseDefaultAlgorithm] = useState(true)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [dataError, setDataError] = useState<string | null>(null)

  // Canvas and animation refs
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const crashPointRef = useRef(generateCrashPoint())
  const startTimeRef = useRef<number>(0)
  const planeRef = useRef<HTMLImageElement | null>(null)
  const animationStartTimeRef = useRef<number>(0)
  const gameSpeedFactor = useRef<number>(0.3)
  const shakeOffsetRef = useRef({ x: 0, y: 0 })
  const planeShakePhaseRef = useRef(0)
  const zoomFactorRef = useRef<number>(1.0)
  const zoomDirectionRef = useRef<number>(1)
  const zoomSpeedRef = useRef<number>(0.002)
  const crashAnimationRef = useRef<number>(0)
  const restartTimerRef = useRef<NodeJS.Timeout | null>(null)
  const revealTimerRef = useRef<NodeJS.Timeout | null>(null)
  const gridAnimationProgressRef = useRef(0)
  const gridCellsRef = useRef<Array<{ x: number; y: number; delay: number; color: string }>>([])
  const gridAnimationRef = useRef<number>(0)

  // Aircraft dimensions
  const aircraftWidth = 60
  const aircraftHeight = 30

  // Border padding to prevent overflow
  const borderPadding = Math.max(aircraftWidth, aircraftHeight) / 2 + 10
  const rightPadding = 20

  // Fetch game data from API
  useEffect(() => {
    const fetchGameData = async () => {
      setIsLoadingData(true)
      setDataError(null)

      try {
        console.log("Fetching game data...")

        // Fetch presets
        try {
          const presetsResponse = await fetch("/api/game-presets")
          if (!presetsResponse.ok) {
            throw new Error(`Failed to fetch presets: ${presetsResponse.status} ${presetsResponse.statusText}`)
          }

          const presetsData = await presetsResponse.json()
          console.log("Presets data:", presetsData)

          if (Array.isArray(presetsData) && presetsData.length > 0) {
            setPresets(presetsData)
          } else {
            console.warn("Received empty or invalid presets data, using defaults")
          }
        } catch (error) {
          console.error("Error fetching presets:", error)
          setDataError(error instanceof Error ? error.message : "Failed to load presets")
        }

        // Fetch multiplier ranges
        try {
          const multipliersResponse = await fetch("/api/crash-multipliers")
          if (!multipliersResponse.ok) {
            throw new Error(
              `Failed to fetch multipliers: ${multipliersResponse.status} ${multipliersResponse.statusText}`,
            )
          }

          const multipliersData = await multipliersResponse.json()
          console.log("Multipliers data:", multipliersData)

          setUseDefaultAlgorithm(multipliersData.useDefault)

          if (
            !multipliersData.useDefault &&
            multipliersData.multipliers &&
            Array.isArray(multipliersData.multipliers)
          ) {
            setMultiplierRanges(multipliersData.multipliers)

            // Validate total probability
            const totalProb = multipliersData.multipliers.reduce(
              (sum: number, m: MultiplierRange) => sum + m.probability,
              0,
            )
            if (Math.abs(totalProb - 100) > 1) {
              console.warn(`Total probability (${totalProb}%) does not add up to 100%. This may affect game balance.`)
            }
          } else {
            console.log("Using default crash algorithm")
          }
        } catch (error) {
          console.error("Error fetching multipliers:", error)
          setDataError(error instanceof Error ? error.message : "Failed to load multipliers")
        }
      } catch (error) {
        console.error("Error fetching game data:", error)
        setDataError(error instanceof Error ? error.message : "Failed to load game data")
        // Keep using defaults if there's an error
      } finally {
        setIsLoadingData(false)
      }
    }

    fetchGameData()
  }, [])

  useEffect(() => {
    // Initialize canvas with background
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext("2d")
      if (ctx) {
        // Draw initial background
        drawRadialBackground(ctx, canvas.width, canvas.height, { x: 0, y: 0 }, 1.0)
      }
    }

    return () => {
      // Ensure all animations are properly canceled
      isRunningRef.current = false
      cancelAnimationFrame(animationRef.current)
      cancelAnimationFrame(crashAnimationRef.current)
      cancelAnimationFrame(gridAnimationRef.current)
      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current)
      }
      if (revealTimerRef.current) {
        clearTimeout(revealTimerRef.current)
      }
    }
  }, [])

  // Initialize grid cells for animation
  function initializeGridCells() {
    const cells: Array<{ x: number; y: number; delay: number; color: string }> = []
    const gridSize = 12 // 12x12 grid
    const colors = ["#ff0033", "#ff3333", "#ff6633", "#ff9933", "#ffcc33", "#ffff33"]

    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        // Calculate delay based on distance from center
        const centerX = gridSize / 2 - 0.5
        const centerY = gridSize / 2 - 0.5
        const distanceFromCenter = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2))
        const delay = distanceFromCenter * 0.1 // Delay increases with distance from center

        // Randomly select a color
        const color = colors[Math.floor(Math.random() * colors.length)]

        cells.push({
          x,
          y,
          delay,
          color,
        })
      }
    }

    gridCellsRef.current = cells
  }

  // Function to animate the grid
  function animateGrid(ctx: CanvasRenderingContext2D, width: number, height: number) {
    if (!showGridAnimation) {
      cancelAnimationFrame(gridAnimationRef.current)
      return
    }

    // Increase animation progress
    gridAnimationProgressRef.current += 0.02
    if (gridAnimationProgressRef.current > 1) {
      gridAnimationProgressRef.current = 0
    }

    const gridSize = 12
    const cellWidth = width / gridSize
    const cellHeight = height / gridSize

    // Draw each cell with its own animation
    gridCellsRef.current.forEach((cell) => {
      // Calculate cell animation progress with delay
      let cellProgress = gridAnimationProgressRef.current - cell.delay
      if (cellProgress < 0) cellProgress += 1 // Wrap around

      // Skip cells that haven't started animating yet
      if (cellProgress < 0) return

      // Calculate opacity based on sine wave for pulsing effect
      const opacity = Math.sin(cellProgress * Math.PI) * 0.7

      // Skip cells that are not visible
      if (opacity <= 0) return

      // Draw cell
      ctx.fillStyle =
        cell.color +
        Math.floor(opacity * 255)
          .toString(16)
          .padStart(2, "0")

      // Calculate cell position and size with animation
      const scale = 0.5 + Math.sin(cellProgress * Math.PI) * 0.5
      const xPos = cell.x * cellWidth + (cellWidth * (1 - scale)) / 2
      const yPos = cell.y * cellHeight + (cellHeight * (1 - scale)) / 2
      const cellWidthScaled = cellWidth * scale
      const cellHeightScaled = cellHeight * scale

      ctx.fillRect(xPos, yPos, cellWidthScaled, cellHeightScaled)
    })

    // Continue animation
    gridAnimationRef.current = requestAnimationFrame(() => {
      if (ctx && showGridAnimation) {
        animateGrid(ctx, width, height)
      }
    })
  }

  function generateCrashPoint() {
    // If we're using custom multiplier ranges from API
    if (!useDefaultAlgorithm && multiplierRanges.length > 0) {
      const rand = Math.random() * 100
      let cumulativeProbability = 0

      for (const range of multiplierRanges) {
        cumulativeProbability += range.probability
        if (rand < cumulativeProbability) {
          // Generate a random value within this range
          return range.min + Math.random() * (range.max - range.min)
        }
      }

      // Fallback to default if something went wrong
      console.warn("Falling back to default algorithm - couldn't determine crash point from ranges")
      return defaultGenerateCrashPoint()
    } else {
      // Use the default algorithm
      return defaultGenerateCrashPoint()
    }
  }

  function defaultGenerateCrashPoint() {
    const rand = Math.random() * 100

    if (rand < 75) {
      // 75% chance: 1.01 to 3.00
      return 1.01 + Math.random() * 1.99
    } else if (rand < 95) {
      // 20% chance: 3.01 to 6.00
      return 3.01 + Math.random() * 2.99
    } else if (rand < 99) {
      // 4% chance: 6.01 to 11.00
      return 6.01 + Math.random() * 4.99
    } else {
      // 1% chance: 11.01 to 100.00
      return 11.01 + Math.random() * 88.99
    }
  }

  // New function to start game with delay
  function startGameWithDelay() {
    // Set starting state
    setIsStarting(true)
    hasSavedDataRef.current = false

    // Generate crash point immediately but don't start animation yet
    const newCrashPoint = generateCrashPoint()
    crashPointRef.current = newCrashPoint

    console.log("Generated crash point:", crashPointRef.current.toFixed(2))
    setDebugInfo(`Crash point: ${crashPointRef.current.toFixed(2)}x`)

    // Wait 1 second before starting the game
    setTimeout(() => {
      setIsStarting(false)
      startGame()
    }, 1000)
  }

  const isRunningRef = useRef(false)
  function startGame() {
    isRunningRef.current = true
    setIsRunning(true)
    hasSavedDataRef.current = false
    setHasCrashed(false)
    setShowGridAnimation(false)
    gridAnimationProgressRef.current = 0
    setProfit(null)
    setIsPointRevealed(false)
    startTimeRef.current = Date.now()
    animationStartTimeRef.current = Date.now()
    setMultiplier(1.0)
    shakeOffsetRef.current = { x: 0, y: 0 }
    planeShakePhaseRef.current = 0
    zoomFactorRef.current = 1.0
    zoomDirectionRef.current = 1
    setSaveError(null)

    // Reinitialize grid cells for a new pattern each game
    initializeGridCells()

    // Cancel any existing animation frame before starting a new one
    cancelAnimationFrame(animationRef.current)

    // Start the animation
    drawGraph()
  }

  // Add a new function to start the game when the Start Game button is clicked
  function startBettingGame() {
    if (demoMode || betPlaced) {
      setBetPlaced(false)
      startGameWithDelay()
    }
  }

  // Add a reset function to cancel a placed bet
  function cancelBet() {
    setBetPlaced(false)
    setIsBetting(false)
  }

  // Update the placeBet function to set betPlaced to true instead of starting the game
  function placeBet() {
    if (isRunning || isStarting) return

    // Exit demo mode when user places a bet
    if (demoMode) {
      setDemoMode(false)
    }

    // Instead of starting the game, just mark that a bet is placed
    setBetPlaced(true)
    setIsBetting(true)
  }

  const hasSavedDataRef = useRef(false)

  async function cashOut() {
    if (isBetting && isRunning && !hasSavedDataRef.current) {
      hasSavedDataRef.current = true // prevent further execution
      setIsBetting(false)
      const winAmount = betAmount * multiplier
      const profitValue = winAmount - betAmount

      const numSimulations = 10000
      let wins = 0
      let totalProfit = 0

      for (let i = 0; i < numSimulations; i++) {
        const simCrashPoint = generateCrashPoint()
        const win = simCrashPoint >= crashPointRef.current
        const simProfit = win ? betAmount * (crashPointRef.current - 1) : -betAmount
        if (win) wins++
        totalProfit += simProfit
      }

      const winRateValue = (wins / numSimulations) * 100
      const expectedValueResult = totalProfit / numSimulations

      setProfit(profitValue)
      setWinRate(winRateValue)
      setExpectedValue(expectedValueResult)
      setShowResults(true)

      const crashData = {
        timestamp: new Date().toISOString(),
        crashPoint: crashPointRef.current,
        betAmount,
        cashoutMultiplier,
        userCashedOut: true,
        winRate: winRateValue,
        expectedValue: expectedValueResult,
        profit: profitValue,
      }

      console.log("💾 Saving crash data:", crashData)

      // try {
      //   setIsSaving(true)
      //   await saveCrashData(crashData)
      //   console.log("✅ Crash data saved to backend")
      // } catch (error) {
      //   console.error("❌ Error saving crash data:", error)
      //   setSaveError("Failed to save crash data to backend")
      // } finally {
      //   setIsSaving(false)
      // }
    }
  }

  function calculateStatistics() {
    // Run simulations to calculate win rate and expected value
    const numSimulations = 10000
    let wins = 0
    let totalProfit = 0

    for (let i = 0; i < numSimulations; i++) {
      const simCrashPoint = generateCrashPoint()
      const win = simCrashPoint >= crashPointRef.current
      const profit = win ? betAmount * (crashPointRef.current - 1) : -betAmount

      if (win) wins++
      totalProfit += profit
    }

    const winRateValue = (wins / numSimulations) * 100
    const expectedValueResult = totalProfit / numSimulations

    setWinRate(winRateValue)
    setExpectedValue(expectedValueResult)
  }

  // New function to reveal the crash point
  function revealCrashPoint() {
    if ((isBetting || demoMode) && isRunning) {
      setIsPointRevealed(true)

      // Auto-hide the revealed point after 3 seconds
      if (revealTimerRef.current) {
        clearTimeout(revealTimerRef.current)
      }

      revealTimerRef.current = setTimeout(() => {
        setIsPointRevealed(false)
      }, 3000)
    }
  }

  // Calculate shake offset based on multiplier
  function calculateShakeOffset(multiplier: number) {
    const baseShakeIntensity = Math.min(3, (multiplier - 1) * 0.5)
    if (baseShakeIntensity <= 0) return { x: 0, y: 0 }

    return {
      x: (Math.random() * 2 - 1) * baseShakeIntensity,
      y: (Math.random() * 2 - 1) * baseShakeIntensity,
    }
  }

  // Calculate aircraft shake with more pronounced up-and-down movement
  function calculateAircraftShake(multiplier: number, phase: number) {
    const baseIntensity = Math.min(4, (multiplier - 1) * 0.8 + 0.5)
    planeShakePhaseRef.current = (phase + 0.1) % (Math.PI * 2)

    const verticalShake = Math.sin(phase) * baseIntensity * 1.5
    const horizontalShake = Math.cos(phase * 1.3) * baseIntensity * 0.5

    return {
      x: horizontalShake,
      y: verticalShake,
    }
  }

  // Draw the blue radial background
  function drawRadialBackground(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    shakeOffset: { x: number; y: number },
    multiplier: number,
  ) {
    ctx.save()
    ctx.translate(shakeOffset.x, shakeOffset.y)

    // Update zoom factor
    if (isRunning && !hasCrashed) {
      zoomFactorRef.current += zoomSpeedRef.current * zoomDirectionRef.current

      if (zoomFactorRef.current > 1.2) {
        zoomDirectionRef.current = -1
      } else if (zoomFactorRef.current < 0.9) {
        zoomDirectionRef.current = 1
      }

      zoomSpeedRef.current = 0.002 + (multiplier - 1) * 0.0005
    } else if (hasCrashed) {
      zoomFactorRef.current = Math.max(0.8, zoomFactorRef.current - 0.01)
    }

    // Fill with solid dark blue first
    ctx.fillStyle = "#000" // Black background
    ctx.fillRect(-shakeOffset.x, -shakeOffset.y, width, height)

    // Apply zoom transformation
    const zoom = zoomFactorRef.current
    ctx.translate(width / 2, height / 2)
    ctx.scale(zoom, zoom)
    ctx.translate(-width / 2, -height / 2)

    // Draw sunburst/radial rays
    const centerX = width / 2
    const centerY = height / 2
    const numRays = 36

    for (let i = 0; i < numRays; i++) {
      const angle = (i * 2 * Math.PI) / numRays
      const rayWidth = Math.PI / numRays

      const rayGradient = ctx.createLinearGradient(
        centerX,
        centerY,
        centerX + Math.cos(angle) * width * 1.5,
        centerY + Math.sin(angle) * height * 1.5,
      )

      // Darker blue colors to match the image
      rayGradient.addColorStop(0, "rgba(10, 30, 60, 0.7)")
      rayGradient.addColorStop(0.3, "rgba(5, 15, 40, 0.5)")
      rayGradient.addColorStop(1, "rgba(0, 5, 20, 0.9)")

      ctx.fillStyle = rayGradient

      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.arc(centerX, centerY, Math.max(width, height) * 1.5, angle - rayWidth, angle + rayWidth)
      ctx.closePath()
      ctx.fill()
    }

    // Add a subtle blue radial gradient overlay for the glow effect
    const glowGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, width * 0.7)
    glowGradient.addColorStop(0, "rgba(20, 60, 120, 0.15)")
    glowGradient.addColorStop(0.5, "rgba(10, 30, 60, 0.1)")
    glowGradient.addColorStop(1, "rgba(0, 0, 0, 0)")

    ctx.fillStyle = glowGradient
    ctx.fillRect(-shakeOffset.x, -shakeOffset.y, width, height)

    ctx.restore()
  }

  async function drawGraph() {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Calculate current multiplier based on time with reduced speed
    const elapsed = ((Date.now() - startTimeRef.current) / 100) * gameSpeedFactor.current
    const newMultiplier = Math.pow(1.06, elapsed)

    // If game just started, update state to reflect this
    if (!isRunning) {
      setIsRunning(true)
      setHasCrashed(false)
      setShowResults(false)
      setMultiplier(1.0)
      setProfit(null)
    }

    // Calculate shake offset based on multiplier
    shakeOffsetRef.current = calculateShakeOffset(newMultiplier)

    // Draw background with shake effect
    drawRadialBackground(ctx, canvas.width, canvas.height, shakeOffsetRef.current, newMultiplier)

    // Debug info - update current multiplier and crash point
    setDebugInfo(`Current: ${newMultiplier.toFixed(2)}x | Crash at: ${crashPointRef.current.toFixed(2)}x`)

    // Check if crashed - THIS IS THE KEY PART THAT NEEDS FIXING
    if (newMultiplier >= crashPointRef.current && isRunningRef.current) {
      console.log(
        `CRASH DETECTED: Current multiplier ${newMultiplier.toFixed(2)} >= Crash point ${crashPointRef.current.toFixed(2)}`,
      )

      isRunningRef.current = false
      setIsRunning(false)
      setHasCrashed(true)
      setShowGridAnimation(true)

      // Start grid animation
      animateGrid(ctx, canvas.width, canvas.height)

      // Auto cashout if betting
      if (isBetting) {
        cashOut()
        setShowResults(true)
      } else {
        calculateStatistics()
        setShowResults(true)
      }

      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current)
      }

      const width = canvas.width
      const height = canvas.height

      ctx.font = "bold 48px Arial"
      ctx.fillStyle = "#ff0033"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(`${crashPointRef.current.toFixed(2)}x`, width / 2, height / 2 - 40)

      ctx.font = "bold 24px Arial"
      ctx.fillText("CRASHED", width / 2, height / 2)

      if (!showResults) {
        ctx.font = "bold 18px Arial"
        ctx.fillStyle = "#ffffff"
        ctx.fillText("Click to Play Again", width / 2, height / 2 + 40)
      }

      // Save crash data to backend when game crashes
      if (!hasSavedDataRef.current) {
        hasSavedDataRef.current = true

        // Calculate statistics directly instead of using state values
        const numSimulations = 10000
        let wins = 0
        let totalProfit = 0

        for (let i = 0; i < numSimulations; i++) {
          const simCrashPoint = generateCrashPoint()
          const win = simCrashPoint >= crashPointRef.current
          const profit = win ? betAmount * (crashPointRef.current - 1) : -betAmount

          if (win) wins++
          totalProfit += profit
        }

        const calculatedWinRate = (wins / numSimulations) * 100
        const calculatedExpectedValue = totalProfit / numSimulations

        // Update state for display
        setWinRate(calculatedWinRate)
        setExpectedValue(calculatedExpectedValue)

        const crashData = {
          timestamp: new Date().toISOString(),
          crashPoint: crashPointRef.current,
          betAmount: isBetting ? betAmount : 0,
          cashoutMultiplier: isBetting ? cashoutMultiplier : 0,
          userCashedOut: false,
          winRate: calculatedWinRate,
          expectedValue: calculatedExpectedValue,
          profit: -betAmount,
        }

        console.log("💾 Saving crash data on crash:", crashData)

        try {
          await addDoc(collection(db, "crashHistory"), crashData)
          console.log("✅ Crash data saved to Firebase")
        } catch (error) {
          console.error("❌ Error saving crash data:", error)
        }
      }

      return
    }

    if (isBetting && newMultiplier >= cashoutMultiplier && isRunning) {
      cashOut()
    }

    setMultiplier(Number.parseFloat(newMultiplier.toFixed(2)))

    const height = canvas.height
    const width = canvas.width
    const animationDuration = 6000
    const animationProgress = Math.min(1, (Date.now() - animationStartTimeRef.current) / animationDuration)
    const easedProgressValue = 1 - (1 - animationProgress) * (1 - animationProgress)
    const maxProgressWidth = width - borderPadding - rightPadding
    const progressWidth = Math.min(maxProgressWidth, width * easedProgressValue)

    const curvePoints: { x: number; y: number }[] = []
    ctx.beginPath()
    ctx.moveTo(0, height)

    for (let x = 0; x <= progressWidth; x++) {
      const xPercent = x / width
      const exponent = 2.5
      const curveY = Math.pow(xPercent, exponent)
      const y = Math.max(borderPadding, height - curveY * height * 0.9 * easedProgressValue)

      ctx.lineTo(x, y)
      curvePoints.push({ x, y })
    }

    ctx.lineTo(progressWidth, height)
    ctx.closePath()

    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, "rgba(255, 0, 51, 0.9)")
    gradient.addColorStop(1, "rgba(255, 0, 51, 0.3)")
    ctx.fillStyle = gradient
    ctx.fill()

    ctx.beginPath()
    ctx.moveTo(0, height)

    for (let x = 0; x <= progressWidth; x++) {
      const xPercent = x / width
      const exponent = 2.5
      const curveY = Math.pow(xPercent, exponent)
      const y = Math.max(borderPadding, height - curveY * height * 0.9 * easedProgressValue)
      ctx.lineTo(x, y)
    }

    ctx.strokeStyle = "#ff0033"
    ctx.lineWidth = 4
    ctx.stroke()

    if (curvePoints.length > 0 && !hasCrashed) {
      const planePosition = curvePoints[curvePoints.length - 1]
      const planeShake = calculateAircraftShake(newMultiplier, planeShakePhaseRef.current)

      ctx.save()
      ctx.translate(planePosition.x + planeShake.x, planePosition.y + planeShake.y)

      if (planeRef.current) {
        const imgWidth = aircraftWidth
        const imgHeight = aircraftHeight
        ctx.drawImage(planeRef.current, -imgWidth / 2, -imgHeight / 2, imgWidth, imgHeight)
      } else {
        ctx.fillStyle = "#ff0033"
        ctx.beginPath()
        ctx.moveTo(15, 0)
        ctx.lineTo(-15, -8)
        ctx.lineTo(-25, 0)
        ctx.lineTo(-15, 8)
        ctx.closePath()
        ctx.fill()

        ctx.beginPath()
        ctx.moveTo(0, -5)
        ctx.lineTo(-5, -20)
        ctx.lineTo(-15, -20)
        ctx.lineTo(-10, -5)
        ctx.closePath()
        ctx.fill()

        ctx.beginPath()
        ctx.moveTo(0, 5)
        ctx.lineTo(-5, 20)
        ctx.lineTo(-15, 20)
        ctx.lineTo(-10, 5)
        ctx.closePath()
        ctx.fill()

        ctx.beginPath()
        ctx.moveTo(-20, 0)
        ctx.lineTo(-30, -10)
        ctx.lineTo(-35, -10)
        ctx.lineTo(-25, 0)
        ctx.closePath()
        ctx.fill()
      }

      ctx.restore()
    }

    ctx.globalAlpha = animationProgress
    ctx.font = "bold 64px Arial"
    ctx.fillStyle = "#ffffff"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(`${newMultiplier.toFixed(2)}x`, width / 2, height / 2)
    ctx.globalAlpha = 1.0

    if (profit !== null) {
      ctx.font = "bold 24px Arial"
      ctx.fillStyle = "#00ff00"
      ctx.fillText(`+${profit.toFixed(2)}`, width / 2, height / 2 - 40)
    }

    // Continue animation only if still running
    if (isRunningRef.current) {
      animationRef.current = requestAnimationFrame(drawGraph)
    }
  }

  function decreaseBet() {
    setBetAmount((prev) => Math.max(0.1, prev - 1))
    setSelectedPreset(null)
  }

  function increaseBet() {
    setBetAmount((prev) => prev + 1)
    setSelectedPreset(null)
  }

  function selectPreset(value: number, index: number) {
    setBetAmount(value)
    setSelectedPreset(index)
  }

  function decreaseCashout() {
    if (isBetting) return
    setCashoutMultiplier((prev) => Math.max(1.1, prev - 0.1))
  }

  function increaseCashout() {
    if (isBetting) return
    setCashoutMultiplier((prev) => prev + 0.1)
  }

  function resetGame() {
    setIsBetting(false)
    setIsRunning(false)
    setHasCrashed(false)
    setShowResults(false)
    setMultiplier(1.0)
    setProfit(null)
    window.location.reload()
    // Start a new game with delay
    startGameWithDelay()
  }

  // Handle canvas click for restarting the game
  function handleCanvasClick() {
    if (hasCrashed && !showResults) {
      resetGame()
    }
  }

  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem("token") // Remove token from localStorage
    router.replace("/login")
  }

  return (
    <div className="w-full max-w-4xl">
      <div className="bg-amber-500 text-white font-bold py-2 rounded-t-lg flex justify-between items-center px-4">
        <span className="text-center w-full">FUN MODE</span>
        <button onClick={handleLogout} className="text-sm bg-gray-300 text-black px-3 py-1 rounded-lg">
          Logout
        </button>
      </div>

      {/* Debug info */}
      <div className="bg-gray-800 hidden text-white text-xs p-1">{debugInfo}</div>

      {/* Game area */}
      <div className="relative bg-gray-950 h-[400px] w-full overflow-hidden">
        <canvas
          ref={canvasRef}
          width={800}
          height={400}
          className="w-full h-full cursor-pointer"
          onClick={handleCanvasClick}
        />

        {/* Start Game button when bet is placed */}
        {betPlaced && !isRunning && !isStarting && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center space-y-4">
              <Button
                onClick={() => {
                  setDemoMode(true)
                  startBettingGame()
                }}
                className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Start Demo
              </Button>

              <button
                onClick={cancelBet}
                className="px-4 py-2 text-sm font-medium bg-gray-700 hover:bg-gray-600 text-white rounded-md"
              >
                Cancel Bet
              </button>
            </div>
          </div>
        )}

        {/* Starting delay overlay */}
        {isStarting && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
            <div className="text-white text-2xl font-bold animate-pulse">Starting in 1 second...</div>
          </div>
        )}

        {/* Play Again button when crashed */}
        {hasCrashed && !showResults && (
          <button
            onClick={resetGame}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 mt-20
                      bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-8 rounded-md
                      text-xl animate-pulse"
          >
            PLAY AGAIN
          </button>
        )}

        {/* Crash point reveal overlay */}
        {isPointRevealed && isRunning && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-black bg-opacity-70 p-6 rounded-lg text-center">
              <div className="text-amber-500 text-2xl font-bold mb-2">CRASH POINT</div>
              <div className="text-amber-500 text-5xl font-bold">{crashPointRef.current.toFixed(2)}x</div>
            </div>
          </div>
        )}

        {/* Loading overlay */}
        {isLoadingData && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
            <div className="text-center">
              <div className="text-white text-lg">Loading game data...</div>
            </div>
          </div>
        )}

        {/* Error overlay */}
        {dataError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
            <div className="bg-red-900 bg-opacity-80 p-4 rounded-lg max-w-md text-center">
              <div className="text-white text-lg mb-2">Error loading game data</div>
              <div className="text-red-200 text-sm">{dataError}</div>
              <div className="text-white text-sm mt-2">Using default settings instead</div>
            </div>
          </div>
        )}

        {/* Save error notification */}
        {saveError && (
          <div className="absolute top-4 right-4 bg-red-600 text-white p-2 rounded-md text-sm">{saveError}</div>
        )}
      </div>

      {/* Results overlay */}
      {showResults && (
        <div className="absolute inset-0 flex items-center justify-center h-screen max-w-full bg-gray-950 bg-opacity-90">
          <div className="bg-gray-700 p-8 rounded-lg text-center w-3/4 max-w-md">
            <h2 className="text-2xl font-bold text-white mb-2">Simulation Results</h2>

            {/* Add crash point display at the top */}
            <div className="mb-6 p-3 rounded-lg">
              <h3 className="text-gray-400 text-sm">Crash Point</h3>
              <p className="text-5xl font-bold text-red-500">{crashPointRef.current.toFixed(2)}x</p>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-gray-400 text-sm">Win Rate</h3>
                <p className="text-4xl font-bold text-green-500">{winRate?.toFixed(2)}%</p>
              </div>

              <div>
                <h3 className="text-gray-400 text-sm">Expected Value per Bet</h3>
                <p className={`text-4xl font-bold ${expectedValue! >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {expectedValue! >= 0 ? "+" : ""}
                  {expectedValue?.toFixed(2)}
                </p>
                <p className="text-gray-400 text-sm">(Bet amount: {betAmount.toFixed(2)})</p>
              </div>

              {isSaving ? (
                <div className="text-amber-400">Saving crash data...</div>
              ) : (
                <Button onClick={resetGame} className="w-full">
                  Play Again
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="bg-gray-900 p-2">
        {/* Tab navigation */}
        <div className="flex mb-2">
          <button
            className={`flex-1 py-2 text-center ${activeTab === "bet" ? "bg-gray-800 text-white" : "text-gray-400"}`}
            onClick={() => setActiveTab("bet")}
          >
            Bet
          </button>
          <button
            className={`flex-1 py-2 text-center ${activeTab === "auto" ? "bg-gray-800 text-white" : "text-gray-400"}`}
            onClick={() => setActiveTab("auto")}
          >
            Auto
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <button
                className="bg-gray-800 text-white w-8 h-8 rounded-full flex items-center justify-center"
                onClick={decreaseBet}
                disabled={(isRunning || isStarting) && !demoMode}
              >
                <span className="text-xl font-bold">-</span>
              </button>

              <div
                className={cn(
                  "bg-gray-800 text-white px-4 py-2 rounded-md text-center flex-1",
                  (isBetting || demoMode) && isRunning && "cursor-pointer hover:bg-gray-700",
                )}
                onClick={revealCrashPoint}
              >
                {betAmount.toFixed(2)}
              </div>

              <button
                className="bg-gray-800 text-white w-8 h-8 rounded-full flex items-center justify-center"
                onClick={increaseBet}
                disabled={(isRunning || isStarting) && !demoMode}
              >
                <span className="text-xl font-bold">+</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1">
              {presets.map((preset, index) => (
                <button
                  key={index}
                  className={cn(
                    "text-white px-2 py-1 rounded text-center text-sm",
                    selectedPreset === index ? "bg-gray-600" : "bg-gray-800",
                  )}
                  onClick={() => selectPreset(preset.value, index)}
                  disabled={(isRunning || isStarting) && !demoMode}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <button
              className={cn(
                "font-bold py-2 px-4 rounded-md w-full text-center text-white bg-green-600",
                isBetting && isRunning && "bg-red-600",
                ((isRunning || isStarting) && !isBetting) || betPlaced ? "bg-gray-600 cursor-not-allowed" : "",
              )}
              onClick={isBetting && isRunning ? cashOut : placeBet}
              disabled={((isRunning || isStarting) && !isBetting) || betPlaced}
            >
              {isBetting && isRunning ? "CASH OUT" : betPlaced ? "BET PLACED" : isStarting ? "STARTING..." : "BET"}
              <br />
              {betAmount.toFixed(2)} CNY
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <button
                className={cn(
                  "bg-gray-800 text-white w-8 h-8 rounded-full flex items-center justify-center",
                  (isBetting || isRunning || isStarting) && "opacity-50 cursor-not-allowed",
                )}
                onClick={decreaseCashout}
                disabled={isBetting || isRunning || isStarting}
              >
                <span className="text-xl font-bold">-</span>
              </button>

              <div className="bg-gray-800 text-white px-4 py-2 rounded-md text-center flex-1">
                {cashoutMultiplier.toFixed(2)}x
              </div>

              <button
                className={cn(
                  "bg-gray-800 text-white w-8 h-8 rounded-full flex items-center justify-center",
                  (isBetting || isRunning || isStarting) && "opacity-50 cursor-not-allowed",
                )}
                onClick={increaseCashout}
                disabled={isBetting || isRunning || isStarting}
              >
                <span className="text-xl font-bold">+</span>
              </button>
            </div>

            <div className="bg-gray-800 rounded-md p-2">
              <div className="text-white text-sm mb-1">Potential Profit:</div>
              <div className="text-green-500 font-bold text-lg">
                {(betAmount * (cashoutMultiplier - 1)).toFixed(2)} CNY
              </div>
            </div>

            <button
              className={cn(
                "font-bold py-2 px-4 rounded-md w-full text-center text-white bg-green-600",
                isBetting && isRunning && "bg-red-600",
                ((isRunning || isStarting) && !isBetting) || betPlaced ? "bg-gray-600 cursor-not-allowed" : "",
              )}
              onClick={isBetting && isRunning ? cashOut : placeBet}
              disabled={((isRunning || isStarting) && !isBetting) || betPlaced}
            >
              {isBetting && isRunning ? "CASH OUT" : betPlaced ? "BET PLACED" : "BET"}
              <br />
              {betAmount.toFixed(2)} CNY @ {cashoutMultiplier.toFixed(2)}x
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
