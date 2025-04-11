import { getFirestore, collection, addDoc, query, where, orderBy, getDocs, limit } from "firebase/firestore"
import { getApp } from "firebase/app"
import type { GameResult } from "@/components/types/game"

const db = getFirestore(getApp())

export async function saveGameResult(result: Omit<GameResult, "id" | "timestamp">) {
  try {
    const gameResult: Omit<GameResult, "id"> = {
      ...result,
      timestamp: new Date(),
    }

    const docRef = await addDoc(collection(db, "gameResults"), gameResult)
    return { id: docRef.id, ...gameResult }
  } catch (error) {
    console.error("Error saving game result:", error)
    throw error
  }
}

export async function getUserGameHistory(userId: string, limitCount = 10) {
  try {
    const q = query(
      collection(db, "gameResults"),
      where("userId", "==", userId),
      orderBy("timestamp", "desc"),
      limit(limitCount),
    )

    const querySnapshot = await getDocs(q)
    const results: GameResult[] = []

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      results.push({
        id: doc.id,
        userId: data.userId,
        crashPoint: data.crashPoint,
        winRate: data.winRate,
        expectedValue: data.expectedValue,
        betAmount: data.betAmount,
        timestamp: data.timestamp.toDate(),
        didWin: data.didWin,
        cashoutMultiplier: data.cashoutMultiplier,
        profit: data.profit,
      })
    })

    return results
  } catch (error) {
    console.error("Error fetching game history:", error)
    throw error
  }
}
