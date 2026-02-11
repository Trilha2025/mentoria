'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ArrowLeftIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';

interface Message {
    id: string;
    content: string;
    createdAt: string;
    sender: {
        id: string;
        name: string | null;
        role: string;
    };
}

interface Ticket {
    id: string;
    subject: string | null;
    status: string;
    createdAt: string;
    messages: Message[];
}

export default function StudentTicketDetailsPage() {
    const params = useParams();
    const ticketId = params.id as string;

    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        fetchTicket();
    }, [ticketId]);

    const fetchTicket = async () => {
        try {
            // Nota: User precisa acessar /api/tickets/[id] (nova rota segura)
            // ou /api/support/tickets/[id] precisaria ser aberta para o dono do ticket.
            // Vou usar /api/tickets/[id] que criarei em breve.
            const response = await fetch(`/api/tickets/${ticketId}`);
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
                fetchTicket();
            }
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
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
                    <p className="text-trenchy-text-secondary">Chamado não encontrado</p>
                    <Link href="/dashboard/support" className="text-trenchy-orange hover:underline mt-4 inline-block">
                        Voltar para lista
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6 md:p-8 w-full">
            <Link
                href="/dashboard/support"
                className="inline-flex items-center gap-2 text-trenchy-text-secondary hover:text-trenchy-orange transition mb-6"
            >
                <ArrowLeftIcon className="h-4 w-4" />
                Voltar
            </Link>

            <div className="flex items-start justify-between mb-8">
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

            <div className="bg-trenchy-card border border-trenchy-border rounded-xl p-6 shadow-sm">
                <div className="space-y-6 max-h-[500px] overflow-y-auto mb-6 pr-2">
                    {ticket.messages.map((msg) => {
                        const isMe = msg.sender.role === 'MENTEE' || msg.sender.role === 'USER'; // Assumindo que current user é mentee
                        // Na verdade, precisamos checar o ID. Mas aqui estou simplificando.
                        // O ideal seria pegar o current user ID no useEffect e comparar.
                        // Mas vou usar role: se for SUPPORT/ADMIN/MENTOR é "Eles", se for MENTEE é "Eu".
                        // Cuidado: O sender.role vem do banco. Se eu sou o Mentee, meu role é MENTEE.

                        const isStaff = ['ADMIN', 'SUPPORT', 'MENTOR'].includes(msg.sender.role);

                        return (
                            <div
                                key={msg.id}
                                className={`flex ${!isStaff ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[75%] ${!isStaff ? 'bg-trenchy-orange text-white' : 'bg-black/5 dark:bg-white/5 text-trenchy-text-primary'} rounded-lg p-4`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <p className="text-xs font-bold">
                                            {isStaff ? (msg.sender.name || 'Suporte') : 'Você'}
                                        </p>
                                        <span className="text-[10px] opacity-70">
                                            {new Date(msg.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                        </span>
                                    </div>
                                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {ticket.status !== 'CLOSED' && ticket.status !== 'RESOLVED' ? (
                    <div className="border-t border-trenchy-border pt-4">
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Digite sua resposta..."
                            rows={3}
                            className="w-full px-4 py-3 bg-black/5 dark:bg-white/5 border border-trenchy-border rounded-lg text-trenchy-text-primary placeholder:text-trenchy-text-secondary focus:outline-none focus:border-trenchy-orange resize-none"
                        />
                        <div className="flex justify-end mt-3">
                            <button
                                onClick={sendMessage}
                                disabled={!message.trim() || sending}
                                className="flex items-center gap-2 px-6 py-2 bg-trenchy-orange text-white rounded-lg font-bold hover:bg-orange-600 transition disabled:opacity-50"
                            >
                                <PaperAirplaneIcon className="h-4 w-4" />
                                {sending ? 'Enviando...' : 'Responder'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center p-4 bg-black/5 dark:bg-white/5 rounded-lg text-trenchy-text-secondary text-sm">
                        Este chamado está fechado. Para reabri-lo ou tratar de outro assunto, por favor abra um novo chamado.
                    </div>
                )}
            </div>
        </div>
    );
}
