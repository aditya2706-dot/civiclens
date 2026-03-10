import { motion } from "framer-motion";
import { MessageCircle, Send, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import axios from "axios";

export function Step3Submit({
    onBack,
    data
}: {
    onBack: () => void,
    data: any
}) {
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditingLocation, setIsEditingLocation] = useState(false);
    const [manualAddress, setManualAddress] = useState("");
    const [selectedWard, setSelectedWard] = useState(data.aiAnalysis?.suggestedWard || "");

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const headers: any = {
                'Content-Type': 'application/json'
            };

            if (token && !isAnonymous) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const payload = {
                imageUrl: data.base64Image || data.imageUrl,
                category: data.aiAnalysis?.suggestedCategory || 'Other',
                aiSummary: data.aiAnalysis?.summary || '',
                detectedObjects: data.aiAnalysis?.detectedObjects || [],
                severity: data.aiAnalysis?.computedSeverity || 'Medium',
                location: manualAddress ? { address: manualAddress } : (data.location || { lat: 0, lng: 0 }),
                ward: selectedWard,
                isAnonymous: isAnonymous
            };

            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/reports`, payload, { headers });

            if (res.data) {
                setSubmitted(true);
            }
        } catch (error) {
            console.error("Error submitting report:", error);
            alert("Failed to submit report. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleWhatsAppShare = () => {
        const text = `*Civic Issue Reported*\nType: ${data.aiAnalysis?.suggestedCategory}\nSeverity: ${data.aiAnalysis?.computedSeverity}\nSummary: ${data.aiAnalysis?.summary}\nLat/Lng: ${data.location?.lat}, ${data.location?.lng}`;
        const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    if (submitted) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center text-center space-y-6 py-12"
            >
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 size={48} className="text-green-500" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Report Submitted!</h2>
                    <p className="text-gray-500">The concerned authorities have been notified.</p>
                </div>

                <div className="w-full max-w-sm bg-gray-50 p-6 rounded-3xl mt-8 space-y-4">
                    <h3 className="font-semibold text-gray-700">Need Faster Action?</h3>
                    <p className="text-sm text-gray-500">Alert your local WhatsApp groups to increase visibility.</p>
                    <button
                        onClick={handleWhatsAppShare}
                        className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white py-3 rounded-xl font-bold hover:bg-[#1DA851] transition-colors"
                    >
                        <MessageCircle size={20} />
                        Forward to WhatsApp
                    </button>
                </div>

                <button
                    onClick={() => window.location.href = '/'}
                    className="mt-4 text-green-600 font-semibold py-2 px-6 rounded-full hover:bg-green-50 transition-colors"
                >
                    Return Home
                </button>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
        >
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-gray-800 border-b border-gray-100 pb-4">Report Summary</h3>

                <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-start">
                        <span className="text-sm text-gray-500">Category</span>
                        <span className="font-semibold text-gray-800">{data.aiAnalysis?.suggestedCategory}</span>
                    </div>
                    <div className="flex justify-between items-start">
                        <span className="text-sm text-gray-500">Location</span>
                        {isEditingLocation ? (
                            <div className="flex flex-col gap-2 items-end">
                                <input
                                    type="text"
                                    className="border rounded p-1 text-sm text-right"
                                    placeholder="Enter manual address"
                                    value={manualAddress}
                                    onChange={(e) => setManualAddress(e.target.value)}
                                    autoFocus
                                />
                                <button className="text-xs text-green-600 underline" onClick={() => setIsEditingLocation(false)}>Save</button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-end">
                                <span className="text-sm font-medium text-gray-800 text-right">
                                    {manualAddress ? manualAddress : "Detected automatically"}
                                    {!manualAddress && <br />}
                                    {!manualAddress && <span className="text-xs text-gray-400">({data.location?.lat}, {data.location?.lng})</span>}
                                </span>
                                <button className="text-xs text-green-600 underline mt-1" onClick={() => setIsEditingLocation(true)}>Edit Address</button>
                            </div>
                        )}
                    </div>
                    <div className="flex justify-between items-start pt-2">
                        <span className="text-sm text-gray-500">Severity</span>
                        <span className="text-sm font-bold text-red-600">{data.aiAnalysis?.computedSeverity}</span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-gray-50 mt-2">
                        <span className="text-sm text-gray-500">Nagar Nigam Ward</span>
                        <input
                            type="text"
                            value={selectedWard}
                            placeholder="e.g. Ward 42"
                            onChange={(e) => setSelectedWard(e.target.value)}
                            className="text-sm border border-gray-200 rounded-lg bg-white p-2 text-right font-medium text-gray-700 outline-none focus:border-green-500 w-48"
                        />
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={isAnonymous}
                            onChange={(e) => setIsAnonymous(e.target.checked)}
                            className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <span className="text-sm font-medium text-gray-700">Submit anonymously</span>
                    </label>
                </div>
            </div>

            <div className="flex gap-4 pt-4">
                <button
                    onClick={onBack}
                    className="flex-1 py-4 bg-white border-2 border-gray-200 text-gray-600 font-bold rounded-2xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                    Back
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className={`flex-1 py-4 text-white font-bold rounded-2xl transition-colors shadow-lg flex items-center justify-center gap-2 ${isSubmitting ? 'bg-green-400 cursor-not-allowed shadow-none' : 'bg-green-500 hover:bg-green-600 shadow-green-200'}`}
                >
                    <Send size={18} />
                    {isSubmitting ? 'Submitting...' : 'Submit'}
                </button>
            </div>
        </motion.div>
    );
}
