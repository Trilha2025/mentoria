"use client";

import { Search, User as UserIcon } from "lucide-react";
import { BellIcon, SunIcon, MoonIcon, Cog6ToothIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useTheme } from "@/components/Providers/ThemeProvider";

interface CommunityHeaderProps {
    user: any;
}

export function CommunityHeader({ user }: CommunityHeaderProps) {
    const { theme, toggleTheme } = useTheme();

    return (
        <header className="h-16 bg-trenchy-card flex items-center justify-between px-6 sticky top-0 z-30 border-b border-trenchy-border transition-colors duration-300">
            {/* Search */}
            <div className="flex-1 max-w-lg">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-trenchy-text-secondary" />
                    <input
                        placeholder="Pesquisar na comunidade..."
                        className="w-full bg-background border border-trenchy-border rounded-xl pl-9 pr-4 py-2 text-sm text-trenchy-text-primary focus:outline-none focus:border-trenchy-orange transition-colors"
                    />
                </div>
            </div>

            {/* Right Actions - Reconstructed per Reference Image */}
            <div className="flex items-center gap-4">
                {/* Profile Section with Hover Dropdown */}
                <div className="relative group flex items-center gap-4">
                    {/* Left Divider */}
                    <div className="h-10 w-[1px] bg-trenchy-border mx-1" />
                    
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-trenchy-text-primary">
                            {user?.name || 'Usuário'}
                        </p>
                        <p className="text-[10px] text-trenchy-text-secondary uppercase">
                            Meu Perfil
                        </p>
                    </div>

                    {/* Avatar with White Border */}
                    <div className="w-10 h-10 rounded-full border-2 border-white dark:border-trenchy-border lg:border-white overflow-hidden bg-trenchy-bg shadow-sm transition-transform duration-200">
                        {user?.avatarUrl ? (
                            <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-trenchy-text-secondary font-bold">
                                {user?.name?.charAt(0).toUpperCase() || <UserIcon className="w-5 h-5" />}
                            </div>
                        )}
                    </div>

                    {/* New Dropdown (Screenshot match) */}
                    <div className="absolute top-full right-0 mt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                        <Link 
                            href="/perfil" 
                            className="flex items-center gap-2 bg-[#1e292d] border border-white/10 rounded-xl px-5 py-4 min-w-[180px] shadow-2xl hover:bg-[#2a373c] transition-colors"
                        >
                            <Cog6ToothIcon className="w-5 h-5 text-white/70" />
                            <span className="text-sm font-medium text-white">Editar Dados</span>
                        </Link>
                    </div>
                </div>

                {/* Vertical Divider */}
                <div className="h-8 w-[1px] bg-trenchy-border mx-1" />

                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="p-2 text-trenchy-text-secondary hover:text-trenchy-text-primary transition rounded-full hover:bg-black/5 dark:hover:bg-white/5"
                    title={theme === 'dark' ? "Modo Claro" : "Modo Escuro"}
                >
                    {theme === 'dark' ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
                </button>

                {/* Notifications Bell */}
                <button className="p-2 text-trenchy-text-secondary hover:text-trenchy-text-primary transition-colors relative rounded-full hover:bg-black/5 dark:hover:bg-white/5">
                    <BellIcon className="w-5 h-5" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-trenchy-orange rounded-full border border-trenchy-card" />
                </button>
            </div>
        </header>
    );
}
