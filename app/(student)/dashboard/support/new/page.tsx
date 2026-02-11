'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ArrowLeftIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';

export default function NewTicketPage() {
    const router = useRouter();
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                setError("Usuário não autenticado.");
                setLoading(false);
                return;
            }

            // Precisamos garantir que temos uma API para criar tickets
            // Vou usar a rota existente de create message? Não, preciso de create ticket.
            // Vou assumir que vou criar POST /api/tickets (user) ou POST /api/support/tickets (se der)

            // Vou tentar POST /api/support/tickets primeiro, mas ele é protegido para suporte.
            // O ideal é criar uma rota nova /api/tickets que aceita criação por usuários autenticados.

            const response = await fetch('/api/tickets', { // Vou criar essa rota depois
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subject,
                    content: message,
                }),
            });

            const data = await response.json();

            if (data.success) {
                router.push(`/dashboard/support/${data.ticketId}`);
            } else {
                setError(data.error || "Erro ao criar ticket.");
            }

        } catch (err: any) {
            console.error('Error creating ticket:', err);
            setError(err.message || "Erro inesperado.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-6 md:p-8 w-full">
            <Link
                href="/dashboard/support"
                className="inline-flex items-center gap-2 text-trenchy-text-secondary hover:text-trenchy-orange transition mb-6"
            >
                <ArrowLeftIcon className="h-4 w-4" />
                Voltar para lista
            </Link>

            <h1 className="text-2xl font-bold text-trenchy-text-primary mb-6">Novo Chamado de Suporte</h1>

            <form onSubmit={handleSubmit} className="bg-trenchy-card border border-trenchy-border rounded-xl p-6 shadow-sm space-y-6">

                {error && (
                    <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
                        {error}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-bold text-trenchy-text-secondary mb-1">
                        Assunto
                    </label>
                    <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Resumo do problema"
                        className="w-full px-4 py-3 bg-black/5 dark:bg-white/5 border border-trenchy-border rounded-lg text-trenchy-text-primary focus:outline-none focus:border-trenchy-orange placeholder:text-gray-400"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-trenchy-text-secondary mb-1">
                        Mensagem
                    </label>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={6}
                        placeholder="Descreva detalhadamente sua solicitação..."
                        className="w-full px-4 py-3 bg-black/5 dark:bg-white/5 border border-trenchy-border rounded-lg text-trenchy-text-primary focus:outline-none focus:border-trenchy-orange placeholder:text-gray-400 resize-none"
                        required
                    />
                </div>

                <div className="flex justify-end pt-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 px-8 py-3 bg-trenchy-orange text-white rounded-lg font-bold hover:bg-orange-600 transition disabled:opacity-50 shadow-lg shadow-orange-900/20"
                    >
                        <PaperAirplaneIcon className="h-5 w-5" />
                        {loading ? 'Enviando...' : 'Abrir Chamado'}
                    </button>
                </div>
            </form>
        </div>
    );
}
