'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { DocumentArrowDownIcon, FolderIcon } from '@heroicons/react/24/outline';

interface Material {
    lessonId: string;
    lessonTitle: string;
    materialUrl: string;
    moduleTitle: string;
}

export default function MaterialsPage() {
    const [materials, setMaterials] = useState<Material[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMaterials = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Buscar módulos liberados/completos
            const { data: accessData } = await supabase
                .from('UserModuleAccess')
                .select('moduleId')
                .eq('userId', user.id)
                .in('status', ['UNLOCKED', 'COMPLETED']);

            const unlockedModuleIds = accessData?.map(a => a.moduleId) || [];

            if (unlockedModuleIds.length === 0) {
                setLoading(false);
                return;
            }

            // 2. Buscar aulas desses módulos que tenham material
            const { data: lessons } = await supabase
                .from('Lesson')
                .select(`
                    id,
                    title,
                    materialUrl,
                    moduleId,
                    Module (
                        title,
                        order
                    )
                `)
                .in('moduleId', unlockedModuleIds)
                .not('materialUrl', 'is', null)
                .neq('materialUrl', ''); // Garante que não é string vazia

            if (lessons) {
                // Formatar dados
                // @ts-ignore
                const formatted = lessons.map(lesson => ({
                    lessonId: lesson.id,
                    lessonTitle: lesson.title,
                    materialUrl: lesson.materialUrl,
                    // @ts-ignore
                    moduleTitle: Array.isArray(lesson.Module) ? lesson.Module[0]?.title : lesson.Module?.title || 'Módulo Geral'
                }));
                setMaterials(formatted);
            }
            setLoading(false);
        };

        fetchMaterials();
    }, []);

    return (
        <main className="max-w-7xl mx-auto p-6 md:p-8 w-full">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-trenchy-text-primary tracking-tight">Materiais de Apoio</h1>
                <p className="text-trenchy-text-secondary mt-2">Todos os arquivos das suas aulas liberadas, reunidos em um só lugar.</p>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-trenchy-orange"></div>
                </div>
            ) : materials.length === 0 ? (
                <div className="text-center py-20 bg-trenchy-card rounded-2xl border border-trenchy-border shadow-sm">
                    <FolderIcon className="h-12 w-12 mx-auto text-gray-400 mb-4 opacity-50" />
                    <p className="text-trenchy-text-secondary">Nenhum material disponível no momento.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {materials.map((item) => (
                        <div key={item.lessonId} className="bg-trenchy-card p-5 rounded-xl border border-trenchy-border flex items-center justify-between hover:border-trenchy-orange/30 transition-all shadow-lg hover:shadow-orange-900/5 group">
                            <div>
                                <div className="text-xs font-bold text-trenchy-orange uppercase tracking-wider mb-1">
                                    {item.moduleTitle}
                                </div>
                                <h3 className="font-bold text-trenchy-text-primary group-hover:text-trenchy-orange transition-colors">
                                    {item.lessonTitle}
                                </h3>
                            </div>

                            <a
                                href={item.materialUrl}
                                target="_blank"
                                download
                                className="flex items-center gap-2 px-4 py-2 bg-black/5 dark:bg-white/5 text-sm font-medium text-trenchy-text-primary rounded-lg hover:bg-trenchy-orange hover:text-white transition border border-trenchy-border"
                            >
                                <DocumentArrowDownIcon className="h-5 w-5" />
                                Baixar
                            </a>
                        </div>
                    ))}
                </div>
            )}
        </main>
    );
}
