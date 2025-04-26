"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, Plane } from "lucide-react"
import { useEffect, useRef } from "react"

interface JetDisplayProps {
  showJet: boolean
  countingMultiplier: number
  isAnimating: boolean
}

export function JetDisplay({ showJet, countingMultiplier, isAnimating }: JetDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameIdRef = useRef<number | null>(null)

  // Draw jet trail
  useEffect(() => {
    if (!canvasRef.current || !showJet) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions to match its display size
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width
    canvas.height = rect.height

    const particles: { x: number; y: number; size: number; color: string; alpha: number }[] = []

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Add new particles if animating
      if (isAnimating) {
        const centerX = canvas.width / 2
        const centerY = canvas.height / 2 - 40 // Position particles below the jet

        // Add particles at the bottom of the jet
        for (let i = 0; i < 2; i++) {
          const size = Math.random() * 3 + 1
          particles.push({
            x: centerX + (Math.random() - 0.5) * 10,
            y: centerY,
            size,
            color: Math.random() > 0.5 ? "#3b82f6" : "#6366f1",
            alpha: 1,
          })
        }
      }

      // Update and draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        p.y += 2
        p.alpha -= 0.02

        if (p.alpha <= 0) {
          particles.splice(i, 1)
          i--
          continue
        }

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `${p.color}${Math.floor(p.alpha * 255)
          .toString(16)
          .padStart(2, "0")}`
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
  }, [showJet, isAnimating])

  return (
    <AnimatePresence>
      {showJet && (
        <motion.div
          initial={{ scale: 0.5, opacity: 0, y: 100 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.5, opacity: 0, y: -100 }}
          className="relative w-72 h-72 mx-auto"
        >
          {/* Canvas for jet trail */}
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-0" />

          {/* Jet above the circle */}
          <motion.div
            className="absolute top-10 left-1/2 transform -translate-x-1/2 z-20"
            animate={{
              y: isAnimating ? [0, -5, 0] : 0,
              rotate: isAnimating ? [0, -5, 5, 0] : 0,
            }}
            transition={{
              duration: 4,
              repeat: isAnimating ? Number.POSITIVE_INFINITY : 0,
              repeatType: "reverse",
            }}
          >
        
          </motion.div>

          {/* Glowing Circle - Centered in the container */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
            <motion.div
              className="w-48 h-48 rounded-full border-4 border-blue-500 bg-gradient-to-br from-blue-900/40 to-indigo-900/40 backdrop-blur-sm flex items-center justify-center"
              animate={{
                boxShadow: [
                  "0 0 10px 2px rgba(59,130,246,0.6), inset 0 0 15px rgba(59,130,246,0.3)",
                  "0 0 20px 5px rgba(59,130,246,0.6), inset 0 0 25px rgba(59,130,246,0.3)",
                  "0 0 10px 2px rgba(59,130,246,0.6), inset 0 0 15px rgba(59,130,246,0.3)",
                ],
              }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
            >
              {/* Outer glow effect */}
              <div className="absolute inset-0 rounded-full bg-blue-500 blur-xl opacity-30 scale-125" />

              {/* Multiplier text */}
              <div className="relative z-10 text-center">
                <div className="text-5xl font-bold">
                  <span className="text-yellow-300 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">
                    {countingMultiplier.toFixed(2)}x
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
