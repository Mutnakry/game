"use client"

import { useState, useEffect } from "react"
import { collection, getCountFromServer, query, where, getDocs, orderBy, limit, Timestamp } from "firebase/firestore"
import { db } from "@/components/firebase-config"
import { motion } from "framer-motion"
import { Users, History, TrendingUp, Award, ChevronRight, ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react"

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

  // State for distribution and winners
  const [chartData, setChartData] = useState<PrizeDistribution[]>([])
  const [chartLoading, setChartLoading] = useState(true)
  const [chartError, setChartError] = useState<string | null>(null)
  const [maxValue, setMaxValue] = useState(0)

  const [recentWinners, setRecentWinners] = useState<Winner[]>([])
  const [winnersLoading, setWinnersLoading] = useState(true)
  const [winnersError, setWinnersError] = useState<string | null>(null)

  const crashesRef = collection(db, "crashHistory")
  const usersRef = collection(db, "users")

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
  useEffect(() => {
    async function fetchPrizeDistribution() {
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
    show: { opacity: 1, y: 0 },
  }

  return (
    <motion.div
      className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-6"
      initial="hidden"
      animate="show"
      variants={containerVariants}
    >
      <motion.div variants={itemVariants} className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Dashboard Overview</h2>
        <div className="text-sm text-slate-500">Last updated: {new Date().toLocaleDateString()}</div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" variants={containerVariants}>
        {/* Total Crashes */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow"
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
                <p className="text-red-500 text-sm mt-1">Error loading data</p>
              ) : (
                <h3 className="text-3xl font-bold text-slate-800 mt-1">{totalCrashes}</h3>
              )}
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <History className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
                style={{ width: loading ? "0%" : "93%" }}
              ></div>
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
          className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow"
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
                <p className="text-red-500 text-sm mt-1">Error loading data</p>
              ) : (
                <h3 className="text-3xl font-bold text-slate-800 mt-1">{activeUsers + inactiveUsers}</h3>
              )}
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          {!userLoading && !userError && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                  <span className="text-sm text-slate-600">Active</span>
                </div>
                <span className="font-semibold text-slate-700">{activeUsers}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                  <span className="text-sm text-slate-600">Inactive</span>
                </div>
                <span className="font-semibold text-slate-700">{inactiveUsers}</span>
              </div>
            </div>
          )}
        </motion.div>

        {/* Additional Stats Cards */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Conversion Rate</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-1">24.8%</h3>
            </div>
            <div className="bg-emerald-100 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <ArrowUpRight className="w-4 h-4 text-green-600 mr-1" />
            <span className="text-green-600 text-sm font-medium">3.2% increase</span>
            <span className="text-slate-400 text-xs ml-2">vs last week</span>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Prizes</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-1">Rp 5.2M</h3>
            </div>
            <div className="bg-amber-100 p-3 rounded-lg">
              <Award className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <ArrowDownRight className="w-4 h-4 text-red-600 mr-1" />
            <span className="text-red-600 text-sm font-medium">1.5% decrease</span>
            <span className="text-slate-400 text-xs ml-2">vs last month</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Distribution and Recent Winners */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribution Chart */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-slate-800">Prize Distribution</h3>
            <div className="bg-blue-50 text-blue-600 text-xs font-medium px-2.5 py-1 rounded-full">Last 30 days</div>
          </div>

          {chartLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-4" />
              <p className="text-slate-500">Loading distribution data...</p>
            </div>
          ) : chartError ? (
            <div className="bg-red-50 border border-red-100 rounded-lg p-4 text-center">
              <p className="text-red-600 text-sm">{chartError}</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {chartData.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-600">{item.label}</span>
                      <span className="text-sm font-semibold text-slate-800">{item.value}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5">
                      <motion.div
                        className="h-2.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${(item.value / maxValue) * 100}%` }}
                        transition={{ duration: 1, delay: index * 0.2 }}
                      ></motion.div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Total Records</span>
                  <span className="text-sm font-semibold text-slate-800">
                    {chartData.reduce((acc, item) => acc + item.value, 0)}
                  </span>
                </div>
              </div>
            </>
          )}
        </motion.div>

        {/* Recent Winners */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-slate-800">Recent Winners</h3>
            <button className="text-blue-600 text-sm font-medium hover:underline flex items-center">
              View all <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>

          {winnersLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-4" />
              <p className="text-slate-500">Loading winners data...</p>
            </div>
          ) : winnersError ? (
            <div className="bg-red-50 border border-red-100 rounded-lg p-4 text-center">
              <p className="text-red-600 text-sm">{winnersError}</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {recentWinners.map((winner, index) => (
                  <motion.div
                    key={winner.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center">
                      <div className="bg-gradient-to-br from-blue-500 to-purple-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold">
                        {winner.userId?.substring(0, 2) || winner.id.substring(0, 2)}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-slate-800">{winner.userId || winner.id}</p>
                        <p className="text-xs text-slate-500">
                          {winner.multiplier && `${winner.multiplier.toFixed(2)}x multiplier`}
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
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100">
                <button className="w-full py-2 text-sm text-blue-600 font-medium hover:bg-blue-50 rounded-lg transition-colors">
                  View all game history
                </button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}
