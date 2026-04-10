'use client';

import { Play } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface DashboardHeroProps {
    moduleId: string;
    moduleTitle: string;
    userName: string;
}

export const DashboardHero = ({ moduleId, moduleTitle, userName }: DashboardHeroProps) => {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative overflow-hidden rounded-[24px] border border-trenchy-border glass-card p-8 h-full group"
        >
            {/* Ambient Background Effects */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-trenchy-orange/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-trenchy-orange/20 transition-all duration-700"></div>
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-white/5 rounded-full blur-[80px] pointer-events-none"></div>

            <div className="relative z-10 flex flex-col h-full justify-center">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                >
                    <h1 className="text-3xl md:text-4xl font-bold text-trenchy-text-primary mb-3 tracking-tight">
                        Olá, <span className="dark:bg-gradient-to-r dark:from-white dark:via-white dark:to-white/40 dark:bg-clip-text dark:text-transparent font-black">{userName}</span>.
                    </h1>
                    <p className="text-[#666] dark:text-trenchy-text-secondary text-base md:text-lg mb-6 max-w-2xl leading-relaxed">
                        Pronto para o próximo nível? Continue sua jornada no módulo de <span className="text-trenchy-orange font-bold tracking-tight">{moduleTitle}</span>.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                >
                    <Link
                        href={`/modulo/${moduleId}`}
                        className="inline-flex items-center gap-3 bg-trenchy-orange text-white px-8 py-3.5 rounded-xl font-bold text-base hover:bg-orange-600 transition-all orange-button-glow dark:orange-glow dark:orange-glow-hover active:scale-[0.98] group"
                    >
                        <div className="bg-white/20 p-2.5 rounded-xl group-hover:bg-white/30 transition-all group-hover:rotate-12">
                            <Play className="h-5 w-5 fill-current" />
                        </div>
                        <span>Continuar Aula</span>
                    </Link>
                </motion.div>
            </div>
        </motion.div>
    );
};

