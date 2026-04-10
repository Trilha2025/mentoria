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
import { motion } from "framer-motion";

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
            <div className="w-[280px] h-full bg-trenchy-card/50 flex flex-col shrink-0 border-r dark:border-white/5 border-black/5">
                {/* Header - Metallic Logo and Italic Badge */}
                <div className="pt-8 pb-4 flex flex-col items-center justify-center px-4 bg-transparent">
                    <Link href="/community" className="flex flex-col items-center group transition-all duration-300">
                        {/* Metallic Text Effect */}
                        <motion.h1 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-xl font-bold tracking-tighter text-trenchy-text-primary dark:bg-gradient-to-r dark:from-white dark:via-white dark:to-white/60 dark:bg-clip-text dark:text-transparent text-center leading-tight"
                        >
                            A Trilha do Ecommerce
                        </motion.h1>
                        
                        {/* Italic Community Badge */}
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="mt-1"
                        >
                            <span className="text-[11px] font-black tracking-[0.25em] text-trenchy-orange drop-shadow-[0_0_12px_rgba(255,145,0,0.5)] bg-gradient-to-r from-trenchy-orange to-orange-400 bg-clip-text text-transparent">
                                Comunidade
                            </span>
                        </motion.div>
                    </Link>
                    
                    {isAdmin && (
                        <div className="w-full flex justify-end mt-2 -mr-2">
                            <Link href="/community/settings" className="p-1.5 hover:bg-white/5 rounded-lg text-trenchy-text-secondary hover:text-white transition-colors" title="Configurações da Comunidade">
                                <Settings className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                    )}
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto py-2 space-y-5">
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
                            Feed Geral
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
                                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1 text-trenchy-text-secondary">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingGroup(group);
                                                }}
                                                className="p-1 hover:bg-white/10 rounded transition-colors"
                                            >
                                                <Settings className="w-3 h-3" />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleReorder(group.id, 'UP');
                                                }}
                                                disabled={isPending}
                                                className="p-1 hover:bg-white/10 rounded transition-colors"
                                            >
                                                <ArrowUp className="w-3 h-3" />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleReorder(group.id, 'DOWN');
                                                }}
                                                disabled={isPending}
                                                className="p-1 hover:bg-white/10 rounded transition-colors"
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

                                            return (
                                                <Link
                                                    key={space.id}
                                                    href={space.type === 'LINK' && space.externalLink ? space.externalLink : `/community/space/${space.slug}`}
                                                    {...(space.type === 'LINK' && space.externalLink ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                                                    className={cn(
                                                        "flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[13px] transition-colors relative group/item",
                                                        isActive
                                                            ? "bg-white/5 text-trenchy-text-primary font-bold"
                                                            : "text-trenchy-text-secondary hover:bg-white/5 hover:text-trenchy-text-primary"
                                                    )}
                                                >
                                                    {isActive && (
                                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-3.5 bg-trenchy-orange rounded-r-full" />
                                                    )}

                                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                                        {space.emoji ? (
                                                            <span className="text-base leading-none">{space.emoji}</span>
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
                        <div className="px-4 mt-2 mb-8 space-y-2">
                            <button
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-trenchy-text-secondary hover:bg-white/5 rounded-lg transition-colors border border-dashed border-trenchy-border hover:border-trenchy-orange hover:text-trenchy-orange"
                                onClick={() => setCreateModal('GROUP')}
                            >
                                <PlusIcon className="w-3 h-3" />
                                Novo Grupo
                            </button>
                            <button
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-trenchy-orange bg-trenchy-orange/5 hover:bg-trenchy-orange/10 rounded-lg transition-colors"
                                onClick={() => setCreateModal('SPACE')}
                            >
                                <PlusIcon className="w-3 h-3" />
                                Novo Espaço
                            </button>
                        </div>
                    )}
                </div>

                {/* Bottom Spacer */}
                <div className="h-6 shrink-0" />
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
