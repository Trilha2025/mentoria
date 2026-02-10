'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircleIcon, XCircleIcon, DocumentTextIcon, LockOpenIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { MentorStats } from '@/components/Dashboard/MentorStats';

interface Submission {
    id: string;
    userId: string;
    moduleId: string;
    fileUrl: string;
    status: string;
    createdAt: string; // Adicionado para ordenação
    user: {
        name: string | null;
        email: string;
    };
    Module: { // Adicionado para mostrar nome do módulo na fila
        title: string;
    } | null;
}

interface BusinessData {
    businessName: string | null;
    currentRevenue: string | null;
    mainBottleneck: 'FINANCEIRO' | 'TRAFEGO' | 'VENDAS' | null;
}

interface Student {
    id: string;
    name: string | null;
    email: string;
    businessData: BusinessData | null;
    unlockedModules: string[];
    mentorId?: string | null;
    mentorName?: string | null;
    lastAccess?: string; // Adicionado para KPIs
}

export default function AdminMentorshipPanel() {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState<Student[]>([]);
    const [studentsLoading, setStudentsLoading] = useState(true);
    const [currentUserRole, setCurrentUserRole] = useState<'ADMIN' | 'MENTOR' | null>(null);
    const [mentors, setMentors] = useState<{ id: string, name: string }[]>([]);

    // Estados para Dashboard V2
    const [stats, setStats] = useState({ stuck: 0, pending: 0, active: 0 });

    // Estados para criação de aluno
    const [newStudentName, setNewStudentName] = useState('');
    const [newStudentEmail, setNewStudentEmail] = useState('');
    const [newStudentPassword, setNewStudentPassword] = useState('');
    const [createLoading, setCreateLoading] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Fetch inicial das submissões pendentes
    useEffect(() => {
        checkUserRole();
        fetchSubmissions();
        fetchMentors();
    }, []);

    useEffect(() => {
        if (currentUserRole) {
            fetchStudents();
        }
    }, [currentUserRole]);

    // Calcular KPIs sempre que alunos ou submissões mudarem
    useEffect(() => {
        if (!studentsLoading && !loading) {
            calculateStats();
        }
    }, [students, submissions, studentsLoading, loading]);


    const calculateStats = () => {
        const now = new Date();
        const oneDay = 24 * 60 * 60 * 1000;
        const sevenDays = 7 * oneDay;

        // 1. Stuck Users (> 7 dias sem acesso)
        const stuckCount = students.filter(s => {
            if (!s.lastAccess) return true; // Nunca acessou cont como stuck? ou new? Vamos considerar stuck se criado há > 7 dias. Mas por simplificação, apenas lastAccess antigo.
            const last = new Date(s.lastAccess).getTime();
            return (now.getTime() - last) > sevenDays;
        }).length;

        // 2. Active Users (< 24h)
        const activeCount = students.filter(s => {
            if (!s.lastAccess) return false;
            const last = new Date(s.lastAccess).getTime();
            return (now.getTime() - last) < oneDay;
        }).length;

        // 3. Pending Reviews
        const pendingCount = submissions.filter(s => s.status === 'PENDING').length;

        setStats({ stuck: stuckCount, active: activeCount, pending: pendingCount });
    };

    const checkUserRole = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.email) {
            const { data } = await supabase
                .from('User')
                .select('role')
                .eq('email', user.email)
                .single();
            setCurrentUserRole(data?.role as any);
        }
    };

    const fetchMentors = async () => {
        const { data } = await supabase
            .from('User')
            .select('id, name')
            .in('role', ['MENTOR', 'ADMIN']);
        setMentors(data || []);
    };

    const fetchSubmissions = async () => {
        try {
            // Buscando diretamente do Supabase para ter acesso ao createdAt e Module title
            // A rota de API anterior talvez não retornasse tudo. Vamos melhorar a query aqui ou ajustar a rota.
            // Por simplicidade, vou ajustar a query aqui usando client-side por enquanto, ou manter a rota se ela retornar.
            // Vamos assumir que a rota retorna os campos básicos, mas precisamos de createdAt.
            // O ideal é usar o Supabase Client direto aqui para garantir os campos.

            const { data, error } = await supabase
                .from('DocumentSubmission')
                .select(`
                    id, userId, moduleId, fileUrl, status, createdAt,
                    user:User(name, email),
                    Module(title)
                `) // Removido .eq('status', 'PENDING') para ver histórico se quiser, mas foco é dashboard.
                // Mas a interface pede "Pending Reviews".
                .order('createdAt', { ascending: true });

            if (data) {
                // @ts-ignore
                setSubmissions(data);
            }
        } catch (error) {
            console.error("Erro ao carregar submissões:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStudents = async () => {
        setStudentsLoading(true);
        try {
            let query = supabase
                .from('User')
                .select(`
                    id,
                    name,
                    email,
                    businessData,
                    mentorId,
                    lastAccess,
                    mentor:User!mentorId(name),
                    unlockedModules:UserModuleAccess(moduleId)
                `)
                .eq('role', 'MENTEE');

            if (currentUserRole === 'MENTOR') {
                const { data: { user } } = await supabase.auth.getUser();
                const { data: publicUser } = await supabase.from('User').select('id').eq('email', user?.email).single();
                if (publicUser) {
                    query = query.eq('mentorId', publicUser.id);
                }
            }

            const { data, error } = await query;

            if (error) throw error;

            const formattedStudents: Student[] = data.map((user: any) => ({
                id: user.id,
                name: user.name,
                email: user.email,
                businessData: user.businessData as BusinessData,
                unlockedModules: user.unlockedModules ? user.unlockedModules.map((m: any) => m.moduleId) : [],
                mentorId: user.mentorId,
                mentorName: user.mentor?.name,
                lastAccess: user.lastAccess
            }));
            setStudents(formattedStudents);
        } catch (error) {
            console.error("Erro ao carregar alunos:", JSON.stringify(error, null, 2));
        } finally {
            setStudentsLoading(false);
        }
    };

    const handleCreateStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateLoading(true);

        try {
            const res = await fetch('/api/admin/users/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: newStudentEmail,
                    password: newStudentPassword,
                    name: newStudentName,
                    role: 'MENTEE'
                })
            });

            const data = await res.json();

            if (data.success) {
                alert("Aluno criado com sucesso!");
                setNewStudentName('');
                setNewStudentEmail('');
                setNewStudentPassword('');
                setIsCreateModalOpen(false);
                fetchStudents();
            } else {
                alert("Erro ao criar aluno: " + (data.error || 'Erro desconhecido'));
            }
        } catch (error: any) {
            alert("Erro de conexão: " + error.message);
        } finally {
            setCreateLoading(false);
        }
    };

    const handleAssignMentor = async (studentId: string, mentorId: string) => {
        const { error } = await supabase
            .from('User')
            .update({ mentorId: mentorId || null })
            .eq('id', studentId);

        if (error) {
            alert("Erro ao atribuir mentor.");
        } else {
            fetchStudents();
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
                alert(action === 'APPROVE' ? "Tarefa Aprovada!" : "Solicitação de ajuste enviada!");
                // Re-fetch submissions
                fetchSubmissions();
            } else {
                alert("Erro: " + data.error);
            }
        } catch (error) {
            alert("Erro de conexão.");
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-8">
            <header className="mb-8 border-b border-trenchy-border pb-4 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-trenchy-text-primary">Painel do Mentor</h1>
                    <p className="text-trenchy-text-secondary mt-2">Visão geral da evolução e tarefas pendentes.</p>
                    {currentUserRole && (
                        <span className={`inline-block mt-2 px-2 py-1 rounded text-xs font-bold ${currentUserRole === 'ADMIN' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'}`}>
                            Visão: {currentUserRole}
                        </span>
                    )}
                </div>
                {currentUserRole === 'ADMIN' && (
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center px-4 py-2 bg-trenchy-orange text-white rounded-lg hover:bg-orange-600 transition font-medium text-sm shadow-lg shadow-orange-900/20"
                    >
                        <span className="mr-2 text-lg">+</span>
                        Novo Aluno
                    </button>
                )}
            </header>

            {/* Dashboard Widgets (V2) */}
            <MentorStats
                stuckUsersCount={stats.stuck}
                pendingReviewsCount={stats.pending}
                activeUsersCount={stats.active}
            />

            <div className="grid grid-cols-1 mb-12">
                <div>
                    {/* Seção de Carteira de Alunos */}
                    <section>
                        <h2 className="text-xl font-bold text-trenchy-text-primary mb-4">
                            {currentUserRole === 'ADMIN' ? 'Todos os Alunos' : 'Minha Carteira de Mentorados'}
                        </h2>
                        <div className="bg-trenchy-card rounded-xl shadow-md overflow-hidden border border-trenchy-border">
                            {studentsLoading ? (
                                <div className="flex justify-center py-10">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-trenchy-orange"></div>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-black/5 dark:bg-white/5 border-b border-trenchy-border">
                                            <tr>
                                                <th className="p-4 font-semibold text-sm text-trenchy-text-secondary">Aluno</th>
                                                <th className="p-4 font-semibold text-sm text-trenchy-text-secondary">Negócio</th>
                                                {currentUserRole === 'ADMIN' && (
                                                    <th className="p-4 font-semibold text-sm text-trenchy-text-secondary">Mentor Responsável</th>
                                                )}
                                                <th className="p-4 font-semibold text-sm text-trenchy-text-secondary">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-trenchy-border">
                                            {students.map((student) => (
                                                <tr key={student.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                                    <td className="p-4">
                                                        <Link href={`/admin/mentees/${student.id}`} className="block hover:bg-black/5 dark:hover:bg-white/10 p-2 -m-2 rounded transition group">
                                                            <div className="font-bold text-trenchy-text-primary group-hover:text-trenchy-orange transition-colors">{student.name || 'Sem nome'}</div>
                                                            <div className="text-sm text-trenchy-text-secondary">{student.email}</div>
                                                        </Link>
                                                    </td>
                                                    <td className="p-4 text-sm text-trenchy-text-primary">
                                                        {student.businessData?.businessName || '-'}
                                                        <div className="text-xs text-green-600 dark:text-green-400 font-mono font-bold">
                                                            {student.businessData?.currentRevenue}
                                                        </div>
                                                    </td>
                                                    {currentUserRole === 'ADMIN' && (
                                                        <td className="p-4">
                                                            <select
                                                                value={student.mentorId || ''}
                                                                onChange={(e) => handleAssignMentor(student.id, e.target.value)}
                                                                className="text-sm border-trenchy-border rounded shadow-sm focus:border-trenchy-orange focus:ring focus:ring-orange-200 focus:ring-opacity-50 bg-background text-trenchy-text-primary p-1"
                                                            >
                                                                <option value="">-- Sem Mentor --</option>
                                                                {mentors.map(m => (
                                                                    <option key={m.id} value={m.id}>{m.name || 'Admin/Mentor'}</option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                    )}
                                                    <td className="p-4">
                                                        <div className="flex gap-2">
                                                            <Link href={`/admin/mentees/${student.id}`} className="text-xs bg-background border border-trenchy-border px-3 py-1 rounded hover:bg-trenchy-orange hover:text-white hover:border-trenchy-orange text-trenchy-text-secondary transition inline-flex items-center gap-1">
                                                                <LockOpenIcon className="h-3 w-3" />
                                                                Gerenciar
                                                            </Link>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            {!studentsLoading && students.length === 0 && (
                                <div className="p-8 text-center text-trenchy-text-secondary">
                                    Nenhum aluno encontrado {currentUserRole === 'MENTOR' ? 'na sua carteira.' : '.'}
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>

            {/* Modal de Criação de Aluno */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-trenchy-card rounded-xl shadow-xl w-full max-w-md p-6 relative border border-trenchy-border">
                        <button
                            onClick={() => setIsCreateModalOpen(false)}
                            className="absolute top-4 right-4 text-trenchy-text-secondary hover:text-trenchy-text-primary"
                        >
                            <XCircleIcon className="h-6 w-6" />
                        </button>

                        <h2 className="text-xl font-bold mb-1 text-trenchy-text-primary">Cadastrar Novo Aluno</h2>
                        <p className="text-sm text-trenchy-text-secondary mb-6">Crie uma conta de acesso para um mentorado.</p>

                        <form onSubmit={handleCreateStudent} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-trenchy-text-secondary mb-1 uppercase tracking-wide">Nome Completo</label>
                                <input
                                    type="text"
                                    value={newStudentName}
                                    onChange={(e) => setNewStudentName(e.target.value)}
                                    placeholder="Ex: João Silva"
                                    className="w-full p-2.5 bg-background border border-trenchy-border rounded-lg text-sm text-trenchy-text-primary focus:border-trenchy-orange focus:ring-1 focus:ring-trenchy-orange outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-trenchy-text-secondary mb-1 uppercase tracking-wide">E-mail de Acesso</label>
                                <input
                                    type="email"
                                    value={newStudentEmail}
                                    onChange={(e) => setNewStudentEmail(e.target.value)}
                                    placeholder="aluno@exemplo.com"
                                    className="w-full p-2.5 bg-background border border-trenchy-border rounded-lg text-sm text-trenchy-text-primary focus:border-trenchy-orange focus:ring-1 focus:ring-trenchy-orange outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-trenchy-text-secondary mb-1 uppercase tracking-wide">Senha Inicial</label>
                                <input
                                    type="text"
                                    value={newStudentPassword}
                                    onChange={(e) => setNewStudentPassword(e.target.value)}
                                    placeholder="Defina uma senha provisória"
                                    className="w-full p-2.5 bg-background border border-trenchy-border rounded-lg text-sm text-trenchy-text-primary focus:border-trenchy-orange focus:ring-1 focus:ring-trenchy-orange outline-none"
                                    required
                                />
                            </div>
                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={createLoading}
                                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition disabled:opacity-50 h-[40px] flex justify-center items-center shadow-lg hover:shadow-blue-900/30"
                                >
                                    {createLoading ? 'Criando Cadastro...' : 'Confirmar Cadastro'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
