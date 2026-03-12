"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Calendar, ThumbsUp, ThumbsDown, CheckCircle2, Send, MessageCircle, ShieldCheck, Share2, Link as LinkIcon, Twitter, Phone, Languages } from "lucide-react";
import axios from "axios";

export default function ReportDetails() {
    const router = useRouter();
    const { id } = useParams();

    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [voted, setVoted] = useState<"yes" | "no" | null>(null);
    const [newComment, setNewComment] = useState("");
    const [submittingComment, setSubmittingComment] = useState(false);
    const [translatedText, setTranslatedText] = useState<string | null>(null);
    const [translating, setTranslating] = useState(false);

    useEffect(() => {
        const fetchReport = async () => {
            try {
                const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/reports/${id}`);
                if (res.data && res.data._id) {
                    setReport(res.data);
                }
            } catch (err) {
                console.error("Failed to fetch report details:", err);
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchReport();
    }, [id]);

    const handleVerify = async (vote: "yes" | "no") => {
        try {
            const isAccurate = vote === "yes";
            await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/reports/${id}/verify`, { isAccurate });
            setVoted(vote);
            setReport((prev: any) => ({
                ...prev,
                verificationCount: isAccurate ? (prev.verificationCount || 0) + 1 : Math.max(0, (prev.verificationCount || 0) - 1)
            }));
        } catch (err) {
            console.error("Failed to verify", err);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Pending': return 'bg-red-500 text-white';
            case 'Under Review': return 'bg-yellow-500 text-black';
            case 'Resolved': return 'bg-green-500 text-white';
            default: return 'bg-gray-500 text-white';
        }
    };

    if (loading) {
        return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;
    }

    if (!report) {
        return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold text-gray-500">Report not found</div>;
    }

    const handleUpvote = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert("Please log in to support a report.");
                router.push("/login");
                return;
            }
            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/reports/${id}/upvote`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setReport((prev: any) => ({
                ...prev,
                upvoteCount: res.data.upvoteCount,
                upvotedBy: res.data.upvotedBy
            }));
        } catch (err) {
            console.error("Failed to upvote:", err);
            alert("Something went wrong while upvoting.");
        }
    };

    const hasUserUpvoted = () => {
        const userId = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!)._id : null;
        if (!userId || !report?.upvotedBy) return false;
        return report.upvotedBy.includes(userId);
    };

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        const token = localStorage.getItem('token');
        if (!token) {
            alert("Please log in to leave a comment.");
            router.push("/login");
            return;
        }

        setSubmittingComment(true);
        try {
            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/reports/${id}/comments`, 
                { text: newComment },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            // The API returns the updated comments array, which should be populated
            setReport((prev: any) => ({
                ...prev,
                comments: res.data
            }));
            setNewComment("");
        } catch (err) {
            console.error("Failed to add comment:", err);
            alert("Failed to add comment. Please try again.");
        } finally {
            setSubmittingComment(false);
        }
    };

    const handleShare = async (platform?: 'whatsapp' | 'twitter' | 'copy') => {
        const shareUrl = window.location.href;
        const shareTitle = `Civic Issue: ${report?.aiSummary || report?.category}`;
        const shareText = `Check out this civic issue on CivicLens. Let's get it fixed together!`;

        if (!platform && navigator.share) {
            try {
                await navigator.share({
                    title: shareTitle,
                    text: shareText,
                    url: shareUrl,
                });
                return;
            } catch (err) {
                console.log('Native share failed or cancelled', err);
                // Fallthrough to manual options
            }
        }

        if (platform === 'whatsapp') {
            window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + " " + shareUrl)}`);
        } else if (platform === 'twitter') {
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`);
        } else {
            // Default: Copy to clipboard
            navigator.clipboard.writeText(shareUrl);
            alert("Link copied to clipboard!");
        }
    };

    const handleTranslate = async () => {
        if (translatedText) {
            // Toggle off if already shown
            setTranslatedText(null);
            return;
        }
        setTranslating(true);
        try {
            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/reports/${id}/translate`);
            setTranslatedText(res.data.translated);
        } catch (err) {
            console.error('Translation failed:', err);
            alert('Could not translate. Please try again.');
        } finally {
            setTranslating(false);
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
                    src={report.imageUrl || "https://images.unsplash.com/photo-1605808360022-d7b38d38865f?auto=format&fit=crop&q=80"}
                    alt="Report Evidence"
                    className="w-full h-full object-cover opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>

                <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                    <div>
                        <span className="bg-white/20 backdrop-blur text-white text-xs font-bold px-3 py-1 rounded-full mb-2 inline-block">
                            {report.category}
                        </span>
                        {report.ward && (
                            <span className="bg-white/20 backdrop-blur text-white text-xs font-bold px-3 py-1 rounded-full mb-2 inline-block ml-2">
                                {report.ward}
                            </span>
                        )}
                        <h1 className="text-2xl font-bold text-white leading-tight">{report.aiSummary || "Civic Issue"}</h1>
                    </div>
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap shadow-lg ${getStatusBadge(report.status)}`}>
                        {report.status}
                    </span>
                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* Meta Info */}
                <div className="flex justify-between items-center pb-6 border-b border-gray-200">
                    <div className="flex items-center gap-2 text-sm text-gray-600 font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                        <MapPin size={16} className="text-gray-400 shrink-0" />
                        <span className="truncate">
                            {report.location?.address || `Lat: ${report.location?.lat?.toFixed(4)}, Lng: ${report.location?.lng?.toFixed(4)}`}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 font-medium shrink-0">
                        <Calendar size={16} className="text-gray-400" />
                        <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>

                {/* AI Summary Card */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-3">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <CheckCircle2 size={18} className="text-green-500" />
                            AI Analysis
                        </h3>
                        <button
                            onClick={handleTranslate}
                            disabled={translating}
                            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-all shadow-sm shrink-0 ${
                                translatedText 
                                    ? 'bg-orange-100 text-orange-700 border border-orange-200' 
                                    : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                            }`}
                        >
                            {translating ? (
                                <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Languages size={14} />
                            )}
                            {translatedText ? 'EN' : 'हिंदी'}
                        </button>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">
                        {report.aiSummary}
                    </p>
                    {translatedText && (
                        <div className="mt-3 pt-3 border-t border-blue-100 bg-blue-50/60 rounded-2xl p-3">
                            <div className="flex items-center gap-1.5 mb-1.5">
                                <Languages size={12} className="text-blue-500" />
                                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">हिंदी अनुवाद</span>
                            </div>
                            <p className="text-gray-700 text-sm leading-relaxed font-medium">{translatedText}</p>
                        </div>
                    )}
                    <div className="mt-4 pt-4 border-t border-gray-50 pt-3 flex flex-col gap-1">
                        <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Assigned to:</span>
                        <p className="font-semibold text-gray-700 capitalize">{report.department || 'General Administration'}</p>
                    </div>
                </div>

                {/* Me Too Button */}
                <button
                    onClick={handleUpvote}
                    className={`w-full py-4 rounded-2xl font-bold transition-all shadow-sm flex items-center justify-center gap-2
                        ${hasUserUpvoted()
                            ? "bg-blue-600 text-white shadow-blue-200"
                            : "bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50"
                        }`}
                >
                    <ThumbsUp size={20} className={hasUserUpvoted() ? "fill-current" : ""} />
                    {hasUserUpvoted() ? "You supported this issue" : 'I face this issue too ("Me Too")'}
                    <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-sm">
                        {report.upvoteCount || 0}
                    </span>
                </button>

                {/* Proof of Resolution */}
                {report.status === "Resolved" && report.resolutionImageUrl && (
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-green-200">
                        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <CheckCircle2 size={18} className="text-green-500" />
                            Official Resolution Proof
                        </h3>
                        <img 
                            src={report.resolutionImageUrl} 
                            alt="Resolution Proof" 
                            className="w-full h-48 object-cover rounded-2xl mb-3 shadow-inner"
                        />
                        <p className="text-sm text-gray-600 font-medium text-center">
                            This issue has been successfully resolved by the {report.department || "Authorities"}.
                        </p>
                    </div>
                )}

                {/* Community Verification */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-green-100">
                    <h3 className="text-center font-bold text-gray-800 mb-1">Community Verification</h3>
                    <p className="text-center text-xs text-gray-500 mb-4">{report.verificationCount || 0} citizens confirmed this</p>

                    <p className="text-center text-sm font-medium text-gray-700 mb-4">Is this report accurate?</p>
                    <div className="flex gap-4">
                        <button
                            onClick={() => handleVerify("no")}
                            disabled={voted !== null}
                            className={`flex-1 py-3 font-bold rounded-2xl transition-colors flex items-center justify-center gap-2
                ${voted === "no" ? "bg-red-500 text-white" : "bg-red-50 text-red-600 hover:bg-red-100"}
                ${voted !== null && voted !== "no" ? "opacity-50 cursor-not-allowed" : ""}
              `}
                        >
                            <ThumbsDown size={18} /> No
                        </button>
                        <button
                            onClick={() => handleVerify("yes")}
                            disabled={voted !== null}
                            className={`flex-1 py-3 font-bold rounded-2xl transition-colors flex items-center justify-center gap-2
                ${voted === "yes" ? "bg-green-500 text-white" : "bg-green-50 text-green-700 hover:bg-green-100"}
                ${voted !== null && voted !== "yes" ? "opacity-50 cursor-not-allowed" : ""}
              `}
                        >
                            <ThumbsUp size={18} /> Yes
                        </button>
                    </div>
                </div>

                {/* Social Sharing & Virality */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mt-6">
                    <h3 className="text-center font-bold text-gray-800 mb-1">Make Some Noise! 📣</h3>
                    <p className="text-center text-xs text-gray-500 mb-4">Share this report to get it fixed faster</p>
                    <div className="grid grid-cols-2 gap-3 sm:flex sm:justify-center">
                        <button 
                            onClick={() => handleShare('whatsapp')}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 py-3 px-4 bg-[#25D366] text-white rounded-2xl font-bold shadow-md hover:bg-[#20bd5a] transition-colors"
                        >
                            <Phone size={18} /> WhatsApp
                        </button>
                        <button 
                            onClick={() => handleShare('twitter')}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 py-3 px-4 bg-[#1DA1F2] text-white rounded-2xl font-bold shadow-md hover:bg-[#1a90d9] transition-colors"
                        >
                            <Twitter size={18} /> Twitter
                        </button>
                        <button 
                            onClick={() => handleShare('copy')}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 py-3 px-4 bg-gray-100 text-gray-700 rounded-2xl font-bold shadow-sm hover:bg-gray-200 transition-colors col-span-2"
                        >
                            <LinkIcon size={18} /> Copy Link
                        </button>
                        {/* Native Share button visible mainly on mobile */}
                        <button 
                            onClick={() => handleShare()}
                            className="sm:hidden flex-1 sm:flex-none flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 text-white rounded-2xl font-bold shadow-md hover:bg-blue-700 transition-colors col-span-2 mt-[-4px]"
                        >
                            <Share2 size={18} /> Share Options
                        </button>
                    </div>
                </div>

                <button className="w-full bg-white border border-green-500 text-green-600 font-bold py-4 rounded-2xl shadow-sm mt-6">
                    View on Map
                </button>

                {/* Citizen-Authority Chat / Comments */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mt-6">
                    <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <MessageCircle size={18} className="text-blue-500" />
                        Discussion ({report.comments?.length || 0})
                    </h3>

                    <div className="space-y-4 max-h-96 overflow-y-auto mb-6 pr-2 custom-scrollbar">
                        {(!report.comments || report.comments.length === 0) ? (
                            <p className="text-center text-sm text-gray-400 py-4">No comments yet. Start the conversation!</p>
                        ) : (
                            report.comments.map((comment: any, idx: number) => (
                                <div key={idx} className={`flex flex-col ${comment.isAuthority ? 'items-end' : 'items-start'}`}>
                                    <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm relative ${
                                        comment.isAuthority 
                                            ? 'bg-blue-50 border border-blue-100 rounded-br-sm' 
                                            : 'bg-gray-50 border border-gray-100 rounded-bl-sm'
                                    }`}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-semibold text-sm text-gray-800">
                                                {comment.user?.name || 'Citizen'}
                                            </span>
                                            {comment.isAuthority && (
                                                <span className="bg-blue-600 text-white text-[10px] uppercase font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                                                    <ShieldCheck size={10} /> Official
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{comment.text}</p>
                                        <span className="text-[10px] text-gray-400 mt-2 block font-medium">
                                            {new Date(comment.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <form onSubmit={handleAddComment} className="flex gap-2 relative">
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Add a comment or update..."
                            className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl py-3 px-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500 transition-all font-medium h-12 min-h-[48px] max-h-32"
                            rows={1}
                        />
                        <button
                            type="submit"
                            disabled={submittingComment || !newComment.trim()}
                            className="bg-green-600 text-white p-3 rounded-2xl font-bold shadow-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shrink-0 w-12 h-12"
                        >
                            {submittingComment ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <Send size={18} className="ml-1" />
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </main>
    );
}
