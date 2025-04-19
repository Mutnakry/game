"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { LockIcon, ShieldIcon, EyeIcon, EyeOffIcon } from 'lucide-react'

export default function AdminLogin() {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [attempts, setAttempts] = useState(0)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const locked = localStorage.getItem("adminLocked")
    const loggedIn = localStorage.getItem("token")

    if (locked === "true") {
      setError("Access denied. You have been locked out.")
    }

    if (loggedIn) {
      router.push("/backend")
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Simulate network request
    await new Promise(resolve => setTimeout(resolve, 800))
    
    const email = "admin1@gmail.com"
    if (password === "admin123" && email === "admin1@gmail.com") {
      setError("")
      localStorage.setItem("token", "admin-auth-token")
      router.push("/backend")
    } else {
      const currentAttempts = attempts + 1
      setAttempts(currentAttempts)
      setIsLoading(false)
      setError("Invalid password.")

      if (currentAttempts >= 3) {
        localStorage.setItem("adminLocked", "true")
        setError("Too many attempts. You are now locked out permanently.")
      }
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900">
      <div className="absolute inset-0 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-20 left-20 w-64 h-64 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-40 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-40 left-1/3 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>
      
      <motion.div 
        className="relative w-full max-w-md mx-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="backdrop-blur-sm bg-white/10 rounded-3xl overflow-hidden shadow-2xl border border-white/20">
          {/* Header with logo */}
          <div className="p-8 text-center relative">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-indigo-600/30 to-transparent opacity-50"></div>
            <motion.div 
              className="relative mb-3 inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-lg"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: "spring", 
                stiffness: 400, 
                damping: 10,
                delay: 0.2
              }}
            >
              <ShieldIcon className="w-10 h-10 text-white" />
            </motion.div>
            <motion.h1 
              className="text-3xl font-bold text-white mb-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Admin Portal
            </motion.h1>
            <motion.p 
              className="text-indigo-200 text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Secure access to dashboard controls
            </motion.p>
          </div>
          
          {/* Login form */}
          <div className="p-8 pt-2 bg-white/10 backdrop-blur-md">
            <form onSubmit={handleSubmit} className="space-y-6">
              <motion.div 
                className="space-y-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <label htmlFor="password" className="block text-sm font-medium text-indigo-100">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockIcon className="h-5 w-5 text-indigo-300" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 py-3 bg-white/10 border-indigo-300/30 text-white placeholder-indigo-300 focus:ring-indigo-500 focus:border-indigo-500 block w-full rounded-xl"
                    placeholder="Enter your password"
                    required
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="text-indigo-300 hover:text-indigo-100 focus:outline-none"
                    >
                      {showPassword ? (
                        <EyeOffIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
                {error && (
                  <motion.p 
                    className="mt-2 text-red-300 text-sm"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 15 }}
                  >
                    {error}
                  </motion.p>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Button 
                  type="submit" 
                  className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
                  disabled={isLoading || error === "Too many attempts. You are now locked out permanently."}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Authenticating...
                    </div>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </motion.div>
            </form>
            
            <motion.div 
              className="mt-6 text-center text-sm text-indigo-200"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              Protected area. Authorized personnel only.
            </motion.div>
          </div>
        </div>
        
      </motion.div>
    </div>
  )
}
