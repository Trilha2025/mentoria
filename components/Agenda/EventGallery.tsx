'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Camera } from 'lucide-react';

interface GalleryImage {
    id: string;
    imageUrl: string;
    caption?: string | null;
}

interface EventGalleryProps {
    images: GalleryImage[];
}

export function EventGallery({ images }: EventGalleryProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (images.length === 0) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % images.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [images.length]);

    if (images.length === 0) return null;

    const next = () => setCurrentIndex((prev) => (prev + 1) % images.length);
    const prev = () => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);

    return (
        <div className="relative w-full h-[400px] rounded-3xl overflow-hidden mb-12 shadow-2xl shadow-black/40 group border border-white/5">
            {/* Background Blur */}
            <div className="absolute inset-0">
                <AnimatePresence mode="wait">
                    <motion.img
                        key={`bg-${images[currentIndex].id}`}
                        src={images[currentIndex].imageUrl}
                        className="w-full h-full object-cover blur-2xl opacity-30 transform scale-110"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.3 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1 }}
                    />
                </AnimatePresence>
            </div>

            {/* Content */}
            <div className="absolute inset-0 flex items-center justify-center p-8 md:p-12">
                <div className="relative w-full h-full flex flex-col md:flex-row items-center gap-8">
                    {/* Main Image */}
                    <div className="relative w-full md:w-2/3 h-full rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                        <AnimatePresence mode="wait">
                            <motion.img
                                key={images[currentIndex].id}
                                src={images[currentIndex].imageUrl}
                                className="w-full h-full object-cover"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                            />
                        </AnimatePresence>

                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        
                        <div className="absolute bottom-0 left-0 p-6 w-full">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="bg-trenchy-orange px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-widest">Destaque</span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-1">
                                {images[currentIndex].caption || "Nossos Momentos"}
                            </h3>
                        </div>
                    </div>

                    {/* Info & Navigation */}
                    <div className="flex-1 text-center md:text-left space-y-6">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 backdrop-blur-md">
                            <Camera className="w-4 h-4 text-trenchy-orange" />
                            <span className="text-xs font-bold text-trenchy-text-primary uppercase tracking-widest">Galeria de Eventos</span>
                        </div>
                        
                        <h2 className="text-3xl md:text-4xl font-extrabold text-trenchy-text-primary leading-tight">
                            Recordações da nossa <span className="text-trenchy-orange">Jornada</span>
                        </h2>
                        
                        <p className="text-trenchy-text-secondary text-sm md:text-base max-w-md">
                            Confira os momentos marcantes dos nossos webinários e encontros presenciais. Autoridade e histórico que constroem o futuro do E-commerce.
                        </p>

                        <div className="flex items-center justify-center md:justify-start gap-4">
                            <button 
                                onClick={prev}
                                className="p-3 bg-white/5 hover:bg-trenchy-orange/20 border border-white/10 rounded-full text-trenchy-text-primary transition-all hover:scale-110 active:scale-95"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <div className="flex gap-2">
                                {images.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentIndex(i)}
                                        className={`h-1.5 transition-all duration-300 rounded-full ${i === currentIndex ? 'w-8 bg-trenchy-orange' : 'w-2 bg-white/20'}`}
                                    />
                                ))}
                            </div>
                            <button 
                                onClick={next}
                                className="p-3 bg-white/5 hover:bg-trenchy-orange/20 border border-white/10 rounded-full text-trenchy-text-primary transition-all hover:scale-110 active:scale-95"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
