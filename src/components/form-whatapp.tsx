"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { doc, setDoc, getDoc } from "firebase/firestore"
import { db } from "@/components/firebase-config"
import {
  Loader2,
  Phone,
  MessageSquare,
  ExternalLink,
  Copy,
  Check,
  Edit2,
  Save,
  X,
  AlertCircle,
  Clock,
  Plus,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Updated type definitions
interface WhatAppEntry {
  id: string
  whatapp: string
  phoneLink?: string
  message?: string
  createdAt: string
  updatedAt: string
}

interface SingleWhatAppState {
  entry: WhatAppEntry | null
  isEditing: boolean
  isLoading: boolean
}

// The fixed document ID for the single what app entry
const SINGLE_WHAT_APP_ID = "single-what-app"

// Pre-defined values from the user
const DEFAULT_WHATAPP_NUMBER = "977 9700447095"
const DEFAULT_WHATAPP_LINK = "https://bit.ly/3YHcfpl"

export default function SingleWhatAppForm() {
  const [state, setState] = useState<SingleWhatAppState>({
    entry: null,
    isEditing: false,
    isLoading: true,
  })

  const [whatAppValue, setWhatAppValue] = useState<string>("")
  const [phoneLinkValue, setPhoneLinkValue] = useState<string>("")
  const [messageValue, setMessageValue] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [copySuccess, setCopySuccess] = useState<{ text: string; type: string } | null>(null)

  // Fetch the single what app entry on component mount
  useEffect(() => {
    const fetchEntry = async () => {
      if (!db) return

      setState((prev) => ({ ...prev, isLoading: true }))
      setError(null)

      try {
        const docRef = doc(db, "what-app1", SINGLE_WHAT_APP_ID)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          const data = docSnap.data() as Omit<WhatAppEntry, "id">
          setState({
            entry: {
              id: SINGLE_WHAT_APP_ID,
              whatapp: data.whatapp,
              phoneLink: data.phoneLink || "",
              message: data.message || "",
              createdAt: data.createdAt,
              updatedAt: data.updatedAt,
            },
            isEditing: false,
            isLoading: false,
          })
        } else {
          // No entry exists yet - initialize with default values
          setState({
            entry: null,
            isEditing: false,
            isLoading: false,
          })
        }
      } catch (error) {
        console.error("Error fetching entry:", error)
        setError("Failed to load data. Please refresh the page.")
        setState((prev) => ({ ...prev, isLoading: false }))
      }
    }

    fetchEntry()
  }, [])

  // Start editing the entry
  const handleEdit = () => {
    if (state.entry) {
      setWhatAppValue(state.entry.whatapp)
      setPhoneLinkValue(state.entry.phoneLink || "")
      setMessageValue(state.entry.message || "")
      setState((prev) => ({ ...prev, isEditing: true }))
    }
  }

  // Create or update the entry
  const handleSave = async () => {
    if (!whatAppValue.trim() || !db) return

    setIsSubmitting(true)
    setError(null)

    try {
      const now = new Date().toISOString()

      // Determine if this is a create or update operation
      const isCreate = !state.entry

      const updatedEntry: WhatAppEntry = {
        id: SINGLE_WHAT_APP_ID,
        whatapp: whatAppValue.trim(),
        phoneLink: phoneLinkValue.trim(),
        message: messageValue.trim(),
        createdAt: isCreate ? now : state.entry?.createdAt || now,
        updatedAt: now,
      }

      // Save to Firebase
      await setDoc(doc(db, "what-app1", SINGLE_WHAT_APP_ID), {
        whatapp: updatedEntry.whatapp,
        phoneLink: updatedEntry.phoneLink,
        message: updatedEntry.message,
        createdAt: updatedEntry.createdAt,
        updatedAt: updatedEntry.updatedAt,
      })

      // Update state
      setState({
        entry: updatedEntry,
        isEditing: false,
        isLoading: false,
      })

      // Reset form
      setWhatAppValue("")
      setPhoneLinkValue("")
      setMessageValue("")
    } catch (error) {
      console.error("Error saving data:", error)
      setError("Failed to save your data. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Cancel editing
  const handleCancel = () => {
    setState((prev) => ({ ...prev, isEditing: false }))
    setWhatAppValue("")
    setPhoneLinkValue("")
    setMessageValue("")
    setError(null)
  }

  // Create new entry with default values
  const handleCreate = () => {
    setState((prev) => ({ ...prev, isEditing: true }))
    setWhatAppValue(DEFAULT_WHATAPP_NUMBER)
    setPhoneLinkValue(DEFAULT_WHATAPP_LINK)
    setMessageValue("")
    setError(null)
  }

  // Copy text to clipboard
  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopySuccess({ text: `${type} copied to clipboard!`, type })
        setTimeout(() => setCopySuccess(null), 2000)
      },
      () => {
        setCopySuccess({ text: "Failed to copy", type: "error" })
        setTimeout(() => setCopySuccess(null), 2000)
      },
    )
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  return (
    <div className="max-w-md mx-auto perspective-1000">
      <div className="relative">
        {/* Floating Designs */}
        <div className="absolute -top-6 -left-6 w-20 h-20 bg-gradient-to-br from-green-300 to-green-400 rounded-full blur-xl opacity-70 animate-pulse" />
        <div className="absolute -bottom-8 -right-8 w-28 h-28 bg-gradient-to-tr from-emerald-300 to-teal-400 rounded-full blur-xl opacity-60 animate-pulse" />
        <div className="absolute top-1/3 -right-10 w-16 h-16 bg-gradient-to-tr from-green-200 to-teal-300 rounded-full blur-lg opacity-60" />

        {/* Main Card with Glass Effect */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative backdrop-blur-sm bg-white/90 rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/20"
        >
          {/* Decorative Header Wave */}
          <div className="absolute top-0 left-0 w-full h-32 overflow-hidden z-0">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="absolute -top-36 left-0 w-full">
              <path
                fill="#25D366"
                fillOpacity="0.6"
                d="M0,288L48,272C96,256,192,224,288,197.3C384,171,480,149,576,165.3C672,181,768,235,864,250.7C960,267,1056,245,1152,208C1248,171,1344,117,1392,90.7L1440,64L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"
              ></path>
            </svg>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="absolute -top-24 left-0 w-full">
              <path
                fill="#25D366"
                fillOpacity="0.4"
                d="M0,96L48,122.7C96,149,192,203,288,192C384,181,480,107,576,80C672,53,768,75,864,101.3C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"
              ></path>
            </svg>
          </div>

          {/* Header */}
          <div className="relative z-10 pt-8 px-6 pb-6 flex flex-col items-center">
            <div className="bg-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center mb-4 ring-4 ring-white ring-opacity-60">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="w-10 h-10 text-[#25D366] fill-current"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-1 text-center">WhatsApp Contact</h1>
            <p className="text-gray-500 text-center max-w-xs">Connect with your customers through WhatsApp Business</p>
          </div>

          {/* Body Content */}
          <div className="relative z-10 px-8 pb-8">
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mb-6 p-4 bg-red-50 rounded-xl border-l-4 border-red-400 text-red-600 text-sm flex items-center gap-3 shadow-sm"
                >
                  <div className="bg-red-100 p-1.5 rounded-full">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  </div>
                  <p>{error}</p>
                </motion.div>
              )}

              {copySuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mb-6 p-4 bg-green-50 rounded-xl border-l-4 border-green-400 text-green-600 text-sm flex items-center gap-3 shadow-sm"
                >
                  <div className="bg-green-100 p-1.5 rounded-full">
                    <Check className="h-4 w-4 flex-shrink-0" />
                  </div>
                  <p>{copySuccess.text}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {state.isLoading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-12"
              >
                <div className="relative w-16 h-16 mb-6">
                  <div className="absolute inset-0 rounded-full border-4 border-green-100"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-green-500 border-t-transparent animate-spin"></div>
                </div>
                <p className="text-gray-500">Loading your WhatsApp settings...</p>
              </motion.div>
            ) : state.isEditing ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="space-y-4 p-5 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100">
                  <div className="space-y-2">
                    <label htmlFor="whatapp-value" className="flex items-center text-sm font-medium text-gray-700">
                      <div className="bg-green-100 p-1.5 rounded-full mr-2">
                        <Phone className="h-4 w-4 text-green-600" />
                      </div>
                      WhatsApp Number
                    </label>
                    <Input
                      id="whatapp-value"
                      placeholder="Enter WhatsApp number (e.g., 977 9700447095)"
                      value={whatAppValue}
                      onChange={(e) => setWhatAppValue(e.target.value)}
                      className="border-0 bg-white/80 placeholder-gray-400 shadow-sm focus:ring-2 focus:ring-green-500 text-base py-5 rounded-xl"
                    />
                    <p className="text-xs text-gray-500 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1 text-amber-500" />
                      Include country code (977 for Nepal)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="phone-link" className="flex items-center text-sm font-medium text-gray-700">
                      <div className="bg-green-100 p-1.5 rounded-full mr-2">
                        <ExternalLink className="h-4 w-4 text-green-600" />
                      </div>
                      WhatsApp Link
                    </label>
                    <Input
                      id="phone-link"
                      placeholder="Enter WhatsApp link (e.g., https://bit.ly/3YHcfpl)"
                      value={phoneLinkValue}
                      onChange={(e) => setPhoneLinkValue(e.target.value)}
                      className="border-0 bg-white/80 placeholder-gray-400 shadow-sm focus:ring-2 focus:ring-green-500 text-base py-5 rounded-xl"
                    />
                    <p className="text-xs text-gray-500">Custom link or shortened URL for WhatsApp</p>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="message" className="flex items-center text-sm font-medium text-gray-700">
                      <div className="bg-green-100 p-1.5 rounded-full mr-2">
                        <MessageSquare className="h-4 w-4 text-green-600" />
                      </div>
                      Default Message (Optional)
                    </label>
                    <Textarea
                      id="message"
                      placeholder="Enter default message for WhatsApp"
                      value={messageValue}
                      onChange={(e) => setMessageValue(e.target.value)}
                      rows={3}
                      className="border-0 bg-white/80 placeholder-gray-400 shadow-sm focus:ring-2 focus:ring-green-500 resize-none rounded-xl"
                    />
                    <p className="text-xs text-gray-500">
                      This message will be pre-filled when users click the WhatsApp link
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                    className="border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl font-medium text-sm px-5 py-5 h-auto"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={isSubmitting || !whatAppValue.trim()}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl shadow-lg shadow-green-500/20 font-medium text-sm px-5 py-5 h-auto"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Contact
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            ) : !state.entry ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center py-10"
              >
                <div className="mb-8">
                  <svg
                    className="w-28 h-28 mx-auto mb-4 text-gray-300"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1"
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">No WhatsApp Contact Set Up</h3>
                  <p className="text-gray-500 mb-6 max-w-xs mx-auto">
                    Connect with your customers instantly via WhatsApp Business messaging.
                  </p>
                </div>

                <Button
                  onClick={handleCreate}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-full shadow-lg shadow-green-500/20 font-medium px-6 py-6 h-auto"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Set Up WhatsApp Contact
                </Button>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                {/* Contact Info Card */}
                <div className="bg-gradient-to-br from-white to-green-50 rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.05)] overflow-hidden">
                  {/* Top Banner */}
                  <div className="h-3 bg-gradient-to-r from-green-400 to-emerald-500"></div>

                  {/* Card Content */}
                  <div className="p-6">
                    <div className="space-y-5">
                      {/* Phone Number */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-500 flex items-center">
                            <Phone className="h-4 w-4 mr-1.5 text-green-500" />
                            WhatsApp Number
                          </span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(state.entry?.whatapp || "", "Number")}
                                  className="h-7 w-7 p-0 rounded-full hover:bg-green-50"
                                >
                                  <Copy className="h-3.5 w-3.5 text-gray-500" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="left">
                                <p>Copy number</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <div className="flex items-center">
                          <div className="bg-white shadow-sm text-green-700 font-mono text-lg px-4 py-2 rounded-lg border border-green-100">
                            {state.entry.whatapp}
                          </div>
                        </div>
                      </div>

                      {/* WhatsApp Link */}
                      {state.entry.phoneLink && (
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-500 flex items-center">
                              <ExternalLink className="h-4 w-4 mr-1.5 text-green-500" />
                              WhatsApp Link
                            </span>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyToClipboard(state.entry?.phoneLink || "", "Link")}
                                    className="h-7 w-7 p-0 rounded-full hover:bg-green-50"
                                  >
                                    <Copy className="h-3.5 w-3.5 text-gray-500" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="left">
                                  <p>Copy link</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <div className="bg-white shadow-sm border border-green-100 rounded-lg p-3">
                            <a
                              href={state.entry.phoneLink}
                              className="text-green-600 hover:text-green-700 hover:underline break-all flex items-center text-sm"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {state.entry.phoneLink}
                              <ExternalLink className="h-3 w-3 ml-1 flex-shrink-0" />
                            </a>
                          </div>
                        </div>
                      )}

                      {/* Default Message */}
                      {state.entry.message && (
                        <div>
                          <span className="text-sm font-medium text-gray-500 flex items-center mb-2">
                            <MessageSquare className="h-4 w-4 mr-1.5 text-green-500" />
                            Default Message
                          </span>
                          <div className="bg-white shadow-sm border border-green-100 rounded-lg p-4 text-gray-700 text-sm whitespace-pre-wrap">
                            {state.entry.message}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer with metadata */}
                  <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
                    <div className="w-full flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>Last updated: {formatDate(state.entry.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <a
                    href={state.entry.phoneLink || `https://wa.me/${state.entry.whatapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex text-gray-600 items-center justify-center bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-4 rounded-xl shadow-lg shadow-green-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/30 transform hover:-translate-y-0.5"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="h-5 w-5 mr-2"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"></path>
                      <path d="M12.04 2C6.52 2 2.04 6.48 2.04 12s4.48 10 10 10 10-4.48 10-10-4.48-10-10-10zm6.024 14.546c-.308.857-1.807 1.731-2.48 1.756-1.764.063-3.029-1.035-4.067-1.415-.866-.321-3.222-1.914-4.933-4.305-.988-1.438-1.845-3.68-1.241-5.005.304-.661 1.249-1.284 1.905-1.513.484-.17.959-.154 1.3.146.353.309 1.246 1.464 1.504 1.879.258.415.351.878.139 1.449-.212.57-.548.873-.825 1.242-.265.356-.334.6-.192.921.755 1.751 2.104 2.994 3.203 3.562.601.31 1.062.107 1.533-.243.532-.391 1.109-1.26 1.794-1.139.676.121 3.039 1.683 3.36 2.012.283.275.34 1.018.1 1.653z"></path>
                    </svg>
                    Contact via WhatsApp
                  </a>

                  <Button
                    variant="outline"
                    onClick={handleEdit}
                    className="border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl font-medium px-6 py-4 h-auto flex-1 sm:flex-none"
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit Contact
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
