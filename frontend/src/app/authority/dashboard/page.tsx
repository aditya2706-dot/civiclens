"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { LogOut, MapPin, AlertTriangle, CheckCircle, Clock, FileText, CheckCircle2, Clock3 } from "lucide-react";
import { motion } from "framer-motion";
import NotificationBell from "@/components/NotificationBell";
import Link from "next/link";

export default function AuthorityDashboard() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                router.push("/login");
                return;
            }

            try {
                // Verify Profile
                const profileRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (profileRes.data.role !== "authority" && profileRes.data.role !== "admin") {
                    router.push("/settings");
                    return;
                }

                setUser(profileRes.data);

                // Fetch Assigned Reports
                const reportsRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/reports/authority`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setReports(reportsRes.data);

            } catch (error) {
                console.error("Failed to load dashboard data", error);
                router.push("/login");
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [router]);

    const handleStatusUpdate = async (id: string, newStatus: string, resolutionFile?: File) => {
        try {
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
                resolutionImageUrl 
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Update local state
            setReports(reports.map(r => r._id === id ? { ...r, status: newStatus, resolutionImageUrl } : r));
        } catch (error) {
            console.error("Failed to update status", error);
            alert("Error updating status. If resolving, ensure the photo is valid.");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        router.push("/login");
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading Authority Portal...</div>;
    }

    const totalReports = reports.length;
    const resolvedReports = reports.filter(r => r.status === 'Resolved').length;
    const pendingReports = totalReports - resolvedReports;

    return (
        <main className="min-h-screen bg-gray-50 pb-28">
            {/* Header */}
            <header className="bg-gray-900 text-white p-6 pt-12 rounded-b-[2.5rem] shadow-lg sticky top-0 z-50">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h1 className="text-2xl font-bold">Authority Portal</h1>
                        <p className="text-gray-400 text-sm">Welcome back, {user?.name}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="invert">
                            <NotificationBell />
                        </div>
                        <button onClick={handleLogout} className="p-2 bg-gray-800 rounded-full text-red-400 hover:bg-gray-700">
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>

                {/* Info Cards */}
                <div className="flex gap-4 mt-6">
                    <div className="flex-1 bg-gray-800 border border-gray-700 rounded-2xl p-4">
                        <p className="text-xs text-gray-400 mb-1 font-medium uppercase tracking-wider">Department</p>
                        <p className="font-bold text-green-400">{user?.department || "All Departments"}</p>
                    </div>
                    <div className="flex-1 bg-gray-800 border border-gray-700 rounded-2xl p-4">
                        <p className="text-xs text-gray-400 mb-1 font-medium uppercase tracking-wider">Jurisdiction</p>
                        <p className="font-bold text-blue-400">{user?.ward || "City-wide"}</p>
                    </div>
                </div>
            </header>

            {/* Stats Overview */}
            <div className="max-w-3xl mx-auto px-4 mt-6">
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center mb-2">
                            <FileText size={16} className="text-blue-500" />
                        </div>
                        <p className="text-2xl font-black text-gray-800 leading-none mb-1">{totalReports}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
                        <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center mb-2">
                            <Clock3 size={16} className="text-orange-500" />
                        </div>
                        <p className="text-2xl font-black text-gray-800 leading-none mb-1">{pendingReports}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Pending</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
                        <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center mb-2">
                            <CheckCircle2 size={16} className="text-green-500" />
                        </div>
                        <p className="text-2xl font-black text-gray-800 leading-none mb-1">{resolvedReports}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Resolved</p>
                    </div>
                </div>

                <div className="mt-4">
                    <Link 
                        href="/authority/route"
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-2xl py-4 font-black shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
                    >
                        <MapPin size={20} />
                        Plan Today's Route
                    </Link>
                </div>
            </div>

            {/* Reports List */}
            <div className="max-w-3xl mx-auto p-4 mt-2 space-y-4">
                <h2 className="text-xl font-bold text-gray-800 mb-4 px-2">Assigned Issues</h2>

                {reports.length === 0 ? (
                    <div className="bg-white rounded-3xl p-8 text-center border border-gray-100 shadow-sm">
                        <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
                        <h3 className="text-lg font-bold text-gray-800">All Clear!</h3>
                        <p className="text-gray-500 text-sm">There are no pending reports assigned to your jurisdiction.</p>
                    </div>
                ) : (
                    reports.map((report) => (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            key={report._id}
                            className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 flex flex-col md:flex-row"
                        >
                            <img src={report.imageUrl} alt="Issue" className="w-full md:w-48 h-48 object-cover bg-gray-100" />
                            <div className="p-5 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${report.status === 'Resolved' ? 'bg-green-100 text-green-700' :
                                            report.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                                                'bg-orange-100 text-orange-700'
                                        }`}>
                                        {report.status || "Pending"}
                                    </span>
                                    <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded-md flex items-center gap-1">
                                        <AlertTriangle size={12} /> {report.severity || "Unknown"} Impact
                                    </span>
                                </div>

                                <h3 className="text-lg font-bold text-gray-900 mb-1 capitalize">{report.category}</h3>
                                <p className="text-sm text-gray-600 line-clamp-2 mb-3 flex-1">{report.aiSummary}</p>

                                <div className="flex items-center text-xs text-gray-500 font-medium mb-4 gap-4">
                                    <span className="flex items-center gap-1"><MapPin size={14} /> {report.ward || "Unknown Area"}</span>
                                    <span className="flex items-center gap-1"><Clock size={14} /> {new Date(report.createdAt).toLocaleDateString()}</span>
                                </div>

                                {/* Authority Action: Status Update */}
                                <div className="mt-auto pt-4 border-t border-gray-50 flex flex-col gap-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold text-gray-400">Status:</span>
                                        <select
                                            value={report.status}
                                            onChange={(e) => {
                                                if (e.target.value !== "Resolved") {
                                                    handleStatusUpdate(report._id, e.target.value);
                                                }
                                                // If "Resolved", we rely on the file input button below to trigger the update
                                            }}
                                            className="bg-gray-50 border border-gray-200 text-sm font-semibold rounded-lg px-3 py-2 text-gray-800 focus:ring-2 focus:ring-green-500 outline-none"
                                        >
                                            <option value="Pending">Pending</option>
                                            <option value="In Progress">In Progress</option>
                                            <option value="Resolved" disabled>Requires Photo Proof</option>
                                        </select>
                                    </div>
                                    
                                    {report.status !== "Resolved" && (
                                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50 border-dashed">
                                            <span className="text-xs font-semibold text-gray-500 uppercase">Mark Resolved</span>
                                            <label className="cursor-pointer bg-green-50 border border-green-200 hover:bg-green-100 text-green-700 text-xs font-bold px-3 py-2 rounded-lg transition-colors flex items-center gap-2">
                                                <CheckCircle size={14} /> Upload Proof
                                                <input 
                                                    type="file" 
                                                    accept="image/*" 
                                                    className="hidden" 
                                                    onChange={async (e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            alert("Uploading photo and resolving issue...");
                                                            await handleStatusUpdate(report._id, "Resolved", file);
                                                        }
                                                    }}
                                                />
                                            </label>
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
                    ))
                )}
            </div>
        </main>
    );
}
