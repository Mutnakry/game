// // import { NextResponse } from "next/server"
// // import { initializeApp } from "firebase/app"
// // import { getFirestore, collection, getDocs } from "firebase/firestore"

// // // Firebase configuration
// // const firebaseConfig = {
// //   apiKey: process.env.FIREBASE_API_KEY,
// //   authDomain: process.env.FIREBASE_AUTH_DOMAIN,
// //   projectId: process.env.FIREBASE_PROJECT_ID,
// //   storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
// //   messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
// //   appId: process.env.FIREBASE_APP_ID,
// // }

// // // Initialize Firebase
// // const app = initializeApp(firebaseConfig)
// // const db = getFirestore(app)

// // export async function GET() {
// //   try {
// //     // Get presets from Firestore
// //     const presetsCollection = collection(db, "gamePresets")
// //     const presetsSnapshot = await getDocs(presetsCollection)
// // console.log('presetsSnapshot',presetsSnapshot)
// //     // Transform Firestore documents to the format we need
// //     const presets = presetsSnapshot.docs.map((doc) => {
// //       const data = doc.data()
// //       return {
// //         value: data.value,
// //         label: data.label || data.value.toFixed(2), // Use value as label if not provided
// //       }
// //     })

// //     // Sort presets by value (optional)
// //     presets.sort((a, b) => a.value - b.value)

// //     // If no presets found, return default presets
// //     if (presets.length === 0) {
// //       return NextResponse.json([
// //         { value: 10.0, label: "10.00" },
// //         { value: 20.0, label: "20.00" },
// //         { value: 50.0, label: "50.00" },
// //         { value: 100.0, label: "100.00" },
// //       ])
// //     }

// //     return NextResponse.json(presets)
// //   } catch (error) {
// //     console.error("Error fetching game presets from Firebase:", error)

// //     // Return default presets if there's an error
// //     return NextResponse.json([
// //       { value: 10.0, label: "10.00" },
// //       { value: 20.0, label: "20.00" },
// //       { value: 50.0, label: "50.00" },
// //       { value: 100.0, label: "100.00" },
// //     ])
// //   }
// // }



// import { NextResponse } from "next/server"
// import { initializeApp } from "firebase/app"
// import { getFirestore, collection, getDocs } from "firebase/firestore"

// // Firebase configuration
// const firebaseConfig = {
//   apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
//   authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
//   projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
//   storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
//   messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
//   appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
// }

// // Initialize Firebase
// const app = initializeApp(firebaseConfig)
// const db = getFirestore(app)

// export async function GET() {
//   try {
//     console.log("Fetching game presets from Firebase...")

//     // Get presets from Firestore
//     const presetsCollection = collection(db, "gamePresets")
//     const presetsSnapshot = await getDocs(presetsCollection)

//     console.log(`Found ${presetsSnapshot.size} presets in Firebase`)

//     // Transform Firestore documents to the format we need
//     const presets = presetsSnapshot.docs.map((doc) => {
//       const data = doc.data()
//       console.log("Preset document data:", data)

//       return {
//         id: doc.id,
//         value: data.value,
//         label: data.label || (typeof data.value === "number" ? data.value.toFixed(2) : String(data.value)),
//       }
//     })

//     // Sort presets by value
//     presets.sort((a, b) => a.value - b.value)

//     console.log("Formatted presets:", presets)

//     // If no presets found, return default presets
//     if (presets.length === 0) {
//       console.log("No presets found, returning defaults")
//       return NextResponse.json([
//         { value: 10.0, label: "10.00" },
//         { value: 20.0, label: "20.00" },
//         { value: 50.0, label: "50.00" },
//         { value: 100.0, label: "100.00" },
//       ])
//     }

//     return NextResponse.json(presets)
//   } catch (error) {
//     console.error("Error fetching game presets from Firebase:", error)

//     // Return default presets if there's an error
//     return NextResponse.json([
//       { value: 10.0, label: "10.00" },
//       { value: 20.0, label: "20.00" },
//       { value: 50.0, label: "50.00" },
//       { value: 100.0, label: "100.00" },
//     ])
//   }
// }


