"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map, FileText, BookOpen, Settings, Plus, Trophy } from "lucide-react";
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
        { labelKey: "navSettings", href: "/settings", icon: Settings },
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
        <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-2 bg-white/80 backdrop-blur-md border-t border-gray-100 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)] rounded-t-3xl">
            <div className="max-w-md mx-auto relative flex justify-between items-center px-2">

                {/* Left Items */}
                <div className="flex w-2/5 justify-between">
                    {navItems.map((item) => (
                        <Item key={item.labelKey} item={item} />
                    ))}
                </div>

                {/* Center Floating Button */}
                <div className="absolute left-1/2 -top-10 transform -translate-x-1/2">
                    <Link href="/report">
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-green-600 shadow-xl flex items-center justify-center text-white relative group"
                        >
                            <Plus size={32} strokeWidth={2.5} />
                            <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 transition-opacity" />
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
