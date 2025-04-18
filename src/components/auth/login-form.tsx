

// "use client"

// import { useState } from "react"
// import { useRouter } from "next/navigation"
// import { motion, AnimatePresence } from "framer-motion"
// import { FaUser, FaPhoneAlt, FaRegEyeSlash, FaRegEye } from "react-icons/fa"
// import { MdEmail } from "react-icons/md"
// import { PiLockKey } from "react-icons/pi"

// // Firebase imports
// import { initializeApp } from "firebase/app"
// import { signInWithEmailAndPassword, createUserWithEmailAndPassword, getAuth } from "firebase/auth"
// import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore"

// // Components
// import UopupRegisterSuccess from "@/components/UopupRegisterSuccess"
// import AccountInactiveLogin from "@/components/AccountInactiveLogin"

// // Hooks
// import { useToast } from "@/hooks/use-toast"

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
// const db = getFirestore(app)

// type User = {
//   id: string
//   username: string
//   phone: string
//   status: string
// }

// export default function LoginPage() {
//   // Form state
//   const [email, setEmail] = useState<string>("")
//   const [password, setPassword] = useState<string>("")
//   const [username, setUsername] = useState<string>("")
//   const [phone, setPhone] = useState<string>("")
//   const [showPassword, setShowPassword] = useState<boolean>(false)

//   // UI state
//   const [isLogin, setIsLogin] = useState<boolean>(true)
//   const [loading, setLoading] = useState<boolean>(false)
//   const [showPopup, setShowPopup] = useState<boolean>(false)
//   const [accAtive, setAccAtive] = useState<boolean>(false)
//   const [inactiveUserData, setInactiveUserData] = useState<{
//     email: string
//     username: string
//     phone: string
//     message?: string
//   } | null>(null)

//   const router = useRouter()
//   const { toast } = useToast()

//   const handleLogin = async () => {
//     if (!email || !password) {
//       toast({
//         variant: "destructive",
//         title: "Email Error",
//         description: "Please check your Email",
//       })
//       return
//     }

//     setLoading(true)

//     try {
//       const userCredential = await signInWithEmailAndPassword(auth, email, password)
//       const user = userCredential.user

//       // Store token in localStorage for your existing app to use
//       localStorage.setItem("token", await user.getIdToken())

//       const userDoc = await getDoc(doc(db, "users", user.uid))

//       if (userDoc.exists()) {
//         const userData = userDoc.data()
//         if (userData.status === "active") {
//           router.push("/crash-game")
//         } else {
//           await auth.signOut()
//           localStorage.removeItem("token")
//           setAccAtive(true)
//           setInactiveUserData({
//             email: user.email || "",
//             username: userData.username || "",
//             phone: userData.phone || "",
//             message:
//               "Your account is inactive. Please contact our customer service via WhatsApp at +977-XXXXXXXXXX to activate your account. You may need to complete a top-up to activate your account.",
//           })
//         }
//       } else {
//         await auth.signOut()
//         localStorage.removeItem("token")
//         toast({
//           variant: "destructive",
//           title: "Authentication Error",
//           description: "User data not found in database.",
//         })
//       }
//     } catch (error: any) {
//       let errorMessage = "Login failed. Please check your Email and Password."

//       if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
//         errorMessage = "Invalid email or password"
//       } else if (error.code === "auth/too-many-requests") {
//         errorMessage = "Too many failed login attempts. Please try again later."
//       }

//       toast({
//         variant: "destructive",
//         title: "Login Failed",
//         description: errorMessage,
//       })
//     } finally {
//       setLoading(false)
//     }
//   }

//   const validatePhone = (phone: string): boolean => {
//     // Check if phone is a valid number and has the correct length
//     return /^\d{10}$/.test(phone)
//   }

//   const handleRegister = async () => {
//     if (!email || !password || !username || !phone) {
//       toast({
//         variant: "destructive",
//         title: "Validation Error",
//         description: "Please fill in all fields",
//       })
//       return
//     }

//     if (!validatePhone(phone)) {
//       toast({
//         variant: "destructive",
//         title: "Invalid Phone Number",
//         description: "Please enter a valid 10-digit phone number",
//       })
//       return
//     }

//     setLoading(true)

//     try {
//       const userCredential = await createUserWithEmailAndPassword(auth, email, password)
//       await setDoc(doc(db, "users", userCredential.user.uid), {
//         username,
//         phone: `+977${phone}`, // Store with country code
//         status: "inactive",
//       })
//       setShowPopup(true)
//     } catch (error: any) {
//       let errorMessage = "Registration failed"

