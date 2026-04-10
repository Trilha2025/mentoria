'use client';

import { useState, useEffect, use } from 'react';
import { TaskUpload } from '@/components/Dashboard/TaskUpload';
import { LessonPlayer } from '@/components/Lessons/LessonPlayer';
import { LessonNotebook } from '@/components/Lessons/LessonNotebook';
import { supabase } from '@/lib/supabase';
import {
    CheckCircleIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    PlayCircleIcon,
    Bars3Icon,
    ArrowDownTrayIcon,
    PencilSquareIcon as PencilSquareSolidIcon
} from '@heroicons/react/24/solid';

import {
    Bars3Icon as Bars3OutlineIcon,
    PencilSquareIcon as PencilSquareOutlineIcon,
    LockClosedIcon
} from '@heroicons/react/24/outline';

export default function LessonPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const { id } = resolvedParams;

    const [moduleData, setModuleData] = useState<any>(null);
    const [lessons, setLessons] = useState<any[]>([]);
    const [activeLesson, setActiveLesson] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'content' | 'notes'>('content');
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        const fetchLessonData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    window.location.href = '/login';
                    return;
                }
                setUserId(user.id);

                // 1. Fetch Module Info, Module Access, and User Access Level
                const [modRes, modAccRes, userProfileRes] = await Promise.all([
                    supabase.from('Module').select('*').eq('id', id).single(),
                    supabase.from('UserModuleAccess').select('status').eq('userId', user.id).eq('moduleId', id).maybeSingle(),
                    supabase.from('User').select('role, accessType').eq('id', user.id).single()
                ]);

                if (modRes.error) throw modRes.error;
                const mod = modRes.data;
                const profile = userProfileRes.data;

                // REDIRECT: Se for apenas comunidade, não acessa o portal de mentoria
                if (profile?.accessType === 'COMMUNITY' && profile?.role === 'MENTEE') {
                    window.location.href = 'https://comunidade.atrilhadoecommerce.com.br';
                    return;
                }

                let isModuleUnlocked = modAccRes.data?.status === 'UNLOCKED' || modAccRes.data?.status === 'COMPLETED';

                if (mod) {
                    setModuleData(mod);

                    // 2. Fetch Lesson Accesses for this user
                    const { data: lessonAccesses } = await supabase
                        .from('UserLessonAccess')
                        .select('lessonId, status')
                        .eq('userId', user.id);

                    // 3. Fetch Lessons for this Module
                    const { data: fetchedLessons, error: lessonsError } = await supabase
                        .from('Lesson')
                        .select('*')
                        .eq('moduleId', id)
                        .order('title', { ascending: true }); // Fallback order

                    if (lessonsError) throw lessonsError;

                    if (fetchedLessons && fetchedLessons.length > 0) {
                        // Filter and Map Access
                        const visibleLessons = fetchedLessons.map((lesson: any, idx: number) => {
                            const lAcc = lessonAccesses?.find((a: any) => a.lessonId === lesson.id);
                            let hasAccess = false;

                            if (lAcc?.status === 'UNLOCKED' || lAcc?.status === 'COMPLETED') {
                                hasAccess = true;
                            } else if (lAcc?.status === 'LOCKED') {
                                hasAccess = false;
                            } else {
                                hasAccess = isModuleUnlocked;
                            }

                            return { ...lesson, isLocked: !hasAccess };
                        });

                        setLessons(visibleLessons);

                        // Default to first lesson if none active
                        if (!activeLesson) {
                            setActiveLesson(visibleLessons[0]);
                        }
                    }
                }
            } catch (error) {
                console.error("Erro ao carregar dados da aula:", error);
                window.location.href = '/dashboard';
            } finally {
                setLoading(false);
            }
        };

        fetchLessonData();
    }, [id, activeLesson?.id]);

    const handleLessonComplete = (lessonId: string) => {
        // Update local state for the list
        setLessons(prev => prev.map((l: any) => l.id === lessonId ? { ...l, completed: true } : l));

        // Update active lesson state
        if (activeLesson && activeLesson.id === lessonId) {
            setActiveLesson({ ...activeLesson, completed: true });
        }
    };

    const goToNextLesson = () => {
        if (!activeLesson || lessons.length === 0) return;
        const currentIndex = lessons.findIndex(l => l.id === activeLesson.id);
        if (currentIndex < lessons.length - 1) {
            setActiveLesson(lessons[currentIndex + 1]);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const goToPrevLesson = () => {
        if (!activeLesson || lessons.length === 0) return;
        const currentIndex = lessons.findIndex(l => l.id === activeLesson.id);
        if (currentIndex > 0) {
            setActiveLesson(lessons[currentIndex - 1]);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    if (loading) return <div className="p-12 text-center text-trenchy-text-secondary">Carregando aula...</div>;

    if (!moduleData) return <div className="p-12 text-center text-trenchy-text-secondary">Módulo não encontrado.</div>;

    const currentIndex = activeLesson ? lessons.findIndex(l => l.id === activeLesson.id) : 0;
    const hasNext = currentIndex < lessons.length - 1;
    const hasPrev = currentIndex > 0;

    return (
        <div className="max-w-7xl mx-auto p-4 lg:p-8 w-full">
            <div className="flex flex-col lg:flex-row gap-8">

                {/* Left Column: Player & Content & Task */}
                <div className="flex-1 min-w-0 flex flex-col gap-8">

                    {/* Header */}
                    <div>
                        <span className="text-sm font-semibold text-trenchy-orange tracking-wider uppercase">Módulo: {moduleData.title}</span>
                    </div>

                    {/* Video Player */}
                    <div>
                        {activeLesson ? (
                            <LessonPlayer
                                lesson={activeLesson}
                                onComplete={handleLessonComplete}
                                moduleId={id}
                            />
                        ) : (
                            <div className="aspect-video bg-black rounded-2xl flex items-center justify-center text-trenchy-text-secondary border border-trenchy-border">
                                Conteúdo em breve
                            </div>
                        )}
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex justify-between items-center px-2">
                        <button
                            onClick={goToPrevLesson}
                            disabled={!hasPrev}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${hasPrev
                                ? 'text-trenchy-text-primary hover:bg-trenchy-card hover:text-white border border-transparent hover:border-trenchy-border'
                                : 'text-trenchy-text-secondary opacity-30 cursor-not-allowed'
                                }`}
                        >
                            <ChevronLeftIcon className="h-5 w-5" />
                            Aula Anterior
                        </button>

                        <span className="text-xs font-mono text-trenchy-text-secondary">
                            {currentIndex + 1} / {lessons.length}
                        </span>

                        <button
                            onClick={goToNextLesson}
                            disabled={!hasNext}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${hasNext
                                ? 'bg-trenchy-card text-trenchy-text-primary border border-trenchy-border hover:border-trenchy-orange hover:text-trenchy-orange'
                                : 'text-trenchy-text-secondary opacity-30 cursor-not-allowed'
                                }`}
                        >
                            Próxima Aula
                            <ChevronRightIcon className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Material de Apoio & Task Widget */}
                    {(activeLesson?.tasks || activeLesson?.materialUrl) && (
                        <div className="bg-trenchy-card p-6 rounded-2xl border border-trenchy-border shadow-lg">
                            <h2 className="text-lg font-bold mb-4 flex items-center text-trenchy-text-primary">
                                <CheckCircleIcon className="h-6 w-6 mr-2 text-trenchy-orange" />
                                Material e Entrega Prática
                            </h2>

                            {activeLesson?.materialUrl && (
                                <div className="mb-6">
                                    <h3 className="text-sm font-bold text-trenchy-text-secondary uppercase tracking-tight mb-2">Material de Apoio</h3>
                                    <a
                                        href={activeLesson.materialUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 bg-black/5 dark:bg-white/5 border border-trenchy-border px-4 py-2.5 rounded-lg text-sm font-semibold text-trenchy-text-primary hover:border-trenchy-orange hover:text-trenchy-orange transition-all"
                                    >
                                        <ArrowDownTrayIcon className="h-5 w-5" />
                                        Baixar Material de Apoio
                                    </a>
                                </div>
                            )}

                            {activeLesson?.tasks && (
                                <div className="bg-black/5 dark:bg-black/20 p-4 rounded-xl mb-6 border border-trenchy-border">
                                    <h3 className="text-sm font-bold text-trenchy-text-secondary uppercase tracking-tight mb-2">Tarefa Prática</h3>
                                    <p className="text-sm text-trenchy-text-secondary font-medium leading-relaxed whitespace-pre-wrap">
                                        {activeLesson.tasks}
                                    </p>
                                </div>
                            )}

                            {/* Componente de Upload */}
                            {userId && (
                                <TaskUpload
                                    moduleId={id}
                                    userId={userId}
                                    lessonId={activeLesson?.id}
                                />
                            )}

                            <div className="mt-8 pt-6 border-t border-trenchy-border text-xs text-trenchy-text-secondary text-center">
                                <p>O mentor revisará seu envio em até 48h.</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Tabbed Sidebar */}
                <div className="w-full lg:w-96 shrink-0 flex flex-col gap-4">

                    {/* Tabs Navigation */}
                    <div className="flex bg-trenchy-card p-1 rounded-2xl border border-trenchy-border shadow-sm">
                        <button
                            onClick={() => setActiveTab('content')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'content'
                                    ? 'bg-trenchy-orange text-white shadow-md'
                                    : 'text-trenchy-text-secondary hover:text-trenchy-text-primary hover:bg-white/5'
                                }`}
                        >
                            <Bars3OutlineIcon className="h-4 w-4" />
                            Conteúdo
                        </button>
                        <button
                            onClick={() => setActiveTab('notes')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'notes'
                                    ? 'bg-trenchy-orange text-white shadow-md'
                                    : 'text-trenchy-text-secondary hover:text-trenchy-text-primary hover:bg-white/5'
                                }`}
                        >
                            <PencilSquareOutlineIcon className="h-4 w-4" />
                            Meu Caderno
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1 flex flex-col min-h-0">
                        {activeTab === 'content' ? (
                            <div className="bg-trenchy-card rounded-2xl border border-trenchy-border overflow-hidden shadow-lg sticky top-6">
                                <div className="p-4 border-b border-trenchy-border bg-black flex items-center gap-2">
                                    <Bars3Icon className="h-5 w-5 text-trenchy-orange" />
                                    <h3 className="font-bold text-trenchy-orange text-sm uppercase tracking-wide">Conteúdo do Módulo</h3>
                                </div>
                                <div className="max-h-[70vh] overflow-y-auto custom-scrollbar">
                                    {lessons.map((lesson, idx) => {
                                        const isActive = activeLesson?.id === lesson.id;
                                        return (
                                            <button
                                                key={lesson.id}
                                                onClick={() => {
                                                    if (lesson.isLocked) return;
                                                    setActiveLesson(lesson);
                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                }}
                                                className={`w-full text-left p-4 hover:bg-white/5 transition flex items-start gap-3 border-b border-trenchy-border/50 last:border-0 relative group ${isActive ? 'bg-white/5' : ''
                                                    } ${lesson.isLocked ? 'opacity-60 grayscale-[0.5]' : ''}`}
                                            >
                                                {/* Active Indicator */}
                                                {isActive && (
                                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-trenchy-orange"></div>
                                                )}

                                                {/* Status Icon */}
                                                <div className="mt-0.5 shrink-0">
                                                    {lesson.isLocked ? (
                                                        <LockClosedIcon className="h-5 w-5 text-trenchy-text-secondary/40" />
                                                    ) : lesson.completed ? (
                                                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                                                    ) : (
                                                        isActive ? (
                                                            <PlayCircleIcon className="h-5 w-5 text-trenchy-orange animate-pulse" />
                                                        ) : (
                                                            <div className="h-5 w-5 rounded-full border-2 border-trenchy-text-secondary/30 flex items-center justify-center">
                                                                <span className="text-[10px] text-trenchy-text-secondary">{idx + 1}</span>
                                                            </div>
                                                        )
                                                    )}
                                                </div>

                                                <div className="flex-1">
                                                    <p className={`text-sm font-medium leading-tight ${isActive ? 'text-trenchy-text-primary' : 'text-trenchy-text-secondary group-hover:text-trenchy-text-primary'}`}>
                                                        {lesson.title}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        {lesson.videoUrl && <span className="text-[10px] uppercase tracking-wider text-trenchy-text-secondary/70">Vídeo</span>}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="sticky top-6 h-fit min-h-[500px] flex flex-col">
                                {activeLesson && (
                                    <LessonNotebook
                                        lessonId={activeLesson.id}
                                        lessonTitle={activeLesson.title}
                                    />
                                )}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
