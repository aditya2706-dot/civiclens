"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Navigation, User, ShieldCheck, Download } from "lucide-react";
import { motion } from "framer-motion";
import axios from "axios";
import { useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function AuthorityNav() {
    const pathname = usePathname();
    const [downloading, setDownloading] = useState(false);

    const navItems = [
        { label: "Dashboard", href: "/authority/dashboard",  icon: LayoutDashboard },
        { label: "Route",     href: "/authority/route",       icon: Navigation       },
        { label: "Portals",   href: "/authority/national",    icon: ShieldCheck      },
        { label: "Account",   href: "/authority/account",     icon: User             },
    ];

    const handleDownloadPDF = async () => {
        setDownloading(true);
        try {
            const token = localStorage.getItem("token");
            const now = new Date();
            const res = await axios.get(
                `${API}/reports/monthly-pdf?month=${now.getMonth() + 1}&year=${now.getFullYear()}`,
                { headers: { Authorization: `Bearer ${token}` }, responseType: "blob" }
            );
            const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
            const a = document.createElement("a");
            a.href = url;
            a.download = `CivicLens_Monthly_Report_${now.toLocaleString("en-IN", { month: "long" })}_${now.getFullYear()}.pdf`;
            a.click();
        } catch (err) {
            alert("PDF generation failed. Please try again.");
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[1000] w-[95%] max-w-lg">
            <div className="bg-slate-900/90 backdrop-blur-2xl border border-white/10 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] rounded-2xl p-2 flex justify-between items-center gap-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/authority/dashboard" && pathname.startsWith(item.href));
                    const Icon = item.icon;
                    return (
                        <Link key={item.href} href={item.href} className="flex-1">
                            <div className="relative flex flex-col items-center justify-center py-2 group">
                                <div className={`p-2 rounded-xl transition-all duration-300 ${isActive ? "bg-green-500 text-white shadow-lg shadow-green-500/20" : "text-slate-500 hover:text-slate-300 hover:bg-white/5"}`}>
                                    <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                                </div>
                                <span className={`text-[8px] font-black uppercase tracking-widest mt-1.5 transition-colors ${isActive ? "text-green-500" : "text-slate-600"}`}>
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

                {/* PDF Download button */}
                <button onClick={handleDownloadPDF} disabled={downloading} className="flex-1">
                    <div className="relative flex flex-col items-center justify-center py-2 group">
                        <div className={`p-2 rounded-xl transition-all duration-300 ${downloading ? "bg-blue-500 text-white" : "text-slate-500 hover:text-slate-300 hover:bg-white/5"}`}>
                            <Download size={18} className={downloading ? "animate-bounce" : ""} />
                        </div>
                        <span className="text-[8px] font-black uppercase tracking-widest mt-1.5 text-slate-600">
                            {downloading ? "..." : "PDF"}
                        </span>
                    </div>
                </button>
            </div>
        </div>
    );
}
