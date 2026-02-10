'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ClipboardDocumentListIcon, TrashIcon, CalendarDaysIcon, CheckIcon } from '@heroicons/react/24/outline';
import { PlayCircleIcon } from '@heroicons/react/24/solid';
import { PlannerCalendar } from '@/components/Planner/PlannerCalendar';

interface Lesson {
    id: string;
    title: string;
    videoUrl: string | null;
    content: string | null;
    addedAt: string;
    completed?: boolean;
}

interface ModuleGroup {
    moduleId: string;
    moduleTitle: string;
    lessons: Lesson[];
}

export default function StudyPlanPage() {
    const [activeTab, setActiveTab] = useState<'LIST' | 'AGENDA'>('AGENDA');
    const [studyPlan, setStudyPlan] = useState<ModuleGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [removing, setRemoving] = useState<string | null>(null);
    const [confirming, setConfirming] = useState<string | null>(null);
    const [completing, setCompleting] = useState<string | null>(null);
    const [newLessonEvent, setNewLessonEvent] = useState<{ title: string } | null>(null);

    useEffect(() => {
        if (activeTab === 'LIST') {
            fetchStudyPlan();
        } else {
            setLoading(false); // Agenda handles its own loading
        }
    }, [activeTab]);

    const fetchStudyPlan = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/study-plan');
            const data = await res.json();
            if (data.success) {
                setStudyPlan(data.data);
            }
        } catch (error) {
            console.error('Error fetching study plan:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveLesson = async (e: React.MouseEvent, lessonId: string) => {
        e.preventDefault();
        e.stopPropagation();

        if (confirming !== lessonId) {
            setConfirming(lessonId);
            setTimeout(() => setConfirming(null), 3000);
            return;
        }

        setRemoving(lessonId);
        setConfirming(null);
        try {
            const res = await fetch(`/api/study-plan/${lessonId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                setStudyPlan(prev => prev.map(module => ({
                    ...module,
                    lessons: module.lessons.filter(l => l.id !== lessonId)
                })).filter(module => module.lessons.length > 0));
            } else {
                const data = await res.json();
                alert('Erro ao remover aula: ' + (data.error || 'Erro desconhecido'));
            }
        } catch (error) {
            console.error('Error removing lesson:', error);
            alert('Erro ao remover aula');
        } finally {
            setRemoving(null);
        }
    };

    const handleToggleComplete = async (e: React.MouseEvent, lessonId: string, currentStatus: boolean) => {
        e.preventDefault();
        e.stopPropagation();
        setCompleting(lessonId);

        try {
            const res = await fetch(`/api/study-plan/${lessonId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ completed: !currentStatus })
            });

            if (res.ok) {
                setStudyPlan(prev => prev.map(module => ({
                    ...module,
                    lessons: module.lessons.map(l =>
                        l.id === lessonId ? { ...l, completed: !currentStatus } : l
                    )
                })));
            }
        } catch (error) {
            console.error('Error toggling complete:', error);
        } finally {
            setCompleting(null);
        }
    };

    const handleAddToAgenda = (lessonTitle: string) => {
        setNewLessonEvent({ title: `Estudo: ${lessonTitle}` });
        setActiveTab('AGENDA');
    };

    return (
        <main className="max-w-7xl mx-auto p-6 md:p-8 w-full min-h-screen">
            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <ClipboardDocumentListIcon className="h-8 w-8 text-trenchy-orange" />
                        <h1 className="text-3xl font-bold tracking-tight text-trenchy-text-primary">Plano de Estudo</h1>
                    </div>
                    <p className="text-trenchy-text-secondary">
                        Organize suas aulas e planeje sua semana de estudos com eficiência.
                    </p>
                </div>

                {/* Tab Switcher */}
                <div className="flex bg-trenchy-card border border-trenchy-border p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('AGENDA')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'AGENDA'
                            ? 'bg-trenchy-orange text-white shadow-lg'
                            : 'text-trenchy-text-secondary hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <CalendarDaysIcon className="h-4 w-4" />
                        Agenda
                    </button>
                    <button
                        onClick={() => setActiveTab('LIST')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'LIST'
                            ? 'bg-trenchy-orange text-white shadow-lg'
                            : 'text-trenchy-text-secondary hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <ClipboardDocumentListIcon className="h-4 w-4" />
                        Minha Lista
                    </button>
                </div>
            </div>

            {/* Content */}
            {activeTab === 'AGENDA' ? (
                <div className="animate-in fade-in duration-300">
                    <PlannerCalendar prefilledEvent={newLessonEvent} />
                </div>
            ) : (
                <div className="animate-in fade-in duration-300">
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-trenchy-orange"></div>
                        </div>
                    ) : studyPlan.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center bg-trenchy-card border border-trenchy-border rounded-2xl">
                            <ClipboardDocumentListIcon className="h-16 w-16 text-trenchy-text-secondary/30 mb-4" />
                            <h3 className="text-xl font-bold text-trenchy-text-primary mb-2">Sua lista está vazia</h3>
                            <p className="text-trenchy-text-secondary mb-6 max-w-md">
                                Navegue pelos módulos e adicione aulas ao seu plano de estudo para começar a se organizar.
                            </p>
                            <Link
                                href="/dashboard"
                                className="px-6 py-3 bg-trenchy-orange text-white font-bold rounded-lg hover:bg-orange-600 transition"
                            >
                                Explorar Aulas
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            <div className="grid gap-6">
                                {studyPlan.map((module) => (
                                    <div key={module.moduleId} className="bg-trenchy-card border border-trenchy-border rounded-xl overflow-hidden">
                                        <div className="px-6 py-4 bg-black/20 border-b border-trenchy-border flex items-center justify-between">
                                            <h2 className="font-bold text-lg text-trenchy-text-primary flex items-center gap-2">
                                                <span className="w-2 h-6 bg-trenchy-orange rounded-full"></span>
                                                {module.moduleTitle}
                                            </h2>
                                            <span className="text-sm text-trenchy-text-secondary bg-white/5 px-3 py-1 rounded-full">
                                                {module.lessons.length} {module.lessons.length === 1 ? 'aula' : 'aulas'}
                                            </span>
                                        </div>

                                        <div className="divide-y divide-trenchy-border/50">
                                            {module.lessons.map((lesson) => (
                                                <div
                                                    key={lesson.id}
                                                    className={`group p-4 hover:bg-white/5 transition-colors flex items-center gap-4 ${lesson.completed ? 'opacity-50' : ''
                                                        }`}
                                                >
                                                    {/* Checkbox */}
                                                    <button
                                                        onClick={(e) => handleToggleComplete(e, lesson.id, !!lesson.completed)}
                                                        className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${lesson.completed
                                                            ? 'bg-green-500 border-green-500 text-black'
                                                            : 'border-trenchy-text-secondary hover:border-trenchy-orange'
                                                            }`}
                                                        disabled={completing === lesson.id}
                                                    >
                                                        {completing === lesson.id ? (
                                                            <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                                        ) : lesson.completed && (
                                                            <CheckIcon className="w-4 h-4" />
                                                        )}
                                                    </button>

                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className={`font-medium truncate ${lesson.completed
                                                            ? 'text-trenchy-text-secondary line-through decoration-white/20'
                                                            : 'text-trenchy-text-primary'
                                                            }`}>
                                                            {lesson.title}
                                                        </h3>
                                                        <div className="flex items-center gap-2 text-xs text-trenchy-text-secondary mt-1">
                                                            <span>Adicionado em {new Date(lesson.addedAt).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => handleAddToAgenda(lesson.title)}
                                                            className="p-2 text-trenchy-text-secondary hover:text-trenchy-orange hover:bg-trenchy-orange/10 rounded-lg transition"
                                                            title="Adicionar à Agenda"
                                                        >
                                                            <CalendarDaysIcon className="h-6 w-6" />
                                                        </button>
                                                        <Link
                                                            href={`/modulo/${module.moduleId}?lesson=${lesson.id}`}
                                                            className="p-2 text-trenchy-text-secondary hover:text-trenchy-orange hover:bg-trenchy-orange/10 rounded-lg transition"
                                                            title="Ir para aula"
                                                        >
                                                            <PlayCircleIcon className="h-6 w-6" />
                                                        </Link>
                                                        <button
                                                            onClick={(e) => handleRemoveLesson(e, lesson.id)}
                                                            className={`p-2 rounded-lg transition ${confirming === lesson.id
                                                                ? 'bg-red-500/20 text-red-500'
                                                                : 'text-trenchy-text-secondary hover:text-red-500 hover:bg-red-500/10'
                                                                }`}
                                                            title="Remover do plano"
                                                        >
                                                            {confirming === lesson.id ? (
                                                                <span className="text-xs font-bold">Confirmar?</span>
                                                            ) : (
                                                                <TrashIcon className="h-5 w-5" />
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </main>
    );
}
