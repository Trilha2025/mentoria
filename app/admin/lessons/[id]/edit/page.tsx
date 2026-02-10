'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';

interface Module {
    id: string;
    title: string;
}

export default function EditLessonPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;

    const [moduleId, setModuleId] = useState('');
    const [title, setTitle] = useState('');
    const [videoUrl, setVideoUrl] = useState('');
    const [content, setContent] = useState('');
    const [tasks, setTasks] = useState('');
    const [materialUrl, setMaterialUrl] = useState(''); // Estado para URL atual
    const [hasAssignment, setHasAssignment] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [modules, setModules] = useState<Module[]>([]);

    // Upload State
    const [materialFile, setMaterialFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            if (!id) return;

            // 1. Fetch Modules for Select
            const { data: modulesData } = await supabase
                .from('Module')
                .select('id, title')
                .order('order', { ascending: true });
            setModules(modulesData || []);

            // 2. Fetch Lesson Data
            const { data: lesson, error } = await supabase
                .from('Lesson')
                .select('*')
                .eq('id', id)
                .maybeSingle();

            if (error) {
                alert("Erro ao carregar aula: " + error.message);
                router.push('/admin/lessons');
            } else if (lesson) {
                setModuleId(lesson.moduleId);
                setTitle(lesson.title);
                setVideoUrl(lesson.videoUrl || '');
                setContent(lesson.content || '');
                setTasks(lesson.tasks || '');
                setMaterialUrl(lesson.materialUrl || '');
                setHasAssignment(!!(lesson.tasks || lesson.materialUrl));
                setLoading(false);
            } else {
                alert("Aula não encontrada.");
                router.push('/admin/lessons');
            }
        };

        loadData();
    }, [id, router]);

    const handleUpdateLesson = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        let finalMaterialUrl = materialUrl;

        // 1. Upload do Arquivo se existir novo
        if (materialFile) {
            setUploading(true);
            try {
                const fileExt = materialFile.name.split('.').pop();
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
                const filePath = `${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('class-materials')
                    .upload(filePath, materialFile);

                if (uploadError) {
                    throw uploadError;
                }

                // Get Public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('class-materials')
                    .getPublicUrl(filePath);

                finalMaterialUrl = publicUrl;
            } catch (error: any) {
                if (error.message.includes("Bucket not found")) {
                    alert("ERRO: O Bucket 'class-materials' não existe no Supabase.\n\nCrie-o no Painel do Supabase (Storage -> New Bucket -> 'class-materials' -> Public).");
                } else {
                    alert('Erro no upload do arquivo: ' + error.message);
                }
                setSaving(false); // Stop saving state on error
                setUploading(false);
                return;
            }
            setUploading(false);
        }

        const { error } = await supabase
            .from('Lesson')
            .update({
                moduleId,
                title,
                videoUrl,
                content,
                tasks: hasAssignment ? tasks : null,
                materialUrl: hasAssignment ? finalMaterialUrl : null
            })
            .eq('id', id);

        if (error) {
            alert('Erro ao atualizar aula: ' + error.message);
        } else {
            alert('Aula atualizada com sucesso!');
            router.push('/admin/lessons');
        }
        setSaving(false);
    };

    if (loading) return (
        <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-trenchy-orange"></div>
        </div>
    );

    return (
        <div className="max-w-3xl p-8 mx-auto mt-6">
            <h1 className="text-2xl font-bold mb-6 text-trenchy-text-primary">Editar Aula</h1>
            <form onSubmit={handleUpdateLesson} className="space-y-6 bg-trenchy-card p-6 rounded-lg border border-trenchy-border shadow-sm">
                <div>
                    <label className="block text-sm font-bold mb-1 text-trenchy-text-secondary uppercase tracking-wide">Módulo</label>
                    <select
                        value={moduleId}
                        onChange={(e) => setModuleId(e.target.value)}
                        className="w-full p-2.5 bg-background border border-trenchy-border rounded-lg text-sm text-trenchy-text-primary focus:border-trenchy-orange focus:ring-1 focus:ring-trenchy-orange outline-none"
                        required
                    >
                        <option value="">Selecione um módulo...</option>
                        {modules.map((mod) => (
                            <option key={mod.id} value={mod.id}>
                                {mod.title}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold mb-1 text-trenchy-text-secondary uppercase tracking-wide">Título da Aula</label>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full p-2.5 bg-background border border-trenchy-border rounded-lg text-sm text-trenchy-text-primary focus:border-trenchy-orange focus:ring-1 focus:ring-trenchy-orange outline-none"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1 text-trenchy-text-secondary uppercase tracking-wide">URL do Vídeo</label>
                        <input
                            value={videoUrl}
                            onChange={(e) => setVideoUrl(e.target.value)}
                            className="w-full p-2.5 bg-background border border-trenchy-border rounded-lg text-sm text-trenchy-text-primary focus:border-trenchy-orange focus:ring-1 focus:ring-trenchy-orange outline-none"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold mb-1 text-trenchy-text-secondary uppercase tracking-wide">Conteúdo (Texto)</label>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full p-2.5 bg-background border border-trenchy-border rounded-lg h-32 text-sm text-trenchy-text-primary focus:border-trenchy-orange focus:ring-1 focus:ring-trenchy-orange outline-none"
                    />
                </div>

                {/* Toggle para habilitar Tarefa/Material */}
                <div className="flex items-center justify-between p-4 bg-trenchy-card border border-trenchy-border rounded-lg shadow-sm">
                    <div>
                        <h3 className="text-sm font-bold text-trenchy-text-primary uppercase tracking-wide">Tarefa e Material de Apoio</h3>
                        <p className="text-xs text-trenchy-text-secondary">Habilite para adicionar arquivos para download ou desafios práticos.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={hasAssignment}
                            onChange={(e) => setHasAssignment(e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>

                {hasAssignment && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                        {/* Upload de Material */}
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-md border border-blue-100 dark:border-blue-900/30">
                            <label className="block text-sm font-bold text-blue-800 dark:text-blue-300 mb-1">Material de Apoio (PDF, Excel, etc.)</label>
                            <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">Selecione para substituir o arquivo atual (se houver).</p>

                            {materialUrl && (
                                <div className="mb-2 text-sm">
                                    <span className="font-semibold text-trenchy-text-secondary">Arquivo Atual: </span>
                                    <a href={materialUrl} target="_blank" className="text-blue-600 dark:text-blue-400 underline truncate max-w-xs inline-block align-bottom">{materialUrl}</a>
                                </div>
                            )}

                            <input
                                type="file"
                                accept=".pdf,.xlsx,.xls,.doc,.docx,.zip,.png,.jpg"
                                onChange={(e) => setMaterialFile(e.target.files ? e.target.files[0] : null)}
                                className="block w-full text-sm text-trenchy-text-secondary
                                    file:mr-4 file:py-2 file:px-4
                                    file:rounded-full file:border-0
                                    file:text-sm file:font-semibold
                                    file:bg-blue-100 dark:file:bg-blue-900/40 file:text-blue-700 dark:file:text-blue-300
                                    hover:file:bg-blue-200 dark:hover:file:bg-blue-900/60"
                            />
                        </div>

                        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-md border border-yellow-100 dark:border-yellow-900/30">
                            <label className="block text-sm font-bold text-yellow-800 dark:text-yellow-300 mb-1">Tarefa Prática</label>
                            <textarea
                                value={tasks}
                                onChange={(e) => setTasks(e.target.value)}
                                placeholder="Ex: 'Suba sua planilha de custos preenchida para análise'."
                                className="w-full p-2.5 border border-yellow-200 dark:border-yellow-900/30 bg-background rounded-lg h-20 text-trenchy-text-primary placeholder-gray-500 focus:outline-none focus:border-yellow-400"
                            />
                        </div>
                    </div>
                )}

                <div className="flex gap-4 pt-2">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="w-full bg-transparent border border-trenchy-border text-trenchy-text-secondary px-6 py-3 rounded-lg font-bold hover:bg-black/5 dark:hover:bg-white/5 transition"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={saving || uploading}
                        className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50 shadow-lg shadow-blue-900/20"
                    >
                        {saving || uploading ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </div>
            </form>
        </div>
    );
}
