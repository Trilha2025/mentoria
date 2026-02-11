'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { PlusIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

interface Ticket {
    id: string;
    subject: string | null;
    status: string;
    createdAt: string;
    updatedAt: string;
    messages: {
        content: string;
        createdAt: string;
        read: boolean;
        senderId: string;
    }[];
    _count: {
        messages: number;
    };
}

export default function StudentSupportPage() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        try {
            // A rota /api/tickets já pega o usuário da sessão automaticamente
            const response = await fetch('/api/tickets');
            const data = await response.json();

            if (data.success) {
                setTickets(data.tickets);
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

    return (
        <div className="max-w-7xl mx-auto p-6 md:p-8 w-full">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-trenchy-text-primary flex items-center gap-2">
                        <ChatBubbleLeftRightIcon className="h-8 w-8 text-trenchy-orange" />
                        Suporte
                    </h1>
                    <p className="text-trenchy-text-secondary mt-1">Seus chamados de suporte técnico e dúvidas.</p>
                </div>
                <Link
                    href="/dashboard/support/new"
                    className="flex items-center px-4 py-2 bg-trenchy-orange text-white rounded-lg hover:bg-orange-600 transition font-medium shadow-lg shadow-orange-900/20"
                >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Novo Chamado
                </Link>
            </div>

            <div className="bg-trenchy-card rounded-xl border border-trenchy-border shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-trenchy-orange mx-auto"></div>
                    </div>
                ) : tickets.length === 0 ? (
                    <div className="p-12 text-center text-trenchy-text-secondary">
                        <ChatBubbleLeftRightIcon className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p className="text-lg font-medium mb-2">Nenhum chamado encontrado</p>
                        <p className="text-sm mb-6">Você ainda não abriu nenhum chamado de suporte.</p>
                        <Link
                            href="/dashboard/support/new"
                            className="text-trenchy-orange hover:underline"
                        >
                            Abrir meu primeiro chamado
                        </Link>
                    </div>
                ) : (
                    <div className="divide-y divide-trenchy-border">
                        {tickets.map((ticket) => (
                            <Link
                                key={ticket.id}
                                href={`/dashboard/support/${ticket.id}`}
                                className="block p-4 hover:bg-black/5 dark:hover:bg-white/5 transition"
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-trenchy-text-primary mb-1">
                                            {ticket.subject || 'Sem assunto'}
                                        </h3>
                                        <p className="text-xs text-trenchy-text-secondary">
                                            Atualizado em {new Date(ticket.updatedAt).toLocaleDateString()} às {new Date(ticket.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        {getStatusBadge(ticket.status)}
                                        {ticket._count?.messages > 0 && (
                                            <span className="text-xs text-trenchy-text-secondary bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded-full">
                                                {ticket._count.messages} msg
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
