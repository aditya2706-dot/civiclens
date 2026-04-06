'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Bell, BellOff, BellRing, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API = process.env.NEXT_PUBLIC_API_URL;

// Convert a base64 URL-safe VAPID public key to Uint8Array (required by browser API)
function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const arr = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; i++) arr[i] = rawData.charCodeAt(i);
    return arr;
}

export default function PushNotificationToggle() {
    const [status, setStatus] = useState<'idle' | 'subscribed' | 'unsupported' | 'denied'>('idle');
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState(false);
    const [showToast, setShowToast] = useState<string | null>(null);

    const toast = (msg: string) => {
        setShowToast(msg);
        setTimeout(() => setShowToast(null), 3000);
    };

    useEffect(() => {
        const check = async () => {
            if (!('Notification' in window) || !('serviceWorker' in navigator)) {
                setStatus('unsupported');
                setLoading(false);
                return;
            }
            if (Notification.permission === 'denied') {
                setStatus('denied');
                setLoading(false);
                return;
            }
            try {
                const reg = await navigator.serviceWorker.ready;
                const existing = await reg.pushManager.getSubscription();
                setStatus(existing ? 'subscribed' : 'idle');
            } catch {
                setStatus('idle');
            } finally {
                setLoading(false);
            }
        };
        check();
    }, []);

    const handleEnable = async () => {
        setToggling(true);
        try {
            // Request permission
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                setStatus('denied');
                toast('Notification permission denied. Enable it in browser settings.');
                return;
            }

            // Get VAPID public key from backend
            const keyRes = await axios.get(`${API}/push/vapid-key`);
            const publicKey = keyRes.data.publicKey;
            if (!publicKey) throw new Error('VAPID key not available');

            // Subscribe via browser push manager
            const reg = await navigator.serviceWorker.ready;
            const keyBytes = urlBase64ToUint8Array(publicKey);
            const subscription = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: new Uint8Array(keyBytes.buffer as ArrayBuffer),
            });

            // Send subscription to backend
            const token = localStorage.getItem('token');
            await axios.post(`${API}/push/subscribe`, subscription.toJSON(), {
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
            });

            setStatus('subscribed');
            toast('✅ Notifications enabled! You\'ll receive alerts even when offline.');
        } catch (err: any) {
            console.error('[Push] Enable failed:', err);
            toast('Failed to enable notifications. Please try again.');
        } finally {
            setToggling(false);
        }
    };

    const handleDisable = async () => {
        setToggling(true);
        try {
            const reg = await navigator.serviceWorker.ready;
            const subscription = await reg.pushManager.getSubscription();
            if (subscription) {
                const token = localStorage.getItem('token');
                await axios.delete(`${API}/push/unsubscribe`, {
                    data: { endpoint: subscription.endpoint },
                    headers: { Authorization: `Bearer ${token}` }
                });
                await subscription.unsubscribe();
            }
            setStatus('idle');
            toast('Notifications disabled for this device.');
        } catch (err) {
            toast('Failed to disable. Please try again.');
        } finally {
            setToggling(false);
        }
    };

    if (loading) return null;
    if (status === 'unsupported') return null; // Silently hide on unsupported browsers

    return (
        <>
            {/* Toast */}
            <AnimatePresence>
                {showToast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] bg-slate-900 text-white text-sm font-medium px-5 py-3 rounded-2xl shadow-2xl border border-white/10 max-w-xs text-center"
                    >
                        {showToast}
                    </motion.div>
                )}
            </AnimatePresence>

            {status === 'subscribed' ? (
                <button
                    onClick={handleDisable}
                    disabled={toggling}
                    className="flex items-center gap-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 text-xs font-bold px-3 py-2 rounded-xl transition-colors"
                    title="Push notifications ON — tap to disable"
                >
                    {toggling ? <Loader2 size={14} className="animate-spin" /> : <BellRing size={14} className="animate-pulse" />}
                    <span className="hidden sm:inline">Alerts ON</span>
                </button>
            ) : status === 'denied' ? (
                <button
                    disabled
                    className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400/60 text-xs font-bold px-3 py-2 rounded-xl cursor-not-allowed"
                    title="Notifications blocked. Enable in browser settings."
                >
                    <BellOff size={14} />
                    <span className="hidden sm:inline">Blocked</span>
                </button>
            ) : (
                <button
                    onClick={handleEnable}
                    disabled={toggling}
                    className="flex items-center gap-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 text-xs font-bold px-3 py-2 rounded-xl transition-colors"
                    title="Enable push notifications for this device"
                >
                    {toggling ? <Loader2 size={14} className="animate-spin" /> : <Bell size={14} />}
                    <span className="hidden sm:inline">Enable Alerts</span>
                </button>
            )}
        </>
    );
}
