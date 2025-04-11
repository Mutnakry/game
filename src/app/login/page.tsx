'use client';
import { useState } from "react";
import { FaUser, FaPhoneAlt, FaRegEyeSlash, FaRegEye } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import { PiLockKey } from "react-icons/pi";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { motion } from 'framer-motion';
import { AnimatePresence } from "framer-motion"
import UopupRegisterSuccess from '@/components/UopupRegisterSuccess'
import AccountInactiveLogin from '@/components/AccountInactiveLogin'


import { initializeApp } from "firebase/app";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
type User = {
    id: string;
    username: string;
    phone: string;
    status: string;
};

export default function page() {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [username, setUsername] = useState<string>('');
    const [phone, setPhone] = useState<string>('');
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [isLogin, setIsLogin] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [showPopup, setShowPopup] = useState<boolean>(false);
    const [accAtive, setAccAtive] = useState<boolean>(false);
    const [inactiveUserData, setInactiveUserData] = useState<{ email: string; username: string } | null>(null);


    const router = useRouter();


    const handleLogin = async () => {
        setLoading(true);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                if (userData.status === "active") {
                    alert("Login Successful!");
                    router.push("/crash-game");
                } else {
                    await auth.signOut();
                    setAccAtive(true);
                    setInactiveUserData({
                        email: user.email || "",
                        username: userData.username || "",
                    });
                }
            } else {
                await auth.signOut();
                setError("User data not found in database.");
            }
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };


    const handleRegister = async () => {
        setLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await setDoc(doc(db, "users", userCredential.user.uid), {
                username,
                phone,
                status: "inactive"
            });
            setShowPopup(true);
        } catch (error: any) {
            console.error(error);
            setError(error.message);
        }
        finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-4">
                <img className="mb-8" src="/LOGO CRASH-02.png" alt="Logo" />

                <div className="space-y-8">
                    <div className="bg-gradient-to-tr from-gray-900 via-gray-950 to-gray-900 p-6 shadow-lg w-80 text-center">
                        <h2 className="text-lg font-semibold mb-4">{isLogin ? 'Login' : 'Register Now'}</h2>

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
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                                    <MdEmail />
                                </div>
                                <input
                                    type="email"
                                    placeholder="Email"
                                    value={email}
                                    required
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full p-2 pl-10 rounded bg-gray-800 text-white placeholder-gray-400 border border-gray-700 focus:ring-blue-500 focus:border-blue-500"
                                />
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
                            {!isLogin && (
                                <div className="relative w-full">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                                        <FaPhoneAlt />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="WhatsApp"
                                        required
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full p-2 pl-10 rounded bg-gray-800 text-white placeholder-gray-400 border border-gray-700 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            )}
                        </div>

                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.8 }}

                            onClick={isLogin ? handleLogin : handleRegister}
                            className="mt-4 w-full cursor-pointer bg-yellow-500 text-black font-semibold p-2 rounded hover:bg-yellow-400"
                        >
                            {isLogin ? 'Login' : 'Register'}
                        </motion.button>
                        <div className="mt-4 text-sm">
                            {isLogin ? (
                                <p>
                                    Don't have an account?{" "}
                                    <span
                                        className="text-blue-400 cursor-pointer"
                                        onClick={() => setIsLogin(false)}
                                    >
                                        Register here
                                    </span>
                                </p>
                            ) : (
                                <p>
                                    Already have an account?{" "}
                                    <span
                                        className="text-blue-400 cursor-pointer"
                                        onClick={() => setIsLogin(true)}
                                    >
                                        Login here
                                    </span>
                                </p>
                            )}
                        </div>
                    </div>
                </div>
                {loading && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
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

            <AnimatePresence>
                {showPopup && <UopupRegisterSuccess setShowPopup={setShowPopup} />}
            </AnimatePresence>
            <AnimatePresence>
                {accAtive && <AccountInactiveLogin setAccAtive={setAccAtive} userData={inactiveUserData} />}
            </AnimatePresence>
        </div>
    );
}
