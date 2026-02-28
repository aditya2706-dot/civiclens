import { motion } from "framer-motion";
import { Check, Edit2, AlertTriangle, Box, Info } from "lucide-react";
import { useEffect, useState } from "react";
import axios from "axios";

export function Step2Analysis({
    onNext,
    onBack,
    data,
    updateData
}: {
    onNext: () => void,
    onBack: () => void,
    data: any,
    updateData: (d: any) => void
}) {
    const [analyzing, setAnalyzing] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const analyzeImage = async () => {
            if (!data.file) {
                // If they bypassed the camera via debug/mock, just show mock
                setTimeout(() => {
                    updateData({
                        ...data,
                        aiAnalysis: {
                            summary: "Detected a substantial pothole on the main road. The hole appears deep enough to cause vehicle damage and poses a safety risk.",
                            detectedObjects: ["broken asphalt", "debris"],
                            suggestedCategory: "Pothole",
                            computedSeverity: "High"
                        }
                    });
                    setAnalyzing(false);
                }, 1000);
                return;
            }

            try {
                // Determine mime type and base64
                const reader = new FileReader();
                reader.readAsDataURL(data.file);
                reader.onloadend = async () => {
                    const base64data = reader.result as string;
                    // strip the "data:image/jpeg;base64," part
                    const base64DataOnly = base64data.split(',')[1];
                    const mimeType = data.file.type;

                    const response = await axios.post("http://localhost:5001/api/reports/analyze", {
                        imageBase64: base64DataOnly,
                        mimeType: mimeType
                    });

                    updateData({
                        ...data,
                        aiAnalysis: {
                            summary: response.data.summary,
                            detectedObjects: response.data.detectedObjects,
                            suggestedCategory: response.data.suggestedCategory,
                            computedSeverity: response.data.estimatedSeverity,
                            department: response.data.department
                        }
                    });
                    setAnalyzing(false);
                };
            } catch (err) {
                console.error("Analysis error:", err);
                setError("Failed to analyze image. Please try again or adjust details manually.");
                setAnalyzing(false);
            }
        };

        analyzeImage();
    }, []);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <AlertTriangle size={48} className="text-red-500" />
                <h3 className="text-lg font-semibold text-gray-700">Analysis Failed</h3>
                <p className="text-sm text-center text-gray-500">{error}</p>
                <button onClick={onBack} className="mt-4 px-6 py-2 bg-gray-100 rounded-full font-medium text-gray-700">Go Back</button>
            </div>
        );
    }

    if (analyzing) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <div className="relative w-20 h-20">
                    <div className="absolute inset-0 border-4 border-green-100 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-green-500 rounded-full border-t-transparent animate-spin"></div>
                </div>
                <h3 className="text-lg font-semibold text-gray-700">AI is analyzing your photo...</h3>
                <p className="text-sm text-gray-400">Detecting issue type and severity</p>
            </div>
        );
    }

    const analysis = data.aiAnalysis;

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
        >
            <div className="bg-white rounded-3xl border border-green-100 overflow-hidden shadow-sm">
                <div className="bg-green-50 px-6 py-4 border-b border-green-100 flex items-center justify-between">
                    <h3 className="font-bold text-green-800 flex items-center gap-2">
                        <Check size={20} className="text-green-600" />
                        AI Analysis Complete
                    </h3>
                    <span className="bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                        {analysis.computedSeverity} Severity
                    </span>
                </div>

                <div className="p-6 space-y-6">
                    <div>
                        <p className="text-gray-700 text-sm leading-relaxed">
                            {analysis.summary}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                            <span className="text-xs text-gray-500 mb-1 block">Suggested Category</span>
                            <span className="font-semibold text-gray-800">{analysis.suggestedCategory}</span>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                            <span className="text-xs text-gray-500 mb-1 block">Objects Detected</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                                {analysis.detectedObjects.map((obj: string, i: number) => (
                                    <span key={i} className="text-[10px] bg-white border border-gray-200 px-2 py-1 rounded-md text-gray-600">
                                        {obj}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-4 pt-4">
                <h4 className="text-center font-semibold text-gray-700">Is this analysis accurate?</h4>
                <div className="flex gap-4">
                    <button
                        onClick={onBack}
                        className="flex-1 py-4 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                    >
                        <Edit2 size={18} />
                        Adjust Details
                    </button>
                    <button
                        onClick={onNext}
                        className="flex-1 py-4 bg-green-500 text-white font-bold rounded-2xl hover:bg-green-600 transition-colors shadow-lg shadow-green-200 flex items-center justify-center gap-2"
                    >
                        Yes, Looks Good
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
