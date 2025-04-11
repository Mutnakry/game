// "use client"

// import { useState, useEffect, useRef } from "react"
// import { cn } from "@/lib/utils"

// export default function MiniCrash() {
//   const [multiplier, setMultiplier] = useState(1.0)
//   const [isRunning, setIsRunning] = useState(true)
//   const [hasCrashed, setHasCrashed] = useState(false)
//   const [betAmount, setBetAmount] = useState(1.0)
//   const [selectedPreset, setSelectedPreset] = useState<number | null>(null)
//   const [isBetting, setIsBetting] = useState(false)
//   const [cashoutMultiplier, setCashoutMultiplier] = useState(2.0)
//   const [profit, setProfit] = useState<number | null>(null)
//   const [autoStart, setAutoStart] = useState(true) // New state for auto-start functionality
//   // Add state to track if crash point is revealed
//   const [isPointRevealed, setIsPointRevealed] = useState(false)
//   const canvasRef = useRef<HTMLCanvasElement>(null)
//   const animationRef = useRef<number>(0)
//   const crashPointRef = useRef(generateCrashPoint())
//   const startTimeRef = useRef<number>(Date.now())
//   const planeRef = useRef<HTMLImageElement | null>(null)
//   const animationStartTimeRef = useRef<number>(Date.now())
//   const gameSpeedFactor = useRef<number>(0.3) // Further reduced speed factor (was 0.5)
//   const shakeOffsetRef = useRef({ x: 0, y: 0 }) // For background shaking effect
//   const planeShakePhaseRef = useRef(0) // For controlling aircraft shake pattern
//   // Add a new state to track crash animation
//   const [crashAnimationProgress, setCrashAnimationProgress] = useState(0)
//   const crashAnimationRef = useRef<number>(0)
//   const restartTimerRef = useRef<NodeJS.Timeout | null>(null) // Reference to store the restart timer
//   // Add a timer ref for hiding the revealed point
//   const revealTimerRef = useRef<NodeJS.Timeout | null>(null)

//   // Aircraft dimensions
//   const aircraftWidth = 100 // Width in pixels
//   const aircraftHeight = 80 // Height in pixels

//   // Border padding to prevent overflow
//   const borderPadding = Math.max(aircraftWidth, aircraftHeight) / 2 + 10 // Half the largest dimension plus some extra padding

//   const presets = [
//     { value: 10.0, label: "10.00" },
//     { value: 20.0, label: "20.00" },
//     { value: 50.0, label: "50.00" },
//     { value: 100.0, label: "100.00" },
//   ]

//   useEffect(() => {
//     // Create plane image
//     const planeImage = new Image()
//     planeImage.src = "https://res.cloudinary.com/dy6z3h1dr/image/upload/v1743943068/Aviator_GiF_vpajka.gif"
//     planeImage.crossOrigin = "anonymous"
//     planeImage.onload = () => {
//       planeRef.current = planeImage
//     }

//     // Start animation
//     startGame()

//     return () => {
//       cancelAnimationFrame(animationRef.current)
//       cancelAnimationFrame(crashAnimationRef.current)
//       // Clear any pending timers
//       if (restartTimerRef.current) {
//         clearTimeout(restartTimerRef.current)
//       }
//       if (revealTimerRef.current) {
//         clearTimeout(revealTimerRef.current)
//       }
//     }
//   }, [])

//   function generateCrashPoint() {
//     // Weighted random crash point with house edge
//     const rand = Math.random() * 100

//     if (rand < 75) {
//       // 75% chance: 1.01 to 3.00
//       return 1.01 + Math.random() * 1.99
//     } else if (rand < 95) {
//       // 20% chance: 3.01 to 6.00
//       return 3.01 + Math.random() * 2.99
//     } else if (rand < 99) {
//       // 4% chance: 6.01 to 11.00
//       return 6.01 + Math.random() * 4.99
//     } else {
//       // 1% chance: 11.01 to 100.00
//       return 11.01 + Math.random() * 88.99
//     }
//   }

//   function startGame() {
//     setIsRunning(true)
//     setHasCrashed(false)
//     setProfit(null)
//     setIsPointRevealed(false) // Reset revealed state
//     startTimeRef.current = Date.now()
//     animationStartTimeRef.current = Date.now()
//     crashPointRef.current = generateCrashPoint()
//     setMultiplier(1.0)
//     shakeOffsetRef.current = { x: 0, y: 0 }
//     planeShakePhaseRef.current = 0

