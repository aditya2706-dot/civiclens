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
      <body className={`${inter.className} antialiased bg-gray-50`}>
        <LanguageProvider>
          <div className="max-w-md mx-auto min-h-screen bg-white shadow-xl relative pb-28">
            {children}
            <BottomNav />
          </div>
        </LanguageProvider>
      </body>
    </html>
  );
}
