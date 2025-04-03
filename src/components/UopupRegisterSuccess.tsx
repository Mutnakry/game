import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from "framer-motion"

interface UopupRegisterSuccessProps {
    setShowPopup: React.Dispatch<React.SetStateAction<boolean>>;
}
const UopupRegisterSuccess: React.FC<UopupRegisterSuccessProps> = ({ setShowPopup }) => {
    const router = useRouter();
    const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        if (target.id === 'popup-overlay') {
            setShowPopup(false);
        }
    };
    useEffect(() => {
        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, []);

    return (
        <motion.div
            id="popup-overlay"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 "
        >
            <div
                className="bg-white text-black p-6 rounded-lg text-center w-80"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-lg font-semibold mb-2">Registration Completed!</h3>
                <p className="mb-4">Hi Dear! Your registration is successful.</p>
                <p>Please contact our customer service to activate your account!</p>
                <p className="mt-2 font-semibold text-blue-500">Contact: +123 456 7890</p>
                <button
                    className="mt-4 bg-yellow-500 text-black font-semibold p-2 rounded hover:bg-yellow-400 w-full"
                    onClick={() => {
                        setShowPopup(false);
                        router.push("/backend");
                    }}
                >
                    OK
                </button>
            </div>
        </motion.div>

    );
};

export default UopupRegisterSuccess;

