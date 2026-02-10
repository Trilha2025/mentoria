'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircleIcon, XCircleIcon, ArrowPathIcon } from '@heroicons/react/24/solid';

export const TaskUpload = ({ moduleId, userId, lessonId }: { moduleId: string; userId: string; lessonId?: string }) => {
    const [uploading, setUploading] = useState(false);
    const [status, setStatus] = useState<'IDLE' | 'PENDING' | 'APPROVED' | 'ADJUST_REQUIRED' | 'COMPLETED'>('IDLE');
    const [feedback, setFeedback] = useState<string | null>(null);
    const [existingFileUrl, setExistingFileUrl] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [linkUrl, setLinkUrl] = useState('');
    const [file, setFile] = useState<File | null>(null);

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const url = new URL('/api/submissions/check', window.location.origin);
                url.searchParams.set('userId', userId);
                url.searchParams.set('moduleId', moduleId);
                if (lessonId) url.searchParams.set('lessonId', lessonId);

                const res = await fetch(url.toString());
                const data = await res.json();
                if (data.found) {
                    setStatus(data.status);
                    setFeedback(data.feedback);
                    setExistingFileUrl(data.fileUrl);
                } else {
                    setStatus('IDLE');
                    setFeedback(null);
                    setExistingFileUrl(null);
                }
            } catch (error) {
                console.error("Erro ao verificar status:", error);
            }
        };
        checkStatus();
    }, [userId, moduleId, lessonId]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setLinkUrl(''); // Clear link if file selected
            setMessage(null);
        }
    };


    const handleUpload = async () => {
        if (!file && !linkUrl) return;

        setUploading(true);
        setMessage(null);

        let submissionUrl = linkUrl;

        // 1. Upload File if present
        if (file) {
            // Sanitizar o nome do arquivo
            const sanitizeFileName = (name: string) => {
                // Remove acentos
                const normalized = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                // Remove caracteres especiais e substitui espaços por underscores
                const sanitized = normalized.replace(/[^a-zA-Z0-9._-]/g, '_');
                return sanitized;
            };

            const sanitizedFileName = sanitizeFileName(file.name);
            const pathPrefix = lessonId ? `${moduleId}/${lessonId}` : moduleId;
            const fileName = `${userId}/${pathPrefix}/${sanitizedFileName}`;

            const { data, error } = await supabase.storage
                .from('mentoria-files')
                .upload(fileName, file, { upsert: true });

            if (error) {
                if (error.message.includes("Bucket not found")) {
                    alert("ERRO DE CONFIGURAÇÃO: O Bucket 'mentoria-files' não existe.\n\nAvise o administrador.");
                } else {
                    setMessage(`Erro no upload: ${error.message}`);
                }
                setUploading(false);
                return;
            }

            if (data) {
                const { data: publicUrlData } = supabase.storage.from('mentoria-files').getPublicUrl(fileName);
                submissionUrl = publicUrlData.publicUrl;
            }
        }


        // 2. Register Submission
        try {
            const response = await fetch('/api/submissions/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    moduleId,
                    lessonId,
                    fileUrl: submissionUrl
                })
            });

            const result = await response.json();

            if (result.success) {
                setStatus('PENDING');
                setFeedback(null);
                setExistingFileUrl(submissionUrl);
                setMessage('Tarefa enviada com sucesso!');
                setFile(null);
                setLinkUrl('');
            } else {
                console.error(result.error);
                setMessage('Erro ao registrar envio. Tente novamente.');
            }
        } catch (err) {
            console.error(err);
            setMessage('Erro de conexão ao salvar submissão.');
        }
        setUploading(false);
    };

    return (
        <div className={`mt-6 p-6 rounded-xl border transition-all ${status === 'APPROVED' ? 'bg-green-100 dark:bg-green-900/10 border-green-500/30' :
            status === 'ADJUST_REQUIRED' ? 'bg-red-100 dark:bg-red-900/10 border-red-500/30' :
                'bg-black/5 dark:bg-black/20 border-trenchy-border'
            }`}>
            <h4 className={`font-bold mb-4 flex items-center ${status === 'APPROVED' ? 'text-green-600 dark:text-green-400' :
                status === 'ADJUST_REQUIRED' ? 'text-red-500 dark:text-red-400' :
                    'text-trenchy-text-primary'
                }`}>
                {status === 'APPROVED' ? (
                    <><CheckCircleIcon className="h-6 w-6 mr-2" /> Tarefa Aprovada!</>
                ) : status === 'ADJUST_REQUIRED' ? (
                    <><XCircleIcon className="h-6 w-6 mr-2" /> Ajuste Solicitado</>
                ) : status === 'PENDING' ? (
                    <><ArrowPathIcon className="h-6 w-6 mr-2 animate-spin text-trenchy-orange" /> Em Análise</>
                ) : (
                    "Entrega Prática"
                )}
            </h4>

            {/* Feedback Message */}
            {feedback && (
                <div className={`text-sm mb-6 p-4 rounded-lg border ${status === 'APPROVED' ? 'bg-green-50 dark:bg-green-900/20 border-green-500/30 text-green-700 dark:text-green-200' :
                    'bg-red-50 dark:bg-red-900/20 border-red-500/30 text-red-700 dark:text-red-200'
                    }`}>
                    <strong className="block mb-2 opacity-80 uppercase text-xs tracking-wider">Feedback do Mentor</strong>
                    <p className="whitespace-pre-wrap leading-relaxed">{feedback}</p>
                </div>
            )}

            {/* Content Text */}
            {status === 'IDLE' && (
                <p className="text-sm text-trenchy-text-secondary mb-4">
                    Suba seu arquivo ou cole um link para que o mentor possa validar sua evolução.
                </p>
            )}

            {/* Upload Area */}
            {(status === 'IDLE' || status === 'ADJUST_REQUIRED') && (
                <div className="space-y-4">
                    {status === 'ADJUST_REQUIRED' && (
                        <div className="bg-red-50 dark:bg-red-900/10 border border-red-500/30 rounded-lg p-4 mb-4">
                            <p className="text-xs text-red-500 dark:text-red-400 font-semibold uppercase tracking-wide mb-2">
                                ⚠️ Envie uma nova versão corrigida
                            </p>
                            {existingFileUrl && (
                                <a
                                    href={existingFileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-red-600 dark:text-red-400 hover:text-red-500 underline underline-offset-2 flex items-center gap-1"
                                >
                                    📎 Ver arquivo anterior enviado →
                                </a>
                            )}
                        </div>
                    )}

                    <div className="space-y-3">
                        <input
                            type="file"
                            onChange={handleFileChange}
                            disabled={uploading || !!linkUrl}
                            className="block w-full text-sm text-trenchy-text-secondary
                                file:mr-4 file:py-2.5 file:px-4
                                file:rounded-lg file:border-0
                                file:text-xs file:font-bold file:uppercase file:tracking-wide
                                file:bg-trenchy-orange file:text-white
                                hover:file:bg-orange-600
                                file:transition-colors
                                cursor-pointer"
                        />

                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-gray-500 sm:text-sm">🔗</span>
                            </div>
                            <input
                                type="text"
                                placeholder="Ou cole um link (Google Drive, Notion...)"
                                value={linkUrl}
                                onChange={(e) => {
                                    setLinkUrl(e.target.value);
                                    setFile(null);
                                }}
                                disabled={uploading || !!file}
                                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-black/30 border border-trenchy-border rounded-lg text-sm text-trenchy-text-primary placeholder-gray-500 focus:outline-none focus:border-trenchy-orange focus:ring-1 focus:ring-trenchy-orange transition-all"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleUpload}
                        disabled={uploading || (!file && !linkUrl)}
                        className={`w-full py-3 px-4 rounded-xl font-bold text-sm tracking-wide uppercase transition-all shadow-lg ${uploading || (!file && !linkUrl)
                            ? 'bg-black/5 dark:bg-white/5 cursor-not-allowed text-gray-400'
                            : 'bg-trenchy-orange hover:bg-orange-600 text-white shadow-orange-900/20 hover:shadow-orange-900/40 hover:-translate-y-0.5'
                            }`}
                    >
                        {uploading ? 'Enviando...' : 'Enviar Tarefa'}
                    </button>

                    {message && (
                        <p className={`text-xs text-center mt-2 ${message.includes('sucesso') ? 'text-green-500' : 'text-red-500'}`}>
                            {message}
                        </p>
                    )}
                </div>
            )}

            {status === 'PENDING' && (
                <div className="text-sm text-trenchy-text-secondary bg-black/5 dark:bg-black/20 p-4 rounded-xl border border-trenchy-border flex flex-col gap-2">
                    <p>Seu envio foi recebido. Aguarde a validação.</p>
                    {existingFileUrl && (
                        <a href={existingFileUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-trenchy-orange hover:text-trenchy-text-primary transition flex items-center gap-1">
                            VER ARQUIVO ENVIADO &rarr;
                        </a>
                    )}
                </div>
            )}

            {status === 'APPROVED' && existingFileUrl && (
                <div className="mt-4 text-center">
                    <a href={existingFileUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-green-600 dark:text-green-400 hover:text-green-500 transition underline underline-offset-4">
                        Ver arquivo aprovado
                    </a>
                </div>
            )}
        </div>
    );
};
