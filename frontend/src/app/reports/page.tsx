"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Search, Calendar } from "lucide-react";
import axios from "axios";
import FilterBar from "@/components/FilterBar";
import Link from "next/link";

const CACHE_KEY = "civiclens_reports_cache";
const CACHE_TTL = 60 * 1000; // 60 seconds

function FloatingLoader() {
    return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="relative">
                {/* Outer ring */}
                <div className="w-16 h-16 rounded-full border-4 border-slate-100" />
                {/* Spinning arc */}
                <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-green-500 animate-spin" />
                {/* Inner pulsing dot */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse" />
                </div>
            </div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest animate-pulse">
                Loading Reports...
            </p>
        </div>
    );
}

export default function MyReports() {
    const [reports, setReports] = useState<any[]>([]);
    const [filter, setFilter] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 1. Show cached data instantly
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                const { data, ts } = JSON.parse(cached);
                if (Date.now() - ts < CACHE_TTL && Array.isArray(data)) {
                    setReports(data);
                    setLoading(false);
                }
            }
        } catch (_) {}

        // 2. Always fetch fresh in background
        const fetchReports = async () => {
            try {
                const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/reports`);
                if (Array.isArray(res.data)) {
                    setReports(res.data);
                    setLoading(false);
                    try {
                        localStorage.setItem(CACHE_KEY, JSON.stringify({ data: res.data, ts: Date.now() }));
                    } catch (_) {}
                }
            } catch (err) {
                console.error("Failed to fetch reports:", err);
                setLoading(false);
            }
        };
        fetchReports();

        // 3. Auto-refresh every 15 seconds
        const interval = setInterval(fetchReports, 15000);
        return () => clearInterval(interval);
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Pending': return 'bg-red-50 text-red-600 border-red-200';
            case 'Under Review': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
            case 'Resolved': return 'bg-green-50 text-green-600 border-green-200';
            default: return 'bg-gray-50 text-gray-600 border-gray-200';
        }
    };

    const filteredReports = reports.filter(r => {
        const matchesStatus = filter === "All" || r.status === filter;
        const q = searchQuery.toLowerCase();
        const matchesSearch = !q || (
            r.description?.toLowerCase().includes(q) || 
            r.aiSummary?.toLowerCase().includes(q) || 
            r.category?.toLowerCase().includes(q) ||
            r.location?.address?.toLowerCase().includes(q)
        );
        return matchesStatus && matchesSearch;
    });

    return (
        <main className="min-h-screen bg-slate-50 flex flex-col pt-12 px-5 pb-32">
            <header className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Discover</h1>
                    <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest mt-1">Community Feed</p>
                </div>
                <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                    <Calendar size={18} className="text-slate-400" />
                </div>
            </header>

            {/* Filter Bar */}
            <div className="-mx-5 mb-8">
                <FilterBar 
                    selectedStatus={filter}
                    setSelectedStatus={setFilter}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                />
            </div>

            {/* Reports List */}
            <div className="grid gap-6">
                {loading ? (
                    <FloatingLoader />
                ) : (
                    <AnimatePresence>
                        {filteredReports.map((report) => (
                            <Link href={`/reports/${report._id}`} key={report._id}>
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.3, ease: "easeOut" }}
                                    className="bg-white rounded-[32px] p-2.5 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden group cursor-pointer hover:shadow-xl hover:border-green-100 transition-all duration-500"
                                >
                                    <div className="relative w-full h-52 rounded-[24px] overflow-hidden bg-slate-100">
                                        <img
                                            src={report.imageUrl || "https://images.unsplash.com/photo-1605808360022-d7b38d38865f?auto=format&fit=crop&q=80&w=600"}
                                            alt={report.category}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1605808360022-d7b38d38865f?auto=format&fit=crop&q=80&w=600";
                                            }}
                                        />
                                    </div>

                                    <div className="pt-4 pb-2 px-3">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{report.category}</span>
                                            <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                                                report.status === 'Resolved' ? 'bg-green-100 text-green-700' : 
                                                report.status === 'Under Review' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-600'
                                            }`}>{report.status}</span>
                                        </div>
                                        <h3 className="font-extrabold text-slate-900 text-base leading-tight group-hover:text-green-700 transition-colors line-clamp-2 mb-1.5">
                                            {report.description || report.aiSummary || report.category + " Issue"}
                                        </h3>
                                        <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                                            <MapPin size={10} className="text-slate-300" />
                                            {report.location?.address?.split(',')[0] || "Live Location"} · {report.createdAt ? new Date(report.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently Reported'}
                                        </p>
                                    </div>
                                </motion.div>
                            </Link>
                        ))}
                    </AnimatePresence>
                )}

                {!loading && filteredReports.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Search size={48} className="text-gray-300 mb-4" />
                        <h3 className="text-lg font-bold text-gray-600">No reports found</h3>
                        <p className="text-sm text-gray-400 mt-1">Try changing your filter settings</p>
                    </div>
                )}
            </div>
        </main>
    );
}
