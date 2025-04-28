
"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { CuteNavbar } from "@/components/Navbar"
import ShowUserLogin from "@/components/ShowUserLogin"
import RandDomMultiplire from "@/components/rand-dom-multiplire"
import AdminDashBoard from "@/components/admin-dashboard"
import  GameHistory  from "@/components/game-history"
import { AddNewPresets } from "@/components/and-new-resets"
import FormWhatApp from "@/components/form-whatapp"

const Page = () => {
  const [activeTabIndex, setActiveTabIndex] = useState(0)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/admin") // redirect to login if not authenticated
    }
  }, [router])

  // Content components for each tab
  const tabContent = [
    // Dashboard
    <div key="dashboard" className="space-y-4">
      <AdminDashBoard />
    </div>,
    <div key="History">
      <GameHistory />
    </div>,
    // User
    <div key="user">
      <ShowUserLogin />
    </div>,

    // Rang Multiplier
    <div key="multiplier">
      <RandDomMultiplire />
    </div>,
    // Presets
    // <div key="presets">
    //   <AddNewPresets />
    // </div>,
    // What App
    <div key="whatapp">
      <FormWhatApp />
    </div>,
  ]

  return (
    <div className="min-h-screen w-full ">
      <div className="max-w-screen-xl mx-auto">
        {/* Cute Navbar */}
        <CuteNavbar activeTab={activeTabIndex} setActiveTab={setActiveTabIndex} />

        {/* Content Area */}
        <div className="px-4 pb-8">
          <motion.div
            className="bg-white rounded-2xl p-6 shadow-md border-2 border-dashed border-pink-200"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <AnimateContent activeIndex={activeTabIndex}>{tabContent[activeTabIndex]}</AnimateContent>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

// Animation wrapper for tab content
const AnimateContent = ({
  children,
  activeIndex,
}: {
  children: React.ReactNode
  activeIndex: number
}) => {
  return (
    <motion.div
      key={activeIndex}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  )
}

export default Page
