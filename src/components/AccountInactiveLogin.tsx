"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { FaCopy, FaWhatsapp, FaExclamationTriangle } from "react-icons/fa"
import { useToast } from "@/hooks/use-toast"
import { db } from "./firebase-config"
import { doc, getDoc } from "firebase/firestore"

interface UserData {
  username: string
  phone: string
  message?: string
}

interface WhatAppEntry {
  id: string
  whatapp: string       // Phone number, e.g., "9700447095"
  phoneLink?: string    // Optional pre-built WhatsApp URL
  message?: string      // Optional custom message
  createdAt: string
  updatedAt: string
}


interface AccountInactiveProps {
  setAccAtive: React.Dispatch<React.SetStateAction<boolean>>
  userData: UserData | null
}

// The fixed document ID for the WhatsApp configuration
const WHAT_APP_CONFIG_ID = "single-what-app"

const AccountInactiveLogin: React.FC<AccountInactiveProps> = ({ setAccAtive, userData }) => {
  const router = useRouter()
  const { toast } = useToast()
  const [whatsappNumber, setWhatsappNumber] = useState<string>("9700447095")
  const [whatsappLink, setWhatsappLink] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [loadingState, setLoadingState] = useState<"loading" | "success" | "error">("loading")
  const [retryCount, setRetryCount] = useState(0)
  const [copied, setCopied] = useState(false)
  const [userMessage, setUserMessage] = useState<string>("")

  const [username, setUsername] = useState("")
  const [userPhone, setUserPhone] = useState("")

  useEffect(() => {
    setUsername(localStorage.getItem("username") || "")
    setUserPhone(localStorage.getItem("userPhone") || "")
  }, [])

  // Fetch WhatsApp configuration from Firebase
  useEffect(() => {
    const fetchWhatsAppConfig = async () => {
      if (!db) {
        setLoadingState("error")
        return
      }

      setIsLoading(true)
      setLoadingState("loading")

      try {
        const docRef = doc(db, "what-app1", WHAT_APP_CONFIG_ID)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          const data = docSnap.data()

          setWhatsappNumber(data.whatapp || "9700447095")
          setWhatsappLink(data.phoneLink || "")
          setUserMessage(data.message || "") // Add this line if you're displaying a message
          setLoadingState("success")
        } else {
          console.warn("No WhatsApp config found")
          setLoadingState("error")
        }
      } catch (error) {
        console.error("Error fetching WhatsApp config:", error)
        setLoadingState("error")

        toast({
          title: "Connection Error",
          description: "Failed to load contact information",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchWhatsAppConfig()
  }, [toast, retryCount])


  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement
    if (target.id === "popup-overlay") {
      setAccAtive(false)
    }
  }

  useEffect(() => {
    document.addEventListener("click", handleClickOutside)
    return () => {
      document.removeEventListener("click", handleClickOutside)
    }
  }, [])

  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)

        toast({
          title: "क्लिपबोर्डमा प्रतिलिपि गरियो",
          description: "खाता जानकारी सफलतापूर्वक प्रतिलिपि गरियो",
          variant: "success",
        })
      })
      .catch((err) => {
        console.error("Failed to copy: ", err)
        toast({
          title: "प्रतिलिपि असफल भयो",
          description: "पाठ क्लिपबोर्डमा प्रतिलिपि गर्न असफल भयो",
          variant: "destructive",
        })
      })
  }

  const handleWhatsAppContact = () => {
    // Check if we have a custom WhatsApp link from the backend
    if (whatsappLink) {
      // Use the custom link directly
      window.open(whatsappLink, "_blank")
    } else {
      // Fallback to generating a WhatsApp URL with the number
      // Format the WhatsApp number correctly
      // Remove any non-digit characters and ensure there's no double plus sign
      const cleanNumber = whatsappNumber.replace(/^\++/, "+").replace(/[^\d+]/g, "")

      const message = `Hello, I'm ${userData?.username} (${userData?.phone}). My account is inactive and I need assistance to activate it.`

      // Create WhatsApp URL with pre-filled message
      const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`

      // Open WhatsApp in a new tab
      window.open(whatsappUrl, "_blank")
    }
  }

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1)
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut",
        when: "beforeChildren",
        staggerChildren: 0.1,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      transition: { duration: 0.3 },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
    exit: { y: -20, opacity: 0 },
  }

  const buttonVariants = {
    hover: { scale: 1.05 },
    tap: { scale: 0.95 },
    initial: { scale: 1 },
  }

  const pulseVariants = {
    pulse: {
      scale: [1, 1.05, 1],
      opacity: [0.7, 1, 0.7],
      transition: {
        duration: 2,
        repeat: Number.POSITIVE_INFINITY,
        ease: "easeInOut",
      },
    },
  }

  return (
    <AnimatePresence>
      <motion.div
        id="popup-overlay"
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={containerVariants}
        className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm z-50"
      >
        <motion.div
          className="bg-white text-black p-6 rounded-xl shadow-2xl text-center w-[340px] relative overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          variants={containerVariants}
        >
          {/* Decorative elements */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-green-200 to-green-400 rounded-full opacity-20"></div>
          <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-gradient-to-tr from-yellow-200 to-yellow-400 rounded-full opacity-20"></div>

          <motion.div variants={itemVariants} className="relative z-10">
            <h3 className="text-xl font-semibold mb-3 font-KhmerMoul text-gray-800">खाता निष्क्रिय</h3>
            <div className="w-16 h-1 bg-gradient-to-r from-green-400 to-yellow-400 mx-auto mb-4 rounded-full"></div>
            <p className="mb-5 text-gray-600">
              {userData?.message || userMessage || "Please contact support to activate your account."}
            </p>


            <div>
              <span className="text-gray-800">ग्राहक सेवा
              : {whatsappNumber}</span>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="mt-5 text-left space-y-2 bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200 shadow-sm relative z-10"
          >
            <div className="flex text-sm justify-between items-center">
              <div className="space-y-2">
                <p className="flex items-center">
                  <span className="font-medium text-gray-700 whitespace-nowrap w-20">प्रयोगकर्ता नाम : </span>
                  <span className="text-gray-800">{userData?.username || username }</span>
                  <br />

                </p>
                <p className="flex items-center">
                  <span className="font-medium text-gray-700 w-20">WhatApp:</span>
                  <span className="text-gray-800">{userData?.phone || userPhone}</span>
                </p>
              </div>

              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                initial="initial"
                className={`text-xl p-2 rounded-full ${copied ? "bg-green-100 text-green-600" : "text-gray-500 hover:text-gray-700 hover:bg-gray-200"}`}
                onClick={() => copyToClipboard(`Username: ${userData?.username || ""}\nWhatsApp: ${userData?.phone}`)}
                aria-label="Copy account information"
              >
                <FaCopy />
              </motion.button>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="mt-6 flex flex-col gap-3 relative z-10">
            {loadingState === "loading" ? (
              <motion.button
                disabled
                className="w-full bg-gray-400 text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
              >
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span className="ml-2">Loading contact info...</span>
                </div>
              </motion.button>
            ) : loadingState === "error" ? (
              <div className="space-y-3">
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                  <FaExclamationTriangle className="text-red-500 text-xl mx-auto mb-2" />
                  <p className="text-red-700 text-sm">Unable to load contact information</p>
                </div>
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={handleRetry}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Try Again
                </motion.button>
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={handleWhatsAppContact}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2"
                >
                  <FaWhatsapp className="text-xl" />
                  Use Default WhatsApp
                </motion.button>
              </div>
            ) : (
              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={handleWhatsAppContact}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-green-200"
                animate="pulse"
              >
                <FaWhatsapp className="text-xl" />
                WhatsApp मार्फत सम्पर्क गर्नुहोस्

              </motion.button>

            )}

            <motion.button
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 font-medium py-3 px-4 rounded-lg w-full shadow-lg shadow-yellow-200/50"
              onClick={() => {
                setAccAtive(false)
              }}
            >
             लगइनमा फर्कनुहोस्
            </motion.button>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default AccountInactiveLogin
