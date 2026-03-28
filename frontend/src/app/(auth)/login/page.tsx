"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import axios from "axios";
import { ArrowRight, Mail, Lock, Phone, User } from "lucide-react";
import { motion } from "framer-motion";
import { useGoogleLogin } from "@react-oauth/google";

// Internal component to isolate the Google hook
function GoogleLoginButton({ 
    onSuccess, 
    onError, 
    loading 
}: { 
    onSuccess: (res: any) => void, 
    onError: () => void, 
    loading: boolean 
}) {
    const handleGoogleLogin = useGoogleLogin({
        onSuccess,
        onError,
    });

    return (
        <button
            type="button"
            onClick={() => handleGoogleLogin()}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3.5 bg-white border-2 border-gray-200 rounded-2xl font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm disabled:opacity-70"
        >
            {loading ? (
                <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
                <svg width="20" height="20" viewBox="0 0 24 24">
                    <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1c-2.9 0-5.45 1.59-6.83 3.96l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                </svg>
            )}
            {loading ? 'Signing you in...' : 'Continue with Google'}
        </button>
    );
}

export default function Login() {
    const router = useRouter();
    const [loginType, setLoginType] = useState<"citizen" | "authority">("citizen");
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [googleLoading, setGoogleLoading] = useState(false);

    const onGoogleSuccess = async (tokenResponse: any) => {
        setGoogleLoading(true);
        setError("");
        try {
            // Exchange the access token for user info, then send to our backend
            const userInfo = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
            });

            // Send to our backend to get a CivicLens JWT
            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/google`, {
                credential: tokenResponse.access_token,
                googleUserInfo: userInfo.data,
            });

            if (res.data?.token) {
                localStorage.setItem('token', res.data.token);
                localStorage.setItem('user', JSON.stringify(res.data));
                router.push('/');
            }
        } catch (err: any) {
            setError('Google sign-in failed. Please try again.');
        } finally {
            setGoogleLoading(false);
        }
    };

    const onGoogleError = () => {
        setError('Google sign-in was cancelled or failed.');
        setGoogleLoading(false);
    };

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
                className="w-full max-sm:px-0 mx-auto max-w-sm"
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
                            <Link href="/forgot-password" className="text-xs font-semibold text-green-600 hover:text-green-700">Forgot?</Link>
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

                {loginType === 'citizen' && (
                    <>
                        {/* Divider */}
                        <div className="flex items-center gap-3 my-6">
                            <div className="flex-1 h-px bg-gray-200" />
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">or</span>
                            <div className="flex-1 h-px bg-gray-200" />
                        </div>

                        {/* Google Sign-In Button */}
                        {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
                            <GoogleLoginButton 
                                onSuccess={onGoogleSuccess} 
                                onError={onGoogleError} 
                                loading={googleLoading} 
                            />
                        )}
                    </>
                )}

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
