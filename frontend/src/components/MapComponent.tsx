"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin } from "lucide-react";
import { useRouter } from "next/navigation";

// Fix for default Leaflet icon paths in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
    iconUrl: require("leaflet/dist/images/marker-icon.png"),
    shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

import axios from "axios";

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
    const [mapCenter, setMapCenter] = useState<[number, number]>([28.6139, 77.2090]); // Default to New Delhi
    const router = useRouter();

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/reports`);
                if (Array.isArray(res.data)) {
                    setReports(res.data);
                }
            } catch (err) {
                console.error("Failed to fetch reports:", err);
            }
        };
        fetchReports();

        // Get user location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setMapCenter([position.coords.latitude, position.coords.longitude]);
                },
                (error) => {
                    console.warn("Could not get exact location, using default.", error.message);
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        }
    }, []);

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
        let color = 'EF4444'; // Red for Unsolved/Rejected
        if (status === 'Ongoing' || status === 'Under Review') color = 'EAB308'; // Yellow for Ongoing
        if (status === 'Solved' || status === 'Resolved') color = '22C55E'; // Green for Solved

        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#${color}" stroke="#ffffff" stroke-width="3" style="filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.2));"/></svg>`;

        return L.divIcon({
            className: 'custom-leaflet-icon',
            html: svg,
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

                {filteredReports.map((report: any) => (
                    report.location?.lat !== undefined && report.location?.lng !== undefined ? (
                        <Marker
                            key={report._id}
                            position={[report.location.lat, report.location.lng]}
                            icon={getMarkerIcon(report.status)}
                            eventHandlers={{
                                click: () => setSelectedReport(report),
                            }}
                        />
                    ) : null
                ))}
            </MapContainer>

            <AnimatePresence>
                {selectedReport && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="absolute bottom-6 left-4 right-4 bg-white p-4 rounded-3xl shadow-2xl z-[1000]"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full ${getStatusColor(selectedReport.status)}`}>
                                    {selectedReport.status}
                                </span>
                                <h3 className="font-bold text-gray-900 mt-2 line-clamp-2">{selectedReport.aiSummary || `${selectedReport.category} Issue`}</h3>
                                <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                    <MapPin size={14} /> {selectedReport.location?.address || `Lat: ${selectedReport.location?.lat?.toFixed(4)}, Lng: ${selectedReport.location?.lng?.toFixed(4)}`}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedReport(null)}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 shrink-0"
                            >
                                ✕
                            </button>
                        </div>
                        <button
                            onClick={() => router.push(`/reports/${selectedReport._id}`)}
                            className="w-full mt-4 bg-green-50 text-green-700 font-semibold py-3 rounded-xl hover:bg-green-100 transition-colors"
                        >
                            View Details
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
