"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    Home,
    MessageCircle,
    Hash,
    Lock,
    ChevronDown,
    ChevronRight,
    Settings,
    Plus as PlusIcon,
    ArrowUp,
    ArrowDown,
    ArrowRight as ArrowRightIcon,
    Link as LinkIcon
} from "lucide-react";
import { useState, useTransition } from "react";
import { GroupModal } from "@/components/Community/GroupModal";
import { CreateSpaceModal } from "@/components/Community/CreateSpaceModal";
import { reorderGroup } from "@/app/community/actions";

// Types matching Prisma Schema
interface Space {
    id: string;
    name: string;
    slug: string;
    emoji: string | null;
    isPrivate: boolean;
    type: "POST" | "CHAT" | "EVENT" | "COURSE" | "LINK";
    externalLink?: string | null;
}

interface SpaceGroup {
    id: string;
    name: string;
    slug: string;
    emoji: string | null;
    spaces: Space[];
}

interface CommunitySidebarProps {
    groups: SpaceGroup[];
    isAdmin?: boolean;
}

export function CommunitySidebar({ groups, isAdmin }: CommunitySidebarProps) {
    const pathname = usePathname();
    const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
    const [createModal, setCreateModal] = useState<'GROUP' | 'SPACE' | null>(null);
    const [editingGroup, setEditingGroup] = useState<SpaceGroup | null>(null);
    const [isPending, startTransition] = useTransition();

    const handleReorder = (groupId: string, direction: 'UP' | 'DOWN') => {
        startTransition(async () => {
            await reorderGroup(groupId, direction);
        });
    };

    const toggleGroup = (groupId: string) => {
        setCollapsedGroups(prev => ({
            ...prev,
            [groupId]: !prev[groupId]
        }));
    };

    return (
        <>
            <div className="w-[280px] h-full bg-trenchy-card/50 flex flex-col shrink-0">
                {/* Header */}
                <div className="h-14 flex items-center justify-between px-4 bg-transparent border-b border-white/5">
                    <Link href="/community" className="font-bold text-lg text-trenchy-text-primary flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-trenchy-orange to-orange-600 rounded-lg flex items-center justify-center text-white">
                            C
                        </div>
                        <span>Comunidade</span>
                    </Link>
                    {isAdmin && (
                        <Link href="/community/settings" className="p-1.5 hover:bg-white/5 rounded-lg text-trenchy-text-secondary hover:text-trenchy-text-primary transition-colors" title="Configurações da Comunidade">
                            <Settings className="w-4 h-4" />
                        </Link>
                    )}
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto py-4 space-y-6">

                    {/* Global Links */}
                    <div className="px-2 space-y-1">
                        <Link
                            href="/community"
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                                pathname === "/community"
                                    ? "bg-trenchy-orange/10 text-trenchy-orange"
                                    : "text-trenchy-text-secondary hover:bg-white/5 hover:text-trenchy-text-primary"
                            )}
                        >
                            <Home className="w-4 h-4" />
                            Home
                        </Link>
                    </div>

                    {/* Groups & Spaces */}
                    <div className="space-y-4">
                        {groups.map(group => (
                            <div key={group.id} className="px-2">
                                <div className="w-full flex items-center justify-between px-3 py-1 text-xs font-bold text-trenchy-text-secondary uppercase tracking-wider transition-colors group">
                                    <button
                                        onClick={() => toggleGroup(group.id)}
                                        className="flex items-center gap-2 flex-1 text-left text-trenchy-orange hover:text-orange-600 transition-colors truncate"
                                    >
                                        <span className="font-extrabold text-[11px] uppercase tracking-wider truncate">{group.name}</span>
                                        {collapsedGroups[group.id] ? (
                                            <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        ) : (
                                            <ChevronDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        )}
                                    </button>

                                    {isAdmin && (
                                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingGroup(group);
                                                }}
                                                className="p-1 hover:bg-white/10 rounded text-trenchy-text-secondary hover:text-white transition-colors"
                                                title="Configurar Grupo"
                                            >
                                                <Settings className="w-3 h-3" />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleReorder(group.id, 'UP');
                                                }}
                                                disabled={isPending}
                                                className="p-1 hover:bg-white/10 rounded text-trenchy-text-secondary hover:text-white transition-colors"
                                                title="Mover para cima"
                                            >
                                                <ArrowUp className="w-3 h-3" />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleReorder(group.id, 'DOWN');
                                                }}
                                                disabled={isPending}
                                                className="p-1 hover:bg-white/10 rounded text-trenchy-text-secondary hover:text-white transition-colors"
                                                title="Mover para baixo"
                                            >
                                                <ArrowDown className="w-3 h-3" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {!collapsedGroups[group.id] && (
                                    <div className="mt-1 space-y-0.5">
                                        {group.spaces.map(space => {
                                            const isActive = pathname === `/community/space/${space.slug}`;

                                            // Determine Icon
                                            let Icon = Hash;
                                            if (space.type === 'CHAT') Icon = MessageCircle;
                                            if (space.type === 'LINK') Icon = LinkIcon;

                                            // Render logic: External Link vs Internal Link
                                            if (space.type === 'LINK' && space.externalLink) {
                                                return (
                                                    <a
                                                        key={space.id}
                                                        href={space.externalLink}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className={cn(
                                                            "flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm transition-colors relative group/item",
                                                            "text-trenchy-text-secondary hover:bg-white/5 hover:text-trenchy-text-primary"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                                            {space.emoji ? (
                                                                <span>{space.emoji}</span>
                                                            ) : (
                                                                <Icon className="w-4 h-4 shrink-0 text-trenchy-text-secondary group-hover/item:text-trenchy-text-primary" />
                                                            )}
                                                            <span className="truncate">{space.name}</span>
                                                        </div>
                                                        <div className="opacity-0 group-hover/item:opacity-100 transition-opacity">
                                                            <ArrowRightIcon className="w-3 h-3 text-trenchy-text-secondary" />
                                                        </div>
                                                    </a>
                                                );
                                            }

                                            return (
                                                <Link
                                                    key={space.id}
                                                    href={`/community/space/${space.slug}`}
                                                    className={cn(
                                                        "flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm transition-colors relative group/item",
                                                        isActive
                                                            ? "bg-white/5 text-trenchy-text-primary font-medium"
                                                            : "text-trenchy-text-secondary hover:bg-white/5 hover:text-trenchy-text-primary"
                                                    )}
                                                >
                                                    {isActive && (
                                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-trenchy-orange rounded-r-full" />
                                                    )}

                                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                                        {space.emoji ? (
                                                            <span>{space.emoji}</span>
                                                        ) : (
                                                            <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-trenchy-text-primary" : "text-trenchy-text-secondary group-hover/item:text-trenchy-text-primary")} />
                                                        )}
                                                        <span className="truncate">{space.name}</span>
                                                    </div>

                                                    {space.isPrivate && <Lock className="w-3 h-3 text-trenchy-text-secondary opacity-50" />}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Admin Actions */}
                    {isAdmin && (
                        <div className="px-4 mt-4 pt-4 space-y-2">
                            <button
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-trenchy-text-secondary hover:bg-white/5 rounded-lg transition-colors border border-dashed border-trenchy-border hover:border-trenchy-orange hover:text-trenchy-orange"
                                onClick={() => setCreateModal('GROUP')}
                            >
                                <PlusIcon className="w-3 h-3" />
                                Novo Grupo de Espaço
                            </button>
                            <button
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-trenchy-orange bg-trenchy-orange/10 hover:bg-trenchy-orange/20 rounded-lg transition-colors"
                                onClick={() => setCreateModal('SPACE')}
                            >
                                <PlusIcon className="w-3 h-3" />
                                Novo Espaço
                            </button>
                        </div>
                    )}
                </div>

                {/* Bottom Profile Snippet or logout could go here */}
                <div className="p-4">
                </div>
            </div>

            {/* Modals */}
            {isAdmin && (
                <>
                    <GroupModal
                        isOpen={createModal === 'GROUP' || !!editingGroup}
                        onClose={() => {
                            setCreateModal(null);
                            setEditingGroup(null);
                        }}
                        group={editingGroup}
                    />
                    <CreateSpaceModal
                        isOpen={createModal === 'SPACE'}
                        onClose={() => setCreateModal(null)}
                        groups={groups}
                    />
                </>
            )}
        </>
    );
}

function ArrowLeftIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
        </svg>
    )
}
