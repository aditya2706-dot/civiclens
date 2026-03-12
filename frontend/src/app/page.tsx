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
    fetchStats();
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center bg-gray-50 relative pb-28">
      {/* Header */}
      <header className="w-full flex justify-between items-center p-6 pb-2 pt-12 bg-white rounded-b-[2.5rem] shadow-sm z-50 relative">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-green-800 to-green-500 bg-clip-text text-transparent">
            {t("appName")}
          </h1>
          <p className="text-xs text-gray-500 font-medium">{t("tagline")}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <button
            onClick={() => setLang(lang === "en" ? "hi" : "en")}
            className="px-3 py-1.5 text-xs font-bold rounded-full bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 transition-colors shadow-sm tracking-wide"
          >
            {lang === "en" ? "हिं" : "EN"}
          </button>
          <NotificationBell />
          <Link href="/settings" className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center shadow-sm hover:bg-green-50 transition-colors">
            <UserCircle size={24} className="text-gray-600" />
          </Link>
        </div>
      </header>

      {/* Floating Category Filter */}
      <div className="absolute top-32 left-0 right-0 z-20 flex flex-col gap-2 px-4 shadow-sm items-center">
        <CategoryFilter
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />
      </div>

      {/* Map Area */}
      <div className="flex-1 w-full bg-gray-200 relative -mt-6">
        <MapComponent selectedCategory={selectedCategory} selectedWard="All Wards" />

        {/* Reports Near You Overlay Context */}
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 max-w-[80%] w-[300px] z-20 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white/90 backdrop-blur text-gray-700 text-xs py-2 px-4 rounded-full shadow-lg text-center font-medium border border-gray-100"
          >
            {unresolvedCount !== null ? (
              <span className="font-bold text-red-500">{unresolvedCount}</span>
            ) : (
              t("loading")
            )} {t("unresolvedNear")}
          </motion.div>
        </div>
      </div>
    </main>
  );
}
