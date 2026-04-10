import { prisma } from '@/lib/prisma';
import { EventGallery } from '@/components/Agenda/EventGallery';
import { PlannerCalendar } from '@/components/Planner/PlannerCalendar';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';
import { Suspense } from 'react';

// This is now a Server Component
export default async function AgendaPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const params = await searchParams;
    const lessonId = params.lessonId as string | undefined;
    const title = params.title as string | undefined;

    const prefilledEvent = lessonId && title ? { title, lessonId } : null;

    // Fetch images on the server
    const galleryImages = await prisma.eventGalleryImage.findMany({
        orderBy: { order: 'asc' }
    });

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

            <div className="space-y-12">
                {/* Event Highlights Section */}
                <EventGallery images={galleryImages} />

                {/* Calendar Section */}
                <Suspense fallback={<div className="animate-pulse bg-trenchy-card h-[600px] rounded-2xl border border-white/5 shadow-xl"></div>}>
                    <PlannerCalendar prefilledEvent={prefilledEvent} />
                </Suspense>
            </div>
        </main>
    );
}
