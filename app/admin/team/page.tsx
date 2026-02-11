'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { UserGroupIcon, PlusIcon, ArrowUpCircleIcon, TrashIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

interface User {
    id: string;
    name: string | null;
    email: string;
    role: 'ADMIN' | 'MENTOR' | 'MENTEE' | 'SUPPORT';
}

export default function TeamManagementPage() {
    const [team, setTeam] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        checkPermission();
    }, []);

    const checkPermission = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            window.location.href = '/login';
            return;
        }

        const { data } = await supabase
            .from('User')
            .select('role')
            .eq('email', user.email)
            .single();

        if (data?.role !== 'ADMIN') {
            alert("Acesso negado. Apenas administradores podem gerenciar a equipe.");
            window.location.href = '/admin/mentoria';
            return;
        }

        setIsAuthorized(true);
        fetchTeam();
    };

    const fetchTeam = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('User')
                .select('*')
                .in('role', ['ADMIN', 'MENTOR', 'SUPPORT'])
                .order('name');

            if (error) throw error;
            setTeam(data || []);
        } catch (error: any) {
            console.error("Erro ao carregar equipe:", JSON.stringify(error, null, 2) || error);
            alert("Erro ao carregar equipe: " + (error.message || JSON.stringify(error)));
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = (userId: string, newRole: 'ADMIN' | 'MENTOR' | 'SUPPORT') => {
        setTeam(prev => prev.map(user =>
            user.id === userId ? { ...user, role: newRole } : user
        ));
    };

    const handleSaveRole = async (userId: string, newRole: 'ADMIN' | 'MENTOR' | 'SUPPORT') => {
        try {
            const { error } = await supabase
                .from('User')
                .update({ role: newRole })
                .eq('id', userId);

            if (error) throw error;
            alert("Papel atualizado com sucesso!");
        } catch (error: any) {
            console.error("Erro ao salvar papel:", error);
            alert("Erro ao salvar papel: " + error.message);
            fetchTeam(); // Reverte em caso de erro
        }
    };

    const handleDemote = async (userId: string) => {
        if (!confirm("Tem certeza? Este usuário perderá acesso às funções administrativas e voltará a ser MENTEE.")) return;

        const confirmation = prompt("Para confirmar, digite REMOVER no campo abaixo:");
        if (confirmation !== "REMOVER") {
            alert("Ação cancelada. O texto digitado não confere.");
            return;
        }

        try {
            const { error } = await supabase
                .from('User')
                .update({ role: 'MENTEE' })
                .eq('id', userId);

            if (error) throw error;
            alert("Membro removido da equipe com sucesso!");
            fetchTeam();
        } catch (error: any) {
            console.error("Erro ao remover da equipe:", error);
            alert("Erro ao remover da equipe: " + error.message);
        }
    };

    if (!isAuthorized && loading) {
        return (
            <div className="max-w-4xl mx-auto p-8 text-center text-trenchy-text-secondary mt-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-trenchy-orange mx-auto mb-4"></div>
                <p>Verificando permissões...</p>
            </div>
        );
    }

    if (!isAuthorized) return null; // Redirecionando...

    return (
        <div className="max-w-6xl mx-auto p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-trenchy-text-primary flex items-center gap-2">
                        <UserGroupIcon className="h-8 w-8 text-trenchy-orange" />
                        Gestão de Equipe
                    </h1>
                    <p className="text-trenchy-text-secondary mt-2">Gerencie administradores, mentores e suporte da plataforma.</p>
                </div>
                <Link
                    href="/admin/team/new"
                    className="flex items-center px-4 py-2 bg-trenchy-orange text-white rounded-lg hover:bg-orange-600 transition font-medium shadow-lg shadow-orange-900/20"
                >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Novo Membro
                </Link>
            </div>

            {/* Team List */}
            <section className="bg-trenchy-card rounded-xl border border-trenchy-border shadow-sm overflow-hidden">
                <h2 className="text-lg font-bold p-6 border-b border-trenchy-border bg-black/5 dark:bg-white/5 text-trenchy-text-primary">Membros da Equipe</h2>
                {loading ? (
                    <div className="flex justify-center py-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-trenchy-orange"></div>
                    </div>
                ) : team.length === 0 ? (
                    <div className="p-8 text-center text-trenchy-text-secondary">Nenhum membro encontrado além de você.</div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-black/5 dark:bg-white/5 text-xs text-trenchy-text-secondary uppercase border-b border-trenchy-border">
                            <tr>
                                <th className="px-6 py-3">Nome / Email</th>
                                <th className="px-6 py-3">Papel</th>
                                <th className="px-6 py-3 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-trenchy-border">
                            {team.map((member) => (
                                <tr key={member.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-trenchy-text-primary">{member.name || 'Sem Nome'}</div>
                                        <div className="text-xs text-trenchy-text-secondary">{member.email}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <select
                                                value={member.role}
                                                onChange={(e) => handleRoleChange(member.id, e.target.value as 'ADMIN' | 'MENTOR' | 'SUPPORT')}
                                                className={`px-2 py-1 rounded text-xs font-bold border-none focus:ring-0 cursor-pointer ${member.role === 'ADMIN'
                                                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
                                                    : member.role === 'MENTOR'
                                                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                                                        : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                                    }`}
                                            >
                                                <option value="ADMIN">ADMIN</option>
                                                <option value="MENTOR">MENTOR</option>
                                                <option value="SUPPORT">SUPPORT</option>
                                            </select>
                                            <button
                                                onClick={() => handleSaveRole(member.id, member.role as 'ADMIN' | 'MENTOR' | 'SUPPORT')}
                                                className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 p-1 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition"
                                                title="Salvar Alteração de Papel"
                                            >
                                                <ArrowUpCircleIcon className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleDemote(member.id)}
                                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-xs font-bold flex items-center gap-1 ml-auto"
                                            title="Remover da equipe (Voltar a ser Mentee)"
                                        >
                                            <TrashIcon className="h-4 w-4" /> Remover
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </section>
        </div>
    );
}
