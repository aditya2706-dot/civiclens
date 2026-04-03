"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { LogOut, MapPin, AlertTriangle, CheckCircle, Clock, FileText, CheckCircle2, Clock3, X, Key, Image as ImageIcon, IndianRupee, HardHat, Megaphone, Navigation, ShieldCheck, PieChart, LayoutDashboard, Send, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import NotificationBell from "@/components/NotificationBell";
import Link from "next/link";
import PremiumLoader from "@/components/PremiumLoader";
import StaffManagement from "@/components/StaffManagement";
import DataIntelligence from "@/components/authority/DataIntelligence";
import KanbanBoard from "@/components/authority/KanbanBoard";
import { Users } from "lucide-react";

export default function AuthorityDashboard() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [resolvingReport, setResolvingReport] = useState<any>(null);
    const [resolveOtp, setResolveOtp] = useState("");
    const [resolveFile, setResolveFile] = useState<File | null>(null);
    const [resolveMode, setResolveMode] = useState<"photo" | "otp">("photo");
    const [isResolving, setIsResolving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Broadcast State
    const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
    const [broadcastData, setBroadcastData] = useState({ title: '', message: '', activeHours: 24 });
    const [isBroadcasting, setIsBroadcasting] = useState(false);

    // Tab State
    const [activeTab, setActiveTab] = useState<"ops" | "staff" | "analytics">("ops");
    const [opsView, setOpsView] = useState<"list" | "kanban">("list");
    
    // Internal Ops State
    const [staffList, setStaffList] = useState<any[]>([]);
    const [internalNoteInputs, setInternalNoteInputs] = useState<{[key: string]: string}>({});

    useEffect(() => {
        const fetchDashboardData = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                router.push("/authority/login");
                return;
            }

            try {
                // Check cache for instant paint — show immediately while fresh data loads behind the scenes
                const cachedDocs = sessionStorage.getItem("authority_reports");
                const cachedUser = sessionStorage.getItem("authority_user");
                if (cachedDocs && cachedUser) {
                    setReports(JSON.parse(cachedDocs));
                    setUser(JSON.parse(cachedUser));
                    setLoading(false);
                }

                // Run profile + reports in PARALLEL for maximum speed (was sequential before)
                const [profileRes, reportsRes] = await Promise.all([
                    axios.get(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile`, {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    axios.get(`${process.env.NEXT_PUBLIC_API_URL}/reports/authority`, {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                ]);

                if (profileRes.data.role !== "authority" && profileRes.data.role !== "admin") {
                    router.push("/authority/login");
                    return;
                }

                setUser(profileRes.data);
                setReports(reportsRes.data);

                try {
                    sessionStorage.setItem("authority_reports", JSON.stringify(reportsRes.data.slice(0, 15)));
                    sessionStorage.setItem("authority_user", JSON.stringify(profileRes.data));
                } catch (e) {
                    console.warn("SessionStorage quota exceeded, skipping local caching.", e);
                }

                // Fetch Staff list only for admin/supervisor (non-blocking, runs after above)
                if (profileRes.data.role === 'admin' || profileRes.data.role === 'supervisor') {
                    axios.get(`${process.env.NEXT_PUBLIC_API_URL}/auth/staff`, {
                        headers: { Authorization: `Bearer ${token}` }
                    }).then(staffRes => {
                        setStaffList(staffRes.data.registered || []);
                    }).catch(e => console.error("Staff fetch failed", e));
                }

            } catch (error: any) {
                console.error("Failed to load dashboard data", error);
                if (error?.response?.status === 401) {
                    localStorage.removeItem("token");
                    router.push("/login");
                } else {
                    setError("Could not connect to the server. Please check your connection and try again.");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [router]);

    const handleStatusUpdate = async (id: string, newStatus: string, resolutionFile?: File | null, otp?: string) => {
        try {
            setIsResolving(true);
            const token = localStorage.getItem("token");
            let resolutionImageUrl = undefined;

            if (newStatus === "Resolved" && resolutionFile) {
                // Upload to Cloudinary first
                const cloudinaryData = new FormData();
                cloudinaryData.append("file", resolutionFile);
                cloudinaryData.append("upload_preset", "civic_issue"); // Using the existing preset from Report component
                
                const uploadRes = await axios.post("https://api.cloudinary.com/v1_1/dxzz1b23i/image/upload", cloudinaryData);
                resolutionImageUrl = uploadRes.data.secure_url;
            }

            await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/reports/${id}/status`, { 
                status: newStatus,
                resolutionImageUrl,
                otp
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Update local state
            setReports(reports.map(r => r._id === id ? { ...r, status: newStatus, resolutionImageUrl } : r));
            
            // Close modal
            setResolvingReport(null);
            setResolveOtp("");
            setResolveFile(null);
            
        } catch (error: any) {
            console.error("Failed to update status", error);
            alert(error.response?.data?.message || "Error updating status. Ensure the photo or OTP is valid.");
        } finally {
            setIsResolving(false);
        }
    };

    const handleTransfer = async (id: string, newDepartment: string) => {
        if (!confirm(`Are you sure you want to transfer this issue to ${newDepartment}?`)) return;
        try {
            const token = localStorage.getItem("token");
            await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/reports/${id}/transfer`, 
            { newDepartment }, 
            { headers: { Authorization: `Bearer ${token}` } });
            
            // Remove the report from the current dashboard since it's transferred
            setReports(reports.filter(r => r._id !== id));
        } catch (error) {
            console.error("Failed to transfer report", error);
            alert("Error transferring report.");
        }
    };

    const handleAssign = async (id: string, assignedUserId: string) => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/reports/${id}/assign`, {
                assignedTo: assignedUserId
            }, { headers: { Authorization: `Bearer ${token}` } });
            
            setReports(reports.map(r => r._id === id ? { ...r, assignedTo: res.data.assignedTo, status: res.data.status } : r));
        } catch (error) {
            console.error(error);
            alert("Failed to assign");
        }
    };

    const handleAddNote = async (id: string) => {
        const text = internalNoteInputs[id];
        if (!text || !text.trim()) return;
        
        try {
            const token = localStorage.getItem("token");
            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/reports/${id}/internal-notes`, {
                text
            }, { headers: { Authorization: `Bearer ${token}` } });
            
            setReports(reports.map(r => r._id === id ? { ...r, internalNotes: res.data } : r));
            setInternalNoteInputs(prev => ({...prev, [id]: ''}));
        } catch (error) {
            console.error(error);
            alert("Failed to add note");
        }
    };

    const formatDuplicateCount = (count: number) => {
        const total = count + 1;
        return total > 1 ? `${total} INCIDENTS` : `${total} INCIDENT`;
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        router.push("/login");
    };

    const handleExportCSV = () => {
        let csvContent = "Report ID,Category,Severity,Status,Ward,Address,Date\n";
        reports.forEach(r => {
            const id = r._id;
            const category = r.category || "";
            const severity = r.severity || "";
            const status = r.status || "";
            const ward = r.ward || "";
            const address = `"${(r.location?.address || "").replace(/"/g, '""')}"`;
            const date = new Date(r.createdAt).toLocaleDateString();
            csvContent += `${id},${category},${severity},${status},${ward},${address},${date}\n`;
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `authority_reports_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) {
        return <PremiumLoader message="Verifying Official Identity..." />;
    }

    if (!user) {
        return null; // Will redirect via useEffect
    }

    const totalReports = reports.length;
    const resolvedReports = reports.filter(r => r.status === 'Resolved').length;
    const pendingReports = totalReports - resolvedReports;
    const totalEstimatedBudget = reports.filter(r => r.status !== 'Resolved').reduce((acc, r) => acc + (r.estimatedCost || 0), 0);

    return (
        <main className="min-h-screen bg-slate-50 pb-28 relative font-sans">
            {/* Header */}
            <header className="bg-slate-950 pb-32 md:pb-40 text-white p-6 pt-12 md:p-12 md:pt-16 rounded-b-[2rem] shadow-2xl relative z-0 border-b border-white/5">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center border border-green-500/30">
                                <ShieldCheck className="text-green-500" size={18} />
                            </div>
                            <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white uppercase italic">Command Center</h1>
                        </div>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] opacity-80 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            Secure Operator Session • {user?.name}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsBroadcastModalOpen(true)}
                            className="p-3 bg-red-500/10 rounded-2xl text-red-400 hover:bg-red-500/30 transition-colors border border-red-500/20"
                            title="City Broadcast System"
                        >
                            <Megaphone size={20} />
                        </motion.button>
                        <div className="invert opacity-90 hover:opacity-100 transition-opacity">
                            <NotificationBell />
                        </div>
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleLogout} 
                            className="p-3 bg-slate-800 rounded-2xl text-slate-400 hover:text-white border border-slate-700"
                        >
                            <LogOut size={20} />
                        </motion.button>
                    </div>
                </div>

                {/* Info Pills */}
                <div className="flex gap-3 mt-4">
                    <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-full px-4 py-1.5 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[10px] font-bold tracking-widest uppercase text-slate-300">Dept: <span className="text-white">{user?.department || "All"}</span></span>
                    </div>
                    <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-full px-4 py-1.5 flex items-center gap-2">
                        <MapPin size={10} className="text-blue-400" />
                        <span className="text-[10px] font-bold tracking-widest uppercase text-slate-300">Ward: <span className="text-white">{user?.ward || "City-wide"}</span></span>
                    </div>
                </div>
                </div>
            </header>

            {/* Premium Vercel-Style Stats Overview */}
            <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10 -top-24">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-slate-900 border border-white/5 p-5 md:p-8 flex flex-col text-left group hover:bg-slate-800 transition-all rounded-3xl shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                                <FileText size={14} strokeWidth={2.5} />
                            </div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest hidden sm:inline">Total Load</span>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest sm:hidden">Load</span>
                        </div>
                        <p className="text-3xl md:text-5xl font-black text-white tracking-tighter">{totalReports}</p>
                    </motion.div>
                    
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="bg-slate-900 border border-white/5 p-5 md:p-8 flex flex-col text-left group hover:bg-slate-800 transition-all rounded-3xl shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
                                <Clock3 size={14} strokeWidth={2.5} />
                            </div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest hidden sm:inline">Active Tasks</span>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest sm:hidden">Active</span>
                        </div>
                        <p className="text-3xl md:text-5xl font-black text-amber-400 tracking-tighter">{pendingReports}</p>
                    </motion.div>
                    
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="bg-slate-900 border border-white/5 p-5 md:p-8 flex flex-col text-left group hover:bg-slate-800 transition-all rounded-3xl shadow-2xl col-span-2 md:col-span-1">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                                <CheckCircle2 size={14} strokeWidth={2.5} />
                            </div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest hidden sm:inline">Resolved</span>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest sm:hidden">Fixed</span>
                        </div>
                        <p className="text-3xl md:text-5xl font-black text-emerald-400 tracking-tighter">{resolvedReports}</p>
                    </motion.div>
                </div>

                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}  className="mt-4 bg-white/90 backdrop-blur-2xl border border-white/60 p-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.06)] flex items-center justify-between">
                    <div>
                        <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1 flex items-center gap-1.5">< IndianRupee size={12} className="text-emerald-500" /> AI Budget Projection</p>
                        <h2 className="text-3xl font-black tracking-tighter text-emerald-600">₹{totalEstimatedBudget.toLocaleString('en-IN')}</h2>
                    </div>
                </motion.div>

                <div className="mt-4 flex gap-4">
                    <Link 
                        href="/authority/route"
                        className="flex-1 flex items-center justify-center gap-2 bg-slate-900 border border-slate-800 text-white rounded-2xl py-5 font-black uppercase tracking-widest text-[10px] shadow-2xl hover:bg-slate-800 hover:scale-[1.02] active:scale-95 transition-all"
                    >
                        <Navigation size={16} />
                        Plan Mission
                    </Link>
                    <button 
                        onClick={handleExportCSV}
                        className="flex-1 flex items-center justify-center gap-2 bg-white text-slate-900 border border-slate-200 rounded-2xl py-5 font-black uppercase tracking-widest text-[10px] shadow-sm hover:bg-slate-50 active:scale-95 transition-all"
                    >
                        <FileText size={16} />
                        Sync Data
                    </button>
                </div>
            </div>

            {/* Tabs (Only for Admin/Supervisor) */}
            {(user?.role === 'admin' || user?.role === 'supervisor') && (
                <div className="max-w-7xl mx-auto px-4 md:px-8 mt-4">
                    <div className="bg-white border border-gray-100 p-1 rounded-2xl flex shadow-sm max-w-lg">
                        <button 
                            onClick={() => setActiveTab("analytics")}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'analytics' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <PieChart size={14} />
                            Analytics
                        </button>
                        <button 
                            onClick={() => setActiveTab("ops")}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'ops' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <FileText size={14} />
                            Live Ops
                        </button>
                        <button 
                            onClick={() => setActiveTab("staff")}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'staff' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <Users size={14} />
                            Personnel
                        </button>
                    </div>
                </div>
            )}

            {activeTab === "analytics" ? (
                <div className="max-w-7xl mx-auto px-4 md:px-8 mt-6">
                    <DataIntelligence reports={reports} />
                </div>
            ) : activeTab === "ops" ? (
                <>
                    {/* Reports List */}
                    <div className="max-w-7xl mx-auto px-4 md:px-8 mt-6 space-y-4">
                        <div className="flex justify-between items-center mb-6 px-2 flex-wrap gap-4">
                            <h2 className="text-xl md:text-2xl font-black text-slate-800">Assigned Issues ({pendingReports} Pending)</h2>
                            <div className="flex bg-white rounded-xl border border-gray-100 p-1">
                                <button onClick={() => setOpsView("list")} className={`px-4 py-1.5 rounded-lg text-[10px] uppercase tracking-widest font-black transition-colors ${opsView === 'list' ? 'bg-slate-100 text-slate-800' : 'text-slate-400'}`}>List</button>
                                <button onClick={() => setOpsView("kanban")} className={`px-4 py-1.5 rounded-lg text-[10px] uppercase tracking-widest font-black transition-colors flex items-center gap-1 ${opsView === 'kanban' ? 'bg-slate-100 text-slate-800' : 'text-slate-400'}`}><LayoutDashboard size={12}/> Board</button>
                            </div>
                        </div>

                        {opsView === "kanban" ? (
                            <KanbanBoard reports={reports} handleStatusUpdate={handleStatusUpdate} />
                        ) : reports.length === 0 ? (
                            <div className="bg-white rounded-3xl p-8 text-center border border-gray-100 shadow-sm max-w-2xl mx-auto">
                                <CheckCircle size={56} className="mx-auto text-green-500 mb-4" />
                                <h3 className="text-xl font-black text-slate-800">All Clear!</h3>
                                <p className="text-slate-500 text-sm mt-2">There are no pending reports assigned to your jurisdiction.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                {reports.map((report) => (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.98, y: 20 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        whileHover={{ y: -4 }}
                                        transition={{ duration: 0.3 }}
                                        key={report._id}
                                        className="bg-white rounded-[2rem] overflow-hidden shadow-[0_10px_40px_-15px_rgba(0,0,0,0.08)] border border-slate-100/80 flex flex-col group transition-all"
                                    >
                                        <div className="w-full h-56 xl:h-64 shrink-0 relative overflow-hidden bg-slate-100 block">
                                            <img src={report.imageUrl} alt="Issue" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                            <Link href={`/authority/reports/${report._id}`} className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg text-[10px] font-black uppercase text-indigo-600 shadow-xl hover:bg-white border border-white/20 transition-all flex items-center gap-1 z-10 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0">
                                                Open Dossier <ArrowRight size={12} />
                                            </Link>
                                        </div>
                                        <div className="p-5 flex-1 flex flex-col">
                                            <div className="flex justify-between items-start mb-3 flex-wrap gap-2">
                                                <div className="flex flex-wrap gap-2">
                                                    <span className={`px-3 py-1 text-[8px] uppercase tracking-[0.15em] font-black rounded-lg border ${report.status === 'Resolved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                            report.status === 'In Progress' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                                'bg-amber-50 text-amber-600 border-amber-100'
                                                        }`}>
                                                        {report.status || "Pending"}
                                                    </span>
                                                    {report.isEscalated && (
                                                        <span className="px-3 py-1 text-[8px] tracking-[0.15em] font-black rounded-lg bg-red-500 text-white animate-pulse shadow-sm flex items-center gap-1">
                                                            <AlertTriangle size={10} /> CRITICAL
                                                        </span>
                                                    )}
                                                    {report.duplicateCount > 0 && (
                                                        <span className="px-3 py-1 text-[8px] tracking-[0.15em] font-black text-purple-600 bg-purple-50 rounded-lg flex items-center gap-1 border border-purple-100">
                                                            🔥 {formatDuplicateCount(report.duplicateCount)}
                                                        </span>
                                                    )}
                                               </div>
                                            </div>

                                            <h3 className="text-xl font-black text-slate-800 tracking-tight leading-none mb-1.5 capitalize">{report.category}</h3>
                                            <p className="text-xs text-slate-500 font-medium line-clamp-2 mb-4 flex-1 leading-relaxed">{report.description || report.aiSummary}</p>

                                            <div className="flex flex-wrap items-center text-[10px] uppercase tracking-wider text-slate-500 font-black mb-4 gap-x-4 gap-y-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                <span className="flex items-center gap-1"><MapPin size={12} className="text-blue-500" /> {report.ward || "Zone Alpha"}</span>
                                                <span className="flex items-center gap-1"><Clock size={12} className="text-slate-400" /> {new Date(report.createdAt).toLocaleDateString()}</span>
                                                {report.deadline && (
                                                    <span className={`flex items-center gap-1 ${report.isEscalated ? 'text-red-500' : 'text-amber-600'}`}>
                                                        <Clock3 size={12} /> {new Date(report.deadline).toLocaleDateString()}
                                                    </span>
                                                )}
                                                {report.estimatedCost && report.estimatedCost > 0 ? (
                                                    <span className="flex items-center gap-1 text-emerald-700 font-black">
                                                        <IndianRupee size={12} /> {report.estimatedCost.toLocaleString('en-IN')}
                                                    </span>
                                                ) : null}
                                                {report.location?.lat && report.location?.lng && (
                                                    <a href={`https://www.google.com/maps/dir/?api=1&destination=${report.location.lat},${report.location.lng}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 font-bold hover:underline transition-colors ml-auto">
                                                        <Navigation size={12} /> Route
                                                    </a>
                                                )}
                                            </div>

                                            {/* Authority Action: Status Update and Transfer */}
                                            <div className="mt-auto pt-5 border-t border-slate-50 flex flex-col gap-4">
                                                <div className="flex items-center justify-between flex-wrap gap-4">
                                                    <div className="flex flex-col gap-1.5 flex-1 min-w-[140px]">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Lifecycle Status</span>
                                                        <div className="relative">
                                                            <select
                                                                value={report.status}
                                                                onChange={(e) => {
                                                                    if (e.target.value !== "Resolved") {
                                                                        handleStatusUpdate(report._id, e.target.value);
                                                                    }
                                                                }}
                                                                className="w-full bg-slate-50 border border-slate-200 text-[11px] font-bold rounded-xl px-4 py-2.5 text-slate-700 appearance-none focus:ring-2 focus:ring-green-500/20 outline-none cursor-pointer hover:bg-slate-100 transition-colors"
                                                            >
                                                                <option value="Pending">Pending Review</option>
                                                                <option value="In Progress">In Progress</option>
                                                                <option value="Resolved" disabled>Requires Resolution Proof</option>
                                                            </select>
                                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                                <Clock size={12} />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col gap-1.5 flex-1 min-w-[140px]">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Department Route</span>
                                                        <div className="relative">
                                                            <select
                                                                value={report.department || ""}
                                                                onChange={(e) => handleTransfer(report._id, e.target.value)}
                                                                className="w-full bg-slate-50 border border-slate-200 text-[11px] font-bold rounded-xl px-4 py-2.5 text-slate-700 appearance-none focus:ring-2 focus:ring-blue-500/20 outline-none cursor-pointer hover:bg-slate-100 transition-colors"
                                                            >
                                                                <option value="Sanitation">Sanitation</option>
                                                                <option value="Roads & Infrastructure">Roads & Infra</option>
                                                                <option value="Water & Sewage">Water & Sewage</option>
                                                                <option value="Electricity">Electricity</option>
                                                                <option value="Traffic & Enforcement">Traffic</option>
                                                                <option value="Parks & Horticulture">Parks & Hort</option>
                                                            </select>
                                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                                <Navigation size={12} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col gap-1.5 flex-1 min-w-[140px]">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Assign Official</span>
                                                        <div className="relative">
                                                            <select
                                                                value={report.assignedTo?._id || report.assignedTo || ""}
                                                                onChange={(e) => handleAssign(report._id, e.target.value)}
                                                                className="w-full bg-slate-50 border border-slate-200 text-[11px] font-bold rounded-xl px-4 py-2.5 text-slate-700 appearance-none focus:ring-2 focus:ring-indigo-500/20 outline-none cursor-pointer hover:bg-slate-100 transition-colors"
                                                            >
                                                                <option value="">Unassigned</option>
                                                                {staffList.map(staff => (
                                                                    <option key={staff._id} value={staff._id}>{staff.name} - {staff.role}</option>
                                                                ))}
                                                            </select>
                                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                                <Users size={12} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Internal Notes Section */}
                                                <div className="mt-4 pt-4 border-t border-slate-100">
                                                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-2">
                                                            <FileText size={10} /> Internal Operational Notes
                                                        </h4>
                                                        <div className="space-y-2 mb-3 max-h-24 overflow-y-auto pr-2 custom-scrollbar">
                                                            {report.internalNotes && report.internalNotes.length > 0 ? report.internalNotes.map((note: any, idx: number) => (
                                                                <div key={idx} className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm">
                                                                    <p className="text-[11px] text-slate-700 font-medium">{note.text}</p>
                                                                    <p className="text-[8px] uppercase tracking-widest text-slate-400 mt-1 font-bold">
                                                                        {note.user?.name || 'Authority'} • {new Date(note.createdAt).toLocaleDateString()}
                                                                    </p>
                                                                </div>
                                                            )) : <p className="text-[10px] text-slate-400 italic">No internal notes yet.</p>}
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <input 
                                                                type="text"
                                                                className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500/20 outline-none placeholder:text-slate-400"
                                                                placeholder="Add tactical note..."
                                                                value={internalNoteInputs[report._id] || ''}
                                                                onChange={(e) => setInternalNoteInputs({...internalNoteInputs, [report._id]: e.target.value})}
                                                                onKeyDown={(e) => e.key === 'Enter' && handleAddNote(report._id)}
                                                            />
                                                            <button 
                                                                onClick={() => handleAddNote(report._id)}
                                                                className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition-colors"
                                                            >
                                                                <Send size={12} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                                {report.status !== "Resolved" && (
                                                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50 border-dashed">
                                                        <span className="text-xs font-semibold text-gray-500 uppercase">Mark Resolved</span>
                                                        <button 
                                                            onClick={() => setResolvingReport(report)}
                                                            className="bg-green-50 border border-green-200 hover:bg-green-100 text-green-700 text-xs font-bold px-3 py-2 rounded-lg transition-colors flex items-center gap-2"
                                                        >
                                                            <CheckCircle size={14} /> Resolve Ticket
                                                        </button>
                                                    </div>
                                                )}

                                                {report.status === "Resolved" && report.resolutionImageUrl && (
                                                    <div className="mt-2 text-xs text-green-600 font-medium flex items-center justify-between border border-green-100 bg-green-50 px-3 py-2 rounded-lg">
                                                        <span className="flex items-center gap-1"><CheckCircle size={14} /> Verified Fixed</span>
                                                        <a href={report.resolutionImageUrl} target="_blank" rel="noopener noreferrer" className="underline font-bold text-green-700">View Proof</a>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="max-w-7xl mx-auto px-4 md:px-8 mt-6">
                    <StaffManagement user={user} />
                </div>
            )}

            {/* Resolution Modal */}
            {resolvingReport && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
                    >
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Resolve Issue</h2>
                                <p className="text-xs text-gray-500 font-medium">Ticket: {resolvingReport.category}</p>
                            </div>
                            <button 
                                onClick={() => { setResolvingReport(null); setResolveOtp(""); setResolveFile(null); }}
                                className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-full text-gray-400 hover:text-gray-600 shadow-sm"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="p-6">
                            {/* Tabs */}
                            <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
                                <button 
                                    onClick={() => setResolveMode("photo")}
                                    className={`flex-1 py-2 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${resolveMode === "photo" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                                >
                                    <ImageIcon size={16} /> Photo Proof
                                </button>
                                <button 
                                    onClick={() => setResolveMode("otp")}
                                    className={`flex-1 py-2 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${resolveMode === "otp" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                                >
                                    <Key size={16} /> Citizen PIN
                                </button>
                            </div>

                            {resolveMode === "photo" ? (
                                <div className="space-y-4">
                                    <p className="text-sm text-gray-600 font-medium text-center">Take a photo of the completed repair. This will be publicly visible to citizens.</p>
                                    <label className="border-2 border-dashed border-gray-300 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-blue-300 transition-colors group">
                                        <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                            <ImageIcon size={24} />
                                        </div>
                                        <span className="font-bold text-gray-700">{resolveFile ? resolveFile.name : "Select or Capture Photo"}</span>
                                        <span className="text-xs text-gray-400 mt-1">JPEG, PNG only</span>
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            capture="environment"
                                            className="hidden"
                                            onChange={(e) => {
                                                if (e.target.files?.[0]) setResolveFile(e.target.files[0]);
                                            }}
                                        />
                                    </label>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <p className="text-sm text-gray-600 font-medium text-center">Ask the citizen who reported this issue for their 4-digit Resolution PIN to securely close this ticket without a photo.</p>
                                    <div className="flex justify-center mt-2">
                                        <input 
                                            type="text" 
                                            placeholder="••••"
                                            maxLength={4}
                                            value={resolveOtp}
                                            onChange={(e) => setResolveOtp(e.target.value.replace(/\D/g, ''))}
                                            className="text-center text-4xl font-mono tracking-[0.5em] font-black outline-none border-b-2 border-gray-200 focus:border-blue-500 w-48 pb-2 transition-colors"
                                        />
                                    </div>
                                </div>
                            )}

                            <button
                               disabled={isResolving || (resolveMode === "photo" && !resolveFile) || (resolveMode === "otp" && resolveOtp.length !== 4)}
                               onClick={() => handleStatusUpdate(resolvingReport._id, "Resolved", resolveMode === "photo" ? resolveFile : null, resolveMode === "otp" ? resolveOtp : undefined)}
                               className="w-full mt-8 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl shadow-lg shadow-green-200 transition-all flex justify-center items-center gap-2"
                            >
                                {isResolving ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <CheckCircle size={18} /> Confirm Resolution
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Megaphone Broadcast Modal */}
            {isBroadcastModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
                    >
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-red-50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                                    <Megaphone size={20} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-red-900">Emergency Broadcast</h2>
                                    <p className="text-xs text-red-700 font-medium">Alert citizens in {user?.ward || "All Wards"}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsBroadcastModalOpen(false)}
                                className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-full text-gray-400 hover:text-gray-600 shadow-sm"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Alert Headline</label>
                                <input 
                                    type="text" 
                                    maxLength={40}
                                    value={broadcastData.title}
                                    onChange={e => setBroadcastData({...broadcastData, title: e.target.value})}
                                    placeholder="e.g., Road Closed on Main St"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-medium focus:ring-2 focus:ring-red-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Message Details</label>
                                <textarea 
                                    rows={3}
                                    value={broadcastData.message}
                                    onChange={e => setBroadcastData({...broadcastData, message: e.target.value})}
                                    placeholder="Provide details and instructions for citizens..."
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm focus:ring-2 focus:ring-red-500 outline-none resize-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Active Duration (Hours)</label>
                                <input 
                                    type="number" 
                                    min={1} max={72}
                                    value={broadcastData.activeHours}
                                    onChange={e => setBroadcastData({...broadcastData, activeHours: parseInt(e.target.value) || 24})}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-mono text-center font-bold focus:ring-2 focus:ring-red-500 outline-none"
                                />
                            </div>
                            
                            <button
                                disabled={isBroadcasting || !broadcastData.title.trim() || !broadcastData.message.trim()}
                                onClick={async () => {
                                    try {
                                        setIsBroadcasting(true);
                                        const token = localStorage.getItem("token");
                                        await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/broadcasts`, {
                                            ...broadcastData,
                                            ward: user?.ward
                                        }, {
                                            headers: { Authorization: `Bearer ${token}` }
                                        });
                                        alert("Broadcast sent successfully!");
                                        setIsBroadcastModalOpen(false);
                                        setBroadcastData({ title: '', message: '', activeHours: 24 });
                                    } catch (err) {
                                        console.error("Broadcast failed", err);
                                        alert("Failed to send broadcast.");
                                    } finally {
                                        setIsBroadcasting(false);
                                    }
                                }}
                                className="w-full mt-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-black py-4 rounded-xl shadow-lg shadow-red-200 transition-all flex justify-center items-center gap-2"
                            >
                                {isBroadcasting ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Megaphone size={18} /> DISPATCH ALERT
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </main>
    );
}
