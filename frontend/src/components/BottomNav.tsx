"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map, FileText, BookOpen, BarChart2, Plus, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

export default function BottomNav() {
    const pathname = usePathname();
    const { t } = useLanguage();

    const navItems = [
        { labelKey: "navMap", href: "/", icon: Map },
        { labelKey: "navReports", href: "/reports", icon: FileText },
    ];

    const navItemsRight = [
        { labelKey: "navLeaderboard", href: "/leaderboard", icon: Trophy },
        { labelKey: "navStats", href: "/stats", icon: BarChart2 },
    ];

    const Item = ({ item }: { item: any }) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        return (
            <Link
                href={item.href}
                className="flex flex-col items-center justify-center w-full space-y-1 relative"
            >
                <div className={`p-2 rounded-full transition-colors ${isActive ? "text-green-600" : "text-gray-500 hover:text-green-500"}`}>
                    <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={`text-[10px] font-medium transition-colors ${isActive ? "text-green-600" : "text-gray-500"}`}>
                    {t(item.labelKey)}
                </span>
                {isActive && (
                    <motion.div
                        layoutId="bottom-nav-indicator"
                        className="absolute -top-3 w-1.5 h-1.5 bg-green-500 rounded-full"
                        initial={false}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                )}
            </Link>
        );
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[1000] px-4 pb-8 pt-4">
            <div className="max-w-md mx-auto relative flex justify-between items-center px-6 py-2 bg-white/80 backdrop-blur-2xl border border-white/40 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] rounded-[32px]">

                {/* Left Items */}
                <div className="flex w-2/5 justify-between">
                    {navItems.map((item) => (
                        <Item key={item.labelKey} item={item} />
                    ))}
                </div>

                {/* Center Floating Button */}
                <div className="absolute left-1/2 -top-12 transform -translate-x-1/2">
                    <Link href="/report">
                        <motion.div
                            whileHover={{ y: -5, scale: 1.05 }}
                            whileTap={{ scale: 0.9 }}
                            className="w-16 h-16 rounded-[24px] bg-gradient-to-br from-green-400 via-green-600 to-green-700 shadow-[0_15px_30px_-5px_rgba(16,185,129,0.5)] flex items-center justify-center text-white relative group border-4 border-white"
                        >
                            <Plus size={36} strokeWidth={3} />
                            <div className="absolute inset-0 rounded-[20px] bg-white opacity-0 group-hover:opacity-20 transition-opacity" />
                        </motion.div>
                    </Link>
                </div>

                {/* Right Items */}
                <div className="flex w-2/5 justify-between">
                    {navItemsRight.map((item) => (
                        <Item key={item.labelKey} item={item} />
                    ))}
                </div>
            </div>
        </div>
    );
}
