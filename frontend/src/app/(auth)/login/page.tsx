"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import axios from "axios";
import { ArrowRight, Mail, Lock, Phone, User } from "lucide-react";
import { motion } from "framer-motion";

export default function Login() {
    const router = useRouter();
    const [loginType, setLoginType] = useState<"citizen" | "authority">("citizen");
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
                email: identifier,
                password
            });

            if (res.data && res.data.token) {
                localStorage.setItem("token", res.data.token);
                if (res.data.role === 'authority' || res.data.role === 'admin') {
                    router.push("/authority/dashboard");
                } else {
                    router.push("/settings");
                }
            }
        } catch (err: any) {
            setError(err.response?.data?.message || "Invalid credentials");
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
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-800 to-green-500 mb-2">
                        CivicAI
                    </h1>
                    <p className="text-gray-500">Welcome back! Sign in to continue your civic journey.</p>
                </div>

                <div className="flex bg-gray-200/50 p-1 rounded-2xl mb-8">
                    <button
                        type="button"
                        onClick={() => setLoginType('citizen')}
                        className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${loginType === 'citizen' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Citizen Portal
                    </button>
                    <button
                        type="button"
                        onClick={() => setLoginType('authority')}
                        className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${loginType === 'authority' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Government Portal
                    </button>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-500 text-sm font-medium p-3 rounded-xl mb-4 text-center">
                        {error}
                    </div>
                )}
                <form className="space-y-4" onSubmit={handleLogin}>
                    <div className="space-y-1">
                        <label className="text-sm font-semibold text-gray-700 ml-1">
                            {loginType === 'citizen' ? 'Email Address' : 'Username or Email'}
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                {loginType === 'citizen' ? <Mail size={18} className="text-gray-400" /> : <User size={18} className="text-gray-400" />}
                            </div>
                            <input
                                type={loginType === 'citizen' ? 'email' : 'text'}
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                placeholder={loginType === 'citizen' ? 'you@example.com' : 'johndoe'}
                                required
                                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <div className="flex justify-between items-center ml-1">
                            <label className="text-sm font-semibold text-gray-700">Password</label>
                            <a href="#" className="text-xs font-semibold text-green-600 hover:text-green-700">Forgot?</a>
                        </div>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Lock size={18} className="text-gray-400" />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all shadow-sm"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full bg-green-500 text-white font-bold py-4 rounded-2xl transition-colors shadow-lg shadow-green-200 flex justify-center items-center gap-2 mt-6 ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-green-600'}`}
                    >
                        {loading ? 'Signing In...' : <>Sign In <ArrowRight size={18} /></>}
                    </button>
                </form>

                {loginType === 'citizen' ? (
                    <p className="text-center text-sm text-gray-500 mt-8">
                        Don't have an account?{' '}
                        <Link href="/register" className="font-bold text-green-600 hover:text-green-700 transition-colors">
                            Sign up
                        </Link>
                    </p>
                ) : (
                    <div className="mt-8 text-center">
                        <p className="text-sm text-gray-500 mb-2">First time logging into your official account?</p>
                        <Link href="/authority-setup" className="font-bold text-green-600 hover:text-green-700 transition-colors bg-green-50 px-4 py-2 rounded-xl inline-block">
                            Verify Phone & Set Password →
                        </Link>
                    </div>
                )}
            </motion.div>
        </main>
    );
}
