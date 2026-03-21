"use client";

import { useState, useEffect } from "react";
import CategoryFilter from "@/components/CategoryFilter";
import dynamic from "next/dynamic";
import { UserCircle } from "lucide-react";
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
  const { lang, setLang, t } = useLanguage();

    useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/reports`);
        if (Array.isArray(res.data)) {
          const unresolved = res.data.filter(r => r.status !== 'Resolved' && r.status !== 'Solved');
          setUnresolvedCount(unresolved.length);
        }
      } catch (error) {
        console.error("Failed to fetch reports for stats", error);
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

    fetchStats();
    fetchProfile();

    // Poll for stats every 30 seconds
    const statsInterval = setInterval(fetchStats, 30000);
    
    return () => clearInterval(statsInterval);
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center bg-gray-50 relative pb-28">
      {/* Header */}
      <header className="w-full flex justify-between items-center p-6 pb-4 pt-10 sticky top-0 bg-white/80 backdrop-blur-lg z-50 border-b border-gray-100/50 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.03)]">
        <div>
          <h1 className="text-2xl font-black tracking-tight bg-gradient-to-br from-green-800 to-green-500 bg-clip-text text-transparent italic">
            {t("appName")}
          </h1>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{t("tagline")}</p>
        </div>
        <div className="flex items-center gap-3">
          {userProfile && (
            <div className="flex flex-col items-end mr-1">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Points</span>
              <span className="text-sm font-black text-green-600 leading-none">{userProfile.civicPoints || 0}</span>
            </div>
          )}
          {/* Language Toggle */}
          <button
            onClick={() => setLang(lang === "en" ? "hi" : "en")}
            className="h-10 px-4 text-xs font-black rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 hover:bg-green-50 hover:border-green-200 hover:text-green-700 transition-all shadow-sm flex items-center justify-center min-w-[50px]"
          >
            {lang === "en" ? "हिं" : "EN"}
          </button>
          <NotificationBell />
          <Link href="/settings" className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center shadow-sm hover:bg-green-50 hover:border-green-200 group transition-all">
            <UserCircle size={22} className="text-slate-400 group-hover:text-green-600 transition-colors" />
          </Link>
        </div>
      </header>

      {/* Floating Category Filter */}
      <div className="w-full z-20 flex flex-col gap-2 py-4 shadow-sm items-center bg-white/50 backdrop-blur-sm sticky top-[84px] border-b border-gray-100/30">
        <CategoryFilter
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />
      </div>

      {/* Map Area */}
      <div className="flex-1 w-full relative">
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
