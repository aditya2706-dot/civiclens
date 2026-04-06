'use client';
import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { motion, useInView, useMotionValue, useSpring, animate } from 'framer-motion';

const API = process.env.NEXT_PUBLIC_API_URL;

function AnimatedNumber({ target, suffix = '' }: { target: number; suffix?: string }) {
    const [display, setDisplay] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);
    const inView = useInView(ref, { once: true });

    useEffect(() => {
        if (!inView || target === 0) return;
        const controls = animate(0, target, {
            duration: 1.8,
            ease: 'easeOut',
            onUpdate: v => setDisplay(Math.round(v))
        });
        return controls.stop;
    }, [inView, target]);

    return <span ref={ref}>{display.toLocaleString('en-IN')}{suffix}</span>;
}

interface Stats {
    totalReports: number;
    resolvedReports: number;
    pendingReports: number;
    categoryCounts: Record<string, number>;
    wardCounts: Record<string, number>;
    severityCounts: Record<string, number>;
    resolutionRate: number;
    avgResolutionHours: number | null;
}

export default function TransparencyPortal() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState('');

    useEffect(() => {
        fetchStats();
        setLastUpdated(new Date().toLocaleString('en-IN', {
            day: '2-digit', month: 'long', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        }));
    }, []);

    const fetchStats = async () => {
        try {
            const res = await axios.get(`${API}/reports/stats`);
            const data = res.data;
            const total = data.totalReports || 0;
            const resolved = data.resolvedReports || data.statusCounts?.Resolved || 0;
            setStats({
                totalReports: total,
                resolvedReports: resolved,
                pendingReports: data.statusCounts?.Pending || 0,
                categoryCounts: data.categoryCounts || {},
                wardCounts: data.wardCounts || {},
                severityCounts: data.severityCounts || {},
                resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0,
                avgResolutionHours: data.avgResolutionHours || null,
            });
        } catch (err) {
            console.error('Failed to load transparency stats');
        } finally {
            setLoading(false);
        }
    };

    const catIcons: Record<string, string> = {
        'Pothole': '🕳️', 'Open Dump': '🗑️', 'Litter': '🧹',
        'Sewage': '💧', 'Streetlight': '💡', 'Infrastructure': '🏗️', 'Other': '📋'
    };
    const catColors: Record<string, string> = {
        'Pothole': '#1565C0', 'Open Dump': '#2E7D32', 'Litter': '#E65100',
        'Sewage': '#00695C', 'Streetlight': '#F9A825', 'Infrastructure': '#6A1B9A', 'Other': '#546E7A'
    };

    return (
        <main className="min-h-screen bg-[#030712]" style={{ fontFamily: "'Inter', sans-serif" }}>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />

            {/* Hero Banner */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#0D47A1] via-[#1565C0] to-[#0a2d6e] pt-16 pb-20 px-6">
                <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)',
                    backgroundSize: '60px 60px'
                }} />
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4" />

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-2xl mx-auto text-center relative z-10"
                >
                    <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-6">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        <span className="text-white/80 text-xs font-semibold tracking-wide uppercase">Live Public Dashboard</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
                        Alwar City<br />
                        <span className="text-blue-200">Civic Transparency</span>
                    </h1>
                    <p className="text-blue-200/80 text-base leading-relaxed mb-6">
                        Real-time civic issue tracking for the citizens of Alwar.<br />
                        Every complaint filed. Every resolution tracked.
                    </p>
                    <div className="flex items-center justify-center gap-1.5 text-white/40 text-xs">
                        <span>🕐</span>
                        <span>Last updated: {lastUpdated || 'Loading...'}</span>
                    </div>
                </motion.div>
            </div>

            <div className="max-w-3xl mx-auto px-4 -mt-10 pb-20">

                {/* KPI Strip */}
                {!loading && stats && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-3 gap-3 mb-8"
                    >
                        {[
                            { label: 'Total Complaints', value: stats.totalReports, suffix: '', color: '#1565C0', icon: '📋' },
                            { label: 'Resolved', value: stats.resolvedReports, suffix: '', color: '#1B5E20', icon: '✅' },
                            { label: 'Resolution Rate', value: stats.resolutionRate, suffix: '%', color: stats.resolutionRate >= 70 ? '#1B5E20' : '#E65100', icon: '📈' },
                        ].map((kpi, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-[#0f172a] border border-white/10 rounded-2xl p-4 text-center shadow-xl"
                            >
                                <div className="text-2xl mb-1">{kpi.icon}</div>
                                <div className="text-2xl md:text-3xl font-black" style={{ color: kpi.color }}>
                                    <AnimatedNumber target={kpi.value} suffix={kpi.suffix} />
                                </div>
                                <div className="text-gray-400 text-xs mt-1 font-medium">{kpi.label}</div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                {/* Category Breakdown */}
                {!loading && stats && Object.keys(stats.categoryCounts).length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="bg-[#0f172a] border border-white/10 rounded-2xl p-5 mb-4 shadow-xl"
                    >
                        <h2 className="text-white font-bold text-base mb-4">📊 Issues by Category</h2>
                        <div className="space-y-3">
                            {Object.entries(stats.categoryCounts)
                                .sort((a, b) => b[1] - a[1])
                                .map(([cat, count]) => {
                                    const pct = stats.totalReports > 0 ? Math.round((count / stats.totalReports) * 100) : 0;
                                    const color = catColors[cat] || '#546E7A';
                                    return (
                                        <div key={cat}>
                                            <div className="flex justify-between items-center mb-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-base">{catIcons[cat] || '📋'}</span>
                                                    <span className="text-gray-300 text-sm font-medium">{cat}</span>
                                                </div>
                                                <span className="text-gray-400 text-xs">{count} ({pct}%)</span>
                                            </div>
                                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${pct}%` }}
                                                    transition={{ delay: 0.4, duration: 0.8 }}
                                                    className="h-full rounded-full"
                                                    style={{ backgroundColor: color }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </motion.div>
                )}

                {/* Top Wards */}
                {!loading && stats && Object.keys(stats.wardCounts).length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="bg-[#0f172a] border border-white/10 rounded-2xl p-5 mb-4 shadow-xl"
                    >
                        <h2 className="text-white font-bold text-base mb-4">📍 Complaints by Ward (Top 10)</h2>
                        <div className="space-y-2">
                            {Object.entries(stats.wardCounts)
                                .sort((a, b) => b[1] - a[1])
                                .slice(0, 10)
                                .map(([ward, count], i) => {
                                    const pct = stats.totalReports > 0 ? Math.round((count / stats.totalReports) * 100) : 0;
                                    return (
                                        <div key={ward} className="flex items-center gap-3">
                                            <span className="text-gray-600 text-xs w-5 text-right">{i + 1}</span>
                                            <span className="text-gray-300 text-sm flex-1 truncate">{ward || 'Unassigned'}</span>
                                            <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${pct}%` }}
                                                    transition={{ delay: 0.5 + i * 0.05 }}
                                                    className="h-full bg-blue-500 rounded-full"
                                                />
                                            </div>
                                            <span className="text-gray-500 text-xs w-8 text-right">{count}</span>
                                        </div>
                                    );
                                })}
                        </div>
                    </motion.div>
                )}

                {/* Loading state */}
                {loading && (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                        <p className="text-gray-500 text-sm">Loading city data...</p>
                    </div>
                )}

                {/* No data fallback */}
                {!loading && !stats && (
                    <div className="text-center py-20">
                        <p className="text-gray-500">Unable to load statistics. Please try again later.</p>
                    </div>
                )}

                {/* Footer */}
                <div className="text-center mt-10 space-y-2">
                    <div className="flex items-center justify-center gap-2 text-gray-600 text-xs mb-4">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        <span>Data refreshes live from CivicLens Platform</span>
                    </div>
                    <p className="text-gray-700 text-xs">
                        <span className="font-bold text-gray-600">CivicLens</span> is an AI-powered civic governance platform by Alwar Nagar Parishad.<br />
                        Powered by Google Gemini AI · Built for citizen transparency.
                    </p>
                    <a href="/" className="inline-block mt-3 text-xs text-blue-500 hover:text-blue-400 underline">
                        → Report a civic issue as a citizen
                    </a>
                </div>
            </div>
        </main>
    );
}
