"use client"

import { useState, useEffect } from "react"
import { collection, getCountFromServer, query, where } from "firebase/firestore"
import { db } from "@/components/firebase-config"

export default function AdminDashboard() {
  // State for counts
  const [totalCrashes, setTotalCrashes] = useState(0)
  const [activeUsers, setActiveUsers] = useState(0)
  const [inactiveUsers, setInactiveUsers] = useState(0)
  const [loading, setLoading] = useState(true)
  const [userLoading, setUserLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userError, setUserError] = useState<string | null>(null)

  // Chart data
  const chartData = [
    { label: "Hadiah Uang Tunai", value: 5, color: "#3b82f6" },
    { label: "Hadiah Uang Tunai", value: 102, color: "#f97316" },
    { label: "Hadiah Uang Tunai", value: 3, color: "#a3a3a3" },
  ]
  const maxValue = Math.max(...chartData.map((item) => item.value))
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

  const recentWinners = [
    {
      id: "LKAP125S",
      prize: "Silahkan Coba lagi - Rp 0",
      timestamp: "4/6/2025 5:48:55 PM",
    },
    {
      id: "MN45ADS",
      prize: "Silahkan Coba lagi - Rp 0",
      timestamp: "4/6/2025 3:42:47 PM",
    },
    {
      id: "ABCV456",
      prize: "Silahkan Coba lagi - Rp 0",
      timestamp: "4/5/2025 10:01:02 PM",
    },
    {
      id: "GD90054T",
      prize: "Silahkan Coba lagi - Rp 0",
      timestamp: "4/5/2025 9:10:28 AM",
    },
    {
      id: "T5627GLL",
      prize: "Silahkan Coba lagi - Rp 0",
      timestamp: "4/5/2025 8:15:10 AM",
    },
  ]

  return (
    <div className="bg-gray-50">
      {/* Main Content */}
      <main className="px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Codes */}
          <div className="bg-white rounded-lg shadow p-6 flex justify-between items-center">
            <div>
              <h3 className="text-gray-500 text-sm font-medium">Total Recent Crash History</h3>
              {loading ? (
                <div className="animate-pulse h-8 w-16 bg-gray-200 rounded mt-1"></div>
              ) : error ? (
                <p className="text-red-500 text-sm mt-1">Error loading count</p>
              ) : (
                <p className="text-3xl text-gray-700 font-bold mt-1">{totalCrashes}</p>
              )}
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: loading ? "0%" : "93%" }}></div>
                </div>
                <p className="text-gray-500 text-xs mt-1">93% used</p>
              </div>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <svg
                className="w-6 h-6 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                />
              </svg>
            </div>
          </div>
          {/* Users Card */}
          <div className="bg-white rounded-lg shadow p-6 flex justify-between items-center">
            <div>
              <h3 className="text-gray-500 text-sm font-medium">Users</h3>
              {userLoading ? (
                <div className="space-y-2">
                  <div className="animate-pulse h-6 w-24 bg-gray-200 rounded"></div>
                  <div className="animate-pulse h-6 w-24 bg-gray-200 rounded"></div>
                </div>
              ) : userError ? (
                <p className="text-red-500 text-sm mt-1">Error loading users</p>
              ) : (
                <div>
                  <div className="flex items-center mt-2">
                    <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                    <p className="text-xl font-bold text-gray-700">{activeUsers}</p>
                    <span className="ml-2 text-gray-500">Active</span>
                  </div>
                  <div className="flex items-center mt-2">
                    <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                    <p className="text-xl font-bold text-gray-700">{inactiveUsers}</p>
                    <span className="ml-2 text-gray-500">Inactive</span>
                  </div>
                </div>
              )}
              <div className="mt-4 flex items-center">
                <svg
                  className="w-4 h-4 text-green-500 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
                <p className="text-green-500 text-xs">User statistics</p>
              </div>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <svg
                className="w-6 h-6 text-yellow-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
          </div>

          {/* Available Codes */}
          <div className="bg-white rounded-lg shadow p-6 flex justify-between items-center">
            <div>
              <h3 className="text-gray-500 text-sm font-medium">Available Codes</h3>
              <p className="text-3xl font-bold mt-1">23</p>
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: "7%" }}></div>
                </div>
                <p className="text-gray-500 text-xs mt-1">7% remaining</p>
              </div>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <svg
                className="w-6 h-6 text-purple-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                />
              </svg>
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}
