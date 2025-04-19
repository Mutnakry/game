"use client"

import { useEffect, useState } from "react"
import { getFirestore, collection, getDocs, doc, updateDoc, query, orderBy, limit } from "firebase/firestore"
import { initializeApp } from "firebase/app"
import { motion, AnimatePresence } from "framer-motion"
import { Search, CheckCircle, XCircle, RefreshCw, User, Phone, Shield } from "lucide-react"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

type UserType = {
  id: string
  username: string
  phone: string
  status: string
  lastLogin?: string | Date
  createdAt?: string | Date
}

function ShowUserLogin() {
  const [users, setUsers] = useState<UserType[]>([])
  const [search, setSearch] = useState("")
  const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false)
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isUpdating, setIsUpdating] = useState<boolean>(false)
  const [updateMessage, setUpdateMessage] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<string>("username")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Create a query with ordering
      const usersQuery = query(collection(db, "users"), orderBy(sortBy, sortDirection), limit(100))

      const querySnapshot = await getDocs(usersQuery)
      const userData: UserType[] = []

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        userData.push({
          id: doc.id,
          username: data.username || "",
          phone: data.phone || "",
          status: data.status || "inactive",
          lastLogin: data.lastLogin || null,
          createdAt: data.createdAt || null,
        })
      })

      setUsers(userData)
    } catch (error) {
      console.error("Error fetching users:", error)
      setError("Failed to load users. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSort = (field: keyof UserType) => {
    if (sortBy === field) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      // New field, default to ascending
      setSortBy(field)
      setSortDirection("asc")
    }
  
    const sortedUsers = [...users].sort((a, b) => {
      const aValue = a[field]
      const bValue = b[field]
  
      // Handle undefined or null values safely
      if (aValue == null) return 1
      if (bValue == null) return -1
  
      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
      return 0
    })
  
    setUsers(sortedUsers)
  }
  

  // Filtered users based on search input
  const filteredUsers = users.filter((user) => {
    const searchTerm = search.toLowerCase()
    return (
      user.username.toLowerCase().includes(searchTerm) ||
      user.phone.toLowerCase().includes(searchTerm) ||
      user.id.toLowerCase().includes(searchTerm)
    )
  })

  const handleStatusClick = (user: UserType) => {
    setSelectedUser(user)
    setIsPopupOpen(true)
    setUpdateMessage("")
  }

  const toggleUserStatus = async () => {
    if (!selectedUser) return

    setIsUpdating(true)
    try {
      const newStatus = selectedUser.status === "active" ? "inactive" : "active"
      const userRef = doc(db, "users", selectedUser.id)

      await updateDoc(userRef, {
        status: newStatus,
        lastUpdated: new Date(),
      })

      // Update local state
      setUsers(users.map((user) => (user.id === selectedUser.id ? { ...user, status: newStatus } : user)))

      setUpdateMessage(`User status updated to ${newStatus} successfully!`)

      // Close popup after a delay
      setTimeout(() => {
        setIsPopupOpen(false)
        setSelectedUser(null)
        setUpdateMessage("")
      }, 2000)
    } catch (error) {
      console.error("Error updating user status:", error)
      setUpdateMessage("Error updating status. Please try again.")
    } finally {
      setIsUpdating(false)
    }
  }

  const closePopup = () => {
    setIsPopupOpen(false)
    setSelectedUser(null)
    setUpdateMessage("")
  }

  const formatDate = (date: Date | string | undefined | null) => {
    if (!date) return "N/A"

    if (typeof date === "string") {
      date = new Date(date)
    }

    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-4 sm:mb-0 flex items-center">
          <User className="mr-2 h-5 w-5 text-blue-500" />
          User Management
        </h2>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-grow sm:flex-grow-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 w-full sm:w-64 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Search by name, phone or ID..."
            />
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={fetchUsers}
            className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-2 rounded-lg text-sm font-medium flex items-center transition-colors duration-200"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
            {isLoading ? "Loading..." : "Refresh"}
          </motion.button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          <p className="flex items-center">
            <XCircle className="h-5 w-5 mr-2" />
            {error}
          </p>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                  onClick={() => handleSort("id")}
                >
                  <div className="flex items-center">
                    ID
                    {sortBy === "id" && <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>}
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                  onClick={() => handleSort("username")}
                >
                  <div className="flex items-center">
                    <User className="h-3 w-3 mr-1" />
                    Username
                    {sortBy === "username" && <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>}
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                  onClick={() => handleSort("status")}
                >
                  <div className="flex items-center">
                    <Shield className="h-3 w-3 mr-1" />
                    Status
                    {sortBy === "status" && <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>}
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                  onClick={() => handleSort("phone")}
                >
                  <div className="flex items-center">
                    <Phone className="h-3 w-3 mr-1" />
                    Phone
                    {sortBy === "phone" && <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array(5)
                  .fill(0)
                  .map((_, index) => (
                    <tr key={`skeleton-${index}`} className="animate-pulse">
                      <td className="px-4 py-3 border-b border-slate-100">
                        <div className="h-4 bg-slate-200 rounded w-20"></div>
                      </td>
                      <td className="px-4 py-3 border-b border-slate-100">
                        <div className="h-4 bg-slate-200 rounded w-32"></div>
                      </td>
                      <td className="px-4 py-3 border-b border-slate-100">
                        <div className="h-6 bg-slate-200 rounded w-16"></div>
                      </td>
                      <td className="px-4 py-3 border-b border-slate-100">
                        <div className="h-4 bg-slate-200 rounded w-24"></div>
                      </td>
                    </tr>
                  ))
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                    {search ? "No users match your search criteria" : "No users found"}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <motion.tr
                    key={user.id}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <td className="px-4 py-3 text-sm text-slate-600">
                      <div className="font-mono text-xs">{user.id.slice(0, 10)}...</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-slate-700">{user.username || "N/A"}</div>
                    </td>
                    <td className="px-4 py-3">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleStatusClick(user)}
                        className="cursor-pointer inline-block"
                      >
                        {user.status === "active" ? (
                          <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium flex items-center">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </div>
                        ) : (
                          <div className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium flex items-center">
                            <XCircle className="h-3 w-3 mr-1" />
                            Inactive
                          </div>
                        )}
                      </motion.div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{user.phone || "N/A"}</td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!isLoading && filteredUsers.length > 0 && (
          <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 text-xs text-slate-500">
            Showing {filteredUsers.length} of {users.length} users
          </div>
        )}
      </div>

      {/* Status Update Popup */}
      <AnimatePresence>
        {isPopupOpen && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50"
            onClick={closePopup}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white text-black p-6 rounded-lg text-center w-96 max-w-[90vw]"
              onClick={(e) => e.stopPropagation()}
            >
              {updateMessage ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                  <h3 className="text-lg font-semibold mb-2">{updateMessage}</h3>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring" }}
                    className="text-green-500 flex justify-center my-4"
                  >
                    <CheckCircle size={48} />
                  </motion.div>
                </motion.div>
              ) : (
                <>
                  <h3 className="text-lg font-semibold mb-4">Update User Status</h3>
                  <div className="bg-slate-50 p-4 rounded-lg mb-4">
                    <div className="flex items-center justify-center mb-3">
                      <div className="bg-blue-100 text-blue-700 rounded-full w-12 h-12 flex items-center justify-center">
                        <User size={24} />
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 mb-1">
                      <span className="font-medium">Username:</span> {selectedUser.username || "N/A"}
                    </p>
                    <p className="text-sm text-slate-600 mb-1">
                      <span className="font-medium">ID:</span> {selectedUser.id}
                    </p>
                    <p className="text-sm text-slate-600">
                      <span className="font-medium">Phone:</span> {selectedUser.phone || "N/A"}
                    </p>
                  </div>

                  <p className="mb-6 text-slate-700">
                    Are you sure you want to change the status from{" "}
                    <span
                      className={`font-bold ${selectedUser.status === "active" ? "text-green-500" : "text-red-500"}`}
                    >
                      {selectedUser.status}
                    </span>{" "}
                    to{" "}
                    <span
                      className={`font-bold ${selectedUser.status === "active" ? "text-red-500" : "text-green-500"}`}
                    >
                      {selectedUser.status === "active" ? "inactive" : "active"}
                    </span>
                    ?
                  </p>

                  <div className="flex space-x-4">
                    <button
                      onClick={closePopup}
                      className="flex-1 bg-slate-200 text-slate-700 font-medium p-2 rounded-lg hover:bg-slate-300 transition-colors"
                      disabled={isUpdating}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={toggleUserStatus}
                      className={`flex-1 font-medium p-2 rounded-lg transition-colors ${
                        selectedUser.status === "active"
                          ? "bg-red-500 hover:bg-red-600 text-white"
                          : "bg-emerald-500 hover:bg-emerald-600 text-white"
                      }`}
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <span className="flex items-center justify-center">
                          <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                          Updating...
                        </span>
                      ) : (
                        `Change to ${selectedUser.status === "active" ? "Inactive" : "Active"}`
                      )}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ShowUserLogin
