"use client";

import { LanguageProvider } from "@/context/LanguageContext";
import { Outfit } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import OfflineSync from "@/components/OfflineSync";
import { GoogleOAuthProvider } from "@react-oauth/google";

const outfit = Outfit({ subsets: ["latin"], weight: ["300", "400", "500", "700", "900"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#16a34a" />
      </head>
      <body className={`${outfit.className} antialiased bg-slate-50 text-slate-900 selection:bg-green-500/20 selection:text-green-900`}>
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>        
          <LanguageProvider>
            <OfflineSync />
            <div className="max-w-md mx-auto min-h-screen bg-white shadow-[0_0_50px_-12px_rgba(0,0,0,0.1)] relative pb-28 overflow-x-hidden border-x border-gray-100/50">
              {children}
              <BottomNav />
            </div>
          </LanguageProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
