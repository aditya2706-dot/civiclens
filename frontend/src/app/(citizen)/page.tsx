"use client";

import { useState, useEffect } from "react";
import CategoryFilter from "@/components/CategoryFilter";
import dynamic from "next/dynamic";
import { UserCircle, Megaphone } from "lucide-react";
import Link from "next/link";
import axios from "axios";
import NotificationBell from "@/components/NotificationBell";
import { useLanguage } from "@/context/LanguageContext";

const MapComponent = dynamic(() => import("@/components/MapComponent"), { ssr: false });
import { motion } from "framer-motion";

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [unresolvedCount, setUnresolvedCount] = useState<number | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const { lang, setLang, t } = useLanguage();

    useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/reports/stats`);
        if (res.data && typeof res.data.unresolvedCount === 'number') {
          setUnresolvedCount(res.data.unresolvedCount);
        }
      } catch (error) {
        console.error("Failed to fetch statistics", error);
      }
    };
    
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUserProfile(res.data);
        } catch (error) {
          console.error("Failed to fetch profile", error);
        }
      }
    };

    const fetchBroadcasts = async () => {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/broadcasts`);
        setBroadcasts(res.data);
      } catch (error) {
        console.error("Failed to fetch broadcasts", error);
      }
    };

    fetchStats();
    fetchProfile();
    fetchBroadcasts();

    // Poll for stats and broadcasts every 30 seconds
    const pollInterval = setInterval(() => {
        fetchStats();
        fetchBroadcasts();
    }, 30000);
    
    return () => clearInterval(pollInterval);
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center bg-slate-100 relative pb-28">
      {/* Floating Apple-Style Header */}
      <header className="w-[calc(100%-2rem)] mx-auto mt-6 mb-2 flex justify-between items-center px-5 py-3 sticky top-4 bg-white/70 backdrop-blur-xl z-[60] rounded-3xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div>
          <h1 className="text-2xl font-black tracking-tight bg-gradient-to-br from-green-800 to-green-500 bg-clip-text text-transparent italic pr-2">
            {t("appName")}
          </h1>
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-0.5">{t("tagline")}</p>
        </div>
        <div className="flex items-center gap-3">
          {userProfile && (
            <div className="flex flex-col items-end mr-1">
              <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider">Points</span>
              <span className="text-sm font-black text-green-600 leading-none">{userProfile.civicPoints || 0}</span>
            </div>
          )}
          {/* Language Toggle */}
          <button
            onClick={() => setLang(lang === "en" ? "hi" : "en")}
            className="h-10 px-3 text-xs font-black rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 hover:bg-green-50 hover:border-green-200 hover:text-green-700 transition-all shadow-sm flex items-center justify-center min-w-[45px] active:scale-95"
          >
            {lang === "en" ? "हिं" : "EN"}
          </button>
          <NotificationBell />
          <Link href="/settings" className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center shadow-sm hover:bg-green-50 hover:border-green-200 group transition-all active:scale-95">
            <UserCircle size={22} className="text-slate-400 group-hover:text-green-600 transition-colors" />
          </Link>
        </div>
      </header>

      {/* Emergency Broadcasts (Floating Toasts) */}
      <div className="fixed top-28 left-0 right-0 z-[70] flex flex-col items-center gap-3 w-full px-4 pointer-events-none">
        {broadcasts.map((b, i) => (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: i * 0.1, type: "spring", bounce: 0.4 }}
            key={b._id} 
            className="pointer-events-auto max-w-md w-full bg-white/90 backdrop-blur-xl border border-red-100 p-4 rounded-3xl shadow-[0_10px_40px_-5px_rgba(220,38,38,0.15)] flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0 border border-red-100 relative">
                <div className="absolute inset-0 rounded-full border border-red-400 animate-ping opacity-20" />
                <Megaphone size={18} className="text-red-500" />
            </div>
            <div className="flex-1 mt-0.5">
              <div className="flex justify-between items-start">
                  <span className="font-black text-xs uppercase tracking-widest text-red-600">{b.title}</span>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-bold uppercase tracking-wider">{b.ward}</span>
              </div>
              <p className="text-sm font-medium text-slate-700 mt-1 leading-snug">{b.message}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Map Area */}
      <div className="flex-1 flex flex-col w-full relative z-[40]">
        
        {/* Sub-Header Floating Category Filter - Moved inside map container for correct stacking */}
        <div className="absolute top-4 left-0 right-0 z-[50] flex justify-center pointer-events-none px-4">
           <div className="pointer-events-auto bg-white/90 backdrop-blur-xl px-2 py-1.5 rounded-[2rem] border border-white/50 shadow-lg flex items-center max-w-full overflow-x-auto no-scrollbar">
              <CategoryFilter selected={selectedCategory} onSelect={setSelectedCategory} />
           </div>
        </div>

        <MapComponent selectedCategory={selectedCategory} selectedWard="All Wards" />

        {/* Reports Near You Overlay Context */}
        <div className="absolute top-6 left-0 right-0 z-20 flex justify-center pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.6 }}
            className="bg-slate-900/90 backdrop-blur-md text-white px-5 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 border border-white/10"
          >
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
            <p className="text-[11px] font-bold tracking-tight">
              {unresolvedCount !== null ? (
                <span className="text-red-400 font-black">{unresolvedCount}</span>
              ) : (
                '...'
              )} {t("unresolvedNear").toUpperCase()}
            </p>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
