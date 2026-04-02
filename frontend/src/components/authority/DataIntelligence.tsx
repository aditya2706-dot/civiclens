import React, { useMemo } from 'react';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import { motion } from 'framer-motion';
import { RefreshCw, FileText, Activity, Download } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];

export default function DataIntelligence({ reports }: { reports: any[] }) {
    const downloadCSV = () => {
        const headers = ['ID,Category,Severity,Status,Ward,Duplicate Count,Date'];
        const rows = reports.map(r => 
            `"${r._id}","${r.category}","${r.severity || 'Normal'}","${r.status}","${r.ward || 'N/A'}","${r.duplicateCount || 0}","${new Date(r.createdAt).toLocaleDateString()}"`
        );
        const csvContent = "data:text/csv;charset=utf-8," + headers.concat(rows).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `intelligence_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Process data for charts
    const categoryData = useMemo(() => {
        const counts: Record<string, number> = {};
        reports.forEach((r: any) => {
            counts[r.category] = (counts[r.category] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
    }, [reports]);

    const statusData = useMemo(() => {
        const counts: Record<string, number> = {};
        reports.forEach((r: any) => {
            counts[r.status] = (counts[r.status] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [reports]);

    const trendData = useMemo(() => {
        const last7Days = [...Array(7)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().split('T')[0];
        }).reverse();

        const data = last7Days.map(date => {
            const dayReports = reports.filter(r => r.createdAt.startsWith(date));
            const newIssues = dayReports.length;
            const resolved = dayReports.filter(r => r.status === 'Resolved').length;
            return {
                date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
                New: newIssues,
                Resolved: resolved
            };
        });
        return data;
    }, [reports]);

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 px-2">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20">
                        <Activity size={20} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Data Intelligence</h2>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Real-time Command Analytics</p>
                    </div>
                </div>
                <button 
                    onClick={downloadCSV}
                    className="flex items-center gap-2 bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-600 hover:text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-colors shadow-sm"
                >
                    <Download size={14} />
                    Export CSV
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Trend Chart */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-[100px] -z-0 opacity-50 group-hover:scale-110 transition-transform duration-500" />
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 relative z-10">7-Day Incident Velocity</h3>
                    <div className="h-64 relative z-10 w-full" style={{minWidth: '100%'}}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                                    itemStyle={{ fontSize: '12px' }}
                                />
                                <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '10px' }} />
                                <Line type="monotone" dataKey="New" stroke="#3b82f6" strokeWidth={4} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                <Line type="monotone" dataKey="Resolved" stroke="#10b981" strokeWidth={4} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Category Dist Chart */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-bl-[100px] -z-0 opacity-50 group-hover:scale-110 transition-transform duration-500" />
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 relative z-10">Severity by Category</h3>
                    <div className="h-64 relative z-10 w-full flex items-center justify-center">
                        {categoryData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                                        itemStyle={{ fontSize: '12px' }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-center text-slate-400">
                                <FileText size={32} className="mx-auto mb-2 opacity-50" />
                                <p className="text-xs font-bold">No data available</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
            
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-gradient-to-r from-slate-900 to-indigo-950 p-8 rounded-[2rem] shadow-xl text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <RefreshCw size={100} />
                </div>
                <div className="relative z-10">
                    <h3 className="text-lg font-black tracking-tight mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        SYSTEM HEALTH
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 text-center divide-x divide-white/10 border-t border-white/10 pt-6">
                        {statusData.map(stat => (
                            <div key={stat.name} className="px-2">
                                <p className="text-3xl font-black">{stat.value}</p>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">{stat.name}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
