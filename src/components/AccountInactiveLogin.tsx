import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from "framer-motion"

interface UopupRegisterSuccessProps {
    setAccAtive: React.Dispatch<React.SetStateAction<boolean>>;
    userData: {
        email: string;
        username: string;
    } | null;
}
const AccountInactiveLogin: React.FC<UopupRegisterSuccessProps> = ({ setAccAtive, userData }) => {
    const router = useRouter();
    const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        if (target.id === 'popup-overlay') {
            setAccAtive(false);
        }
    };
    useEffect(() => {
        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, []);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
            .then(() => {
                alert("Copied to clipboard!");
            })
            .catch((err) => {
                console.error("Failed to copy: ", err);
            });
    };
    return (
        <motion.div
            id="popup-overlay"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 "
        >
            <div
                className="bg-white text-black p-6 rounded-lg text-center w-80"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-lg font-semibold mb-2 font-KhmerMoul">Registration Completed!</h3>
                <p >Please contact our customer service to activate your account!</p>
                <div className="mt-4 text-left">
                    <p><strong>Email:</strong> {userData?.email}</p>
                    <p><strong>User Name:</strong> {userData?.username}</p>
                    <button onClick={() => copyToClipboard(userData?.email || "")}>Copy</button>
                </div>
                <p className="mt-2 font-KhmerMoul font-semibold text-blue-500">Contact: +123 456 7890</p>
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.8 }}
                    className="mt-4 bg-yellow-500 text-black font-semibold p-2 rounded hover:bg-yellow-400 w-full"
                    onClick={() => {
                        setAccAtive(false);
                    }}
                >
                    OK
                </motion.button>
            </div>
        </motion.div>

    );
};

export default AccountInactiveLogin