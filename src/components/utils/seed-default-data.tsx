"use client"

import { useState } from "react"
import { initializeApp } from "firebase/app"
import { getFirestore, collection, addDoc, getDocs, deleteDoc, query } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
// import { Loader2 } from "lucide-react"

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

// Default crash multiplier data
const defaultCrashData = [
  { min: 1.01, max: 3.0, probability: 75 },
  { min: 3.01, max: 6.0, probability: 20 },
  { min: 6.01, max: 11.0, probability: 4 },
  { min: 11.01, max: 100.0, probability: 1 },
]

// Default bet presets
const defaultPresets = [{ value: 10.0 }, { value: 20.0 }, { value: 50.0 }, { value: 100.0 }]

export default function SeedDefaultData() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const seedCrashMultipliers = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      // First, clear existing data
      const existingDocs = await getDocs(query(collection(db, "crashMultipliers")))
      const deletePromises = existingDocs.docs.map((doc) => deleteDoc(doc.ref))
      await Promise.all(deletePromises)

      // Then add default data
      const addPromises = defaultCrashData.map((data) =>
        addDoc(collection(db, "crashMultipliers"), {
          ...data,
          createdAt: new Date(),
        }),
      )

      await Promise.all(addPromises)
      setResult({
        success: true,
        message: `Successfully added ${defaultCrashData.length} default crash multiplier ranges.`,
      })
    } catch (error) {
      console.error("Error seeding crash multipliers:", error)
      setResult({
        success: false,
        message: `Error seeding data: ${error instanceof Error ? error.message : String(error)}`,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const seedGamePresets = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      // First, clear existing data
      const existingDocs = await getDocs(query(collection(db, "gamePresets")))
      const deletePromises = existingDocs.docs.map((doc) => deleteDoc(doc.ref))
      await Promise.all(deletePromises)

      // Then add default data
      const addPromises = defaultPresets.map((data) =>
        addDoc(collection(db, "gamePresets"), {
          ...data,
          createdAt: new Date(),
        }),
      )

      await Promise.all(addPromises)
      setResult({
        success: true,
        message: `Successfully added ${defaultPresets.length} default bet presets.`,
      })
    } catch (error) {
      console.error("Error seeding game presets:", error)
      setResult({
        success: false,
        message: `Error seeding data: ${error instanceof Error ? error.message : String(error)}`,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const seedAllData = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      await seedCrashMultipliers()
      await seedGamePresets()
      setResult({
        success: true,
        message: "Successfully seeded all default data.",
      })
    } catch (error) {
      console.error("Error seeding all data:", error)
      setResult({
        success: false,
        message: `Error seeding data: ${error instanceof Error ? error.message : String(error)}`,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Seed Default Game Data</CardTitle>
        <CardDescription>
          Initialize your database with default crash multiplier ranges and bet presets.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {result && (
          <Alert variant={result.success ? "default" : "destructive"}>
            <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
            <AlertDescription>{result.message}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 gap-4">
          <div className="border p-4 rounded-md">
            <h3 className="font-medium mb-2">Default Crash Multipliers</h3>
            <ul className="text-sm space-y-1">
              {defaultCrashData.map((item, index) => (
                <li key={index}>
                  {item.min.toFixed(2)} - {item.max.toFixed(2)}: {item.probability}%
                </li>
              ))}
            </ul>
          </div>

          <div className="border p-4 rounded-md">
            <h3 className="font-medium mb-2">Default Bet Presets</h3>
            <ul className="text-sm space-y-1">
              {defaultPresets.map((item, index) => (
                <li key={index}>{item.value.toFixed(2)}</li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <div className="grid grid-cols-2 gap-2 w-full">
          <Button onClick={seedCrashMultipliers} disabled={isLoading} variant="outline">
            {/* {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} */}
            Seed Multipliers
          </Button>
          <Button onClick={seedGamePresets} disabled={isLoading} variant="outline">
            {/* {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} */}
            Seed Presets
          </Button>
        </div>
        <Button onClick={seedAllData} disabled={isLoading} className="w-full">
          {/* {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} */}
          Seed All Default Data
        </Button>
      </CardFooter>
    </Card>
  )
}
