"use client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import useAutoLogout from "@/components/auth/useAutoLogout"

// Import modular components
import { StarfieldBackground } from "@/components/games/mini-crash/starfield-background"
import { MultiplierDisplay } from "./multiplier-display"
import { GameControls } from "./game-controls"
import { useMultiplierData } from "./hooks/use-multiplier-data"
import { useCrashData } from "./hooks/use-crash-data"
import { useGameLogic } from "./hooks/use-game-logic"

export default function MiniCrash() {
  const router = useRouter()
  useAutoLogout()

  // Use custom hooks for different aspects of the game
  const { multiplierRanges, isLoadingData, dataError } = useMultiplierData()

  const { saveCrashData, isSavingCrash, crashSaveError } = useCrashData()

  const {
    multiplier,
    isAnimating,
    showMultiplier,
    countingMultiplier,
    isCounting,
    handleStart,
    generateRandomMultiplier,
  } = useGameLogic(multiplierRanges, saveCrashData)

  const handleBack = () => {
    router.replace("/home")
  }

  return (
    <div className="relative w-full min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Background */}
      <StarfieldBackground />

      {/* Glass overlay for better readability */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-purple-900/10 to-blue-900/10 backdrop-blur-[2px]"></div>

      {/* Back button */}
      <div className="absolute top-4 right-4 z-20">
        <Button
          onClick={handleBack}
          variant="outline"
          size="sm"
          className="bg-black/30 backdrop-blur-md border border-white/20 text-white hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-4 w-4 mr-2" />
          पछाडि
        </Button>
      </div>

      <div className="relative z-10 w-full max-w-md flex flex-col items-center justify-center px-4 py-8">
        {/* Game title */}
        <div className="flex flex-col items-center justify-center text-center mb-4">
          <img src="/aviator.png" className="h-28 mx-auto" alt="Aviator" />
        </div>

        {/* Loading and error states */}
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

        {/* Multiplier display */}
        <div className="relative w-full flex flex-col items-center justify-center mb-8">
          <MultiplierDisplay showMultiplier={showMultiplier} countingMultiplier={countingMultiplier} />
        </div>

        {/* Game controls */}
        <GameControls
          handleStart={handleStart}
          isAnimating={isAnimating}
          isLoadingData={isLoadingData}
          isSavingCrash={isSavingCrash}
          crashSaveError={crashSaveError}
        />
      </div>

      {/* Footer */}
      <div className="relative z-10 w-full text-center text-gray-500 text-xs mt-8 mb-4">
        <p>© २०२५ मिनी क्र्यास गेम। सबै अधिकार सुरक्षित।</p>
      </div>
    </div>
  )
}
