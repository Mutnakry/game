"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Flame, Sparkles } from "lucide-react"

interface MultiplierDisplayProps {
  showMultiplier: boolean
  countingMultiplier: number
}

export function MultiplierDisplay({ showMultiplier, countingMultiplier }: MultiplierDisplayProps) {
  return (
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
  )
}
