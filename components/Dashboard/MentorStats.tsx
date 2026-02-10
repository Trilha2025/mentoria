'use client';

import { UsersIcon, ClipboardDocumentCheckIcon, ClockIcon } from '@heroicons/react/24/outline';

interface MentorStatsProps {
    stuckUsersCount: number;
    pendingReviewsCount: number;
    activeUsersCount: number;
}

export const MentorStats = ({ stuckUsersCount, pendingReviewsCount, activeUsersCount }: MentorStatsProps) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Card 1: Atenção Necessária (Stuck) */}
            <div className="bg-trenchy-card border border-trenchy-border rounded-xl p-6 shadow-sm hover:shadow-red-900/10 transition-shadow">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-trenchy-text-secondary uppercase tracking-wide">Atenção Necessária</h3>
                    <div className="bg-red-100 dark:bg-red-900/20 p-2 rounded-lg">
                        <ClockIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-trenchy-text-primary">{stuckUsersCount}</span>
                    <span className="text-xs text-trenchy-text-secondary">alunos</span>
                </div>
                <p className="text-xs text-red-500 mt-2 font-medium">
                    Sem acesso há +7 dias
                </p>
            </div>

            {/* Card 2: Fila de Revisão */}
            <div className="bg-trenchy-card border border-trenchy-border rounded-xl p-6 shadow-sm hover:shadow-yellow-900/10 transition-shadow">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-trenchy-text-secondary uppercase tracking-wide">Tarefas Pendentes</h3>
                    <div className="bg-yellow-100 dark:bg-yellow-900/20 p-2 rounded-lg">
                        <ClipboardDocumentCheckIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    </div>
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-trenchy-text-primary">{pendingReviewsCount}</span>
                    <span className="text-xs text-trenchy-text-secondary">tarefas</span>
                </div>
                <p className="text-xs text-yellow-500 mt-2 font-medium">
                    Aguardando sua aprovação
                </p>
            </div>

            {/* Card 3: Engajamento (Active) */}
            <div className="bg-trenchy-card border border-trenchy-border rounded-xl p-6 shadow-sm hover:shadow-green-900/10 transition-shadow">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-trenchy-text-secondary uppercase tracking-wide">Alunos Ativos</h3>
                    <div className="bg-green-100 dark:bg-green-900/20 p-2 rounded-lg">
                        <UsersIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-trenchy-text-primary">{activeUsersCount}</span>
                    <span className="text-xs text-trenchy-text-secondary">hoje</span>
                </div>
                <p className="text-xs text-green-500 mt-2 font-medium">
                    Acessaram nas últimas 24h
                </p>
            </div>
        </div>
    );
};
