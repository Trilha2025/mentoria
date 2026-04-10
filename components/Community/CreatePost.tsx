'use client';

import { useState, useTransition, useEffect } from 'react';
import { Image as ImageIcon, Loader2, Send, X } from 'lucide-react';
import { compressAndUploadImage } from '@/lib/storage';
import { createPost } from '@/app/community/actions/posts';
import { useRouter } from 'next/navigation';

interface CreatePostProps {
    spaceId: string;
    spaceName: string;
    isOpen: boolean;
    onClose: () => void;
}

export function CreatePost({ spaceId, spaceName, isOpen, onClose }: CreatePostProps) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [mediaUrls, setMediaUrls] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    // Prevent scrolling when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
            // Reset fields on close
            setTitle('');
            setContent('');
            setMediaUrls([]);
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        if (mediaUrls.length >= 5) {
            alert('Máximo de 5 imagens por postagem.');
            return;
        }

        setIsUploading(true);
        try {
            const file = files[0];
            const url = await compressAndUploadImage(file, 'community');
            setMediaUrls(prev => [...prev, url]);
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Falha ao carregar imagem.');
        } finally {
            setIsUploading(false);
        }
    };

    const removeImage = (index: number) => {
        setMediaUrls(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !content) return;

        startTransition(async () => {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('content', content);
            formData.append('spaceId', spaceId);
            mediaUrls.forEach(url => formData.append('mediaUrls', url));
            
            await createPost(formData);
            
            onClose();
            router.refresh();
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-2xl bg-[#1e292d] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                <div className="flex items-center justify-between p-6 border-b border-white/5">
                    <div>
                        <h2 className="text-xl font-bold text-white">Nova publicação</h2>
                        <p className="text-xs text-trenchy-text-secondary uppercase tracking-widest mt-1 font-semibold">
                            Postando em: <span className="text-trenchy-orange">{spaceName}</span>
                        </p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 text-trenchy-text-secondary hover:text-white transition-colors bg-white/5 rounded-full"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <input
                        type="text"
                        placeholder="Título da sua publicação"
                        className="w-full bg-transparent text-2xl font-bold text-white placeholder:text-white/20 outline-none"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        autoFocus
                    />
                    
                    <textarea
                        placeholder="Compartilhe seu conhecimento, dúvida ou resultado..."
                        className="w-full bg-transparent text-trenchy-text-secondary placeholder:text-white/20 outline-none min-h-[180px] resize-none leading-relaxed text-lg"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                    />

                    {/* Image Previews */}
                    {mediaUrls.length > 0 && (
                        <div className="flex flex-wrap gap-3 py-2">
                            {mediaUrls.map((url, i) => (
                                <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-white/10 group shadow-lg">
                                    <img src={url} alt="Preview" className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(i)}
                                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                            {isUploading && (
                                <div className="w-24 h-24 rounded-xl bg-black/40 flex items-center justify-center border border-dashed border-white/20">
                                    <Loader2 className="w-6 h-6 animate-spin text-trenchy-orange" />
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex items-center justify-between pt-6 border-t border-white/5">
                        <div className="flex items-center gap-2">
                            <label className="cursor-pointer p-3 hover:bg-white/5 rounded-xl text-trenchy-text-secondary hover:text-trenchy-orange transition-all active:scale-90 flex items-center gap-2" title="Adicionar Imagem">
                                <ImageIcon className="w-5 h-5" />
                                <span className="text-sm font-medium">Mídia</span>
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading || mediaUrls.length >= 5} />
                            </label>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-2.5 rounded-xl font-bold text-trenchy-text-secondary hover:text-white transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={isPending || !title.trim() || !content.trim() || isUploading}
                                className="bg-trenchy-orange hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed px-8 py-2.5 rounded-xl font-bold text-white transition-all flex items-center gap-2 transform active:scale-95 shadow-xl shadow-trenchy-orange/20"
                            >
                                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                Publicar Agora
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
