'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
    Home, 
    Calendar, 
    BarChart3, 
    ClipboardList, 
    Users, 
    BookOpen, 
    Files, 
    Link2, 
    GraduationCap, 
    ChevronDown, 
    ChevronRight, 
    MessageCircle, 
    LogOut,
    Lock
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@/components/Providers/UserProvider';

interface Module {
    id: string;
    title: string;
    status: 'LOCKED' | 'UNLOCKED' | 'COMPLETED';
}

interface NavItem {
    name: string;
    href: string;
    icon: any;
    children?: { name: string; href: string }[];
}

export const StudentSidebar = () => {
    const pathname = usePathname();
    const { user } = useUser();
    const [modules, setModules] = useState<Module[]>([]);
    const [isModulesOpen, setIsModulesOpen] = useState(true);
    const [loadingModules, setLoadingModules] = useState(true);

    useEffect(() => {
        if (user?.id) {
            fetchModules();
        }
    }, [user?.id]);

    const fetchModules = async () => {
        try {
            setLoadingModules(true);
            const { data: accessData } = await supabase
                .from('UserModuleAccess')
                .select(`
                    status,
                    module:Module(id, title, order)
                `)
                .eq('userId', user!.id)
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
            setLoadingModules(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = '/login';
    };

    const navItems: NavItem[] = [
        { name: 'Minha Trilha', href: '/dashboard', icon: Home },
        { name: 'Agenda', href: '/agenda', icon: Calendar },
        { name: 'Minhas Vendas', href: '/dashboard/ferramentas/faturamento', icon: BarChart3 },
        { name: 'Plano de Estudo', href: '/plano-estudo', icon: ClipboardList },
        { name: 'Comunidade', href: 'https://comunidade.atrilhadoecommerce.com.br', icon: Users },
        { name: 'Cadernos', href: '/cadernos', icon: BookOpen },
        { name: 'Materiais', href: '/materiais', icon: Files },
        { name: 'Integração', href: '/dashboard/integracao', icon: Link2 },
    ];

    return (
        <div className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 z-40 border-r border-trenchy-border glass transition-all duration-500">
            <div className="p-6 flex items-center justify-center">
                <motion.h1 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-xl font-bold tracking-tighter text-trenchy-text-primary dark:bg-gradient-to-r dark:from-white dark:via-white dark:to-white/60 dark:bg-clip-text dark:text-transparent"
                >
                    A Trilha do Ecommerce
                </motion.h1>
            </div>

            <nav className="flex-1 px-4 space-y-1 overflow-y-auto mt-2 custom-scrollbar">
                {navItems.map((item, index) => {
                    const isActive = pathname === item.href;
                    const renderModules = index === 0;

                    const renderItem = (
                        <div key={item.name}>
                            {item.name === 'Comunidade' ? (
                                <CommunityLink item={item} />
                            ) : item.children ? (
                                <div
                                    className="flex items-center px-4 py-3 text-sm font-medium rounded-2xl transition-all group mb-1 text-trenchy-text-secondary hover:bg-white/5 hover:text-white cursor-default"
                                >
                                    <item.icon className="h-4 w-4 mr-3 flex-shrink-0 text-trenchy-text-secondary group-hover:text-trenchy-text-primary dark:group-hover:text-white transition-colors" strokeWidth={1.5} />
                                    {item.name}
                                    <ChevronDown className={`ml-auto h-4 w-4 transition-transform ${item.children.some(c => pathname === c.href) ? '' : '-rotate-90'}`} />
                                </div>
                            ) : (
                                <Link
                                    href={item.href}
                                    className={`relative flex items-center px-3.5 py-2.5 text-sm font-medium rounded-2xl transition-all group mb-1 ${isActive
                                        ? 'bg-trenchy-orange/15 text-trenchy-orange font-bold'
                                        : 'text-trenchy-text-secondary hover:bg-black/5 dark:hover:bg-white/5 hover:text-trenchy-text-primary dark:hover:text-white'
                                        }`}
                                >
                                    {isActive && (
                                        <motion.div 
                                            layoutId="active-indicator"
                                            className="absolute left-0 w-1 md:dark:w-1 md:w-[4px] h-6 bg-trenchy-orange rounded-r-full"
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        />
                                    )}
                                    <item.icon className={`h-4 w-4 mr-3 flex-shrink-0 transition-colors ${isActive ? 'text-trenchy-orange' : 'text-trenchy-text-secondary group-hover:text-trenchy-text-primary dark:group-hover:text-white'
                                        }`} strokeWidth={1.5} />
                                    {item.name}
                                </Link>
                            )}

                            {item.children && (
                                <div className="ml-9 space-y-1 mb-2">
                                    {item.children.map((child) => {
                                        const isChildActive = pathname === child.href;
                                        return (
                                            <Link
                                                key={child.name}
                                                href={child.href}
                                                className={`block px-3 py-2 text-xs rounded-xl transition-all ${isChildActive
                                                    ? 'text-trenchy-orange font-bold bg-trenchy-orange/10'
                                                    : 'text-trenchy-text-secondary hover:text-trenchy-text-primary dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                                                    }`}
                                            >
                                                {child.name}
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );

                    if (renderModules) {
                        return (
                            <div key="group-1">
                                {renderItem}
                                <div className="mt-4">
                                    <button
                                        onClick={() => setIsModulesOpen(!isModulesOpen)}
                                        className="flex items-center justify-between w-full px-3.5 py-2.5 text-sm font-medium text-trenchy-text-secondary hover:bg-black/5 dark:hover:bg-white/5 hover:text-trenchy-text-primary dark:hover:text-white rounded-2xl transition-all group mb-2"
                                    >
                                        <div className="flex items-center">
                                            <GraduationCap className="h-4 w-4 mr-3 flex-shrink-0 text-trenchy-text-secondary group-hover:text-trenchy-text-primary dark:group-hover:text-white transition-colors" strokeWidth={1.5} />
                                            Módulos
                                        </div>
                                        <motion.div
                                            animate={{ rotate: isModulesOpen ? 0 : -90 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <ChevronDown className="h-4 w-4" />
                                        </motion.div>
                                    </button>

                                    <AnimatePresence>
                                        {isModulesOpen && (
                                            <motion.div 
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="ml-4 space-y-1 mt-1 overflow-hidden"
                                            >
                                                {loadingModules ? (
                                                    <div className="px-4 py-2 text-xs text-trenchy-text-secondary italic">
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
                                                                className={`flex items-center justify-between px-4 py-2 text-xs rounded-xl transition-all ${isModuleActive
                                                                    ? 'bg-trenchy-orange/10 text-trenchy-orange font-bold'
                                                                    : isLocked
                                                                        ? 'text-white/20 cursor-not-allowed'
                                                                        : 'text-trenchy-text-secondary hover:bg-black/5 dark:hover:bg-white/5 hover:text-trenchy-text-primary dark:hover:text-white'
                                                                    }`}
                                                                onClick={(e) => isLocked && e.preventDefault()}
                                                            >
                                                                <span className="truncate">{module.title}</span>
                                                                {isCompleted && (
                                                                    <span className="text-green-500 text-[10px] ml-2">●</span>
                                                                )}
                                                                {isLocked && (
                                                                    <Lock className="h-3 w-3 text-white/20 ml-2" />
                                                                )}
                                                            </Link>
                                                        );
                                                    })
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        );
                    }

                    return renderItem;
                })}
            </nav>

            <div className="p-5 space-y-1.5 mt-auto">
                <Link
                    href="/dashboard/support"
                    className={`relative flex items-center w-full px-3.5 py-2.5 text-sm font-medium rounded-2xl transition-all group ${pathname.includes('/dashboard/support')
                        ? 'bg-trenchy-orange/15 text-trenchy-orange font-bold'
                        : 'text-trenchy-text-secondary hover:bg-black/5 dark:hover:bg-white/5 hover:text-trenchy-text-primary dark:hover:text-white'
                        }`}
                >
                    {pathname.includes('/dashboard/support') && (
                        <motion.div 
                            layoutId="active-indicator"
                            className="absolute left-0 w-1 md:dark:w-1 md:w-[4px] h-6 bg-trenchy-orange rounded-r-full"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                    )}
                    <MessageCircle className={`h-4 w-4 mr-3 flex-shrink-0 transition-colors ${pathname.includes('/dashboard/support') ? 'text-trenchy-orange' : 'text-trenchy-text-secondary group-hover:text-trenchy-text-primary dark:group-hover:text-white'}`} strokeWidth={1.5} />
                    Suporte
                </Link>

                <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-3.5 py-2.5 text-sm font-medium text-trenchy-text-secondary rounded-2xl hover:bg-red-500/10 hover:text-red-400 transition-all group"
                >
                    <LogOut className="h-4 w-4 mr-3 transition-transform group-hover:-translate-x-1" strokeWidth={1.5} />
                    Sair
                </button>

                <div className="pt-6 border-t border-trenchy-border mt-4 text-center">
                    <p className="text-[10px] text-trenchy-text-secondary font-semibold uppercase tracking-widest opacity-40">A Trilha do Ecommerce</p>
                    <p className="text-[9px] text-trenchy-text-secondary opacity-30 mt-1">&copy; 2026 - Premium Experience</p>
                </div>
            </div>
        </div>
    );
};

function CommunityLink({ item }: { item: any }) {
    const [url, setUrl] = useState('#');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const host = window.location.host;
            const protocol = window.location.protocol;

            if (host.includes('localhost')) {
                if (host.startsWith('comunidade.')) {
                    setUrl(`${protocol}//${host}`);
                } else {
                    setUrl(`${protocol}//comunidade.${host}`);
                }
            } else {
                const parts = host.split('.');
                if (parts.length > 2) {
                    if (parts[0] !== 'comunidade') {
                        parts[0] = 'comunidade';
                    }
                    setUrl(`${protocol}//${parts.join('.')}`);
                } else {
                    if (!host.startsWith('comunidade.')) {
                        setUrl(`${protocol}//comunidade.${host}`);
                    } else {
                        setUrl(`${protocol}//${host}`);
                    }
                }
            }
        }
    }, []);

    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center px-3.5 py-2.5 text-sm font-medium rounded-2xl transition-all group mb-2 text-trenchy-text-secondary hover:bg-black/5 dark:hover:bg-white/5 hover:text-trenchy-text-primary dark:hover:text-white"
        >
            <item.icon className="h-4 w-4 mr-3 flex-shrink-0 text-trenchy-text-secondary group-hover:text-trenchy-text-primary dark:group-hover:text-white transition-colors" strokeWidth={1.5} />
            {item.name}
        </a>
    );
}

