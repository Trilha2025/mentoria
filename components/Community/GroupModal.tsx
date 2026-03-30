"use client";

import { useState, useTransition, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { createSpaceGroup, updateSpaceGroup } from "@/app/community/actions";

interface GroupModalProps {
    isOpen: boolean;
    onClose: () => void;
    group?: {
        id: string;
        name: string;
        emoji: string | null;
    } | null;
}

export function GroupModal({ isOpen, onClose, group }: GroupModalProps) {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState("");
    const [name, setName] = useState("");

    const isEditing = !!group;

    useEffect(() => {
        if (group) {
            setName(group.name);
        } else {
            setName("");
        }
    }, [group, isOpen]);

    if (!isOpen) return null;

    async function handleSubmit(formData: FormData) {
        setError("");
        startTransition(async () => {
            try {
                if (isEditing && group) {
                    await updateSpaceGroup(group.id, formData);
                } else {
                    await createSpaceGroup(formData);
                }
                onClose();
            } catch (e) {
                setError(`Erro ao ${isEditing ? 'atualizar' : 'criar'} grupo. Tente novamente.`);
            }
        });
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-trenchy-card border border-trenchy-border rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-trenchy-border">
                    <h3 className="font-bold text-lg">
                        {isEditing ? 'Configurar Grupo' : 'Novo Grupo de Espaços'}
                    </h3>
                    <button onClick={onClose} className="text-trenchy-text-secondary hover:text-trenchy-text-primary">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form action={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-trenchy-text-secondary mb-1">Nome do Grupo</label>
                        <input
                            name="name"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ex: Primeiros Passos, Suporte..."
                            className="w-full bg-trenchy-bg border border-trenchy-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-trenchy-orange transition-colors"
                        />
                    </div>


                    {error && <p className="text-red-500 text-xs">{error}</p>}

                    <div className="flex items-center justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-trenchy-text-secondary hover:text-trenchy-text-primary transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="px-4 py-2 text-sm font-medium bg-trenchy-orange text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                            {isEditing ? 'Salvar Alterações' : 'Criar Grupo'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
