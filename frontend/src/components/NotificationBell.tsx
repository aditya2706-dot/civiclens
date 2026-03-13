"use client";

import { useState, useEffect } from "react";
import { Bell, Check, Trash2, X, Plus } from "lucide-react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            // Need token here, assuming axios interceptor or localstorage
            const token = localStorage.getItem("token");
            if (!token) return;
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/notifications`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(res.data);
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            const token = localStorage.getItem("token");
            await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/notifications/${id}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
        } catch (error) {
            console.error("Failed to mark as read", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const token = localStorage.getItem("token");
            await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/notifications/read-all`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(notifications.map(n => ({ ...n, isRead: true })));
        } catch (error) {
            console.error("Failed to mark all as read", error);
        }
    };

    const handleNotificationClick = (notif: any) => {
        if (!notif.isRead) markAsRead(notif._id);
        setIsOpen(false);
        if (notif.reportId) {
            // If the user is an authority, they might want to go to their dashboard, otherwise to the report
            if (notif.type === 'NEW_REPORT') {
                router.push(`/authority/dashboard`);
            } else {
                router.push(`/reports/${notif.reportId}`);
            }
        }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="relative z-[1001]">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center shadow-sm relative hover:bg-green-50 hover:border-green-200 group transition-all"
            >
                <Bell size={20} className="text-slate-500 group-hover:text-green-600 transition-colors" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white"></span>
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 15, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            className="absolute right-0 top-14 w-80 bg-white/95 backdrop-blur-2xl rounded-[32px] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] overflow-hidden z-50 border border-white/40"
                        >
                            <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                                <h3 className="font-black text-slate-900 text-sm tracking-tight uppercase">Notifications</h3>
                                {unreadCount > 0 && (
                                    <button 
                                        onClick={markAllAsRead}
                                        className="text-[10px] font-black text-green-600 hover:text-green-800 uppercase tracking-wider"
                                    >
                                        Mark all
                                    </button>
                                )}
                            </div>
                            
                            <div className="max-h-[70vh] overflow-y-auto custom-scrollbar">
                                {notifications.length === 0 ? (
                                    <div className="py-12 px-6 text-center">
                                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                            <Bell size={20} className="text-slate-300" />
                                        </div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">All caught up!</p>
                                    </div>
                                ) : (
                                    <ul className="divide-y divide-slate-50">
                                        {notifications.map((notif) => (
                                            <li 
                                                key={notif._id} 
                                                onClick={() => handleNotificationClick(notif)}
                                                className={`p-5 hover:bg-slate-50 cursor-pointer transition-all duration-300 ${!notif.isRead ? 'bg-green-50/30' : 'opacity-60'}`}
                                            >
                                                <div className="flex gap-4">
                                                    <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center ${
                                                        notif.type === 'NEW_REPORT' ? 'bg-blue-100 text-blue-600' : 
                                                        notif.type === 'STATUS_UPDATE' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'
                                                    }`}>
                                                        {notif.type === 'NEW_REPORT' ? <Plus size={18} /> : <Check size={18} />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className={`text-sm leading-tight ${!notif.isRead ? 'font-black text-slate-900' : 'font-bold text-slate-600'}`}>
                                                            {notif.title}
                                                        </h4>
                                                        <p className="text-xs text-slate-500 mt-1 lines-clamp-2 leading-relaxed font-medium">
                                                            {notif.message}
                                                        </p>
                                                        <span className="text-[9px] text-slate-400 mt-2 block font-black uppercase tracking-wider">
                                                            {new Date(notif.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            <div className="p-4 bg-slate-50/30 border-t border-slate-100 text-center">
                                <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">
                                    View Settings
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
