"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { FaHome, FaUserCog, FaWhatsapp, FaSignOutAlt, FaBars } from "react-icons/fa"
import { PiWhatsappLogoThin } from "react-icons/pi"
import { GiCupcake } from "react-icons/gi"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface NavItem {
    name: string
    icon: React.ElementType
    color: string
}

export function CuteNavbar({
    activeTab,
    setActiveTab,
}: {
    activeTab: number
    setActiveTab: (index: number) => void
}) {
    const router = useRouter()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    const navItems: NavItem[] = [
        { name: "Dashboard", icon: FaHome, color: "bg-pink-100 text-pink-500 hover:bg-pink-200" },
        { name: "History", icon: FaWhatsapp, color: "bg-yellow-100 text-yellow-500 hover:bg-yellow-200" },
        { name: "User", icon: FaUserCog, color: "bg-purple-100 text-purple-500 hover:bg-purple-200" },
        { name: "Rang Multiplier", icon: FaUserCog, color: "bg-blue-100 text-blue-500 hover:bg-blue-200" },
        { name: "Presets", icon: PiWhatsappLogoThin, color: "bg-green-100 text-green-500 hover:bg-green-200" },
        { name: "What App", icon: FaWhatsapp, color: "bg-yellow-100 text-yellow-500 hover:bg-yellow-200" },
       
    ]

    const handleLogout = () => {
        localStorage.removeItem("token")
        router.replace("/admin")
    }

    return (
        <div className="w-full">
            {/* Header with logo and logout */}
            <div className="flex justify-between items-center w-full px-6 py-4">
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2">
                    <GiCupcake className="text-pink-500 text-2xl" />
                    <span className="font-bold text-xl bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                        Admin Panel
                    </span>
                </motion.div>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleLogout}
                    className="flex items-center gap-2 bg-gradient-to-r from-pink-400 to-purple-400 text-white px-4 py-2 rounded-full text-sm font-medium shadow-md hover:shadow-lg transition-all duration-200"
                >
                    <span>Logout</span>
                    <FaSignOutAlt />
                </motion.button>
            </div>

            {/* Cute navbar - Desktop */}
            <div className="px-4 pt-2 pb-4">
                {/* Mobile menu button - only visible on small screens */}
                <div className="md:hidden flex justify-end mb-2">
                    <motion.button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="bg-pink-100 text-pink-500 p-2 rounded-full shadow-sm"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.9 }}
                        aria-label="Toggle menu"
                    >
                        <FaBars className="text-lg" />
                    </motion.button>
                </div>

                {/* Mobile menu - only visible when toggled on small screens */}
                {mobileMenuOpen && (
                    <motion.div
                        className="md:hidden bg-white rounded-2xl shadow-lg p-3 mb-3 overflow-hidden"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                        <div className="flex flex-col gap-2">
                            {navItems.map((item, index) => (
                                <motion.button
                                    key={`mobile-${item.name}`}
                                    onClick={() => {
                                        setActiveTab(index)
                                        setMobileMenuOpen(false)
                                    }}
                                    className={cn(
                                        "relative rounded-full px-4 py-2.5 flex items-center gap-2 font-medium transition-all duration-200 w-full",
                                        item.color,
                                        activeTab === index ? "scale-102 shadow-md" : "opacity-80",
                                    )}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <item.icon className="text-lg" />
                                    <span>{item.name}</span>

                                    {activeTab === index && (
                                        <motion.div
                                            layoutId="mobileActiveTabIndicator"
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-white rounded-full border-2 border-current"
                                            transition={{ type: "spring", bounce: 0.5, duration: 0.6 }}
                                        />
                                    )}
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Desktop navbar - hidden on small screens */}
                <div className="hidden md:block">
                    <div className="bg-white rounded-2xl shadow-md p-3 flex flex-wrap gap-2 justify-center md:justify-start">
                        {navItems.map((item, index) => (
                            <motion.button
                                key={item.name}
                                onClick={() => setActiveTab(index)}
                                className={cn(
                                    "relative rounded-full px-4 py-2.5 flex items-center gap-2 font-medium transition-all duration-200",
                                    item.color,
                                    activeTab === index ? "scale-105 shadow-md" : "opacity-80",
                                )}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <item.icon className="text-lg" />
                                <span>{item.name}</span>

                                {activeTab === index && (
                                    <motion.div
                                        layoutId="activeTabIndicator"
                                        className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white rounded-full border-2 border-current"
                                        transition={{ type: "spring", bounce: 0.5, duration: 0.6 }}
                                    />
                                )}
                            </motion.button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
