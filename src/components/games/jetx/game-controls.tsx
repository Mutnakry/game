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
        className="relative overflow-hidden bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-4 px-12 rounded-full w-full shadow-[0_0_15px_rgba(59,130,246,0.6)] transition-all duration-300 ease-out transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
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
              className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-transparent"
              animate={{
                x: ["100%", "-100%"],
              }}
              transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, repeatType: "loop" }}
            />
            LAUNCH
          </>
        )}
      </Button>

      {crashSaveError && (
        <div className="mt-2 text-blue-400 text-xs text-center bg-blue-900/30 backdrop-blur-sm p-2 rounded-md border border-blue-500/30">
          Error saving game data: {crashSaveError}
        </div>
      )}
    </div>
  )
}
