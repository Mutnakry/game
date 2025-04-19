"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc,
  addDoc,
  updateDoc,
  writeBatch,
  query,
  orderBy,
} from "firebase/firestore"
import { getApp } from "firebase/app"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Trash2,
  Edit,
  Plus,
  Save,
  RefreshCw,
  Wand2,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  BarChart3,
  Percent,
  Loader2,
  CheckCircle2,
} from "lucide-react"

type MultiplierRange = {
  id: string
  min: number
  max: number
  probability: number
  createdAt?: Date
}

type NewMultiplierRange = Omit<MultiplierRange, "id" | "createdAt">

// Default multiplier ranges
const DEFAULT_MULTIPLIERS = [
  { min: 0.1, max: 3.0, probability: 75 },
  { min: 3.1, max: 6.0, probability: 20 },
  { min: 6.1, max: 11.0, probability: 4 },
  { min: 12.1, max: 200, probability: 1 },
]

export default function MultiplierRangesAdmin() {
  const [multipliers, setMultipliers] = useState<MultiplierRange[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [totalProbability, setTotalProbability] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isInitializingDefaults, setIsInitializingDefaults] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"add" | "edit">("add")

  // New multiplier form state
  const [newMultiplier, setNewMultiplier] = useState<NewMultiplierRange>({
    min: 1.01,
    max: 2.0,
    probability: 10,
  })

  // Editing state
  const [editingMultiplier, setEditingMultiplier] = useState<MultiplierRange | null>(null)

  // Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [multiplierToDelete, setMultiplierToDelete] = useState<string | null>(null)

  useEffect(() => {
    fetchMultipliers()
  }, [])

  // Show success message with auto-dismiss
  const showSuccess = (message: string) => {
    setSuccessMessage(message)
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  const fetchMultipliers = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const app = getApp()
      const db = getFirestore(app)

      const multiplierQuery = query(collection(db, "crashMultipliers"), orderBy("min", sortOrder))
      const querySnapshot = await getDocs(multiplierQuery)

      const multiplierData: MultiplierRange[] = []
      let probabilitySum = 0

      querySnapshot.forEach((doc) => {
        const data = doc.data() as Omit<MultiplierRange, "id">
        multiplierData.push({
          id: doc.id,
          min: data.min,
          max: data.max,
          probability: data.probability,
          createdAt: data.createdAt
            ? new Date((data.createdAt as any).toDate ? (data.createdAt as any).toDate() : data.createdAt)
            : undefined,
        })
        probabilitySum += data.probability
      })

      setMultipliers(multiplierData)
      setTotalProbability(probabilitySum)
    } catch (error) {
      console.error("Error fetching multipliers:", error)
      setError("Failed to load multiplier ranges. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const toggleSortOrder = () => {
    const newOrder = sortOrder === "asc" ? "desc" : "asc"
    setSortOrder(newOrder)
    // Re-fetch with new sort order
    fetchMultipliers()
  }

  const openAddModal = () => {
    setNewMultiplier({
      min: 1.01,
      max: 2.0,
      probability: 10,
    })
    setModalMode("add")
    setIsModalOpen(true)
  }

  const openEditModal = (multiplier: MultiplierRange) => {
    setEditingMultiplier(multiplier)
    setModalMode("edit")
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setError(null)
    // Reset after animation completes
    setTimeout(() => {
      setEditingMultiplier(null)
      setNewMultiplier({
        min: 1.01,
        max: 2.0,
        probability: 10,
      })
    }, 300)
  }

  const addMultiplier = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    setIsSubmitting(true)
    setError(null)

    try {
      // Validate input
      if (newMultiplier.min >= newMultiplier.max) {
        throw new Error("Min value must be less than max value")
      }

      if (newMultiplier.probability <= 0 || newMultiplier.probability > 100) {
        throw new Error("Probability must be between 0 and 100")
      }

      // Check for overlapping ranges
      const hasOverlap = multipliers.some(
        (m) =>
          (newMultiplier.min >= m.min && newMultiplier.min <= m.max) ||
          (newMultiplier.max >= m.min && newMultiplier.max <= m.max) ||
          (newMultiplier.min <= m.min && newMultiplier.max >= m.max),
      )

      if (hasOverlap) {
        throw new Error("This range overlaps with an existing range")
      }

      const app = getApp()
      const db = getFirestore(app)

      await addDoc(collection(db, "crashMultipliers"), {
        min: newMultiplier.min,
        max: newMultiplier.max,
        probability: newMultiplier.probability,
        createdAt: new Date(),
      })

      // Reset form and refresh
      setNewMultiplier({
        min: 1.01,
        max: 2.0,
        probability: 10,
      })

      closeModal()
      showSuccess("Multiplier range added successfully!")
      fetchMultipliers()
    } catch (error) {
      console.error("Error adding multiplier:", error)
      setError(error instanceof Error ? error.message : "Failed to add multiplier range")
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateMultiplier = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting || !editingMultiplier) return

    setIsSubmitting(true)
    setError(null)

    try {
      // Validate input
      if (editingMultiplier.min >= editingMultiplier.max) {
        throw new Error("Min value must be less than max value")
      }

      if (editingMultiplier.probability <= 0 || editingMultiplier.probability > 100) {
        throw new Error("Probability must be between 0 and 100")
      }

      // Check for overlapping ranges (excluding the current one being edited)
      const hasOverlap = multipliers.some(
        (m) =>
          m.id !== editingMultiplier.id &&
          ((editingMultiplier.min >= m.min && editingMultiplier.min <= m.max) ||
            (editingMultiplier.max >= m.min && editingMultiplier.max <= m.max) ||
            (editingMultiplier.min <= m.min && editingMultiplier.max >= m.max)),
      )

      if (hasOverlap) {
        throw new Error("This range overlaps with an existing range")
      }

      const app = getApp()
      const db = getFirestore(app)

      const multiplierRef = doc(db, "crashMultipliers", editingMultiplier.id)

      await updateDoc(multiplierRef, {
        min: editingMultiplier.min,
        max: editingMultiplier.max,
        probability: editingMultiplier.probability,
        updatedAt: new Date(),
      })

      // Reset editing state and refresh
      setEditingMultiplier(null)
      closeModal()
      showSuccess("Multiplier range updated successfully!")
      fetchMultipliers()
    } catch (error) {
      console.error("Error updating multiplier:", error)
      setError(error instanceof Error ? error.message : "Failed to update multiplier range")
    } finally {
      setIsSubmitting(false)
    }
  }

  const confirmDelete = (id: string) => {
    setMultiplierToDelete(id)
    setDeleteConfirmOpen(true)
  }

  const deleteMultiplier = async () => {
    if (!multiplierToDelete) return

    setIsSubmitting(true)
    setError(null)

    try {
      const app = getApp()
      const db = getFirestore(app)

      await deleteDoc(doc(db, "crashMultipliers", multiplierToDelete))

      // Close dialog and refresh
      setDeleteConfirmOpen(false)
      setMultiplierToDelete(null)
      showSuccess("Multiplier range deleted successfully!")
      fetchMultipliers()
    } catch (error) {
      console.error("Error deleting multiplier:", error)
      setError("Failed to delete multiplier range. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const initializeDefaultMultipliers = async () => {
    setIsInitializingDefaults(true)
    setError(null)

    try {
      const app = getApp()
      const db = getFirestore(app)
      const batch = writeBatch(db)

      // Delete all existing multipliers
      for (const multiplier of multipliers) {
        batch.delete(doc(db, "crashMultipliers", multiplier.id))
      }

      // Commit the batch delete
      await batch.commit()

      // Add default multipliers
      for (const multiplier of DEFAULT_MULTIPLIERS) {
        await addDoc(collection(db, "crashMultipliers"), {
          min: multiplier.min,
          max: multiplier.max,
          probability: multiplier.probability,
          createdAt: new Date(),
        })
      }

      // Refresh the list
      showSuccess("Default multiplier ranges initialized successfully!")
      fetchMultipliers()
    } catch (error) {
      console.error("Error initializing default multipliers:", error)
      setError("Failed to initialize default multipliers. Please try again.")
    } finally {
      setIsInitializingDefaults(false)
    }
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <motion.div className="container mx-auto py-8" initial="hidden" animate="visible" variants={containerVariants}>
      <motion.div variants={itemVariants} className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center">
          <BarChart3 className="mr-2 h-6 w-6 text-blue-500" />
          Crash Multiplier Ranges
        </h1>

        <div className="flex space-x-2">
          <Button onClick={openAddModal} className="bg-blue-600 hover:bg-blue-700" disabled={isSubmitting || isLoading}>
            <Plus className="mr-2 h-4 w-4" />
            Add Range
          </Button>
        </div>
      </motion.div>

      {/* Success Message */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6"
          >
            <Alert className="bg-green-50 border-green-200 text-green-800">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6"
          >
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      <Tabs defaultValue="table" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="table">Table View</TabsTrigger>
          <TabsTrigger value="chart">Chart View</TabsTrigger>
        </TabsList>

        <TabsContent value="table">
          <motion.div variants={itemVariants}>
            <Card className="shadow-md border-slate-200">
              <CardHeader className="bg-slate-50 border-b border-slate-100">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-slate-800 flex items-center">
                    <Percent className="mr-2 h-5 w-5 text-blue-500" />
                    Multiplier Ranges
                    {totalProbability !== 100 && (
                      <Badge variant="outline" className="ml-2 bg-yellow-50 text-yellow-700 border-yellow-200">
                        Total: {totalProbability}%
                      </Badge>
                    )}
                    {totalProbability === 100 && (
                      <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">
                        Total: 100%
                      </Badge>
                    )}
                  </CardTitle>

                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleSortOrder}
                      className="text-slate-600 border-slate-200"
                    >
                      {sortOrder === "asc" ? (
                        <>
                          <ChevronUp className="mr-1 h-4 w-4" />
                          Ascending
                        </>
                      ) : (
                        <>
                          <ChevronDown className="mr-1 h-4 w-4" />
                          Descending
                        </>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchMultipliers}
                      disabled={isLoading}
                      className="text-slate-600 border-slate-200"
                    >
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm("This will reset all multiplier ranges to default values. Are you sure?")) {
                          initializeDefaultMultipliers()
                        }
                      }}
                      disabled={isInitializingDefaults}
                      className="text-blue-600 border-blue-200"
                    >
                      {isInitializingDefaults ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Wand2 className="mr-1 h-4 w-4" />
                      )}
                      Reset to Defaults
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-4" />
                    <p className="text-slate-600">Loading multiplier ranges...</p>
                  </div>
                ) : multipliers.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="bg-slate-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                      <AlertTriangle className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-700 mb-2">No Multiplier Ranges Found</h3>
                    <p className="text-slate-500 max-w-md mx-auto mb-6">
                      You haven't configured any multiplier ranges yet. Add some ranges or initialize the defaults.
                    </p>
                    <div className="flex justify-center space-x-4">
                      <Button onClick={openAddModal} className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="mr-2 h-4 w-4" />
                        Add First Range
                      </Button>
                      <Button
                        variant="outline"
                        onClick={initializeDefaultMultipliers}
                        disabled={isInitializingDefaults}
                        className="border-blue-200 text-blue-600"
                      >
                        <Wand2 className="mr-2 h-4 w-4" />
                        Use Defaults
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50">
                          <TableHead className="w-[100px]">Min Value</TableHead>
                          <TableHead className="w-[100px]">Max Value</TableHead>
                          <TableHead className="w-[120px]">Probability</TableHead>
                          <TableHead className="w-[200px]">Distribution</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {multipliers.map((multiplier) => (
                          <TableRow key={multiplier.id} className="hover:bg-slate-50">
                            <TableCell className="font-medium">{multiplier.min.toFixed(2)}x</TableCell>
                            <TableCell>{multiplier.max.toFixed(2)}x</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-medium">
                                {multiplier.probability}%
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                <div
                                  className="bg-blue-600 h-2.5 rounded-full"
                                  style={{ width: `${multiplier.probability}%` }}
                                ></div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditModal(multiplier)}
                                  className="h-8 w-8 p-0 text-slate-600 hover:text-blue-600"
                                >
                                  <Edit className="h-4 w-4" />
                                  <span className="sr-only">Edit</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => confirmDelete(multiplier.id)}
                                  className="h-8 w-8 p-0 text-slate-600 hover:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Delete</span>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>

              {multipliers.length > 0 && (
                <CardFooter className="bg-slate-50 border-t border-slate-100 py-3">
                  <div className="w-full flex justify-between items-center text-sm text-slate-500">
                    <span>
                      {multipliers.length} {multipliers.length === 1 ? "range" : "ranges"}
                    </span>
                    <span>
                      Total probability:{" "}
                      <span
                        className={
                          totalProbability === 100 ? "text-green-600 font-medium" : "text-yellow-600 font-medium"
                        }
                      >
                        {totalProbability}%
                      </span>
                    </span>
                  </div>
                </CardFooter>
              )}
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="chart">
          <motion.div variants={itemVariants}>
            <Card className="shadow-md border-slate-200">
              <CardHeader className="bg-slate-50 border-b border-slate-100">
                <CardTitle className="text-slate-800">Probability Distribution</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-4" />
                    <p className="text-slate-600">Loading chart data...</p>
                  </div>
                ) : multipliers.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-slate-500">No data available to display chart</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {multipliers.map((multiplier) => (
                      <div key={multiplier.id} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-sm font-medium text-slate-700">
                              {multiplier.min.toFixed(2)}x - {multiplier.max.toFixed(2)}x
                            </span>
                          </div>
                          <span className="text-sm font-semibold text-blue-600">{multiplier.probability}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-3">
                          <motion.div
                            className="bg-blue-600 h-3 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${multiplier.probability}%` }}
                            transition={{ duration: 1, delay: 0.2 }}
                          ></motion.div>
                        </div>
                      </div>
                    ))}

                    <div className="pt-4 border-t border-slate-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-500">Total</span>
                        <span
                          className={`text-sm font-semibold ${
                            totalProbability === 100 ? "text-green-600" : "text-yellow-600"
                          }`}
                        >
                          {totalProbability}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{modalMode === "add" ? "Add New Multiplier Range" : "Edit Multiplier Range"}</DialogTitle>
            <DialogDescription>
              {modalMode === "add"
                ? "Configure a new multiplier range and its probability."
                : "Update the multiplier range values and probability."}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive" className="mt-2">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={modalMode === "add" ? addMultiplier : updateMultiplier} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="min-value" className="text-sm font-medium">
                  Min Value
                </label>
                <Input
                  id="min-value"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={modalMode === "add" ? newMultiplier.min : editingMultiplier?.min}
                  onChange={(e) => {
                    const value = Number.parseFloat(e.target.value) || 0.01
                    if (modalMode === "add") {
                      setNewMultiplier({ ...newMultiplier, min: value })
                    } else if (editingMultiplier) {
                      setEditingMultiplier({ ...editingMultiplier, min: value })
                    }
                  }}
                  placeholder="Min (e.g. 1.01)"
                  required
                  className="bg-slate-50"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="max-value" className="text-sm font-medium">
                  Max Value
                </label>
                <Input
                  id="max-value"
                  type="number"
                  step="0.01"
                  min="0.02"
                  value={modalMode === "add" ? newMultiplier.max : editingMultiplier?.max}
                  onChange={(e) => {
                    const value = Number.parseFloat(e.target.value) || 0.02
                    if (modalMode === "add") {
                      setNewMultiplier({ ...newMultiplier, max: value })
                    } else if (editingMultiplier) {
                      setEditingMultiplier({ ...editingMultiplier, max: value })
                    }
                  }}
                  placeholder="Max (e.g. 2.0)"
                  required
                  className="bg-slate-50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="probability" className="text-sm font-medium">
                  Probability (%)
                </label>
                <span className="text-sm font-medium text-blue-600">
                  {modalMode === "add" ? newMultiplier.probability : editingMultiplier?.probability}%
                </span>
              </div>

              <Slider
                id="probability"
                min={1}
                max={100}
                step={1}
                value={[modalMode === "add" ? newMultiplier.probability : editingMultiplier?.probability || 10]}
                onValueChange={(value) => {
                  if (modalMode === "add") {
                    setNewMultiplier({ ...newMultiplier, probability: value[0] })
                  } else if (editingMultiplier) {
                    setEditingMultiplier({ ...editingMultiplier, probability: value[0] })
                  }
                }}
                className="py-4"
              />

              <div className="flex justify-between text-xs text-slate-500">
                <span>1%</span>
                <span>50%</span>
                <span>100%</span>
              </div>

              <p className="text-xs text-slate-500 mt-2">
                All probabilities should add up to 100%. Current total:{" "}
                <span
                  className={totalProbability === 100 ? "text-green-600 font-medium" : "text-yellow-600 font-medium"}
                >
                  {totalProbability}%
                </span>
              </p>
            </div>

            <DialogFooter>
              <Button variant="outline" type="button" onClick={closeModal} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {modalMode === "add" ? "Adding..." : "Saving..."}
                  </>
                ) : modalMode === "add" ? (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Range
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this multiplier range? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-red-50 border border-red-100 rounded-md p-4 my-4">
            <p className="text-sm text-red-800">
              Deleting this range will affect the probability distribution of crash points. Make sure to adjust other
              ranges to maintain a total of 100%.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteConfirmOpen(false)
                setMultiplierToDelete(null)
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteMultiplier} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