//     // Create a fallback plane image if it hasn't loaded yet
//     if (!planeRef.current) {
//       const planeImage = new Image()
//       planeImage.src = "https://res.cloudinary.com/dy6z3h1dr/image/upload/v1743943068/Aviator_GiF_vpajka.gif"
//       planeImage.crossOrigin = "anonymous"
//       planeRef.current = planeImage
//     }

//     drawGraph()
//   }

//   function restartGame() {
//     setIsBetting(false)
//     startGame()
//   }

//   function placeBet() {
//     if (!isRunning || hasCrashed) return
//     setIsBetting(true)
//   }

//   function cashOut() {
//     if (isBetting && isRunning) {
//       setIsBetting(false)
//       const winAmount = betAmount * multiplier
//       setProfit(winAmount - betAmount)
//     }
//   }

//   // New function to reveal the crash point
//   function revealCrashPoint() {
//     if (isBetting && isRunning) {
//       setIsPointRevealed(true)

//       // Auto-hide the revealed point after 3 seconds
//       if (revealTimerRef.current) {
//         clearTimeout(revealTimerRef.current)
//       }

//       revealTimerRef.current = setTimeout(() => {
//         setIsPointRevealed(false)
//       }, 3000)
//     }
//   }

//   // Calculate shake offset based on multiplier
//   function calculateShakeOffset(multiplier: number) {
//     // No shake at the beginning, increasing with multiplier
//     const baseShakeIntensity = Math.min(3, (multiplier - 1) * 0.5)

//     if (baseShakeIntensity <= 0) return { x: 0, y: 0 }

//     // Random shake with increasing intensity
//     return {
//       x: (Math.random() * 2 - 1) * baseShakeIntensity,
//       y: (Math.random() * 2 - 1) * baseShakeIntensity,
//     }
//   }

//   // Calculate aircraft shake with more pronounced up-and-down movement
//   function calculateAircraftShake(multiplier: number, phase: number) {
//     // Base intensity increases with multiplier
//     const baseIntensity = Math.min(4, (multiplier - 1) * 0.8 + 0.5)

//     // Update the phase for smooth oscillation
//     planeShakePhaseRef.current = (phase + 0.1) % (Math.PI * 2)

//     // Use sine wave for smooth up-down motion
//     const verticalShake = Math.sin(phase) * baseIntensity * 1.5 // More vertical movement

//     // Use cosine wave with lower amplitude for horizontal movement
//     const horizontalShake = Math.cos(phase * 1.3) * baseIntensity * 0.5 // Less horizontal movement

//     return {
//       x: horizontalShake,
//       y: verticalShake,
//     }
//   }

//   // Updated to match the blue sunburst pattern in the image
//   function drawRadialBackground(
//     ctx: CanvasRenderingContext2D,
//     width: number,
//     height: number,
//     shakeOffset: { x: number; y: number },
//   ) {
//     // Apply shake offset to the background
//     ctx.save()
//     ctx.translate(shakeOffset.x, shakeOffset.y)

//     // Fill with solid black first
//     ctx.fillStyle = "#000000"
//     ctx.fillRect(-shakeOffset.x, -shakeOffset.y, width, height)

//     // Draw sunburst/radial rays
//     const centerX = width / 2
//     const centerY = height / 2
//     const numRays = 24 // More rays for a denser pattern

//     // Draw the rays
//     for (let i = 0; i < numRays; i++) {
//       const angle = (i * 2 * Math.PI) / numRays
//       const rayWidth = Math.PI / numRays

//       // Create a gradient for each ray
//       const rayGradient = ctx.createLinearGradient(
//         centerX,
//         centerY,
//         centerX + Math.cos(angle) * width * 1.5,
//         centerY + Math.sin(angle) * height * 1.5,
//       )

//       // Blue gradient for rays
//       rayGradient.addColorStop(0, "rgba(30, 64, 124, 0.9)") // Brighter blue near center
//       rayGradient.addColorStop(0.3, "rgba(20, 40, 80, 0.7)") // Medium blue
//       rayGradient.addColorStop(1, "rgba(0, 0, 0, 0.9)") // Fade to black

