"use client";

import { Calendar, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import axios from "axios";

export default function Blog() {
    const [articles, setArticles] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>("All");

    const categories = ["All", ...Array.from(new Set(articles.map(a => a.category)))].filter(Boolean);
    const filteredArticles = selectedCategory === "All" ? articles : articles.filter(a => a.category === selectedCategory);


    useEffect(() => {
        const fetchBlogs = async () => {
            try {
                const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/blogs`);
                setArticles(res.data);
            } catch (err) {
                console.error("Failed to fetch blogs:", err);
            }
        };
        fetchBlogs();
    }, []);

    return (
        <main className="min-h-screen bg-gray-50 flex flex-col pt-8 px-6 pb-32">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Civic Updates</h1>
                <p className="text-gray-500 text-sm">Read the latest news on community improvements and civic rights.</p>
            </header>

            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-6">
                {categories.map(c => (
                    <button
                        key={c}
                        onClick={() => setSelectedCategory(c)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${selectedCategory === c
                            ? "bg-gray-800 text-white shadow-sm"
                            : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                            }`}
                    >
                        {c}
                    </button>
                ))}
            </div>

            <div className="space-y-6">
                {filteredArticles.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">No civic updates available for this category right now.</div>
                ) : (
                    filteredArticles.map((article: any) => (
                        <Link href={`/blog/${article._id}`} key={article._id}>
                            <article className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 group cursor-pointer hover:shadow-md transition-shadow mb-6 block">
                                <div className="h-48 overflow-hidden relative">
                                    <img
                                        src={article.imageUrl || "https://images.unsplash.com/photo-1605808360022-d7b38d38865f?auto=format&fit=crop&q=80&w=600"}
                                        alt={article.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <span className="absolute top-4 left-4 bg-white/90 backdrop-blur text-green-700 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                                        {article.category}
                                    </span>
                                </div>
                                <div className="p-5">
                                    <div className="flex items-center gap-2 text-xs text-gray-400 font-medium mb-2">
                                        <Calendar size={12} />
                                        <span>{new Date(article.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <h2 className="font-bold text-gray-800 text-lg leading-snug mb-3 group-hover:text-green-600 transition-colors">
                                        {article.title}
                                    </h2>
                                    <div className="flex items-center gap-2 text-sm text-green-600 font-semibold">
                                        Read Article <ArrowRight size={16} />
                                    </div>
                                </div>
                            </article>
                        </Link>
                    ))
                )}
            </div>
        </main>
    );
}
