
"use client"

import { useState } from "react"
import { collection, getDocs, query, orderBy, limit, addDoc, serverTimestamp, where } from "firebase/firestore"
import { db } from "@/components/auth/auth-context"
import { useAuth } from "@/components/auth/auth-context"

export function useFirebaseGame() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  // Function to save game result to Firebase
  const saveGameResult = async (gameData: any) => {
    setIsLoading(true)
    setError(null)

    try {
      // Add server timestamp and user ID to the data
      const gameResultWithTimestamp = {
        ...gameData,
        userId: user?.uid || "anonymous", // Store user ID if logged in
        userEmail: user?.email || "anonymous", // Store user email if logged in
        displayName: user?.displayName || "Anonymous Player", // Store display name if available
        createdAt: serverTimestamp(), // This adds a server-side timestamp
        clientTimestamp: new Date().toISOString(), // This adds a client-side timestamp as backup
      }

      // Add the document directly to Firestore
      const docRef = await addDoc(collection(db, "gameResults"), gameResultWithTimestamp)

      return { success: true, id: docRef.id }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred")
      console.error("Error saving game result:", err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // Function to get recent game results
  const getRecentResults = async (resultsLimit = 10, userOnly = false) => {
    setIsLoading(true)
    setError(null)

    try {
      let q

      if (userOnly && user?.uid) {
        // Get only the current user's results
        q = query(
          collection(db, "gameResults"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc"),
          limit(resultsLimit),
        )
      } else {
        // Get all results
        q = query(collection(db, "gameResults"), orderBy("createdAt", "desc"), limit(resultsLimit))
      }

      const querySnapshot = await getDocs(q)
      const results = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        // Convert Firestore timestamp to JS Date for easier handling
        createdAt: doc.data().createdAt?.toDate() || null,
      }))

      return results
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred")
      console.error("Error fetching game results:", err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // Function to get user statistics
  const getUserStats = async () => {
    if (!user?.uid) {
      return {
        totalGames: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        totalProfit: 0,
        averageProfit: 0,
      }
    }

    setIsLoading(true)
    setError(null)

    try {
      const q = query(collection(db, "gameResults"), where("userId", "==", user.uid))

      const querySnapshot = await getDocs(q)
      const results = querySnapshot.docs.map((doc) => doc.data())

      const totalGames = results.length
      const wins = results.filter((game) => game.isWin).length
      const losses = totalGames - wins
      const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0

      const totalProfit = results.reduce((sum, game) => sum + (game.profit || 0), 0)
      const averageProfit = totalGames > 0 ? totalProfit / totalGames : 0

      return {
        totalGames,
        wins,
        losses,
        winRate,
        totalProfit,
        averageProfit,
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred")
      console.error("Error fetching user stats:", err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return {
    saveGameResult,
    getRecentResults,
    getUserStats,
    isLoading,
    error,
  }
}
