"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { Phone, CheckCircle, Shield, ArrowRight, User, Lock, Mail } from "lucide-react";
import { motion } from "framer-motion";

export default function AuthoritySetup() {
    const router = useRouter();
    const [step, setStep] = useState<1 | 2>(1);
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/send-otp`, { phone });
            setStep(2);
            setSuccessMessage("OTP sent successfully! Check the terminal console for the simulated SMS.");
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to send OTP. Is your number pre-approved?");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify-otp`, {
                phone,
                otp,
                username,
                email,
                password,
                name
            });

            if (res.data && res.data.token) {
                localStorage.setItem("token", res.data.token);
                router.push("/authority/dashboard");
            }
        } catch (err: any) {
            setError(err.response?.data?.message || "Invalid OTP or configuration error.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-gray-900 flex flex-col justify-center px-6 pb-20 text-white">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-sm mx-auto"
            >
                <div className="text-center mb-8">
                    <Shield size={48} className="mx-auto text-green-500 mb-4" />
                    <h1 className="text-2xl font-bold mb-2">Government Setup</h1>
                    <p className="text-gray-400 text-sm">Verify your pre-approved phone number</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm font-medium p-3 rounded-xl mb-6 text-center">
                        {error}
                    </div>
                )}
                {successMessage && (
                    <div className="bg-green-500/10 border border-green-500/50 text-green-500 text-sm font-medium p-3 rounded-xl mb-6 text-center">
                        {successMessage}
                    </div>
                )}

                {step === 1 ? (
                    <form className="space-y-4" onSubmit={handleSendOtp}>
                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-gray-300 ml-1">Official Phone Number</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Phone size={18} className="text-gray-500" />
                                </div>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="Enter 10-digit number"
                                    required
                                    className="w-full pl-11 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none transition-all placeholder-gray-600"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || phone.length < 10}
                            className={`w-full bg-green-500 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-green-900/20 mt-6 ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-green-600'}`}
                        >
                            {loading ? 'Sending OTP...' : 'Send Verification Code'}
                        </button>
                    </form>
                ) : (
                    <form className="space-y-5" onSubmit={handleVerifyOtp}>
                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-gray-300 ml-1">OTP Code</label>
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                placeholder="6-digit code"
                                required
                                className="w-full px-4 py-3 text-center tracking-[0.5em] text-lg font-bold bg-gray-800 border border-gray-700 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-gray-300 ml-1">Choose a Username</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <User size={18} className="text-gray-500" />
                                </div>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Enter unique username"
                                    required
                                    className="w-full pl-11 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-gray-300 ml-1">Email Address (Optional)</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail size={18} className="text-gray-500" />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="e.g. official@gmail.com"
                                    className="w-full pl-11 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-gray-300 ml-1">New Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock size={18} className="text-gray-500" />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Set a secure password"
                                    required
                                    className="w-full pl-11 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none"
                                />
                            </div>
                            <p className="text-xs text-gray-500 ml-1 mt-1">You will use your Username (or Email) and this Password to login to the Government Portal next time.</p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full flex items-center justify-center gap-2 bg-green-500 text-white font-bold py-4 rounded-2xl transition-all shadow-lg ${loading ? 'opacity-70' : 'hover:bg-green-600'}`}
                        >
                            {loading ? 'Verifying...' : <>Complete Setup <ArrowRight size={18} /></>}
                        </button>
                    </form>
                )}

                <p className="text-center text-sm text-gray-500 mt-8">
                    <Link href="/login" className="font-medium text-gray-400 hover:text-white transition-colors">
                        ← Back to Login
                    </Link>
                </p>
            </motion.div>
        </main>
    );
}
