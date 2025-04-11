"use client"

import { useAuth } from "./auth-context"
import { Button } from "@/components/ui/button"
import { FaUser, FaSignOutAlt } from "react-icons/fa"

export default function UserProfile() {
  const { user, signOut } = useAuth()

  if (!user) {
    return null
  }

  return (
    <div className="flex items-center space-x-2">
      <div className="bg-gray-800 text-white p-2 rounded-full">
        <FaUser />
      </div>
      <div className="text-sm">
        <div className="font-medium">{user.email}</div>
      </div>
      <Button variant="ghost" size="sm" onClick={signOut}>
        <FaSignOutAlt className="mr-1" />
        Sign Out
      </Button>
    </div>
  )
}