//       if (error.code === "auth/email-already-in-use") {
//         errorMessage = "Email already in use"
//       } else if (error.code === "auth/weak-password") {
//         errorMessage = "Password is too weak"
//       } else if (error.code === "auth/invalid-email") {
//         errorMessage = "Invalid email address"
//       }

//       toast({
//         variant: "destructive",
//         title: "Registration Failed",
//         description: errorMessage,
//       })
//     } finally {
//       setLoading(false)
//     }
//   }

//   return (
//     <div>
//       <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-4">
//         <img className="mb-8" src="/LOGO CRASH-02.png" alt="Logo" />

//         <div className="space-y-8">
//           <div className="bg-gradient-to-tr from-gray-900 via-gray-950 to-gray-900 p-6 shadow-lg w-80 text-center">
//             <h2 className="text-lg font-semibold mb-4">{isLogin ? "Login" : "Register Now"}</h2>

//             <div className="space-y-4">
//               {!isLogin && (
//                 <div className="relative w-full">
//                   <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
//                     <FaUser />
//                   </div>
//                   <input
//                     type="text"
//                     placeholder="Username"
//                     required
//                     value={username}
//                     onChange={(e) => setUsername(e.target.value)}
//                     className="w-full p-2 pl-10 rounded bg-gray-800 text-white placeholder-gray-400 border border-gray-700 focus:ring-blue-500 focus:border-blue-500"
//                   />
//                 </div>
//               )}
//               <div className="relative w-full">
//                 <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
//                   <MdEmail />
//                 </div>
//                 <input
//                   type="email"
//                   placeholder="Email"
//                   value={email}
//                   required
//                   onChange={(e) => setEmail(e.target.value)}
//                   className="w-full p-2 pl-10 rounded bg-gray-800 text-white placeholder-gray-400 border border-gray-700 focus:ring-blue-500 focus:border-blue-500"
//                 />
//               </div>
//               <div className="relative w-full">
//                 <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
//                   <PiLockKey />
//                 </div>
//                 <input
//                   type={showPassword ? "text" : "password"}
//                   placeholder="Password"
//                   required
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                   className="w-full p-2 pl-10 pr-10 rounded bg-gray-800 text-white placeholder-gray-400 border border-gray-700 focus:ring-blue-500 focus:border-blue-500"
//                 />
//                 <button
//                   type="button"
//                   className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-white"
//                   onClick={() => setShowPassword(!showPassword)}
//                 >
//                   {showPassword ? <FaRegEyeSlash /> : <FaRegEye />}
//                 </button>
//               </div>
//               {!isLogin && (
//                 <div className="relative w-full">
//                   {/* <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
//                     <FaPhoneAlt />
//                   </div> */}
//                   <div className="flex">
//                     <div className="bg-gray-700 text-white p-2 rounded-l flex items-center">+977</div>
//                     <input
//                       type="tel"
//                       placeholder="WhatsApp"
//                       required
//                       value={phone}
//                       onChange={(e) => {
//                         // Only allow digits
//                         const value = e.target.value.replace(/\D/g, "")
//                         setPhone(value)
//                       }}
//                       maxLength={10}
//                       className="w-full p-2 rounded-r bg-gray-800 text-white placeholder-gray-400 border border-gray-700 focus:ring-blue-500 focus:border-blue-500"
//                     />
//                   </div>
//                 </div>
//               )}
//             </div>

