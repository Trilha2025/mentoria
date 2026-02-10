'use client';

import { PlayIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';

interface DashboardHeroProps {
    moduleId: string;
    moduleTitle: string;
    userName: string;
}

export const DashboardHero = ({ moduleId, moduleTitle, userName }: DashboardHeroProps) => {
    return (
        <div className="bg-gradient-to-r from-trenchy-card to-black/20 dark:to-transparent border border-trenchy-border rounded-2xl p-8 relative overflow-hidden h-full">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-trenchy-orange/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10">
                <h1 className="text-3xl font-bold text-trenchy-text-primary mb-2">
                    Olá, {userName}.
                </h1>
                <p className="text-trenchy-text-secondary text-lg mb-6 max-w-xl">
                    Pronto para o próximo nível? Continue sua jornada no módulo de <span className="text-trenchy-orange font-semibold">{moduleTitle}</span>.
                </p>

                <Link
                    href={`/modulo/${moduleId}`}
                    className="inline-flex items-center gap-3 bg-trenchy-orange text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-orange-600 hover:scale-105 transition-all shadow-xl shadow-orange-900/30 group"
                >
                    <div className="bg-white/20 p-2 rounded-full group-hover:bg-white/30 transition">
                        <PlayIcon className="h-6 w-6 text-white" />
                    </div>
                    Continuar Aula
                </Link>
            </div>
        </div>
    );
};
