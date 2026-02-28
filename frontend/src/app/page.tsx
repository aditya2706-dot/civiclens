"use client";

import { useState } from "react";
import CategoryFilter from "@/components/CategoryFilter";
import dynamic from "next/dynamic";
import { UserCircle } from "lucide-react";

const MapComponent = dynamic(() => import("@/components/MapComponent"), { ssr: false });
import { motion } from "framer-motion";

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState("All");

  return (
    <main className="flex min-h-screen flex-col items-center bg-gray-50 relative pb-28">
      {/* Header */}
      <header className="w-full flex justify-between items-center p-6 pb-2 pt-12 bg-white rounded-b-[2.5rem] shadow-sm z-20 relative">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-green-800 to-green-500 bg-clip-text text-transparent">
            CivicAI
          </h1>
          <p className="text-xs text-gray-500 font-medium">Your City, Better</p>
        </div>
        <button className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center shadow-sm">
          <UserCircle size={24} className="text-gray-600" />
        </button>
      </header>

      {/* Floating Category Filter */}
      <div className="absolute top-32 left-0 right-0 z-20">
        <CategoryFilter
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />
      </div>

      {/* Map Area */}
      <div className="flex-1 w-full bg-gray-200 relative -mt-6">
        <MapComponent selectedCategory={selectedCategory} />

        {/* Reports Near You Overlay Context */}
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 max-w-[80%] w-[300px] z-20 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white/90 backdrop-blur text-gray-700 text-xs py-2 px-4 rounded-full shadow-lg text-center font-medium border border-gray-100"
          >
            3 unresolved issues near you
          </motion.div>
        </div>
      </div>
    </main>
  );
}
