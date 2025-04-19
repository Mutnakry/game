"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import {
  Trash2,
  Edit,
  Plus,
  Save,
  RefreshCw,
  Wand2,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  DollarSign,
  Tag,
  Settings,
} from "lucide-react"

type Preset = {
  id?: string
  value: number
  label: string
}

// Default presets to initialize
const DEFAULT_PRESETS = [
  { value: 10, label: "10.00" },
  { value: 20, label: "20.00" },
  { value: 50, label: "50.00" },
  { value: 100, label: "100.00" },
]

export function AddNewPresets() {
  const [presets, setPresets] = useState<Preset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isInitializingDefaults, setIsInitializingDefaults] = useState(false)
  const { toast } = useToast()

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"add" | "edit">("add")
  const [newPreset, setNewPreset] = useState<Preset>({ value: 0, label: "" })
  const [editingPreset, setEditingPreset] = useState<Preset | null>(null)

  // Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [presetToDelete, setPresetToDelete] = useState<string | null>(null)

  // Fetch presets on component mount
  useEffect(() => {
    fetchPresets()
  }, [])

  // Show success message with auto-dismiss
  const showSuccess = (message: string) => {
    setSuccessMessage(message)
    setTimeout(() => setSuccessMessage(null), 3000)
  }

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

  const openAddModal = () => {
    setNewPreset({ value: 0, label: "" })
    setModalMode("add")
    setIsModalOpen(true)
  }

  const openEditModal = (preset: Preset) => {
    setEditingPreset(preset)
    setModalMode("edit")
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setError(null)
    // Reset after animation completes
    setTimeout(() => {
      setEditingPreset(null)
      setNewPreset({ value: 0, label: "" })
    }, 300)
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
      closeModal()
      showSuccess("Preset added successfully!")
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
      closeModal()
      showSuccess("Preset updated successfully!")
      fetchPresets()
    } catch (err: any) {
      setError(err.message || "Error updating preset. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const confirmDelete = (id: string) => {
    setPresetToDelete(id)
    setDeleteConfirmOpen(true)
  }

  const handleDeletePreset = async () => {
    if (!presetToDelete) return

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/game-presets?id=${presetToDelete}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete preset")
      }

      // Close dialog and refresh presets
      setDeleteConfirmOpen(false)
      setPresetToDelete(null)
      showSuccess("Preset deleted successfully!")
      fetchPresets()
    } catch (err: any) {
      setError(err.message || "Error deleting preset. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const initializeDefaultPresets = async () => {
    if (!confirm("This will delete all existing presets and add the default ones. Are you sure?")) {
      return
    }

    setIsInitializingDefaults(true)
    setError(null)

    try {
      // Delete all existing presets
      if (presets.length > 0) {
        for (const preset of presets) {
          if (preset.id) {
            const deleteResponse = await fetch(`/api/game-presets?id=${preset.id}`, {
              method: "DELETE",
            })

            if (!deleteResponse.ok) {
              throw new Error(`Failed to delete preset with ID: ${preset.id}`)
            }
          }
        }
      }

      // Add default presets
      for (const preset of DEFAULT_PRESETS) {
        const addResponse = await fetch("/api/game-presets", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(preset),
        })

        if (!addResponse.ok) {
          throw new Error(`Failed to add preset: ${JSON.stringify(preset)}`)
        }
      }

      // Refresh presets
      fetchPresets()
      showSuccess("Default presets have been initialized successfully!")

      toast({
        title: "Success",
        description: "Default presets have been initialized",
        variant: "success",
      })
    } catch (error) {
      console.error("Error initializing default presets:", error)
      setError(`Failed to initialize default presets: ${error instanceof Error ? error.message : "Unknown error"}`)

      toast({
        title: "Error",
        description: "Failed to initialize default presets",
        variant: "destructive",
      })
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
          <Settings className="mr-2 h-6 w-6 text-blue-500" />
          Game Presets Management
        </h1>

        <div className="flex space-x-2">
          <Button onClick={openAddModal} className="bg-blue-600 hover:bg-blue-700" disabled={isSubmitting || loading}>
            <Plus className="mr-2 h-4 w-4" />
            Add Preset
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

      <Tabs defaultValue="grid" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="grid">Grid View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>

        <TabsContent value="grid">
          <motion.div variants={itemVariants}>
            <Card className="shadow-md border-slate-200">
              <CardHeader className="bg-slate-50 border-b border-slate-100">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-slate-800 flex items-center">
                    <DollarSign className="mr-2 h-5 w-5 text-blue-500" />
                    Betting Presets
                    <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700 border-blue-200">
                      {presets.length} {presets.length === 1 ? "preset" : "presets"}
                    </Badge>
                  </CardTitle>

                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchPresets}
                      disabled={loading}
                      className="text-slate-600 border-slate-200"
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={initializeDefaultPresets}
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

              <CardContent className="p-6">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-4" />
                    <p className="text-slate-600">Loading presets...</p>
                  </div>
                ) : presets.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="bg-slate-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                      <AlertTriangle className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-700 mb-2">No Presets Found</h3>
                    <p className="text-slate-500 max-w-md mx-auto mb-6">
                      You haven't configured any betting presets yet. Add some presets or initialize the defaults.
                    </p>
                    <div className="flex justify-center space-x-4">
                      <Button onClick={openAddModal} className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="mr-2 h-4 w-4" />
                        Add First Preset
                      </Button>
                      <Button
                        variant="outline"
                        onClick={initializeDefaultPresets}
                        disabled={isInitializingDefaults}
                        className="border-blue-200 text-blue-600"
                      >
                        <Wand2 className="mr-2 h-4 w-4" />
                        Use Defaults
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {presets.map((preset) => (
                      <motion.div
                        key={preset.id}
                        className="bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-4"
                        whileHover={{ y: -2 }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <div className="flex flex-col h-full">
                          <div className="flex justify-between items-start mb-2">
                            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-none">
                              {preset.label}
                            </Badge>
                            <div className="flex space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditModal(preset)}
                                className="h-8 w-8 p-0 text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                              >
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => preset.id && confirmDelete(preset.id)}
                                className="h-8 w-8 p-0 text-slate-600 hover:text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center text-2xl font-bold text-slate-800">
                              <DollarSign className="h-5 w-5 text-green-600 mr-1" />
                              {preset.value.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="list">
          <motion.div variants={itemVariants}>
            <Card className="shadow-md border-slate-200">
              <CardHeader className="bg-slate-50 border-b border-slate-100">
                <CardTitle className="text-slate-800 flex items-center">
                  <Tag className="mr-2 h-5 w-5 text-blue-500" />
                  Presets List
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-4" />
                    <p className="text-slate-600">Loading presets...</p>
                  </div>
                ) : presets.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-slate-500">No presets found</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {presets.map((preset) => (
                      <div key={preset.id} className="p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <div className="bg-blue-100 text-blue-700 rounded-full w-10 h-10 flex items-center justify-center mr-3">
                              <DollarSign className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-800">{preset.label}</p>
                              <p className="text-sm text-slate-500">Value: {preset.value.toFixed(2)}</p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditModal(preset)}
                              className="text-slate-600 border-slate-200"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => preset.id && confirmDelete(preset.id)}
                              className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter className="bg-slate-50 border-t border-slate-100 py-3">
                <div className="w-full flex justify-between items-center text-sm text-slate-500">
                  <span>
                    {presets.length} {presets.length === 1 ? "preset" : "presets"}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchPresets}
                    disabled={loading}
                    className="text-slate-600 border-slate-200"
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Refresh
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{modalMode === "add" ? "Add New Preset" : "Edit Preset"}</DialogTitle>
            <DialogDescription>
              {modalMode === "add"
                ? "Configure a new betting preset for your game."
                : "Update the preset values for your game."}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive" className="mt-2">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={modalMode === "add" ? handleAddPreset : handleUpdatePreset} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="preset-value" className="text-sm font-medium">
                  Value
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 h-4 w-4" />
                  <Input
                    id="preset-value"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={modalMode === "add" ? newPreset.value : editingPreset?.value}
                    onChange={(e) => {
                      const value = Number.parseFloat(e.target.value) || 0
                      if (modalMode === "add") {
                        setNewPreset({ ...newPreset, value })
                      } else if (editingPreset) {
                        setEditingPreset({ ...editingPreset, value })
                      }
                    }}
                    placeholder="Enter value (e.g. 10.00)"
                    required
                    className="bg-slate-50 pl-10"
                  />
                </div>
                <p className="text-xs text-slate-500">The numeric value for this preset</p>
              </div>

              <div className="space-y-2">
                <label htmlFor="preset-label" className="text-sm font-medium">
                  Label (Optional)
                </label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 h-4 w-4" />
                  <Input
                    id="preset-label"
                    type="text"
                    value={modalMode === "add" ? newPreset.label : editingPreset?.label || ""}
                    onChange={(e) => {
                      const label = e.target.value
                      if (modalMode === "add") {
                        setNewPreset({ ...newPreset, label })
                      } else if (editingPreset) {
                        setEditingPreset({ ...editingPreset, label })
                      }
                    }}
                    placeholder="Enter label (e.g. '10.00')"
                    className="bg-slate-50 pl-10"
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Display label for the preset. If left empty, the value will be used.
                </p>
              </div>
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
                    Add Preset
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
              Are you sure you want to delete this preset? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-red-50 border border-red-100 rounded-md p-4 my-4">
            <p className="text-sm text-red-800">
              Deleting this preset will remove it from the betting options available to players.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteConfirmOpen(false)
                setPresetToDelete(null)
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeletePreset} disabled={isSubmitting}>
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
