"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import BottomNav from "@/components/BottomNav";
import { motion } from "framer-motion";
import { Loader2, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function WardStatsPage() {
    const [stats, setStats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/reports/stats/ward`);
                setStats(res.data);
            } catch (error) {
                console.error("Failed to fetch ward stats", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const totalCityReports = stats.reduce((acc, curr) => acc + curr.totalReports, 0);
    const totalResolved = stats.reduce((acc, curr) => acc + curr.resolvedReports, 0);
    const overallResolutionRate = totalCityReports > 0 ? ((totalResolved / totalCityReports) * 100).toFixed(1) : 0;

    return (
        <main className="min-h-screen bg-gray-50 pb-28">
            {/* Header */}
            <header className="bg-gradient-to-r from-green-700 to-green-600 text-white p-6 pt-12 rounded-b-[2.5rem] shadow-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="relative z-10">
                    <h1 className="text-3xl font-black mb-1">Ward Analytics</h1>
                    <p className="text-green-100 text-sm font-medium">Tracking civic responsiveness across the city.</p>
                </div>
            </header>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="animate-spin text-green-500 w-10 h-10" />
                </div>
            ) : (
                <div className="px-5 -mt-6 relative z-20 space-y-6">
                    {/* Top Level KPIs */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-center">
                            <div className="flex items-center gap-2 mb-2 text-gray-500 text-sm font-bold uppercase tracking-wide">
                                <TrendingUp size={16} className="text-blue-500" /> Total Issues
                            </div>
                            <span className="text-3xl font-black text-gray-800">{totalCityReports}</span>
                        </div>
                        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-center">
                            <div className="flex items-center gap-2 mb-2 text-gray-500 text-sm font-bold uppercase tracking-wide">
                                <CheckCircle2 size={16} className="text-green-500" /> Resolution
                            </div>
                            <span className="text-3xl font-black text-green-600">{overallResolutionRate}%</span>
                        </div>
                    </div>

                    {/* Chart Container */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white p-5 pt-6 rounded-3xl shadow-sm border border-gray-100"
                    >
                        <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <AlertTriangle size={20} className="text-orange-500" /> 
                            Reports by Ward
                        </h2>
                        
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={stats}
                                    margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis 
                                        dataKey="ward" 
                                        tick={{fontSize: 10, fontWeight: 600, fill: '#6b7280'}} 
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis 
                                        tick={{fontSize: 10, fontWeight: 600, fill: '#6b7280'}} 
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip 
                                        cursor={{fill: '#f9fafb'}}
                                        contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                                    />
                                    <Legend wrapperStyle={{fontSize: '12px', fontWeight: 600, paddingTop: '10px'}} />
                                    <Bar dataKey="pendingReports" name="Pending" stackId="a" fill="#f97316" radius={[0, 0, 4, 4]} />
                                    <Bar dataKey="resolvedReports" name="Resolved" stackId="a" fill="#22c55e" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    {/* List View */}
                    <div className="space-y-3 pb-6">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest px-2">Detailed Breakdown</h3>
                        {stats.map((wardStat) => (
                            <div key={wardStat.ward} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                                <div>
                                    <h4 className="font-bold text-gray-900">{wardStat.ward}</h4>
                                    <p className="text-xs text-gray-500 font-medium">{wardStat.totalReports} Reports Total</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-lg font-black text-green-600">{Math.round(wardStat.resolutionRate)}%</div>
                                    <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Fixed</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <BottomNav />
        </main>
    );
}
