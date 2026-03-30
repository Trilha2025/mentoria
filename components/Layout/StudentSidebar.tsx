'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HomeIcon, DocumentDuplicateIcon, ArrowLeftOnRectangleIcon, AcademicCapIcon, ChevronDownIcon, ChevronRightIcon, ClipboardDocumentListIcon, BookOpenIcon, ChatBubbleLeftRightIcon, UserGroupIcon, CalendarDaysIcon, WrenchScrewdriverIcon, LinkIcon, CurrencyDollarIcon, PresentationChartLineIcon } from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';

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

    const navItems: NavItem[] = [
        { name: 'Minha Trilha', href: '/dashboard', icon: HomeIcon },
        { name: 'Agenda', href: '/agenda', icon: CalendarDaysIcon },
        { name: 'Minhas Vendas', href: '/dashboard/ferramentas/faturamento', icon: PresentationChartLineIcon },
        { name: 'Plano de Estudo', href: '/plano-estudo', icon: ClipboardDocumentListIcon },
        { name: 'Comunidade', href: 'https://comunidade.atrilhadoecommerce.com.br', icon: UserGroupIcon },
        { name: 'Cadernos', href: '/cadernos', icon: BookOpenIcon },
        { name: 'Materiais', href: '/materiais', icon: DocumentDuplicateIcon },
        { name: 'Integração', href: '/dashboard/integracao', icon: LinkIcon },
    ];

    return (
        <div className="hidden md:flex flex-col w-64 bg-trenchy-card h-screen fixed left-0 top-0 z-40 border-r border-trenchy-border transition-colors duration-300">
            <div className="p-6 flex items-center justify-center">
                <h1 className="text-lg font-bold tracking-tight text-white/90">Trilha do Ecommerce</h1>
            </div>

            <nav className="flex-1 px-3 space-y-1 overflow-y-auto mt-4">
                {navItems.map((item, index) => {
                    const isActive = pathname === item.href;

                    // Insert Modules Accordion as second item
                    const renderModules = index === 0;

                    const renderItem = (
                        <div key={item.name}>
                            {item.name === 'Comunidade' ? (
                                <CommunityLink item={item} />
                            ) : item.children ? (
                                <div
                                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all group mb-1 text-trenchy-text-secondary hover:bg-black/5 dark:hover:bg-white/5 hover:text-trenchy-text-primary cursor-default`}
                                >
                                    <item.icon className="h-5 w-5 mr-3 flex-shrink-0 text-gray-400 group-hover:text-trenchy-text-primary" />
                                    {item.name}
                                    <ChevronDownIcon className={`ml-auto h-4 w-4 transition-transform ${item.children.some(c => pathname === c.href) ? '' : '-rotate-90'}`} />
                                </div>
                            ) : (
                                <Link
                                    href={item.href}
                                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all group mb-1 ${isActive
                                        ? 'bg-trenchy-orange text-white shadow-lg shadow-orange-900/20'
                                        : 'text-trenchy-text-secondary hover:bg-black/5 dark:hover:bg-white/5 hover:text-trenchy-text-primary'
                                        }`}
                                >
                                    <item.icon className={`h-5 w-5 mr-3 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-trenchy-text-primary'
                                        }`} />
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
                                                className={`block px-3 py-2 text-xs rounded-lg transition-all ${isChildActive
                                                    ? 'text-trenchy-orange font-bold bg-trenchy-orange/10'
                                                    : 'text-trenchy-text-secondary hover:text-trenchy-text-primary hover:bg-white/5'
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
                                        <div className="ml-4 space-y-1 mt-1 transition-all duration-300">
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
                            </div>
                        );
                    }

                    return renderItem;
                })}
            </nav>

            <div className="p-4 space-y-2">
                <Link
                    href="/dashboard/support"
                    className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-xl transition-all group ${pathname.includes('/dashboard/support')
                        ? 'bg-trenchy-orange text-white shadow-lg shadow-orange-900/20'
                        : 'text-trenchy-text-secondary hover:bg-black/5 dark:hover:bg-white/5 hover:text-trenchy-text-primary'
                        }`}
                >
                    <ChatBubbleLeftRightIcon className={`h-5 w-5 mr-3 flex-shrink-0 ${pathname.includes('/dashboard/support') ? 'text-white' : 'text-gray-400 group-hover:text-trenchy-text-primary'}`} />
                    Suporte
                </Link>

                <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-3 text-sm font-medium text-trenchy-text-secondary rounded-xl hover:bg-red-500/10 hover:text-red-400 transition-colors"
                >
                    <ArrowLeftOnRectangleIcon className="h-5 w-5 mr-3" />
                    Sair
                </button>

                <div className="pt-4 border-t border-trenchy-border mt-4 text-center">
                    <p className="text-[10px] text-trenchy-text-secondary font-medium tracking-tight">A Trilha do Ecommerce</p>
                    <p className="text-[10px] text-trenchy-text-secondary opacity-50">&copy; 2026 - Todos os direitos reservados</p>
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
            className="flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all group mb-2 text-trenchy-text-secondary hover:bg-black/5 dark:hover:bg-white/5 hover:text-trenchy-text-primary"
        >
            <item.icon className="h-5 w-5 mr-3 flex-shrink-0 text-gray-400 group-hover:text-trenchy-text-primary" />
            {item.name}
        </a>
    );
}
