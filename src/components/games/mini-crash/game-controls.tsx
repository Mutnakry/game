"use client"

import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

interface GameControlsProps {
  handleStart: () => void
  isAnimating: boolean
  isLoadingData: boolean
  isSavingCrash: boolean
  crashSaveError: string | null
}

export function GameControls({
  handleStart,
  isAnimating,
  isLoadingData,
  isSavingCrash,
  crashSaveError,
}: GameControlsProps) {
  return (
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
  )
}
