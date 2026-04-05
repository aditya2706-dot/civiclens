import { Camera, MapPin, Upload, Loader2, CheckCircle2, AlertTriangle, Info, Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";

// Build a flat searchable index from the ward data
type WardData = Record<string, string[]>;
type LandmarkResult = { landmark: string; ward: string; wardNum: number };

function buildSearchIndex(wardData: WardData): LandmarkResult[] {
    const index: LandmarkResult[] = [];
    for (const [ward, landmarks] of Object.entries(wardData)) {
        const wardNum = parseInt(ward.replace("Ward ", ""));
        for (const landmark of landmarks) {
            index.push({ landmark, ward, wardNum });
        }
    }
    return index;
}

export function Step1Capture({
    onNext,
    data,
    updateData
}: {
    onNext: () => void,
    data: any,
    updateData: (d: any) => void
}) {
    const [isLocating, setIsLocating] = useState(false);
    const [locationError, setLocationError] = useState("");
    const [showHint, setShowHint] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Landmark search state
    const [wardData, setWardData] = useState<WardData>({});
    const [searchIndex, setSearchIndex] = useState<LandmarkResult[]>([]);
    const [landmarkQuery, setLandmarkQuery] = useState(data.nearbyLandmark || "");
    const [suggestions, setSuggestions] = useState<LandmarkResult[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedLandmark, setSelectedLandmark] = useState<LandmarkResult | null>(
        data.nearbyLandmark ? { landmark: data.nearbyLandmark, ward: data.ward || "", wardNum: 0 } : null
    );
    const searchRef = useRef<HTMLDivElement>(null);

    // Load ward data on mount
    useEffect(() => {
        fetch("/alwar_wards.json")
            .then(r => r.json())
            .then((json: WardData) => {
                setWardData(json);
                setSearchIndex(buildSearchIndex(json));
            })
            .catch(() => console.warn("Ward data not available"));
    }, []);

    // Handle landmark search
    useEffect(() => {
        if (!landmarkQuery.trim() || landmarkQuery.length < 2) {
            setSuggestions([]);
            return;
        }
        const q = landmarkQuery.toLowerCase();
        const results = searchIndex
            .filter(item => item.landmark.toLowerCase().includes(q))
            .slice(0, 6);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
    }, [landmarkQuery, searchIndex]);

    // Close suggestions when clicking outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleLandmarkSelect = (result: LandmarkResult) => {
        setSelectedLandmark(result);
        setLandmarkQuery(result.landmark);
        setShowSuggestions(false);
        updateData({
            ...data,
            nearbyLandmark: result.landmark,
            ward: result.ward,
        });
    };

    const clearLandmark = () => {
        setSelectedLandmark(null);
        setLandmarkQuery("");
        updateData({ ...data, nearbyLandmark: "", ward: data.ward });
    };

    useEffect(() => {
        if (!data.location) {
            fetchLocation();
            const timer = setTimeout(() => {
                if (!data.location) setShowHint(true);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [data.location]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const imageUrl = URL.createObjectURL(file);
        updateData({ ...data, imageUrl, file });
        if (!data.location) {
            fetchLocation(imageUrl);
        } else {
            setTimeout(onNext, 800);
        }
    };

    const fetchLocation = (capturedImageUrl?: string) => {
        setIsLocating(true);
        setLocationError("");
        if (!navigator.geolocation) {
            setLocationError("Geolocation is not supported by your browser");
            setIsLocating(false);
            return;
        }
        const urlToUse = capturedImageUrl || data.imageUrl;
        const options = { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 };
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setIsLocating(false);
                updateData({
                    ...data,
                    imageUrl: urlToUse,
                    location: { lat: position.coords.latitude, lng: position.coords.longitude }
                });
                if (capturedImageUrl) setTimeout(onNext, 1000);
            },
            () => {
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        setIsLocating(false);
                        updateData({
                            ...data,
                            imageUrl: urlToUse,
                            location: { lat: pos.coords.latitude, lng: pos.coords.longitude }
                        });
                        if (capturedImageUrl) setTimeout(onNext, 1000);
                    },
                    () => {
                        setIsLocating(false);
                        setLocationError("Could not detect location. Please ensure GPS is active.");
                    },
                    { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
                );
            },
            options
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
        >
            <input
                type="file"
                accept="image/*"
                capture="environment"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
            />

            {/* Photo Capture Area */}
            <div
                className={`rounded-3xl p-8 border-2 border-dashed flex flex-col items-center justify-center min-h-[260px] cursor-pointer transition-colors relative overflow-hidden
                    ${data.imageUrl ? 'border-green-500 bg-black' : 'border-green-200 bg-green-50 hover:bg-green-100'}
                `}
                onClick={() => !data.imageUrl && fileInputRef.current?.click()}
            >
                {data.imageUrl ? (
                    <>
                        <img src={data.imageUrl} alt="Captured evidence" className="absolute inset-0 w-full h-full object-cover opacity-80" />
                        <button
                            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                            className="absolute bottom-4 bg-white/90 backdrop-blur text-gray-800 px-4 py-2 rounded-full font-semibold text-sm shadow-lg border border-gray-100 flex items-center gap-2"
                        >
                            <Camera size={16} /> Retake Photo
                        </button>
                    </>
                ) : (
                    <>
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                            <Camera size={32} className="text-green-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 text-center mb-2">Tap to take photo</h3>
                        <p className="text-gray-500 text-sm text-center">or upload from gallery</p>
                    </>
                )}
            </div>

            {/* 🗺️ Landmark/Ward Search */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden" ref={searchRef}>
                <div className="px-4 pt-3 pb-1">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Nearby Landmark (Optional)</p>
                </div>
                <div className="relative px-4 pb-3">
                    <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100 focus-within:border-green-400 transition-colors">
                        <Search size={16} className="text-gray-400 flex-shrink-0" />
                        <input
                            type="text"
                            value={landmarkQuery}
                            onChange={e => {
                                setLandmarkQuery(e.target.value);
                                setSelectedLandmark(null);
                            }}
                            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                            placeholder="e.g. Sarafa Bazar, Hope Circus..."
                            className="flex-1 text-sm bg-transparent outline-none text-gray-700 placeholder-gray-400"
                        />
                        {landmarkQuery && (
                            <button onClick={clearLandmark} className="text-gray-400 hover:text-gray-600">
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* Selected Ward Badge */}
                    <AnimatePresence>
                        {selectedLandmark && (
                            <motion.div
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="mt-2 flex items-center gap-2"
                            >
                                <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                                    <MapPin size={11} />
                                    {selectedLandmark.ward} detected
                                </span>
                                <span className="text-xs text-gray-400">Report will be routed correctly</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Dropdown Suggestions */}
                    <AnimatePresence>
                        {showSuggestions && suggestions.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                className="absolute left-4 right-4 top-full z-50 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden"
                            >
                                {suggestions.map((s, i) => (
                                    <button
                                        key={i}
                                        onMouseDown={() => handleLandmarkSelect(s)}
                                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-green-50 transition-colors text-left border-b border-gray-50 last:border-0"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <MapPin size={14} className="text-green-500 flex-shrink-0" />
                                            <span className="text-sm text-gray-700 font-medium">{s.landmark}</span>
                                        </div>
                                        <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{s.ward}</span>
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* GPS Location Card */}
            <div className={`bg-white rounded-2xl p-4 shadow-sm border flex flex-col gap-2 ${locationError ? 'border-red-200' : 'border-gray-100'}`}>
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl flex-shrink-0 ${data.location ? 'bg-green-100 text-green-600' : (locationError ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500')}`}>
                        {isLocating ? <Loader2 className="animate-spin" size={24} /> : (data.location ? <CheckCircle2 size={24} /> : (locationError ? <AlertTriangle size={24} /> : <MapPin size={24} />))}
                    </div>
                    <div className="flex-1">
                        {data.location ? (
                            <>
                                <h4 className="font-semibold text-gray-800 text-sm">GPS Location Acquired</h4>
                                <p className="text-xs text-gray-500">{data.location.lat.toFixed(5)}, {data.location.lng.toFixed(5)}</p>
                            </>
                        ) : (
                            <>
                                <h4 className="font-semibold text-gray-800 text-sm mb-1">
                                    {isLocating ? 'Detecting location...' : (locationError ? 'Location Error' : 'Location Required')}
                                </h4>
                                <p className="text-xs text-gray-400">
                                    {isLocating ? 'Please wait...' : (locationError ? 'GPS access is mandatory' : 'Auto-detected on capture')}
                                </p>
                            </>
                        )}
                    </div>
                    {locationError && !isLocating && (
                        <button
                            onClick={(e) => { e.stopPropagation(); fetchLocation(); }}
                            className="bg-red-500 text-white text-[10px] font-bold px-3 py-2 rounded-lg hover:bg-red-600 transition-colors"
                        >
                            RETRY
                        </button>
                    )}
                </div>
                {locationError && (
                    <p className="text-[10px] text-red-500 mt-2 px-1 font-medium leading-tight">{locationError}</p>
                )}
            </div>

            {showHint && !data.location && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3"
                >
                    <div className="bg-blue-100 p-2 rounded-full h-fit text-blue-600">
                        <Info size={18} />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-blue-800">Need Location Permission?</h4>
                        <p className="text-xs text-blue-600 leading-normal mt-0.5">
                            Please ensure your phone's GPS is ON and you've clicked "Allow" on the browser's location prompt.
                        </p>
                    </div>
                </motion.div>
            )}

            {(data.imageUrl && !isLocating) && (
                <button
                    onClick={onNext}
                    disabled={!data.location}
                    className={`w-full py-4 text-white font-bold rounded-2xl transition-colors shadow-lg flex justify-center items-center gap-2
                        ${data.location ? 'bg-green-500 hover:bg-green-600 shadow-green-200' : 'bg-gray-300 shadow-gray-200 cursor-not-allowed'}
                    `}
                >
                    Continue to Analysis
                </button>
            )}
        </motion.div>
    );
}