//             <motion.button
//               whileHover={{ scale: 1.05 }}
//               whileTap={{ scale: 0.95 }}
//               onClick={isLogin ? handleLogin : handleRegister}
//               className="mt-4 w-full cursor-pointer bg-yellow-500 text-black font-semibold p-2 rounded hover:bg-yellow-400"
//             >
//               {isLogin ? "Login" : "Register"}
//             </motion.button>
//             <div className="mt-4 text-sm">
//               {isLogin ? (
//                 <p>
//                   Don&apos;t have an account?{" "}
//                   <span
//                     className="text-blue-400 cursor-pointer"
//                     onClick={() => {
//                       setIsLogin(false)
//                     }}
//                   >
//                     Register here
//                   </span>
//                 </p>
//               ) : (
//                 <p>
//                   Already have an account?{" "}
//                   <span
//                     className="text-blue-400 cursor-pointer"
//                     onClick={() => {
//                       setIsLogin(true)
//                     }}
//                   >
//                     Login here
//                   </span>
//                 </p>
//               )}
//             </div>
//           </div>
//         </div>
//         {loading && (
//           <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
//             <div className="text-white text-lg animate-pulse">Processing...</div>
//           </div>
//         )}
//         <div className="mt-14 flex space-x-4">
//           <img
//             src="https://t4.ftcdn.net/jpg/04/42/21/53/360_F_442215355_AjiR6ogucq3vPzjFAAEfwbPXYGqYVAap.jpg"
//             width={170}
//             height={150}
//             alt="JetX"
//           />
//           <img
//             src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRXn8BNx6JAauM_mcWo9Ykmg9YRdglXdnXK-g&s"
//             width={170}
//             height={150}
//             alt="Game"
//           />
//         </div>
//       </div>

//       <AnimatePresence>{showPopup && <UopupRegisterSuccess setShowPopup={setShowPopup} />}</AnimatePresence>
//       <AnimatePresence>
//         {accAtive && <AccountInactiveLogin setAccAtive={setAccAtive} userData={inactiveUserData} />}
//       </AnimatePresence>
//     </div>
//   )
// }



"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { FaUser, FaRegEyeSlash, FaRegEye } from "react-icons/fa"
import { PiLockKey } from "react-icons/pi"

// Firebase imports
import { initializeApp } from "firebase/app"
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, getAuth } from "firebase/auth"
import { getFirestore, doc, setDoc, collection, query, where, getDocs } from "firebase/firestore"

// Components
import UopupRegisterSuccess from "@/components/UopupRegisterSuccess"
import AccountInactiveLogin from "@/components/AccountInactiveLogin"

