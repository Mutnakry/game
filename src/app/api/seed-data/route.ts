import { NextResponse } from "next/server"
import { initializeApp } from "firebase/app"
import { getFirestore, collection, addDoc, getDocs, deleteDoc, query } from "firebase/firestore"

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

export async function POST(request: Request) {
  try {
    const { seedType } = await request.json()

    if (seedType === "multipliers" || seedType === "all") {
      // Clear existing multipliers
      const existingMultipliers = await getDocs(query(collection(db, "crashMultipliers")))
      const deleteMultiplierPromises = existingMultipliers.docs.map((doc) => deleteDoc(doc.ref))
      await Promise.all(deleteMultiplierPromises)

      // Add default multipliers
      const addMultiplierPromises = defaultCrashData.map((data) =>
        addDoc(collection(db, "crashMultipliers"), {
          ...data,
          createdAt: new Date(),
        }),
      )
      await Promise.all(addMultiplierPromises)
    }

    if (seedType === "presets" || seedType === "all") {
      // Clear existing presets
      const existingPresets = await getDocs(query(collection(db, "gamePresets")))
      const deletePresetPromises = existingPresets.docs.map((doc) => deleteDoc(doc.ref))
      await Promise.all(deletePresetPromises)

      // Add default presets
      const addPresetPromises = defaultPresets.map((data) =>
        addDoc(collection(db, "gamePresets"), {
          ...data,
          createdAt: new Date(),
        }),
      )
      await Promise.all(addPresetPromises)
    }

    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${seedType} data.`,
    })
  } catch (error) {
    console.error("Error seeding data:", error)
    return NextResponse.json(
      {
        success: false,
        message: `Error seeding data: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 },
    )
  }
}
