

"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"

export default function AdminLogin() {
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [attempts, setAttempts] = useState(0)
    const router = useRouter()

    useEffect(() => {
        const locked = localStorage.getItem("adminLocked")
        const loggedIn = localStorage.getItem("token")

        if (locked === "true") {
            setError("Access denied. You have been locked out.")
        }

        if (loggedIn) {
            router.push("/backend")
        }
    }, [])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        // if (localStorage.getItem("adminLocked") === "true") {
        //     setError("Access denied. You are permanently locked.")
        //     return
        // }

        if (password === "admin123") {
            setError("")
            localStorage.setItem("token", "admin-auth-token")
            router.push("/backend")
        } else {
            const currentAttempts = attempts + 1
            setAttempts(currentAttempts)
            setError("Invalid password.")

            if (currentAttempts >= 3) {
                localStorage.setItem("adminLocked", "true")
                setError("Too many attempts. You are now locked out permanently.")
            }
        }
    }

    return (
        <div className="w-full max-w-md rounded-lg bg-gray-700 bg-opacity-80 p-8 shadow-lg">
            <h1 className="mb-6 text-center text-2xl text-white font-bold">Admin Login</h1>
            <form onSubmit={handleSubmit}>
                <div className="mb-6">
                    <label htmlFor="password" className="mb-2 text-white block text-sm font-medium">
                        Password
                    </label>
                    <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full border-b bg-slate-200 border-gray-300 pb-2 focus:border-green-500 focus:outline-none"
                        required
                    />
                    {error && <p className="mt-2 text-red-400 text-sm">{error}</p>}
                </div>
                <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                    Login
                </Button>
            </form>
        </div>
    )
}
