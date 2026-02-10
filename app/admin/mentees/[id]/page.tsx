'use client';

import { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import {
    UserIcon,
    BuildingStorefrontIcon,
    CurrencyDollarIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
    LockClosedIcon,
    LockOpenIcon,
    DocumentTextIcon,
    ArrowLeftIcon,
    ChevronRightIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface User {
    id: string;
    name: string | null;
    email: string;
    businessData: any;
    createdAt: string;
}

interface Module {
    id: string;
    title: string;
    order: number;
    lessons: Lesson[];
}

interface Lesson {
    id: string;
    moduleId: string;
    title: string;
}

interface Access {
    moduleId?: string;
    lessonId?: string;
    status: 'LOCKED' | 'UNLOCKED' | 'COMPLETED';
}

interface Submission {
    id: string;
    moduleId: string;
    lessonId?: string | null;
    fileUrl: string;
    status: string; // PENDING, APPROVED, ADJUST_REQUIRED
    mentorFeedback: string | null;
    createdAt: string;
    lesson?: { title: string } | null;
    Module?: { title: string } | null;
}

export default function MenteeDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const { id } = resolvedParams;
    const router = useRouter();

    const [student, setStudent] = useState<User | null>(null);
    const [modules, setModules] = useState<Module[]>([]);
    const [moduleAccesses, setModuleAccesses] = useState<Access[]>([]);
    const [lessonAccesses, setLessonAccesses] = useState<Access[]>([]);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedModules, setExpandedModules] = useState<string[]>([]);

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        setLoading(true);
        try {
            // 1. Student Data
            const { data: userData, error: userError } = await supabase
                .from('User')
                .select('*')
                .eq('id', id)
                .single();

            if (userError) throw userError;
            setStudent(userData);

            // 2. All Modules and Lessons
            const { data: modsData } = await supabase
                .from('Module')
                .select('id, title, order, lessons:Lesson(id, title, moduleId)')
                .order('order');
            setModules(modsData || []);

            // 3. Module Accesses
            const { data: modAccData } = await supabase
                .from('UserModuleAccess')
                .select('moduleId, status')
                .eq('userId', id);
            setModuleAccesses(modAccData as any || []);

            // 4. Lesson Accesses
            const { data: lesAccData } = await supabase
                .from('UserLessonAccess')
                .select('lessonId, status')
                .eq('userId', id);
            setLessonAccesses(lesAccData as any || []);

            // 5. Submissions
            const { data: allSubs } = await supabase
                .from('DocumentSubmission')
                .select('*, lesson:Lesson(title), Module(title)')
                .eq('userId', id)
                .order('id', { ascending: false });

            setSubmissions(allSubs || []);

        } catch (error) {
            console.error("Erro ao carregar dados:", error);
            alert("Erro ao carregar dados do aluno.");
            router.push('/admin/mentoria');
        } finally {
            setLoading(false);
        }
    };

    const toggleAccess = async (targetId: string, type: 'MODULE' | 'LESSON', currentStatus: 'LOCKED' | 'UNLOCKED' | 'COMPLETED' | 'NONE', parentModuleId?: string) => {
        let nextStatus: 'LOCKED' | 'UNLOCKED';

        if (type === 'MODULE') {
            nextStatus = (currentStatus === 'UNLOCKED' || currentStatus === 'COMPLETED') ? 'LOCKED' : 'UNLOCKED';
        } else {
            // Lesson logic: If NONE, check inheritance
            if (currentStatus === 'UNLOCKED' || currentStatus === 'COMPLETED') {
                nextStatus = 'LOCKED';
            } else if (currentStatus === 'LOCKED') {
                nextStatus = 'UNLOCKED';
            } else {
                // Status is NONE. If module is unlocked, student can see it. To block it, we must set to LOCKED.
                const modStatus = getModuleStatus(parentModuleId || '');
                const isModUnlocked = modStatus === 'UNLOCKED' || modStatus === 'COMPLETED';
                nextStatus = isModUnlocked ? 'LOCKED' : 'UNLOCKED';
            }
        }

        const label = type === 'MODULE' ? 'módulo' : 'aula';
        const actionLabel = nextStatus === 'UNLOCKED' ? 'Liberar' : 'Bloquear';

        if (!confirm(`${actionLabel} este ${label} para o aluno?`)) return;

        try {
            const res = await fetch('/api/admin/user-access/toggle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: id, targetId, type, status: nextStatus })
            });
            const data = await res.json();
            if (data.success) {
                loadData();
            } else {
                alert("Erro: " + data.error);
            }
        } catch (e) {
            alert("Erro na requisição.");
        }
    };

    const handleEvaluate = async (submissionId: string, action: 'APPROVE' | 'REJECT') => {
        const feedback = prompt(action === 'APPROVE'
            ? "Mensagem de aprovação (Opcional):"
            : "Motivo da reprovação / Ajustes necessários:");

        if (feedback === null) return;

        try {
            const res = await fetch('/api/admin/submissions/evaluate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ submissionId, action, feedback })
            });

            const data = await res.json();
            if (data.success) {
                alert("Sucesso!");
                loadData();
            } else {
                alert("Erro: " + data.error);
            }
        } catch (error) {
            alert("Erro de conexão.");
        }
    };

    const getModuleStatus = (moduleId: string) => {
        const acc = moduleAccesses.find(a => a.moduleId === moduleId);
        return acc ? acc.status : 'NONE';
    };

    const getLessonStatus = (lessonId: string) => {
        const acc = lessonAccesses.find(a => a.lessonId === lessonId);
        return acc ? acc.status : 'NONE';
    };

    const toggleExpand = (modId: string) => {
        setExpandedModules(prev =>
            prev.includes(modId) ? prev.filter(id => id !== modId) : [...prev, modId]
        );
    };

    if (loading) return (
        <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-trenchy-orange"></div>
        </div>
    );

    if (!student) return <div className="p-8 text-center text-trenchy-text-primary">Aluno não encontrado.</div>;

    return (
        <div className="max-w-5xl mx-auto p-8">
            {/* Back Button */}
            <Link href="/admin/mentoria" className="inline-flex items-center text-trenchy-text-secondary hover:text-trenchy-text-primary mb-6 transition-colors">
                <ArrowLeftIcon className="h-4 w-4 mr-1" /> Voltar para Painel
            </Link>

            {/* Header Profile */}
            <div className="bg-trenchy-card rounded-xl p-8 border border-trenchy-border shadow-sm mb-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-trenchy-text-primary flex items-center gap-2">
                            <UserIcon className="h-8 w-8 text-trenchy-orange" />
                            {student.name || 'Sem Nome'}
                        </h1>
                        <p className="text-trenchy-text-secondary ml-10">{student.email}</p>
                        <p className="text-xs text-trenchy-text-secondary ml-10 mt-1 opacity-60">ID: {student.id}</p>
                    </div>
                    <div className="flex gap-4 text-sm">
                        <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-100 dark:border-blue-900/30">
                            <span className="block text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1">
                                <BuildingStorefrontIcon className="h-4 w-4" /> Negócio
                            </span>
                            <span className="text-gray-800 dark:text-gray-200">{student.businessData?.businessName || '-'}</span>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-lg border border-green-100 dark:border-green-900/30">
                            <span className="block text-green-600 dark:text-green-400 font-bold flex items-center gap-1">
                                <CurrencyDollarIcon className="h-4 w-4" /> Faturamento
                            </span>
                            <span className="text-gray-800 dark:text-gray-200">{student.businessData?.currentRevenue || '-'}</span>
                        </div>
                        <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-lg border border-red-100 dark:border-red-900/30">
                            <span className="block text-red-600 dark:text-red-400 font-bold flex items-center gap-1">
                                <ExclamationTriangleIcon className="h-4 w-4" /> Gargalo
                            </span>
                            <span className="text-gray-800 dark:text-gray-200">{student.businessData?.mainBottleneck || '-'}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Progress Column */}
                <div className="bg-trenchy-card rounded-xl p-6 border border-trenchy-border shadow-sm">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-trenchy-text-primary">
                        <LockOpenIcon className="h-5 w-5 text-trenchy-text-secondary" />
                        Progresso e Liberação Granular
                    </h2>
                    <div className="space-y-4">
                        {modules.map(mod => {
                            const modStatus = getModuleStatus(mod.id);
                            const isModUnlocked = modStatus === 'UNLOCKED' || modStatus === 'COMPLETED';
                            const isExpanded = expandedModules.includes(mod.id);

                            return (
                                <div key={mod.id} className="border border-trenchy-border rounded-xl overflow-hidden">
                                    {/* Module Row */}
                                    <div className={`flex items-center justify-between p-4 transition-colors ${isModUnlocked ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/30' : 'bg-black/5 dark:bg-white/5'}`}>
                                        <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => toggleExpand(mod.id)}>
                                            <div className="w-6 h-6 flex items-center justify-center">
                                                <ChevronRightIcon className={`h-4 w-4 text-trenchy-text-secondary transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-bold text-trenchy-text-secondary uppercase">Módulo {mod.order}</span>
                                                <h3 className={`font-semibold text-sm ${isModUnlocked ? 'text-green-900 dark:text-green-300' : 'text-trenchy-text-secondary'}`}>{mod.title}</h3>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => toggleAccess(mod.id, 'MODULE', modStatus)}
                                            className={`p-2 rounded-lg transition-all ${isModUnlocked ? 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 hover:bg-red-500 hover:text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-blue-600 hover:text-white'}`}
                                            title={isModUnlocked ? "Bloquear Módulo" : "Liberar Módulo"}
                                        >
                                            {isModUnlocked ? <CheckCircleIcon className="h-5 w-5" /> : <LockClosedIcon className="h-5 w-5" />}
                                        </button>
                                    </div>

                                    {/* Lessons List (Expanded) */}
                                    {isExpanded && (
                                        <div className="bg-background/50 divide-y divide-trenchy-border border-t border-trenchy-border">
                                            {mod.lessons?.length === 0 ? (
                                                <div className="p-3 text-xs text-center text-trenchy-text-secondary italic">Nenhuma aula cadastrada.</div>
                                            ) : (
                                                mod.lessons.map(lesson => {
                                                    const lessonStatus = getLessonStatus(lesson.id);
                                                    const isLessonUnlocked = lessonStatus === 'UNLOCKED' || lessonStatus === 'COMPLETED';
                                                    // Se a aula não tem status próprio 'NONE', ela herda do módulo
                                                    const effectiveUnlocked = lessonStatus === 'NONE' ? isModUnlocked : isLessonUnlocked;

                                                    return (
                                                        <div key={lesson.id} className="flex items-center justify-between p-3 pl-12 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                                            <div className="flex items-center gap-2">
                                                                <div className={`w-1.5 h-1.5 rounded-full ${effectiveUnlocked ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                                                <span className={`text-xs ${effectiveUnlocked ? 'text-trenchy-text-primary' : 'text-trenchy-text-secondary'}`}>{lesson.title}</span>
                                                            </div>
                                                            <button
                                                                onClick={() => toggleAccess(lesson.id, 'LESSON', lessonStatus, mod.id)}
                                                                className={`p-1.5 rounded-md transition-all ${lessonStatus === 'UNLOCKED' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-red-500 hover:text-white' : 'text-trenchy-text-secondary hover:bg-blue-500 hover:text-white'}`}
                                                                title={effectiveUnlocked ? "Bloquear Aula (Individual)" : "Liberar Aula (Individual)"}
                                                            >
                                                                {effectiveUnlocked ? <LockOpenIcon className="h-4 w-4" /> : <LockClosedIcon className="h-4 w-4" />}
                                                            </button>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Submissions Column */}
                <div className="bg-trenchy-card rounded-xl p-6 border border-trenchy-border shadow-sm">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-trenchy-text-primary">
                        <DocumentTextIcon className="h-5 w-5 text-trenchy-text-secondary" />
                        Histórico de Tarefas
                    </h2>

                    {submissions.length === 0 ? (
                        <p className="text-trenchy-text-secondary text-center py-8">Nenhuma tarefa enviada.</p>
                    ) : (
                        <div className="space-y-4">
                            {submissions.map(sub => (
                                <div key={sub.id} className="p-4 border border-trenchy-border rounded-lg bg-black/5 dark:bg-white/5">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs font-bold text-trenchy-text-primary">
                                                {sub.lesson?.title ? `Aula: ${sub.lesson.title}` : `Módulo: ${sub.Module?.title || 'Geral'}`}
                                            </span>
                                            {sub.lesson?.title && (
                                                <span className="text-[10px] text-trenchy-text-secondary uppercase tracking-tight">
                                                    Módulo: {sub.Module?.title}
                                                </span>
                                            )}
                                        </div>
                                        <span className={`text-xs font-bold px-2 py-1 rounded ${sub.status === 'APPROVED' ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300' :
                                            sub.status === 'ADJUST_REQUIRED' ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300' :
                                                'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300'
                                            }`}>
                                            {sub.status === 'APPROVED' ? 'APROVADO' :
                                                sub.status === 'ADJUST_REQUIRED' ? 'AJUSTE' : 'PENDENTE'}
                                        </span>
                                    </div>
                                    <a href={sub.fileUrl} target="_blank" className="text-blue-600 dark:text-blue-400 underline text-sm block mb-3 truncate">
                                        Abrir Arquivo
                                    </a>

                                    {/* Feedback Display if exists */}
                                    {sub.mentorFeedback && (
                                        <div className="text-xs text-trenchy-text-secondary bg-background p-2 rounded border border-trenchy-border mb-3">
                                            <strong className="text-trenchy-text-primary">Feedback:</strong> {sub.mentorFeedback}
                                        </div>
                                    )}

                                    {/* Actions only if Pending */}
                                    {sub.status === 'PENDING' && (
                                        <div className="flex gap-2 mt-2">
                                            <button
                                                onClick={() => handleEvaluate(sub.id, 'APPROVE')}
                                                className="flex-1 bg-green-600 text-white py-1 rounded text-xs font-bold hover:bg-green-700"
                                            >
                                                Aprovar
                                            </button>
                                            <button
                                                onClick={() => handleEvaluate(sub.id, 'REJECT')}
                                                className="flex-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 py-1 rounded text-xs font-bold hover:bg-red-200 dark:hover:bg-red-900/40"
                                            >
                                                Pedir Ajuste
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
