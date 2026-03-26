"use client";

import { motion } from "framer-motion";

export default function PremiumLoader({ message = "Processing..." }: { message?: string }) {
    return (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/95 backdrop-blur-2xl transition-all duration-700">
            <div className="relative w-20 h-20 flex items-center justify-center">
                {/* Outer Glow */}
                <div className="absolute inset-0 bg-emerald-500/10 blur-2xl rounded-full" />
                
                {/* Google-Inspired Spinning Loader */}
                <svg className="w-full h-full animate-spin" viewBox="0 0 50 50">
                    <circle
                        className="stroke-emerald-500"
                        cx="25"
                        cy="25"
                        r="20"
                        fill="none"
                        strokeWidth="4"
                        strokeLinecap="round"
                        style={{
                            strokeDasharray: '90, 150',
                            strokeDashoffset: '0',
                            animation: 'n-loader 1.5s ease-in-out infinite'
                        }}
                    />
                </svg>
                
                {/* Center Icon */}
                <motion.div 
                    className="absolute inset-0 flex items-center justify-center"
                    animate={{ scale: [0.9, 1.1, 0.9] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                >
                    <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                </motion.div>
            </div>
            
            <p className="mt-8 text-[11px] font-black text-slate-900 tracking-[0.2em] uppercase opacity-40">
                {message}
            </p>

            <style jsx>{`
                @keyframes n-loader {
                    0% { stroke-dashoffset: 0; }
                    50% { stroke-dashoffset: -35; }
                    100% { stroke-dashoffset: -124; }
                }
            `}</style>
        </div>
    );
}
