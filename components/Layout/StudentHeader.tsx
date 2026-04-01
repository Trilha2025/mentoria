'use client';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { useTheme } from '@/components/Providers/ThemeProvider';
import { SunIcon, MoonIcon, Cog6ToothIcon } from '@heroicons/react/24/outline'; // Adicionei Cog6ToothIcon

export const StudentHeader = () => {
    const [isAdminOrMentor, setIsAdminOrMentor] = useState(false);
    const [isConsulting, setIsConsulting] = useState(false);
    const [userName, setUserName] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const { theme, toggleTheme } = useTheme();

    useEffect(() => {
        checkPermission();
    }, []);

    const checkPermission = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase
                .from('User')
                .select('name, email, role, accessType, avatarUrl')
                .eq('id', user.id)
                .single();

            if (data) {
                setUserName(data.name || 'Mentorado');
                setUserEmail(data.email || '');
                setAvatarUrl(data.avatarUrl || null);
                if (data.role === 'ADMIN' || data.role === 'MENTOR') {
                    setIsAdminOrMentor(true);
                }
                if (data.accessType === 'CONSULTING') {
                    setIsConsulting(true);
                }
            }
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = '/login';
    };

    return (
        <header className="h-16 bg-trenchy-card border-b border-trenchy-border px-6 flex justify-between items-center sticky top-0 z-50 transition-colors duration-300">
            <div className="flex items-center gap-6">
                <Link href="/dashboard" className="text-xl font-bold tracking-tight text-trenchy-text-primary">
                    Consultoria
                </Link>
                <nav className="hidden md:flex gap-6 items-center">
                    <Link
                        href="/dashboard"
                        className="text-sm font-medium text-trenchy-text-primary hover:text-trenchy-text-secondary transition"
                    >
                        Minha Trilha
                    </Link>
                    {isConsulting && (
                        <Link
                            href="/minha-equipe"
                            className="text-sm font-medium text-trenchy-text-primary hover:text-trenchy-text-secondary transition"
                        >
                            Minha Equipe
                        </Link>
                    )}
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
                {/* Profile Section with Hover Dropdown */}
                <div className="relative group flex items-center gap-4">
                    {/* Left Divider */}
                    <div className="h-10 w-[1px] bg-trenchy-border mx-1" />
                    
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-trenchy-text-primary">
                            {userName}
                        </p>
                        <p className="text-[10px] text-trenchy-text-secondary uppercase">
                            Meu Perfil
                        </p>
                    </div>

                    {/* Avatar with White Border */}
                    <div className="w-10 h-10 rounded-full border-2 border-white dark:border-trenchy-border lg:border-white overflow-hidden bg-trenchy-bg shadow-sm transition-transform duration-200">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt={userName} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-trenchy-text-secondary font-bold">
                                {userName.charAt(0).toUpperCase()}
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

                <div className="flex items-center gap-1">
                    <button
                        onClick={toggleTheme}
                        className="p-2 text-trenchy-text-secondary hover:text-trenchy-text-primary transition rounded-full hover:bg-black/5 dark:hover:bg-white/5"
                        title={theme === 'dark' ? "Mudar para Modo Claro" : "Mudar para Modo Escuro"}
                    >
                        {theme === 'dark' ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
                    </button>

                    <button
                        onClick={handleLogout}
                        className="p-2 text-trenchy-text-secondary hover:text-red-500 transition"
                        title="Sair"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                        </svg>
                    </button>
                </div>
            </div>
        </header>
    );
};
