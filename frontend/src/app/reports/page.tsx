"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Search, Calendar } from "lucide-react";
import axios from "axios";
import FilterBar from "@/components/FilterBar";
import Link from "next/link";

export default function MyReports() {
    const [reports, setReports] = useState<any[]>([]);
    const [filter, setFilter] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/reports`);
                if (Array.isArray(res.data)) {
                    setReports(res.data);
                }
            } catch (err) {
                console.error("Failed to fetch reports:", err);
            }
        };
        fetchReports();
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
        const matchesSearch = r.aiSummary?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              r.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              r.location?.address?.toLowerCase().includes(searchQuery.toLowerCase());
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
                                <div className="relative w-full h-52 rounded-[24px] overflow-hidden">
                                    <img
                                        src={report.imageUrl || "https://images.unsplash.com/photo-1605808360022-d7b38d38865f?auto=format&fit=crop&q=80&w=600"}
                                        alt={report.category}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
                                    />
                                    <div className="absolute top-4 left-4">
                                        <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-xl flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                            <span className="text-[10px] font-black text-slate-800 uppercase tracking-wider">
                                                {report.category}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="absolute bottom-4 left-4 right-4">
                                         <div className="glass-effect p-3 rounded-2xl flex justify-between items-center shadow-2xl">
                                            <div className="flex items-center gap-2 text-white">
                                                <MapPin size={12} className="text-green-400" />
                                                <span className="text-[10px] font-bold truncate max-w-[150px]">
                                                    {report.location?.address?.split(',')[0] || "Live Location"}
                                                </span>
                                            </div>
                                            <span className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-wider ${
                                                report.status === 'Resolved' ? 'bg-green-500/90 text-white' : 
                                                report.status === 'Under Review' ? 'bg-yellow-500/90 text-white' : 'bg-red-500/90 text-white'
                                            }`}>
                                                {report.status}
                                            </span>
                                         </div>
                                    </div>
                                </div>

                                <div className="pt-4 pb-2 px-3">
                                    <h3 className="font-extrabold text-slate-900 text-base leading-tight group-hover:text-green-700 transition-colors line-clamp-2 mb-1">
                                        {report.aiSummary || report.category + " Issue"}
                                    </h3>
                                    <p className="text-[11px] text-slate-400 font-medium">
                                        {report.createdAt ? new Date(report.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently Reported'}
                                    </p>
                                </div>
                            </motion.div>
                        </Link>
                    ))}
                </AnimatePresence>

                {filteredReports.length === 0 && (
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
