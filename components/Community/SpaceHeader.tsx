"use client";

import { Hash, ChevronDown, Users, Ellipsis, Plus, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface SpaceHeaderProps {
    name: string;
    emoji?: string | null;
    onNewPost?: () => void;
}

export function SpaceHeader({ name, emoji, onNewPost }: SpaceHeaderProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentSort = searchParams.get("sort") || "recent";
    const menuRef = useRef<HTMLDivElement>(null);

    const sortOptions = [
        { id: "recent", label: "Mais recente" },
        { id: "oldest", label: "Mais antiga" }
    ];

    const activeLabel = sortOptions.find(o => o.id === currentSort)?.label || "Mais recente";

    const handleSort = (sortId: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("sort", sortId);
        router.push(`?${params.toString()}`);
        setIsMenuOpen(false);
    };

    // Close menu on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="h-16 border-b dark:border-white/10 border-black/10 bg-transparent flex items-center justify-between px-6 -mx-4 md:-mx-6 mb-4">
            {/* Left: Icon and Name */}
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center dark:bg-white/5 bg-black/5 rounded-lg text-lg border dark:border-white/5 border-black/5">
                    {emoji || <Hash className="w-4 h-4 text-trenchy-text-secondary" />}
                </div>
                <h2 className="text-base font-bold dark:text-white text-black tracking-tight">{name}</h2>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
                {/* Sorting Dropdown */}
                <div className="relative" ref={menuRef}>
                    <button 
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="hidden md:flex items-center gap-2 text-xs font-bold text-trenchy-text-secondary hover:dark:text-white hover:text-black transition-all px-3 py-1.5 rounded-lg hover:dark:bg-white/5 hover:bg-black/5 uppercase tracking-wider"
                    >
                        {activeLabel}
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isMenuOpen && (
                        <div className="absolute right-0 mt-2 w-48 dark:bg-[#1e292d] bg-white border dark:border-white/10 border-black/5 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            <div className="py-1">
                                {sortOptions.map((option) => (
                                    <button
                                        key={option.id}
                                        onClick={() => handleSort(option.id)}
                                        className="w-full text-left px-4 py-2.5 text-xs font-bold dark:text-trenchy-text-secondary text-gray-600 hover:dark:bg-white/5 hover:bg-gray-50 flex items-center justify-between group transition-colors"
                                    >
                                        <span className={currentSort === option.id ? 'dark:text-white text-black' : ''}>
                                            {option.label}
                                        </span>
                                        {currentSort === option.id && <Check className="w-3.5 h-3.5 text-trenchy-orange" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Nova Publicação Button */}
                <button 
                    onClick={onNewPost}
                    className="bg-trenchy-orange hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-trenchy-orange/20"
                >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Nova publicação</span>
                </button>

                {/* More Options */}
                <button className="p-1.5 text-trenchy-text-secondary hover:dark:text-white hover:text-black transition-colors rounded-lg hover:dark:bg-white/5 hover:bg-black/5">
                    <Ellipsis className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
