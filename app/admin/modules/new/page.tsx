'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function NewModulePage() {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [order, setOrder] = useState(1);
    const [loading, setLoading] = useState(false);

    const handleCreateModule = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { data, error } = await supabase
            .from('Module')
            .insert([{
                id: crypto.randomUUID(),
                title,
                description,
                order
            }])
            .select();

        if (error) {
            alert('Erro ao criar módulo: ' + error.message);
        } else {
            if (data && data.length > 0) {
                alert(`Módulo criado com sucesso!`);
                window.location.href = '/admin/modules';
            } else {
                alert('Módulo criado, mas sem retorno de dados. Verifique o banco.');
                window.location.href = '/admin/modules';
            }
        }
        setLoading(false);
    };

    return (
        <div className="max-w-2xl p-8 mx-auto mt-6">
            <h1 className="text-2xl font-bold mb-6 text-trenchy-text-primary">Cadastrar Novo Módulo</h1>
            <form onSubmit={handleCreateModule} className="space-y-4 bg-trenchy-card p-6 rounded-lg border border-trenchy-border shadow-sm">
                <div>
                    <label className="block text-sm font-bold mb-1 text-trenchy-text-secondary uppercase tracking-wide">Título do Módulo</label>
                    <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Ex: Precificação e Rentabilidade"
                        className="w-full p-2.5 bg-background border border-trenchy-border rounded-lg text-sm text-trenchy-text-primary focus:border-trenchy-orange focus:ring-1 focus:ring-trenchy-orange outline-none"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold mb-1 text-trenchy-text-secondary uppercase tracking-wide">Descrição (Gargalo que resolve)</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Explique como este módulo resolve o problema X..."
                        className="w-full p-2.5 bg-background border border-trenchy-border rounded-lg h-24 text-sm text-trenchy-text-primary focus:border-trenchy-orange focus:ring-1 focus:ring-trenchy-orange outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold mb-1 text-trenchy-text-secondary uppercase tracking-wide">Ordem de Exibição</label>
                    <input
                        type="number"
                        value={order}
                        onChange={(e) => setOrder(Number(e.target.value))}
                        className="w-20 p-2.5 bg-background border border-trenchy-border rounded-lg text-sm text-trenchy-text-primary focus:border-trenchy-orange focus:ring-1 focus:ring-trenchy-orange outline-none"
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-trenchy-orange text-white px-6 py-3 rounded-lg font-bold hover:bg-orange-600 transition disabled:opacity-50 shadow-lg shadow-orange-900/20"
                >
                    {loading ? 'Salvando...' : 'Criar Módulo'}
                </button>
            </form>
        </div>
    );
}
