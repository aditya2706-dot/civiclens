"use client";

import { LanguageProvider } from "@/context/LanguageContext";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased bg-slate-50 text-slate-900`}>
        <LanguageProvider>
          <div className="max-w-md mx-auto min-h-screen bg-white shadow-[0_0_50px_-12px_rgba(0,0,0,0.1)] relative pb-28 overflow-x-hidden border-x border-gray-100/50">
            {children}
            <BottomNav />
          </div>
        </LanguageProvider>
      </body>
    </html>
  );
}
