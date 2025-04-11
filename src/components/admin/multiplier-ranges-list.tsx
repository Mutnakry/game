"use client"

import { useState, useEffect } from "react"
import { getFirestore, collection, getDocs, query, orderBy, deleteDoc, doc } from "firebase/firestore"
import { getApp } from "firebase/app"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
// import { Trash } from "lucide-react"

type MultiplierRange = {
  id: string
  min: number
  max: number
  probability: number
  createdAt?: Date
}

export default function MultiplierRangesList() {
  const [multipliers, setMultipliers] = useState<MultiplierRange[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [totalProbability, setTotalProbability] = useState(0)

  useEffect(() => {
    fetchMultipliers()
  }, [])

  const fetchMultipliers = async () => {
    setIsLoading(true)
    try {
      const app = getApp()
      const db = getFirestore(app)

      const multiplierQuery = query(collection(db, "crashMultipliers"), orderBy("min", "asc"))
      const querySnapshot = await getDocs(multiplierQuery)

      const multiplierData: MultiplierRange[] = []
      let probabilitySum = 0

      querySnapshot.forEach((doc) => {
        const data = doc.data() as Omit<MultiplierRange, "id">
        multiplierData.push({
          id: doc.id,
          min: data.min,
          max: data.max,
          probability: data.probability,
        //   createdAt: data.createdAt ? new Date(data.createdAt.toDate()) : undefined,
        })
        probabilitySum += data.probability
      })

      setMultipliers(multiplierData)
      setTotalProbability(probabilitySum)
    } catch (error) {
      console.error("Error fetching multipliers:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const deleteMultiplier = async (id: string) => {
    if (confirm("Are you sure you want to delete this multiplier range?")) {
      try {
        const app = getApp()
        const db = getFirestore(app)

        await deleteDoc(doc(db, "crashMultipliers", id))

        // Refresh the list
        fetchMultipliers()
      } catch (error) {
        console.error("Error deleting multiplier:", error)
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center bg-slate-400">
          <span>Crash Multiplier Ranges</span>
          <Button onClick={fetchMultipliers} variant="outline" size="sm">
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4">Loading multiplier ranges...</div>
        ) : multipliers.length === 0 ? (
          <div className="text-center py-4">No multiplier ranges found. Add some to customize crash points.</div>
        ) : (
          <>
            <div
              className={`mb-4 p-2 rounded ${totalProbability === 100 ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}
            >
              Total Probability: {totalProbability}% {totalProbability !== 100 && "(Should equal 100%)"}
            </div>
            <Table>
              <TableHeader>
                <TableRow  className="text-gray-700 ">
                  <TableHead>Min</TableHead>
                  <TableHead>Max</TableHead>
                  <TableHead>Probability %</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {multipliers.map((multiplier) => (
                  <TableRow key={multiplier.id}>
                    <TableCell>{multiplier.min.toFixed(2)}</TableCell>
                    <TableCell>{multiplier.max.toFixed(2)}</TableCell>
                    <TableCell>{multiplier.probability}%</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMultiplier(multiplier.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                         delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </CardContent>
    </Card>
  )
}
