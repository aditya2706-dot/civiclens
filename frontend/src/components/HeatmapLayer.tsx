"use client";

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

export default function HeatmapLayer({ points }: { points: [number, number, number][] }) {
    const map = useMap();

    useEffect(() => {
        if (!map) return;
        
        // Disable default zoom animation to prevent heatmap glitches
        const onZoomStart = () => { map.getPane('overlayPane')!.style.display = 'none'; };
        const onZoomEnd = () => { map.getPane('overlayPane')!.style.display = ''; };
        
        map.on('zoomstart', onZoomStart);
        map.on('zoomend', onZoomEnd);

        // Create heatmap layer
        // @ts-ignore - leaflet.heat types are sometimes incomplete
        const heatLayer = L.heatLayer(points, {
            radius: 25,
            blur: 15,
            maxZoom: 17,
            gradient: {
                0.4: 'blue',
                0.6: 'lime',
                0.8: 'yellow',
                1.0: 'red'
            }
        }).addTo(map);

        return () => {
            map.off('zoomstart', onZoomStart);
            map.off('zoomend', onZoomEnd);
            map.removeLayer(heatLayer);
        };
    }, [map, points]);

    return null;
}
