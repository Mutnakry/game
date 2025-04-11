import { NextResponse } from "next/server"
import { initializeApp } from "firebase/app"
import { getFirestore, collection, getDocs, query, orderBy } from "firebase/firestore"

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

export async function GET() {
  try {
    // Get multiplier ranges from Firebase
    const multiplierQuery = query(collection(db, "crashMultipliers"), orderBy("min", "asc"))
    const querySnapshot = await getDocs(multiplierQuery)
    // If no multipliers found, return default algorithm
    if (querySnapshot.empty) {
      return NextResponse.json({
        status: "success",
        message: "Using default algorithm",
        useDefault: true,
      })
    }

    // Map Firebase documents to multiplier objects
    const multipliers = querySnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        min: data.min,
        max: data.max,
        probability: data.probability,
      }
    })

    return NextResponse.json({
      status: "success",
      multipliers,
      useDefault: false,
    })
  } catch (error) {
    console.error("Error fetching crash multipliers:", error)
    return NextResponse.json({
      status: "error",
      message: "Error fetching multipliers, using default algorithm",
      useDefault: true,
    })
  }
}