//       ctx.fillStyle = rayGradient

//       // Draw a ray as a sector
//       ctx.beginPath()
//       ctx.moveTo(centerX, centerY)
//       ctx.arc(centerX, centerY, Math.max(width, height) * 1.5, angle - rayWidth, angle + rayWidth)
//       ctx.closePath()
//       ctx.fill()
//     }

//     // Add a subtle blue radial gradient overlay for the glow effect
//     const glowGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, width * 0.7)
//     glowGradient.addColorStop(0, "rgba(40, 120, 200, 0.15)") // Bright blue center
//     glowGradient.addColorStop(0.5, "rgba(20, 60, 120, 0.1)") // Medium blue
//     glowGradient.addColorStop(1, "rgba(0, 0, 0, 0)") // Transparent edge

//     ctx.fillStyle = glowGradient
//     ctx.fillRect(-shakeOffset.x, -shakeOffset.y, width, height)

//     // Draw grid dots
//     ctx.fillStyle = "rgba(255, 255, 255, 0.3)"
//     const dotSpacing = width / 20
//     for (let x = 0; x < 20; x++) {
//       for (let y = 0; y < 20; y++) {
//         ctx.beginPath()
//         ctx.arc(x * dotSpacing, y * dotSpacing, 1, 0, Math.PI * 2)
//         ctx.fill()
//       }
//     }

//     ctx.restore()
//   }

//   // Update the drawGraph function to include animation effects with reduced speed
//   function drawGraph() {
//     const canvas = canvasRef.current
//     if (!canvas) return

//     const ctx = canvas.getContext("2d")
//     if (!ctx) return

//     // Clear canvas
//     ctx.clearRect(0, 0, canvas.width, canvas.height)

//     // Calculate current multiplier based on time with reduced speed
//     const elapsed = ((Date.now() - startTimeRef.current) / 100) * gameSpeedFactor.current
//     const newMultiplier = Math.pow(1.06, elapsed)

//     // Calculate shake offset based on multiplier
//     shakeOffsetRef.current = calculateShakeOffset(newMultiplier)

//     // Draw background with shake effect
//     drawRadialBackground(ctx, canvas.width, canvas.height, shakeOffsetRef.current)

//     // Check if crashed
//     if (newMultiplier >= crashPointRef.current && isRunning) {
//       setIsRunning(false)
//       setHasCrashed(true)

//       // Clear any existing restart timer
//       if (restartTimerRef.current) {
//         clearTimeout(restartTimerRef.current)
//       }

//       // Set a timer to restart the game after 5 seconds if autoStart is enabled
//       if (autoStart) {
//         restartTimerRef.current = setTimeout(() => {
//           restartGame()
//         }, 5000)
//       }

//       // Draw crash text
//       const width = canvas.width
//       const height = canvas.height

//       ctx.font = "bold 48px Arial"
//       ctx.fillStyle = "#ff0033"
//       ctx.textAlign = "center"
//       ctx.textBaseline = "middle"
//       ctx.fillText(`${crashPointRef.current.toFixed(2)}x`, width / 2, height / 2)

//       ctx.font = "bold 24px Arial"
//       ctx.fillText("CRASHED", width / 2, height / 2 + 40)

//       return
//     }

//     // Auto cashout if enabled and reached target multiplier
//     if (isBetting && newMultiplier >= cashoutMultiplier && isRunning) {
//       cashOut()
//     }

//     setMultiplier(Number.parseFloat(newMultiplier.toFixed(2)))

//     // Draw graph line with animation
//     const maxMultiplier = 10 // For scaling purposes - increased for better visibility
//     const height = canvas.height
//     const width = canvas.width

//     // Slow down the animation by increasing the duration
//     const animationDuration = 6000 // ms (increased from 4000)
//     const animationProgress = Math.min(1, (Date.now() - animationStartTimeRef.current) / animationDuration)

//     // Use easeOutQuad for smoother animation
//     const easedProgress = 1 - (1 - animationProgress) * (1 - animationProgress)

//     // Calculate how much of the curve to draw based on animation progress
//     // Limit the progress width to prevent overflow at the edge
//     const maxProgressWidth = width - borderPadding
//     const progressWidth = Math.min(maxProgressWidth, width * easedProgress)

