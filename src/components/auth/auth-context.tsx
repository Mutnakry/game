// "use client"

// import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
// import {
//   getAuth,
//   onAuthStateChanged,
//   signInWithEmailAndPassword,
//   createUserWithEmailAndPassword,
//   signOut as firebaseSignOut,
//   type User,
// } from "firebase/auth"
// import { initializeApp } from "firebase/app"

// // Firebase configuration
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
// const auth = getAuth(app)

// type AuthContextType = {
//   user: User | null
//   loading: boolean
//   signIn: (email: string, password: string) => Promise<void>
//   signUp: (email: string, password: string) => Promise<void>
//   signOut: () => Promise<void>
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined)

// export function AuthProvider({ children }: { children: ReactNode }) {
//   const [user, setUser] = useState<User | null>(null)
//   const [loading, setLoading] = useState(true)

//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, (user) => {
//       setUser(user)
//       setLoading(false)
//     })

//     return () => unsubscribe()
//   }, [])

//   const signIn = async (email: string, password: string) => {
//     try {
//       await signInWithEmailAndPassword(auth, email, password)
//     } catch (error) {
//       console.error("Error signing in:", error)
//       throw error
//     }
//   }

//   const signUp = async (email: string, password: string) => {
//     try {
//       await createUserWithEmailAndPassword(auth, email, password)
//     } catch (error) {
//       console.error("Error signing up:", error)
//       throw error
//     }
//   }

//   const signOut = async () => {
//     try {
//       await firebaseSignOut(auth)
//     } catch (error) {
//       console.error("Error signing out:", error)
//       throw error
//     }
//   }

//   return <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>{children}</AuthContext.Provider>
// }

// export function useAuth() {
//   const context = useContext(AuthContext)
//   if (context === undefined) {
//     throw new Error(
//       "useAuth hook must be used within an AuthProvider component. Make sure your component is wrapped with <AuthProvider> or use the AuthWrapper component.",
//     )
//   }
//   return context
// }



"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth"
import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)

type AuthContextType = {
  user: User | null
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, displayName?: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      if (authUser) {
        setUser(authUser)
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    // Cleanup subscription
    return () => unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    setError(null)
    try {
      setLoading(true)
      await signInWithEmailAndPassword(auth, email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in")
      throw err
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, displayName?: string) => {
    setError(null)
    try {
      setLoading(true)
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)

      // Update profile with display name if provided
      if (displayName && userCredential.user) {
        await updateProfile(userCredential.user, { displayName })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create account")
      throw err
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setError(null)
    try {
      setLoading(true)
      await firebaseSignOut(auth)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign out")
      throw err
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    setError(null)
    try {
      setLoading(true)
      await sendPasswordResetEmail(auth, email)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send password reset email")
      throw err
    } finally {
      setLoading(false)
    }
  }

  const value = {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
