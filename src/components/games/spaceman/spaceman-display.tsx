"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, User } from "lucide-react"
import { useEffect, useRef } from "react"

interface SpacemanDisplayProps {
  showSpaceman: boolean
  countingMultiplier: number
  isAnimating: boolean
  size?: "sm" | "md" | "lg" // Added size prop with default in destructuring
}

export function SpacemanDisplay({
  showSpaceman,
  countingMultiplier,
  isAnimating,
  size = "md", // Default to medium size
}: SpacemanDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameIdRef = useRef<number | null>(null)

  // Size mapping based on the size prop
  const sizeMap = {
    sm: {
      container: "w-48 h-48",
      circle: "w-32 h-32",
      spaceman: "top-1/4",
      spacemanIcon: 20,
      sparkleIcon: 16,
      multiplierText: "text-3xl",
    },
    md: {
      container: "w-64 h-64",
      circle: "w-40 h-40",
      spaceman: "top-1/4",
      spacemanIcon: 24,
      sparkleIcon: 20,
      multiplierText: "text-4xl",
    },
    lg: {
      container: "w-80 h-80",
      circle: "w-48 h-48",
      spaceman: "top-1/4",
      spacemanIcon: 28,
      sparkleIcon: 24,
      multiplierText: "text-5xl",
    },
  }

  const currentSize = sizeMap[size]

  // Draw cosmic particles
  useEffect(() => {
    if (!canvasRef.current || !showSpaceman) return

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
        const centerY = canvas.height / 2

        // Add particles around the spaceman
        for (let i = 0; i < 2; i++) {
          const angle = Math.random() * Math.PI * 2
          const distance = 60 + Math.random() * 20
          const size = Math.random() * 3 + 1
          particles.push({
            x: centerX + Math.cos(angle) * distance,
            y: centerY + Math.sin(angle) * distance,
            size,
            color: Math.random() > 0.5 ? "#a78bfa" : "#8b5cf6",
            alpha: 1,
          })
        }
      }

      // Update and draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]

        // Move particles in a circular pattern
        const angle = Math.atan2(p.y - canvas.height / 2, p.x - canvas.width / 2)
        p.x += Math.cos(angle + Math.PI / 2) * 0.5
        p.y += Math.sin(angle + Math.PI / 2) * 0.5

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
  }, [showSpaceman, isAnimating])

  return (
    <AnimatePresence>
      {showSpaceman && (
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          className={`relative ${currentSize.container} mx-auto flex items-center justify-center`}
        >
          {/* Canvas for cosmic particles */}
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-0" />

          {/* Spaceman above the circle */}
          <div className="absolute inset-0 flex justify-center z-20">
            <motion.div
              className="relative"
              style={{ top: "20%" }}
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
          </div>

          {/* Glowing Circle */}
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <motion.div
              animate={{
                scale: isAnimating ? [1, 1.05, 1] : 1,
              }}
              transition={{
                duration: 2,
                repeat: isAnimating ? Number.POSITIVE_INFINITY : 0,
                repeatType: "reverse",
              }}
            >
              <div className="relative">
                {/* Outer glow effect */}
                <div className="absolute inset-0 rounded-full bg-purple-500 blur-xl opacity-30 scale-125" />

                {/* Animated ring */}
                <motion.div
                  className={`${currentSize.circle} rounded-full border-4 border-purple-500 bg-gradient-to-br from-purple-900/40 to-violet-900/40 backdrop-blur-sm flex items-center justify-center relative`}
                  animate={{
                    boxShadow: isAnimating
                      ? [
                          "0 0 10px 2px rgba(139,92,246,0.6), inset 0 0 15px rgba(139,92,246,0.3)",
                          "0 0 20px 5px rgba(139,92,246,0.6), inset 0 0 25px rgba(139,92,246,0.3)",
                          "0 0 10px 2px rgba(139,92,246,0.6), inset 0 0 15px rgba(139,92,246,0.3)",
                        ]
                      : "0 0 10px 2px rgba(139,92,246,0.6), inset 0 0 15px rgba(139,92,246,0.3)",
                  }}
                  transition={{ duration: 2, repeat: isAnimating ? Number.POSITIVE_INFINITY : 0 }}
                >
                  {/* Sparkles */}
                  <motion.div
                    className="absolute -top-4 -right-4"
                    animate={{
                      scale: isAnimating ? [1, 1.3, 1] : 1,
                      opacity: isAnimating ? [0.6, 1, 0.6] : 0.8,
                    }}
                    transition={{ duration: 2, repeat: isAnimating ? Number.POSITIVE_INFINITY : 0, delay: 0.5 }}
                  >
                    <Sparkles size={currentSize.sparkleIcon} className="text-yellow-300" />
                  </motion.div>

                  <motion.div
                    className="absolute -bottom-4 -left-4"
                    animate={{
                      scale: isAnimating ? [1, 1.3, 1] : 1,
                      opacity: isAnimating ? [0.6, 1, 0.6] : 0.8,
                    }}
                    transition={{ duration: 2, repeat: isAnimating ? Number.POSITIVE_INFINITY : 0, delay: 1 }}
                  >
                    <Sparkles size={currentSize.sparkleIcon} className="text-yellow-300" />
                  </motion.div>

                  {/* Multiplier text */}
                  <div className="text-center relative z-10 flex items-center justify-center h-full">
                    <div className={`${currentSize.multiplierText} font-bold`}>
                      <span className="text-yellow-300 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">
                        {countingMultiplier.toFixed(2)}x
                      </span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
