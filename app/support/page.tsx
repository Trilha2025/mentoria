'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { MagnifyingGlassIcon, ArrowLeftStartOnRectangleIcon } from '@heroicons/react/24/outline';

interface Ticket {
    id: string;
    subject: string | null;
    status: string;
    createdAt: string;
    updatedAt: string;
    user: {
        id: string;
        name: string | null;
        email: string;
    };
    _count: {
        messages: number;
    };
    unreadCount: number;
    lastMessage: {
        content: string;
        createdAt: string;
    } | null;
}

export default function SupportPage() {
    const router = useRouter();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');
    const [search, setSearch] = useState('');
    const [stats, setStats] = useState({
        open: 0,
        inProgress: 0,
        resolvedToday: 0,
    });

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    useEffect(() => {
        fetchTickets();
    }, [filter, search]);

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filter !== 'ALL') params.append('status', filter);
            if (search) params.append('search', search);
            params.append('category', 'TECHNICAL'); // Added category filter

            // Fetch only TECHNICAL tickets for SAC support
            const response = await fetch(`/api/support/tickets?${params.toString()}&t=${Date.now()}`, { cache: 'no-store' });
            const data = await response.json();

            if (data.success) {
                setTickets(data.tickets);

                const open = data.tickets.filter((t: Ticket) => t.status === 'OPEN').length;
                const inProgress = data.tickets.filter((t: Ticket) => t.status === 'IN_PROGRESS').length;

                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const resolvedToday = data.tickets.filter((t: Ticket) => {
                    if (t.status !== 'RESOLVED' && t.status !== 'CLOSED') return false;
                    const updatedDate = new Date(t.updatedAt);
                    return updatedDate >= today;
                }).length;

                setStats({ open, inProgress, resolvedToday });
            }
        } catch (error) {
            console.error('Error fetching tickets:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            OPEN: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
            IN_PROGRESS: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
            RESOLVED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
            CLOSED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
        };

        const labels: Record<string, string> = {
            OPEN: 'Aberto',
            IN_PROGRESS: 'Em andamento',
            RESOLVED: 'Resolvido',
            CLOSED: 'Fechado',
        };

        return (
            <span className={`text-xs px-2 py-1 rounded-full font-bold ${styles[status] || styles.OPEN}`}>
                {labels[status] || status}
            </span>
        );
    };

    const getTimeAgo = (date: string) => {
        const now = new Date();
        const then = new Date(date);
        const diff = now.getTime() - then.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);

        if (days > 0) return `Há ${days} dia${days > 1 ? 's' : ''}`;
        if (hours > 0) return `Há ${hours} hora${hours > 1 ? 's' : ''}`;
        return 'Agora mesmo';
    };

    return (
        <div className="max-w-7xl mx-auto p-8 w-full">
            <header className="mb-8 flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-trenchy-text-primary">Painel SAC</h1>
                    <p className="text-trenchy-text-secondary mt-2">Gerenciamento de tickets de suporte</p>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 dark:bg-red-900/10 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition"
                    title="Sair do sistema"
                >
                    <ArrowLeftStartOnRectangleIcon className="h-5 w-5" />
                    Sair
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-trenchy-card border border-trenchy-border rounded-xl p-6">
                    <p className="text-sm text-trenchy-text-secondary mb-1">Abertos</p>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.open}</p>
                </div>
                <div className="bg-trenchy-card border border-trenchy-border rounded-xl p-6">
                    <p className="text-sm text-trenchy-text-secondary mb-1">Em andamento</p>
                    <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{stats.inProgress}</p>
                </div>
                <div className="bg-trenchy-card border border-trenchy-border rounded-xl p-6">
                    <p className="text-sm text-trenchy-text-secondary mb-1">Resolvidos hoje</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.resolvedToday}</p>
                </div>
            </div>

            <div className="bg-trenchy-card border border-trenchy-border rounded-xl p-6 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-trenchy-text-secondary" />
                        <input
                            type="text"
                            placeholder="Buscar por nome, email ou assunto..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-black/5 dark:bg-white/5 border border-trenchy-border rounded-lg text-trenchy-text-primary placeholder:text-trenchy-text-secondary focus:outline-none focus:border-trenchy-orange"
                        />
                    </div>

                    <div className="flex gap-2">
                        {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilter(status)}
                                className={`px-4 py-2 rounded-lg font-bold text-sm transition ${filter === status
                                    ? 'bg-trenchy-orange text-white'
                                    : 'bg-black/5 dark:bg-white/5 text-trenchy-text-secondary hover:bg-trenchy-orange/10'
                                    }`}
                            >
                                {status === 'ALL' ? 'Todos' : status === 'OPEN' ? 'Abertos' : status === 'IN_PROGRESS' ? 'Em andamento' : status === 'RESOLVED' ? 'Resolvidos' : 'Fechados'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-trenchy-orange"></div>
                </div>
            ) : tickets.length === 0 ? (
                <div className="bg-trenchy-card border border-trenchy-border rounded-xl p-12 text-center">
                    <p className="text-trenchy-text-secondary">Nenhum ticket encontrado</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {tickets.map((ticket) => (
                        <Link
                            key={ticket.id}
                            href={`/support/ticket/${ticket.id}`}
                            className="block bg-trenchy-card border border-trenchy-border rounded-xl p-6 hover:border-trenchy-orange transition group"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="font-bold text-trenchy-text-primary group-hover:text-trenchy-orange transition">
                                            {ticket.subject || 'Sem assunto'}
                                        </h3>
                                        {getStatusBadge(ticket.status)}
                                        {ticket.unreadCount > 0 && (
                                            <span className="bg-trenchy-orange text-white text-xs px-2 py-0.5 rounded-full font-bold">
                                                {ticket.unreadCount} nova{ticket.unreadCount > 1 ? 's' : ''}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-trenchy-text-secondary">
                                        {ticket.user.name || 'Sem nome'} • {ticket.user.email}
                                    </p>
                                </div>
                                <div className="text-right text-sm text-trenchy-text-secondary">
                                    <p>{getTimeAgo(ticket.updatedAt)}</p>
                                    <p className="text-xs">{ticket._count.messages} mensagem{ticket._count.messages > 1 ? 's' : ''}</p>
                                </div>
                            </div>
                            {ticket.lastMessage && (
                                <p className="text-sm text-trenchy-text-secondary truncate">
                                    💬 {ticket.lastMessage.content}
                                </p>
                            )}
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
