"use client"

import AdminLogin from "@/components/auth/admin-login"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function AdminPage() {
  const router = useRouter()

  // useEffect(() => {
  //   const token = localStorage.getItem("token")
  //   const locked = localStorage.getItem("adminLocked")

  //   if (locked === "true") {
  //     // Optional: redirect away from login page if fully locked
  //     alert("Access blocked. You are permanently locked.")
  //     router.replace("/admin") // or show a message
  //   }

  //   if (token) {
  //     router.replace("/backend")
  //   }
  // }, [])

  // useEffect(() => {
  //   const token = localStorage.getItem("token")
  //   if (!token) {
  //     router.replace("/admin")
  //   }
  // }, [])

  return (
    <main className="flex min-h-screen items-center justify-center bg-black">
      <AdminLogin />
    </main>
  )
}
