// import { NextResponse } from "next/server"
// import { initializeApp } from "firebase/app"
// import { getFirestore, collection, addDoc, getDocs, query, where, orderBy, limit } from "firebase/firestore"
// import { getAuth } from "firebase/auth"

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
// const auth = getAuth(app)

// // POST - Save a new game result
// export async function POST(request: Request) {
//   try {
//     const data = await request.json()

//     // Validate input
//     if (!data.userId || !data.crashPoint) {
//       return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
//     }

//     // Add timestamp if not provided
//     if (!data.timestamp) {
//       data.timestamp = new Date()
//     }

//     // Add to Firebase
//     const resultsCollection = collection(db, "gameResults")
//     const docRef = await addDoc(resultsCollection, data)

//     return NextResponse.json({
//       id: docRef.id,
//       ...data,
//       success: true,
//       message: "Game result saved successfully",
//     })
//   } catch (error) {
//     console.error("Error saving game result:", error)
//     return NextResponse.json(
//       {
//         error: "Failed to save game result",
//         details: error instanceof Error ? error.message : String(error),
//       },
//       { status: 500 },
//     )
//   }
// }

// // GET - Fetch game results for a user
// export async function GET(request: Request) {
//   try {
//     const { searchParams } = new URL(request.url)
//     const userId = searchParams.get("userId")
//     const limitCount = Number.parseInt(searchParams.get("limit") || "10")

//     if (!userId) {
//       return NextResponse.json({ error: "User ID is required" }, { status: 400 })
//     }

//     // Query Firebase for user's game results
//     const resultsQuery = query(
//       collection(db, "gameResults"),
//       where("userId", "==", userId),
//       orderBy("timestamp", "desc"),
//       limit(limitCount),
//     )

//     const querySnapshot = await getDocs(resultsQuery)
//     const results = []

//     querySnapshot.forEach((doc) => {
//       const data = doc.data()
//       results.push({
//         id: doc.id,
//         ...data,
//         timestamp: data.timestamp.toDate().toISOString(),
//       })
//     })

//     return NextResponse.json({
//       results,
//       count: results.length,
//     })
//   } catch (error) {
//     console.error("Error fetching game results:", error)
//     return NextResponse.json(
//       {
//         error: "Failed to fetch game results",
//         details: error instanceof Error ? error.message : String(error),
//       },
//       { status: 500 },
//     )
//   }
// }



import { NextResponse } from "next/server"
import { db } from "@/components/firebase-config"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"

export async function POST(request: Request) {
  try {
    const data = await request.json()

    // Add server timestamp to the data
    const gameResultWithTimestamp = {
      ...data,
      createdAt: serverTimestamp(), // This adds a server-side timestamp
      clientTimestamp: new Date().toISOString(), // This adds a client-side timestamp as backup
    }

    // Add the document to Firestore
    const docRef = await addDoc(collection(db, "gameResults"), gameResultWithTimestamp)

    return NextResponse.json({
      success: true,
      id: docRef.id,
      message: "Game result saved successfully",
    })
  } catch (error) {
    console.error("Error saving game result:", error)
    return NextResponse.json({ success: false, message: "Failed to save game result" }, { status: 500 })
  }
}
