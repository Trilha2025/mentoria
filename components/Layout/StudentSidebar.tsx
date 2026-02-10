'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HomeIcon, DocumentDuplicateIcon, ArrowLeftOnRectangleIcon, AcademicCapIcon, ChevronDownIcon, ChevronRightIcon, ClipboardDocumentListIcon, BookOpenIcon } from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';

interface Module {
    id: string;
    title: string;
    status: 'LOCKED' | 'UNLOCKED' | 'COMPLETED';
}

export const StudentSidebar = () => {
    const pathname = usePathname();
    const [modules, setModules] = useState<Module[]>([]);
    const [isModulesOpen, setIsModulesOpen] = useState(true);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchModules();
    }, []);

    const fetchModules = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: dbUser } = await supabase
                .from('User')
                .select('id')
                .eq('email', user.email)
                .single();

            if (!dbUser) return;

            const { data: accessData } = await supabase
                .from('UserModuleAccess')
                .select(`
                    status,
                    module:Module(id, title, order)
                `)
                .eq('userId', dbUser.id)
                .order('module(order)', { ascending: true });

            if (accessData) {
                const formattedModules = accessData.map((access: any) => ({
                    id: access.module.id,
                    title: access.module.title,
                    status: access.status
                }));
                setModules(formattedModules);
            }
        } catch (error) {
            console.error('Erro ao carregar módulos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = '/login';
    };

    const navItems = [
        { name: 'Minha Trilha', href: '/dashboard', icon: HomeIcon },
        { name: 'Plano de Estudo', href: '/plano-estudo', icon: ClipboardDocumentListIcon },
        { name: 'Cadernos', href: '/cadernos', icon: BookOpenIcon },
        { name: 'Materiais', href: '/materiais', icon: DocumentDuplicateIcon },
    ];

    return (
        <div className="hidden md:flex flex-col w-64 bg-trenchy-card h-screen fixed left-0 top-0 z-40 border-r border-trenchy-border transition-colors duration-300">
            <div className="p-6 flex items-center justify-center">
                <h1 className="text-lg font-bold tracking-tight text-trenchy-text-primary">Mentoria VIP</h1>
            </div>

            <nav className="flex-1 px-3 space-y-1 overflow-y-auto mt-4">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all group mb-2 ${isActive
                                ? 'bg-trenchy-orange text-white shadow-lg shadow-orange-900/20'
                                : 'text-trenchy-text-secondary hover:bg-black/5 dark:hover:bg-white/5 hover:text-trenchy-text-primary'
                                }`}
                        >
                            <item.icon className={`h-5 w-5 mr-3 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-trenchy-text-primary'
                                }`} />
                            {item.name}
                        </Link>
                    );
                })}

                {/* Accordion de Módulos */}
                <div className="mt-4">
                    <button
                        onClick={() => setIsModulesOpen(!isModulesOpen)}
                        className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-trenchy-text-secondary hover:bg-black/5 dark:hover:bg-white/5 hover:text-trenchy-text-primary rounded-xl transition-all group mb-2"
                    >
                        <div className="flex items-center">
                            <AcademicCapIcon className="h-5 w-5 mr-3 flex-shrink-0 text-gray-400 group-hover:text-trenchy-text-primary" />
                            Módulos
                        </div>
                        {isModulesOpen ? (
                            <ChevronDownIcon className="h-4 w-4" />
                        ) : (
                            <ChevronRightIcon className="h-4 w-4" />
                        )}
                    </button>

                    {isModulesOpen && (
                        <div className="ml-4 space-y-1 mt-1">
                            {loading ? (
                                <div className="px-4 py-2 text-xs text-trenchy-text-secondary">
                                    Carregando...
                                </div>
                            ) : modules.length === 0 ? (
                                <div className="px-4 py-2 text-xs text-trenchy-text-secondary">
                                    Nenhum módulo disponível
                                </div>
                            ) : (
                                modules.map((module) => {
                                    const isModuleActive = pathname.includes(module.id);
                                    const isLocked = module.status === 'LOCKED';
                                    const isCompleted = module.status === 'COMPLETED';

                                    return (
                                        <Link
                                            key={module.id}
                                            href={isLocked ? '#' : `/modulo/${module.id}`}
                                            className={`flex items-center justify-between px-4 py-2 text-xs rounded-lg transition-all ${isModuleActive
                                                ? 'bg-trenchy-orange/10 text-trenchy-orange font-bold'
                                                : isLocked
                                                    ? 'text-gray-500 cursor-not-allowed opacity-50'
                                                    : 'text-trenchy-text-secondary hover:bg-black/5 dark:hover:bg-white/5 hover:text-trenchy-text-primary'
                                                }`}
                                            onClick={(e) => isLocked && e.preventDefault()}
                                        >
                                            <span className="truncate">{module.title}</span>
                                            {isCompleted && (
                                                <span className="text-green-500 text-xs ml-2">✓</span>
                                            )}
                                            {isLocked && (
                                                <span className="text-xs ml-2">🔒</span>
                                            )}
                                        </Link>
                                    );
                                })
                            )}
                        </div>
                    )}
                </div>
            </nav>

            <div className="p-4">
                <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-3 text-sm font-medium text-trenchy-text-secondary rounded-xl hover:bg-red-500/10 hover:text-red-400 transition-colors"
                >
                    <ArrowLeftOnRectangleIcon className="h-5 w-5 mr-3" />
                    Sair
                </button>
            </div>
        </div>
    );
};
