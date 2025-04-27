"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { FaUser, FaRegEyeSlash, FaRegEye, FaWhatsapp } from "react-icons/fa"
import { PiLockKey } from "react-icons/pi"

// Firebase imports
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth"
import { doc, setDoc, collection, query, where, getDocs } from "firebase/firestore"

// Components
import UopupRegisterSuccess from "@/components/UopupRegisterSuccess"
import AccountInactiveLogin from "@/components/AccountInactiveLogin"

// Import Firebase config
import { app, auth, db } from "../firebase-config"

// Hooks
import { useToast } from "@/hooks/use-toast"

type User = {
  id: string
  username: string
  phone: string
  status: string
}

// Helper function to generate a fake email from phone number
// This is needed because Firebase requires email for authentication
const generateEmailFromPhone = (phone: string): string => {
  return `${phone.replace(/\+/g, "")}@phoneuser.com`
}

export default function LoginPage() {
  // Form state
  const [phone, setPhone] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [username, setUsername] = useState<string>("")
  const [showPassword, setShowPassword] = useState<boolean>(false)

  // UI state
  const [isLogin, setIsLogin] = useState<boolean>(true)
  const [loading, setLoading] = useState<boolean>(false)
  const [showPopup, setShowPopup] = useState<boolean>(false)
  const [accAtive, setAccAtive] = useState<boolean>(false)
  const [inactiveUserData, setInactiveUserData] = useState<{
    email: string
    username: string
    phone: string
    message?: string
  } | null>(null)

  // Firebase initialization check
  const [firebaseInitialized, setFirebaseInitialized] = useState<boolean>(false)
  const [firebaseError, setFirebaseError] = useState<string | null>(null)

  const router = useRouter()
  const { toast } = useToast()

  // Check Firebase initialization on component mount
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
      setFirebaseError("Firebase API key is missing. Please check your environment variables.")
      return
    }

    try {
      if (app && auth && db) {
        setFirebaseInitialized(true)
      } else {
        setFirebaseError("Firebase failed to initialize. Please check your configuration.")
      }
    } catch (error) {
      console.error("Firebase initialization check error:", error)
      setFirebaseError("Firebase initialization error. Please try again later.")
    }
  }, [])

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  // Also update the handleLogin function with similar auth checking
  const handleLogin = async () => {
    if (!firebaseInitialized) {
      toast({
        variant: "destructive",
        title: "Firebase Error",
        description: firebaseError || "Firebase is not initialized. Please try again later.",
      })
      return
    }

    // Check if auth is available
    if (!auth) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "Authentication service is not available. Please try again later.",
      })
      return
    }

    if (!phone || !password) {
      toast({
        variant: "destructive",
        title: "लगइन त्रुटि",
        description: "कृपया आफ्नो फोन नम्बर र पासवर्ड राख्नुहोस",
      })
      return
    }

    if (!validatePhone(phone)) {
      toast({
        variant: "destructive",
        title: "Invalid Phone Number",
        description: "कृपया मान्य ९ वा १०-अङ्कको फोन नम्बर राख्नुहोस्",
      })
      return
    }

    setLoading(true)

    try {
      // Format phone with country code
      const formattedPhone = `+977${phone}`

      // Generate email from phone for Firebase auth
      const generatedEmail = generateEmailFromPhone(formattedPhone)

      console.log("Attempting login with:", { email: generatedEmail, phone: formattedPhone })

      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, generatedEmail, password)
      const user = userCredential.user

      // Store token + login time in localStorage
      const token = await user.getIdToken()
      localStorage.setItem("token", token)
      localStorage.setItem("loginTime", Date.now().toString())
      localStorage.setItem("userId", user.uid)

      console.log("User authenticated:", user.uid)

      // Get Firestore user data
      const userQuery = query(collection(db, "users"), where("phone", "==", formattedPhone))
      const userDoc = await getDocs(userQuery)

      console.log("User query results:", userDoc.size)

      if (!userDoc.empty) {
        const userData = userDoc.docs[0].data()
        console.log("User data:", userData)

        if (userData.status === "active") {
          // Store user info in localStorage for app use
          localStorage.setItem("username", userData.username || "")
          localStorage.setItem("userPhone", userData.phone || "")

          toast({
            title: "लगइन सफल भयो",
            description: "Welcome back!",
            variant: "success",
          })

          router.push("/home")
        } else {
          await auth.signOut()
          localStorage.removeItem("token")
          localStorage.removeItem("loginTime")
          localStorage.removeItem("userId")

          setAccAtive(true)
          setInactiveUserData({
            email: generatedEmail,
            username: userData.username || "",
            phone: userData.phone || "",
           
          })
        }
      } else {
        // User exists in Auth but not in Firestore
        console.error("User exists in Auth but not in Firestore")

        // Create user document in Firestore
        await setDoc(doc(db, "users", user.uid), {
          username: phone, // Default username to phone
          phone: formattedPhone,
          email: generatedEmail,
          status: "inactive",
          createdAt: new Date().toISOString(),
        })

        // Sign out and show inactive account message
        await auth.signOut()
        localStorage.removeItem("token")
        localStorage.removeItem("loginTime")
        localStorage.removeItem("userId")

        setAccAtive(true)
        setInactiveUserData({
          email: generatedEmail,
          username: phone,
          phone: formattedPhone,
          message: "तपाईंको खाता सक्रिय गर्न आवश्यक छ। कृपया हाम्रो ग्राहक सेवासँग WhatsApp मार्फत सम्पर्क गर्नुहोस्",
        })
      }
    } catch (error: any) {
      console.error("लगइन असफल भयो", error)

      let errorMessage = "कृपया आफ्नो फोन नम्बर र पासवर्ड जाँच गर्नुहोस्."

      if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
        errorMessage = "Invalid phone number or password"
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Too many failed login attempts. Please try again later."
      } else if (error.code === "auth/network-request-failed") {
        errorMessage = "Network error. Please check your internet connection."
      }

      toast({
        variant: "destructive",
        title: "Login Failed",
        description: errorMessage,
      })
    } finally {
      setLoading(false)
    }
  }

  const validatePhone = (phone: string): boolean => {
    // Check if phone is a valid number and has the correct length (9 or 10 digits)
    return /^\d{9,10}$/.test(phone)
  }

  // Replace the handleRegister function with this updated version that includes proper auth checking
  const handleRegister = async () => {
    if (!firebaseInitialized) {
      toast({
        variant: "destructive",
        title: "Firebase Error",
        description: firebaseError || "Firebase is not initialized. Please try again later.",
      })
      return
    }

    // Check if auth is available
    if (!auth) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "जडान गर्न सकिएन। यो फोन नम्बर हाम्रो प्रणालीमा पहिले नै दर्ता गरिएको छ",
      })
      return
    }

    if (!password || !username || !phone) {
      toast({
        variant: "destructive",
        title: "प्रमाणीकरण त्रुटि",
        description: "कृपया सबै क्षेत्रहरू भर्नुहोस्",
      })
      return
    }

    if (!validatePhone(phone)) {
      toast({
        variant: "destructive",
        title: "अमान्य फोन नम्बर",
        description: "कृपया मान्य ९ वा १०-अङ्कको फोन नम्बर राख्नुहोस्",
      })
      return
    }

    if (password.length < 6) {
      toast({
        variant: "destructive",
        title: "Password Error",
        description: "पासवर्ड धेरै कमजोर छ। कृपया कम्तिमा ६ वर्ण प्रयोग गर्नुहोस्",
      })
      return
    }

    setLoading(true)

    try {
      // Format the phone number with country code
      const formattedPhone = `+977${phone}`

      console.log("Attempting registration with:", { username, phone: formattedPhone })

      // Check if phone number already exists
      const existingUserQuery = query(collection(db, "users"), where("phone", "==", formattedPhone))
      const existingUserSnapshot = await getDocs(existingUserQuery)

      if (!existingUserSnapshot.empty) {
        console.log("Phone number already exists")
        // Phone number already exists
        const userData = existingUserSnapshot.docs[0].data()
        setAccAtive(true)
        setInactiveUserData({
          email: userData.email || generateEmailFromPhone(formattedPhone),
          username: userData.username || "",
          phone: formattedPhone,
          message: "उपभोक्तासँग जडान गर्न सकिएन। यो फोन नम्बर हाम्रो प्रणालीमा पहिले नै दर्ता गरिएको छ",
        })
        setLoading(false)
        return
      }

      // Generate email from phone for Firebase authentication
      const generatedEmail = generateEmailFromPhone(formattedPhone)

      // Create user with generated email and password
      const userCredential = await createUserWithEmailAndPassword(auth, generatedEmail, password)
      console.log("User created in Auth:", userCredential.user.uid)
      localStorage.setItem("username", username)
      localStorage.setItem("userPhone", formattedPhone)
      // Store user data in Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        username,
        phone: formattedPhone,
        email: generatedEmail,
        status: "inactive",
        createdAt: new Date().toISOString(),
      })

      // console.log("User data stored in Firestore")

      // Sign out after registration (user needs to be activated)
      await auth.signOut()

      setAccAtive(true)
    } catch (error: any) {
      console.error("दर्ता त्रुटि:", error)

      let errorMessage = "दर्ता त्रुटि"

      if (error.code === "auth/email-already-in-use") {
        errorMessage = "यो फोन नम्बर पहिले नै दर्ता गरिएको छ"
      } else if (error.code === "auth/weak-password") {
        errorMessage = "पासवर्ड धेरै कमजोर छ। कृपया कम्तिमा ६ वर्ण प्रयोग गर्नुहोस्"
      } else if (error.code === "auth/network-request-failed") {
        errorMessage = " नेटवर्क त्रुटि। कृपया आफ्नो इन्टरनेट जडान जाँच गर्नुहोस्"
      } else if (error.code) {
        errorMessage = `दर्ता त्रुटि: ${error.code}`
      } else if (error.message) {
        errorMessage = error.message
      }

      toast({
        variant: "destructive",
        title: "दर्ता असफल भयो",
        description: errorMessage,
      })
    } finally {
      setLoading(false)
    }
  }

  const cleardata =()=>{
    setPhone("")
    setUsername("")
    setPassword("")
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black flex flex-col items-center justify-center text-white p-4 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('/bg-pattern.png')] opacity-10"></div>
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-blue-500 rounded-full filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-purple-500 rounded-full filter blur-3xl opacity-10 animate-pulse"></div>
      </div>

      <motion.div
        className="relative z-10 w-full max-w-md flex flex-col items-center"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants} className="mb-8">
          <img  src="/LOGO CRASH-02.png" alt="Logo" />
        </motion.div>

        {firebaseError && (
          <motion.div
            variants={itemVariants}
            className="w-full max-w-sm mb-4 bg-red-900/50 border border-red-700 rounded-lg p-4 text-white"
          >
            <p className="font-medium">Firebase Error</p>
            <p className="text-sm">{firebaseError}</p>
          </motion.div>
        )}

        <motion.div
          variants={itemVariants}
          className="w-full max-w-sm bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-gray-800 overflow-hidden"
        >
          {/* Tab navigation */}
          <div className="flex" onClick={cleardata}>
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-4 text-center font-medium transition-colors ${isLogin ? "bg-yellow-500 text-black" : "bg-transparent text-gray-400 hover:text-white"
                }`}
            >
              दर्ता गर्नुहोस्
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-4 text-center font-medium transition-colors ${!isLogin ? "bg-yellow-500 text-black" : "bg-transparent text-gray-400 hover:text-white"
                }`}
            >
              खाता खोल्नुहोस
            </button>
          </div>

          {/* Form content */}
          <div className="p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={isLogin ? "login" : "register"}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <h2 className="text-xl font-bold text-center mb-6">{isLogin ? "स्वागत छ" : "प्रयोगकर्ता नाम"}</h2>

                {!isLogin && (
                  <div className="space-y-2">
                    <label htmlFor="username" className="text-sm font-medium text-gray-300">
                    आफ्नो प्रयोगकर्ता नाम लेख्नुहोस
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                        <FaUser />
                      </div>
                      <input
                        id="username"
                        type="text"
                        placeholder="आफ्नो प्रयोगकर्ता नाम लेख्नुहोस"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full p-3 pl-10 rounded-lg bg-gray-800/50 text-white placeholder-gray-500 border border-gray-700 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium text-gray-300">
                  WhatApps नम्बर
                  </label>
                  <div className="relative flex">
                    <div className="flex items-center justify-center px-3 bg-gray-700 border border-gray-600 rounded-l-lg">
                      <FaWhatsapp className="text-green-500 mr-1" />
                      <span className="text-white">+977</span>
                    </div>
                    <input
                      id="phone"
                      type="tel"
                      placeholder="9XXXXXXXX"
                      required
                      value={phone}
                      onChange={(e) => {
                        // Only allow digits
                        const value = e.target.value.replace(/\D/g, "")
                        setPhone(value)
                      }}
                      maxLength={10}
                      className="w-full p-3 rounded-r-lg bg-gray-800/50 text-white placeholder-gray-500 border border-gray-700 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all"
                    />
                  </div>
                  <p className="text-xs text-gray-500">देश कोड बिना आफ्नो १०-अङ्कको WhatApps नम्बर राख्नुहो</p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-gray-300">
                  पासवर्ड राख्नुहोस
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                      <PiLockKey />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder=" पासवर्ड राख्नुहोस"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full p-3 pl-10 pr-10 rounded-lg bg-gray-800/50 text-white placeholder-gray-500 border border-gray-700 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-white transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <FaRegEyeSlash /> : <FaRegEye />}
                    </button>
                  </div>
                  {!isLogin && <p className="text-xs text-gray-500">पासवर्ड कम्तिमा ६ वर्ण लामो हुनुपर्छ</p>}
                </div>

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={isLogin ? handleLogin : handleRegister}
                  disabled={loading || !firebaseInitialized}
                  className={`w-full py-3 px-4 rounded-lg font-semibold text-black bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 shadow-lg transition-all ${loading || !firebaseInitialized ? "opacity-70 cursor-not-allowed" : ""
                    }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-black"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      {isLogin ? "दर्ता गर्नुहोस् ..." : "खाता खोल्नुहोस..."}
                    </div>
                  ) : (
                    <>{isLogin ? "दर्ता गर्नुहोस्" : "खाता खोल्नुहोस"}</>
                  )}
                </motion.button>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Game images */}
        <motion.div variants={itemVariants} className="mt-10 grid grid-cols-2 gap-4 w-full max-w-sm">
          <div className="overflow-hidden rounded-xl shadow-lg">
            <img
              src="https://t4.ftcdn.net/jpg/04/42/21/53/360_F_442215355_AjiR6ogucq3vPzjFAAEfwbPXYGqYVAap.jpg"
              alt="JetX"
              className="w-full h-auto object-cover transform hover:scale-110 transition-transform duration-500"
            />
          </div>
          <div className="overflow-hidden rounded-xl shadow-lg">
            <img
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRXn8BNx6JAauM_mcWo9Ykmg9YRdglXdnXK-g&s"
              alt="Game"
              className="w-full h-auto object-cover transform hover:scale-110 transition-transform duration-500"
            />
          </div>
        </motion.div>
      </motion.div>

      {/* Loading overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm z-50"
          >
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 flex flex-col items-center">
              <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-white text-lg">{isLogin ? "दर्ता गर्नुहोस्..." : "खाता खोल्नुहोस..."}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Popups */}
      <AnimatePresence>{showPopup && <UopupRegisterSuccess setShowPopup={setShowPopup} />}</AnimatePresence>

      <AnimatePresence>
        {accAtive && <AccountInactiveLogin setAccAtive={setAccAtive} userData={inactiveUserData} />}
      </AnimatePresence>
    </div>
  )
}
