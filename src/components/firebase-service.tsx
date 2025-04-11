import { collection, getDocs, query, orderBy, limit, doc, getDoc, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "./firebase-config"

// Function to fetch the latest crash point from Firestore
export async function fetchLatestCrashPoint() {
  try {
    // Try to get the latest game from the games collection
    const gamesRef = collection(db, "games")
    const q = query(gamesRef, orderBy("timestamp", "desc"), limit(1))
    const querySnapshot = await getDocs(q)

    if (!querySnapshot.empty) {
      const gameData = querySnapshot.docs[0].data()
      return {
        id: querySnapshot.docs[0].id,
        crashPoint: gameData.crashPoint,
        timestamp: gameData.timestamp,
      }
    }

    // Try to get from a specific document (e.g., current game)
    const currentGameRef = doc(db, "games", "current")
    const currentGameSnap = await getDoc(currentGameRef)

    if (currentGameSnap.exists()) {
      const gameData = currentGameSnap.data()
      return {
        id: "current",
        crashPoint: gameData.crashPoint,
        timestamp: gameData.timestamp,
      }
    }

    // If no data is found, return null
    return null
  } catch (error) {
    console.error("Error fetching crash point:", error)
    throw error
  }
}

// Function to add a new game to Firestore
export async function addNewGame(crashPoint: number) {
  try {
    const gamesRef = collection(db, "games")
    const newGame = {
      crashPoint,
      timestamp: serverTimestamp(),
    }

    const docRef = await addDoc(gamesRef, newGame)
    return docRef.id
  } catch (error) {
    console.error("Error adding new game:", error)
    throw error
  }
}

// Function to record a bet in Firestore
export async function recordBet(gameId: string, userId: string, amount: number, cashoutMultiplier: number | null) {
  try {
    const betsRef = collection(db, `games/${gameId}/bets`)
    const bet = {
      userId,
      amount,
      cashoutMultiplier,
      timestamp: serverTimestamp(),
    }

    const docRef = await addDoc(betsRef, bet)
    return docRef.id
  } catch (error) {
    console.error("Error recording bet:", error)
    throw error
  }
}

