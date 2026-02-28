import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CivicAI - AI Powered Civic Reporting",
  description: "Report civic issues instantly using AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased bg-gray-50`}>
        <div className="max-w-md mx-auto min-h-screen bg-white shadow-xl relative pb-28">
          {children}
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
