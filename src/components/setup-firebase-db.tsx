"use client"

import { useState } from "react"
import { db } from "./firebase-config"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function SetupFirebaseDB() {
    const [isLoading, setIsLoading] = useState(false)
    const [result, setResult] = useState<string | null>(null)

    // Function to generate a crash point based on the specified probabilities
    function generateCrashPoint() {
        const rand = Math.random() * 100

        if (rand < 75) {
            // 75% chance: 1.0x to 3.0x
            return 1.0 + Math.random() * 2.0
        } else if (rand < 95) {
            // 20% chance: 3.0x to 6.0x
            return 3.0 + Math.random() * 3.0
        } else if (rand < 99) {
            // 4% chance: 6.0x to 11.0x
            return 6.0 + Math.random() * 5.0
        } else {
            // 1% chance: 12.0x to 20.0x
            return 12.0 + Math.random() * 8.0
        }
    }

    // Function to create a new game in Firestore
    async function createGame() {
        setIsLoading(true)
        setResult(null)

        try {
            const crashPoint = generateCrashPoint()

            // Add a new document to the "games" collection
            const gamesRef = collection(db, "games")
            const newGame = {
                crashPoint: Number.parseFloat(crashPoint.toFixed(2)),
                timestamp: serverTimestamp(),
                status: "pending", // pending, active, completed
                startTime: null,
                endTime: null,
            }

            const docRef = await addDoc(gamesRef, newGame)
            setResult(`Successfully created game with ID: ${docRef.id} and crash point: ${crashPoint.toFixed(2)}x`)
        } catch (error) {
            console.error("Error creating game:", error)
            setResult(`Error creating game: ${error instanceof Error ? error.message : String(error)}`)
        } finally {
            setIsLoading(false)
        }
    }

    // Function to create multiple sample games
    async function createSampleGames(count: number) {
        setIsLoading(true)
        setResult(null)

        try {
            const gamesRef = collection(db, "games")
            const createdGames = []

            for (let i = 0; i < count; i++) {
                const crashPoint = generateCrashPoint()

                // Add a new document to the "games" collection
                const newGame = {
                    crashPoint: Number.parseFloat(crashPoint.toFixed(2)),
                    timestamp: serverTimestamp(),
                    status: "completed", // These are historical games
                    startTime: new Date(Date.now() - (i + 1) * 60000), // Staggered start times
                    endTime: new Date(Date.now() - (i + 1) * 60000 + 30000), // 30 seconds after start
                }

                const docRef = await addDoc(gamesRef, newGame)
                createdGames.push({
                    id: docRef.id,
                    crashPoint: crashPoint.toFixed(2),
                })
            }

            setResult(`Successfully created ${count} sample games`)
        } catch (error) {
            console.error("Error creating sample games:", error)
            setResult(`Error creating sample games: ${error instanceof Error ? error.message : String(error)}`)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle>Firebase Crash Game Setup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-col space-y-2">
                    <button
                        onClick={createGame}
                        disabled={isLoading}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded disabled:opacity-50"
                    >
                        {isLoading ? "Creating..." : "Create New Game"}
                    </button>

                    <button
                        onClick={() => createSampleGames(10)}
                        disabled={isLoading}
                        className="bg-white border border-gray-300 hover:bg-gray-100 text-gray-800 font-medium py-2 px-4 rounded disabled:opacity-50"
                    >
                        {isLoading ? "Creating..." : "Create 10 Sample Games"}
                    </button>
                </div>

                {result && <div className="p-3 bg-gray-100 rounded-md text-sm">{result}</div>}

            </CardContent>
        </Card>
    )
}

