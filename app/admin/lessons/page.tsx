'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { PlusIcon, PencilIcon, TrashIcon, VideoCameraIcon } from '@heroicons/react/24/outline';

interface Lesson {
    id: string;
    title: string;
    moduleId: string;
    module: {
        title: string;
    } | null; // Join manual ou via query
}

export default function AdminLessonsList() {
    const [lessons, setLessons] = useState<Lesson[]>([]);
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
        fetchLessons();
    };

    const fetchLessons = async () => {
        // Query com relacionamento (se configurado no Supabase Client corretamente)
        // Caso contrário, fazemos fetch simples e depois join, ou confiamos na view
        const { data, error } = await supabase
            .from('Lesson')
            .select(`
                id,
                title,
                moduleId,
                moduleId,
                module:Module (
                    title
                )
            `);

        if (error) {
            console.error("Erro ao carregar aulas:", error);
        } else {
            // @ts-ignore
            setLessons(data || []);
        }
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        const { error } = await supabase.from('Lesson').delete().eq('id', id);
        if (error) {
            alert("Erro ao excluir: " + error.message);
        } else {
            fetchLessons();
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-trenchy-text-primary">Gerenciar Aulas</h1>
                    <p className="text-trenchy-text-secondary">Conteúdos e materiais de apoio.</p>
                </div>
                <Link
                    href="/admin/lessons/new"
                    className="flex items-center px-4 py-2 bg-trenchy-orange text-white rounded-lg hover:bg-orange-600 transition font-medium shadow-lg shadow-orange-900/20"
                >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Nova Aula
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
                                <th className="p-4 font-semibold text-sm text-trenchy-text-secondary">Título da Aula</th>
                                <th className="p-4 font-semibold text-sm text-trenchy-text-secondary">Módulo Vinculado</th>
                                <th className="p-4 font-semibold text-sm text-trenchy-text-secondary text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-trenchy-border">
                            {lessons.map((lesson) => (
                                <tr key={lesson.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <VideoCameraIcon className="h-5 w-5 text-trenchy-text-secondary" />
                                            <span className="font-bold text-trenchy-text-primary">{lesson.title}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm text-trenchy-text-secondary">
                                        {lesson.module?.title || <span className="text-red-500 italic">Módulo não encontrado</span>}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Link
                                                href={`/admin/lessons/${lesson.id}/edit`}
                                                className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                                                title="Editar"
                                            >
                                                <PencilIcon className="h-5 w-5" />
                                            </Link>
                                            <button
                                                onClick={() => {
                                                    if (confirm("Tem certeza que deseja excluir esta aula?")) {
                                                        const confirm2 = prompt("Digite DELETAR para confirmar a exclusão:");
                                                        if (confirm2 === "DELETAR") {
                                                            handleDelete(lesson.id);
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
                            {lessons.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="p-8 text-center text-trenchy-text-secondary">
                                        Nenhuma aula cadastrada.
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
