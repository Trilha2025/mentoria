'use client';

import { useState, useTransition } from 'react';
import { Camera, Plus, Trash2, GripVertical, Loader2 } from 'lucide-react';
import { compressAndUploadImage } from '@/lib/storage';
import { addToGallery, deleteFromGallery } from './actions';
import { useRouter } from 'next/navigation';

interface GalleryImage {
    id: string;
    imageUrl: string;
    caption?: string | null;
    order: number;
}

export default function AdminGalleryManager({ images }: { images: GalleryImage[] }) {
    const [isUploading, setIsUploading] = useState(false);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const publicUrl = await compressAndUploadImage(file, 'community');
            await addToGallery(publicUrl, file.name);
            router.refresh();
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Falha no upload da imagem.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta imagem da galeria?')) return;
        
        startTransition(async () => {
            await deleteFromGallery(id);
            router.refresh();
        });
    };

    return (
        <main className="p-8 max-w-6xl mx-auto">
            <header className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-trenchy-text-primary flex items-center gap-3">
                        <Camera className="text-trenchy-orange" />
                        Galeria de Eventos
                    </h1>
                    <p className="text-trenchy-text-secondary mt-1">Gerencie as imagens de destaque da agenda.</p>
                </div>

                <label className="cursor-pointer bg-trenchy-orange hover:bg-orange-600 px-6 py-2.5 rounded-xl font-bold text-white transition-all flex items-center gap-2 shadow-lg shadow-trenchy-orange/20 active:scale-95">
                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Adicionar Foto
                    <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={isUploading} />
                </label>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {images.length === 0 ? (
                    <div className="col-span-full py-20 bg-trenchy-card border border-dashed border-trenchy-border rounded-3xl text-center">
                        <Camera className="w-12 h-12 text-trenchy-text-secondary opacity-20 mx-auto mb-4" />
                        <p className="text-trenchy-text-secondary">Nenhuma imagem na galeria ainda.</p>
                    </div>
                ) : (
                    images.map((img) => (
                        <div key={img.id} className="group relative bg-trenchy-card border border-trenchy-border rounded-2xl overflow-hidden shadow-xl hover:border-trenchy-orange/50 transition-all duration-300">
                            <div className="aspect-video overflow-hidden">
                                <img src={img.imageUrl} alt={img.caption || ''} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                            </div>
                            
                            <div className="p-4 flex items-center justify-between bg-black/40 backdrop-blur-md">
                                <span className="text-xs font-medium text-trenchy-text-secondary truncate max-w-[150px]">
                                    {img.caption || 'Sem legenda'}
                                </span>
                                <button
                                    onClick={() => handleDelete(img.id)}
                                    disabled={isPending}
                                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                    title="Excluir"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="absolute top-2 left-2 p-1.5 bg-black/60 rounded-md backdrop-blur-sm cursor-grab active:cursor-grabbing border border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <GripVertical className="w-4 h-4 text-white/50" />
                            </div>
                        </div>
                    ))
                )}
            </div>
        </main>
    );
}
