"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { optimizeRoute } from "@/utils/routeOptimizer";
import dynamic from "next/dynamic";
import { ArrowLeft, Navigation, MapPin, Search, Loader2, FileText } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const AuthorityRouteMap = dynamic(() => import("@/components/AuthorityRouteMap"), { ssr: false, loading: () => <div className="h-full w-full bg-slate-200 animate-pulse flex items-center justify-center"><Loader2 className="animate-spin text-slate-400" /></div> });

export default function RoutePlannerPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [locating, setLocating] = useState(true);
    const [route, setRoute] = useState<any[]>([]);
    const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);

    useEffect(() => {
        const initializeRoute = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return router.push('/login');

                // 1. Fetch assigned reports
                const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/reports/authority`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                // 2. Get high accuracy GPS
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            const current = { lat: position.coords.latitude, lng: position.coords.longitude };
                            setCurrentLocation(current);
                            setLocating(false);
                            
                            // 3. Optimize the route
                            const optimized = optimizeRoute(current, res.data);
                            setRoute(optimized);
                            setLoading(false);
                        },
                        (error) => {
                            console.warn("GPS failed, using ward center.", error);
                            // Fallback to City Center
                            const fallback = { lat: 28.6139, lng: 77.2090 };
                            setCurrentLocation(fallback);
                            setLocating(false);
                            setRoute(optimizeRoute(fallback, res.data));
                            setLoading(false);
                        },
                        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
                    );
                }
                
            } catch (error) {
                console.error("Route generation failed", error);
                setLoading(false);
                setLocating(false);
            }
        };

        initializeRoute();
    }, [router]);

    if (locating) {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white px-6 text-center">
                <Search className="w-16 h-16 text-blue-500 animate-bounce mb-6" />
                <h2 className="text-2xl font-black tracking-tight mb-2">Acquiring Satellites...</h2>
                <p className="text-slate-400">Locking onto your GPS coordinates to calculate the optimal path.</p>
            </div>
        );
    }

    return (
        <main className="h-screen flex flex-col bg-gray-50 overflow-hidden relative font-sans print:h-auto print:overflow-visible">
            {/* Map Area (Top 50%) */}
            <div className="h-1/2 w-full relative print:hidden">
                {currentLocation && <AuthorityRouteMap currentLocation={currentLocation} route={route} /> }
                
                {/* Floating Back Button */}
                <Link 
                    href="/authority/dashboard" 
                    className="absolute top-6 left-4 z-[400] bg-white/90 backdrop-blur-md p-3 rounded-full shadow-lg border border-white/50 text-gray-800 hover:bg-white transition-colors"
                >
                    <ArrowLeft size={24} />
                </Link>

                {/* Dashboard Pill */}
                <div className="absolute top-6 right-4 z-[400] bg-blue-600/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-blue-400/50 text-white flex items-center gap-2">
                    <Navigation size={16} className="fill-white" />
                    <span className="text-xs font-bold uppercase tracking-wider">Active Route</span>
                </div>
            </div>

            {/* Bottom Sheet Itinerary (Bottom 50%) */}
            <div className="h-1/2 w-full bg-white rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] -mt-6 z-[500] relative flex flex-col print:h-auto print:rounded-none print:shadow-none print:-mt-0">
                <div className="p-6 pb-2 border-b border-gray-100 flex-shrink-0 flex justify-between items-end print:border-b-2">
                    <div>
                        <div className="w-12 h-1.5 bg-gray-200 rounded-full mb-6 print:hidden" />
                        <h2 className="text-2xl font-black text-gray-800 tracking-tight">Today's Itinerary</h2>
                        <p className="text-sm font-medium text-gray-500 italic mt-1">
                            {route.length} stops strategically ordered from your location.
                        </p>
                    </div>
                    <button 
                        onClick={() => window.print()}
                        className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-black transition-colors flex items-center gap-2 print:hidden"
                    >
                        <FileText size={16} />
                        Print PDF
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {loading ? (
                        <div className="flex justify-center p-8"><Loader2 className="animate-spin text-blue-500" /></div>
                    ) : route.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <MapPin size={48} className="mx-auto mb-4 opacity-50" />
                            <p className="font-bold text-lg">You're all caught up!</p>
                            <p className="text-sm">No pending issues in your ward.</p>
                        </div>
                    ) : (
                        route.map((stop, index) => (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                key={stop._id} 
                                className="bg-white border text-left border-gray-100 p-5 rounded-2xl shadow-sm flex items-center gap-4 relative overflow-hidden group"
                            >
                                <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-blue-400 to-blue-600 rounded-l-2xl"></div>
                                
                                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center font-black text-xl text-blue-600 shrink-0">
                                    {index + 1}
                                </div>
                                
                                <div className="flex-1">
                                    <h4 className="font-bold text-gray-900 leading-tight">{stop.category}</h4>
                                    <p className="text-xs text-gray-500 line-clamp-1 mt-1 font-medium">{stop.aiSummary}</p>
                                    
                                    <div className="flex gap-3 mt-3">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-red-500 bg-red-50 px-2 py-1 rounded-md">
                                            {stop.severity}
                                        </span>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-gray-50 px-2 py-1 rounded-md border border-gray-100 flex items-center gap-1">
                                            <Navigation size={10} /> {(stop.distanceFromPrevious || 0).toFixed(1)} km
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0 print:hidden">
                                    {stop.location?.lat && stop.location?.lng && (
                                        <a 
                                            href={`https://www.google.com/maps/dir/?api=1&destination=${stop.location.lat},${stop.location.lng}`}
                                            target="_blank" rel="noopener noreferrer"
                                            className="h-10 px-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-center text-blue-600 font-bold text-xs gap-1 hover:bg-blue-600 hover:text-white transition-colors"
                                        >
                                            <MapPin size={14} /> Navigate
                                        </a>
                                    )}
                                    <Link 
                                        href={`/reports/${stop._id}`}
                                        className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                                    >
                                        <ArrowLeft size={18} className="rotate-180" />
                                    </Link>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </main>
    );
}
