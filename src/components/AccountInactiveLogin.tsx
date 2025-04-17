"use client"

import type React from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { FaCopy, FaWhatsapp } from "react-icons/fa"
import { useToast } from "@/hooks/use-toast"

interface UopupRegisterSuccessProps {
    setAccAtive: React.Dispatch<React.SetStateAction<boolean>>
    userData: {
        email: string
        username: string
        phone: string
        message?: string
    } | null
}

const AccountInactiveLogin: React.FC<UopupRegisterSuccessProps> = ({ setAccAtive, userData }) => {
    const router = useRouter()
    const { toast } = useToast()

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
                toast({
                    title: "Copied to clipboard",
                    description: "Account information copied successfully",
                    variant: "success",
                })
            })
            .catch((err) => {
                console.error("Failed to copy: ", err)
                toast({
                    title: "Copy failed",
                    description: "Failed to copy text to clipboard",
                    variant: "destructive",
                })
            })
    }

    const handleWhatsAppContact = () => {
        // Replace with your actual customer service WhatsApp number
        const phoneNumber = "+123456789"
        const message = `Hello, I'm ${userData?.username} (${userData?.email})  (${userData?.phone}). My account is inactive and I need assistance to activate it.`

        // Create WhatsApp URL with pre-filled message
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`

        // Open WhatsApp in a new tab
        window.open(whatsappUrl, "_blank")
    }

    return (
        <motion.div
            id="popup-overlay"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50"
        >
            <div className="bg-white text-black p-6 rounded-lg text-center w-80" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-semibold mb-2 font-KhmerMoul">Account Inactive</h3>
                <p className="mb-4">{userData?.message || "Please contact our customer service to activate your account!"}</p>
                <div className="mt-4 text-left space-y-2 bg-gray-100 p-3 rounded-md">
                    <div className="flex text-sm justify-between items-center">
                        <div>
                            <p>
                                <strong>Email:</strong> {userData?.email}
                            </p>
                            <p>
                                <strong>Username:</strong> {userData?.username}
                            </p>
                            <p>
                                <strong>What App:</strong> {userData?.phone}
                            </p>
                        </div>
                        <button
                            className="text-xl text-gray-500 hover:text-slate-700 pl-4"
                            onClick={() => copyToClipboard(`Email: ${userData?.email || ""}\nUsername: ${userData?.username || ""}`)}
                            aria-label="Copy account information"
                        >
                            <FaCopy />
                        </button>
                    </div>
                </div>

                <div className="mt-4 flex flex-col gap-3">
                    <button
                        onClick={handleWhatsAppContact}
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded flex items-center justify-center gap-2"
                    >
                        <FaWhatsapp className="text-xl" />
                        Contact via WhatsApp
                    </button>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-yellow-500 text-black font-semibold p-2 rounded hover:bg-yellow-400 w-full"
                        onClick={() => {
                            setAccAtive(false)
                        }}
                    >
                        Back to Login
                    </motion.button>
                </div>
            </div>
        </motion.div>
    )
}

export default AccountInactiveLogin




















// "use client"

// import type React from "react"
// import { useEffect, useRef } from "react"
// import { useRouter } from "next/navigation"
// import { motion } from "framer-motion"
// import { FaCopy } from "react-icons/fa"
// import { FaTelegram } from "react-icons/fa"
// import { useToast } from "@/hooks/use-toast"

// interface UopupRegisterSuccessProps {
//   setAccAtive: React.Dispatch<React.SetStateAction<boolean>>
//   userData: {
//     email: string
//     username: string
//     phone: string
//     message?: string
//   } | null
// }

// const AccountInactiveLogin: React.FC<UopupRegisterSuccessProps> = ({ setAccAtive, userData }) => {
//   const router = useRouter()
//   const { toast } = useToast()
//   const textAreaRef = useRef<HTMLTextAreaElement>(null)

//   const handleClickOutside = (event: MouseEvent) => {
//     const target = event.target as HTMLElement
//     if (target.id === "popup-overlay") {
//       setAccAtive(false)
//     }
//   }

//   useEffect(() => {
//     document.addEventListener("click", handleClickOutside)
//     return () => {
//       document.removeEventListener("click", handleClickOutside)
//     }
//   }, [])

//   // Fallback copy function using document.execCommand
//   const fallbackCopyTextToClipboard = (text: string): boolean => {
//     try {
//       if (!textAreaRef.current) return false

//       const textArea = textAreaRef.current
//       textArea.value = text
//       textArea.style.top = "0"
//       textArea.style.left = "0"
//       textArea.style.position = "fixed"
//       textArea.focus()
//       textArea.select()

//       const successful = document.execCommand("copy")
//       return successful
//     } catch (err) {
//       console.error("Fallback: Could not copy text: ", err)
//       return false
//     } finally {
//       if (textAreaRef.current) {
//         textAreaRef.current.style.top = "-9999px"
//         textAreaRef.current.style.left = "-9999px"
//       }
//     }
//   }

//   const copyToClipboard = (text: string) => {
//     // Check if Clipboard API is available
//     if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
//       navigator.clipboard
//         .writeText(text)
//         .then(() => {
//           toast({
//             title: "Copied to clipboard",
//             description: "Account information copied successfully",
//             variant: "success",
//           })
//         })
//         .catch((err) => {
//           console.error("Failed to copy with Clipboard API: ", err)
//           // Try fallback method
//           const successful = fallbackCopyTextToClipboard(text)
//           if (successful) {
//             toast({
//               title: "Copied to clipboard",
//               description: "Account information copied successfully",
//               variant: "success",
//             })
//           } else {
//             toast({
//               title: "Copy failed",
//               description: "Failed to copy text to clipboard",
//               variant: "destructive",
//             })
//           }
//         })
//     } else {
//       // Clipboard API not available, use fallback
//       const successful = fallbackCopyTextToClipboard(text)
//       if (successful) {
//         toast({
//           title: "Copied to clipboard",
//           description: "Account information copied successfully",
//           variant: "success",
//         })
//       } else {
//         toast({
//           title: "Copy failed",
//           description: "Failed to copy text to clipboard",
//           variant: "destructive",
//         })
//       }
//     }
//   }

//   const handleTelegramContact = () => {
//     // Use the specific Telegram number
//     const telegramNumber = "0965752080"

//     // Format the number for Telegram URL (remove leading zero and add country code if needed)
//     // If this is a Cambodian number, the format would be: +855 + number without leading 0
//     const formattedNumber = telegramNumber.startsWith("0") ? "+855" + telegramNumber.substring(1) : telegramNumber

//     // Create message for clipboard
//     const message = `Hello, I'm ${userData?.username} (${userData?.email}) (${userData?.phone}). My account is inactive and I need assistance to activate it.`

//     // Try to copy the message to clipboard
//     copyToClipboard(message)

//     // Open Telegram chat with the specific number regardless of clipboard success
//     window.open(`https://t.me/${formattedNumber}`, "_blank")

//     // Show a toast to inform the user
//     toast({
//       title: "Opening Telegram",
//       description: "Please paste the copied message in the chat",
//       variant: "success",
//     })
//   }

//   return (
//     <motion.div
//       id="popup-overlay"
//       initial={{ opacity: 0, scale: 0.8 }}
//       animate={{ opacity: 1, scale: 1 }}
//       exit={{ opacity: 0, scale: 0.8 }}
//       transition={{ duration: 0.4 }}
//       className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50"
//     >
//       {/* Hidden textarea for fallback copy method */}
//       <textarea
//         ref={textAreaRef}
//         aria-hidden="true"
//         style={{
//           position: "fixed",
//           top: "-9999px",
//           left: "-9999px",
//           width: "1px",
//           height: "1px",
//           padding: 0,
//           border: "none",
//           outline: "none",
//           boxShadow: "none",
//           background: "transparent",
//         }}
//       />

//       <div className="bg-white text-black p-6 rounded-lg text-center w-80" onClick={(e) => e.stopPropagation()}>
//         <h3 className="text-lg font-semibold mb-2 font-KhmerMoul">Account Inactive</h3>
//         <p className="mb-4">{userData?.message || "Please contact our customer service to activate your account!"}</p>
//         <div className="mt-4 text-left space-y-2 bg-gray-100 p-3 rounded-md">
//           <div className="flex text-sm justify-between items-center">
//             <div>
//               <p>
//                 <strong>Email:</strong> {userData?.email}
//               </p>
//               <p>
//                 <strong>Username:</strong> {userData?.username}
//               </p>
//               <p>
//                 <strong>Telegram:</strong> {userData?.phone}
//               </p>
//             </div>
//             <button
//               className="text-xl text-gray-500 hover:text-slate-700 pl-4"
//               onClick={() =>
//                 copyToClipboard(
//                   `Email: ${userData?.email || ""}\nUsername: ${userData?.username || ""}\nTelegram: ${userData?.phone || ""}`,
//                 )
//               }
//               aria-label="Copy account information"
//             >
//               <FaCopy />
//             </button>
//           </div>
//         </div>

//         <div className="mt-4 flex flex-col gap-3">
//           <button
//             onClick={handleTelegramContact}
//             className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded flex items-center justify-center gap-2"
//           >
//             <FaTelegram className="text-xl" />
//             Contact via Telegram (0965752080)
//           </button>

//           <motion.button
//             whileHover={{ scale: 1.05 }}
//             whileTap={{ scale: 0.95 }}
//             className="bg-yellow-500 text-black font-semibold p-2 rounded hover:bg-yellow-400 w-full"
//             onClick={() => {
//               setAccAtive(false)
//             }}
//           >
//             Back to Login
//           </motion.button>
//         </div>
//       </div>
//     </motion.div>
//   )
// }

// export default AccountInactiveLogin
