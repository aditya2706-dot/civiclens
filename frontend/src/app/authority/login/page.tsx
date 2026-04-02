"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import axios from "axios";
import { ArrowRight, User, Lock, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export default function AuthorityLogin() {
    const router = useRouter();
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
                if (res.data.role === 'authority' || res.data.role === 'admin') {
                    localStorage.setItem("token", res.data.token);
                    localStorage.setItem("user", JSON.stringify(res.data));
                    router.push("/authority/dashboard");
                } else {
                    setError("Unauthorized access. This portal is for officials only.");
                }
            }
        } catch (err: any) {
            setError(err.response?.data?.message || "Invalid credentials. Please verify your identity.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-slate-900 flex flex-col justify-center px-6 relative overflow-hidden">
            {/* Background Accents */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full mx-auto max-w-md bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-8 rounded-[2.5rem] shadow-2xl relative z-10"
            >
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-green-500/30">
                        <ShieldCheck className="text-green-500" size={32} />
                    </div>
                    <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Government Portal</h1>
                    <p className="text-slate-400 text-sm font-medium">Secured Entry • Official Access Only</p>
                </div>

                {error && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold p-4 rounded-2xl mb-6 text-center uppercase tracking-widest"
                    >
                        {error}
                    </motion.div>
                )}

                <form className="space-y-5" onSubmit={handleLogin}>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Official ID / Username</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                                <User size={18} />
                            </div>
                            <input
                                type="text"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                placeholder="e.g. ward42_officer"
                                required
                                className="w-full pl-12 pr-4 py-4 bg-slate-900/50 border border-slate-700 rounded-2xl text-white placeholder:text-slate-600 focus:ring-2 focus:ring-green-500/50 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center ml-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Access Password</label>
                            <Link href="/forgot-password" target="_blank" className="text-[10px] font-bold text-green-500 hover:text-green-400 uppercase tracking-widest">Lost Access?</Link>
                        </div>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                                <Lock size={18} />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="w-full pl-12 pr-4 py-4 bg-slate-900/50 border border-slate-700 rounded-2xl text-white placeholder:text-slate-600 focus:ring-2 focus:ring-green-500/50 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full bg-green-600 text-white font-black uppercase tracking-[0.2em] text-xs py-5 rounded-2xl transition-all shadow-xl shadow-green-900/20 flex justify-center items-center gap-3 mt-8 ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-green-500 hover:-translate-y-0.5 active:translate-y-0'}`}
                    >
                        {loading ? 'Verifying...' : <>Authorize Access <ArrowRight size={16} /></>}
                    </button>
                </form>

                <div className="mt-10 pt-8 border-t border-slate-700/50 text-center">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 italic">First time logging into your official account?</p>
                    <Link href="/authority-setup" className="text-[11px] font-black text-green-500 hover:text-green-400 uppercase tracking-[0.1em] border border-green-500/20 px-6 py-3 rounded-xl inline-block bg-green-500/5 transition-colors">
                        Identity Verification →
                    </Link>
                </div>
            </motion.div>

            <div className="mt-8 text-center text-slate-600 text-[10px] font-bold uppercase tracking-[0.3em]">
                CivicLens © 2026 • Secure Infrastructure
            </div>
        </main>
    );
}