import { NextResponse } from "next/server"
import { initializeApp } from "firebase/app"
import { getFirestore, collection, getDocs, addDoc, doc, updateDoc, deleteDoc, getDoc } from "firebase/firestore"

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

// GET - Fetch all presets
export async function GET() {
  try {
    console.log("Fetching game presets from Firebase...")

    // Default presets in case of error or empty collection
    const defaultPresets = [
      { value: 10.0, label: "10.00" },
      { value: 20.0, label: "20.00" },
      { value: 50.0, label: "50.00" },
      { value: 100.0, label: "100.00" },
    ]

    // Get presets from Firebase
    const presetsCollection = collection(db, "gamePresets")
    const querySnapshot = await getDocs(presetsCollection)

    console.log(`Found ${querySnapshot.size} presets in Firebase`)

    // If no presets found, return defaults
    if (querySnapshot.empty) {
      console.log("No presets found, returning defaults")
      return NextResponse.json(defaultPresets)
    }

    // Map Firebase documents to preset objects
    const presets = querySnapshot.docs.map((doc) => {
      const data = doc.data()
      console.log("Preset document data:", data)

      return {
        id: doc.id,
        value: data.value,
        label: data.label || (typeof data.value === "number" ? data.value.toFixed(2) : String(data.value)),
      }
    })

    // Sort presets by value
    presets.sort((a, b) => a.value - b.value)

    console.log("Returning presets:", presets)
    return NextResponse.json(presets)
  } catch (error) {
    console.error("Error fetching game presets:", error)

    // Return default presets if there's an error
    return NextResponse.json([
      { value: 10.0, label: "10.00" },
      { value: 20.0, label: "20.00" },
      { value: 50.0, label: "50.00" },
      { value: 100.0, label: "100.00" },
    ])
  }
}

// POST - Add a new preset
export async function POST(request: Request) {
  try {
    const data = await request.json()

    // Validate input
    if (!data.value || typeof data.value !== "number") {
      return NextResponse.json({ error: "Invalid preset value" }, { status: 400 })
    }

    // Ensure label exists
    const presetToAdd = {
      value: data.value,
      label: data.label || data.value.toFixed(2),
      createdAt: new Date(),
    }

    // Add to Firebase
    const presetsCollection = collection(db, "gamePresets")
    const docRef = await addDoc(presetsCollection, presetToAdd)

    return NextResponse.json({
      id: docRef.id,
      ...presetToAdd,
      success: true,
      message: "Preset added successfully",
    })
  } catch (error) {
    console.error("Error adding preset:", error)
    return NextResponse.json(
      {
        error: "Failed to add preset",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

// PUT - Update an existing preset
export async function PUT(request: Request) {
  try {
    const data = await request.json()

    // Validate input
    if (!data.id) {
      return NextResponse.json({ error: "Preset ID is required" }, { status: 400 })
    }

    if (!data.value || typeof data.value !== "number") {
      return NextResponse.json({ error: "Invalid preset value" }, { status: 400 })
    }

    // Ensure the preset exists
    const presetRef = doc(db, "gamePresets", data.id)
    const presetSnap = await getDoc(presetRef)

    if (!presetSnap.exists()) {
      return NextResponse.json({ error: "Preset not found" }, { status: 404 })
    }

    // Update the preset
    const presetToUpdate = {
      value: data.value,
      label: data.label || data.value.toFixed(2),
      updatedAt: new Date(),
    }

    await updateDoc(presetRef, presetToUpdate)

    return NextResponse.json({
      id: data.id,
      ...presetToUpdate,
      success: true,
      message: "Preset updated successfully",
    })
  } catch (error) {
    console.error("Error updating preset:", error)
    return NextResponse.json(
      {
        error: "Failed to update preset",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

// DELETE - Remove a preset
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Preset ID is required" }, { status: 400 })
    }

    // Ensure the preset exists
    const presetRef = doc(db, "gamePresets", id)
    const presetSnap = await getDoc(presetRef)

    if (!presetSnap.exists()) {
      return NextResponse.json({ error: "Preset not found" }, { status: 404 })
    }

    // Delete the preset
    await deleteDoc(presetRef)

    return NextResponse.json({
      success: true,
      message: "Preset deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting preset:", error)
    return NextResponse.json(
      {
        error: "Failed to delete preset",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
