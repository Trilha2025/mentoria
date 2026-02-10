'use client';

import { useState } from 'react';
import { ArrowUpCircleIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

export default function NewTeamMemberPage() {
    const router = useRouter();

    const [newMemberEmail, setNewMemberEmail] = useState('');
    const [newName, setNewName] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newMemberRole, setNewMemberRole] = useState<'ADMIN' | 'MENTOR'>('MENTOR');
    const [inviteLoading, setInviteLoading] = useState(false);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setInviteLoading(true);

        try {
            const res = await fetch('/api/admin/users/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: newMemberEmail,
                    password: newPassword,
                    name: newName,
                    role: newMemberRole
                })
            });

            const data = await res.json();

            if (data.success) {
                alert(`Usuário criado com sucesso! Role: ${newMemberRole}`);
                router.push('/admin/team');
            } else {
                throw new Error(data.error || 'Erro desconhecido');
            }

        } catch (error: any) {
            alert("Erro ao criar usuário: " + error.message);
        } finally {
            setInviteLoading(false);
        }
    };

    return (
        <div className="max-w-2xl p-8 mx-auto mt-6">
            <h1 className="text-2xl font-bold mb-6 text-trenchy-text-primary">Cadastrar Novo Membro</h1>
            <p className="text-sm text-trenchy-text-secondary mb-8">
                Preencha os dados abaixo para adicionar um novo administrador ou mentor à equipe.
            </p>

            <form onSubmit={handleCreateUser} className="space-y-6 bg-trenchy-card p-6 rounded-lg border border-trenchy-border shadow-sm">
                <div>
                    <label className="block text-sm font-bold mb-1 text-trenchy-text-secondary uppercase tracking-wide">Nome Completo</label>
                    <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Ex: Fulano da Silva"
                        className="w-full p-2.5 bg-background border border-trenchy-border rounded-lg text-sm text-trenchy-text-primary focus:border-trenchy-orange focus:ring-1 focus:ring-trenchy-orange outline-none"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold mb-1 text-trenchy-text-secondary uppercase tracking-wide">E-mail de Acesso</label>
                    <input
                        type="email"
                        value={newMemberEmail}
                        onChange={(e) => setNewMemberEmail(e.target.value)}
                        placeholder="exemplo@email.com"
                        className="w-full p-2.5 bg-background border border-trenchy-border rounded-lg text-sm text-trenchy-text-primary focus:border-trenchy-orange focus:ring-1 focus:ring-trenchy-orange outline-none"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold mb-1 text-trenchy-text-secondary uppercase tracking-wide">Senha Inicial</label>
                    <input
                        type="text"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Senha123"
                        className="w-full p-2.5 bg-background border border-trenchy-border rounded-lg text-sm text-trenchy-text-primary focus:border-trenchy-orange focus:ring-1 focus:ring-trenchy-orange outline-none"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold mb-1 text-trenchy-text-secondary uppercase tracking-wide">Papel / Permissão</label>
                    <select
                        value={newMemberRole}
                        onChange={(e) => setNewMemberRole(e.target.value as 'ADMIN' | 'MENTOR')}
                        className="w-full p-2.5 bg-background border border-trenchy-border rounded-lg text-sm text-trenchy-text-primary focus:border-trenchy-orange focus:ring-1 focus:ring-trenchy-orange outline-none"
                    >
                        <option value="MENTOR">Mentor (Gestão de Alunos)</option>
                        <option value="ADMIN">Administrador (Acesso Total)</option>
                    </select>
                </div>

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
                        disabled={inviteLoading}
                        className="w-full bg-trenchy-orange text-white px-6 py-3 rounded-lg font-bold hover:bg-orange-600 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-orange-900/20"
                    >
                        <ArrowUpCircleIcon className="h-5 w-5" />
                        {inviteLoading ? 'Criando...' : 'Criar Conta'}
                    </button>
                </div>
            </form>
        </div>
    );
}
