'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';

interface Message {
    id: string;
    content: string;
    createdAt: string;
    senderId: string;
    sender: {
        id: string;
        name: string | null;
        email: string;
        role: string;
    };
}

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
        avatarUrl: string | null;
        createdAt: string;
    };
    messages: Message[];
}

export default function TicketDetailsPage() {
    const params = useParams();
    const router = useRouter(); // kept for potential future use or consistency
    const ticketId = params.id as string;

    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);

    useEffect(() => {
        fetchTicket();
    }, [ticketId]);

    const fetchTicket = async () => {
        try {
            const response = await fetch(`/api/support/tickets/${ticketId}`);
            const data = await response.json();

            if (data.success) {
                setTicket(data.ticket);
            }
        } catch (error) {
            console.error('Error fetching ticket:', error);
        } finally {
            setLoading(false);
        }
    };

    const sendMessage = async () => {
        if (!message.trim() || sending) return;

        try {
            setSending(true);
            const response = await fetch(`/api/tickets/${ticketId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: message }),
            });

            const data = await response.json();

            if (data.success) {
                setMessage('');
                fetchTicket(); // Refresh messages
            }
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
        }
    };

    const updateStatus = async (newStatus: string) => {
        try {
            setUpdatingStatus(true);
            const response = await fetch(`/api/support/tickets/${ticketId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });

            const data = await response.json();

            if (data.success) {
                fetchTicket(); // Refresh ticket
            }
        } catch (error) {
            console.error('Error updating status:', error);
        } finally {
            setUpdatingStatus(false);
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
            <span className={`text-xs px-3 py-1 rounded-full font-bold ${styles[status] || styles.OPEN}`}>
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

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto p-8 flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-trenchy-orange"></div>
            </div>
        );
    }

    if (!ticket) {
        return (
            <div className="max-w-4xl mx-auto p-8">
                <div className="bg-trenchy-card border border-trenchy-border rounded-xl p-12 text-center">
                    <p className="text-trenchy-text-secondary">Ticket não encontrado</p>
                    <Link href="/support" className="text-trenchy-orange hover:underline mt-4 inline-block">
                        Voltar para lista
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-8">
            {/* Header */}
            <div className="mb-6">
                <Link
                    href="/support"
                    className="inline-flex items-center gap-2 text-trenchy-text-secondary hover:text-trenchy-orange transition mb-4"
                >
                    <ArrowLeftIcon className="h-4 w-4" />
                    Voltar
                </Link>
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-trenchy-text-primary mb-2">
                            {ticket.subject || 'Sem assunto'}
                        </h1>
                        <p className="text-sm text-trenchy-text-secondary">
                            Ticket #{ticket.id.slice(0, 8)}
                        </p>
                    </div>
                    {getStatusBadge(ticket.status)}
                </div>
            </div>

            {/* User Info */}
            <div className="bg-trenchy-card border border-trenchy-border rounded-xl p-6 mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-bold text-trenchy-text-primary">{ticket.user.name || 'Sem nome'}</p>
                        <p className="text-sm text-trenchy-text-secondary">{ticket.user.email}</p>
                        <p className="text-xs text-trenchy-text-secondary mt-1">
                            Cliente desde {new Date(ticket.user.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                    <div>
                        <select
                            value={ticket.status}
                            onChange={(e) => updateStatus(e.target.value)}
                            disabled={updatingStatus}
                            className="px-4 py-2 bg-black/5 dark:bg-white/5 border border-trenchy-border rounded-lg text-trenchy-text-primary focus:outline-none focus:border-trenchy-orange disabled:opacity-50"
                        >
                            <option value="OPEN">Aberto</option>
                            <option value="IN_PROGRESS">Em andamento</option>
                            <option value="RESOLVED">Resolvido</option>
                            <option value="CLOSED">Fechado</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Messages Thread */}
            <div className="bg-trenchy-card border border-trenchy-border rounded-xl p-6 mb-6">
                <h3 className="font-bold text-lg text-trenchy-text-primary mb-4">Mensagens</h3>
                <div className="space-y-4 max-h-[500px] overflow-y-auto mb-6">
                    {ticket.messages.map((msg) => {
                        const isSupport = msg.sender.role === 'SUPPORT' || msg.sender.role === 'ADMIN' || msg.sender.role === 'MENTOR';

                        return (
                            <div
                                key={msg.id}
                                className={`flex ${isSupport ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[70%] ${isSupport ? 'bg-trenchy-orange text-white' : 'bg-black/5 dark:bg-white/5 text-trenchy-text-primary'} rounded-lg p-4`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <p className="text-xs font-bold">
                                            {msg.sender.name || msg.sender.email}
                                        </p>
                                        <span className="text-[10px] opacity-70">
                                            {getTimeAgo(msg.createdAt)}
                                        </span>
                                    </div>
                                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Reply Form */}
                <div className="border-t border-trenchy-border pt-4">
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Digite sua resposta..."
                        rows={4}
                        className="w-full px-4 py-3 bg-black/5 dark:bg-white/5 border border-trenchy-border rounded-lg text-trenchy-text-primary placeholder:text-trenchy-text-secondary focus:outline-none focus:border-trenchy-orange resize-none"
                    />
                    <div className="flex gap-3 mt-3">
                        <button
                            onClick={sendMessage}
                            disabled={!message.trim() || sending}
                            className="flex items-center gap-2 px-6 py-2 bg-trenchy-orange text-white rounded-lg font-bold hover:bg-trenchy-orange/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <PaperAirplaneIcon className="h-4 w-4" />
                            {sending ? 'Enviando...' : 'Enviar'}
                        </button>
                        {ticket.status !== 'RESOLVED' && (
                            <button
                                onClick={() => updateStatus('RESOLVED')}
                                disabled={updatingStatus}
                                className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition disabled:opacity-50"
                            >
                                Resolver Ticket
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
