"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import axios from "axios";
import { Mail, ArrowRight, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function ForgotPassword() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setMessage("");

        try {
            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password`, { email });
            setMessage(res.data.message);
            // After a short delay, redirect to reset-password page
            setTimeout(() => {
                router.push(`/reset-password?email=${encodeURIComponent(email)}`);
            }, 2000);
        } catch (err: any) {
            setError(err.response?.data?.message || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-gray-50 flex flex-col justify-center px-6 pb-20">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-sm mx-auto"
            >
                <button
                    onClick={() => router.back()}
                    className="mb-8 flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                    <ArrowLeft size={18} />
                    <span className="text-sm font-medium">Back to Login</span>
                </button>

                <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold text-gray-800 mb-2">Forgot Password</h1>
                    <p className="text-gray-500">Enter your email and we'll send you an OTP to reset your password.</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-500 text-sm font-medium p-3 rounded-xl mb-4 text-center">
                        {error}
                    </div>
                )}

                {message && (
                    <div className="bg-green-50 text-green-600 text-sm font-medium p-3 rounded-xl mb-4 text-center border border-green-100">
                        {message}
                    </div>
                )}

                <form className="space-y-4" onSubmit={handleForgotPassword}>
                    <div className="space-y-1">
                        <label className="text-sm font-semibold text-gray-700 ml-1">Email Address</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Mail size={18} className="text-gray-400" />
                            </div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all shadow-sm"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full bg-gray-900 text-white font-bold py-4 rounded-2xl transition-colors shadow-lg flex justify-center items-center gap-2 mt-6 ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-black'}`}
                    >
                        {loading ? 'Sending OTP...' : <>Send Reset OTP <ArrowRight size={18} /></>}
                    </button>
                </form>

                <p className="text-center text-sm text-gray-500 mt-8">
                    Remembered your password?{' '}
                    <Link href="/login" className="font-bold text-green-600 hover:text-green-700 transition-colors">
                        Sign in
                    </Link>
                </p>
            </motion.div>
        </main>
    );
}
