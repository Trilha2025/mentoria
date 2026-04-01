"use client";

import { Bell, Search, User as UserIcon } from "lucide-react";
import Link from "next/link";

interface CommunityHeaderProps {
    user: any;
}

export function CommunityHeader({ user }: CommunityHeaderProps) {
    return (
        <header className="h-14 bg-trenchy-bg flex items-center justify-between px-6 sticky top-0 z-30 border-b border-trenchy-border/30">
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

                <div className="flex items-center gap-3 pl-4 border-l border-trenchy-border/50">
                    <div className="hidden md:block text-right">
                        <p className="text-xs font-bold text-trenchy-text-primary uppercase tracking-tight">
                            {user?.name || 'Usuário'}
                        </p>
                        <p className="text-[10px] text-trenchy-text-secondary uppercase font-medium">
                            {user?.role || 'Comunidade'}
                        </p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-trenchy-card border border-trenchy-border flex items-center justify-center overflow-hidden cursor-pointer hover:border-trenchy-orange transition-colors">
                        {user?.avatarUrl ? (
                            <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                            <UserIcon className="w-5 h-5 text-trenchy-text-secondary" />
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
