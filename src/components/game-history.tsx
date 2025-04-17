"use client"

import type React from "react"

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

        const crashData = docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate(), // Convert Firestore timestamp to Date
        })) as CrashRecord[]

        setCrashes(crashData)
      } catch (err) {
        console.error("Error fetching crash history:", err)
        setError("Failed to load crash history")
      } finally {
        setLoading(false)
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

  function handlePageSizeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newSize = Number.parseInt(e.target.value, 10)
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

  return (
    <div className="w-full rounded-lg p-2">
      <div className="flex justify-between items-center mb-4">
        <h2 className="md:text-2xl text-sm font-bold text-gray-700">Recent Crash History</h2>
        <button
          onClick={handleManualRefresh}
          className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1 rounded-md md:text-sm text-xs flex items-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh
        </button>
      </div>

      <div className="flex justify-between items-center mb-4">
        <select
          value={pageSize.toString()}
          onChange={handlePageSizeChange}
          className="w-[120px] rounded border bg-gray-400 border-gray-300 px-3 py-2 text-xs"
        >
          <option value="5">5 per page</option>
          <option value="10">10 per page</option>
          <option value="20">20 per page</option>
          <option value="50">50 per page</option>
        </select>

        <button
          onClick={() => setDeleteAllDialogOpen(true)}
          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md md:text-sm text-xs flex items-center"
          disabled={crashes.length === 0}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mr-1"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          </svg>
          Delete All
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-700">Loading crash history...</p>
        </div>
      ) : error ? (
        <div className="bg-red-900 bg-opacity-20 border border-red-800 p-4 rounded-lg text-center">
          <p className="text-red-400">{error}</p>
        </div>
      ) : (
        <div className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-sm uppercase bg-blue-600/50 text-gray-800">
                <tr>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Crash Point</th>
                  <th className="px-4 py-3">Bet Amount</th>
                  <th className="px-4 py-3">Target</th>
                  <th className="px-4 py-3">Win Rate</th>
                  <th className="px-4 py-3">EV</th>
                  <th className="px-4 py-3">Result</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {crashes.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      No crash data available yet
                    </td>
                  </tr>
                ) : (
                  crashes.map((crash) => (
                    <tr key={crash.id} className="border-b text-sm text-gray-700 border-gray-800 hover:bg-gray-100">
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(crash.timestamp)}</td>
                      <td className="px-4 py-3 font-medium text-red-500">{crash.crashPoint?.toFixed(2)}x</td>
                      <td className="px-4 py-3">{crash.betAmount?.toFixed(2)}</td>
                      <td className="px-4 py-3">{crash.cashoutMultiplier?.toFixed(2)}x</td>
                      <td className="px-4 py-3 text-green-500">{crash.winRate?.toFixed(2)}%</td>
                      <td className={`px-4 py-3 ${crash.expectedValue >= 0 ? "text-green-500" : "text-red-500"}`}>
                        {crash.expectedValue >= 0 ? "+" : ""}
                        {crash.expectedValue?.toFixed(2)}
                      </td>
                      <td
                        className={`px-4 py-3 ${crash.profit !== null && crash.profit >= 0 ? "text-green-500" : "text-red-500"}`}
                      >
                        {crash.userCashedOut
                          ? crash.profit !== null
                            ? `+${crash.profit.toFixed(2)}`
                            : "Cashed Out"
                          : "Crashed"}
                      </td>
                      
                      <td className="px-4 py-3">
                        <button
                          onClick={() => {
                            setRecordToDelete(crash.id)
                            setDeleteDialogOpen(true)
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M3 6h18" />
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex justify-end items-center mt-4 px-4">
            <div className="flex space-x-2 items-center">
              <button
                onClick={handlePrevPage}
                disabled={!hasPrevPage}
                className={`px-3 py-1 rounded-md text-sm ${
                  !hasPrevPage
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-500 hover:bg-blue-600 text-white"
                }`}
              >
                Previous
              </button>
              <div className="text-sm text-gray-600 px-2 py-1 bg-slate-300 rounded">{currentPage}</div>

              <button
                onClick={handleNextPage}
                disabled={!hasNextPage}
                className={`px-3 py-1 rounded-md text-sm ${
                  !hasNextPage
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-500 hover:bg-blue-600 text-white"
                }`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Single Record Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-red-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this record? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
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
            <Button variant="destructive" onClick={handleDeleteRecord} disabled={deleteLoading}>
              {deleteLoading ? (
                <>
                  <span className="animate-spin mr-2">⟳</span>
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete All Records Confirmation Dialog */}
      <Dialog open={deleteAllDialogOpen} onOpenChange={setDeleteAllDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-red-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              Confirm Delete All
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete ALL crash history records? This action cannot be undone and will remove
              all data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteAllDialogOpen(false)} disabled={deleteLoading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAllRecords} disabled={deleteLoading}>
              {deleteLoading ? (
                <>
                  <span className="animate-spin mr-2">⟳</span>
                  Deleting...
                </>
              ) : (
                "Delete All Records"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
