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
        <main className="min-h-screen bg-gray-50 flex flex-col pt-8 px-6 pb-32">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">My Reports</h1>
                <p className="text-gray-500 text-sm">Track your contributions to the city</p>
            </header>

            {/* Filter Bar */}
            <div className="-mx-6 mb-6">
                <FilterBar 
                    selectedStatus={filter}
                    setSelectedStatus={setFilter}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                />
            </div>

            {/* Reports List */}
            <div className="space-y-4">
                <AnimatePresence>
                    {filteredReports.map((report) => (
                        <Link href={`/reports/${report._id}`} key={report._id}>
                            <motion.div
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex flex-col group cursor-pointer hover:shadow-md transition-shadow"
                            >
                                <div className="relative w-full h-40 rounded-2xl overflow-hidden mb-4">
                                    <img
                                        src={report.imageUrl || "https://images.unsplash.com/photo-1605808360022-d7b38d38865f?auto=format&fit=crop&q=80&w=600"}
                                        alt={report.category}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute top-3 left-3">
                                        <span className="bg-white/90 backdrop-blur text-gray-800 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                                            {report.category}
                                        </span>
                                    </div>
                                </div>

                                <div className="px-1">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-gray-800 line-clamp-1">{report.aiSummary || report.category + " Issue"}</h3>
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-md border whitespace-nowrap ml-2 ${getStatusColor(report.status)}`}>
                                            {report.status}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-4 text-xs text-gray-500 font-medium">
                                        <div className="flex items-center gap-1">
                                            <MapPin size={12} />
                                            <span className="truncate max-w-[120px]">Lat: {report.location?.lat?.toFixed(4) || "0.0"}, Lng: {report.location?.lng?.toFixed(4) || "0.0"}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Calendar size={12} />
                                            <span>{report.createdAt ? new Date(report.createdAt).toLocaleDateString() : 'Recently'}</span>
                                        </div>
                                    </div>
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
