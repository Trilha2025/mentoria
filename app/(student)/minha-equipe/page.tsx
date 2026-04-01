'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
    UsersIcon, 
    UserPlusIcon, 
    TrashIcon, 
    EnvelopeIcon,
    ShieldCheckIcon,
    IdentificationIcon
} from '@heroicons/react/24/outline';

export default function MyTeamPage() {
    const [ownerId, setOwnerId] = useState<string | null>(null);
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isConsulting, setIsConsulting] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Form states
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchTeam();
    }, []);

    const fetchTeam = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                window.location.href = '/login';
                return;
            }
            setOwnerId(user.id);

            // Verificar se o usuário é CONSULTING
            const { data: profile } = await supabase
                .from('User')
                .select('accessType')
                .eq('id', user.id)
                .single();

            if (profile?.accessType !== 'CONSULTING') {
                setIsConsulting(false);
                // Opcional: Redirecionar para dashboard se nao for consultoria
                window.location.href = '/dashboard';
                return;
            }
            setIsConsulting(true);

            // Buscar funcionários (Users onde employerId === user.id)
            const { data: teamMembers, error: teamError } = await supabase
                .from('User')
                .select('id, name, email, avatarUrl, createdAt')
                .eq('employerId', user.id)
                .order('createdAt', { ascending: false });

            if (teamError) throw teamError;
            setEmployees(teamMembers || []);

        } catch (err: any) {
            console.error('Erro ao buscar equipe:', err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            const res = await fetch('/api/team/add-member', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newName,
                    email: newEmail,
                    ownerId: ownerId
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Erro ao adicionar membro');
            }

            setNewName('');
            setNewEmail('');
            setIsAddModalOpen(false);
            fetchTeam(); // Refresh list

        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleRemoveMember = async (userId: string) => {
        if (!confirm('Deseja realmente remover este colaborador da sua equipe? Ele perderá o acesso à mentoria.')) return;

        try {
            const res = await fetch('/api/team/remove-member', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, ownerId }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Erro ao remover membro');
            }

            fetchTeam(); // Refresh list
        } catch (err: any) {
            alert(err.message);
        }
    };

    if (loading) return (
        <div className="flex justify-center py-20 min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-trenchy-orange"></div>
        </div>
    );

    return (
        <main className="max-w-7xl mx-auto p-6 md:p-8 w-full min-h-screen">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-trenchy-text-primary flex items-center gap-3">
                        <UsersIcon className="h-10 w-10 text-trenchy-orange" />
                        Gerenciar Equipe
                    </h1>
                    <p className="mt-2 text-trenchy-text-secondary">
                        Adicione seus colaboradores para que eles tenham acesso à nossa comunidade e materiais.
                    </p>
                </div>

                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 bg-trenchy-orange hover:bg-trenchy-orange/90 text-white font-bold py-3 px-6 rounded-xl transition shadow-lg shadow-trenchy-orange/20"
                >
                    <UserPlusIcon className="h-5 w-5" />
                    Adicionar Membro
                </button>
            </div>

            {/* Empty State */}
            {employees.length === 0 ? (
                <div className="bg-trenchy-card border border-trenchy-border rounded-3xl p-16 text-center shadow-xl">
                    <div className="w-20 h-20 bg-trenchy-orange/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <IdentificationIcon className="h-10 w-10 text-trenchy-orange" />
                    </div>
                    <h3 className="text-xl font-bold text-trenchy-text-primary mb-2">Sua equipe ainda está vazia</h3>
                    <p className="text-trenchy-text-secondary max-w-md mx-auto mb-8">
                        Comece a adicionar seus funcionários para que eles evoluam junto com o seu negócio através da nossa mentoria.
                    </p>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="text-trenchy-orange font-bold hover:underline"
                    >
                        Adicionar meu primeiro colaborador →
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {employees.map((member) => (
                        <div 
                            key={member.id}
                            className="bg-trenchy-card border border-trenchy-border rounded-2xl p-6 relative group transition hover:border-trenchy-orange/50 shadow-lg"
                        >
                            <button
                                onClick={() => handleRemoveMember(member.id)}
                                className="absolute top-4 right-4 p-2 text-trenchy-text-secondary/30 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
                                title="Remover Membro"
                            >
                                <TrashIcon className="h-5 w-5" />
                            </button>

                            <div className="flex items-center gap-4 mb-4">
                                <div className="h-12 w-12 rounded-full border-2 border-trenchy-border bg-black/20 flex items-center justify-center overflow-hidden">
                                    {member.avatarUrl ? (
                                        <img src={member.avatarUrl} alt={member.name} className="h-full w-full object-cover" />
                                    ) : (
                                        <span className="text-lg font-bold text-trenchy-text-secondary">
                                            {member.name?.charAt(0).toUpperCase()}
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <h4 className="font-bold text-trenchy-text-primary leading-tight">{member.name}</h4>
                                    <span className="text-[10px] uppercase font-bold tracking-widest text-trenchy-orange">Funcionário</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm text-trenchy-text-secondary">
                                    <EnvelopeIcon className="h-4 w-4" />
                                    {member.email}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-trenchy-text-secondary">
                                    <ShieldCheckIcon className="h-4 w-4 text-green-500" />
                                    Acesso Comunidade Liberado
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal de Adicionar (Simple Overlay) */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-trenchy-card w-full max-w-md rounded-3xl border border-white/10 shadow-2xl overflow-hidden p-8">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-trenchy-text-primary mb-2">Adicionar Novo Membro</h2>
                            <p className="text-sm text-trenchy-text-secondary">O colaborador terá acesso ao modo comunidade da plataforma.</p>
                        </div>

                        <form onSubmit={handleAddMember} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-trenchy-text-secondary uppercase tracking-widest mb-1">Nome Completo</label>
                                <input 
                                    type="text" 
                                    required
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="w-full bg-black/20 border border-trenchy-border rounded-xl px-4 py-3 text-trenchy-text-primary focus:outline-none focus:border-trenchy-orange transition"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-trenchy-text-secondary uppercase tracking-widest mb-1">E-mail Corporativo</label>
                                <input 
                                    type="email" 
                                    required
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                    className="w-full bg-black/20 border border-trenchy-border rounded-xl px-4 py-3 text-trenchy-text-primary focus:outline-none focus:border-trenchy-orange transition"
                                />
                            </div>

                            {error && (
                                <p className="text-xs text-red-500 font-medium bg-red-500/10 p-3 rounded-lg border border-red-500/20">{error}</p>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="flex-1 px-4 py-3 rounded-xl font-bold bg-white/5 text-trenchy-text-primary hover:bg-white/10 transition"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-2 px-6 py-3 rounded-xl font-bold bg-trenchy-orange text-white flex items-center justify-center gap-2 hover:bg-trenchy-orange/90 disabled:opacity-50"
                                >
                                    {submitting ? 'Adicionando...' : 'Criar Acesso'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}
