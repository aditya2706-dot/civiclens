import React, { forwardRef } from 'react';
import { AlertTriangle, MapPin, Calendar } from 'lucide-react';

interface ShareCardProps {
    data: any;
    appName?: string;
}

const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(({ data, appName = "CivicLens" }, ref) => {
    return (
        <div 
            ref={ref} 
            className="w-[1080px] h-[1080px] bg-gradient-to-br from-gray-900 to-gray-800 text-white relative flex flex-col items-center justify-between p-12 overflow-hidden"
            style={{ fontFamily: "'Inter', sans-serif" }}
        >
            {/* Background Image Blurred */}
            <div 
                className="absolute inset-0 opacity-20 blur-2xl transform scale-110"
                style={{ 
                    backgroundImage: `url(${data.imageUrl || data.base64Image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
            />

            {/* Glowing Orbs */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-green-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-40"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-red-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-40"></div>

            {/* Header */}
            <div className="relative z-10 w-full flex justify-between items-center bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 shadow-2xl">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center font-black text-3xl shadow-lg border-2 border-green-300">
                        C
                    </div>
                    <div>
                        <h2 className="text-3xl font-black tracking-tight">{appName}</h2>
                        <p className="text-gray-300 font-medium tracking-widest uppercase text-sm">Official Report</p>
                    </div>
                </div>
                <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-6 py-3 rounded-full flex items-center gap-3 font-bold text-xl uppercase tracking-wider backdrop-blur-sm">
                    <AlertTriangle size={24} />
                    {data.aiAnalysis?.computedSeverity} Severity
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 w-full flex-1 flex gap-10 my-10">
                {/* Photo */}
                <div className="w-1/2 rounded-[40px] overflow-hidden border-8 border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-black flex items-center justify-center relative">
                    <img 
                        src={data.imageUrl || data.base64Image} 
                        alt="Issue" 
                        className="w-full h-full object-cover" 
                        crossOrigin="anonymous"
                    />
                    <div className="absolute top-6 left-6 bg-black/60 backdrop-blur-md px-5 py-2 rounded-full font-bold uppercase tracking-wider text-sm border border-white/20">
                        {data.aiAnalysis?.suggestedCategory}
                    </div>
                </div>

                {/* Details */}
                <div className="w-1/2 flex flex-col justify-center space-y-10">
                    <div className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-3xl">
                        <p className="text-3xl font-medium leading-relaxed text-gray-100">
                            "{data.aiAnalysis?.summary}"
                        </p>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center gap-5 bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl">
                            <div className="bg-white/10 p-4 rounded-full">
                                <MapPin size={32} className="text-green-400" />
                            </div>
                            <div>
                                <h3 className="text-gray-400 uppercase tracking-widest text-sm font-bold mb-1">Location</h3>
                                <p className="text-2xl font-bold truncate">
                                    {data.location?.address || data.aiAnalysis?.suggestedWard || `${data.location?.lat.toFixed(4)}, ${data.location?.lng.toFixed(4)}`}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-5 bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl">
                            <div className="bg-white/10 p-4 rounded-full">
                                <Calendar size={32} className="text-blue-400" />
                            </div>
                            <div>
                                <h3 className="text-gray-400 uppercase tracking-widest text-sm font-bold mb-1">Reported On</h3>
                                <p className="text-2xl font-bold">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="relative z-10 w-full text-center space-y-4">
                <hr className="border-white/20 mb-6 w-1/2 mx-auto" />
                <h3 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300">
                    Let's Fix This Together
                </h3>
                <p className="text-xl text-gray-400 font-medium">Download the {appName} app to track this issue or report yours.</p>
            </div>
        </div>
    );
});

ShareCard.displayName = 'ShareCard';

export default ShareCard;
