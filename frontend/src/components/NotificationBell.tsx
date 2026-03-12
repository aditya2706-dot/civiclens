"use client";

import { useState, useEffect } from "react";
import { Bell, Check, Trash2, X } from "lucide-react";
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
                className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center shadow-sm relative hover:bg-green-50 transition-colors"
            >
                <Bell size={24} className="text-gray-600" />
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
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
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 top-14 w-80 bg-white rounded-3xl shadow-xl overflow-hidden z-50 border border-gray-100"
                        >
                            <div className="bg-green-50 px-4 py-3 border-b border-green-100 flex justify-between items-center">
                                <h3 className="font-bold text-green-900">Notifications</h3>
                                {unreadCount > 0 && (
                                    <button 
                                        onClick={markAllAsRead}
                                        className="text-xs font-semibold text-green-600 hover:text-green-800"
                                    >
                                        Mark all as read
                                    </button>
                                )}
                            </div>
                            
                            <div className="max-h-96 overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-6 text-center text-gray-500 text-sm">
                                        No new notifications
                                    </div>
                                ) : (
                                    <ul className="divide-y divide-gray-50">
                                        {notifications.map((notif) => (
                                            <li 
                                                key={notif._id} 
                                                onClick={() => handleNotificationClick(notif)}
                                                className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${!notif.isRead ? 'bg-blue-50/50' : 'opacity-70'}`}
                                            >
                                                <div className="flex justify-between items-start gap-3">
                                                    <div className="flex-1">
                                                        <h4 className={`text-sm ${!notif.isRead ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
                                                            {notif.title}
                                                        </h4>
                                                        <p className="text-xs text-gray-600 mt-1 line-clamp-2 leading-relaxed">
                                                            {notif.message}
                                                        </p>
                                                        <span className="text-[10px] text-gray-400 mt-2 block font-medium">
                                                            {new Date(notif.createdAt).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    {!notif.isRead && (
                                                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-1 shrink-0"></div>
                                                    )}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