//     // Store points for the curve to use for drawing the plane
//     const curvePoints: { x: number; y: number }[] = []

//     // Draw the filled area under the curve with animation
//     ctx.beginPath()
//     ctx.moveTo(0, height)

//     // Create a curve that starts flat and becomes steeper - using exponential curve
//     for (let x = 0; x <= progressWidth; x++) {
//       // Calculate the x position as a percentage of the width
//       const xPercent = x / width

//       // Use a power function to create an exponential curve that starts flat and curves upward
//       // Higher exponent = more dramatic curve
//       const exponent = 2.5 // Adjust this value to change the curve shape
//       const curveY = Math.pow(xPercent, exponent)

//       // Scale the curve to fit the canvas height and apply animation
//       // Ensure the curve doesn't go above the top padding
//       const y = Math.max(borderPadding, height - curveY * height * 0.9 * easedProgress)

//       ctx.lineTo(x, y)

//       // Store points for the curve
//       curvePoints.push({ x, y })
//     }

//     // Fill the area under the curve
//     ctx.lineTo(progressWidth, height)
//     ctx.closePath()

//     // Updated to match the red gradient in the image
//     const gradient = ctx.createLinearGradient(0, 0, 0, height)
//     gradient.addColorStop(0, "rgba(255, 0, 51, 0.9)")
//     gradient.addColorStop(1, "rgba(255, 0, 51, 0.3)")
//     ctx.fillStyle = gradient
//     ctx.fill()

//     // Draw the line
//     ctx.beginPath()
//     ctx.moveTo(0, height)

//     for (let x = 0; x <= progressWidth; x++) {
//       // Calculate the x position as a percentage of the width
//       const xPercent = x / width

//       // Use a power function to create an exponential curve
//       const exponent = 2.5 // Same exponent as above
//       const curveY = Math.pow(xPercent, exponent)

//       // Scale the curve to fit the canvas height and apply animation
//       // Ensure the curve doesn't go above the top padding
//       const y = Math.max(borderPadding, height - curveY * height * 0.9 * easedProgress)

//       ctx.lineTo(x, y)
//     }

//     // Brighter red for the line to match the image
//     ctx.strokeStyle = "#ff0033"
//     ctx.lineWidth = 4
//     ctx.stroke()

//     // Draw the plane at the start of the line and moving along it
//     if (planeRef.current && curvePoints.length > 0 && !hasCrashed) {
//       // Get the position for the plane - it should be at the end of the currently drawn line
//       const planePosition = curvePoints[curvePoints.length - 1]

//       // Calculate aircraft shake with more pronounced up-and-down movement
//       const planeShake = calculateAircraftShake(newMultiplier, planeShakePhaseRef.current)

//       // Draw a glow effect behind the aircraft
//       ctx.save()
//       ctx.translate(planePosition.x + planeShake.x, planePosition.y + planeShake.y)
//       // No rotation - keep the plane horizontal
//       // ctx.rotate(angle + pitchAdjustment) - removed this line

//       // Draw glow
//       const glowSize = Math.max(aircraftWidth, aircraftHeight) * 1.5
//       const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize / 2)
//       glowGradient.addColorStop(0, "rgba(255, 0, 51, 0.6)")
//       glowGradient.addColorStop(1, "rgba(255, 0, 51, 0)")
//       ctx.fillStyle = glowGradient
//       ctx.beginPath()
//       ctx.arc(0, 0, glowSize / 2, 0, Math.PI * 2)
//       ctx.fill()

//       // Draw the aircraft with custom dimensions - always horizontal
//       ctx.drawImage(planeRef.current, -aircraftWidth / 2, -aircraftHeight / 2, aircraftWidth, aircraftHeight)

//       // Draw a motion trail behind the aircraft
//       ctx.globalAlpha = 0.4
//       ctx.drawImage(
//         planeRef.current,
//         -aircraftWidth / 2 - planeShake.x * 2,
//         -aircraftHeight / 2 - planeShake.y * 2,
//         aircraftWidth,
//         aircraftHeight,
//       )

//       ctx.globalAlpha = 0.2
//       ctx.drawImage(
//         planeRef.current,
//         -aircraftWidth / 2 - planeShake.x * 4,
//         -aircraftHeight / 2 - planeShake.y * 4,
//         aircraftWidth,
//         aircraftHeight,
//       )

