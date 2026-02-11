'use client';

import { useState, useEffect, useRef } from 'react';
import { XMarkIcon, PaperAirplaneIcon, PaperClipIcon } from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase';

interface ChatDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    ticketId?: string; // If existing ticket
    userId: string;
    role: 'MENTEE' | 'MENTOR';
}

export const ChatDrawer = ({ isOpen, onClose, ticketId, userId, role }: ChatDrawerProps) => {
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [currentTicketId, setCurrentTicketId] = useState(ticketId);
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Sync state with prop
    useEffect(() => {
        setCurrentTicketId(ticketId);
    }, [ticketId]);

    // Fetch messages when drawer opens or ticket changes
    useEffect(() => {
        if (isOpen) {
            if (currentTicketId) {
                fetchMessages(currentTicketId);
            } else {
                findOpenTicket();
            }
        }
    }, [isOpen, currentTicketId]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
        }
    }, [newMessage]);

    // Auto-refresh messages every 3 seconds when chat is open
    useEffect(() => {
        if (!isOpen || !currentTicketId) return;

        const interval = setInterval(() => {
            fetchMessages(currentTicketId);
        }, 3000); // Poll every 3 seconds

        return () => clearInterval(interval);
    }, [isOpen, currentTicketId]);

    const findOpenTicket = async () => {
        const res = await fetch('/api/tickets');
        const data = await res.json();
        if (data.tickets && data.tickets.length > 0) {
            // Use the most recent ticket regardless of status (Single Thread per User)
            const existingTicket = data.tickets[0];
            setCurrentTicketId(existingTicket.id);
            fetchMessages(existingTicket.id);
        } else {
            setCurrentTicketId(undefined);
            setMessages([]);
        }
    };

    const fetchMessages = async (id: string) => {
        const res = await fetch(`/api/tickets/${id}/messages`);
        const data = await res.json();
        if (data.success) {
            setMessages(data.messages);
            scrollToBottom();
        }
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSendMessage = async () => {
        if ((!newMessage.trim() && !file) || sending || uploading) return;
        setSending(true);

        try {
            let activeTicketId = currentTicketId;
            let fileUrl = null;

            // 1. Upload File if exists
            if (file) {
                setUploading(true);
                const fileName = `support/${userId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
                const { data, error } = await supabase.storage
                    .from('mentoria-files')
                    .upload(fileName, file);

                if (error) {
                    console.error('Error uploading:', error);
                    alert('Erro ao enviar arquivo: ' + error.message);
                    setUploading(false);
                    setSending(false);
                    return;
                }

                if (data) {
                    const { data: publicUrlData } = supabase.storage.from('mentoria-files').getPublicUrl(fileName);
                    fileUrl = publicUrlData.publicUrl;
                }
                setUploading(false);
            }

            // 1.5. Check if ticket exists (if somehow activeTicketId is null but user has tickets)
            if (!activeTicketId) {
                const res = await fetch('/api/tickets');
                const data = await res.json();
                if (data.tickets && data.tickets.length > 0) {
                    activeTicketId = data.tickets[0].id;
                    setCurrentTicketId(activeTicketId);
                }
            }

            // 2. Create Ticket ONLY if absolutely NO ticket exists
            if (!activeTicketId) {
                const res = await fetch('/api/tickets', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        subject: 'Suporte Mentoria',
                        initialMessage: newMessage || (file ? 'Enviou um anexo.' : 'Olá')
                    })
                });
                const data = await res.json();
                console.log('Create ticket response:', data);

                if (data.success) {
                    activeTicketId = data.ticket.id;
                    setCurrentTicketId(activeTicketId);

                    if (fileUrl) {
                        await fetch(`/api/tickets/${activeTicketId}/messages`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ content: '📎 Anexo enviado.', attachmentUrl: fileUrl })
                        });
                    }

                    if (activeTicketId) await fetchMessages(activeTicketId);
                    setNewMessage('');
                    setFile(null);
                    setSending(false);
                    return;
                } else {
                    console.error('Failed to create ticket:', data.error);
                    alert('Erro ao criar chamado: ' + (data.error || 'Erro desconhecido'));
                    setSending(false);
                    return;
                }
            }

            // 3. Send Message to existing ticket
            if (activeTicketId) {
                console.log('Sending message to ticket:', activeTicketId);
                const res = await fetch(`/api/tickets/${activeTicketId}/messages`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        content: newMessage,
                        attachmentUrl: fileUrl
                    })
                });

                const data = await res.json();
                console.log('Send message response:', data);

                if (data.success) {
                    setMessages(prev => [...prev, data.message]);
                    setNewMessage('');
                    setFile(null);
                    scrollToBottom();
                } else {
                    console.error('Failed to send message:', data.error);
                    alert('Erro ao enviar mensagem: ' + (data.error || 'Erro desconhecido'));
                }
            }

        } catch (error) {
            console.error('Error sending message:', error);
            alert('Erro de conexão ao enviar mensagem.');
        } finally {
            setSending(false);
            setUploading(false);
            if (textareaRef.current) textareaRef.current.focus();
        }
    };

    const handleCloseTicket = async () => {
        if (!currentTicketId || role === 'MENTEE') return;

        const confirmed = confirm('Deseja realmente encerrar este chamado?');
        if (!confirmed) return;

        try {
            const res = await fetch(`/api/tickets/${currentTicketId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: 'RESOLVED' })
            });

            const data = await res.json();
            if (data.success) {
                alert('Chamado encerrado com sucesso!');
                onClose(); // Close the drawer
            } else {
                alert('Erro ao encerrar chamado: ' + (data.error || 'Erro desconhecido'));
            }
        } catch (error) {
            console.error('Error closing ticket:', error);
            alert('Erro ao encerrar chamado.');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className={`fixed inset-y-0 right-0 w-full sm:w-96 bg-trenchy-card shadow-2xl transform transition-transform duration-300 z-50 border-l border-trenchy-border flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>

            {/* Header */}
            <div className="p-4 border-b border-trenchy-border flex justify-between items-center bg-black/10">
                <h2 className="text-lg font-bold text-trenchy-text-primary">Fale com o Mentor 💬</h2>
                <div className="flex items-center gap-2">
                    {role !== 'MENTEE' && currentTicketId && (
                        <button
                            onClick={handleCloseTicket}
                            className="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-medium"
                            title="Encerrar este chamado"
                        >
                            Encerrar
                        </button>
                    )}
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-trenchy-text-secondary">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="text-center text-trenchy-text-secondary mt-10">
                        <p>Olá! Como posso ajudar hoje?</p>
                        <p className="text-xs mt-2">Envie sua dúvida abaixo.</p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div key={msg.id} className={`flex flex-col ${msg.senderId === userId ? 'items-end' : 'items-start'}`}>
                            <div className={`max-w-[85%] p-3 rounded-xl text-sm break-words whitespace-pre-wrap ${msg.senderId === userId
                                ? 'bg-trenchy-orange text-white rounded-tr-none'
                                : 'bg-black/20 text-trenchy-text-primary rounded-tl-none border border-trenchy-border'
                                }`}>
                                {msg.content}
                                {msg.attachmentUrl && (
                                    <a href={msg.attachmentUrl} target="_blank" rel="noopener noreferrer" className="block mt-2 text-xs underline opacity-80 hover:opacity-100">
                                        📎 Ver anexo
                                    </a>
                                )}
                            </div>
                            <span className="text-[10px] text-gray-500 mt-1">
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-trenchy-border bg-black/10">
                {file && (
                    <div className="mb-2 px-3 py-1 bg-trenchy-orange/10 border border-trenchy-orange/30 rounded-lg flex justify-between items-center text-xs">
                        <span className="truncate text-trenchy-text-primary max-w-[200px]">📎 {file.name}</span>
                        <button onClick={() => setFile(null)} className="text-trenchy-text-secondary hover:text-red-500">
                            <XMarkIcon className="h-4 w-4" />
                        </button>
                    </div>
                )}

                <div className="flex gap-2 items-end">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 mb-1 text-trenchy-text-secondary hover:text-trenchy-text-primary transition hover:bg-white/5 rounded-lg"
                        title="Anexar arquivo"
                    >
                        <PaperClipIcon className="h-5 w-5" />
                    </button>
                    <textarea
                        ref={textareaRef}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Digite sua mensagem..."
                        rows={1}
                        className="flex-1 bg-black/20 border border-trenchy-border rounded-lg px-3 py-2 text-sm text-trenchy-text-primary focus:outline-none focus:border-trenchy-orange resize-none min-h-[40px] max-h-[120px]"
                        style={{ height: 'auto', minHeight: '40px' }}
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={sending || (!newMessage.trim() && !file)}
                        className="p-2 mb-1 bg-trenchy-orange text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 transition shadow-lg shadow-orange-900/20"
                    >
                        {sending ? <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <PaperAirplaneIcon className="h-5 w-5" />}
                    </button>
                </div>
            </div>

        </div>
    );
};
