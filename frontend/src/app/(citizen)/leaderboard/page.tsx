"use client";

import { useState, useEffect } from "react";
import BottomNav from "@/components/BottomNav";
import { Trophy, Medal, MapPin, Loader2 } from "lucide-react";
import axios from "axios";

export default function LeaderboardPage() {
    const [leaders, setLeaders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/auth/leaderboard`);
                setLeaders(res.data);
            } catch (error) {
                console.error("Failed to fetch leaderboard", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, []);

    const getMedalIcon = (index: number) => {
        switch (index) {
            case 0: return <Trophy className="text-yellow-500 w-8 h-8" />;
            case 1: return <Medal className="text-gray-400 w-7 h-7" />;
            case 2: return <Medal className="text-amber-600 w-6 h-6" />;
            default: return <span className="text-gray-400 font-bold w-6 text-center">{index + 1}</span>;
        }
    };

    const getMedalColor = (index: number) => {
        switch (index) {
            case 0: return "bg-yellow-50 border-yellow-200";
            case 1: return "bg-gray-50 border-gray-200";
            case 2: return "bg-amber-50 border-amber-200";
            default: return "bg-white border-gray-100";
        }
    };

    return (
        <main className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <div className="bg-green-600 pt-16 pb-20 px-6 rounded-b-[40px] shadow-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="relative z-10 flex flex-col items-center">
                    <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm mb-4">
                        <Trophy size={40} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-white mb-2">Civic Champions</h1>
                    <p className="text-green-50 text-center text-sm px-4 max-w-sm">
                        Top citizens making our city a better place through active reporting.
                    </p>
                </div>
            </div>

            {/* Top 3 Podium (Optional logic, standard list for now) */}
            
            <div className="px-6 -mt-10 relative z-20 space-y-3">
                {loading ? (
                    <div className="flex justify-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
                        <Loader2 className="animate-spin text-green-500 w-8 h-8" />
                    </div>
                ) : leaders.length === 0 ? (
                    <div className="py-20 bg-white rounded-3xl shadow-sm border border-gray-100 text-center px-6">
                        <h3 className="font-bold text-gray-800 text-lg mb-2">No Leaders Yet</h3>
                        <p className="text-sm text-gray-500">Be the first to report an issue and top the leaderboard!</p>
                    </div>
                ) : (
                    leaders.map((user, index) => (
                        <div 
                            key={user._id}
                            className={`flex items-center p-4 rounded-2xl border ${getMedalColor(index)} shadow-sm transition-transform hover:scale-[1.02]`}
                        >
                            <div className="w-12 flex justify-center shrink-0">
                                {getMedalIcon(index)}
                            </div>
                            
                            <div className="ml-2 flex-grow min-w-0">
                                <h3 className="font-bold text-gray-900 truncate">{user.name}</h3>
                                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                    <MapPin size={10} /> Active Citizen
                                </p>
                            </div>

                            <div className="shrink-0 text-right ms-4 bg-white px-3 py-1.5 rounded-full border border-gray-100 shadow-sm">
                                <span className="block font-bold text-green-600 text-sm">{user.civicPoints || 0}</span>
                                <span className="block text-[10px] text-gray-400 font-medium uppercase tracking-wider">Points</span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <BottomNav />
        </main>
    );
}
