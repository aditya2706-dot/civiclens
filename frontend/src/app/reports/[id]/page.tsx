"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Calendar, ThumbsUp, ThumbsDown, CheckCircle2 } from "lucide-react";

export default function ReportDetails() {
    const router = useRouter();
    const { id } = useParams();

    // Mock data fetching based on ID
    const report = {
        id,
        category: "Pothole",
        title: "Deep pothole on main road",
        status: "Pending",
        date: "2 days ago",
        locName: "Main St & 5th Ave",
        description: "Detected a substantial pothole on the main road. The hole appears deep enough to cause vehicle damage and poses a safety risk.",
        img: "https://via.placeholder.com/600x400.png?text=Pothole+Evidence",
        verificationCount: 12,
        department: "Road Department"
    };

    const [voted, setVoted] = useState<"yes" | "no" | null>(null);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Pending': return 'bg-red-500 text-white';
            case 'Under Review': return 'bg-yellow-500 text-black';
            case 'Resolved': return 'bg-green-500 text-white';
            default: return 'bg-gray-500 text-white';
        }
    };

    return (
        <main className="min-h-screen bg-gray-50 pb-28">
            {/* Header with Image */}
            <div className="relative h-72 w-full bg-black">
                <button
                    onClick={() => router.back()}
                    className="absolute top-6 left-6 z-10 w-10 h-10 bg-black/30 backdrop-blur rounded-full flex items-center justify-center text-white"
                >
                    <ArrowLeft size={20} />
                </button>
                <img
                    src={report.img}
                    alt="Report Evidence"
                    className="w-full h-full object-cover opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>

                <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                    <div>
                        <span className="bg-white/20 backdrop-blur text-white text-xs font-bold px-3 py-1 rounded-full mb-2 inline-block">
                            {report.category}
                        </span>
                        <h1 className="text-2xl font-bold text-white leading-tight">{report.title}</h1>
                    </div>
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap shadow-lg ${getStatusBadge(report.status)}`}>
                        {report.status}
                    </span>
                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* Meta Info */}
                <div className="flex justify-between items-center pb-6 border-b border-gray-200">
                    <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                        <MapPin size={16} className="text-gray-400" />
                        <span>{report.locName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                        <Calendar size={16} className="text-gray-400" />
                        <span>{report.date}</span>
                    </div>
                </div>

                {/* AI Summary Card */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <CheckCircle2 size={18} className="text-green-500" />
                        AI Analysis
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                        {report.description}
                    </p>
                    <div className="mt-4 pt-4 border-t border-gray-50 pt-3">
                        <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Assigned to:</span>
                        <p className="font-semibold text-gray-700">{report.department}</p>
                    </div>
                </div>

                {/* Community Verification */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-green-100">
                    <h3 className="text-center font-bold text-gray-800 mb-1">Community Verification</h3>
                    <p className="text-center text-xs text-gray-500 mb-4">{report.verificationCount} citizens confirmed this</p>

                    <p className="text-center text-sm font-medium text-gray-700 mb-4">Is this report accurate?</p>
                    <div className="flex gap-4">
                        <button
                            onClick={() => setVoted("no")}
                            className={`flex-1 py-3 font-bold rounded-2xl transition-colors flex items-center justify-center gap-2
                ${voted === "no" ? "bg-red-500 text-white" : "bg-red-50 text-red-600 hover:bg-red-100"}
              `}
                        >
                            <ThumbsDown size={18} /> No
                        </button>
                        <button
                            onClick={() => setVoted("yes")}
                            className={`flex-1 py-3 font-bold rounded-2xl transition-colors flex items-center justify-center gap-2
                ${voted === "yes" ? "bg-green-500 text-white" : "bg-green-50 text-green-700 hover:bg-green-100"}
              `}
                        >
                            <ThumbsUp size={18} /> Yes
                        </button>
                    </div>
                </div>

                <button className="w-full bg-white border border-green-500 text-green-600 font-bold py-4 rounded-2xl shadow-sm">
                    View on Map
                </button>
            </div>
        </main>
    );
}
