'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { useTheme } from '@/components/Providers/ThemeProvider';
import { SunIcon, MoonIcon, ArrowRightOnRectangleIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { NotificationBell } from '@/components/Layout/NotificationBell';

export const AdminHeader = () => {
    const pathname = usePathname();
    const [role, setRole] = useState<string>('');
    const [avatar, setAvatar] = useState<string | null>(null);
    const { theme, toggleTheme } = useTheme();

    useEffect(() => {
        checkRole();
    }, []);

    const checkRole = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase.from('User').select('role, avatarUrl').eq('email', user.email).single();
            setRole(data?.role || '');
            setAvatar(data?.avatarUrl || null);
        }
    };

    const isActive = (path: string) => pathname === path || pathname.startsWith(path);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = '/login';
    };

    return (
        <header className="bg-trenchy-card border-b border-trenchy-border px-8 py-4 flex justify-between items-center sticky top-0 z-50 transition-colors duration-300">
            <div className="flex items-center gap-8">
                <Link href={role === 'ADMIN' ? "/admin/dashboard" : "/admin/mentoria"} className="text-xl font-bold tracking-tight text-trenchy-text-primary">
                    {role === 'ADMIN' ? 'Control Room' : 'Mentoria Admin'}
                </Link>

                <nav className="hidden md:flex gap-6">
                    {role === 'ADMIN' && (
                        <Link
                            href="/admin/dashboard"
                            className={`text-sm font-medium transition ${isActive('/admin/dashboard') ? 'text-trenchy-orange font-bold' : 'text-trenchy-text-secondary hover:text-trenchy-text-primary'}`}
                        >
                            Visão Geral
                        </Link>
                    )}
                    <Link
                        href="/admin/mentoria"
                        className={`text-sm font-medium transition ${isActive('/admin/mentoria') ? 'text-trenchy-orange font-bold' : 'text-trenchy-text-secondary hover:text-trenchy-text-primary'}`}
                    >
                        Alunos
                    </Link>
                    <Link
                        href="/admin/review-queue"
                        className={`text-sm font-medium transition ${isActive('/admin/review-queue') ? 'text-trenchy-orange font-bold' : 'text-trenchy-text-secondary hover:text-trenchy-text-primary'}`}
                    >
                        Fila de Revisão
                    </Link>
                    <Link
                        href="/admin/support"
                        className={`text-sm font-medium transition ${isActive('/admin/support') ? 'text-trenchy-orange font-bold' : 'text-trenchy-text-secondary hover:text-trenchy-text-primary'}`}
                    >
                        Suporte
                    </Link>
                    {/* ... (Other links remain same) */}
                    {role === 'ADMIN' && (
                        <>
                            <Link
                                href="/admin/modules"
                                className={`text-sm font-medium transition ${isActive('/admin/modules') ? 'text-trenchy-orange font-bold' : 'text-trenchy-text-secondary hover:text-trenchy-text-primary'}`}
                            >
                                Módulos
                            </Link>
                            <Link
                                href="/admin/lessons"
                                className={`text-sm font-medium transition ${isActive('/admin/lessons') ? 'text-trenchy-orange font-bold' : 'text-trenchy-text-secondary hover:text-trenchy-text-primary'}`}
                            >
                                Aulas
                            </Link>
                            <Link
                                href="/admin/team"
                                className={`text-sm font-medium transition ${isActive('/admin/team') ? 'text-trenchy-orange font-bold' : 'text-trenchy-text-secondary hover:text-trenchy-text-primary'}`}
                            >
                                Equipe
                            </Link>
                        </>
                    )}
                </nav>
            </div>

            <div className="flex items-center gap-4">
                <span className={`text-xs px-2 py-1 rounded font-bold ${role === 'ADMIN' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'}`}>
                    {role || '...'}
                </span>

                <button
                    onClick={toggleTheme}
                    className="p-2 text-trenchy-text-secondary hover:text-trenchy-text-primary transition rounded-full hover:bg-black/5 dark:hover:bg-white/5"
                    title={theme === 'dark' ? "Mudar para Modo Claro" : "Mudar para Modo Escuro"}
                >
                    {theme === 'dark' ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
                </button>

                <div className="h-6 w-px bg-trenchy-border mx-2"></div>

                <NotificationBell />

                <div className="h-6 w-px bg-trenchy-border mx-2"></div>

                <Link
                    href="/admin/profile"
                    className="text-sm text-trenchy-text-secondary hover:text-trenchy-text-primary font-medium flex items-center gap-2 group"
                >
                    {avatar ? (
                        <img src={avatar} alt="Avatar" className="h-6 w-6 rounded-full border border-gray-200 object-cover" />
                    ) : (
                        <UserCircleIcon className="h-6 w-6" />
                    )}
                    <span className="hidden sm:inline">Meu Perfil</span>
                </Link>

                <div className="h-6 w-px bg-trenchy-border mx-2"></div>

                <button
                    onClick={handleLogout}
                    className="text-sm text-red-600 hover:text-red-500 font-medium flex items-center gap-1"
                >
                    <ArrowRightOnRectangleIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">Sair</span>
                </button>
            </div>
        </header>
    );
};
