"use client"

import { useEffect, useState } from "react"
import { getFirestore, collection, getDocs, doc, updateDoc } from "firebase/firestore"
import { initializeApp } from "firebase/app"
import { motion, AnimatePresence } from "framer-motion"

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

type User = {
  id: string
  username: string
  phone: string
  status: string
}

function ShowUserLogin() {
  const [users, setUsers] = useState<User[]>([])
  const [search, setSearch] = useState("")
  const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [updateMessage, setUpdateMessage] = useState<string>("")

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "users"))
      const userData: User[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        userData.push({
          id: doc.id,
          username: data.username || "",
          phone: data.phone || "",
          status: data.status || "",
        })
      })
      setUsers(userData)
    } catch (error) {
      console.error("Error fetching users:", error)
    }
  }

  // Filtered users based on search input
  const filteredUsers = users.filter((user) => {
    const searchTerm = search.toLowerCase()
    return user.username.toLowerCase().includes(searchTerm) || user.phone.toLowerCase().includes(searchTerm)
  })

  const handleStatusClick = (user: User) => {
    setSelectedUser(user)
    setIsPopupOpen(true)
    setUpdateMessage("")
  }

 

  const toggleUserStatus = async () => {
    if (!selectedUser) return

    setIsLoading(true)
    try {
      const newStatus = selectedUser.status === "active" ? "inactive" : "active"
      const userRef = doc(db, "users", selectedUser.id)

      await updateDoc(userRef, {
        status: newStatus,
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
      setIsLoading(false)
    }
  }

  const closePopup = () => {
    setIsPopupOpen(false)
    setSelectedUser(null)
    setUpdateMessage("")
  }

  

  return (
    <div className="">
      <div className="mb-2 justify-end flex">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="text-sm px-4 py-2 text-gray-500 bg-gray-200 border-gray-300 rounded-lg"
          placeholder="Search names"
        />
      </div>
      <table className="w-full border">
        <thead>
          <tr className="bg-blue-500/50 text-md text-gray-800 font-semibold text-left">
            <th className="p-2 border">ID</th>
            <th className="p-2 border">Username</th>
            <th className="p-2 border">Status</th>
            <th className="p-2 border">Phone</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map((user) => (
            <tr key={user.id} className="border-t text-sm text-gray-800">
              <td className="p-2 border">{user.id}</td>
              <td className="p-2 border">{user.username || "NA"}</td>
              <td className="p-2 border">
                <div
                  onClick={() => handleStatusClick(user)}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                >
                  {user.status === "active" ? (
                    <p className="px-4 py-1 bg-green-500 w-20 text-white rounded">Active</p>
                  ) : (
                    <p className="px-4 py-1 bg-red-500 w-20 text-white rounded">Inactive</p>
                  )}
                </div>
              </td>
              <td className="p-2 border">{user.phone || "NA"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Status Update Popup */}
      <AnimatePresence>
        {isPopupOpen && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            id="popup-overlay"
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50"
            onClick={closePopup}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white text-black p-6 rounded-lg text-center w-96"
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
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="48"
                      height="48"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                  </motion.div>
                </motion.div>
              ) : (
                <>
                  <h3 className="text-lg font-semibold mb-4">Update User Status</h3>
                  <p className="mb-4">
                    Are you sure you want to change the status of{" "}
                    <span className="font-bold text-green-600 uppercase">{selectedUser.username}</span> from{" "}
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
                      className="flex-1 bg-gray-300 text-gray-800 font-semibold p-2 rounded hover:bg-gray-400 transition-colors"
                      disabled={isLoading}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={toggleUserStatus}
                      className={`flex-1 font-semibold p-2 rounded transition-colors ${selectedUser.status === "active"
                          ? "bg-red-500 hover:bg-red-600 text-white"
                          : "bg-green-500 hover:bg-green-600 text-white"
                        }`}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center">
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
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
