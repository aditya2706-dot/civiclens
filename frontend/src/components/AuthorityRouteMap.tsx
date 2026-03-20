"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix generic icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
    iconUrl: require("leaflet/dist/images/marker-icon.png"),
    shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

function MapFitter({ points }: { points: [number, number][] }) {
    const map = useMap();
    useEffect(() => {
        if (points.length > 0) {
            const bounds = L.latLngBounds(points);
            map.fitBounds(bounds, { padding: [50, 50], animate: true });
        }
    }, [points, map]);
    return null;
}

export default function AuthorityRouteMap({ currentLocation, route }: { currentLocation: {lat: number, lng: number}, route: any[] }) {
    
    // Create a beautifully numbered drop pin for each stop on the route
    const getNumberedIcon = (index: number) => {
        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
                <path d="M16 0c-8.8 0-16 7.2-16 16 0 10.7 16 24 16 24s16-13.3 16-24c0-8.8-7.2-16-16-16z" fill="#EF4444" stroke="#ffffff" stroke-width="2" style="filter: drop-shadow(0px 4px 6px rgba(0,0,0,0.3));"/>
                <text x="16" y="22" font-family="'Inter', sans-serif" font-size="14" font-weight="900" fill="#ffffff" text-anchor="middle">${index}</text>
            </svg>
        `;
        return L.divIcon({
            className: 'custom-numbered-icon',
            html: svg,
            iconSize: [32, 40],
            iconAnchor: [16, 40],
            popupAnchor: [0, -40]
        });
    };

    const userIcon = L.divIcon({
        className: 'user-location-icon',
        html: `<div class="w-5 h-5 bg-blue-500 rounded-full border-4 border-white shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-pulse"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });

    const routePositions: [number, number][] = [
        [currentLocation.lat, currentLocation.lng],
        ...route.map(r => [r.location.lat, r.location.lng] as [number, number])
    ];

    if (!currentLocation) return <div className="h-full w-full bg-slate-100 animate-pulse"></div>;

    return (
        <MapContainer
            center={[currentLocation.lat, currentLocation.lng]}
            zoom={14}
            className="w-full h-full z-0 font-sans"
            zoomControl={false}
        >
            <TileLayer
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            />
            
            <MapFitter points={routePositions} />

            {/* Glowing path connecting the stops */}
            <Polyline 
                positions={routePositions} 
                pathOptions={{ 
                    color: '#3B82F6', 
                    weight: 5, 
                    opacity: 0.8,
                    dashArray: '10, 15',
                    lineJoin: 'round'
                }} 
            />

            {/* Authority Starting Location */}
            <Marker position={[currentLocation.lat, currentLocation.lng]} icon={userIcon}>
                <Popup className="font-sans rounded-2xl">
                    <p className="font-bold text-gray-800">Your Location</p>
                    <p className="text-xs text-gray-500">Starting Point</p>
                </Popup>
            </Marker>

            {/* Stops */}
            {route.map((report, index) => (
                <Marker 
                    key={report._id} 
                    position={[report.location.lat, report.location.lng]} 
                    icon={getNumberedIcon(index + 1)}
                >
                    <Popup className="font-sans rounded-xl overflow-hidden p-0">
                        <div className="w-48 text-left">
                            <div className="bg-red-50 px-3 py-2 border-b border-red-100">
                                <span className="text-[10px] font-bold uppercase text-red-500 tracking-wider">Stop {index + 1}</span>
                                <h4 className="font-bold text-gray-800 leading-tight">{report.category}</h4>
                            </div>
                            <div className="p-3">
                                <p className="text-xs text-gray-500 line-clamp-2">{report.aiSummary}</p>
                            </div>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
}
