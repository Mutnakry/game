"use client"

import { useState, useEffect } from "react"
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  startAfter,
  deleteDoc,
  doc,
  writeBatch,
  type Query,
  type DocumentData,
} from "firebase/firestore"
import { db } from "@/components/firebase-config"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { motion, AnimatePresence } from "framer-motion"
import {
  ChevronLeft,
  ChevronRight,
  RefreshCcw,
  Trash2,
  AlertTriangle,
  Clock,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  Loader2,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

type CrashRecord = {
  id: string
  timestamp: any
  crashPoint: number
  betAmount: number
  cashoutMultiplier: number
  userCashedOut: boolean
  winRate: number
  expectedValue: number
  profit: number | null
  userBalance?: number
}

export function GameHistory() {
  const [crashes, setCrashes] = useState<CrashRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Pagination state
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [lastVisible, setLastVisible] = useState<DocumentData | null>(null)
  const [firstVisible, setFirstVisible] = useState<DocumentData | null>(null)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [hasPrevPage, setHasPrevPage] = useState(false)
  const [pageHistory, setPageHistory] = useState<DocumentData[]>([])

  // Delete confirmation dialogs
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false)
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Animation states
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    async function fetchCrashes() {
      try {
        setLoading(true)
        const crashesRef = collection(db, "crashHistory")

        // Initial query
        let q: Query<DocumentData> = query(
          crashesRef,
          orderBy("timestamp", "desc"),
          limit(pageSize + 1), // Get one extra to check if there's a next page
        )

        // If we're not on the first page and have a cursor, use it
        if (currentPage > 1 && lastVisible) {
          q = query(crashesRef, orderBy("timestamp", "desc"), startAfter(lastVisible), limit(pageSize + 1))
        } else if (currentPage === 1) {
          // Reset pagination state when returning to first page
          setPageHistory([])
        }

        const querySnapshot = await getDocs(q)

        // Check if we have a next page
        setHasNextPage(querySnapshot.docs.length > pageSize)

        // Remove the extra item we used to check for next page
        const docs = hasNextPage ? querySnapshot.docs.slice(0, pageSize) : querySnapshot.docs

        // Save the first and last visible documents for pagination
        if (docs.length > 0) {
          setFirstVisible(docs[0])
          setLastVisible(docs[docs.length - 1])

          // Update page history for "previous" navigation
          if (currentPage === 1) {
            setPageHistory([docs[0]])
          } else if (currentPage > pageHistory.length) {
            setPageHistory([...pageHistory, docs[0]])
          }
        }

        // Update hasPrevPage based on current page
        setHasPrevPage(currentPage > 1)

        const crashData = docs.map((doc) => {
          const data = doc.data()
          // Handle both Firestore Timestamp and regular Date objects
          let timestamp
          if (data.timestamp && typeof data.timestamp.toDate === "function") {
            timestamp = data.timestamp.toDate()
          } else if (data.timestamp instanceof Date) {
            timestamp = data.timestamp
          } else if (typeof data.timestamp === "string") {
            timestamp = new Date(data.timestamp)
          } else {
            timestamp = null
          }

          return {
            id: doc.id,
            ...data,
            timestamp,
          }
        }) as CrashRecord[]

        setCrashes(crashData)
      } catch (err) {
        console.error("Error fetching crash history:", err)
        setError("Failed to load crash history")
      } finally {
        setLoading(false)
        setIsRefreshing(false)
      }
    }

    fetchCrashes()

    // Set up auto-refresh only for the first page
    let refreshInterval: NodeJS.Timeout | null = null
    if (currentPage === 1) {
      refreshInterval = setInterval(() => {
        setRefreshTrigger((prev) => prev + 1)
      }, 30000)
    }

    return () => {
      if (refreshInterval) clearInterval(refreshInterval)
    }
  }, [refreshTrigger, currentPage, pageSize])

  function formatDate(date: Date | null) {
    if (!date) return "Unknown"
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  function handleManualRefresh() {
    setIsRefreshing(true)
    setRefreshTrigger((prev) => prev + 1)
  }

  function handleNextPage() {
    if (hasNextPage) {
      setCurrentPage((prev) => prev + 1)
    }
  }

  function handlePrevPage() {
    if (hasPrevPage && currentPage > 1) {
      setCurrentPage((prev) => prev - 1)
      // Use the document from page history as the starting point
      if (pageHistory.length >= currentPage - 1) {
        setLastVisible(pageHistory[currentPage - 2])
      }
    }
  }

  function handleFirstPage() {
    setCurrentPage(1)
  }

  function handlePageSizeChange(value: string) {
    const newSize = Number.parseInt(value, 10)
    setCurrentPage(1) // Reset to first page when changing page size
    setLastVisible(null) // Reset pagination cursors
    setFirstVisible(null)
    setPageHistory([])
    setPageSize(newSize)
  }

  // Delete a single record
  async function handleDeleteRecord() {
    if (!recordToDelete) return

    try {
      setDeleteLoading(true)
      await deleteDoc(doc(db, "crashHistory", recordToDelete))

      // Update local state to remove the deleted record
      setCrashes(crashes.filter((crash) => crash.id !== recordToDelete))

      // Close the dialog
      setDeleteDialogOpen(false)
      setRecordToDelete(null)
    } catch (err) {
      console.error("Error deleting record:", err)
      setError("Failed to delete record")
    } finally {
      setDeleteLoading(false)
    }
  }

  // Delete all records
  async function handleDeleteAllRecords() {
    try {
      setDeleteLoading(true)

      // Firestore doesn't have a direct "delete collection" method
      // We need to get all documents and delete them in batches
      const crashesRef = collection(db, "crashHistory")
      const allCrashesQuery = query(crashesRef, orderBy("timestamp", "desc"))
      const querySnapshot = await getDocs(allCrashesQuery)

      // Firestore batches are limited to 500 operations
      const batchSize = 500
      const totalDocs = querySnapshot.docs.length

      for (let i = 0; i < totalDocs; i += batchSize) {
        const batch = writeBatch(db)
        const docsToDelete = querySnapshot.docs.slice(i, i + batchSize)

        docsToDelete.forEach((doc) => {
          batch.delete(doc.ref)
        })

        await batch.commit()
      }

      // Clear local state
      setCrashes([])

      // Close the dialog
      setDeleteAllDialogOpen(false)

      // Reset pagination
      setCurrentPage(1)
      setLastVisible(null)
      setFirstVisible(null)
      setPageHistory([])
    } catch (err) {
      console.error("Error deleting all records:", err)
      setError("Failed to delete all records")
    } finally {
      setDeleteLoading(false)
    }
  }

  const tableVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  }

  const tableRowVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
    exit: {
      opacity: 0,
      x: -20,
      transition: { duration: 0.2 },
    },
  }

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 flex items-center">
            <Clock className="mr-2 h-5 w-5 text-blue-500" />
            Game History
            <Badge variant="outline" className="ml-3 bg-blue-50 text-blue-600 border-blue-200">
              {crashes.length > 0
                ? `${(currentPage - 1) * pageSize + 1}-${(currentPage - 1) * pageSize + crashes.length} of many`
                : "0 records"}
            </Badge>
          </h2>
          <p className="text-sm text-slate-500 mt-1">View and manage your game crash history</p>
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            onClick={handleManualRefresh}
            className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-2 rounded-lg text-sm font-medium flex items-center transition-colors duration-200"
            whileTap={{ scale: 0.97 }}
            animate={isRefreshing ? { rotate: 360 } : { rotate: 0 }}
            transition={isRefreshing ? { repeat: Number.POSITIVE_INFINITY, duration: 1, ease: "linear" } : {}}
            disabled={isRefreshing}
          >
            <RefreshCcw className="h-4 w-4 mr-1.5" />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </motion.button>

          <motion.button
            onClick={() => setDeleteAllDialogOpen(true)}
            className="bg-red-50 text-red-600 hover:bg-red-100 px-3 py-2 rounded-lg text-sm font-medium flex items-center transition-colors duration-200"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            disabled={crashes.length === 0}
          >
            <Trash2 className="h-4 w-4 mr-1.5" />
            Delete All
          </motion.button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
        <div className="mb-4 sm:mb-0">
          <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
            <SelectTrigger className="w-[180px] h-9 text-sm bg-white border-slate-200">
              <SelectValue placeholder="Records per page" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Records per page</SelectLabel>
                <SelectItem value="5">5 per page</SelectItem>
                <SelectItem value="10">10 per page</SelectItem>
                <SelectItem value="20">20 per page</SelectItem>
                <SelectItem value="50">50 per page</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevPage}
            disabled={!hasPrevPage}
            className={`h-9 px-3 border-slate-200 ${!hasPrevPage && "opacity-50"}`}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>

          <div className="flex items-center justify-center h-9 min-w-[2.5rem] px-2 rounded bg-blue-50 text-blue-600 font-medium text-sm">
            {currentPage}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={!hasNextPage}
            className={`h-9 px-3 border-slate-200 ${!hasNextPage && "opacity-50"}`}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 bg-slate-50 rounded-lg border border-slate-100">
          <Loader2 className="h-10 w-10 text-blue-500 animate-spin mb-4" />
          <p className="text-slate-600 font-medium">Loading crash history...</p>
          <p className="text-slate-500 text-sm mt-1">Please wait while we fetch the data</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-3" />
          <p className="text-red-600 font-medium">{error}</p>
          <p className="text-red-500 text-sm mt-1">Please try refreshing the page</p>
          <Button
            variant="outline"
            className="mt-4 border-red-200 text-red-600 hover:bg-red-50"
            onClick={handleManualRefresh}
          >
            <RefreshCcw className="h-4 w-4 mr-1.5" />
            Try Again
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <div className="overflow-x-auto">
            <motion.table
              className="w-full border-collapse"
              variants={tableVariants}
              initial="hidden"
              animate="visible"
            >
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Crash Point
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Bet Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Target
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Win Rate
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    EV
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Result
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {crashes.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <AlertTriangle className="h-8 w-8 text-amber-400 mb-2" />
                        <p className="text-slate-600 font-medium">No crash data available yet</p>
                        <p className="text-slate-500 text-sm mt-1">Game records will appear here when available</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <AnimatePresence>
                    {crashes.map((crash, index) => (
                      <motion.tr
                        key={crash.id}
                        className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                        variants={tableRowVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        layout
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 text-slate-400 mr-2" />
                            <span className="text-sm text-slate-600">{formatDate(crash.timestamp)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm font-medium text-red-600">{crash.crashPoint?.toFixed(2)}x</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-slate-700">{crash.betAmount?.toFixed(2)}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-slate-700">{crash.cashoutMultiplier?.toFixed(2)}x</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm font-medium text-emerald-600 flex items-center">
                            {crash.winRate?.toFixed(2)}%
                            {crash.winRate > 50 && <ArrowUp className="h-3 w-3 ml-1 text-emerald-500" />}
                            {crash.winRate < 50 && <ArrowDown className="h-3 w-3 ml-1 text-red-500" />}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div
                            className={`text-sm font-medium flex items-center ${crash.expectedValue >= 0 ? "text-emerald-600" : "text-red-600"}`}
                          >
                            {crash.expectedValue >= 0 ? "+" : ""}
                            {crash.expectedValue?.toFixed(2)}
                            {crash.expectedValue > 0 && <ArrowUp className="h-3 w-3 ml-1" />}
                            {crash.expectedValue < 0 && <ArrowDown className="h-3 w-3 ml-1" />}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          {crash.userCashedOut ? (
                            <Badge
                              variant="outline"
                              className="bg-emerald-50 hover:bg-emerald-50 text-emerald-700 border-emerald-200"
                            >
                              {crash.profit !== null ? `+${crash.profit.toFixed(2)}` : "Cashed Out"}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-red-50 hover:bg-red-50 text-red-700 border-red-200">
                              Crashed
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <motion.button
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setRecordToDelete(crash.id)
                              setDeleteDialogOpen(true)
                            }}
                            className="text-red-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </motion.button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                )}
              </tbody>
            </motion.table>
          </div>

          {/* Pagination info */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 text-sm text-slate-500 flex items-center justify-between">
            <div>
              {crashes.length > 0 && (
                <>
                  Showing records {(currentPage - 1) * pageSize + 1} to {(currentPage - 1) * pageSize + crashes.length}
                </>
              )}
            </div>
            <div className="text-slate-400">Updated {new Date().toLocaleTimeString()}</div>
          </div>
        </div>
      )}

      {/* Delete Single Record Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600 gap-2">
              <AlertCircle className="h-5 w-5" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this record? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 bg-red-50 border border-red-100 rounded-lg my-2">
            <p className="text-sm text-slate-700">
              Deleting this record will permanently remove it from your history. All associated data will be lost.
            </p>
          </div>
          <DialogFooter className="sm:justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setRecordToDelete(null)
              }}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteRecord} disabled={deleteLoading} className="gap-1">
              {deleteLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Delete Record
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete All Records Confirmation Dialog */}
      <Dialog open={deleteAllDialogOpen} onOpenChange={setDeleteAllDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600 gap-2">
              <AlertCircle className="h-5 w-5" />
              Confirm Delete All Records
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete ALL crash history records? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 bg-red-50 border border-red-100 rounded-lg my-2">
            <p className="text-sm font-medium text-red-700 mb-2">Warning: High Impact Action</p>
            <p className="text-sm text-slate-700">
              This will permanently delete all crash history records from the database. You will lose all historical
              data and analytics.
            </p>
          </div>
          <DialogFooter className="sm:justify-between">
            <Button variant="outline" onClick={() => setDeleteAllDialogOpen(false)} disabled={deleteLoading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAllRecords} disabled={deleteLoading} className="gap-1">
              {deleteLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting All Records...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Delete All Records
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
