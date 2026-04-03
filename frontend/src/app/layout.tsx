"use client";

import { LanguageProvider } from "@/context/LanguageContext";
import { Outfit } from "next/font/google";
import "./globals.css";
import OfflineSync from "@/components/OfflineSync";
import { GoogleOAuthProvider } from "@react-oauth/google";

import { useEffect } from "react";

const outfit = Outfit({ subsets: ["latin"], weight: ["300", "400", "500", "700", "900"] });

// Silently wake up the backend server on app load (prevents cold-start timeout on Render.com free tier)
function BackendKeepalive() {
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/`, { method: 'GET' })
      .catch(() => {}); // Silent — we don't care about the response
  }, []);
  return null;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Defensive trimming: remove accidental quotes or spaces that cause 401 invalid_client
  const rawClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
  const cleanClientId = rawClientId.replace(/['"]/g, '').trim();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#16a34a" />
      </head>
      <body className={`${outfit.className} antialiased bg-slate-50 text-slate-900 selection:bg-green-500/20 selection:text-green-900`}>
        {cleanClientId ? (
          <GoogleOAuthProvider clientId={cleanClientId}>        
            <LanguageProvider>
              <BackendKeepalive />
              <OfflineSync />
              {children}
            </LanguageProvider>
          </GoogleOAuthProvider>
        ) : (
          <LanguageProvider>
            <BackendKeepalive />
            <OfflineSync />
            {children}
          </LanguageProvider>
        )}
      </body>
    </html>
  );
}
