"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface VoiceRecorderProps {
    onTranscript: (text: string) => void;
    placeholder?: string;
}

export default function VoiceRecorder({ onTranscript }: VoiceRecorderProps) {
    const [isListening, setIsListening] = useState(false);
    const [isSupported, setIsSupported] = useState(true);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        // Check for Web Speech API support
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            setIsSupported(false);
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        // Set language to Auto/Indian languages if possible, or just let browser detect
        recognition.lang = 'en-IN'; // Default to Indian English, Gemini will handle translation anyway

        recognition.onresult = (event: any) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }
            if (finalTranscript) {
                onTranscript(finalTranscript);
            }
        };

        recognition.onerror = (event: any) => {
            console.error("Speech Recognition Error:", event.error);
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current = recognition;
    }, [onTranscript]);

    const toggleListening = () => {
        if (!recognitionRef.current) return;

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            try {
                recognitionRef.current.start();
                setIsListening(true);
            } catch (err) {
                console.error("Failed to start recognition:", err);
            }
        }
    };

    if (!isSupported) return null;

    return (
        <div className="flex flex-col items-center gap-3">
            <div className="relative">
                <AnimatePresence>
                    {isListening && (
                        <>
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1.5, opacity: 0.15 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
                                className="absolute inset-0 bg-red-500 rounded-full"
                            />
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 2, opacity: 0.1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut", delay: 0.5 }}
                                className="absolute inset-0 bg-red-500 rounded-full"
                            />
                        </>
                    )}
                </AnimatePresence>

                <button
                    onClick={toggleListening}
                    className={`relative z-10 w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${
                        isListening 
                            ? 'bg-red-500 text-white animate-pulse' 
                            : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'
                    }`}
                >
                    {isListening ? <Mic size={24} /> : <MicOff size={24} />}
                </button>
            </div>
            
            <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${
                isListening ? 'text-red-500' : 'text-gray-400'
            }`}>
                {isListening ? 'Listening...' : 'Tap to speak'}
            </span>
        </div>
    );
}
