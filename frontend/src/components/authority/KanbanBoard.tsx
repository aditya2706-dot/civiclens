import React from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, Navigation, MapPin, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function KanbanBoard({ reports, handleStatusUpdate }: { reports: any[], handleStatusUpdate: (id: string, status: string) => void }) {
    const columns = [
        { id: 'Pending', label: 'Pending Review', color: 'bg-slate-100', borderColor: 'border-slate-200' },
        { id: 'In Progress', label: 'In Progress', color: 'bg-blue-50', borderColor: 'border-blue-200' },
        { id: 'Resolved', label: 'Resolved / Fixed', color: 'bg-emerald-50', borderColor: 'border-emerald-200' }
    ];

    const getColumnReports = (statusId: string) => {
        return reports.filter((r: any) => {
            if (statusId === 'Pending') return !r.status || r.status === 'Pending' || r.status === 'Under Review';
            return r.status === statusId;
        });
    };

    return (
        <div className="flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory">
            {columns.map(col => (
                <div key={col.id} className={`flex-1 min-w-[320px] shrink-0 snap-center rounded-[2rem] border ${col.borderColor} ${col.color} p-4 flex flex-col h-[70vh] overflow-hidden shadow-sm`}>
                    <div className="flex justify-between items-center mb-4 px-2">
                        <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">{col.label}</h3>
                        <span className="bg-white text-slate-600 border border-slate-200 font-bold text-xs px-3 py-1 rounded-full">{getColumnReports(col.id).length}</span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                        {getColumnReports(col.id).map(report => (
                            <motion.div 
                                key={report._id}
                                className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200 relative group cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                                layoutId={report._id}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[9px] uppercase tracking-widest font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                                        {report.category}
                                    </span>
                                    {report.isEscalated && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                                    <Link href={`/authority/reports/${report._id}`} className="ml-auto text-[9px] font-black uppercase text-indigo-500 hover:bg-indigo-50 px-2 py-1 rounded-md transition-colors border border-transparent hover:border-indigo-100 flex items-center gap-1 opacity-0 group-hover:opacity-100">
                                        Dossier <ArrowRight size={10} />
                                    </Link>
                                </div>
                                <p className="text-xs font-bold text-slate-700 line-clamp-2 leading-relaxed mb-3">
                                    {report.description || report.aiSummary}
                                </p>
                                <div className="flex items-center gap-3 text-[9px] uppercase tracking-widest text-slate-400 font-bold">
                                    <span className="flex items-center gap-1"><MapPin size={10} /> {report.ward || "City"}</span>
                                    {report.assignedTo && (
                                        <span className="flex items-center gap-1 text-indigo-500"><Navigation size={10} /> Assigned</span>
                                    )}
                                </div>
                                
                                {col.id !== 'Resolved' && (
                                    <div className="mt-3 pt-3 border-t border-slate-100 flex gap-2">
                                        <select
                                            value={report.status}
                                            onChange={(e) => handleStatusUpdate(report._id, e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 text-[10px] uppercase font-black tracking-widest rounded-lg px-2 py-1.5 text-slate-600 appearance-none outline-none cursor-pointer hover:bg-slate-100"
                                        >
                                            <option value="Pending">Move to Pending</option>
                                            <option value="In Progress">Move to Progress</option>
                                        </select>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                        {getColumnReports(col.id).length === 0 && (
                            <div className="h-32 flex items-center justify-center text-slate-400 text-xs font-bold uppercase tracking-widest border-2 border-dashed border-slate-200 rounded-3xl mx-2">
                                No Tickets
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

// Add these to globals.css later if needed
// .custom-scrollbar::-webkit-scrollbar { width: 4px; }
// .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
// .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
