
"use client";

import { useTransition } from "react";
// @ts-ignore
import { updateMemberRole } from "@/app/community/actions/updateMemberRole";
import { Loader2, Shield, User, ShieldCheck } from "lucide-react";

interface Member {
    id: string;
    role: 'MEMBER' | 'MODERATOR' | 'ADMIN';
    user: {
        name: string | null;
        email: string;
        avatarUrl: string | null;
    };
}

export function MemberManagement({ members }: { members: Member[] }) {
    const [isPending, startTransition] = useTransition();

    const handleRoleChange = (memberId: string, newRole: string) => {
        const role = newRole as 'MEMBER' | 'MODERATOR' | 'ADMIN';
        startTransition(async () => {
            try {
                await updateMemberRole(memberId, role);
            } catch (error) {
                console.error("Failed to update role:", error);
                alert("Erro ao atualizar permissão.");
            }
        });
    };

    return (
        <div className="space-y-4">
            {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 bg-trenchy-bg rounded-lg border border-trenchy-border">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-trenchy-card flex items-center justify-center text-trenchy-text-primary font-bold overflow-hidden border border-trenchy-border">
                            {member.user.avatarUrl ? (
                                <img src={member.user.avatarUrl} alt={member.user.name || "User"} className="w-full h-full object-cover" />
                            ) : (
                                (member.user.name?.[0] || "U").toUpperCase()
                            )}
                        </div>
                        <div>
                            <p className="font-medium text-trenchy-text-primary">{member.user.name || "Usuário"}</p>
                            <p className="text-xs text-trenchy-text-secondary">{member.user.email}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                        {isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin text-trenchy-text-secondary mr-2" />
                        ) : null}

                        <div className="relative">
                            <select
                                value={member.role}
                                onChange={(e) => handleRoleChange(member.id, e.target.value)}
                                className="appearance-none bg-trenchy-card border border-trenchy-border text-xs rounded-lg pl-3 pr-8 py-1.5 text-trenchy-text-primary focus:outline-none focus:ring-1 focus:ring-trenchy-orange cursor-pointer hover:bg-white/5 transition-colors"
                                disabled={isPending}
                            >
                                <option value="MEMBER">Membro</option>
                                <option value="MODERATOR">Moderador</option>
                                <option value="ADMIN">Admin</option>
                            </select>

                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-trenchy-text-secondary">
                                {member.role === 'ADMIN' && <ShieldCheck className="w-3 h-3 text-trenchy-orange" />}
                                {member.role === 'MODERATOR' && <Shield className="w-3 h-3 text-blue-400" />}
                                {member.role === 'MEMBER' && <User className="w-3 h-3 text-gray-500" />}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
