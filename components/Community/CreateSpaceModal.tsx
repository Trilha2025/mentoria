"use client";

import { useState, useTransition } from "react";
import { X, Loader2, Hash, MessageCircle, Link as LinkIcon } from "lucide-react";
import { createSpace } from "@/app/community/actions";

interface SpaceGroup {
    id: string;
    name: string;
}

interface CreateSpaceModalProps {
    isOpen: boolean;
    onClose: () => void;
    groups: SpaceGroup[];
}

export function CreateSpaceModal({ isOpen, onClose, groups }: CreateSpaceModalProps) {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState("");
    const [selectedType, setSelectedType] = useState<"POST" | "CHAT" | "LINK">("POST");

    if (!isOpen) return null;

    async function handleSubmit(formData: FormData) {
        setError("");
        startTransition(async () => {
            try {
                await createSpace(formData);
                onClose();
            } catch (e) {
                setError("Erro ao criar espaço. Tente novamente.");
            }
        });
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-trenchy-card border border-trenchy-border rounded-xl w-full max-w-lg shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-trenchy-border">
                    <h3 className="font-bold text-lg">Novo Espaço</h3>
                    <button onClick={onClose} className="text-trenchy-text-secondary hover:text-trenchy-text-primary">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form action={handleSubmit} className="p-6 space-y-4">

                    {/* Type Selection */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <label className={`cursor-pointer border rounded-xl p-4 flex flex-col items-center gap-2 transition-all ${selectedType === 'POST'
                            ? 'border-trenchy-orange bg-trenchy-orange/5 text-trenchy-orange'
                            : 'border-trenchy-border hover:border-trenchy-silver'
                            }`}>
                            <input type="radio" name="type" value="POST" className="hidden" checked={selectedType === 'POST'} onChange={() => setSelectedType('POST')} />
                            <Hash className="w-6 h-6" />
                            <span className="text-sm font-bold">Posts</span>
                        </label>

                        <label className={`cursor-pointer border rounded-xl p-4 flex flex-col items-center gap-2 transition-all ${selectedType === 'CHAT'
                            ? 'border-trenchy-orange bg-trenchy-orange/5 text-trenchy-orange'
                            : 'border-trenchy-border hover:border-trenchy-silver'
                            }`}>
                            <input type="radio" name="type" value="CHAT" className="hidden" checked={selectedType === 'CHAT'} onChange={() => setSelectedType('CHAT')} />
                            <MessageCircle className="w-6 h-6" />
                            <span className="text-sm font-bold">Chat</span>
                        </label>

                        <label className={`cursor-pointer border rounded-xl p-4 flex flex-col items-center gap-2 transition-all ${selectedType === 'LINK'
                            ? 'border-trenchy-orange bg-trenchy-orange/5 text-trenchy-orange'
                            : 'border-trenchy-border hover:border-trenchy-silver'
                            }`}>
                            <input type="radio" name="type" value="LINK" className="hidden" checked={selectedType === 'LINK'} onChange={() => setSelectedType('LINK')} />
                            <LinkIcon className="w-6 h-6" />
                            <span className="text-sm font-bold">Link</span>
                        </label>
                    </div>

                    {selectedType === 'LINK' && (
                        <div>
                            <label className="block text-sm font-medium text-trenchy-text-secondary mb-1">URL do Link</label>
                            <input
                                name="externalLink"
                                placeholder="https://..."
                                required
                                className="w-full bg-trenchy-bg border border-trenchy-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-trenchy-orange transition-colors"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-trenchy-text-secondary mb-1">Nome do Espaço</label>
                        <input
                            name="name"
                            required
                            placeholder="Ex: Avisos, Geral..."
                            className="w-full bg-trenchy-bg border border-trenchy-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-trenchy-orange transition-colors"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-trenchy-text-secondary mb-1">Ícone / Emoji</label>
                            <input
                                name="emoji"
                                placeholder="Ex: 💬"
                                className="w-full bg-trenchy-bg border border-trenchy-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-trenchy-orange transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-trenchy-text-secondary mb-1">Agrupar em</label>
                            <select
                                name="groupId"
                                required
                                defaultValue=""
                                className="w-full bg-trenchy-bg border border-trenchy-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-trenchy-orange transition-colors appearance-none"
                            >
                                <option value="" disabled>Selecione...</option>
                                {groups.map(g => (
                                    <option key={g.id} value={g.id}>{g.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                        <input type="checkbox" id="private" name="isPrivate" value="true" className="w-4 h-4 rounded border-trenchy-border text-trenchy-orange focus:ring-trenchy-orange bg-trenchy-bg" />
                        <label htmlFor="private" className="text-sm text-trenchy-text-secondary select-none">Espaço Privado (Apenas membros convidados)</label>
                    </div>

                    {error && <p className="text-red-500 text-xs">{error}</p>}

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-trenchy-border mt-6">
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
                            Criar Espaço
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
