// This is a Node.js script to seed your Firebase database with default data
// Run it with: node scripts/seed-firebase.js

const { initializeApp } = require("firebase/app")
const { getFirestore, collection, addDoc, getDocs, deleteDoc, query } = require("firebase/firestore")
require("dotenv").config()

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

async function seedData() {
  try {
    console.log("Starting to seed data...")

    // Seed crash multipliers
    console.log("Clearing existing crash multipliers...")
    const existingMultipliers = await getDocs(query(collection(db, "crashMultipliers")))
    const deleteMultiplierPromises = existingMultipliers.docs.map((doc) => deleteDoc(doc.ref))
    await Promise.all(deleteMultiplierPromises)
    console.log(`Deleted ${existingMultipliers.docs.length} existing crash multipliers.`)

    console.log("Adding default crash multipliers...")
    const addMultiplierPromises = defaultCrashData.map((data) =>
      addDoc(collection(db, "crashMultipliers"), {
        ...data,
        createdAt: new Date(),
      }),
    )
    await Promise.all(addMultiplierPromises)
    console.log(`Added ${defaultCrashData.length} default crash multipliers.`)

    // Seed game presets
    console.log("Clearing existing game presets...")
    const existingPresets = await getDocs(query(collection(db, "gamePresets")))
    const deletePresetPromises = existingPresets.docs.map((doc) => deleteDoc(doc.ref))
    await Promise.all(deletePresetPromises)
    console.log(`Deleted ${existingPresets.docs.length} existing game presets.`)

    console.log("Adding default game presets...")
    const addPresetPromises = defaultPresets.map((data) =>
      addDoc(collection(db, "gamePresets"), {
        ...data,
        createdAt: new Date(),
      }),
    )
    await Promise.all(addPresetPromises)
    console.log(`Added ${defaultPresets.length} default game presets.`)

    console.log("Data seeding completed successfully!")
    process.exit(0)
  } catch (error) {
    console.error("Error seeding data:", error)
    process.exit(1)
  }
}

// Run the seed function
seedData()
