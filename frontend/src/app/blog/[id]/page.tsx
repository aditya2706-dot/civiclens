"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { ArrowLeft, Calendar, User, Tag } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function BlogDetail() {
    const params = useParams();
    const id = params.id;
    const [article, setArticle] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchArticle = async () => {
            try {
                const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/blogs/${id}`);
                setArticle(res.data);
            } catch (err) {
                console.error("Failed to fetch blog details:", err);
            } finally {
                setLoading(false);
            }
        };
        if (id) {
            fetchArticle();
        }
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center pb-32">
                <div className="text-green-600 font-medium">Loading article...</div>
            </div>
        );
    }

    if (!article) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center pb-32 px-6 text-center space-y-4">
                <h2 className="text-2xl font-bold text-gray-800">Article Not Found</h2>
                <p className="text-gray-500">The civic update you're looking for doesn't exist.</p>
                <Link href="/blog" className="px-6 py-2 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-colors">
                    Back to Blogs
                </Link>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50 flex flex-col pb-32">
            <div className="relative h-64 w-full bg-gray-200">
                <img
                    src={article.imageUrl || "https://images.unsplash.com/photo-1605808360022-d7b38d38865f?auto=format&fit=crop&q=80&w=1200"}
                    alt={article.title}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                <div className="absolute top-6 left-6 right-6 flex justify-between items-center">
                    <Link href="/blog">
                        <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-white hover:text-gray-900 transition-colors shadow-sm cursor-pointer">
                            <ArrowLeft size={20} />
                        </div>
                    </Link>
                </div>

                <div className="absolute bottom-6 left-6 right-6">
                    <span className="inline-block bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm mb-3">
                        {article.category}
                    </span>
                    <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                        {article.title}
                    </h1>
                </div>
            </div>

            <div className="px-6 py-8">
                <div className="flex items-center gap-6 border-b border-gray-200 pb-6 mb-6">
                    <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                        <Calendar size={16} className="text-green-600" />
                        <span>{new Date(article.createdAt).toLocaleDateString()}</span>
                    </div>
                    {article.author && article.author.name && (
                        <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                            <User size={16} className="text-green-600" />
                            <span>{article.author.name}</span>
                        </div>
                    )}
                </div>

                <div className="prose prose-green max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {article.content}
                </div>
            </div>
        </main>
    );
}
