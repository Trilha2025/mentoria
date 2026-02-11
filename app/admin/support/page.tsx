'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { UserCircleIcon, ChatBubbleLeftRightIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { ChatDrawer } from '@/components/Support/ChatDrawer';

export default function SupportDashboard() {
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        loadData();

        // Silent polling every 5 seconds
        const interval = setInterval(() => {
            refreshTickets();
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const loadData = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            setCurrentUser(user);
            await fetchTickets();
        }
        setLoading(false);
    };

    const fetchTickets = async () => {
        // Fetch tickets from Support API (all students) filtered by MENTORSHIP
        const res = await fetch(`/api/support/tickets?category=MENTORSHIP&t=${Date.now()}`, { cache: 'no-store' });
        const data = await res.json();
        if (data.success) {
            setTickets(data.tickets);
        }
    };

    const refreshTickets = async () => {
        // Only fetch tickets, don't set global loading state
        await fetchTickets();
    };

    const handleTicketClick = (id: string) => {
        setSelectedTicketId(id);
    };

    const handleCloseChat = () => {
        setSelectedTicketId(null);
        loadData(); // Refresh list to update read status/order
    };

    if (loading) return <div className="p-8 text-trenchy-text-primary">Carregando chamados...</div>;

    return (
        <div className="max-w-6xl mx-auto p-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-trenchy-text-primary">Suporte ao Mentorado</h1>
                <p className="text-trenchy-text-secondary">Gerencie as dúvidas e solicitações dos seus alunos.</p>
            </header>

            <div className="grid gap-4">
                {tickets.length === 0 ? (
                    <div className="text-center py-20 bg-trenchy-card rounded-xl border border-trenchy-border">
                        <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-trenchy-text-primary">Nenhum chamado aberto</h3>
                        <p className="text-trenchy-text-secondary">Tudo tranquilo por aqui!</p>
                    </div>
                ) : (
                    tickets.map((ticket) => {
                        const lastMessage = ticket.messages[0];
                        // Check if there are ANY unread messages from the student (not from mentor)
                        const hasUnread = ticket.messages.some((msg: any) => !msg.read && msg.senderId !== currentUser.id);

                        return (
                            <button
                                key={ticket.id}
                                onClick={() => handleTicketClick(ticket.id)}
                                className={`w-full text-left bg-trenchy-card p-6 rounded-xl border transition-all hover:shadow-lg hover:border-trenchy-orange/50 flex justify-between items-center group ${hasUnread ? 'border-l-4 border-l-trenchy-orange border-y-trenchy-border border-r-trenchy-border' : 'border-trenchy-border'
                                    } ${ticket.status === 'RESOLVED' ? 'opacity-60' : ''}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-full bg-black/20 flex items-center justify-center">
                                        <UserCircleIcon className="h-8 w-8 text-gray-400" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className={`font-bold text-lg ${hasUnread ? 'text-trenchy-text-primary' : 'text-trenchy-text-secondary'} ${ticket.status === 'RESOLVED' ? 'line-through' : ''}`}>
                                                {ticket.user.name || ticket.user.email}
                                            </h3>
                                            {hasUnread && (
                                                <span className="px-2 py-0.5 bg-orange-500 text-white text-xs font-bold rounded-full">
                                                    Nova Mensagem
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500">
                                            {lastMessage ? (
                                                <span className={`truncate block max-w-md ${hasUnread ? 'font-bold text-trenchy-text-primary' : ''}`}>
                                                    {lastMessage.senderId === currentUser.id ? 'Você: ' : ''}{lastMessage.content}
                                                </span>
                                            ) : 'Sem mensagens'}
                                        </p>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide mb-2 ${ticket.status === 'OPEN' ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'
                                        }`}>
                                        {ticket.status === 'OPEN' ? 'Em Aberto' : 'Resolvido'}
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        {new Date(ticket.updatedAt).toLocaleDateString()} às {new Date(ticket.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </button>
                        );
                    })
                )}
            </div>

            {/* Chat Drawer for Mentor */}
            {currentUser && (
                <ChatDrawer
                    isOpen={!!selectedTicketId}
                    onClose={handleCloseChat}
                    ticketId={selectedTicketId || undefined}
                    userId={currentUser.id}
                    role="MENTOR" // Assuming handling logic handles permissions
                />
            )}
        </div>
    );
}
