'use client';

import { useState, useEffect, useRef } from 'react';
import { PencilSquareIcon, ArrowDownTrayIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';

interface LessonNotebookProps {
    lessonId: string;
    lessonTitle: string;
}

export const LessonNotebook = ({ lessonId, lessonTitle }: LessonNotebookProps) => {
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const fetchNote = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/lessons/notes?lessonId=${lessonId}`);
                const data = await res.json();
                setContent(data.content || '');
                setLastSaved(null);
            } catch (error) {
                console.error("Erro ao carregar nota:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchNote();
    }, [lessonId]);

    const saveNote = async (newContent: string) => {
        setSaving(true);
        try {
            await fetch('/api/lessons/notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lessonId, content: newContent })
            });
            setLastSaved(new Date());
        } catch (error) {
            console.error("Erro ao salvar nota:", error);
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setContent(value);

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            saveNote(value);
        }, 1000);
    };

    const handleExportPDF = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        printWindow.document.write(`
            <html>
                <head>
                    <title>Notas: ${lessonTitle}</title>
                    <style>
                        body { font-family: sans-serif; padding: 40px; line-height: 1.6; color: #333; }
                        h1 { color: #f97316; border-bottom: 2px solid #f97316; padding-bottom: 10px; margin-bottom: 5px; }
                        .date { color: #888; font-size: 0.8em; margin-bottom: 30px; }
                        .content { white-space: pre-wrap; font-size: 1.1em; }
                    </style>
                </head>
                <body>
                    <h1>Anotações da Aula: ${lessonTitle}</h1>
                    <div class="date">Exportado em: ${new Date().toLocaleString('pt-BR')}</div>
                    <div class="content">${content || 'Nenhuma anotação disponível.'}</div>
                </body>
            </html>
        `);
        printWindow.document.close();

        // Wait for content to load then print
        printWindow.onload = () => {
            printWindow.print();
        };
    };

    return (
        <div className="bg-trenchy-card rounded-2xl border border-trenchy-border overflow-hidden flex flex-col h-full shadow-lg transition-all">
            <div className="p-4 border-b border-trenchy-border flex items-center justify-between bg-black/10 dark:bg-white/5">
                <div className="flex items-center gap-2">
                    <PencilSquareIcon className="h-5 w-5 text-trenchy-orange" />
                    <h3 className="font-bold text-sm text-trenchy-text-primary uppercase tracking-wider">Meu Caderno</h3>
                </div>
                <div className="flex items-center gap-3">
                    {saving ? (
                        <div className="flex items-center gap-1 text-[10px] text-trenchy-text-secondary animate-pulse">
                            <CloudArrowUpIcon className="h-3 w-3" />
                            Salvando...
                        </div>
                    ) : lastSaved && (
                        <div className="text-[10px] text-trenchy-text-secondary">
                            Salvo às {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    )}
                    <button
                        onClick={handleExportPDF}
                        className="p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-colors text-trenchy-text-secondary hover:text-trenchy-orange"
                        title="Exportar como PDF"
                    >
                        <ArrowDownTrayIcon className="h-5 w-5" />
                    </button>
                </div>
            </div>
            <div className="relative flex-1">
                {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-trenchy-card/50 backdrop-blur-sm">
                        <div className="flex flex-col items-center gap-3">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-trenchy-orange"></div>
                            <p className="text-xs text-trenchy-text-secondary font-medium">Carregando...</p>
                        </div>
                    </div>
                ) : null}
                <textarea
                    value={content}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="Comece a anotar aqui seu aprendizado desta aula..."
                    className="flex-1 w-full h-full p-5 bg-transparent text-trenchy-text-primary text-sm resize-none focus:outline-none min-h-[400px] lg:min-h-0 leading-relaxed placeholder:text-trenchy-text-secondary/30 disabled:opacity-50"
                />
            </div>
            <div className="p-3 bg-black/10 dark:bg-white/5 border-t border-trenchy-border text-[10px] text-trenchy-text-secondary text-right italic font-medium">
                Suas notas são salvas automaticamente enquanto você escreve.
            </div>
        </div>
    );
};
