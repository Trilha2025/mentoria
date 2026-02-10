'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ReviewQueue } from '@/components/Dashboard/ReviewQueue';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

interface Submission {
    id: string;
    userId: string;
    moduleId: string;
    fileUrl: string;
    status: string;
    createdAt: string;
    user: {
        name: string | null;
        email: string;
    };
    Module: {
        title: string;
    } | null;
}

export default function ReviewQueuePage() {
    const [loading, setLoading] = useState(true);
    const [reviewQueue, setReviewQueue] = useState<any[]>([]);

    useEffect(() => {
        fetchSubmissions();
    }, []);

    const fetchSubmissions = async () => {
        try {
            const { data, error } = await supabase
                .from('DocumentSubmission')
                .select(`
                    id, userId, moduleId, fileUrl, status, createdAt,
                    user:User(name, email),
                    Module(title)
                `)
                .eq('status', 'PENDING')
                .order('createdAt', { ascending: true });

            if (data) {
                const queue = data.map((s: any) => ({
                    id: s.id,
                    studentName: s.user?.name || s.user?.email || 'Aluno',
                    moduleTitle: s.Module?.title || 'Módulo',
                    submittedAt: s.createdAt,
                    userId: s.userId
                }));
                setReviewQueue(queue);
            }
        } catch (error) {
            console.error("Erro ao carregar fila de revisão:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="p-6 md:p-8 max-w-7xl mx-auto">
            <div className="mb-8">
                <Link href="/admin/mentoria" className="flex items-center gap-2 text-sm text-trenchy-text-secondary hover:text-trenchy-text-primary transition mb-4">
                    <ArrowLeftIcon className="h-4 w-4" />
                    Voltar para Mentoria
                </Link>
                <h1 className="text-3xl font-bold tracking-tight text-trenchy-text-primary">Fila de Revisão Prioritária</h1>
                <p className="text-trenchy-text-secondary mt-1">
                    Visualize e gerencie todas as submissões pendentes de revisão, ordenadas por antiguidade.
                </p>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-trenchy-orange"></div>
                </div>
            ) : (
                <div className="h-[600px]">
                    <ReviewQueue queue={reviewQueue} />
                </div>
            )}
        </main>
    );
}
