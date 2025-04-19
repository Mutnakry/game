"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { doc, setDoc, getDoc } from "firebase/firestore"
import { db } from "@/components/firebase-config"
import { Loader2, Phone, MessageSquare, ExternalLink, Copy, Check } from "lucide-react"

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
  const [copySuccess, setCopySuccess] = useState<string | null>(null)

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
      await setDoc(doc(db, "what-app", SINGLE_WHAT_APP_ID), {
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
        setCopySuccess(`${type} copied!`)
        setTimeout(() => setCopySuccess(null), 2000)
      },
      () => {
        setCopySuccess("Failed to copy")
        setTimeout(() => setCopySuccess(null), 2000)
      },
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-gray-600">WhatsApp Customer Service</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">{error}</div>
        )}

        {copySuccess && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-600 text-sm flex items-center">
            <Check className="h-4 w-4 mr-2" />
            {copySuccess}
          </div>
        )}

        {state.isLoading ? (
          <div className="flex justify-center items-center h-24">
            <Loader2 className="h-6 w-6 text-gray-600 animate-spin" />
          </div>
        ) : state.isEditing ? (
          <div className="space-y-4">
            <div className="space-y-2 text-gray-600">
              <label htmlFor="whatapp-value" className="flex items-center text-sm font-medium">
                <Phone className="h-4 w-4 mr-2" />
                WhatsApp Number
              </label>
              <Input
                id="whatapp-value"
                placeholder="Enter WhatsApp number (e.g., 977 9700447095)"
                value={whatAppValue}
                onChange={(e) => setWhatAppValue(e.target.value)}
              />
              <p className="text-xs text-gray-500">Include country code (977 for Nepal)</p>
            </div>

            <div className="space-y-2 text-gray-600">
              <label htmlFor="phone-link" className="flex items-center text-sm font-medium">
                <ExternalLink className="h-4 w-4 mr-2" />
                WhatsApp Link
              </label>
              <Input
                id="phone-link"
                placeholder="Enter WhatsApp link (e.g., https://bit.ly/3YHcfpl)"
                value={phoneLinkValue}
                onChange={(e) => setPhoneLinkValue(e.target.value)}
              />
              <p className="text-xs text-gray-500">Custom link or shortened URL for WhatsApp</p>
            </div>

            <div className="space-y-2 text-gray-600">
              <label htmlFor="message" className="flex items-center text-sm font-medium">
                <MessageSquare className="h-4 w-4 mr-2" />
                Default Message (Optional)
              </label>
              <Textarea
                id="message"
                placeholder="Enter default message for WhatsApp"
                value={messageValue}
                onChange={(e) => setMessageValue(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-gray-500">
                This message will be pre-filled when users click the WhatsApp link
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSubmitting || !whatAppValue.trim()}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </div>
        ) : !state.entry ? (
          <div className="text-center py-6">
            <p className="text-muted-foreground text-gray-600 mb-4">No WhatsApp contact configured yet.</p>
            <Button onClick={handleCreate}>Create WhatsApp Contact</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="border rounded-md p-4 bg-gray-50">
              <div className="flex justify-between items-start">
                <div className="space-y-4 w-full">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="block text-sm font-medium text-gray-500">WhatsApp Number</span>
                      <span className="text-lg font-semibold text-gray-700">{state.entry.whatapp}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(state.entry?.whatapp || "", "Number")}
                      className="h-8 w-8 p-0"
                    >
                      <Copy className="h-4 w-4" />
                      <span className="sr-only">Copy number</span>
                    </Button>
                  </div>

                  {state.entry.phoneLink && (
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="block text-sm font-medium text-gray-500">WhatsApp Link</span>
                        <a
                          href={state.entry.phoneLink}
                          className="text-blue-600 hover:underline break-all flex items-center"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {state.entry.phoneLink}
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(state.entry?.phoneLink || "", "Link")}

                        className="h-8 w-8 p-0"
                      >
                        <Copy className="h-4 w-4" />
                        <span className="sr-only">Copy link</span>
                      </Button>
                    </div>
                  )}

                  {state.entry.message && (
                    <div>
                      <span className="block text-sm font-medium text-gray-500">Default Message</span>
                      <p className="text-gray-700 whitespace-pre-wrap">{state.entry.message}</p>
                    </div>
                  )}

                  <div className="pt-3 border-t border-gray-200">
                    <a
                      href={state.entry.phoneLink || `https://wa.me/${state.entry.whatapp.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Contact via WhatsApp
                    </a>
                  </div>

                  <div className="mt-2 space-y-1 text-xs text-gray-500">
                    {state.entry.createdAt && (
                      <span className="block">Created: {new Date(state.entry.createdAt).toLocaleString()}</span>
                    )}
                    {state.entry.updatedAt && (
                      <span className="block">Updated: {new Date(state.entry.updatedAt).toLocaleString()}</span>
                    )}
                  </div>
                </div>

                <Button variant="outline" onClick={handleEdit} className="ml-4 shrink-0">
                  Edit
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
