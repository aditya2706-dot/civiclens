"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { UserPlus, Shield, UserCheck, Clock, CheckCircle, X, Phone, MapPin, Briefcase } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function StaffManagement({ user }: { user: any }) {
    const [staff, setStaff] = useState<{registered: any[], pending: any[]}>({ registered: [], pending: [] });
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [formData, setFormData] = useState({
        phone: "",
        ward: user?.ward || "",
        department: "Administration",
        role: "authority"
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const fetchStaff = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/auth/staff`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStaff(res.data);
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch staff", err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStaff();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError("");
        try {
            const token = localStorage.getItem("token");
            await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/add-official`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIsAdding(false);
            setFormData({ ...formData, phone: "" });
            fetchStaff();
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to authorize official");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500 font-bold animate-pulse">Initializing Hierarchy...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-slate-900 border border-white/5 p-4 rounded-3xl">
                <div>
                    <h2 className="text-white font-black uppercase italic tracking-wider flex items-center gap-2">
                        <Shield className="text-green-500" size={18} />
                        Mission Hierarchy
                    </h2>
                    <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mt-1">
                        {user?.role === 'admin' ? "Global Fleet Management" : `Ward ${user?.ward} Zonal Staff`}
                    </p>
                </div>
                <button 
                    onClick={() => setIsAdding(true)}
                    className="bg-green-600 hover:bg-green-500 text-white font-black text-[10px] uppercase tracking-widest px-4 py-2 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-green-600/20"
                >
                    <UserPlus size={14} strokeWidth={3} />
                    Authorize Staff
                </button>
            </div>

            {/* Registered Staff */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                    <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                        <UserCheck size={14} className="text-blue-500" /> Recorded Officials
                    </h3>
                    {staff.registered.map((s) => (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            key={s._id} 
                            className="bg-slate-900 border border-white/5 p-4 rounded-2xl flex items-center gap-4 hover:bg-slate-800 transition-colors"
                        >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.role === 'supervisor' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'}`}>
                                <Shield size={24} />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-white font-black text-sm uppercase tracking-tight">{s.name}</h4>
                                <div className="flex gap-3 mt-1">
                                    <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest flex items-center gap-1">
                                        <Briefcase size={10} /> {s.department}
                                    </p>
                                    <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest flex items-center gap-1">
                                        <MapPin size={10} /> {s.ward}
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <span className="text-[8px] bg-green-500/10 text-green-500 font-black px-2 py-0.5 rounded-full uppercase tracking-widest border border-green-500/20">
                                    Active
                                </span>
                                <span className="text-[8px] text-slate-600 font-bold uppercase tracking-widest">{s.role}</span>
                            </div>
                        </motion.div>
                    ))}
                    {staff.registered.length === 0 && <p className="text-slate-600 text-[10px] p-4 text-center italic">No registered staff found.</p>}
                </div>

                {/* Pending Staff */}
                <div className="space-y-4">
                    <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                        <Clock size={14} className="text-slate-500" /> Pending Enrollment
                    </h3>
                    {staff.pending.map((s) => (
                        <div key={s._id} className="bg-slate-950 border border-dashed border-white/10 p-4 rounded-2xl flex items-center gap-4 opacity-70">
                            <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-slate-500 border border-white/5">
                                <Phone size={20} />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-slate-400 font-bold text-sm tracking-tight">{s.phone}</h4>
                                <p className="text-slate-600 text-[9px] font-bold uppercase tracking-widest mt-1">
                                    Pre-Authorized for {s.ward} • {s.department}
                                </p>
                            </div>
                            <span className="text-[8px] bg-slate-900 text-slate-500 font-black px-2 py-0.5 rounded-full uppercase tracking-widest border border-white/5">
                                Pending
                            </span>
                        </div>
                    ))}
                    {staff.pending.length === 0 && <p className="text-slate-600 text-[10px] p-4 text-center italic">No pending invitations.</p>}
                </div>
            </div>

            {/* Add Official Modal */}
            <AnimatePresence>
                {isAdding && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        className="fixed inset-0 z-[2000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }} 
                            animate={{ scale: 1, y: 0 }} 
                            className="bg-slate-900 border border-white/10 w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl shadow-green-500/10"
                        >
                            <div className="p-8 pb-4 flex justify-between items-center border-b border-white/5">
                                <div>
                                    <h3 className="text-white font-black text-xl uppercase italic group flex items-center gap-2">
                                        <UserPlus className="text-green-500" size={20} />
                                        Authorize Official
                                    </h3>
                                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Provision secured access credentials</p>
                                </div>
                                <button onClick={() => setIsAdding(false)} className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            
                            <form onSubmit={handleSubmit} className="p-8 space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-slate-500 text-[9px] font-black uppercase tracking-widest ml-1">Phone Number</label>
                                    <input 
                                        type="tel" required placeholder="+91 00000 00000"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                        className="w-full bg-black border border-white/5 text-white font-bold p-4 rounded-2xl focus:ring-2 focus:ring-green-500/30 transition-all outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-slate-500 text-[9px] font-black uppercase tracking-widest ml-1">Ward</label>
                                        <input 
                                            type="text" required disabled={user?.role === 'supervisor'}
                                            value={formData.ward}
                                            onChange={(e) => setFormData({...formData, ward: e.target.value})}
                                            className="w-full bg-black border border-white/5 text-white font-bold p-4 rounded-2xl disabled:opacity-50 outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-slate-500 text-[9px] font-black uppercase tracking-widest ml-1">Role</label>
                                        <select 
                                            value={formData.role}
                                            onChange={(e) => setFormData({...formData, role: e.target.value})}
                                            className="w-full bg-black border border-white/5 text-white font-bold p-4 rounded-2xl outline-none"
                                        >
                                            <option value="authority">Official</option>
                                            <option value="supervisor">Supervisor</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-slate-500 text-[9px] font-black uppercase tracking-widest ml-1">Department</label>
                                    <select 
                                        value={formData.department}
                                        onChange={(e) => setFormData({...formData, department: e.target.value})}
                                        className="w-full bg-black border border-white/5 text-white font-bold p-4 rounded-2xl outline-none"
                                    >
                                        <option value="Cleaning">Cleaning</option>
                                        <option value="Electricity">Electricity</option>
                                        <option value="Water">Water</option>
                                        <option value="Roads">Roads</option>
                                        <option value="Health">Health</option>
                                        <option value="Administration">Administration</option>
                                    </select>
                                </div>

                                {error && <p className="text-red-500 text-[10px] font-bold text-center uppercase tracking-widest">{error}</p>}

                                <button 
                                    type="submit" disabled={submitting}
                                    className="w-full bg-green-600 hover:bg-green-500 text-white font-black text-sm uppercase tracking-[0.2em] py-4 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl shadow-green-600/20 disabled:opacity-50"
                                >
                                    {submitting ? <Clock size={18} className="animate-spin" /> : <CheckCircle size={18} strokeWidth={3} />}
                                    Finalize Authorization
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
