"use client";

import { motion } from "framer-motion";

const categories = ["All", "Litter", "Open Dump", "Pothole", "Streetlight", "Sewage"];

export default function CategoryFilter({
    selected,
    onSelect,
}: {
    selected: string;
    onSelect: (category: string) => void;
}) {
    return (
        <div className="flex gap-1 overflow-x-auto no-scrollbar w-full items-center">
            {categories.map((category) => (
                <button
                    key={category}
                    onClick={() => onSelect(category)}
                    className={`relative px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center justify-center ${selected === category
                            ? "text-white bg-slate-900 shadow-md transform scale-100"
                            : "text-slate-500 bg-transparent hover:bg-slate-100 hover:text-slate-700"
                        }`}
                >
                    {category}
                </button>
            ))}
        </div>
    );
}
