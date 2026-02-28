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
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 pt-1 px-4 w-full">
            {categories.map((category) => (
                <button
                    key={category}
                    onClick={() => onSelect(category)}
                    className={`relative px-4 py-2 rounded-2xl text-sm font-medium whitespace-nowrap transition-colors shadow-sm ${selected === category
                            ? "text-white bg-green-600 shadow-md shadow-green-200"
                            : "text-gray-600 bg-white hover:bg-gray-50"
                        }`}
                >
                    {category}
                </button>
            ))}
        </div>
    );
}
