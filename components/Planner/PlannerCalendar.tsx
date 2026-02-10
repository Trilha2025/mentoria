'use client';

import { useState, useEffect } from 'react';
import {
    format,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    addDays,
    isSameDay,
    subWeeks,
    addWeeks,
    isToday,
    setHours,
    setMinutes,
    isSameMonth,
    startOfMonth,
    endOfMonth,
    subMonths,
    addMonths,
    getDay
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from '@heroicons/react/24/solid';
import { CreateEventModal } from './CreateEventModal';

interface PlannerItem {
    id: string;
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    type: 'STUDY' | 'PERSONAL' | 'WORK' | 'MEETING' | 'LIVE';
    completed: boolean;
    lesson?: {
        id: string;
        title: string;
    };
}

interface PlannerCalendarProps {
    prefilledEvent?: { title: string } | null;
}

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 06:00 to 23:00

export const PlannerCalendar = ({ prefilledEvent }: PlannerCalendarProps) => {
    const [view, setView] = useState<'WEEK' | 'MONTH'>('WEEK');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<PlannerItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<{ start: Date, end: Date } | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<PlannerItem | null>(null);
    const [prefilledTitle, setPrefilledTitle] = useState('');

    useEffect(() => {
        fetchEvents();
    }, [currentDate, view]);

    useEffect(() => {
        if (prefilledEvent) {
            setPrefilledTitle(prefilledEvent.title);
            setIsModalOpen(true);
        }
    }, [prefilledEvent]);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            let start, end;

            if (view === 'WEEK') {
                start = startOfWeek(currentDate, { locale: ptBR });
                end = endOfWeek(currentDate, { locale: ptBR });
            } else {
                start = startOfMonth(currentDate);
                end = endOfMonth(currentDate);
            }

            const res = await fetch(`/api/planner?start=${start.toISOString()}&end=${end.toISOString()}`);
            const data = await res.json();

            if (data.success) {
                setEvents(data.data);
            }
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrevious = () => {
        if (view === 'WEEK') {
            setCurrentDate(subWeeks(currentDate, 1));
        } else {
            setCurrentDate(subMonths(currentDate, 1));
        }
    };

    const handleNext = () => {
        if (view === 'WEEK') {
            setCurrentDate(addWeeks(currentDate, 1));
        } else {
            setCurrentDate(addMonths(currentDate, 1));
        }
    };

    const handleCreateClick = () => {
        setSelectedSlot(null);
        setSelectedEvent(null);
        setPrefilledTitle('');
        setIsModalOpen(true);
    };

    const handleSlotClick = (date: Date, hour: number) => {
        const start = setMinutes(setHours(date, hour), 0);
        const end = setMinutes(setHours(date, hour + 1), 0);
        setSelectedSlot({ start, end });
        setSelectedEvent(null);
        setPrefilledTitle('');
        setIsModalOpen(true);
    };

    const handleEventClick = (event: PlannerItem) => {
        setSelectedEvent(event);
        setSelectedSlot(null);
        setIsModalOpen(true);
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'STUDY': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
            case 'PERSONAL': return 'bg-green-500/20 text-green-400 border-green-500/50';
            case 'WORK': return 'bg-purple-500/20 text-purple-400 border-purple-500/50';
            case 'MEETING': return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
            case 'LIVE': return 'bg-red-500/20 text-red-400 border-red-500/50';
            default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
        }
    };

    // --- RENDERERS ---

    const renderWeekView = () => {
        const weekStart = startOfWeek(currentDate, { locale: ptBR });
        const days = eachDayOfInterval({
            start: weekStart,
            end: endOfWeek(currentDate, { locale: ptBR })
        });

        return (
            <div className="flex flex-col h-[500px] overflow-hidden bg-trenchy-card border border-trenchy-border rounded-xl">
                {/* Header Row */}
                <div className="flex border-b border-trenchy-border">
                    <div className="w-14 border-r border-trenchy-border shrink-0"></div>
                    {days.map(day => (
                        <div key={day.toString()} className="flex-1 py-2 text-center border-r border-trenchy-border last:border-0 bg-black/20">
                            <span className="block text-[10px] font-medium text-trenchy-text-secondary uppercase">
                                {format(day, 'EEE', { locale: ptBR })}
                            </span>
                            <span className={`block text-lg font-bold ${isSameDay(day, new Date()) ? 'text-trenchy-orange' : 'text-trenchy-text-primary'}`}>
                                {format(day, 'd')}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                    {HOURS.map(hour => (
                        <div key={hour} className="flex min-h-[50px] border-b border-trenchy-border/30">
                            {/* Time Column */}
                            <div className="w-14 border-r border-trenchy-border shrink-0 py-1 pr-2 text-right text-[10px] text-trenchy-text-secondary">
                                {hour}:00
                            </div>

                            {/* Day Columns */}
                            {days.map(day => {
                                const currentHourEvents = events.filter(event => {
                                    const eventStart = new Date(event.startTime);
                                    return isSameDay(eventStart, day) && eventStart.getHours() === hour;
                                });

                                return (
                                    <div
                                        key={day.toString()}
                                        className="flex-1 border-r border-trenchy-border/30 last:border-0 relative hover:bg-white/5 cursor-pointer transition-colors group"
                                        onClick={() => handleSlotClick(day, hour)}
                                    >
                                        {/* Add Button on Hover */}
                                        <div className="hidden group-hover:flex absolute inset-0 items-center justify-center pointer-events-none">
                                            <PlusIcon className="h-4 w-4 text-trenchy-text-secondary opacity-50" />
                                        </div>

                                        {currentHourEvents.map((event, index) => {
                                            // Calculate position for overlapping events
                                            const width = 100 / currentHourEvents.length;
                                            const left = index * width;

                                            return (
                                                <div
                                                    key={event.id}
                                                    className={`absolute top-1 bottom-1 p-2 rounded-md border text-xs overflow-hidden cursor-pointer hover:brightness-110 transition z-10 ${getTypeColor(event.type)}`}
                                                    style={{
                                                        width: `${width}%`,
                                                        left: `${left}%`
                                                    }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEventClick(event);
                                                    }}
                                                >
                                                    <div className="font-bold truncate">{event.title}</div>
                                                    {event.description && <div className="truncate opacity-70">{event.description}</div>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderMonthView = () => {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        const startDate = startOfWeek(monthStart, { locale: ptBR });
        const endDate = endOfWeek(monthEnd, { locale: ptBR });

        const days = eachDayOfInterval({ start: startDate, end: endDate });
        const weeks: Date[][] = [];
        let week: Date[] = [];

        days.forEach(day => {
            week.push(day);
            if (week.length === 7) {
                weeks.push(week);
                week = [];
            }
        });

        return (
            <div className="bg-trenchy-card border border-trenchy-border rounded-xl overflow-hidden">
                {/* Header Days */}
                <div className="grid grid-cols-7 border-b border-trenchy-border">
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                        <div key={day} className="py-2 text-center text-[10px] font-medium text-trenchy-text-secondary uppercase bg-black/20">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 auto-rows-fr">
                    {days.map(day => {
                        const isCurrentMonth = isSameMonth(day, currentDate);
                        const dayEvents = events.filter(e => isSameDay(new Date(e.startTime), day));

                        return (
                            <div
                                key={day.toString()}
                                className={`min-h-[100px] p-1.5 border-b border-r border-trenchy-border/30 hover:bg-white/5 transition-colors cursor-pointer ${!isCurrentMonth ? 'bg-black/20 opacity-50' : ''
                                    }`}
                                onClick={() => handleSlotClick(day, 9)} // Default to 9am on click
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className={`text-xs font-medium ${isSameDay(day, new Date())
                                        ? 'text-white bg-trenchy-orange w-5 h-5 rounded-full flex items-center justify-center'
                                        : 'text-trenchy-text-secondary'
                                        }`}>
                                        {format(day, 'd')}
                                    </span>
                                </div>

                                <div className="space-y-1">
                                    {dayEvents.slice(0, 3).map(event => (
                                        <div
                                            key={event.id}
                                            className={`text-[10px] px-1.5 py-0.5 rounded border truncate cursor-pointer hover:brightness-110 transition ${getTypeColor(event.type)}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEventClick(event);
                                            }}
                                        >
                                            {event.title}
                                        </div>
                                    ))}
                                    {dayEvents.length > 3 && (
                                        <div className="text-[10px] text-trenchy-text-secondary pl-1">
                                            + {dayEvents.length - 3} mais
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-trenchy-card p-4 rounded-xl border border-trenchy-border">
                {/* View Switcher */}
                <div className="flex bg-black/30 rounded-lg p-1">
                    <button
                        onClick={() => setView('WEEK')}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'WEEK'
                            ? 'bg-trenchy-orange text-white shadow-lg'
                            : 'text-trenchy-text-secondary hover:text-white'
                            }`}
                    >
                        Semanal
                    </button>
                    <button
                        onClick={() => setView('MONTH')}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'MONTH'
                            ? 'bg-trenchy-orange text-white shadow-lg'
                            : 'text-trenchy-text-secondary hover:text-white'
                            }`}
                    >
                        Mensal
                    </button>
                </div>

                {/* Date Navigation */}
                <div className="flex items-center gap-4">
                    <button onClick={handlePrevious} className="p-2 hover:bg-white/10 rounded-full transition text-trenchy-text-secondary hover:text-white">
                        <ChevronLeftIcon className="h-5 w-5" />
                    </button>

                    <span className="text-lg font-bold text-trenchy-text-primary capitalize w-40 text-center">
                        {format(currentDate, view === 'WEEK' ? 'MMMM yyyy' : 'MMMM yyyy', { locale: ptBR })}
                    </span>

                    <button onClick={handleNext} className="p-2 hover:bg-white/10 rounded-full transition text-trenchy-text-secondary hover:text-white">
                        <ChevronRightIcon className="h-5 w-5" />
                    </button>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                    <div className="hidden md:flex items-center gap-3 text-xs text-trenchy-text-secondary mr-4">
                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div>Estudos</div>
                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div>Lives</div>
                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div>Pessoal</div>
                    </div>

                    <button
                        onClick={handleCreateClick}
                        className="flex items-center gap-2 bg-trenchy-orange hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-bold transition shadow-lg shadow-orange-900/20"
                    >
                        <PlusIcon className="h-5 w-5" />
                        Criar Atividade
                    </button>
                </div>
            </div>

            {/* Calendar View */}
            {view === 'WEEK' ? renderWeekView() : renderMonthView()}

            {/* Modal */}
            {isModalOpen && (
                <CreateEventModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={fetchEvents}
                    initialDate={selectedSlot?.start}
                    initialEndDate={selectedSlot?.end}
                    eventToEdit={selectedEvent}
                    initialTitle={prefilledTitle}
                />
            )}
        </div>
    );
};
