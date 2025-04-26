"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut, Flame, Trophy, Bell } from 'lucide-react'
import useAutoLogout from "@/components/auth/useAutoLogout"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"

export default function HomePage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  // Auto logout check
  useEffect(() => {
    setMounted(true)
    const loginTime = localStorage.getItem("loginTime")
    const token = localStorage.getItem("token")

    if (!token || !loginTime) return

    const checkSessionExpiry = () => {
      const currentTime = new Date().getTime()
      const loginTimeMs = Number.parseInt(loginTime, 10)
      const sessionDuration = 30 * 60 * 1000 // 30 minutes in milliseconds

      if (currentTime - loginTimeMs > sessionDuration) {
        handleLogout()
      }
    }

    const interval = setInterval(checkSessionExpiry, 60000) // Check every minute
    checkSessionExpiry()

    return () => clearInterval(interval)
  }, [])

  useAutoLogout()

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("loginTime")
    router.replace("/login")
  }

  if (!mounted) return null

  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-red-500/10 via-transparent to-transparent"></div>
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-red-900/10 via-transparent to-transparent"></div>
      </div>

      <div className="container relative z-10 mx-auto px-4 py-8">
        <header className="mb-12 relative">
          {/* Top navigation bar */}
          <div className="flex justify-between items-center mb-8">
           
            {/* Main Logo - Centered */}
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <motion.img 
                src="/LOGO CRASH-02.png" 
                alt="CRASH977 Logo" 
                className="h-16 object-contain"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
              />
            </div>

            {/* Right side controls */}
            <div className="flex items-center space-x-2">
            
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="bg-black/30 backdrop-blur-md border border-white/20 text-white hover:bg-white/10 hover:text-white rounded-full"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>

          
        </header>

        <motion.div 
          className="grid grid-cols-1 gap-6 max-w-md mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          
          {/* Game Cards */}
          <div className="space-y-6">
            <GameCard 
              title="CRASH977" 
              imageSrc="/crash.png" 
              href="/crash-game" 
              description="Multiplayer crash game"
              delay={0.1}
            />

            <GameCard 
              title="JetX" 
              imageSrc="/jetx.png" 
              href="/crash-game" 
              description="Space adventure game"
              delay={0.2}
            />

            <GameCard 
              title="Space Man" 
              imageSrc="/spine.png" 
              href="/crash-game" 
              description="Cosmic exploration game"
              multiplier="10.5x"
              delay={0.3}
            />
          </div>
        </motion.div>
      </div>
    </main>
  )
}

interface GameCardProps {
  title: string
  imageSrc: string
  href: string
  description?: string
  multiplier?: string
  delay?: number
}

function GameCard({ title, imageSrc, href, description, multiplier, delay = 0 }: GameCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ scale: 1.03 }}
      className="relative"
    >
      <Link
        href={href}
        className="block relative overflow-hidden rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-red-500/20 border border-white/10"
      >
        <div className="flex items-center">
          <div className="relative h-32 w-44 flex-shrink-0">
            <Image
              src={imageSrc || "/placeholder.svg"}
              alt={title}
              fill
              className="object object-contain"
              priority={title === "CRASH977"}
            />
          </div>
          
          <div className="p-4 flex-1">
            <h2 className="text-xl font-bold mb-1">{title}</h2>
            {description && <p className="text-sm text-gray-400">{description}</p>}
            
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span className="text-xs text-green-500">Live</span>
              </div>
              
              {multiplier && (
                <div className="bg-red-500/20 text-red-400 px-2 py-1 rounded-full text-xs font-bold">
                  {multiplier}
                </div>
              )}
            </div>
          </div>
          
          <div className="pr-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="m9 18 6-6-6-6"/></svg>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

