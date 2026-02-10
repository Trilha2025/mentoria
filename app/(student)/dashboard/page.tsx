'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ModuleCard } from '@/components/Dashboard/ModuleGrid';
import { DashboardHero } from '@/components/Dashboard/DashboardHero';
import { ActionList } from '@/components/Dashboard/ActionList';

// Tipo para os dados vindos do banco
interface UserModule {
    id: string; // ID do relacionamento UserModuleAccess
    status: 'LOCKED' | 'UNLOCKED' | 'COMPLETED';
    moduleId: string;
    module: {
        id: string;
        title: string;
        description: string;
        order: number;
    };
}

interface Task {
    moduleId: string;
    moduleTitle: string;
    status: 'PENDING' | 'ADJUST_REQUIRED' | 'APPROVED';
}

interface Feedback {
    moduleId: string;
    moduleTitle: string;
    feedback: string;
    status: string;
}

export default function DashboardPage() {
    const [modules, setModules] = useState<UserModule[]>([]);
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState('');

    // V2 New State
    const [currentModule, setCurrentModule] = useState<{ id: string; title: string } | null>(null);
    const [pendingTasks, setPendingTasks] = useState<Task[]>([]);
    const [recentFeedback, setRecentFeedback] = useState<Feedback | null>(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            // 1. Pega usuário logado
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                window.location.href = '/login';
                return;
            }

            // 2. Busca dados do perfil (Nome)
            const { data: profile } = await supabase
                .from('User')
                .select('name')
                .eq('id', user.id)
                .single();

            if (profile) {
                setUserName(profile.name || 'Mentorado');
            }

            // 3. Busca Módulos e Aulas com acesso
            const [modulesRes, lessonAccessRes] = await Promise.all([
                supabase
                    .from('UserModuleAccess')
                    .select('id, status, moduleId, Module(id, title, description, order)')
                    .eq('userId', user.id),
                supabase
                    .from('UserLessonAccess')
                    .select('lessonId, status, lesson:Lesson(moduleId, Module(id, title, description, order))')
                    .eq('userId', user.id)
                    .in('status', ['UNLOCKED', 'COMPLETED'])
            ]);

            const modAccData = modulesRes.data || [];
            const lesAccData = lessonAccessRes.data || [];

            // Merge unique modules from both sources
            const modulesMap = new Map<string, any>();

            // 1. Process Module Access
            modAccData.forEach((item: any) => {
                if (item.Module) {
                    modulesMap.set(item.moduleId, {
                        id: item.id,
                        status: item.status,
                        moduleId: item.moduleId,
                        module: item.Module
                    });
                }
            });

            // 2. Process Lesson Access (Add modules that might not be in UserModuleAccess)
            lesAccData.forEach((item: any) => {
                const moduleId = item.lesson?.moduleId;
                if (moduleId && !modulesMap.has(moduleId) && item.lesson?.Module) {
                    modulesMap.set(moduleId, {
                        id: `la-${moduleId}`,
                        status: 'UNLOCKED', // If at least one lesson is unlocked, show module as unlocked
                        moduleId: moduleId,
                        module: item.lesson.Module
                    });
                }
            });

            const allModules = Array.from(modulesMap.values());
            const sorted = allModules.sort((a, b) => (a.module.order || 0) - (b.module.order || 0));

            setModules(sorted);

            // Determinar Módulo Atual (V2 Logic)
            const active = sorted.find((m: any) => m.status === 'UNLOCKED') || sorted[sorted.length - 1];
            if (active) {
                setCurrentModule({
                    id: active.module.id,
                    title: active.module.title
                });
            }

            // 4. Busca Tasks Pendentes e Feedback (V2)
            const { data: submissions } = await supabase
                .from('DocumentSubmission')
                .select(`
                    status,
                    moduleId,
                    mentorFeedback,
                    Module (title)
                `)
                .eq('userId', user.id)
                .order('id', { ascending: false }); // Mais recente primeiro

            if (submissions) {
                // Filtra Pendentes ou Ajuste
                const tasks: Task[] = submissions
                    .filter((s: any) => s.status === 'PENDING' || s.status === 'ADJUST_REQUIRED')
                    .map((s: any) => ({
                        moduleId: s.moduleId,
                        moduleTitle: s.Module?.title || 'Módulo Desconhecido',
                        status: s.status
                    }));
                setPendingTasks(tasks);

                // Pega último feedback
                const lastFeedback = submissions.find((s: any) => s.mentorFeedback);
                if (lastFeedback) {
                    setRecentFeedback({
                        moduleId: lastFeedback.moduleId,
                        // @ts-ignore
                        moduleTitle: lastFeedback.Module?.title || 'Geral',
                        feedback: lastFeedback.mentorFeedback,
                        status: lastFeedback.status
                    });
                }
            }

            setLoading(false);
        };

        fetchDashboardData();
    }, []);

    if (loading) return (
        <div className="flex justify-center py-20 min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-trenchy-orange"></div>
        </div>
    );

    return (
        <main className="max-w-7xl mx-auto p-6 md:p-8 w-full">

            {/* V2: Hero Section & Action List */}
            {modules.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                    <div className="lg:col-span-2">
                        {currentModule ? (
                            <DashboardHero
                                moduleId={currentModule.id}
                                moduleTitle={currentModule.title}
                                userName={userName}
                            />
                        ) : (
                            <div className="bg-trenchy-card p-8 rounded-2xl border border-trenchy-border">
                                <h1 className="text-2xl font-bold text-trenchy-text-primary">Bem-vindo, {userName}.</h1>
                                <p className="text-trenchy-text-secondary">Seu mentor ainda não liberou o primeiro módulo.</p>
                            </div>
                        )}
                    </div>
                    <div>
                        <ActionList
                            pendingTasks={pendingTasks}
                            recentFeedback={recentFeedback}
                        />
                    </div>
                </div>
            )}

            {/* V1: All Modules Grid */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2 tracking-tight text-trenchy-text-primary">Sua Trilha Completa</h2>
                <div className="h-1 w-20 bg-trenchy-orange rounded-full"></div>
            </div>

            {modules.length === 0 ? (
                <div className="text-center py-20 bg-trenchy-card rounded-xl border border-trenchy-border shadow-sm">
                    <p className="text-trenchy-text-secondary mb-4">Aguarde seu mentor liberar os primeiros módulos.</p>
                    <div className="text-sm text-trenchy-text-secondary bg-black/5 dark:bg-black/20 p-4 rounded-lg inline-block max-w-sm mx-auto">
                        Assim que seu plano de evolução for definido, as aulas aparecerão aqui automaticamente.
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {modules.map((item) => (
                        <ModuleCard
                            key={item.id}
                            id={item.module.id}
                            title={item.module.title}
                            description={item.module.description}
                            status={item.status}
                        />
                    ))}
                </div>
            )}
        </main>
    );
}
