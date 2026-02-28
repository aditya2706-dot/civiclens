import { Camera, MapPin, Upload, Loader2, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useRef } from "react";

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
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // In a real app, you would upload this file to S3/Cloudinary here.
        // For now, we create a local object URL to display the preview.
        const imageUrl = URL.createObjectURL(file);

        updateData({
            ...data,
            imageUrl: imageUrl,
            file: file // Store actual file for submission later if needed
        });

        // Automatically fetch location when image is selected if we don't have it
        if (!data.location) {
            fetchLocation(imageUrl);
        } else {
            // If we have location already, wait a sec then go next
            setTimeout(onNext, 800);
        }
    };

    const fetchLocation = (capturedImageUrl: string) => {
        setIsLocating(true);
        setLocationError("");

        if (!navigator.geolocation) {
            setLocationError("Geolocation is not supported by your browser");
            setIsLocating(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setIsLocating(false);
                updateData({
                    ...data,
                    imageUrl: capturedImageUrl,
                    location: {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    }
                });
                // Short delay so user sees location success before moving to next step
                setTimeout(onNext, 1000);
            },
            (error) => {
                setIsLocating(false);
                setLocationError("Failed to get location. Please ensure permissions are granted.");
                console.error("Error getting location:", error);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
        >
            <input
                type="file"
                accept="image/*"
                capture="environment" // Hints mobile browsers to use rear camera
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
            />

            <div
                className={`rounded-3xl p-8 border-2 border-dashed flex flex-col items-center justify-center min-h-[300px] cursor-pointer transition-colors relative overflow-hidden
                    ${data.imageUrl ? 'border-green-500 bg-black' : 'border-green-200 bg-green-50 hover:bg-green-100'}
                `}
                onClick={() => !data.imageUrl && fileInputRef.current?.click()}
            >
                {data.imageUrl ? (
                    <>
                        <img
                            src={data.imageUrl}
                            alt="Captured evidence"
                            className="absolute inset-0 w-full h-full object-cover opacity-80"
                        />
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

            <div className={`bg-white rounded-2xl p-4 shadow-sm border flex flex-col gap-2 ${locationError ? 'border-red-200' : 'border-gray-100'}`}>
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl flex-shrink-0 ${data.location ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                        {isLocating ? <Loader2 className="animate-spin" size={24} /> : (data.location ? <CheckCircle2 size={24} /> : <MapPin size={24} />)}
                    </div>
                    <div className="flex-1">
                        {data.location ? (
                            <>
                                <h4 className="font-semibold text-gray-800 text-sm">Location Acquired</h4>
                                <p className="text-xs text-gray-500">{data.location.lat.toFixed(5)}, {data.location.lng.toFixed(5)}</p>
                            </>
                        ) : (
                            <>
                                <h4 className="font-semibold text-gray-800 text-sm mb-1">
                                    {isLocating ? 'Detecting location...' : 'Location Required'}
                                </h4>
                                <p className="text-xs text-gray-400">
                                    {isLocating ? 'Please wait...' : 'Will be auto-detected upon capture'}
                                </p>
                            </>
                        )}
                    </div>
                </div>
                {locationError && (
                    <p className="text-xs text-red-500 mt-2 px-1 font-medium">{locationError}</p>
                )}
            </div>

            {/* Manual override / next step if location failed but they want to proceed (optional, depends on strictness) */}
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
