'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface Module {
    id: string;
    title: string;
    description: string;
    order: number;
}

export default function AdminModulesList() {
    const [modules, setModules] = useState<Module[]>([]);
    const [loading, setLoading] = useState(true);

    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        checkPermission();
    }, []);

    const checkPermission = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            window.location.href = '/login';
            return;
        }

        const { data } = await supabase
            .from('User')
            .select('role')
            .eq('email', user.email)
            .single();

        if (data?.role !== 'ADMIN') {
            alert("Acesso restrito a administradores.");
            window.location.href = '/admin/mentoria';
            return;
        }

        setIsAuthorized(true);
        fetchModules();
    };

    const fetchModules = async () => {
        const { data, error } = await supabase
            .from('Module')
            .select('*')
            .order('order', { ascending: true });

        if (error) {
            console.error("Erro ao carregar módulos:", error);
        } else {
            setModules(data || []);
        }
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        // A dupla verificação já foi feita no botão
        const { error } = await supabase.from('Module').delete().eq('id', id);
        if (error) {
            alert("Erro ao excluir: " + error.message);
        } else {
            fetchModules();
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-trenchy-text-primary">Gerenciar Módulos</h1>
                    <p className="text-trenchy-text-secondary">Organize a estrutura da mentoria.</p>
                </div>
                <Link
                    href="/admin/modules/new"
                    className="flex items-center px-4 py-2 bg-trenchy-orange text-white rounded-lg hover:bg-orange-600 transition font-medium shadow-lg shadow-orange-900/20"
                >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Novo Módulo
                </Link>
            </div>

            {loading && !isAuthorized ? (
                <div className="text-center text-trenchy-text-secondary py-20">Verificando permissões...</div>
            ) : !isAuthorized ? null : loading ? (
                <div className="flex justify-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-trenchy-orange"></div>
                </div>
            ) : (
                <div className="bg-trenchy-card rounded-xl shadow-sm border border-trenchy-border overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-black/5 dark:bg-white/5 border-b border-trenchy-border">
                            <tr>
                                <th className="p-4 font-semibold text-sm text-trenchy-text-secondary">Ordem</th>
                                <th className="p-4 font-semibold text-sm text-trenchy-text-secondary">Título</th>
                                <th className="p-4 font-semibold text-sm text-trenchy-text-secondary">Descrição</th>
                                <th className="p-4 font-semibold text-sm text-trenchy-text-secondary text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-trenchy-border">
                            {modules.map((mod) => (
                                <tr key={mod.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                    <td className="p-4 text-trenchy-text-secondary font-mono">{mod.order}</td>
                                    <td className="p-4 font-bold text-trenchy-text-primary">{mod.title}</td>
                                    <td className="p-4 text-sm text-trenchy-text-secondary max-w-xs truncate">{mod.description}</td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Link
                                                href={`/admin/modules/${mod.id}/edit`}
                                                className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                                                title="Editar"
                                            >
                                                <PencilIcon className="h-5 w-5" />
                                            </Link>
                                            <button
                                                onClick={() => {
                                                    const confirm1 = confirm("ATENÇÃO: Excluir um módulo pode quebrar o acesso de alunos.\nTem certeza absoluta?");
                                                    if (confirm1) {
                                                        const confirm2 = prompt("Para confirmar, digite DELETAR abaixo:");
                                                        if (confirm2 === "DELETAR") {
                                                            handleDelete(mod.id);
                                                        } else {
                                                            alert("Ação cancelada. Texto incorreto.");
                                                        }
                                                    }
                                                }}
                                                className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                                title="Excluir"
                                            >
                                                <TrashIcon className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {modules.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-trenchy-text-secondary">
                                        Nenhum módulo cadastrado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
