"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Layers } from "lucide-react";
import { useRouter } from "next/navigation";
import HeatmapLayer from "./HeatmapLayer";
import MarkerClusterGroup from "react-leaflet-cluster";

// Fix for default Leaflet icon paths in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
    iconUrl: require("leaflet/dist/images/marker-icon.png"),
    shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

import axios from "axios";

const MAP_CACHE_KEY = "civiclens_map_cache";
const MAP_CACHE_TTL = 30 * 1000; // 30 seconds

function MapCenterUpdater({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, 14, { animate: true, duration: 1.5 });
        }
    }, [center, map]);
    return null;
}

export default function MapComponent({ selectedCategory, selectedWard }: { selectedCategory: string, selectedWard: string }) {
    const [reports, setReports] = useState<any[]>([]);
    const [selectedReport, setSelectedReport] = useState<any>(null);
    const [selectedReportDetails, setSelectedReportDetails] = useState<any>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [mapCenter, setMapCenter] = useState<[number, number]>([28.6139, 77.2090]); // Default to New Delhi
    const [isHeatmapMode, setIsHeatmapMode] = useState(false);
    const router = useRouter();

    useEffect(() => {
        // Load cached map data instantly
        try {
            const cacheKey = `${MAP_CACHE_KEY}_${selectedCategory}_${selectedWard}`;
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                const { data, ts } = JSON.parse(cached);
                if (Date.now() - ts < MAP_CACHE_TTL && Array.isArray(data)) {
                    setReports(data);
                }
            }
        } catch (_) {}

        const fetchReports = async () => {
            try {
                const cacheKey = `${MAP_CACHE_KEY}_${selectedCategory}_${selectedWard}`;
                const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/reports/map`, {
                    params: { category: selectedCategory, ward: selectedWard }
                });
                if (Array.isArray(res.data)) {
                    setReports(res.data);
                    try {
                        localStorage.setItem(cacheKey, JSON.stringify({ data: res.data, ts: Date.now() }));
                    } catch (_) {}
                }
            } catch (err) {
                console.error("Failed to fetch map reports:", err);
            }
        };
        fetchReports();
        
        // Poll for updates every 20 seconds (reduced frequency due to better caching)
        const interval = setInterval(fetchReports, 20000);

        // Get user location (non-blocking)
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setMapCenter([position.coords.latitude, position.coords.longitude]);
                },
                (error) => {
                    console.warn("Could not get exact location, using default.", error.message);
                },
                { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
            );
        }

        return () => clearInterval(interval);
    }, [selectedCategory, selectedWard]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Unsolved':
            case 'Rejected':
            case 'Pending': return 'bg-red-500 text-white';
            case 'Ongoing':
            case 'Under Review': return 'bg-yellow-500 text-black';
            case 'Solved':
            case 'Resolved': return 'bg-green-500 text-white';
            default: return 'bg-gray-500 text-white';
        }
    };

    const getMarkerIcon = (status: string) => {
        let color = 'FF3B30'; // Apple-style Red
        if (status === 'Ongoing' || status === 'Under Review') color = 'FFCC00'; // Apple-style Yellow
        if (status === 'Solved' || status === 'Resolved') color = '34C759'; // Apple-style Green

        const svg = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="white" />
                <circle cx="12" cy="12" r="8" fill="#${color}" />
                <circle cx="12" cy="12" r="8" fill="url(#paint0_radial)" fill-opacity="0.3"/>
                <defs>
                    <radialGradient id="paint0_radial" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" transform="translate(12 12) rotate(90) scale(8)">
                        <stop stop-color="white" stop-opacity="0.5"/>
                        <stop offset="1" stop-color="white" stop-opacity="0"/>
                    </radialGradient>
                </defs>
            </svg>
        `;

        return L.divIcon({
            className: 'custom-leaflet-icon',
            html: `<div class="drop-shadow-md hover:scale-125 transition-transform duration-300">${svg}</div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });
    };

    const filteredReports = reports.filter((r: any) =>
        (selectedCategory === "All" || r.category === selectedCategory) &&
        (selectedWard === "All Wards" || r.ward === selectedWard || (!r.ward && selectedWard === "All Wards"))
    );

    return (
        <div className="absolute inset-0 z-0">
            <MapContainer
                center={mapCenter}
                zoom={14}
                style={{ height: "100%", width: "100%", zIndex: 0 }}
                zoomControl={false}
            >
                <MapCenterUpdater center={mapCenter} />

                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />

                {isHeatmapMode ? (
                    <HeatmapLayer 
                        points={filteredReports
                            .filter((r: any) => r.location?.lat !== undefined && r.location?.lng !== undefined)
                            .map((r: any) => {
                                // Weight severity: High=1, Medium=0.6, Low=0.3
                                const weight = r.severity === 'High' ? 1 : r.severity === 'Medium' ? 0.6 : 0.3;
                                return [r.location.lat, r.location.lng, weight] as [number, number, number];
                            })
                        } 
                    />
                ) : (
                    <MarkerClusterGroup
                        chunkedLoading
                        maxClusterRadius={40}
                        iconCreateFunction={(cluster: any) => {
                            const count = cluster.getChildCount();
                            let size = 'w-10 h-10';
                            let bg = 'bg-yellow-500';
                            let shadow = 'shadow-yellow-500/50';

                            if (count > 10) {
                                size = 'w-12 h-12';
                                bg = 'bg-orange-500';
                                shadow = 'shadow-orange-500/50';
                            }
                            if (count > 50) {
                                size = 'w-14 h-14';
                                bg = 'bg-red-500';
                                shadow = 'shadow-red-500/50';
                            }

                            return L.divIcon({
                                html: `<div class="${size} ${bg} text-white font-bold rounded-full flex items-center justify-center shadow-lg ${shadow} ring-4 ring-white border-2 border-[inherit]">${count}</div>`,
                                className: 'custom-marker-cluster',
                                iconSize: L.point(40, 40, true),
                            });
                        }}
                    >
                        {filteredReports.map((report: any) => (
                            report.location?.lat !== undefined && report.location?.lng !== undefined ? (
                                <Marker
                                    key={report._id}
                                    position={[report.location.lat, report.location.lng]}
                                    icon={getMarkerIcon(report.status)}
                                    eventHandlers={{
                                        click: async () => {
                                            setSelectedReport(report);
                                            setLoadingDetails(true);
                                            setSelectedReportDetails(null);
                                            try {
                                                const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/reports/${report._id}`);
                                                setSelectedReportDetails(res.data);
                                            } catch (err) {
                                                console.error("Failed to fetch report details:", err);
                                            } finally {
                                                setLoadingDetails(false);
                                            }
                                        },
                                    }}
                                />
                            ) : null
                        ))}
                    </MarkerClusterGroup>
                )}
            </MapContainer>

            {/* Heatmap Toggle Button (Top Right, below filters normally, but Top right absolute for map) */}
            <button
                onClick={() => {
                    setIsHeatmapMode(!isHeatmapMode);
                    setSelectedReport(null);
                }}
                className={`absolute top-24 right-4 z-[1000] p-3 rounded-full shadow-lg backdrop-blur-md transition-all ${isHeatmapMode ? 'bg-green-600 text-white' : 'bg-white/90 text-gray-700 hover:bg-white'}`}
                title={isHeatmapMode ? "Switch to Pin View" : "Switch to Heatmap View"}
            >
                <Layers size={22} />
            </button>

            <AnimatePresence>
                {selectedReport && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="absolute bottom-6 left-4 right-4 bg-white/90 backdrop-blur-2xl p-4 rounded-[32px] shadow-2xl z-[1000] border border-white/50 flex flex-col gap-4"
                    >
                        <div className="flex gap-4">
                            {loadingDetails ? (
                                <div className="w-20 h-20 rounded-[24px] bg-slate-100 animate-pulse shrink-0" />
                            ) : (selectedReportDetails?.imageUrl || selectedReport.imageUrl) && (
                                <div className="w-20 h-20 rounded-[24px] overflow-hidden shrink-0 shadow-lg border-2 border-white">
                                    <img 
                                        src={selectedReportDetails?.imageUrl || selectedReport.imageUrl} 
                                        alt="Issue" 
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                    <span className={`text-[9px] uppercase tracking-widest font-black px-2.5 py-1 rounded-full ${getStatusColor(selectedReport.status)} shadow-sm`}>
                                        {selectedReport.status}
                                    </span>
                                    <button
                                        onClick={() => {
                                            setSelectedReport(null);
                                            setSelectedReportDetails(null);
                                        }}
                                        className="w-6 h-6 flex items-center justify-center bg-slate-100 text-slate-400 rounded-full hover:bg-slate-200 transition-colors"
                                    >
                                        ✕
                                    </button>
                                </div>
                                {loadingDetails ? (
                                    <div className="space-y-2 mt-2">
                                        <div className="h-4 bg-slate-100 animate-pulse rounded w-3/4" />
                                        <div className="h-3 bg-slate-100 animate-pulse rounded w-1/2" />
                                    </div>
                                ) : (
                                    <>
                                        <h3 className="font-black text-slate-900 text-sm line-clamp-2 leading-tight mb-2 tracking-tight">
                                            {selectedReportDetails?.description || selectedReportDetails?.aiSummary || `${selectedReport.category} Issue`}
                                        </h3>
                                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                            <span className="truncate">{selectedReportDetails?.location?.address?.split(',')[0] || "Active Scene"}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={() => router.push(`/reports/${selectedReport._id}`)}
                            className="w-full bg-blue-50 text-blue-600 font-extrabold py-3 rounded-2xl hover:bg-blue-100 transition-all flex items-center justify-center gap-2 text-xs shadow-sm"
                        >
                            View Full Report Details
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