//       ctx.restore()
//     }

//     // Draw multiplier text with fade-in effect - updated to match the large white text in the image
//     ctx.globalAlpha = animationProgress
//     ctx.font = "bold 64px Arial" // Larger font
//     ctx.fillStyle = "#ffffff" // White color
//     ctx.textAlign = "center"
//     ctx.textBaseline = "middle"
//     ctx.fillText(`${newMultiplier.toFixed(2)}x`, width / 2, height / 2)
//     ctx.globalAlpha = 1.0

//     // Draw crash message
//     if (hasCrashed) {
//       ctx.font = "bold 24px Arial"
//       ctx.fillStyle = "#ff0033"
//       ctx.fillText("CRASHED", width / 2, height / 2 + 40)
//     }

//     // Draw profit message
//     if (profit !== null) {
//       ctx.font = "bold 24px Arial"
//       ctx.fillStyle = "#00ff00"
//       ctx.fillText(`+${profit.toFixed(2)}`, width / 2, height / 2 - 40)
//     }

//     // Continue animation
//     if (isRunning) {
//       animationRef.current = requestAnimationFrame(drawGraph)
//     }
//   }

//   function toggleAutoStart() {
//     setAutoStart(!autoStart)
//   }

//   function decreaseBet() {
//     setBetAmount((prev) => Math.max(0.1, prev - 0.1))
//     setSelectedPreset(null)
//   }

//   function increaseBet() {
//     setBetAmount((prev) => prev + 0.1)
//     setSelectedPreset(null)
//   }

//   function selectPreset(value: number, index: number) {
//     setBetAmount(value)
//     setSelectedPreset(index)
//   }

//   function decreaseCashout() {
//     if (isBetting) return
//     setCashoutMultiplier((prev) => Math.max(1.1, prev - 0.1))
//   }

//   function increaseCashout() {
//     if (isBetting) return
//     setCashoutMultiplier((prev) => prev + 0.1)
//   }

//   return (
//     <div className="w-full max-w-4xl">
//       {/* Header - updated to match the amber/orange header in the image */}
//       <div className="bg-amber-500 text-white font-bold text-center py-2 rounded-t-lg">FUN MODE</div>

//       {/* Game area */}
//       <div className="relative bg-black border-2 border-gray-800 h-[400px] w-full overflow-hidden">
//         <canvas ref={canvasRef} width={800} height={400} className="w-full h-full" />

//         {/* Overlay buttons */}
//         {isRunning && isBetting && (
//           <button
//             onClick={cashOut}
//             className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 mt-20
//                       bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-md
//                       text-xl animate-pulse"
//           >
//             CASH OUT
//           </button>
//         )}

//         {/* Crash point reveal overlay */}
//         {isPointRevealed && isRunning && isBetting && (
//           <div className="absolute inset-0 flex items-center justify-center">
//             <div className="bg-black bg-opacity-70 p-6 rounded-lg text-center">
//               <div className="text-amber-500 text-2xl font-bold mb-2">CRASH POINT</div>
//               <div className="text-amber-500 text-5xl font-bold">{crashPointRef.current.toFixed(2)}x</div>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Controls */}
//       <div className="bg-gray-900 p-4 rounded-b-lg">
//         <div className="grid grid-cols-2 gap-4">
//           <div className="space-y-4">
//             <div className="flex items-center justify-between">
//               <div className="bg-gray-800 text-white px-4 py-1 rounded-md w-20 text-center">Bet</div>
//               <div className="bg-gray-800 text-white px-4 py-1 rounded-md w-20 text-center">Manual</div>
//             </div>

//             <div className="flex items-center space-x-2">
//               <button
//                 className="bg-gray-800 text-white w-10 h-10 rounded-full flex items-center justify-center"
//                 onClick={decreaseBet}
//               >
//                 <span className="text-xl font-bold">-</span>
//               </button>

//               {/* Added onClick to reveal crash point when clicked during betting */}
//               <div
//                 className={cn(
//                   "bg-gray-800 text-white px-4 py-2 rounded-md text-center flex-1",
//                   isBetting && isRunning && "cursor-pointer hover:bg-gray-700",
//                 )}
//                 onClick={revealCrashPoint}
//               >
//                 {betAmount.toFixed(2)}
//               </div>

