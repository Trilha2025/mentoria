'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';

export default function EditModulePage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [order, setOrder] = useState(1);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchModule = async () => {
            if (!id) return;

            const { data, error } = await supabase
                .from('Module')
                .select('*')
                .eq('id', id)
                .maybeSingle();

            if (error) {
                alert("Erro ao carregar módulo: " + error.message);
                router.push('/admin/modules');
            } else if (data) {
                setTitle(data.title);
                setDescription(data.description || '');
                setOrder(data.order);
                setLoading(false);
            } else {
                // Caso não encontre (ID inválido ou deletado)
                alert("Módulo não encontrado.");
                router.push('/admin/modules');
            }
        };

        fetchModule();
    }, [id, router]);

    const handleUpdateModule = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        const { error } = await supabase
            .from('Module')
            .update({ title, description, order })
            .eq('id', id);

        if (error) {
            alert('Erro ao atualizar módulo: ' + error.message);
        } else {
            alert('Módulo atualizado com sucesso!');
            router.push('/admin/modules');
        }
        setSaving(false);
    };

    if (loading) return (
        <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-trenchy-orange"></div>
        </div>
    );

    return (
        <div className="max-w-2xl p-8 mx-auto mt-6">
            <h1 className="text-2xl font-bold mb-6 text-trenchy-text-primary">Editar Módulo</h1>
            <form onSubmit={handleUpdateModule} className="space-y-4 bg-trenchy-card p-6 rounded-lg border border-trenchy-border shadow-sm">
                <div>
                    <label className="block text-sm font-bold mb-1 text-trenchy-text-secondary uppercase tracking-wide">Título do Módulo</label>
                    <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full p-2.5 bg-background border border-trenchy-border rounded-lg text-sm text-trenchy-text-primary focus:border-trenchy-orange focus:ring-1 focus:ring-trenchy-orange outline-none"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold mb-1 text-trenchy-text-secondary uppercase tracking-wide">Descrição</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
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
                <div className="flex gap-4 pt-2">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="w-full bg-transparent border border-trenchy-border text-trenchy-text-secondary px-6 py-3 rounded-lg font-bold hover:bg-black/5 dark:hover:bg-white/5 transition"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full bg-trenchy-orange text-white px-6 py-3 rounded-lg font-bold hover:bg-orange-600 transition disabled:opacity-50 shadow-lg shadow-orange-900/20"
                    >
                        {saving ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </div>
            </form>
        </div>
    );
}
