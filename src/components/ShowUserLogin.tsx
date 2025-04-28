"use client"

import { useEffect, useState } from "react"
import { getFirestore, collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy, limit } from "firebase/firestore"
import { initializeApp } from "firebase/app"
import { motion } from "framer-motion"
import {
  Search,
  CheckCircle,
  XCircle,
  RefreshCw,
  User,
  Phone,
  Shield,
  ChevronDown,
  ChevronUp,
  FileText,
  Filter,
  Download,
  MoreHorizontal,
  Trash2,
  Edit,
  Eye,
  Calendar,
  Clock,
  Save,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

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
  email?: string
  address?: string
}

function ShowUserLogin() {
  const [users, setUsers] = useState<UserType[]>([])
  const [search, setSearch] = useState("")
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState<boolean>(false)
  const [isViewDetailsDialogOpen, setIsViewDetailsDialogOpen] = useState<boolean>(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false)
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null)
  const [editedUser, setEditedUser] = useState<UserType | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [actionMessage, setActionMessage] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<string>("username")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [activeTab, setActiveTab] = useState<string>("all")
  const [showSuccessDialog, setShowSuccessDialog] = useState<boolean>(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Create a query with ordering
      const usersQuery = query(collection(db, "users-crazi"), orderBy(sortBy, sortDirection), limit(100))

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
          email: data.email || "",
          address: data.address || "",
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

  // Filtered users based on search input and active tab
  const filteredUsers = users.filter((user) => {
    const searchTerm = search.toLowerCase()
    const matchesSearch =
      user.username.toLowerCase().includes(searchTerm) ||
      user.phone.toLowerCase().includes(searchTerm) ||
      user.id.toLowerCase().includes(searchTerm) ||
      (user.email && user.email.toLowerCase().includes(searchTerm))

    // Filter by tab
    if (activeTab === "all") return matchesSearch
    if (activeTab === "active") return matchesSearch && user.status === "active"
    if (activeTab === "inactive") return matchesSearch && user.status === "inactive"

    return matchesSearch
  })

  // View Details Handler
  const handleViewDetails = (user: UserType) => {
    setSelectedUser(user)
    setIsViewDetailsDialogOpen(true)
  }

  // Edit User Handlers
  const handleEditUser = (user: UserType) => {
    setSelectedUser(user)
    setEditedUser({ ...user })
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editedUser || !selectedUser) return

    setIsProcessing(true)
    try {
      const userRef = doc(db, "users-crazi", selectedUser.id)

      await updateDoc(userRef, {
        username: editedUser.username,
        phone: editedUser.phone,
        email: editedUser.email,
        address: editedUser.address,
        lastUpdated: new Date(),
      })

      // Update local state
      setUsers(users.map((user) => (user.id === selectedUser.id ? { ...user, ...editedUser } : user)))

      setActionMessage("User information updated successfully!")
      setIsEditDialogOpen(false)
      setShowSuccessDialog(true)

      // Close success dialog after a delay
      setTimeout(() => {
        setShowSuccessDialog(false)
        setSelectedUser(null)
        setEditedUser(null)
        setActionMessage("")
      }, 2000)
    } catch (error) {
      console.error("Error updating user:", error)
      setActionMessage("Error updating user. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  // Status Update Handlers
  const handleStatusClick = (user: UserType) => {
    setSelectedUser(user)
    setIsStatusDialogOpen(true)
  }

  const toggleUserStatus = async () => {
    if (!selectedUser) return

    setIsProcessing(true)
    try {
      const newStatus = selectedUser.status === "active" ? "inactive" : "active"
      const userRef = doc(db, "users-crazi", selectedUser.id)

      await updateDoc(userRef, {
        status: newStatus,
        lastUpdated: new Date(),
      })

      // Update local state
      setUsers(users.map((user) => (user.id === selectedUser.id ? { ...user, status: newStatus } : user)))

      setActionMessage(`User status updated to ${newStatus} successfully!`)
      setIsStatusDialogOpen(false)
      setShowSuccessDialog(true)

      // Close success dialog after a delay
      setTimeout(() => {
        setShowSuccessDialog(false)
        setSelectedUser(null)
        setActionMessage("")
      }, 2000)
    } catch (error) {
      console.error("Error updating user status:", error)
      setActionMessage("Error updating status. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  // Delete User Handlers
  const handleDeleteClick = (user: UserType) => {
    setSelectedUser(user)
    setIsDeleteDialogOpen(true)
  }

  const deleteUser = async () => {
    if (!selectedUser) return

    setIsProcessing(true)
    try {
      const userRef = doc(db, "users-crazi", selectedUser.id)
      await deleteDoc(userRef)

      // Update local state
      setUsers(users.filter((user) => user.id !== selectedUser.id))

      setActionMessage("User deleted successfully!")
      setIsDeleteDialogOpen(false)
      setShowSuccessDialog(true)

      // Close success dialog after a delay
      setTimeout(() => {
        setShowSuccessDialog(false)
        setSelectedUser(null)
        setActionMessage("")
      }, 2000)
    } catch (error) {
      console.error("Error deleting user:", error)
      setActionMessage("Error deleting user. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const closeAllDialogs = () => {
    setIsStatusDialogOpen(false)
    setIsViewDetailsDialogOpen(false)
    setIsEditDialogOpen(false)
    setIsDeleteDialogOpen(false)
    setSelectedUser(null)
    setEditedUser(null)
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

  const getInitials = (name: string) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  const getStatusColor = (status: string) => {
    return status === "active"
      ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
      : "bg-rose-100 text-rose-700 hover:bg-rose-200"
  }

  return (
    <Card className="border-none shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <User className="h-6 w-6 text-violet-500" />
              User Management
            </CardTitle>
            <CardDescription className="text-slate-500 mt-1">
              Manage user accounts and control access permissions
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="text-slate-600 border-slate-200">
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 pt-4">
        <div className="px-6 pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <Tabs defaultValue="all" className="w-full sm:w-auto" onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-3 w-full sm:w-auto">
                <TabsTrigger value="all">All Users</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="inactive">Inactive</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-grow sm:flex-grow-0">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 w-full sm:w-64 text-sm border-slate-200 rounded-lg"
                  placeholder="Search users..."
                />
              </div>

              <Button variant="outline" size="icon" onClick={() => {}} className="border-slate-200">
                <Filter className="h-4 w-4 text-slate-500" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={fetchUsers}
                className="border-slate-200 text-slate-700"
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
                {isLoading ? "Loading..." : "Refresh"}
              </Button>
            </div>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg mb-6">
              <p className="flex items-center">
                <XCircle className="h-5 w-5 mr-2" />
                {error}
              </p>
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-100">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <div className="flex items-center">
                      <FileText className="h-3 w-3 mr-1" />
                      No
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort("username")}
                  >
                    <div className="flex items-center">
                      <User className="h-3 w-3 mr-1" />
                      Username
                      {sortBy === "username" &&
                        (sortDirection === "asc" ? (
                          <ChevronUp className="ml-1 h-3 w-3" />
                        ) : (
                          <ChevronDown className="ml-1 h-3 w-3" />
                        ))}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center">
                      <Shield className="h-3 w-3 mr-1" />
                      Status
                      {sortBy === "status" &&
                        (sortDirection === "asc" ? (
                          <ChevronUp className="ml-1 h-3 w-3" />
                        ) : (
                          <ChevronDown className="ml-1 h-3 w-3" />
                        ))}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort("phone")}
                  >
                    <div className="flex items-center">
                      <Phone className="h-3 w-3 mr-1" />
                      Phone
                      {sortBy === "phone" &&
                        (sortDirection === "asc" ? (
                          <ChevronUp className="ml-1 h-3 w-3" />
                        ) : (
                          <ChevronDown className="ml-1 h-3 w-3" />
                        ))}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  Array(5)
                    .fill(0)
                    .map((_, index) => (
                      <tr key={`skeleton-${index}`} className="animate-pulse">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="h-4 bg-slate-200 rounded w-8"></div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-slate-200 mr-3"></div>
                            <div className="h-4 bg-slate-200 rounded w-32"></div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="h-6 bg-slate-200 rounded w-16"></div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="h-4 bg-slate-200 rounded w-24"></div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="h-8 bg-slate-200 rounded w-8 ml-auto"></div>
                        </td>
                      </tr>
                    ))
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <Search className="h-12 w-12 text-slate-300 mb-4" />
                        <h3 className="text-lg font-medium text-slate-700 mb-1">No users found</h3>
                        <p className="text-slate-500 max-w-sm">
                          {search
                            ? "No users match your search criteria. Try adjusting your search terms."
                            : "There are no users to display in this view."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <motion.tr
                      key={user.id}
                      className="hover:bg-slate-50 transition-colors"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs text-slate-500 font-medium">{filteredUsers.indexOf(user) + 1}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8 mr-3 bg-violet-100 text-violet-700">
                            <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
                          </Avatar>
                          <div className="text-sm font-medium text-slate-700">{user.username || "N/A"}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleStatusClick(user)}
                          className="cursor-pointer inline-block"
                        >
                          <Badge
                            variant="outline"
                            className={`px-3 py-1 ${getStatusColor(user.status)} transition-colors`}
                          >
                            {user.status === "active" ? (
                              <CheckCircle className="h-3 w-3 mr-1" />
                            ) : (
                              <XCircle className="h-3 w-3 mr-1" />
                            )}
                            {user.status === "active" ? "Active" : "Inactive"}
                          </Badge>
                        </motion.div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{user.phone || "N/A"}</td>

                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              aria-label="More options"
                              className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-150"
                            >
                              <MoreHorizontal className="h-5 w-5 text-blue-600" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-[180px] p-1.5 rounded-xl border border-slate-100 shadow-lg animate-in fade-in-50 zoom-in-95 data-[side=bottom]:slide-in-from-top-2"
                          >
                            <DropdownMenuItem
                              className="cursor-pointer flex items-center px-3 py-2.5 text-sm rounded-lg hover:bg-violet-50 transition-colors group"
                              onClick={() => handleViewDetails(user)}
                            >
                              <div className="flex items-center justify-center h-7 w-7 rounded-full bg-violet-100 text-violet-600 mr-2.5 group-hover:bg-violet-200 transition-colors">
                                <Eye className="h-3.5 w-3.5" />
                              </div>
                              <span className="font-medium text-slate-700">View Details</span>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              className="cursor-pointer flex items-center px-3 py-2.5 text-sm rounded-lg hover:bg-blue-50 transition-colors group mt-1"
                              onClick={() => handleEditUser(user)}
                            >
                              <div className="flex items-center justify-center h-7 w-7 rounded-full bg-blue-100 text-blue-600 mr-2.5 group-hover:bg-blue-200 transition-colors">
                                <Edit className="h-3.5 w-3.5" />
                              </div>
                              <span className="font-medium text-slate-700">Edit User</span>
                            </DropdownMenuItem>

                            <DropdownMenuSeparator className="my-1.5 bg-slate-100" />

                            <DropdownMenuItem
                              className="cursor-pointer flex items-center px-3 py-2.5 text-sm rounded-lg transition-colors group mt-1"
                              onClick={() => handleStatusClick(user)}
                              style={{
                                backgroundColor:
                                  user.status === "active" ? "rgba(254, 226, 226, 0.4)" : "rgba(209, 250, 229, 0.4)",
                              }}
                            >
                              {user.status === "active" ? (
                                <>
                                  <div className="flex items-center justify-center h-7 w-7 rounded-full bg-rose-100 text-rose-600 mr-2.5 group-hover:bg-rose-200 transition-colors">
                                    <XCircle className="h-3.5 w-3.5" />
                                  </div>
                                  <span className="font-medium text-rose-600">Deactivate</span>
                                </>
                              ) : (
                                <>
                                  <div className="flex items-center justify-center h-7 w-7 rounded-full bg-emerald-100 text-emerald-600 mr-2.5 group-hover:bg-emerald-200 transition-colors">
                                    <CheckCircle className="h-3.5 w-3.5" />
                                  </div>
                                  <span className="font-medium text-emerald-600">Activate</span>
                                </>
                              )}
                            </DropdownMenuItem>

                            <DropdownMenuSeparator className="my-1.5 bg-slate-100" />

                            <DropdownMenuItem
                              className="cursor-pointer flex items-center px-3 py-2.5 text-sm rounded-lg hover:bg-rose-50 transition-colors group mt-1"
                              onClick={() => handleDeleteClick(user)}
                            >
                              <div className="flex items-center justify-center h-7 w-7 rounded-full bg-rose-100 text-rose-600 mr-2.5 group-hover:bg-rose-200 transition-colors">
                                <Trash2 className="h-3.5 w-3.5" />
                              </div>
                              <span className="font-medium text-rose-600">Delete User</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!isLoading && filteredUsers.length > 0 && (
            <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
              <div>
                Showing {filteredUsers.length} of {users.length} users
              </div>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled>
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                  <ChevronUp className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>

      {/* View Details Dialog */}
      <Dialog open={isViewDetailsDialogOpen} onOpenChange={setIsViewDetailsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>View detailed information about this user</DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 bg-violet-100 text-violet-700">
                  <AvatarFallback>{getInitials(selectedUser.username)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{selectedUser.username || "N/A"}</h3>
                  <Badge variant="outline" className={`mt-1 ${getStatusColor(selectedUser.status)}`}>
                    {selectedUser.status === "active" ? (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <XCircle className="h-3 w-3 mr-1" />
                    )}
                    {selectedUser.status === "active" ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">User ID</Label>
                  <p className="font-mono text-sm text-slate-600">{selectedUser.id}</p>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">Phone Number</Label>
                  <p className="text-sm">{selectedUser.phone || "Not provided"}</p>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">Email Address</Label>
                  <p className="text-sm">{selectedUser.email || "Not provided"}</p>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">Address</Label>
                  <p className="text-sm">{selectedUser.address || "Not provided"}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-500 flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      Created At
                    </Label>
                    <p className="text-sm">{formatDate(selectedUser.createdAt)}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-500 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      Last Login
                    </Label>
                    <p className="text-sm">{formatDate(selectedUser.lastLogin)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" onClick={() => setIsViewDetailsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information</DialogDescription>
          </DialogHeader>

          {editedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="h-12 w-12 bg-violet-100 text-violet-700">
                  <AvatarFallback>{getInitials(editedUser.username)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm text-slate-500">
                    User ID: <span className="font-mono">{editedUser.id.slice(0, 10)}...</span>
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={editedUser.username}
                    onChange={(e) => setEditedUser({ ...editedUser, username: e.target.value })}
                  />
                </div>

                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={editedUser.phone}
                    onChange={(e) => setEditedUser({ ...editedUser, phone: e.target.value })}
                  />
                </div>

                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={editedUser.email || ""}
                    onChange={(e) => setEditedUser({ ...editedUser, email: e.target.value })}
                  />
                </div>

                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={editedUser.address || ""}
                    onChange={(e) => setEditedUser({ ...editedUser, address: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex sm:justify-between">
            <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveEdit}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <span className="flex items-center justify-center">
                  <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                  Saving...
                </span>
              ) : (
                <span className="flex items-center">
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update User Status</DialogTitle>
            <DialogDescription>Change the status of this user account</DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="bg-slate-50 p-4 rounded-lg my-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12 bg-violet-100 text-violet-700">
                  <AvatarFallback>{getInitials(selectedUser.username)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-slate-900">{selectedUser.username || "N/A"}</p>
                  <p className="text-sm text-slate-500">{selectedUser.phone || "N/A"}</p>
                  <p className="text-xs text-slate-400 mt-1">ID: {selectedUser.id.slice(0, 10)}...</p>
                </div>
              </div>
            </div>
          )}

          {selectedUser && (
            <div className="text-center my-2 text-slate-700">
              Are you sure you want to change the status from{" "}
              <Badge variant="outline" className={getStatusColor(selectedUser.status)}>
                {selectedUser.status}
              </Badge>{" "}
              to{" "}
              <Badge
                variant="outline"
                className={getStatusColor(selectedUser.status === "active" ? "inactive" : "active")}
              >
                {selectedUser.status === "active" ? "inactive" : "active"}
              </Badge>
              ?
            </div>
          )}

          <DialogFooter className="flex sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsStatusDialogOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={toggleUserStatus}
              className={
                selectedUser?.status === "active"
                  ? "bg-rose-500 hover:bg-rose-600 text-white"
                  : "bg-emerald-500 hover:bg-emerald-600 text-white"
              }
              disabled={isProcessing}
            >
              {isProcessing ? (
                <span className="flex items-center justify-center">
                  <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                  Updating...
                </span>
              ) : (
                `Change to ${selectedUser?.status === "active" ? "Inactive" : "Active"}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-rose-600">Delete User</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="bg-rose-50 p-4 rounded-lg my-4 border border-rose-200">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12 bg-rose-100 text-rose-700">
                  <AvatarFallback>{getInitials(selectedUser.username)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-slate-900">{selectedUser.username || "N/A"}</p>
                  <p className="text-sm text-slate-500">{selectedUser.phone || "N/A"}</p>
                  <p className="text-xs text-slate-400 mt-1">ID: {selectedUser.id.slice(0, 10)}...</p>
                </div>
              </div>
            </div>
          )}

          <div className="text-center my-2 text-slate-700">
            <p className="font-medium text-rose-600 mb-2">Are you sure you want to delete this user?</p>
            <p className="text-sm text-slate-600">This will permanently remove the user and all associated data.</p>
          </div>

          <DialogFooter className="flex sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={deleteUser}
              className="bg-rose-500 hover:bg-rose-600 text-white"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <span className="flex items-center justify-center">
                  <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                  Deleting...
                </span>
              ) : (
                <span className="flex items-center">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete User
                </span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 15 }}
              className="mx-auto mb-4 bg-emerald-100 text-emerald-600 rounded-full w-16 h-16 flex items-center justify-center"
            >
              <CheckCircle className="h-8 w-8" />
            </motion.div>
            <h3 className="text-lg font-semibold mb-2">{actionMessage}</h3>
            <p className="text-slate-500">The action has been completed successfully.</p>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

export default ShowUserLogin
