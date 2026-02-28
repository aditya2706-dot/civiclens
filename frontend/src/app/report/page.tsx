"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Step1Capture } from "@/components/report/Step1Capture";
import { Step2Analysis } from "@/components/report/Step2Analysis";
import { Step3Submit } from "@/components/report/Step3Submit";

export default function ReportWizard() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [reportData, setReportData] = useState({
        imageUrl: "",
        location: null,
        aiAnalysis: null,
    });

    const nextStep = () => setStep(s => Math.min(s + 1, 3));
    const prevStep = () => setStep(s => Math.max(s - 1, 1));

    return (
        <main className="min-h-screen bg-gray-50 flex flex-col pb-28 relative">
            {/* Header */}
            <header className="px-6 py-6 pb-4 bg-white shadow-sm flex items-center justify-between sticky top-0 z-10">
                <button
                    onClick={() => step === 1 ? router.push('/') : prevStep()}
                    className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                    <ArrowLeft size={24} className="text-gray-700" />
                </button>
                <h1 className="text-xl font-bold text-gray-800">New Report</h1>
                <div className="w-10"></div> {/* Spacer for centering */}
            </header>

            {/* Progress Indicator */}
            <div className="bg-white px-6 pb-6 pt-2 shadow-sm relative z-0">
                <div className="flex items-center justify-between relative max-w-[200px] mx-auto">
                    <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-gray-200 -z-10 transform -translate-y-1/2"></div>
                    <div
                        className="absolute top-1/2 left-0 h-[2px] bg-green-500 -z-10 transform -translate-y-1/2 transition-all duration-300"
                        style={{ width: `${((step - 1) / 2) * 100}%` }}
                    ></div>

                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors shadow-sm
                ${step >= i ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400 border border-gray-200'}
              `}
                        >
                            {i}
                        </div>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-6 relative overflow-hidden">
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <Step1Capture
                            key="step1"
                            onNext={nextStep}
                            data={reportData}
                            updateData={setReportData}
                        />
                    )}
                    {step === 2 && (
                        <Step2Analysis
                            key="step2"
                            onNext={nextStep}
                            onBack={prevStep}
                            data={reportData}
                            updateData={setReportData}
                        />
                    )}
                    {step === 3 && (
                        <Step3Submit
                            key="step3"
                            onBack={prevStep}
                            data={reportData}
                        />
                    )}
                </AnimatePresence>
            </div>
        </main>
    );
}
