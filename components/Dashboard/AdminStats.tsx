'use client';

import { UserGroupIcon, CurrencyDollarIcon, BookOpenIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';

interface AdminStatsProps {
    newStudentsCount: number;
    totalRevenue: string; // Formatado ex: "R$ 15.000"
    activeModulesCount: number;
    engagementRate: string; // Ex: "85%"
}

export const AdminStats = ({ newStudentsCount, totalRevenue, activeModulesCount, engagementRate }: AdminStatsProps) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Card 1: Novos Alunos (Mês) */}
            <div className="bg-trenchy-card border border-trenchy-border rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-trenchy-text-secondary uppercase tracking-wide">Novos Alunos (30d)</p>
                    <div className="bg-blue-100 dark:bg-blue-900/20 p-2 rounded-lg">
                        <UserGroupIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-trenchy-text-primary">{newStudentsCount}</span>
                    <span className="text-xs text-green-500 flex items-center">
                        <ArrowTrendingUpIcon className="h-3 w-3 mr-1" />
                        +12%
                    </span>
                </div>
            </div>

            {/* Card 2: Receita Total (Estimada) */}
            <div className="bg-trenchy-card border border-trenchy-border rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-trenchy-text-secondary uppercase tracking-wide">Receita Declarada</p>
                    <div className="bg-green-100 dark:bg-green-900/20 p-2 rounded-lg">
                        <CurrencyDollarIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-trenchy-text-primary">{totalRevenue}</span>
                </div>
            </div>

            {/* Card 3: Módulos Ativos */}
            <div className="bg-trenchy-card border border-trenchy-border rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-trenchy-text-secondary uppercase tracking-wide">Módulos Publicados</p>
                    <div className="bg-purple-100 dark:bg-purple-900/20 p-2 rounded-lg">
                        <BookOpenIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-trenchy-text-primary">{activeModulesCount}</span>
                    <span className="text-xs text-trenchy-text-secondary">em 3 trilhas</span>
                </div>
            </div>

            {/* Card 4: Taxa de Engajamento */}
            <div className="bg-trenchy-card border border-trenchy-border rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-trenchy-text-secondary uppercase tracking-wide">Engajamento Semanal</p>
                    <div className="bg-orange-100 dark:bg-orange-900/20 p-2 rounded-lg">
                        <ArrowTrendingUpIcon className="h-4 w-4 text-trenchy-orange" />
                    </div>
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-trenchy-text-primary">{engagementRate}</span>
                    <span className="text-xs text-trenchy-text-secondary">ativos</span>
                </div>
            </div>
        </div>
    );
};
