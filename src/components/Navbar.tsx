"use client";
import React, { useState } from "react";
import { FaBars } from "react-icons/fa6";
import { useRouter } from "next/navigation";

function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    
    const router = useRouter();
    const handleLogout = () => {
        localStorage.removeItem("token"); // Remove token from localStorage
        router.replace("/login");
      };

    return (
        <nav className="fixed top-0 left-0 w-full z-50 bg-gray-900 bg-opacity-85">
            <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto px-4 py-2">
                <div>
                    <span className="bg-gradient-to-r from-white via-green-500 to-blue-500 text-transparent bg-clip-text font-bold text-3xl">
                        Game Crash
                    </span>
                </div>

                {isOpen && (
                    <div
                        className="fixed inset-0 opacity-50 z-20 md:hidden"
                        onClick={() => setIsOpen(false)}
                    ></div>
                )}
                
                <div
                    className={`fixed top-0 right-0 z-20 w-64 h-screen bg-opacity-85 overflow-y-auto transform transition-transform duration-300 ${isOpen ? "translate-x-0 bg-gray-800 bg-opacity-50 mt-13" : "translate-x-full"
                        } md:relative md:translate-x-0 md:w-auto md:h-auto md:flex md:items-center`}
                >
                    <ul className="space-y-4 md:mt-0 mt-10 xl:text-2xl text-center md:xl text-md text-white font-semibold md:flex md:space-y-0 md:space-x-6">
                        <li>
                            <a
                                href=""
                                className="text-white"
                            >
                                Home
                            </a>
                        </li>
                        <li>
                            <a
                                href=""
                                className="text-white"
                            >
                                About
                            </a>
                        </li>
                    </ul>
                </div>
                <button className="text-white" onClick={handleLogout}>
                    Logout
                </button>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="md:hidden text-gray-200 dark:text-white"
                    aria-expanded={isOpen}
                    aria-label="Toggle navigation"
                >
                    <FaBars size={24} />
                </button>
            </div>
        </nav>
    );
}

export default Navbar;
