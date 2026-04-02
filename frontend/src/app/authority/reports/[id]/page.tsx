"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import axios from "axios";
import { ArrowLeft, ShieldCheck, MapPin, CheckCircle, Image as ImageIcon, Key, Calendar, BrainCircuit, Users, Navigation, HardHat, IndianRupee } from "lucide-react";
import PremiumLoader from "@/components/PremiumLoader";

export default function AuthorityReportDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [report, setReport] = useState<any>(null);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Resolution States
    const [resolveMode, setResolveMode] = useState<"photo" | "otp">("photo");
    const [resolveFile, setResolveFile] = useState<File | null>(null);
    const [resolveOtp, setResolveOtp] = useState<string>("");
    const [resolving, setResolving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchDetails = async () => {
            const token = localStorage.getItem("token");
            if (!token) return router.push("/authority/login");

            try {
                // Verify Authority Access
                const profileRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (profileRes.data.role !== "authority" && profileRes.data.role !== "admin" && profileRes.data.role !== "supervisor") {
                    throw new Error("Unauthorized");
                }
                setUser(profileRes.data);

                // Fetch Dedicated Report
                const reportRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/reports/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                setReport(reportRes.data);
            } catch (error) {
                console.error("Failed to load official dossier", error);
                router.push("/authority/dashboard");
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [id, router]);

    const handleResolve = async () => {
        if (resolveMode === "photo" && !resolveFile) {
            setError("You must upload a photo to resolve this without a PIN.");
            return;
        }
        if (resolveMode === "otp" && resolveOtp.length !== 4) {
            setError("Invalid OTP format. It must be 4 digits.");
            return;
        }

        setResolving(true);
        setError("");

        try {
            const token = localStorage.getItem("token");
            let uploadedImageUrl = null;

            if (resolveMode === "photo" && resolveFile) {
                const formData = new FormData();
                formData.append("image", resolveFile);
                const uploadRes = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/upload`, formData, {
                    headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" }
                });
                uploadedImageUrl = uploadRes.data.imageUrl;
            }

            const res = await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/reports/${report._id}/status`, {
                status: "Resolved",
                resolutionImageUrl: uploadedImageUrl,
                otp: resolveMode === "otp" ? resolveOtp : undefined
            }, { headers: { Authorization: `Bearer ${token}` } });

            setReport(res.data);
            setResolveFile(null);
            setResolveOtp("");
        } catch (err: any) {
            console.error("Resolution failed", err);
            setError(err.response?.data?.message || "Failed to mark as resolved.");
        } finally {
            setResolving(false);
        }
    };

    if (loading) return <PremiumLoader message="Retrieving Dossier..." />;
    if (!report) return null;

    const isResolved = report.status === "Resolved" || report.status === "Solved";

    return (
        <main className="min-h-screen bg-slate-900 font-sans pb-32">
            {/* Header Identity Badge */}
            <header className="bg-slate-950 pb-8 px-4 pt-12 rounded-b-[2rem] shadow-xl relative overflow-hidden border-b border-indigo-500/20 z-10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px]" />
                <div className="max-w-4xl mx-auto flex items-center gap-4 relative z-10">
                    <button 
                        onClick={() => router.push("/authority/dashboard")}
                        className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center hover:bg-slate-700 transition"
                    >
                        <ArrowLeft className="text-slate-300" size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-white tracking-tight uppercase">Operational Dossier</h1>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <ShieldCheck className="text-indigo-500 inline" size={14} /> ID: {report._id.slice(-8)}
                        </p>
                    </div>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-4 -mt-4 space-y-6 relative z-20">
                {/* Visual Overview */}
                <div className="bg-slate-800 border border-slate-700 rounded-[2rem] overflow-hidden shadow-2xl">
                    <div className="w-full h-64 md:h-96 relative bg-slate-900 flex items-center justify-center text-slate-700 font-bold overflow-hidden">
                        {report.imageUrl ? (
                            <img 
                                src={report.imageUrl.startsWith("http") || report.imageUrl.startsWith("data:") ? report.imageUrl : `${process.env.NEXT_PUBLIC_API_URL}${report.imageUrl}`}
                                alt="Reported incident"
                                className="object-cover w-full h-full"
                            />
                        ) : (
                            <p>No Visual Evidentiary Required</p>
                        )}
                        <div className="absolute bottom-4 left-4 flex gap-2">
                            <span className="bg-black/70 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border border-white/10 shadow-lg">
                                {report.category}
                            </span>
                            <span className={`bg-black/70 backdrop-blur-md text-white border border-white/10 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-1 ${report.severity === 'High' ? 'text-red-400' : report.severity === 'Medium' ? 'text-amber-400' : 'text-blue-400'}`}>
                                {report.severity} Priority
                            </span>
                        </div>
                    </div>
                    
                    <div className="p-6 md:p-8 bg-slate-800">
                        <div className="flex flex-col md:flex-row gap-6 justify-between">
                            <div className="flex-1">
                                <h2 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                                    <BrainCircuit size={14} className="text-indigo-400" /> Executive Summary
                                </h2>
                                <p className="text-base text-slate-200 font-medium leading-relaxed">
                                    {report.aiSummary || report.description || "No specific details provided."}
                                </p>
                                
                                {report.detectedObjects && report.detectedObjects.length > 0 && (
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {report.detectedObjects.map((obj: string, i: number) => (
                                            <span key={i} className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded-md">
                                                {obj}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            
                            <div className="md:w-64 space-y-4 border-t md:border-t-0 md:border-l border-slate-700 pt-4 md:pt-0 md:pl-6 text-sm">
                                <div>
                                    <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-1 flex items-center gap-1"><MapPin size={10} /> Sector</p>
                                    <p className="text-slate-300 font-bold">{report.ward || "Unassigned"}</p>
                                    <p className="text-slate-400 text-xs mt-0.5 max-w-[200px] truncate">{report.location?.address || "Coordinate Data Only"}</p>
                                </div>
                                <div>
                                    <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-1 flex items-center gap-1"><Calendar size={10} /> Reported</p>
                                    <p className="text-slate-300 font-bold">{new Date(report.createdAt).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* AI Logistics Forecast */}
                {(report.estimatedCost || report.estimatedResources) && (
                    <div className="bg-slate-800 border border-slate-700 rounded-[2rem] p-6 md:p-8 shadow-xl">
                        <h2 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <HardHat size={14} className="text-amber-500" /> AI Logistics & Resource Forecast
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {report.estimatedCost ? (
                                <div className="bg-slate-900 border border-slate-700 p-5 rounded-2xl">
                                    <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-2 flex items-center gap-1">
                                        <IndianRupee size={10} /> Estimated Budget
                                    </p>
                                    <p className="text-2xl text-emerald-400 font-bold">
                                        ₹{report.estimatedCost.toLocaleString('en-IN')}
                                    </p>
                                </div>
                            ) : null}

                            {report.estimatedResources ? (
                                <div className="bg-slate-900 border border-slate-700 p-5 rounded-2xl">
                                    <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-2 flex items-center gap-1">
                                        <Users size={10} /> Personnel & Equipment
                                    </p>
                                    <p className="text-sm text-slate-300 font-medium leading-relaxed">
                                        {report.estimatedResources}
                                    </p>
                                </div>
                            ) : null}
                        </div>
                    </div>
                )}

                {/* Resolution Terminal */}
                <div className={`border rounded-[2rem] p-6 shadow-xl transition-colors ${isResolved ? "bg-emerald-500/10 border-emerald-500/20" : "bg-slate-800 border-slate-700"}`}>
                    <h2 className={`text-[10px] font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2 ${isResolved ? "text-emerald-400" : "text-white"}`}>
                        <CheckCircle size={14} className={isResolved ? "text-emerald-400" : "text-slate-500"} /> 
                        {isResolved ? "TICKET CLOSED" : "TICKET RESOLUTION TERMINAL"}
                    </h2>
                    
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                            {error}
                        </div>
                    )}

                    {isResolved ? (
                        <div className="flex flex-col gap-4">
                            <p className="text-emerald-100/70 text-sm font-medium">This ticket has been officially resolved. All actions are securely logged in the database.</p>
                            {report.resolutionImageUrl && (
                                <a href={report.resolutionImageUrl} target="_blank" className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest w-fit hover:bg-emerald-500/30 transition">
                                    <ImageIcon size={14}/> View Visual Proof
                                </a>
                            )}
                        </div>
                    ) : (
                        <div>
                            {/* Tabs */}
                            <div className="flex bg-slate-900 border border-slate-700 p-1 rounded-xl mb-6 max-w-sm">
                                <button 
                                    onClick={() => setResolveMode("photo")}
                                    className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 transition-all ${resolveMode === "photo" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-300"}`}
                                >
                                    <ImageIcon size={14} /> Photo Auth
                                </button>
                                <button 
                                    onClick={() => setResolveMode("otp")}
                                    className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 transition-all ${resolveMode === "otp" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-300"}`}
                                >
                                    <Key size={14} /> Citizen PIN
                                </button>
                            </div>

                            {resolveMode === "photo" ? (
                                <div className="space-y-4">
                                    <label className="border-2 border-dashed border-slate-600 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-700 hover:border-indigo-500 transition-colors group">
                                        <div className="w-12 h-12 bg-slate-900 text-indigo-400 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-lg">
                                            <ImageIcon size={20} />
                                        </div>
                                        <span className="font-bold text-slate-300">{resolveFile ? resolveFile.name : "Select or Capture Proof Photo"}</span>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-2">Required for visual corroboration</span>
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            capture="environment"
                                            className="hidden"
                                            onChange={(e) => {
                                                if (e.target.files?.[0]) setResolveFile(e.target.files[0]);
                                            }}
                                        />
                                    </label>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 block">Enter Citizen Pin</label>
                                        <input 
                                            type="text" 
                                            className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-4 text-center font-mono text-2xl tracking-[0.5em] text-white focus:ring-2 focus:ring-indigo-500 outline-none transition uppercase"
                                            placeholder="XXXX"
                                            maxLength={4}
                                            value={resolveOtp}
                                            onChange={(e) => setResolveOtp(e.target.value.replace(/[^0-9Aa-z]/g, ''))} // allows letters if OTP logic adapts, mostly numbers
                                        />
                                        <p className="text-xs text-slate-500 mt-4 text-center font-medium">Bypasses photo requirement if Citizen is present to provide their closure PIN.</p>
                                    </div>
                                </div>
                            )}

                            <div className="mt-8 pt-6 border-t border-slate-700 flex justify-end">
                                <button 
                                    onClick={handleResolve}
                                    disabled={resolving}
                                    className={`bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black uppercase tracking-[0.2em] text-xs px-8 py-4 rounded-xl transition-all shadow-xl shadow-emerald-500/20 flex items-center gap-2 ${resolving ? 'opacity-70 cursor-not-allowed' : 'active:-translate-y-1'}`}
                                >
                                    {resolving ? "Validating & Securing..." : <><CheckCircle size={16} /> Execute Closure</>}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
