
"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  doc,
  addDoc,
  updateDoc,
} from "firebase/firestore"
import { getApp } from "firebase/app"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FaTrash, FaEdit, FaPlus, FaSave, FaTimes, FaSync } from "react-icons/fa"
import { ImSpinner8 } from "react-icons/im"

type MultiplierRange = {
  id: string
  min: number
  max: number
  probability: number
  createdAt?: Date
}

type NewMultiplierRange = Omit<MultiplierRange, "id" | "createdAt">

export default function MultiplierRangesAdmin() {
  const [multipliers, setMultipliers] = useState<MultiplierRange[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [totalProbability, setTotalProbability] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // New multiplier form state
  const [newMultiplier, setNewMultiplier] = useState<NewMultiplierRange>({
    min: 1.01,
    max: 2.0,
    probability: 10,
  })

  // Editing state
  const [editingMultiplier, setEditingMultiplier] = useState<MultiplierRange | null>(null)

  useEffect(() => {
    fetchMultipliers()
  }, [])

  const fetchMultipliers = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const app = getApp()
      const db = getFirestore(app)

      const multiplierQuery = query(collection(db, "crashMultipliers"), orderBy("min", "asc"))
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
          // createdAt: data.createdAt ? new Date(data.createdAt.toDate()) : undefined,
          createdAt: data.createdAt
            ? new Date((data.createdAt as any).toDate ? (data.createdAt as any).toDate() : data.createdAt)
            : undefined

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
      fetchMultipliers()
    } catch (error) {
      console.error("Error updating multiplier:", error)
      setError(error instanceof Error ? error.message : "Failed to update multiplier range")
    } finally {
      setIsSubmitting(false)
    }
  }

  const deleteMultiplier = async (id: string) => {
    if (!confirm("Are you sure you want to delete this multiplier range?")) {
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const app = getApp()
      const db = getFirestore(app)

      await deleteDoc(doc(db, "crashMultipliers", id))

      // Refresh the list
      fetchMultipliers()
    } catch (error) {
      console.error("Error deleting multiplier:", error)
      setError("Failed to delete multiplier range. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-500">Crash Multiplier Ranges Management</h1>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Add New Multiplier Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-500">Add New Multiplier Range</CardTitle>
          </CardHeader>
          <form onSubmit={addMultiplier}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Min Value</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="1.01"
                    value={newMultiplier.min}
                    onChange={(e) =>
                      setNewMultiplier({ ...newMultiplier, min: Number.parseFloat(e.target.value) || 1.01 })
                    }
                    placeholder="Min (e.g. 1.01)"
                    required
                    className="bg-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Max Value</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="1.02"
                    value={newMultiplier.max}
                    onChange={(e) =>
                      setNewMultiplier({ ...newMultiplier, max: Number.parseFloat(e.target.value) || 2.0 })
                    }
                    placeholder="Max (e.g. 2.0)"
                    required
                    className="bg-slate-100"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Probability (%)</label>
                <Input
                  type="number"
                  step="1"
                  min="1"
                  max="100"
                  value={newMultiplier.probability}
                  onChange={(e) =>
                    setNewMultiplier({ ...newMultiplier, probability: Number.parseInt(e.target.value) || 10 })
                  }
                  placeholder="Probability (e.g. 75)"
                  required
                  className="bg-slate-100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  All probabilities should add up to 100%. Current total: {totalProbability}%
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? (
                  <>
                    <ImSpinner8 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <FaPlus className="mr-2 h-4 w-4" />
                    Add Range
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Multiplier Ranges List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center text-gray-500">
              <span>Current Multiplier Ranges</span>
              <Button onClick={fetchMultipliers} variant="outline" size="sm" disabled={isLoading || isSubmitting}>
                {isLoading ? (
                  <>
                    <ImSpinner8 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <FaSync className="mr-2 h-4 w-4" />
                    Refresh
                  </>
                )}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-4">
                <ImSpinner8 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p>Loading multiplier ranges...</p>
              </div>
            ) : multipliers.length === 0 ? (
              <div className="text-center py-4">No multiplier ranges found. Add some to customize crash points.</div>
            ) : (
              <>
                <div
                  className={`mb-4 p-2 rounded ${totalProbability === 100 ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                    }`}
                >
                  Total Probability: {totalProbability}% {totalProbability !== 100 && "(Should equal 100%)"}
                </div>

                {editingMultiplier ? (
                  <form onSubmit={updateMultiplier} className="border rounded-md p-4 mb-4">
                    <h3 className="font-medium mb-3">Edit Multiplier Range</h3>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div>
                        <label className="block text-xs font-medium mb-1">Min Value</label>
                        <Input
                          type="number"
                          step="0.01"
                          min="1.01"
                          value={editingMultiplier.min}
                          onChange={(e) =>
                            setEditingMultiplier({
                              ...editingMultiplier,
                              min: Number.parseFloat(e.target.value) || 1.01,
                            })
                          }
                          required
                          className="bg-slate-100"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Max Value</label>
                        <Input
                          type="number"
                          step="0.01"
                          min="1.02"
                          value={editingMultiplier.max}
                          onChange={(e) =>
                            setEditingMultiplier({
                              ...editingMultiplier,
                              max: Number.parseFloat(e.target.value) || 2.0,
                            })
                          }
                          required
                          className="bg-slate-100"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Probability (%)</label>
                        <Input
                          type="number"
                          step="1"
                          min="1"
                          max="100"
                          value={editingMultiplier.probability}
                          onChange={(e) =>
                            setEditingMultiplier({
                              ...editingMultiplier,
                              probability: Number.parseInt(e.target.value) || 10,
                            })
                          }
                          required
                          className="bg-slate-100"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="text-red-500"
                        size="sm"
                        onClick={() => setEditingMultiplier(null)}
                        disabled={isSubmitting}
                      >
                        <FaTimes className="h-4 w-4 mr-1 text-red-500" />
                        Cancel
                      </Button>
                      <Button type="submit" size="sm" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <ImSpinner8 className="h-4 w-4 mr-1 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <FaSave className="h-4 w-4 mr-1" />
                            Save
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                ) : null}

                <Table>
                  <TableHeader>
                    <TableRow className="text-gray-700">
                      <TableHead>Min</TableHead>
                      <TableHead>Max</TableHead>
                      <TableHead>Probability %</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {multipliers.map((multiplier) => (
                      <TableRow key={multiplier.id}>
                        <TableCell>{multiplier.min.toFixed(2)} X</TableCell>
                        <TableCell>{multiplier.max.toFixed(2)} X</TableCell>
                        <TableCell>{multiplier.probability}%</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingMultiplier(multiplier)}
                              disabled={isSubmitting}
                              className="text-blue-500 hover:text-blue-700"
                            >
                              <FaEdit size={16} />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteMultiplier(multiplier.id)}
                              disabled={isSubmitting}
                              className="text-red-500 hover:text-red-700"
                            >
                              <FaTrash size={16} />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