//               <button
//                 className="bg-gray-800 text-white w-10 h-10 rounded-full flex items-center justify-center"
//                 onClick={increaseBet}
//               >
//                 <span className="text-xl font-bold">+</span>
//               </button>
//             </div>

//             <div className="grid grid-cols-2 gap-2">
//               {presets.map((preset, index) => (
//                 <button
//                   key={index}
//                   className={cn(
//                     "text-white px-2 py-1 rounded text-center",
//                     selectedPreset === index ? "bg-gray-600" : "bg-gray-800",
//                   )}
//                   onClick={() => selectPreset(preset.value, index)}
//                 >
//                   {preset.label}
//                 </button>
//               ))}
//             </div>

//             <button
//               className={cn(
//                 "font-bold py-3 px-4 rounded-md w-full text-center text-white",
//                 isBetting
//                   ? "bg-red-600 hover:bg-red-700"
//                   : isRunning
//                     ? "bg-green-600 hover:bg-green-700"
//                     : "bg-gray-600 cursor-not-allowed",
//               )}
//               onClick={isBetting ? cashOut : placeBet}
//               disabled={!isRunning || hasCrashed}
//             >
//               {isBetting ? "CASH OUT" : "BET"}
//               <br />
//               {betAmount.toFixed(2)} CNY
//             </button>
//           </div>

//           <div className="space-y-4">
//             <div className="flex items-center justify-between">
//               <div className="bg-gray-800 text-white px-4 py-1 rounded-md w-20 text-center">Auto</div>
//               <div className="bg-gray-800 text-white px-4 py-1 rounded-md w-20 text-center">Cashout</div>
//             </div>

//             <div className="flex items-center space-x-2">
//               <button
//                 className={cn(
//                   "bg-gray-800 text-white w-10 h-10 rounded-full flex items-center justify-center",
//                   isBetting && "opacity-50 cursor-not-allowed",
//                 )}
//                 onClick={decreaseCashout}
//                 disabled={isBetting}
//               >
//                 <span className="text-xl font-bold">-</span>
//               </button>

//               <div className="bg-gray-800 text-white px-4 py-2 rounded-md text-center flex-1">
//                 {cashoutMultiplier.toFixed(2)}x
//               </div>

//               <button
//                 className={cn(
//                   "bg-gray-800 text-white w-10 h-10 rounded-full flex items-center justify-center",
//                   isBetting && "opacity-50 cursor-not-allowed",
//                 )}
//                 onClick={increaseCashout}
//                 disabled={isBetting}
//               >
//                 <span className="text-xl font-bold">+</span>
//               </button>
//             </div>

//             <div className="bg-gray-800 rounded-md p-2">
//               <div className="text-white text-sm mb-1">Potential Profit:</div>
//               <div className="text-green-500 font-bold text-lg">
//                 {(betAmount * cashoutMultiplier - betAmount).toFixed(2)} CNY
//               </div>
//             </div>

//             <div className="flex flex-col space-y-2">
//               <button
//                 className={cn(
//                   "font-bold py-3 px-4 rounded-md w-full text-center text-white",
//                   isBetting
//                     ? "bg-red-600 hover:bg-red-700"
//                     : isRunning
//                       ? "bg-green-600 hover:bg-green-700"
//                       : "bg-gray-600 cursor-not-allowed",
//                 )}
//                 onClick={isBetting ? cashOut : placeBet}
//                 disabled={!isRunning || hasCrashed}
//               >
//                 {isBetting ? "CASH OUT" : "AUTO BET"}
//                 <br />
//                 {betAmount.toFixed(2)} CNY @ {cashoutMultiplier.toFixed(2)}x
//               </button>

//               <button
//                 className={cn(
//                   "py-2 px-4 rounded-md text-white text-sm",
//                   autoStart ? "bg-green-600 hover:bg-green-700" : "bg-gray-600 hover:bg-gray-700",
//                 )}
//                 onClick={toggleAutoStart}
//               >
//                 Auto Restart: {autoStart ? "ON" : "OFF"}
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }


import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full bg-slate-50 text-gray-700 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = "Input"

export { Input }
