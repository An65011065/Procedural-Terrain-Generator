import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

const WASDKey = ({ letter }) => (
    <div className="w-10 h-10 m-0.5 flex items-center justify-center bg-white bg-opacity-20 backdrop-filter backdrop-blur-sm rounded-lg border border-white border-opacity-30 text-[#4A4A4A] font-bold text-lg shadow-lg">
        {letter}
    </div>
);

const LoadingScreen = ({ onLoadComplete }) => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress((prevProgress) => {
                if (prevProgress >= 100) {
                    clearInterval(interval);
                    setTimeout(onLoadComplete, 500);
                    return 100;
                }
                return prevProgress + 1;
            });
        }, 50);
        return () => clearInterval(interval);
    }, [onLoadComplete]);

    return (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#F5E8DC]">
            <motion.div
                className="text-center mb-8 text-[#4A4A4A]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 2 }}
            >
                <p className="text-xl font-semibold mb-2">
                    Spread your wings, It's time to fly.
                </p>
                <p className="text-lg mb-1">Make the leap.</p>
                <p className="text-lg">Own the sky.</p>
            </motion.div>

            {/* Loading bar and percentage */}
            <div className="w-64 h-2 bg-[#E0CFC1] rounded-full overflow-hidden mb-4">
                <motion.div
                    className="h-full bg-[#4A4A4A]"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                />
            </div>
            <div className="text-[#4A4A4A] text-lg font-semibold mb-8">
                {progress}%
            </div>

            {/* WASD Keys */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
                <div className="flex justify-center mb-0.5">
                    <WASDKey letter="W" />
                </div>
                <div className="flex">
                    <WASDKey letter="A" />
                    <WASDKey letter="S" />
                    <WASDKey letter="D" />
                </div>
            </div>
        </div>
    );
};

export default LoadingScreen;