// Hooks
import { useToast } from "@/hooks/use-toast"

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
const auth = getAuth(app)
const db = getFirestore(app)

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
    email: string // Keep this for compatibility with AccountInactiveLogin component
    username: string
    phone: string
    message?: string
  } | null>(null)

  const router = useRouter()
  const { toast } = useToast()

  const handleLogin = async () => {
    if (!phone || !password) {
      toast({
        variant: "destructive",
        title: "Login Error",
        description: "Please enter your phone number and password",
      })
      return
    }

    if (!validatePhone(phone)) {
      toast({
        variant: "destructive",
        title: "Invalid Phone Number",
        description: "Please enter a valid 9 or 10-digit phone number",
      })
      return
    }

    setLoading(true)

    try {
      // Format the phone number with country code
      const formattedPhone = `+977${phone}`

      // Generate email from phone for Firebase authentication
      const generatedEmail = generateEmailFromPhone(formattedPhone)

      // Authenticate with Firebase using the generated email
      const userCredential = await signInWithEmailAndPassword(auth, generatedEmail, password)
      const user = userCredential.user

      // Store token in localStorage
      localStorage.setItem("token", await user.getIdToken())

      // Get user data from Firestore
      const userDoc = await getDocs(query(collection(db, "users"), where("phone", "==", formattedPhone)))

      if (!userDoc.empty) {
        const userData = userDoc.docs[0].data()

        if (userData.status === "active") {
          router.push("/crash-game")
        } else {
          await auth.signOut()
          localStorage.removeItem("token")
          setAccAtive(true)
          setInactiveUserData({
            email: generatedEmail, // Include email for component compatibility
            username: userData.username || "",
            phone: userData.phone || "",
            message:
              "Your account is inactive. Please contact our customer service via WhatsApp at +977-XXXXXXXXXX to activate your account. You may need to complete a top-up to activate your account.",
          })
        }
      } else {
        throw new Error("user-data-not-found")
      }
    } catch (error: any) {
      let errorMessage = "Login failed. Please check your phone number and password."

      if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
        errorMessage = "Invalid phone number or password"
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Too many failed login attempts. Please try again later."
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

  const handleRegister = async () => {
    if (!password || !username || !phone) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill in all fields",
      })
      return
    }

    if (!validatePhone(phone)) {
      toast({
        variant: "destructive",
        title: "Invalid Phone Number",
        description: "Please enter a valid 9 or 10-digit phone number",
      })
      return
    }

    setLoading(true)

    try {
      // Format the phone number with country code
      const formattedPhone = `+977${phone}`

      // Check if phone number already exists
      const existingUserQuery = await getDocs(query(collection(db, "users"), where("phone", "==", formattedPhone)))

      if (!existingUserQuery.empty) {
        // Instead of just showing an error, show the top-up message
        const userData = existingUserQuery.docs[0].data()
        setAccAtive(true)
        setInactiveUserData({
          email: userData.email || generateEmailFromPhone(formattedPhone),
          username: userData.username || "",
          phone: formattedPhone,
          message:
            "This phone number is already registered. Please contact our customer service via WhatsApp at +977-XXXXXXXXXX to activate your account. You may need to complete a top-up to activate your account.",
        })
        setLoading(false)
        return
      }

      // Generate email from phone for Firebase authentication
      const generatedEmail = generateEmailFromPhone(formattedPhone)

      // Create user with generated email and password
      const userCredential = await createUserWithEmailAndPassword(auth, generatedEmail, password)

      // Store user data in Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        username,
        phone: formattedPhone,
        email: generatedEmail, // Store the generated email for reference
        status: "inactive",
        createdAt: new Date().toISOString(),
      })

      setShowPopup(true)
    } catch (error: any) {
      let errorMessage = "Registration failed"

      if (error.code === "auth/email-already-in-use") {
        errorMessage = "This phone number is already registered"
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password is too weak. Please use at least 6 characters."
      }

      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: errorMessage,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-4">
        <img className="mb-8" src="/LOGO CRASH-02.png" alt="Logo" />

        <div className="space-y-8">
          <div className="bg-gradient-to-tr from-gray-900 via-gray-950 to-gray-900 p-6 shadow-lg w-80 text-center">
            <h2 className="text-lg font-semibold mb-4">{isLogin ? "Login" : "Register Now"}</h2>

            <div className="space-y-4">
              {!isLogin && (
                <div className="relative w-full">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <FaUser />
                  </div>
                  <input
                    type="text"
                    placeholder="Username"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full p-2 pl-10 rounded bg-gray-800 text-white placeholder-gray-400 border border-gray-700 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}
              <div className="relative w-full">
                <div className="flex">
                  <div className="bg-gray-700 text-white p-2 rounded-l flex items-center">+977</div>
                  <input
                    type="tel"
                    placeholder="What app"
                    required
                    value={phone}
                    onChange={(e) => {
                      // Only allow digits
                      const value = e.target.value.replace(/\D/g, "")
                      setPhone(value)
                    }}
                    maxLength={10}
                    className="w-full p-2 rounded-r bg-gray-800 text-white placeholder-gray-400 border border-gray-700 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <PiLockKey />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2 pl-10 pr-10 rounded bg-gray-800 text-white placeholder-gray-400 border border-gray-700 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-white"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaRegEyeSlash /> : <FaRegEye />}
                </button>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={isLogin ? handleLogin : handleRegister}
              className="mt-4 w-full cursor-pointer bg-yellow-500 text-black font-semibold p-2 rounded hover:bg-yellow-400"
            >
              {isLogin ? "Login" : "Register"}
            </motion.button>
            <div className="mt-4 text-sm">
              {isLogin ? (
                <p>
                  Don&apos;t have an account?{" "}
                  <span
                    className="text-blue-400 cursor-pointer"
                    onClick={() => {
                      setIsLogin(false)
                    }}
                  >
                    Register here
                  </span>
                </p>
              ) : (
                <p>
                  Already have an account?{" "}
                  <span
                    className="text-blue-400 cursor-pointer"
                    onClick={() => {
                      setIsLogin(true)
                    }}
                  >
                    Login here
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>
        {loading && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="text-white text-lg animate-pulse">Processing...</div>
          </div>
        )}
        <div className="mt-14 flex space-x-4">
          <img
            src="https://t4.ftcdn.net/jpg/04/42/21/53/360_F_442215355_AjiR6ogucq3vPzjFAAEfwbPXYGqYVAap.jpg"
            width={170}
            height={150}
            alt="JetX"
          />
          <img
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRXn8BNx6JAauM_mcWo9Ykmg9YRdglXdnXK-g&s"
            width={170}
            height={150}
            alt="Game"
          />
        </div>
      </div>

      <AnimatePresence>{showPopup && <UopupRegisterSuccess setShowPopup={setShowPopup} />}</AnimatePresence>
      <AnimatePresence>
        {accAtive && <AccountInactiveLogin setAccAtive={setAccAtive} userData={inactiveUserData} />}
      </AnimatePresence>
    </div>
  )
}
