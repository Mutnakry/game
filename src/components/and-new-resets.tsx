"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { FaTrash, FaEdit, FaPlus, FaSave, FaTimes } from "react-icons/fa"
import { ImSpinner8 } from "react-icons/im"

type Preset = {
  id?: string
  value: number
  label: string
}

export function AddNewPresets() {
  const [presets, setPresets] = useState<Preset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newPreset, setNewPreset] = useState<Preset>({ value: 0, label: "" })
  const [editingPreset, setEditingPreset] = useState<Preset | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch presets on component mount
  useEffect(() => {
    fetchPresets()
  }, [])

  const fetchPresets = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/game-presets")
      if (!response.ok) {
        throw new Error("Failed to fetch presets")
      }
      const data = await response.json()
      setPresets(data)
    } catch (err) {
      setError("Error loading presets. Please try again.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddPreset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    setIsSubmitting(true)
    setError(null)

    try {
      // Validate input
      if (newPreset.value <= 0) {
        throw new Error("Value must be greater than 0")
      }

      // If label is empty, use the value
      const presetToAdd = {
        ...newPreset,
        label: newPreset.label || newPreset.value.toFixed(2),
      }

      const response = await fetch("/api/game-presets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(presetToAdd),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to add preset")
      }

      // Reset form and refresh presets
      setNewPreset({ value: 0, label: "" })
      fetchPresets()
    } catch (err: any) {
      setError(err.message || "Error adding preset. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdatePreset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting || !editingPreset) return

    setIsSubmitting(true)
    setError(null)

    try {
      // Validate input
      if (editingPreset.value <= 0) {
        throw new Error("Value must be greater than 0")
      }

      // If label is empty, use the value
      const presetToUpdate = {
        ...editingPreset,
        label: editingPreset.label || editingPreset.value.toFixed(2),
      }

      const response = await fetch("/api/game-presets", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(presetToUpdate),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update preset")
      }

      // Reset editing state and refresh presets
      setEditingPreset(null)
      fetchPresets()
    } catch (err: any) {
      setError(err.message || "Error updating preset. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeletePreset = async (id: string) => {
    if (!confirm("Are you sure you want to delete this preset?")) {
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/game-presets?id=${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete preset")
      }

      // Refresh presets
      fetchPresets()
    } catch (err: any) {
      setError(err.message || "Error deleting preset. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Game Presets Management</h1>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Add New Preset Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-600">Add New Preset</CardTitle>
          </CardHeader>
          <form onSubmit={handleAddPreset}>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-600">Value</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newPreset.value}
                  onChange={(e) => setNewPreset({ ...newPreset, value: Number.parseFloat(e.target.value) || 0 })}
                  placeholder="Enter value (e.g. 10.00)"
                  required
                  className="bg-slate-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-600">Label (Optional)</label>
                <Input
                  type="text"
                  value={newPreset.label}
                  onChange={(e) => setNewPreset({ ...newPreset, label: e.target.value })}
                  placeholder="Enter label (e.g. '10.00')"
                  className="bg-slate-100"
                />
                <p className="text-xs text-gray-500 mt-1">If left empty, the value will be used as the label.</p>
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
                    Add Preset
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Presets List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-600">Current Presets</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <ImSpinner8 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : presets.length === 0 ? (
              <p className="text-center py-8 text-gray-500">No presets found. Add your first preset.</p>
            ) : (
              <div className="space-y-4">
                {presets.map((preset) => (
                  <div key={preset.id} className="border rounded-md p-4">
                    {editingPreset && editingPreset.id === preset.id ? (
                      <form onSubmit={handleUpdatePreset} className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-medium mb-1 text-gray-600">Value</label>
                            <Input
                              type="number"
                              step="0.01"
                              className="bg-slate-100"
                              min="0"
                              value={editingPreset.value}
                              onChange={(e) =>
                                setEditingPreset({
                                  ...editingPreset,
                                  value: Number.parseFloat(e.target.value) || 0,
                                })
                              }
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1 text-gray-600">Label</label>
                            <Input
                              type="text"
                              className="bg-slate-100"
                              value={editingPreset.label}
                              onChange={(e) =>
                                setEditingPreset({
                                  ...editingPreset,
                                  label: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                        <div className="flex justify-end space-x-2 text-gray-600">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingPreset(null)}
                            disabled={isSubmitting}
                          >
                            <FaTimes className="h-4 w-4 mr-1 text-gray-600" />
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
                    ) : (
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-700">
                            {preset.label} ({preset.value.toFixed(2)})
                          </p>
                        </div>
                        <div className="flex space-x-2 text-blue-600">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingPreset(preset)}
                            disabled={isSubmitting}
                          >
                            <FaEdit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => preset.id && handleDeletePreset(preset.id)}
                            disabled={isSubmitting}
                          >
                            <FaTrash className="h-4 w-4" />
                            <span className="sr-only text-gray-600">Delete</span>
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full text-white bg-blue-600 hover:bg-blue-500" onClick={fetchPresets} disabled={loading || isSubmitting}>
              {loading ? (
                <>
                  <ImSpinner8 className="mr-2 h-4 w-4 animate-spin text-gray-600" />
                  Refreshing...
                </>
              ) : (
                "Refresh Presets"
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
