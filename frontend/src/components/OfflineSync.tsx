"use client";

import { useEffect } from "react";
import axios from "axios";

export default function OfflineSync() {
    useEffect(() => {
        const syncOfflineReports = async () => {
            const pendingStr = localStorage.getItem('pendingReports');
            if (!pendingStr) return;
            
            const pending = JSON.parse(pendingStr);
            if (pending.length === 0) return;

            console.log(`Syncing ${pending.length} offline reports...`);
            const remaining = [];
            let successes = 0;

            for (const req of pending) {
                try {
                    await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/reports`, req.payload, { headers: req.headers });
                    successes++;
                } catch (e) {
                    console.error("Failed to sync offline report:", e);
                    remaining.push(req);
                }
            }

            localStorage.setItem('pendingReports', JSON.stringify(remaining));
            
            if (successes > 0) {
                // Feature: visual feedback when connection restores
                if (typeof window !== 'undefined') {
                    // Create a toast manually
                    const toast = document.createElement('div');
                    toast.className = 'fixed top-10 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-full shadow-2xl z-[9999] font-bold transition-all';
                    toast.innerText = `✅ ${successes} offline report(s) synced successfully!`;
                    document.body.appendChild(toast);
                    
                    setTimeout(() => {
                        toast.style.opacity = '0';
                        setTimeout(() => toast.remove(), 500);
                    }, 4000);
                }
            }
        };

        const handleOnline = () => {
            syncOfflineReports();
        };

        window.addEventListener('online', handleOnline);
        
        // Initial check in case it came online while app was closed
        if (typeof navigator !== 'undefined' && navigator.onLine) {
            syncOfflineReports();
        }
        
        return () => window.removeEventListener('online', handleOnline);
    }, []);

    return null;
}
