'use client';

import { ArrowRightIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

interface ReviewItem {
    id: string; // Submission ID
    studentName: string;
    moduleTitle: string;
    submittedAt: string; // ISO String
    userId: string; // Para linkar ao perfil do aluno se quiser
}

interface ReviewQueueProps {
    queue: ReviewItem[];
}

export const ReviewQueue = ({ queue }: ReviewQueueProps) => {
    return (
        <div className="bg-trenchy-card border border-trenchy-border rounded-xl p-6 h-full">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-trenchy-text-primary">Fila de Revisão Prioritária</h3>
                <span className="text-xs text-trenchy-text-secondary bg-black/5 dark:bg-white/5 px-2 py-1 rounded">
                    Mais Antigas Primeiro
                </span>
            </div>

            {queue.length === 0 ? (
                <div className="text-center py-8 text-trenchy-text-secondary">
                    <DocumentTextIcon className="h-10 w-10 mx-auto mb-2 opacity-20" />
                    <p>Nenhuma tarefa pendente.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {queue.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-black/5 dark:bg-white/5 border border-transparent hover:border-trenchy-orange/30 transition group">
                            <div>
                                <p className="text-sm font-bold text-trenchy-text-primary">{item.studentName}</p>
                                <p className="text-xs text-trenchy-text-secondary">{item.moduleTitle}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] text-trenchy-text-secondary opacity-60">
                                    {new Date(item.submittedAt).toLocaleDateString()}
                                </span>
                                <Link
                                    href={`/admin/mentees/${item.userId}`}
                                    className="p-2 bg-trenchy-orange text-white rounded-lg hover:bg-orange-600 transition shadow-lg shadow-orange-900/10"
                                    title="Avaliar"
                                >
                                    <ArrowRightIcon className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
