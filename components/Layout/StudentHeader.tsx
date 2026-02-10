'use client';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { useTheme } from '@/components/Providers/ThemeProvider';
import { SunIcon, MoonIcon, Bars3Icon } from '@heroicons/react/24/outline'; // Adicionei Bars3 se precisar, ou mantive layout

export const StudentHeader = () => {
    const [isAdminOrMentor, setIsAdminOrMentor] = useState(false);
    const { theme, toggleTheme } = useTheme();

    useEffect(() => {
        checkPermission();
    }, []);

    const checkPermission = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase
                .from('User')
                .select('role')
                .eq('email', user.email)
                .single();

            if (data?.role === 'ADMIN' || data?.role === 'MENTOR') {
                setIsAdminOrMentor(true);
            }
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = '/login';
    };

    return (
        <header className="bg-trenchy-card border-b border-trenchy-border px-6 py-4 flex justify-between items-center sticky top-0 z-50 transition-colors duration-300">
            <div className="flex items-center gap-6">
                <Link href="/dashboard" className="text-xl font-bold tracking-tight text-trenchy-text-primary">
                    Mentoria High Ticket
                </Link>
                <nav className="hidden md:flex gap-6 items-center">
                    <Link
                        href="/dashboard"
                        className="text-sm font-medium text-trenchy-text-primary hover:text-trenchy-text-secondary transition"
                    >
                        Minha Trilha
                    </Link>
                    {isAdminOrMentor && (
                        <Link
                            href="/admin/mentoria"
                            className="text-xs bg-black dark:bg-white text-white dark:text-black px-3 py-1 rounded font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition"
                        >
                            PAINEL ADMIN
                        </Link>
                    )}
                </nav>
            </div>

            <div className="flex items-center gap-4">
                <button
                    onClick={toggleTheme}
                    className="p-2 text-trenchy-text-secondary hover:text-trenchy-text-primary transition rounded-full hover:bg-black/5 dark:hover:bg-white/5"
                    title={theme === 'dark' ? "Mudar para Modo Claro" : "Mudar para Modo Escuro"}
                >
                    {theme === 'dark' ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
                </button>

                <button
                    onClick={handleLogout}
                    className="text-sm text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 font-medium"
                >
                    Sair
                </button>
            </div>
        </header>
    );
};
