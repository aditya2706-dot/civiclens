'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { ShieldCheck, Download, RefreshCw, CheckCircle2, Clock, ExternalLink, Wifi, WifiOff } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL;

interface PortalInfo {
    name: string;
    full_name: string;
    ministry: string;
    status: 'CONNECTED' | 'READY_TO_CONNECT';
    records_ready: number;
    last_sync: string | null;
    color: string;
    icon: string;
}

interface Summary {
    total_reports: number;
    portals: { cpgrams: PortalInfo; sbm: PortalInfo; scm: PortalInfo };
    scm_dashboard: {
        kpis: {
            total_complaints: number;
            resolved_complaints: number;
            resolution_rate_percent: number;
            critical_complaints: number;
        };
        infrastructure_breakdown: Record<string, number>;
    };
}

export default function NationalPortalsPage() {
    const [summary, setSummary] = useState<Summary | null>(null);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState<string | null>(null);
    const [syncResults, setSyncResults] = useState<Record<string, any>>({});

    useEffect(() => {
        fetchSummary();
    }, []);

    const fetchSummary = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API}/national/summary`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSummary(res.data);
        } catch (err) {
            console.error('Failed to fetch national portal summary');
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async (portal: string) => {
        setSyncing(portal);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API}/national/sync/${portal}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSyncResults(prev => ({ ...prev, [portal]: res.data }));
        } catch (err) {
            console.error('Sync failed');
        } finally {
            setSyncing(null);
        }
    };

    const handleExport = async (portal: string, filename: string) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API}/national/export/${portal}`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
        } catch (err) {
            console.error('Export failed');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                    <p className="text-gray-400 text-sm">Loading National Portal Data...</p>
                </div>
            </div>
        );
    }

    const portals = summary?.portals ? Object.entries(summary.portals) : [];

    return (
        <div className="min-h-screen bg-[#0a0f1e] text-white p-4 md:p-8">
            {/* Header */}
            <div className="max-w-5xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-500/20 rounded-xl">
                            <ShieldCheck className="text-blue-400" size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">National Portal Integration</h1>
                            <p className="text-gray-400 text-sm">Government of India — Data Sync Hub</p>
                        </div>
                    </div>

                    {/* Stats Row */}
                    <div className="mt-4 grid grid-cols-3 gap-3">
                        {[
                            { label: 'Total Reports', value: summary?.total_reports || 0, color: 'text-blue-400' },
                            { label: 'Resolution Rate', value: `${summary?.scm_dashboard?.kpis?.resolution_rate_percent || 0}%`, color: 'text-green-400' },
                            { label: 'Critical Issues', value: summary?.scm_dashboard?.kpis?.critical_complaints || 0, color: 'text-red-400' },
                        ].map((stat, i) => (
                            <div key={i} className="bg-white/5 rounded-xl p-3 border border-white/10 text-center">
                                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                                <div className="text-xs text-gray-400 mt-0.5">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Portal Cards */}
                <div className="space-y-4 mb-8">
                    {portals.map(([key, portal], i) => {
                        const syncResult = syncResults[key];
                        const isConnected = portal.status === 'CONNECTED';
                        return (
                            <motion.div
                                key={key}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-white/5 border border-white/10 rounded-2xl p-5"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="text-3xl">{portal.icon}</div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <h3 className="font-bold text-white">{portal.name}</h3>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${isConnected ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                                    {isConnected ? <Wifi size={9} /> : <WifiOff size={9} />}
                                                    {isConnected ? 'LIVE' : 'DEMO MODE'}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-400">{portal.full_name}</p>
                                            <p className="text-[11px] text-gray-500 mt-0.5">{portal.ministry}</p>
                                        </div>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <div className="text-xl font-bold text-white">{portal.records_ready}</div>
                                        <div className="text-[11px] text-gray-400">records ready</div>
                                    </div>
                                </div>

                                {/* Sync Result Banner */}
                                {syncResult && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="mt-3 bg-green-500/10 border border-green-500/20 rounded-xl p-3 flex items-center gap-2"
                                    >
                                        <CheckCircle2 size={14} className="text-green-400 flex-shrink-0" />
                                        <p className="text-xs text-green-300">
                                            {syncResult.mode === 'DEMO'
                                                ? `✅ ${syncResult.records_synced} records formatted & validated. Add API key to enable live sync.`
                                                : `✅ ${syncResult.records_synced} records synced to ${syncResult.portal} successfully.`
                                            }
                                        </p>
                                    </motion.div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex gap-2 mt-4">
                                    <button
                                        onClick={() => handleSync(key)}
                                        disabled={syncing === key}
                                        className="flex-1 flex items-center justify-center gap-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-xs font-semibold py-2.5 px-4 rounded-xl transition-colors border border-blue-500/20"
                                    >
                                        <RefreshCw size={13} className={syncing === key ? 'animate-spin' : ''} />
                                        {syncing === key ? 'Syncing...' : 'Sync Now'}
                                    </button>
                                    <button
                                        onClick={() => handleExport(key, `civiclens_${key}_export.json`)}
                                        className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold py-2.5 px-4 rounded-xl transition-colors border border-white/10"
                                    >
                                        <Download size={13} />
                                        Export JSON
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Infrastructure Breakdown */}
                {summary?.scm_dashboard?.infrastructure_breakdown && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-4"
                    >
                        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                            🏙️ Smart City KPIs — Issue Breakdown
                        </h3>
                        <div className="space-y-2.5">
                            {Object.entries(summary.scm_dashboard.infrastructure_breakdown).map(([cat, count]) => {
                                const total = summary.total_reports || 1;
                                const pct = Math.round((count / total) * 100);
                                return (
                                    <div key={cat}>
                                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                                            <span>{cat}</span>
                                            <span>{count} reports ({pct}%)</span>
                                        </div>
                                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${pct}%` }}
                                                transition={{ delay: 0.5, duration: 0.6 }}
                                                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                {/* Setup Instructions */}
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4">
                    <h4 className="text-yellow-400 font-bold text-sm mb-2">🔑 How to Activate Live Sync</h4>
                    <p className="text-xs text-yellow-300/80 leading-relaxed">
                        To enable live data transmission to CPGRAMS, SBM, or Smart City Mission, your municipality needs to:<br />
                        1. Sign an <strong>MOU with DARPG / MoHUA</strong><br />
                        2. Receive official API credentials<br />
                        3. Add keys to backend .env: <code className="bg-yellow-500/20 px-1 rounded">CPGRAMS_API_KEY</code>, <code className="bg-yellow-500/20 px-1 rounded">SBM_API_KEY</code><br />
                        <span className="text-yellow-400 font-semibold">The data formatters are 100% ready — no code changes needed!</span>
                    </p>
                </div>
            </div>
        </div>
    );
}
