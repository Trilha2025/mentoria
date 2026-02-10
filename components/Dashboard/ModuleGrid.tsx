// Arquivo: /components/Dashboard/ModuleGrid.tsx
import { LockClosedIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

interface ModuleProps {
    id: string; // ID do módulo para navegação
    title: string;
    status: 'LOCKED' | 'UNLOCKED' | 'COMPLETED';
    description: string;
}

export const ModuleCard = ({ id, title, status, description }: ModuleProps) => {
    const isLocked = status === 'LOCKED';

    return (
        <div className={`p-6 rounded-xl border border-trenchy-border transition-all flex flex-col justify-between h-full ${isLocked ? 'bg-black/5 dark:bg-white/5 opacity-50' : 'bg-trenchy-card shadow-lg hover:shadow-orange-900/10 hover:border-trenchy-orange/30'
            }`}>
            <div>
                <div className="flex justify-between items-start mb-4">
                    <h3 className={`font-bold text-lg leading-tight ${isLocked ? 'text-gray-500' : 'text-trenchy-text-primary'}`}>
                        {title}
                    </h3>
                    {isLocked ? (
                        <LockClosedIcon className="h-6 w-6 text-gray-500 flex-shrink-0 ml-2" />
                    ) : status === 'COMPLETED' ? (
                        <CheckCircleIcon className="h-6 w-6 text-green-500 flex-shrink-0 ml-2" />
                    ) : null}
                </div>
                <p className="text-sm text-trenchy-text-secondary mb-6 line-clamp-3">{description}</p>
            </div>

            {!isLocked && (
                <Link
                    href={`/modulo/${id}`}
                    className="w-full block text-center bg-trenchy-orange text-white py-3 rounded-lg text-sm font-bold hover:bg-orange-600 transition shadow-lg shadow-orange-900/20"
                >
                    Acessar Módulo
                </Link>
            )}
            {isLocked && (
                <div className="w-full py-3 bg-black/5 dark:bg-white/5 text-gray-500 text-center rounded-lg text-xs font-medium">
                    Bloqueado
                </div>
            )}
        </div>
    );
};
