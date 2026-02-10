'use client';

import { useState, Fragment, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, TrashIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';

interface CreateEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialDate?: Date;
    initialEndDate?: Date;
    eventToEdit?: any;
    initialTitle?: string;
}

export const CreateEventModal = ({ isOpen, onClose, onSuccess, initialDate, initialEndDate, eventToEdit, initialTitle }: CreateEventModalProps) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState('STUDY');
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [loading, setLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setShowDeleteConfirm(false); // Reset on open
            if (eventToEdit) {
                // Edit Mode
                const start = new Date(eventToEdit.startTime);
                const end = new Date(eventToEdit.endTime);

                setDate(format(start, 'yyyy-MM-dd'));
                setStartTime(format(start, 'HH:mm'));
                setEndTime(format(end, 'HH:mm'));
                setTitle(eventToEdit.title);
                setDescription(eventToEdit.description || '');
                setType(eventToEdit.type);
            } else {
                // Create Mode
                const start = initialDate || new Date();
                // Default to next hour if no time selected
                if (!initialDate) {
                    start.setMinutes(0, 0, 0);
                    start.setHours(start.getHours() + 1);
                }

                const end = initialEndDate || new Date(start.getTime() + 60 * 60 * 1000); // Default 1 hour duration

                setDate(format(start, 'yyyy-MM-dd'));
                setStartTime(format(start, 'HH:mm'));
                setEndTime(format(end, 'HH:mm'));
                setTitle(initialTitle || '');
                setDescription('');
                setType('STUDY');
            }
        }
    }, [isOpen, initialDate, initialEndDate, eventToEdit]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Construct Date objects
            const startDateTime = new Date(`${date}T${startTime}:00`);
            const endDateTime = new Date(`${date}T${endTime}:00`);

            let res;
            if (eventToEdit) {
                res = await fetch(`/api/planner/${eventToEdit.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title,
                        description,
                        type,
                        startTime: startDateTime.toISOString(),
                        endTime: endDateTime.toISOString()
                    })
                });
            } else {
                res = await fetch('/api/planner', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title,
                        description,
                        type,
                        startTime: startDateTime.toISOString(),
                        endTime: endDateTime.toISOString()
                    })
                });
            }

            if (res.ok) {
                onSuccess();
                onClose();
            } else {
                alert('Erro ao salvar evento');
            }
        } catch (error) {
            console.error('Error saving event:', error);
            alert('Erro ao salvar evento');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!eventToEdit) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/planner/${eventToEdit.id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                onSuccess();
                onClose();
            } else {
                alert('Erro ao excluir evento');
            }
        } catch (error) {
            console.error('Error deleting event:', error);
            alert('Erro ao excluir evento');
        } finally {
            setIsDeleting(false);
        }
    };

    const eventTypes = [
        { id: 'STUDY', label: 'Estudos', color: 'bg-blue-500' },
        { id: 'LIVE', label: 'Lives', color: 'bg-red-500' },
        { id: 'PERSONAL', label: 'Vida Pessoal', color: 'bg-green-500' },
        { id: 'WORK', label: 'Trabalho', color: 'bg-purple-500' },
        { id: 'MEETING', label: 'Reunião', color: 'bg-orange-500' },
    ];

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-xl bg-[#0A0A0A] border border-white/10 p-5 text-left align-middle shadow-2xl transition-all">
                                {showDeleteConfirm ? (
                                    <div className="text-center space-y-4 py-4">
                                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100/10">
                                            <ExclamationTriangleIcon className="h-6 w-6 text-red-500" aria-hidden="true" />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-semibold text-white">Excluir Atividade?</h3>
                                            <p className="text-sm text-gray-400 mt-2">
                                                Tem certeza que deseja excluir esta atividade? Esta ação não pode ser desfeita.
                                            </p>
                                        </div>
                                        <div className="flex justify-center gap-3 mt-4">
                                            <button
                                                type="button"
                                                onClick={() => setShowDeleteConfirm(false)}
                                                className="px-4 py-2 text-xs font-medium text-gray-400 hover:text-white transition bg-white/5 rounded-lg hover:bg-white/10"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleDelete}
                                                disabled={isDeleting}
                                                className="px-4 py-2 text-xs font-bold text-white transition bg-red-500 hover:bg-red-600 rounded-lg shadow-lg shadow-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isDeleting ? 'Excluindo...' : 'Confirmar Exclusão'}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex justify-between items-center mb-5">
                                            <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-white flex items-center gap-2">
                                                <span>{eventToEdit ? 'Editar Atividade' : 'Nova Atividade'}</span>
                                            </Dialog.Title>
                                            <div className="flex items-center gap-2">
                                                {eventToEdit && (
                                                    <button
                                                        onClick={() => setShowDeleteConfirm(true)}
                                                        className="text-red-400 hover:text-red-300 transition p-1 hover:bg-red-500/10 rounded-full mr-2"
                                                        title="Excluir"
                                                    >
                                                        <TrashIcon className="h-5 w-5" />
                                                    </button>
                                                )}
                                                <button onClick={onClose} className="text-gray-400 hover:text-white transition rounded-full p-1 hover:bg-white/5">
                                                    <XMarkIcon className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </div>

                                        <form onSubmit={handleSubmit} className="space-y-3">
                                            {/* Type Selection */}
                                            <div>
                                                <label className="block text-xs font-medium text-gray-400 mb-2">Tipo de Atividade</label>
                                                <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                                                    {eventTypes.map((t) => (
                                                        <button
                                                            key={t.id}
                                                            type="button"
                                                            onClick={() => setType(t.id)}
                                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap border ${type === t.id
                                                                ? 'bg-trenchy-orange/10 border-trenchy-orange text-trenchy-orange'
                                                                : 'bg-white/5 border-transparent text-gray-400 hover:bg-white/10 hover:text-gray-300'
                                                                }`}
                                                        >
                                                            <div className={`w-1.5 h-1.5 rounded-full ${t.color}`}></div>
                                                            {t.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Title */}
                                            <div>
                                                <label className="block text-xs font-medium text-gray-400 mb-1.5">Título</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={title}
                                                    onChange={(e) => setTitle(e.target.value)}
                                                    placeholder="Ex: Estudar Módulo 1"
                                                    className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-trenchy-orange/50 transition placeholder:text-gray-600"
                                                />
                                            </div>

                                            {/* Date & Time */}
                                            <div className="grid grid-cols-3 gap-3">
                                                <div className="col-span-3 sm:col-span-1">
                                                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Data</label>
                                                    <input
                                                        type="date"
                                                        required
                                                        value={date}
                                                        onChange={(e) => setDate(e.target.value)}
                                                        className="w-full bg-black border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-trenchy-orange/50 transition icon-invert"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Início</label>
                                                    <input
                                                        type="time"
                                                        required
                                                        value={startTime}
                                                        onChange={(e) => setStartTime(e.target.value)}
                                                        className="w-full bg-black border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-trenchy-orange/50 transition icon-invert"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Fim</label>
                                                    <input
                                                        type="time"
                                                        required
                                                        value={endTime}
                                                        onChange={(e) => setEndTime(e.target.value)}
                                                        className="w-full bg-black border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-trenchy-orange/50 transition icon-invert"
                                                    />
                                                </div>
                                            </div>

                                            {/* Description */}
                                            <div>
                                                <label className="block text-xs font-medium text-gray-400 mb-1.5">Descrição <span className="text-gray-600">(opcional)</span></label>
                                                <textarea
                                                    value={description}
                                                    onChange={(e) => setDescription(e.target.value)}
                                                    rows={2}
                                                    className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-trenchy-orange/50 transition placeholder:text-gray-600 resize-none"
                                                />
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex justify-end gap-3 pt-2">
                                                <button
                                                    type="button"
                                                    onClick={onClose}
                                                    className="px-3 py-2 text-xs font-medium text-gray-400 hover:text-white transition"
                                                >
                                                    Cancelar
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={loading}
                                                    className="bg-trenchy-orange hover:bg-orange-600 text-white px-5 py-2 rounded-lg text-xs font-bold transition shadow-lg shadow-orange-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {loading ? 'Salvando...' : (eventToEdit ? 'Salvar' : 'Criar')}
                                                </button>
                                            </div>
                                        </form>
                                    </>
                                )}
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};
