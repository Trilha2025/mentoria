'use client';

import { useState, useEffect } from 'react';
import { PlayCircleIcon, CheckCircleIcon } from '@heroicons/react/24/solid';
import { CheckIcon, BookmarkIcon } from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';

interface Lesson {
    id: string;
    title: string;
    videoUrl?: string;
    content?: string;
    completed?: boolean; // From backend
}

interface LessonPlayerProps {
    lesson: Lesson;
    onComplete: (lessonId: string) => void;
    moduleId?: string; // Add moduleId for study plan
}

export const LessonPlayer = ({ lesson, onComplete, moduleId }: LessonPlayerProps) => {
    const [completed, setCompleted] = useState(lesson.completed || false);
    const [marking, setMarking] = useState(false);
    const [inStudyPlan, setInStudyPlan] = useState(false);
    const [addingToStudyPlan, setAddingToStudyPlan] = useState(false);

    useEffect(() => {
        setCompleted(lesson.completed || false);
        checkIfInStudyPlan();
    }, [lesson]);

    const checkIfInStudyPlan = async () => {
        if (!moduleId) return;
        try {
            const res = await fetch('/api/study-plan');
            const data = await res.json();
            if (data.success) {
                const isInPlan = data.data.some((module: any) =>
                    module.lessons.some((l: any) => l.id === lesson.id)
                );
                setInStudyPlan(isInPlan);
            }
        } catch (error) {
            console.error('Error checking study plan:', error);
        }
    };

    const handleToggleComplete = async () => {
        setMarking(true);
        try {
            const newState = !completed;

            // Optimistic UI
            setCompleted(newState);

            const res = await fetch('/api/lessons/progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lessonId: lesson.id,
                    completed: newState
                })
            });

            if (!res.ok) {
                const errorData = await res.json();
                console.error("API Error Details:", errorData);
                throw new Error(errorData.error || 'Failed to update progress');
            }

            if (newState) {
                onComplete(lesson.id);
            }

        } catch (error) {
            console.error(error);
            setCompleted(!completed); // Revert
        } finally {
            setMarking(false);
        }
    };

    const handleToggleStudyPlan = async () => {
        if (!moduleId) {
            alert('ModuleId não disponível');
            return;
        }

        setAddingToStudyPlan(true);
        try {
            if (inStudyPlan) {
                // Remove from study plan
                const res = await fetch(`/api/study-plan/${lesson.id}`, {
                    method: 'DELETE'
                });
                if (res.ok) {
                    setInStudyPlan(false);
                }
            } else {
                // Add to study plan
                const res = await fetch('/api/study-plan', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        lessonId: lesson.id,
                        moduleId: moduleId
                    })
                });
                if (res.ok) {
                    setInStudyPlan(true);
                } else {
                    const data = await res.json();
                    if (data.error) alert(data.error);
                }
            }
        } catch (error) {
            console.error('Error toggling study plan:', error);
            alert('Erro ao atualizar plano de estudo');
        } finally {
            setAddingToStudyPlan(false);
        }
    };

    const getEmbedUrl = (url?: string) => {
        if (!url) return '';

        // Handle YouTube
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            let videoId = '';

            if (url.includes('youtu.be')) {
                videoId = url.split('youtu.be/')[1]?.split('?')[0];
            } else if (url.includes('watch?v=')) {
                videoId = url.split('watch?v=')[1]?.split('&')[0];
            } else if (url.includes('embed/')) {
                videoId = url.split('embed/')[1]?.split('?')[0];
            }

            if (videoId) {
                return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
            }
        }

        // Handle Vimeo
        if (url.includes('vimeo.com')) {
            const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
            if (videoId) {
                return `https://player.vimeo.com/video/${videoId}`;
            }
        }

        return url;
    };

    return (
        <div className="bg-black/20 rounded-xl overflow-hidden border border-trenchy-border">
            {/* Video Area */}
            <div className="aspect-video bg-black relative flex items-center justify-center group">
                {lesson.videoUrl ? (
                    <iframe
                        src={getEmbedUrl(lesson.videoUrl)}
                        className="w-full h-full"
                        allowFullScreen
                        title={lesson.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                ) : (
                    <div className="text-center p-10">
                        <PlayCircleIcon className="h-20 w-20 text-trenchy-text-secondary mx-auto mb-4 opacity-50" />
                        <p className="text-trenchy-text-secondary">Sem vídeo disponível para esta aula.</p>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="p-6 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-trenchy-text-primary mb-1">{lesson.title}</h2>
                    <p className="text-sm text-trenchy-text-secondary">
                        {completed ? 'Aula concluída' : 'Assista para avançar'}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Study Plan Button */}
                    {moduleId && (
                        <button
                            onClick={handleToggleStudyPlan}
                            disabled={addingToStudyPlan}
                            className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-bold transition-all ${inStudyPlan
                                ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20 hover:bg-blue-500/20'
                                : 'bg-gray-500/10 text-gray-500 border border-gray-500/20 hover:bg-gray-500/20'
                                }`}
                            title={inStudyPlan ? 'Remover do Plano de Estudo' : 'Adicionar ao Plano de Estudo'}
                        >
                            {inStudyPlan ? (
                                <>
                                    <BookmarkSolidIcon className="h-4 w-4" />
                                    <span className="hidden sm:inline">No Plano</span>
                                </>
                            ) : (
                                <>
                                    <BookmarkIcon className="h-4 w-4" />
                                    <span className="hidden sm:inline">Adicionar ao Plano</span>
                                </>
                            )}
                        </button>
                    )}

                    {/* Complete Button */}
                    <button
                        onClick={handleToggleComplete}
                        disabled={marking}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${completed
                            ? 'bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500/20'
                            : 'bg-trenchy-orange text-white hover:bg-orange-600 shadow-lg shadow-orange-900/20'
                            }`}
                    >
                        {completed ? (
                            <>
                                <CheckCircleIcon className="h-4 w-4" />
                                Concluída
                            </>
                        ) : (
                            <>
                                <CheckIcon className="h-4 w-4" />
                                Marcar como Vista
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Content / Description */}
            {lesson.content && (
                <div className="px-6 pb-6 text-trenchy-text-secondary prose prose-invert max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
                </div>
            )}
        </div>
    );
};
