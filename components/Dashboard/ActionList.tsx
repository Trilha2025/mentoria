'use client';

import { CheckCircleIcon, ExclamationTriangleIcon, ClockIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

interface Task {
    moduleId: string;
    moduleTitle: string;
    status: 'PENDING' | 'ADJUST_REQUIRED' | 'APPROVED';
}

interface ActionListProps {
    pendingTasks: Task[];
    recentFeedback?: {
        moduleId: string;
        moduleTitle: string;
        feedback: string;
        status: string;
    } | null;
}

export const ActionList = ({ pendingTasks, recentFeedback }: ActionListProps) => {
    return (
        <div className="bg-trenchy-card rounded-xl border border-trenchy-border p-8 h-full">
            <h3 className="text-xl font-bold text-trenchy-text-primary mb-6">Quadro de Avisos</h3>

            {/* Recent Feedback Alert */}
            {recentFeedback && (
                <Link
                    href={`/modulo/${recentFeedback.moduleId}`}
                    className="block mb-6 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-lg p-4 hover:bg-blue-100 dark:hover:bg-blue-900/20 transition cursor-pointer group"
                >
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                                Feedback Recente
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${recentFeedback.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {recentFeedback.status === 'APPROVED' ? 'Aprovado' : 'Ajustar'}
                            </span>
                        </div>
                        <div className="text-xs text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            Ver &rarr;
                        </div>
                    </div>
                    <p className="text-sm font-semibold text-trenchy-text-primary mb-1 group-hover:text-trenchy-orange transition-colors">{recentFeedback.moduleTitle}</p>
                    <p className="text-sm text-trenchy-text-secondary line-clamp-3 italic">"{recentFeedback.feedback}"</p>
                </Link>
            )}

            {/* Task List */}
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {pendingTasks.length === 0 && !recentFeedback ? (
                    <div className="text-center py-8 text-trenchy-text-secondary">
                        <CheckCircleIcon className="h-10 w-10 mx-auto mb-2 opacity-20" />
                        <p>Tudo em dia! Foque nas aulas.</p>
                    </div>
                ) : (
                    pendingTasks.map((task, idx) => (
                        <Link
                            key={idx}
                            href={`/modulo/${task.moduleId}`}
                            className="flex items-center justify-between p-3 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition border border-transparent hover:border-trenchy-border cursor-pointer group"
                        >
                            <div className="flex items-center gap-3">
                                {task.status === 'ADJUST_REQUIRED' ? (
                                    <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                                ) : (
                                    <ClockIcon className="h-5 w-5 text-yellow-500" />
                                )}
                                <div>
                                    <p className="text-sm font-bold text-trenchy-text-primary group-hover:text-trenchy-orange transition-colors">
                                        {task.moduleTitle}
                                    </p>
                                    <p className="text-xs text-trenchy-text-secondary">
                                        {task.status === 'ADJUST_REQUIRED' ? 'Ajuste Solicitado' : 'Aguardando Aprovação'}
                                    </p>
                                </div>
                            </div>
                            <div className="text-xs text-trenchy-text-secondary opacity-0 group-hover:opacity-100 transition-opacity">
                                Ver &rarr;
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
};
