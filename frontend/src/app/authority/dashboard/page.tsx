"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { LogOut, MapPin, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { motion } from "framer-motion";

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

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        try {
            const token = localStorage.getItem("token");
            await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/reports/${id}/status`, { status: newStatus }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Update local state
            setReports(reports.map(r => r._id === id ? { ...r, status: newStatus } : r));
        } catch (error) {
            console.error("Failed to update status", error);
            alert("Error updating status");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        router.push("/login");
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading Authority Portal...</div>;
    }

    return (
        <main className="min-h-screen bg-gray-50 pb-28">
            {/* Header */}
            <header className="bg-gray-900 text-white p-6 pt-12 rounded-b-[2.5rem] shadow-lg sticky top-0 z-50">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h1 className="text-2xl font-bold">Authority Portal</h1>
                        <p className="text-gray-400 text-sm">Welcome back, {user?.name}</p>
                    </div>
                    <button onClick={handleLogout} className="p-2 bg-gray-800 rounded-full text-red-400 hover:bg-gray-700">
                        <LogOut size={20} />
                    </button>
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

            {/* Reports List */}
            <div className="max-w-3xl mx-auto p-4 mt-4 space-y-4">
                <h2 className="text-xl font-bold text-gray-800 mb-4 px-2">Assigned Issues ({reports.length})</h2>

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
                                <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                                    <span className="text-xs font-semibold text-gray-400">Update Status:</span>
                                    <select
                                        value={report.status}
                                        onChange={(e) => handleStatusUpdate(report._id, e.target.value)}
                                        className="bg-gray-50 border border-gray-200 text-sm font-semibold rounded-lg px-3 py-2 text-gray-800 focus:ring-2 focus:ring-green-500 outline-none"
                                    >
                                        <option value="Pending">Pending</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Resolved">Resolved</option>
                                    </select>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </main>
    );
}
