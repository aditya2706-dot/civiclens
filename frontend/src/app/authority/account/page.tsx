"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { LogOut, User, ShieldCheck, Mail, MapPin, Building2, HelpCircle } from "lucide-react";
import PremiumLoader from "@/components/PremiumLoader";

export default function AuthorityAccountPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            const token = localStorage.getItem("token");
            if (!token) return router.push("/authority/login");

            try {
                const profileRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (profileRes.data.role !== "authority" && profileRes.data.role !== "admin" && profileRes.data.role !== "supervisor") {
                    router.push("/authority/login");
                    return;
                }
                setUser(profileRes.data);
            } catch (error) {
                console.error("Failed to load profile", error);
                localStorage.removeItem("token");
                router.push("/authority/login");
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        router.push("/authority/login");
    };

    if (loading) return <PremiumLoader message="Verifying clearance..." />;

    return (
        <main className="min-h-screen bg-slate-50 font-sans pb-32">
            {/* Header Identity Badge */}
            <div className="bg-slate-950 pt-16 pb-12 px-6 rounded-b-[3rem] shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-800/40 via-transparent to-transparent pointer-events-none" />
                <div className="max-w-3xl mx-auto flex items-center gap-6 relative z-10">
                    <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center border-4 border-slate-700 shadow-xl overflow-hidden shrink-0">
                        <User size={40} className="text-slate-400" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="text-3xl font-black text-white tracking-tight">{user.name}</h1>
                            {user.role === 'admin' && <ShieldCheck className="text-blue-500 fill-blue-500/20" size={24} />}
                        </div>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{user.role}</p>
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-6 -mt-6 space-y-6">
                {/* Info Card */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 relative z-20">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6">Official Dossier</h3>
                    
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-50 text-slate-500 rounded-xl flex items-center justify-center shrink-0">
                                <Mail size={18} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contact Email</p>
                                <p className="font-bold text-slate-800">{user.email || "N/A"}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-50 text-slate-500 rounded-xl flex items-center justify-center shrink-0">
                                <Building2 size={18} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Department</p>
                                <p className="font-bold text-slate-800">{user.department || "All Departments"}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-50 text-slate-500 rounded-xl flex items-center justify-center shrink-0">
                                <MapPin size={18} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Jurisdiction</p>
                                <p className="font-bold text-slate-800">{user.ward || "All Wards"}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Operations & Support */}
                <div className="bg-white rounded-3xl p-2 shadow-sm border border-slate-100">
                    <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-colors text-left">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                                <HelpCircle size={16} />
                            </div>
                            <span className="font-bold text-slate-800 text-sm">Help & Support Protocol</span>
                        </div>
                    </button>
                    <button 
                        onClick={handleLogout}
                        className="w-full flex items-center justify-between p-4 hover:bg-red-50 rounded-2xl transition-colors group text-left"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-red-50 text-red-600 group-hover:bg-red-100 transition-colors flex items-center justify-center text-left">
                                <LogOut size={16} />
                            </div>
                            <span className="font-bold text-red-600 text-sm">Terminate Session (Log Out)</span>
                        </div>
                    </button>
                </div>
            </div>
        </main>
    );
}
