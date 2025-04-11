
// import { initializeApp } from "firebase/app"
// import { getFirestore, collection, getDocs } from "firebase/firestore"

// // Firebase configuration - use environment variables with NEXT_PUBLIC prefix for client-side
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

// export async function fetchPresetsFromFirebase() {
//   try {
//     // Get presets from Firestore
//     const presetsCollection = collection(db, "presets")
//     const presetsSnapshot = await getDocs(presetsCollection)

//     // Transform Firestore documents to the format we need
//     const presets = presetsSnapshot.docs.map((doc) => {
//       const data = doc.data()
//       return {
//         value: data.value,
//         label: data.label || data.value.toFixed(2), // Use value as label if not provided
//       }
//     })

//     // Sort presets by value (optional)
//     presets.sort((a, b) => a.value - b.value)

//     // If no presets found, return default presets
//     if (presets.length === 0) {
//       return [
//         { value: 101111.0, label: "1222220.00" },
//         { value: 20.0, label: "20.00" },
//         { value: 50.0, label: "50.00" },
//         { value: 100.0, label: "100.00" },
//       ]
//     }

//     return presets
//   } catch (error) {
//     console.error("Error fetching game presets from Firebase:", error)

//     // Return default presets if there's an error
//     return [
//       { value: 10.0, label: "10.00" },
//       { value: 20.0, label: "20.00" },
//       { value: 50.0, label: "50.00" },
//       { value: 100.0, label: "100.00" },
//     ]
//   }
// }
