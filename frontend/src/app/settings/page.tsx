"use client";

import { useState, useEffect } from "react";
import { Bell, Shield, CircleHelp, LogOut, ChevronRight, User, Check, X } from "lucide-react";
import Link from "next/link";
import axios from "axios";

export default function Settings() {
    const [notificationsOn, setNotificationsOn] = useState(true);
    const [locationOn, setLocationOn] = useState(false);

    // User Profile State
    const [user, setUser] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState("");
    const [editEmail, setEditEmail] = useState("");
    const [editPassword, setEditPassword] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const res = await axios.get("http://localhost:5001/api/auth/profile", {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setUser(res.data);
                    setEditName(res.data.name);
                    setEditEmail(res.data.email);
                } catch (error) {
                    console.error("Error fetching profile", error);
                }
            }
        };
        fetchProfile();
    }, []);

    const handleSaveProfile = async () => {
        setIsSaving(true);
        const token = localStorage.getItem('token');
        try {
            const payload: any = { name: editName, email: editEmail };
            if (editPassword) payload.password = editPassword;

            const res = await axios.put("http://localhost:5001/api/auth/profile", payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUser(res.data);
            setIsEditing(false);
            setEditPassword("");
        } catch (error) {
            console.error("Error saving profile", error);
            alert("Failed to update profile.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.href = '/login';
    };

    const SettingItem = ({ icon: Icon, title, value, isToggle, toggleState, onToggle }: any) => (
        <div
            onClick={isToggle ? onToggle : undefined}
            className={`flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm mb-3 ${!isToggle ? 'cursor-pointer hover:shadow-md' : 'cursor-pointer'} transition-shadow group`}
        >
            <div className="flex items-center gap-4">
                <div className="p-2 bg-gray-50 rounded-xl group-hover:bg-green-50 transition-colors text-gray-600 group-hover:text-green-600">
                    <Icon size={20} />
                </div>
                <span className="font-medium text-gray-800">{title}</span>
            </div>
            <div className="flex items-center gap-2">
                {value && <span className="text-sm text-gray-500">{value}</span>}

                {isToggle ? (
                    <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out ${toggleState ? 'bg-green-500' : 'bg-gray-300'}`}>
                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-300 ease-in-out ${toggleState ? 'translate-x-6' : 'translate-x-0'}`} />
                    </div>
                ) : (
                    <ChevronRight size={18} className="text-gray-400" />
                )}
            </div>
        </div>
    );

    return (
        <main className="min-h-screen bg-gray-50 flex flex-col pt-8 px-6 pb-32">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Settings</h1>
            </header>

            {/* Profile Card */}
            <div className={`bg-gradient-to-br from-green-600 to-green-800 rounded-3xl p-6 text-white mb-8 shadow-lg shadow-green-200 transition-all ${isEditing ? 'pb-8' : ''}`}>
                {!isEditing ? (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-full flex items-center justify-center shrink-0">
                                <User size={28} />
                            </div>
                            <div className="overflow-hidden">
                                <h2 className="font-bold text-lg leading-tight truncate px-1">{user ? user.name : 'Anonymous User'}</h2>
                                <p className="text-white/80 text-sm truncate px-1">{user ? user.email : 'Login to sync data'}</p>
                            </div>
                        </div>
                        {user ? (
                            <button onClick={() => setIsEditing(true)} className="bg-white/20 hover:bg-white text-white hover:text-green-700 backdrop-blur text-xs font-bold px-4 py-2 rounded-full transition-colors ml-2 shrink-0">
                                Edit
                            </button>
                        ) : (
                            <Link href="/login">
                                <button className="bg-white/20 hover:bg-white text-white hover:text-green-700 backdrop-blur text-xs font-bold px-4 py-2 rounded-full transition-colors ml-2 shrink-0">
                                    Log In
                                </button>
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center mb-2">
                            <h2 className="font-bold text-lg">Edit Profile</h2>
                            <button onClick={() => setIsEditing(false)} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div>
                            <label className="text-xs text-green-100 font-medium ml-1">Full Name</label>
                            <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 mt-1 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-green-100 font-medium ml-1">Email Address</label>
                            <input
                                type="email"
                                value={editEmail}
                                onChange={(e) => setEditEmail(e.target.value)}
                                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 mt-1 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-green-100 font-medium ml-1">New Password (optional)</label>
                            <input
                                type="password"
                                value={editPassword}
                                onChange={(e) => setEditPassword(e.target.value)}
                                placeholder="Leave blank to keep current"
                                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 mt-1 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                            />
                        </div>
                        <button
                            onClick={handleSaveProfile}
                            disabled={isSaving}
                            className={`w-full bg-white text-green-700 font-bold py-3 rounded-xl mt-4 flex items-center justify-center gap-2 transition-colors ${isSaving ? 'opacity-70 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                        >
                            {isSaving ? 'Saving...' : <><Check size={18} /> Save Changes</>}
                        </button>
                    </div>
                )}
            </div>

            <div className="space-y-6">
                <div>
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 ml-2">Preferences</h3>
                    <SettingItem
                        icon={Bell}
                        title="Notifications"
                        isToggle
                        toggleState={notificationsOn}
                        onToggle={() => setNotificationsOn(!notificationsOn)}
                    />
                    <SettingItem
                        icon={Shield}
                        title="Location Tracking"
                        isToggle
                        toggleState={locationOn}
                        onToggle={() => setLocationOn(!locationOn)}
                    />
                </div>

                <div>
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 ml-2">Support</h3>
                    <SettingItem icon={CircleHelp} title="Help Center" />
                </div>

                <div className="pt-4">
                    {user ? (
                        <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 bg-white text-red-500 border border-red-100 font-bold py-4 rounded-2xl hover:bg-red-50 transition-colors">
                            <LogOut size={18} />
                            Sign Out
                        </button>
                    ) : (
                        <Link href="/login" className="block w-full">
                            <button className="w-full flex items-center justify-center gap-2 bg-green-600 text-white font-bold py-4 rounded-2xl hover:bg-green-700 transition-colors">
                                <User size={18} />
                                Log In to your Account
                            </button>
                        </Link>
                    )}
                </div>
            </div>
        </main>
    );
}
