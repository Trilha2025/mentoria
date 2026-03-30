"use client";

import { Bell, Search, User } from "lucide-react";
import Link from "next/link";

export function CommunityHeader() {
    return (
        <header className="h-14 bg-trenchy-bg flex items-center justify-between px-6 sticky top-0 z-30">
            {/* Search */}
            <div className="flex-1 max-w-lg">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-trenchy-text-secondary" />
                    <input
                        placeholder="Pesquisar na comunidade..."
                        className="w-full bg-trenchy-card border border-trenchy-border rounded-lg pl-9 pr-4 py-1.5 text-sm text-trenchy-text-primary focus:outline-none focus:border-trenchy-orange transition-colors"
                    />
                </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-4 ml-4">
                <button className="text-trenchy-text-secondary hover:text-trenchy-text-primary transition-colors relative">
                    <Bell className="w-5 h-5" />
                    {/* Badge */}
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-trenchy-orange rounded-full" />
                </button>

                <div className="w-8 h-8 rounded-full bg-trenchy-card border border-trenchy-border flex items-center justify-center overflow-hidden cursor-pointer hover:border-trenchy-orange transition-colors">
                    {/* Placeholder Avatar */}
                    <User className="w-5 h-5 text-trenchy-text-secondary" />
                </div>
            </div>
        </header>
    );
}
