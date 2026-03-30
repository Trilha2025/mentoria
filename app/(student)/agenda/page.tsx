'use client';

import { PlannerCalendar } from '@/components/Planner/PlannerCalendar';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function AgendaContent() {
    const searchParams = useSearchParams();
    const lessonId = searchParams.get('lessonId');
    const title = searchParams.get('title');

    const prefilledEvent = lessonId && title ? { title, lessonId } : null;

    return (
        <div className="animate-in fade-in duration-300">
            <PlannerCalendar prefilledEvent={prefilledEvent} />
        </div>
    );
}

export default function AgendaPage() {
    return (
        <main className="max-w-7xl mx-auto p-6 md:p-8 w-full min-h-screen">
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <CalendarDaysIcon className="h-8 w-8 text-trenchy-orange" />
                    <h1 className="text-3xl font-bold tracking-tight text-trenchy-text-primary">Minha Agenda</h1>
                </div>
                <p className="text-trenchy-text-secondary">
                    Planeje sua semana de estudos e acompanhe suas atividades.
                </p>
            </div>

            <Suspense fallback={<div className="animate-pulse bg-trenchy-card h-[500px] rounded-xl border border-trenchy-border"></div>}>
                <AgendaContent />
            </Suspense>
        </main>
    );
}
