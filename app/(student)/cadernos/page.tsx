'use client';

import { useState, useEffect } from 'react';
import { BookOpenIcon, ClockIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { LessonNotebook } from '@/components/Lessons/LessonNotebook';

interface Note {
    id: string;
    lessonId: string;
    lessonTitle: string;
    content: string;
    updatedAt: string;
}

interface ModuleGroup {
    moduleId: string;
    moduleTitle: string;
    moduleOrder: number;
    notes: Note[];
}

export default function NotebooksPage() {
    const [notebooks, setNotebooks] = useState<ModuleGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);
    const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

    useEffect(() => {
        const fetchNotebooks = async () => {
            try {
                const res = await fetch('/api/lessons/notes/all');
                const data = await res.json();
                const notesData = data.notebooks || [];
                setNotebooks(notesData);

                // Auto-expand first module
                if (notesData.length > 0) {
                    setExpandedModules(new Set([notesData[0].moduleId]));
                }

                // Auto-select first note if available
                if (notesData.length > 0 && notesData[0].notes.length > 0) {
                    setSelectedNote(notesData[0].notes[0]);
                }
            } catch (error) {
                console.error('Erro ao carregar cadernos:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchNotebooks();
    }, []);

    const toggleModule = (moduleId: string) => {
        setExpandedModules(prev => {
            const next = new Set(prev);
            if (next.has(moduleId)) {
                next.delete(moduleId);
            } else {
                next.add(moduleId);
            }
            return next;
        });
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-trenchy-orange"></div>
                    <p className="text-sm text-trenchy-text-secondary font-medium">Carregando cadernos...</p>
                </div>
            </div>
        );
    }

    const totalNotes = notebooks.reduce((acc, module) => acc + module.notes.length, 0);

    return (
        <main className="h-[calc(100vh-64px)] p-6 md:p-8 max-w-7xl mx-auto w-full flex flex-col gap-6">
            {/* Header Standard */}
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <BookOpenIcon className="h-8 w-8 text-trenchy-orange" />
                    <h1 className="text-3xl font-bold tracking-tight text-trenchy-text-primary">Meus Cadernos</h1>
                </div>
                <p className="text-trenchy-text-secondary">
                    {totalNotes > 0
                        ? `${totalNotes} ${totalNotes === 1 ? 'anotação salva' : 'anotações salvas'} em ${notebooks.length} ${notebooks.length === 1 ? 'módulo' : 'módulos'}`
                        : 'Suas anotações de aula aparecerão aqui'
                    }
                </p>
            </div>

            {/* Empty State */}
            {totalNotes === 0 ? (
                <div className="flex-1 bg-trenchy-card border border-trenchy-border rounded-2xl flex items-center justify-center p-12 text-center">
                    <div>
                        <BookOpenIcon className="h-16 w-16 text-trenchy-text-secondary/30 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-trenchy-text-primary mb-2">
                            Nenhum caderno ainda
                        </h3>
                        <p className="text-sm text-trenchy-text-secondary max-w-md mx-auto">
                            Comece a fazer anotações durante as aulas e elas aparecerão aqui automaticamente.
                        </p>
                    </div>
                </div>
            ) : (
                /* Split-Screen Layout wrapped in Card */
                <div className="flex-1 bg-trenchy-card border border-trenchy-border rounded-2xl overflow-hidden flex">
                    {/* Left Panel - Notebooks List */}
                    <div className="w-full lg:w-80 border-r border-trenchy-border bg-trenchy-card/50 overflow-y-auto">
                        <div className="p-4 space-y-2">
                            {notebooks.map((module) => {
                                const isExpanded = expandedModules.has(module.moduleId);
                                return (
                                    <div key={module.moduleId} className="border-b border-trenchy-border/50 pb-2 last:border-0">
                                        {/* Module Header (Accordion Trigger) */}
                                        <button
                                            onClick={() => toggleModule(module.moduleId)}
                                            className="w-full flex items-center justify-between p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors group"
                                        >
                                            <h2 className="text-xs font-bold text-trenchy-orange uppercase tracking-wider group-hover:text-amber-500 transition-colors text-left pr-2">
                                                {module.moduleTitle}
                                            </h2>
                                            <ChevronDownIcon
                                                className={`h-4 w-4 text-trenchy-text-secondary transition-transform duration-200 shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                                            />
                                        </button>

                                        {/* Notes List (Collapsible) */}
                                        <div className={`space-y-1 pl-2 mt-1 overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                            {module.notes.map((note) => {
                                                const isSelected = selectedNote?.id === note.id;
                                                return (
                                                    <button
                                                        key={note.id}
                                                        onClick={() => setSelectedNote(note)}
                                                        className={`w-full text-left p-2.5 rounded-lg transition-all border-l-2 ${isSelected
                                                            ? 'bg-trenchy-orange/5 border-trenchy-orange text-trenchy-text-primary'
                                                            : 'border-transparent text-trenchy-text-secondary hover:bg-black/5 dark:hover:bg-white/5 hover:text-trenchy-text-primary'
                                                            }`}
                                                    >
                                                        {/* Note Title */}
                                                        <h3 className={`text-sm font-medium mb-1 line-clamp-1 ${isSelected ? 'font-bold' : ''}`}>
                                                            {note.lessonTitle}
                                                        </h3>

                                                        {/* Note Timestamp */}
                                                        <div className="flex items-center gap-1.5 text-[10px] opacity-60">
                                                            <ClockIcon className="h-3 w-3" />
                                                            {formatDate(note.updatedAt)}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right Panel - Editor */}
                    <div className="flex-1 bg-background/50 flex flex-col relative">
                        {selectedNote ? (
                            <LessonNotebook
                                lessonId={selectedNote.lessonId}
                                lessonTitle={selectedNote.lessonTitle}
                            />
                        ) : (
                            <div className="h-full flex items-center justify-center">
                                <div className="text-center">
                                    <BookOpenIcon className="h-12 w-12 text-trenchy-text-secondary/30 mx-auto mb-3" />
                                    <p className="text-sm text-trenchy-text-secondary">
                                        Selecione um caderno para começar
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </main>
    );
}
