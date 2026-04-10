'use client';

import { Lock, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface ModuleProps {
    id: string; // ID do módulo para navegação
    title: string;
    status: 'LOCKED' | 'UNLOCKED' | 'COMPLETED';
    description: string;
}

export const ModuleCard = ({ id, title, status, description }: ModuleProps) => {
    const isLocked = status === 'LOCKED';
    const isCompleted = status === 'COMPLETED';

    return (
        <motion.div 
            whileHover={!isLocked ? { y: -8, scale: 1.02 } : {}}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={`p-6 rounded-[24px] border border-trenchy-border light-card-shadow transition-all flex flex-col justify-between h-full group ${
                isLocked 
                ? 'bg-black/5 dark:bg-white/5 opacity-40 cursor-not-allowed' 
                : 'bg-trenchy-card hover:bg-white/[0.02] dark:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-orange-900/20 hover:border-trenchy-orange/40'
            }`}
        >
            <div>
                <div className="flex justify-between items-start mb-6">
                    <h3 className={`font-bold text-lg leading-tight tracking-tight ${isLocked ? 'text-trenchy-text-secondary' : 'text-trenchy-text-primary'}`}>
                        {title}
                    </h3>
                    <div className="flex-shrink-0 ml-4">
                        {isLocked ? (
                            <div className="p-2 bg-white/5 rounded-xl border border-white/10">
                                <Lock className="h-5 w-5 text-trenchy-text-secondary" strokeWidth={1.5} />
                            </div>
                        ) : isCompleted ? (
                            <div className="p-2 bg-green-500/10 rounded-xl border border-green-500/20">
                                <CheckCircle2 className="h-5 w-5 text-green-500" strokeWidth={1.5} />
                            </div>
                        ) : (
                            <div className="px-3 py-1 bg-orange-50 dark:bg-trenchy-orange/10 rounded-full border border-orange-200 dark:border-trenchy-orange/20">
                                <span className="text-orange-700 dark:text-trenchy-orange font-bold text-[10px] uppercase tracking-wider">Aberto</span>
                            </div>
                        )}
                    </div>
                </div>
                <p className="text-[13px] text-trenchy-text-secondary mb-6 line-clamp-3 leading-relaxed opacity-80 font-medium">
                    {description}
                </p>
            </div>

            {!isLocked ? (
                <Link
                    href={`/modulo/${id}`}
                    className="w-full block text-center bg-trenchy-orange text-white py-2.5 rounded-full text-xs font-bold hover:bg-orange-600 transition-all orange-glow shadow-orange-900/20 active:scale-[0.98]"
                >
                    Acessar Módulo
                </Link>
            ) : (
                <div className="w-full py-4 bg-white/5 text-trenchy-text-secondary/40 text-center rounded-xl text-xs font-bold tracking-widest uppercase border border-white/5">
                    Conteúdo Bloqueado
                </div>
            )}
        </motion.div>
    );
};

