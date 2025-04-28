"use client"

import { useState, useEffect } from "react"
import { collection, getCountFromServer, query, where, getDocs, orderBy, limit, Timestamp } from "firebase/firestore"
import { db } from "@/components/firebase-config"
import { motion, AnimatePresence } from "framer-motion"
import {
  Users,
  History,
  TrendingUp,
  Award,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  RefreshCw,
  BarChart3,
  Calendar,
  Clock,
  AlertCircle,
  Trophy,
  Sparkles,
} from "lucide-react"

// Define types for our data
type Winner = {
  id: string
  userId?: string
  prize: string
  timestamp: string | Date
  multiplier?: number
  betAmount?: number
  profit?: number
}

type PrizeDistribution = {
  label: string
  value: number
  color: string
}

export default function AdminDashboard() {
  // State for counts
  const [totalCrashes, setTotalCrashes] = useState(0)
  const [activeUsers, setActiveUsers] = useState(0)
  const [inactiveUsers, setInactiveUsers] = useState(0)
  const [loading, setLoading] = useState(true)
  const [userLoading, setUserLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userError, setUserError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  // State for distribution and winners
  const [chartData, setChartData] = useState<PrizeDistribution[]>([])
  const [chartLoading, setChartLoading] = useState(true)
  const [chartError, setChartError] = useState<string | null>(null)
  const [maxValue, setMaxValue] = useState(0)

  const [recentWinners, setRecentWinners] = useState<Winner[]>([])
  const [winnersLoading, setWinnersLoading] = useState(true)
  const [winnersError, setWinnersError] = useState<string | null>(null)

  const crashesRef = collection(db, "crashHistory-crazi")
  const usersRef = collection(db, "users-crazi")

  // Fetch total crash history count
  useEffect(() => {
    async function fetchCrashCount() {
      try {
        setLoading(true)

        // Get the total count of documents in the crashHistory collection
        const snapshot = await getCountFromServer(crashesRef)
        setTotalCrashes(snapshot.data().count)
      } catch (err) {
        console.error("Error fetching crash count:", err)
        setError("Failed to load crash history count")
      } finally {
        setLoading(false)
      }
    }

    fetchCrashCount()
  }, [])

  // Fetch active and inactive user counts
  useEffect(() => {
    async function fetchUserCounts() {
      try {
        setUserLoading(true)

        // Method 1: Using queries with where clause and getCountFromServer
        const activeQuery = query(usersRef, where("status", "==", "active"))
        const inactiveQuery = query(usersRef, where("status", "==", "inactive"))

        const activeSnapshot = await getCountFromServer(activeQuery)
        const inactiveSnapshot = await getCountFromServer(inactiveQuery)

        setActiveUsers(activeSnapshot.data().count)
        setInactiveUsers(inactiveSnapshot.data().count)
      } catch (err) {
        console.error("Error fetching user counts:", err)
        setUserError("Failed to load user counts")
      } finally {
        setUserLoading(false)
      }
    }

    fetchUserCounts()
  }, [])

  // Fetch prize distribution data
  const fetchPrizeDistribution = async () => {
    try {
      setChartLoading(true)

      // Get the last 30 days of data
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const distributionQuery = query(
        crashesRef,
        where("timestamp", ">=", Timestamp.fromDate(thirtyDaysAgo)),
        orderBy("timestamp", "desc"),
      )

      const querySnapshot = await getDocs(distributionQuery)

      // Process the data to get prize distribution
      // We'll categorize by multiplier ranges to match game-history data structure
      const prizeCategories: Record<string, number> = {
        "High Multiplier (5x+)": 0,
        "Medium Multiplier (2x-5x)": 0,
        "Low Multiplier (1.5x-2x)": 0,
        "Minimal Multiplier (<1.5x)": 0,
      }

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        const multiplier = data.crashPoint || 1

        // Categorize based on multiplier ranges
        if (multiplier >= 5) {
          prizeCategories["High Multiplier (5x+)"]++
        } else if (multiplier >= 2) {
          prizeCategories["Medium Multiplier (2x-5x)"]++
        } else if (multiplier >= 1.5) {
          prizeCategories["Low Multiplier (1.5x-2x)"]++
        } else {
          prizeCategories["Minimal Multiplier (<1.5x)"]++
        }
      })

      // Convert to the format needed for the chart
      const colors = {
        "High Multiplier (5x+)": "#3b82f6", // blue
        "Medium Multiplier (2x-5x)": "#f97316", // orange
        "Low Multiplier (1.5x-2x)": "#10b981", // green
        "Minimal Multiplier (<1.5x)": "#ef4444", // red
      }

      const distribution = Object.entries(prizeCategories).map(([label, value]) => ({
        label,
        value,
        color: colors[label as keyof typeof colors] || "#a3a3a3",
      }))

      setChartData(distribution)

      // Calculate max value for chart scaling
      const max = Math.max(...distribution.map((item) => item.value))
      setMaxValue(max)
    } catch (err) {
      console.error("Error fetching prize distribution:", err)
      setChartError("Failed to load prize distribution")

      // Fallback to sample data if there's an error
      const fallbackData = [
        { label: "High Multiplier (5x+)", value: 5, color: "#3b82f6" },
        { label: "Medium Multiplier (2x-5x)", value: 12, color: "#f97316" },
        { label: "Low Multiplier (1.5x-2x)", value: 28, color: "#10b981" },
        { label: "Minimal Multiplier (<1.5x)", value: 102, color: "#ef4444" },
      ]
      setChartData(fallbackData)
      setMaxValue(Math.max(...fallbackData.map((item) => item.value)))
    } finally {
      setChartLoading(false)
    }
  }

  useEffect(() => {
    fetchPrizeDistribution()
  }, [])

  // Fetch recent winners
  async function fetchRecentWinners() {
    try {
      setWinnersLoading(true)

      // Simplified query that doesn't require a composite index
      // Just query all recent crash history and filter in memory
      const winnersQuery = query(
        crashesRef,
        orderBy("timestamp", "desc"), // Only use a single orderBy
        limit(20), // Get more items so we have enough after filtering
      )

      const querySnapshot = await getDocs(winnersQuery)

      // Filter the results in memory instead of in the query
      const filteredDocs = querySnapshot.docs
        .filter((doc) => {
          const data = doc.data()
          return data.userCashedOut === true && data.profit > 0
        })
        .slice(0, 5) // Take only the first 5 after filtering

      const winners: Winner[] = filteredDocs.map((doc) => {
        const data = doc.data()

        // Format timestamp - matching game-history format
        let timestamp
        if (data.timestamp && typeof data.timestamp.toDate === "function") {
          timestamp = data.timestamp.toDate()
        } else if (data.timestamp instanceof Date) {
          timestamp = data.timestamp
        } else {
          timestamp = new Date()
        }

        // Format the prize string to match game-history format
        const prizeText = `Won - Rp ${data.profit ? data.profit.toFixed(2) : "0.00"}`

        return {
          id: doc.id,
          userId: data.userId || `USER${Math.floor(Math.random() * 10000)}`,
          prize: prizeText,
          timestamp: formatTimestamp(timestamp),
          multiplier: data.crashPoint,
          betAmount: data.betAmount,
          profit: data.profit,
        }
      })

      // Sort by profit in memory (since we're not using orderBy in the query)
      winners.sort((a, b) => (b.profit || 0) - (a.profit || 0))

      setRecentWinners(winners)
    } catch (err) {
      console.error("Error fetching recent winners:", err)
      setWinnersError("Failed to load recent winners")

      // Fallback to sample data that matches game-history structure
      const fallbackWinners = [
        {
          id: "LKAP125S",
          userId: "USER4872",
          prize: "Won - Rp 250.00",
          timestamp: formatTimestamp(new Date()),
          multiplier: 2.5,
          betAmount: 100,
          profit: 250,
        },
        {
          id: "MN45ADS",
          userId: "USER1234",
          prize: "Won - Rp 120.50",
          timestamp: formatTimestamp(new Date(Date.now() - 2 * 60 * 60 * 1000)),
          multiplier: 2.1,
          betAmount: 50,
          profit: 120.5,
        },
        {
          id: "ABCV456",
          userId: "USER7890",
          prize: "Won - Rp 75.25",
          timestamp: formatTimestamp(new Date(Date.now() - 5 * 60 * 60 * 1000)),
          multiplier: 1.8,
          betAmount: 40,
          profit: 75.25,
        },
        {
          id: "GD90054T",
          userId: "USER5678",
          prize: "Won - Rp 310.00",
          timestamp: formatTimestamp(new Date(Date.now() - 24 * 60 * 60 * 1000)),
          multiplier: 3.1,
          betAmount: 100,
          profit: 310,
        },
        {
          id: "T5627GLL",
          userId: "USER9012",
          prize: "Won - Rp 50.75",
          timestamp: formatTimestamp(new Date(Date.now() - 28 * 60 * 60 * 1000)),
          multiplier: 1.5,
          betAmount: 35,
          profit: 50.75,
        },
      ]

      setRecentWinners(fallbackWinners)
    } finally {
      setWinnersLoading(false)
    }
  }

  useEffect(() => {
    fetchRecentWinners()
  }, [])

  // Helper function to format timestamp
  function formatTimestamp(date: Date | string): string {
    if (typeof date === "string") return date

    return new Intl.DateTimeFormat("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(date)
  }

  // Refresh all data
  const handleRefresh = async () => {
    setRefreshing(true)

    // Fetch all data again
    try {
      const fetchCrashCount = async () => {
        try {
          const snapshot = await getCountFromServer(crashesRef)
          setTotalCrashes(snapshot.data().count)
          setError(null)
        } catch (err) {
          console.error("Error refreshing crash count:", err)
          setError("Failed to refresh crash history count")
        }
      }

      const fetchUserCounts = async () => {
        try {
          const activeQuery = query(usersRef, where("status", "==", "active"))
          const inactiveQuery = query(usersRef, where("status", "==", "inactive"))

          const activeSnapshot = await getCountFromServer(activeQuery)
          const inactiveSnapshot = await getCountFromServer(inactiveQuery)

          setActiveUsers(activeSnapshot.data().count)
          setInactiveUsers(inactiveSnapshot.data().count)
          setUserError(null)
        } catch (err) {
          console.error("Error refreshing user counts:", err)
          setUserError("Failed to refresh user counts")
        }
      }

      // Run all fetches in parallel
      await Promise.all([fetchCrashCount(), fetchUserCounts(), fetchPrizeDistribution(), fetchRecentWinners()])
    } catch (err) {
      console.error("Error during refresh:", err)
    } finally {
      setRefreshing(false)
    }
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  }

  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50"
      initial="hidden"
      animate="show"
      variants={containerVariants}
    >
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full bg-gradient-to-br from-blue-200 to-indigo-200 opacity-30 blur-3xl"></div>
        <div className="absolute top-20 -right-20 w-72 h-72 rounded-full bg-gradient-to-br from-purple-200 to-pink-200 opacity-30 blur-3xl"></div>
      </div>

      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4"
      >
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Dashboard Overview
          </h2>
          <p className="text-slate-500 mt-1">Monitor your platform's performance and user activity</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm border border-slate-200">
            <Calendar className="h-4 w-4 text-slate-500 mr-2" />
            <span className="text-sm text-slate-600">
              {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-4 py-2 rounded-lg shadow-md disabled:opacity-70"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            <span>{refreshing ? "Refreshing..." : "Refresh Data"}</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" variants={containerVariants}>
        {/* Total Crashes */}
        <motion.div
          variants={itemVariants}
          className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-slate-100 p-6 hover:shadow-xl transition-all duration-300 group"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Crashes</p>
              {loading ? (
                <div className="flex items-center mt-2">
                  <Loader2 className="h-5 w-5 text-blue-500 animate-spin mr-2" />
                  <span className="text-slate-400">Loading...</span>
                </div>
              ) : error ? (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <AlertCircle className="h-3.5 w-3.5 mr-1" />
                  {error}
                </p>
              ) : (
                <motion.h3
                  className="text-3xl font-bold text-slate-800 mt-1"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  {totalCrashes.toLocaleString()}
                </motion.h3>
              )}
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-lg shadow-md group-hover:scale-110 transition-transform duration-300">
              <History className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <motion.div
                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2.5 rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: loading ? "0%" : "93%" }}
                transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
              ></motion.div>
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-slate-500 text-xs">93% used</p>
              <div className="flex items-center text-green-600 text-xs font-medium">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                <span>12% increase</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Users Card */}
        <motion.div
          variants={itemVariants}
          className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-slate-100 p-6 hover:shadow-xl transition-all duration-300 group"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Users</p>
              {userLoading ? (
                <div className="flex items-center mt-2">
                  <Loader2 className="h-5 w-5 text-purple-500 animate-spin mr-2" />
                  <span className="text-slate-400">Loading...</span>
                </div>
              ) : userError ? (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <AlertCircle className="h-3.5 w-3.5 mr-1" />
                  {userError}
                </p>
              ) : (
                <motion.h3
                  className="text-3xl font-bold text-slate-800 mt-1"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  {(activeUsers + inactiveUsers).toLocaleString()}
                </motion.h3>
              )}
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-3 rounded-lg shadow-md group-hover:scale-110 transition-transform duration-300">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
          {!userLoading && !userError && (
            <div className="mt-4 space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                    <span className="text-sm text-slate-600">Active</span>
                  </div>
                  <span className="font-semibold text-slate-700">{activeUsers.toLocaleString()}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="bg-gradient-to-r from-green-400 to-green-500 h-2 rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: `${(activeUsers / (activeUsers + inactiveUsers || 1)) * 100}%` }}
                    transition={{ duration: 1.5, delay: 0.6, ease: "easeOut" }}
                  ></motion.div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                    <span className="text-sm text-slate-600">Inactive</span>
                  </div>
                  <span className="font-semibold text-slate-700">{inactiveUsers.toLocaleString()}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="bg-gradient-to-r from-red-400 to-red-500 h-2 rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: `${(inactiveUsers / (activeUsers + inactiveUsers || 1)) * 100}%` }}
                    transition={{ duration: 1.5, delay: 0.7, ease: "easeOut" }}
                  ></motion.div>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Conversion Rate */}
        <motion.div
          variants={itemVariants}
          className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-slate-100 p-6 hover:shadow-xl transition-all duration-300 group"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Conversion Rate</p>
              <motion.h3
                className="text-3xl font-bold text-slate-800 mt-1"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                24.8%
              </motion.h3>
            </div>
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-3 rounded-lg shadow-md group-hover:scale-110 transition-transform duration-300">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <motion.div
                className="bg-gradient-to-r from-emerald-400 to-teal-500 h-2.5 rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: "24.8%" }}
                transition={{ duration: 1.5, delay: 0.8, ease: "easeOut" }}
              ></motion.div>
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center text-green-600 text-sm font-medium mt-2">
                <ArrowUpRight className="w-4 h-4 mr-1" />
                <span>3.2% increase</span>
              </div>
              <span className="text-slate-400 text-xs">vs last week</span>
            </div>
          </div>
        </motion.div>

        {/* Total Prizes */}
        <motion.div
          variants={itemVariants}
          className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-slate-100 p-6 hover:shadow-xl transition-all duration-300 group"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Prizes</p>
              <motion.h3
                className="text-3xl font-bold text-slate-800 mt-1"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                Rp 5.2M
              </motion.h3>
            </div>
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-3 rounded-lg shadow-md group-hover:scale-110 transition-transform duration-300">
              <Award className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <motion.div
                className="bg-gradient-to-r from-amber-400 to-orange-500 h-2.5 rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: "65%" }}
                transition={{ duration: 1.5, delay: 0.9, ease: "easeOut" }}
              ></motion.div>
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center text-red-500 text-sm font-medium mt-2">
                <ArrowDownRight className="w-4 h-4 mr-1" />
                <span>1.5% decrease</span>
              </div>
              <span className="text-slate-400 text-xs">vs last month</span>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Distribution and Recent Winners */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribution Chart */}
        <motion.div
          variants={itemVariants}
          className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-slate-100 p-6 hover:shadow-xl transition-all duration-300"
        >
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <BarChart3 className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-slate-800">Prize Distribution</h3>
            </div>
            <div className="bg-blue-50 text-blue-600 text-xs font-medium px-3 py-1.5 rounded-full border border-blue-100 shadow-sm">
              Last 30 days
            </div>
          </div>

          {chartLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative w-16 h-16 mb-4">
                <div className="absolute inset-0 rounded-full border-4 border-blue-100"></div>
                <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
              </div>
              <p className="text-slate-500">Loading distribution data...</p>
            </div>
          ) : chartError ? (
            <div className="bg-red-50 border border-red-100 rounded-lg p-4 text-center">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-red-600 text-sm">{chartError}</p>
              <button
                onClick={() => fetchPrizeDistribution()}
                className="mt-3 text-xs bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded-full"
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-5">
                {chartData.map((item, index) => (
                  <motion.div
                    key={index}
                    className="space-y-2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 + 0.5 }}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></div>
                        <span className="text-sm font-medium text-slate-600">{item.label}</span>
                      </div>
                      <span className="text-sm font-semibold text-slate-800">{item.value.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden shadow-inner">
                      <motion.div
                        className="h-3 rounded-full shadow-sm"
                        style={{ backgroundColor: item.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${(item.value / maxValue) * 100}%` }}
                        transition={{ duration: 1.5, delay: index * 0.2 + 0.5, ease: "easeOut" }}
                      ></motion.div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500 flex items-center">
                    <Clock className="h-4 w-4 mr-1.5 text-slate-400" />
                    Total Records
                  </span>
                  <motion.span
                    className="text-sm font-semibold text-slate-800 bg-slate-100 px-3 py-1 rounded-full"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 1.5 }}
                  >
                    {chartData.reduce((acc, item) => acc + item.value, 0).toLocaleString()}
                  </motion.span>
                </div>
              </div>
            </>
          )}
        </motion.div>

        {/* Recent Winners */}
        <motion.div
          variants={itemVariants}
          className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-slate-100 p-6 hover:shadow-xl transition-all duration-300"
        >
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <Trophy className="h-5 w-5 text-amber-500 mr-2" />
              <h3 className="text-lg font-semibold text-slate-800">Recent Winners</h3>
            </div>
            <button className="text-blue-600 text-sm font-medium hover:text-blue-700 flex items-center transition-colors group">
              View all
              <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {winnersLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative w-16 h-16 mb-4">
                <div className="absolute inset-0 rounded-full border-4 border-amber-100"></div>
                <div className="absolute inset-0 rounded-full border-4 border-amber-500 border-t-transparent animate-spin"></div>
              </div>
              <p className="text-slate-500">Loading winners data...</p>
            </div>
          ) : winnersError ? (
            <div className="bg-red-50 border border-red-100 rounded-lg p-4 text-center">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-red-600 text-sm">{winnersError}</p>
              <button
                onClick={() => fetchRecentWinners()}
                className="mt-3 text-xs bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded-full"
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <AnimatePresence>
                  {recentWinners.map((winner, index) => (
                    <motion.div
                      key={winner.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: index * 0.1, duration: 0.4 }}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200"
                    >
                      <div className="flex items-center">
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full blur-sm opacity-70"></div>
                          <div className="bg-gradient-to-br from-blue-500 to-purple-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold relative">
                            {winner.userId?.substring(0, 2) || winner.id.substring(0, 2)}
                          </div>
                          {winner.multiplier && winner.multiplier >= 3 && (
                            <div className="absolute -top-1 -right-1 bg-amber-500 text-white rounded-full w-5 h-5 flex items-center justify-center shadow-md">
                              <Sparkles className="w-3 h-3" />
                            </div>
                          )}
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-slate-800">{winner.userId || winner.id}</p>
                          <p className="text-xs text-slate-500 flex items-center">
                            {winner.multiplier && (
                              <>
                                <span
                                  className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${
                                    winner.multiplier >= 5
                                      ? "bg-blue-500"
                                      : winner.multiplier >= 2
                                        ? "bg-amber-500"
                                        : winner.multiplier >= 1.5
                                          ? "bg-green-500"
                                          : "bg-red-500"
                                  }`}
                                ></span>
                                <span
                                  className={`${
                                    winner.multiplier >= 5
                                      ? "text-blue-600"
                                      : winner.multiplier >= 2
                                        ? "text-amber-600"
                                        : winner.multiplier >= 1.5
                                          ? "text-green-600"
                                          : "text-red-600"
                                  } font-medium`}
                                >
                                  {winner.multiplier.toFixed(2)}x
                                </span>
                                <span className="mx-1 text-slate-400">•</span>
                              </>
                            )}
                            <span>{winner.timestamp.toString().split(",")[0]}</span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-emerald-600">{winner.prize}</p>
                        <p className="text-xs text-slate-500">
                          {winner.betAmount && `Bet: Rp ${winner.betAmount.toFixed(2)}`}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <motion.div
                className="mt-6 pt-4 border-t border-slate-200"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
              >
                <button className="w-full py-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-blue-600 font-medium rounded-lg transition-colors flex items-center justify-center">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View complete game history
                </button>
              </motion.div>
            </>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}
