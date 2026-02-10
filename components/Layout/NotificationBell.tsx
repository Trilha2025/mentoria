'use client';

import { useState, useEffect, useRef } from 'react';
import { BellIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

interface Notification {
    id: string;
    title: string;
    message: string;
    read: boolean;
    type: string;
    link?: string;
    createdAt: string;
}

export const NotificationBell = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/notifications');
            const data = await res.json();
            if (data.success) {
                setNotifications(data.notifications);
                setUnreadCount(data.unreadCount);
            }
        } catch (error) {
            console.error("Erro ao buscar notificações:", error);
        }
    };

    // Polling a cada 30s ou apenas no mount
    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    // Fechar dropdown ao clicar fora
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);


    const handleMarkAsRead = async (ids: string[]) => {
        await fetch('/api/notifications', {
            method: 'PATCH',
            body: JSON.stringify({ notificationIds: ids })
        });

        // Atualiza estado local
        setNotifications(prev => prev.map(n => ids.includes(n.id) ? { ...n, read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - ids.length));
    };

    const handleNotificationClick = async (notif: Notification) => {
        if (!notif.read) {
            handleMarkAsRead([notif.id]);
        }
        setIsOpen(false);
        if (notif.link) {
            router.push(notif.link);
        }
    };

    const handleMarkAllRead = async () => {
        const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
        if (unreadIds.length > 0) {
            await handleMarkAsRead(unreadIds);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation(); // Prevent triggering click on notification

        try {
            await fetch(`/api/notifications?id=${id}`, {
                method: 'DELETE'
            });

            setNotifications(prev => prev.filter(n => n.id !== id));
            // Recalculate unread count if needed (though usually we delete read/unread)
            // If the deleted one was unread, decrement count
            const deletedNotif = notifications.find(n => n.id === id);
            if (deletedNotif && !deletedNotif.read) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error("Error deleting notification:", error);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-trenchy-text-secondary hover:text-trenchy-text-primary transition rounded-full hover:bg-black/5 dark:hover:bg-white/5 relative"
            >
                <BellIcon className="h-6 w-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 h-3 w-3 bg-trenchy-orange rounded-full border-2 border-background animate-pulse"></span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-trenchy-card border border-trenchy-border rounded-xl shadow-2xl z-50 overflow-hidden transform origin-top-right transition-all">
                    <div className="p-4 border-b border-trenchy-border flex justify-between items-center bg-black/5 dark:bg-white/5">
                        <h3 className="font-bold text-sm text-trenchy-text-primary">Notificações</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="text-xs text-trenchy-orange hover:text-orange-400 font-bold uppercase"
                            >
                                Marcar todas
                            </button>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-trenchy-text-secondary text-sm">
                                Nenhuma notificação recente.
                            </div>
                        ) : (
                            <ul className="divide-y divide-trenchy-border">
                                {notifications.map((notif) => (
                                    <li
                                        key={notif.id}
                                        onClick={() => handleNotificationClick(notif)}
                                        className={`p-4 hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer flex gap-3 group relative ${!notif.read ? 'bg-orange-50/5 dark:bg-orange-900/10' : ''}`}
                                    >
                                        <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${!notif.read ? 'bg-trenchy-orange' : 'bg-transparent'}`}></div>
                                        <div className="flex-1 pr-6">
                                            <p className={`text-sm ${!notif.read ? 'font-bold text-trenchy-text-primary' : 'text-trenchy-text-secondary'}`}>
                                                {notif.title}
                                            </p>
                                            <p className="text-xs text-trenchy-text-secondary mt-1 line-clamp-2">
                                                {notif.message}
                                            </p>
                                            <p className="text-[10px] text-gray-400 mt-2 uppercase tracking-wide">
                                                {new Date(notif.createdAt).toLocaleDateString()} às {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                        <button
                                            onClick={(e) => handleDelete(e, notif.id)}
                                            className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-black/10 dark:hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Excluir notificação"
                                        >
                                            <XMarkIcon className="h-4 w-4" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
