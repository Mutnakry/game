'use client';
import { useState } from "react";
import { FaUser, FaPhoneAlt, FaRegEyeSlash, FaRegEye } from "react-icons/fa";
import { PiLockKey } from "react-icons/pi";
import { auth, firestore } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

export default function page() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isLogin, setIsLogin] = useState<boolean>(true);

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert("Login Successful!");
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleRegister = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(firestore, "users", userCredential.user.uid), {
        username,
        phone,
      });
      alert("Registration Successful!");
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-4">
      <h1 className="text-3xl font-bold text-red-600 mb-6">CRASH977</h1>
      
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
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full p-2 pl-10 rounded bg-gray-800 text-white placeholder-gray-400 border border-gray-700 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <FaUser />
              </div>
              <input
                type="email"
                placeholder="Email"
                value={email}
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
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2 pl-10 rounded bg-gray-800 text-white placeholder-gray-400 border border-gray-700 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            onClick={isLogin ? handleLogin : handleRegister}
            className="mt-4 w-full cursor-pointer bg-yellow-500 text-black font-semibold p-2 rounded hover:bg-yellow-400"
          >
            {isLogin ? 'Login' : 'Register'}
          </button>
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

      {/* Game Images */}
      <div className="mt-8 flex space-x-4">
        <img
          src="https://t4.ftcdn.net/jpg/04/42/21/53/360_F_442215355_AjiR6ogucq3vPzjFAAEfwbPXYGqYVAap.jpg"
          width={100}
          height={50}
          alt="JetX"
        />
        <img
          src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRXn8BNx6JAauM_mcWo9Ykmg9YRdglXdnXK-g&s"
          width={100}
          height={50}
          alt="Game"
        />
      </div>
    </div>
  );
}

