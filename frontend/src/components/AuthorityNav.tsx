"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Map, Navigation, ShieldCheck, User, LogOut } from "lucide-react";
import { motion } from "framer-motion";

export default function AuthorityNav() {
    const pathname = usePathname();

    const navItems = [
        { label: "Issues", href: "/authority/dashboard", icon: FileText },
        { label: "Route", href: "/authority/route", icon: Navigation },
        { label: "Account", href: "/authority/account", icon: User },
    ];

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[1000] w-[95%] max-w-lg">
            <div className="bg-slate-900/90 backdrop-blur-2xl border border-white/10 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] rounded-2xl p-2 flex justify-between items-center">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex-1"
                        >
                            <div className="relative flex flex-col items-center justify-center py-2 group">
                                <div className={`p-2 rounded-xl transition-all duration-300 ${isActive ? "bg-green-500 text-white shadow-lg shadow-green-500/20" : "text-slate-500 hover:text-slate-300 hover:bg-white/5"}`}>
                                    <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                                </div>
                                <span className={`text-[9px] font-black uppercase tracking-widest mt-1.5 transition-colors ${isActive ? "text-green-500" : "text-slate-600"}`}>
                                    {item.label}
                                </span>
                                
                                {isActive && (
                                    <motion.div
                                        layoutId="auth-nav-indicator"
                                        className="absolute -top-2 w-1 h-1 bg-green-500 rounded-full"
                                        initial={false}
                                    />
                                )}
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
