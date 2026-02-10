'use client';

import { useState } from 'react';

import { SunIcon, MoonIcon, ChatBubbleLeftRightIcon, UserCircleIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useTheme } from '@/components/Providers/ThemeProvider';
import { useUser } from '@/components/Providers/UserProvider';
import { NotificationBell } from '@/components/Layout/NotificationBell';
import { ChatDrawer } from '@/components/Support/ChatDrawer';

export const StudentTopBar = () => {
    const { user } = useUser();
    const [notifications, setNotifications] = useState(0);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const { theme, toggleTheme } = useTheme();

    return (
        <>
            <div className="bg-background px-8 py-6 flex justify-end items-center sticky top-0 z-30 transition-colors duration-300">

                {/* Right: User Actions */}
                <div className="flex items-center gap-6">

                    {/* Fale com o Mentor */}
                    <button
                        onClick={() => setIsChatOpen(true)}
                        className="flex items-center gap-2 text-sm font-medium text-trenchy-text-secondary hover:text-trenchy-text-primary transition group"
                    >
                        <ChatBubbleLeftRightIcon className="h-5 w-5 group-hover:text-trenchy-orange transition" />
                        Fale com o Mentor
                    </button>

                    <div className="h-8 w-px bg-trenchy-border mx-2 hidden sm:block"></div>

                    {/* User Info */}
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium text-trenchy-text-primary">{user?.name || 'Carregando...'}</p>
                        <p className="text-xs text-trenchy-text-secondary">{user?.email}</p>
                    </div>

                    {/* Avatar / Profile Menu */}
                    <div className="relative group cursor-pointer">
                        {/* Placeholder Avatar */}
                        {user?.avatarUrl ? (
                            <img src={user.avatarUrl} alt="Avatar" className="h-10 w-10 rounded-full border border-gray-200" />
                        ) : (
                            <UserCircleIcon className="h-10 w-10 text-gray-400" />
                        )}

                        {/* Simple Dropdown on Hover */}
                        <div className="absolute right-0 mt-2 w-48 bg-trenchy-card rounded-xl shadow-xl border border-trenchy-border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-right z-50">
                            <div className="py-2">
                                <Link href="/mentoria/profile" className="flex items-center w-full px-4 py-3 text-sm text-trenchy-text-secondary hover:bg-black/5 dark:hover:bg-white/5 hover:text-trenchy-text-primary transition">
                                    <Cog6ToothIcon className="h-4 w-4 mr-2" /> Editar Dados
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="h-8 w-px bg-trenchy-border mx-2 hidden sm:block"></div>

                    {/* Dark Mode Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="p-2 text-trenchy-text-secondary hover:text-trenchy-text-primary transition rounded-full hover:bg-black/5 dark:hover:bg-white/5"
                        title={theme === 'dark' ? "Mudar para Modo Claro" : "Mudar para Modo Escuro"}
                    >
                        {theme === 'dark' ? <SunIcon className="h-6 w-6" /> : <MoonIcon className="h-6 w-6" />}
                    </button>

                    {/* Notification System */}
                    <NotificationBell />

                </div>
            </div>

            {/* Chat Drawer */}
            {user && (
                <ChatDrawer
                    isOpen={isChatOpen}
                    onClose={() => setIsChatOpen(false)}
                    userId={user.id}
                    role={(user.role as 'MENTEE' | 'MENTOR') || 'MENTEE'}
                />
            )}
        </>
    );
};
