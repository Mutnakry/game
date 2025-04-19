// hooks/useAutoLogout.ts
import { useRouter } from "next/navigation"
import { useEffect } from "react"

const SESSION_TIMEOUT_MS = 60 * 60 * 1000 // 1 hour

const useAutoLogout = () => {
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("token")
    const loginTimeStr = localStorage.getItem("loginTime")

    if (token && loginTimeStr) {
      const loginTime = parseInt(loginTimeStr, 10)
      const now = Date.now()

      if (now - loginTime > SESSION_TIMEOUT_MS) {
        // Session expired
        localStorage.removeItem("token")
        localStorage.removeItem("loginTime")
        router.replace("/login")
      } else {
        // Set a timeout to auto-logout at expiration
        const timeLeft = SESSION_TIMEOUT_MS - (now - loginTime)
        const timeout = setTimeout(() => {
          localStorage.removeItem("token")
          localStorage.removeItem("loginTime")
          router.replace("/login")
        }, timeLeft)

        return () => clearTimeout(timeout)
      }
    } else {
      // No session data
      router.replace("/login")
    }
  }, [router])
}

export default useAutoLogout
