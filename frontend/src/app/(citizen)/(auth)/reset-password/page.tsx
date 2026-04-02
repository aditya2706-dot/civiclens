"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import axios from "axios";
import { Lock, Key, ArrowRight, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const emailParam = searchParams.get("email");
        if (emailParam) {
            setEmail(emailParam);
        }
    }, [searchParams]);

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);

        try {
            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/reset-password`, {
                email,
                otp,
                newPassword
            });
            setSuccess(true);
            setTimeout(() => {
                router.push("/login");
            }, 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || "Reset failed. Please verify your OTP and try again.");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
            >
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
                    <CheckCircle2 size={40} />
                </div>
                <h1 className="text-2xl font-extrabold text-gray-800 mb-2">Password Reset Successful!</h1>
                <p className="text-gray-500 mb-8">You can now login with your new password. Redirecting to login page...</p>
                <Link
                    href="/login"
                    className="inline-block bg-gray-900 text-white font-bold px-8 py-3 rounded-2xl hover:bg-black transition-colors"
                >
                    Back to Login
                </Link>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm mx-auto"
        >
            <div className="text-center mb-8">
                <h1 className="text-3xl font-extrabold text-gray-800 mb-2">Reset Password</h1>
                <p className="text-gray-500">Enter the OTP sent to <b>{email}</b> and your new password.</p>
            </div>

            {error && (
                <div className="bg-red-50 text-red-500 text-sm font-medium p-3 rounded-xl mb-4 text-center">
                    {error}
                </div>
            )}

            <form className="space-y-4" onSubmit={handleResetPassword}>
                <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700 ml-1">Email Address</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        className="w-full px-4 py-3 bg-gray-100 border border-transparent rounded-2xl outline-none transition-all shadow-sm text-gray-500"
                        readOnly={!!searchParams.get("email")}
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700 ml-1">OTP (6-digit)</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Key size={18} className="text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            placeholder="123456"
                            maxLength={6}
                            required
                            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all shadow-sm"
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700 ml-1">New Password</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Lock size={18} className="text-gray-400" />
                        </div>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all shadow-sm"
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700 ml-1">Confirm New Password</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Lock size={18} className="text-gray-400" />
                        </div>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
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
                    {loading ? 'Resetting Password...' : <>Reset Password <ArrowRight size={18} /></>}
                </button>
            </form>
        </motion.div>
    );
}

export default function ResetPassword() {
    return (
        <main className="min-h-screen bg-gray-50 flex flex-col justify-center px-6 pb-20">
            <Suspense fallback={<div className="text-center">Loading...</div>}>
                <ResetPasswordForm />
            </Suspense>
        </main>
    );
}
