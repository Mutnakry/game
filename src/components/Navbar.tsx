"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { FaHome, FaUserCog, FaWhatsapp, FaSignOutAlt, FaBars } from "react-icons/fa"
import { PiWhatsappLogoThin } from "react-icons/pi"
import { GiCupcake } from "react-icons/gi"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"

interface NavItem {
    name: string
    icon: React.ElementType
    color: string
    gradient: string
    lightColor: string
    hoverGradient: string
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
    const [scrolled, setScrolled] = useState(false)

    // Handle scroll effect for sticky header
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10)
        }
        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    const navItems: NavItem[] = [
        {
            name: "Dashboard",
            icon: FaHome,
            color: "text-pink-500",
            gradient: "from-pink-400/80 to-pink-500/80",
            lightColor: "bg-pink-50",
            hoverGradient: "from-pink-400 to-pink-500",
        },
        {
            name: "History",
            icon: FaUserCog, // Changed from FaWhatsapp
            color: "text-indigo-500", // Changed from amber
            gradient: "from-indigo-400/80 to-indigo-500/80",
            lightColor: "bg-indigo-50",
            hoverGradient: "from-indigo-400 to-indigo-500",
        },
        {
            name: "User",
            icon: FaUserCog,
            color: "text-purple-500",
            gradient: "from-purple-400/80 to-purple-500/80",
            lightColor: "bg-purple-50",
            hoverGradient: "from-purple-400 to-purple-500",
        },
        {
            name: "Rang Multiplier",
            icon: FaUserCog,
            color: "text-blue-500",
            gradient: "from-blue-400/80 to-blue-500/80",
            lightColor: "bg-blue-50",
            hoverGradient: "from-blue-400 to-blue-500",
        },
        // {
        //     name: "Presets",
        //     icon: PiWhatsappLogoThin,
        //     color: "text-green-500",
        //     gradient: "from-green-400/80 to-green-500/80",
        //     lightColor: "bg-green-50",
        //     hoverGradient: "from-green-400 to-green-500",
        // },
        {
            name: "What App",
            icon: FaWhatsapp,
            color: "text-yellow-500",
            gradient: "from-yellow-400/80 to-yellow-500/80",
            lightColor: "bg-yellow-50",
            hoverGradient: "from-yellow-400 to-yellow-500",
        },
    ]

    const handleLogout = () => {
        localStorage.removeItem("token")
        router.replace("/admin")
    }

    return (
        <div className="w-full">
            {/* Decorative background elements */}
            <div className="absolute top-0 left-0 w-full h-64 overflow-hidden -z-10">
                <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full bg-gradient-to-br from-pink-200 to-purple-200 opacity-30 blur-3xl"></div>
                <div className="absolute top-20 -right-20 w-72 h-72 rounded-full bg-gradient-to-br from-yellow-200 to-amber-200 opacity-30 blur-3xl"></div>
            </div>

            {/* Header with logo and logout */}
            <div
                className={cn(
                    "flex justify-between items-center w-full px-6 py-4 transition-all duration-300",
                    scrolled ? "sticky top-0 z-50 backdrop-blur-md bg-white/80 shadow-md rounded-b-2xl" : "",
                )}
            >
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex items-center gap-2"
                >
                    <motion.div
                        whileHover={{ rotate: [0, -10, 10, -5, 5, 0], transition: { duration: 0.5 } }}
                        className="relative"
                    >
                        <div className="absolute inset-0 bg-pink-300 rounded-full blur-md opacity-50"></div>
                        <GiCupcake className="text-pink-500 text-3xl relative z-10" />
                    </motion.div>
                    <div className="flex flex-col">
                        <span className="font-bold text-xl bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                            Admin Panel
                        </span>
                        <span className="text-xs text-gray-400">Sweet Management</span>
                    </div>
                </motion.div>

                <motion.button
                    whileHover={{ scale: 1.05, boxShadow: "0 10px 15px -3px rgba(236, 72, 153, 0.3)" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleLogout}
                    className="flex items-center gap-2 bg-gradient-to-r from-pink-400 to-purple-400 text-white px-5 py-2.5 rounded-full text-sm font-medium shadow-md hover:shadow-lg transition-all duration-200"
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
                        className="bg-gradient-to-r from-pink-400 to-purple-400 text-white p-3 rounded-full shadow-lg"
                        whileHover={{ scale: 1.05, boxShadow: "0 10px 15px -3px rgba(236, 72, 153, 0.3)" }}
                        whileTap={{ scale: 0.9 }}
                        aria-label="Toggle menu"
                    >
                        <FaBars className="text-lg" />
                    </motion.button>
                </div>

                {/* Mobile menu - only visible when toggled on small screens */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div
                            className="md:hidden bg-white/90 backdrop-blur-md rounded-2xl shadow-lg p-3 mb-3 overflow-hidden border border-gray-100"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                        >
                            <div className="flex flex-col gap-2.5">
                                {navItems.map((item, index) => (
                                    <motion.button
                                        key={`mobile-${item.name}`}
                                        onClick={() => {
                                            setActiveTab(index)
                                            setMobileMenuOpen(false)
                                        }}
                                        className={cn(
                                            "relative rounded-xl px-4 py-3 flex items-center gap-3 font-medium transition-all duration-200 w-full",
                                            activeTab === index
                                                ? `bg-gradient-to-r ${item.gradient} text-white shadow-md`
                                                : `${item.lightColor} ${item.color}`,
                                        )}
                                        whileHover={{
                                            scale: 1.02,
                                            backgroundColor: activeTab !== index ? "#ffffff" : undefined,
                                            backgroundImage: activeTab !== index
                                                ? `linear-gradient(to right, ${item.hoverGradient.replace('from-', '').replace('to-', '')})`
                                                : undefined,
                                            color: activeTab !== index ? "#ffffff" : undefined,
                                        }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <div
                                            className={cn(
                                                "flex items-center justify-center w-8 h-8 rounded-full",
                                                activeTab === index ? "bg-white/20" : "bg-white",
                                            )}
                                        >
                                            <item.icon className={cn("text-lg", activeTab === index ? "text-white" : item.color)} />
                                        </div>
                                        <span>{item.name}</span>

                                        {activeTab === index && (
                                            <motion.div
                                                layoutId="mobileActiveTabIndicator"
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-white rounded-full"
                                                transition={{ type: "spring", bounce: 0.5, duration: 0.6 }}
                                            />
                                        )}
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Desktop navbar - hidden on small screens */}
                <div className="hidden md:block">
                    <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg p-3 flex flex-wrap gap-2 justify-center md:justify-start border border-gray-100">
                        {navItems.map((item, index) => (
                            <motion.button
                                key={item.name}
                                onClick={() => setActiveTab(index)}
                                className={cn(
                                    "relative rounded-xl px-4 py-2.5 flex items-center gap-2.5 font-medium transition-all duration-300",
                                    activeTab === index
                                        ? `bg-gradient-to-r ${item.gradient} text-white shadow-md`
                                        : `${item.lightColor} ${item.color}`,
                                )}
                                whileHover={{
                                    scale: 1.05,
                                    backgroundColor: activeTab !== index ? "#ffffff" : undefined,
                                    backgroundImage: activeTab !== index 
                                        ? `linear-gradient(to right, ${item.hoverGradient.replace('from-', '').replace('to-', '')})`
                                        : undefined,
                                    color: activeTab !== index ? "#ffffff" : undefined,
                                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                                }}
                            >
                                <div
                                    className={cn(
                                        "flex items-center justify-center w-7 h-7 rounded-full",
                                        activeTab === index ? "bg-white/20" : "bg-white",
                                    )}
                                >
                                    <item.icon className={cn("text-lg", activeTab === index ? "text-white" : item.color)} />
                                </div>
                                <span>{item.name}</span>

                                {activeTab === index && (
                                    <motion.div
                                        layoutId="activeTabIndicator"
                                        className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white rounded-full shadow-sm"
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
