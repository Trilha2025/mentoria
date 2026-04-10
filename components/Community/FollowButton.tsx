"use client";

import { useTransition } from "react";
import { UserPlus, UserCheck } from "lucide-react";
import { toggleFollow } from "@/app/community/actions/posts";
import { useRouter } from "next/navigation";

interface FollowButtonProps {
    followingId: string;
    isFollowing: boolean;
    currentUserId: string;
}

export function FollowButton({ followingId, isFollowing, currentUserId }: FollowButtonProps) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    if (followingId === currentUserId) return null;

    const handleFollow = () => {
        startTransition(async () => {
            try {
                await toggleFollow(followingId);
                router.refresh();
            } catch (err: any) {
                alert(err.message);
            }
        });
    };

    return (
        <button 
            onClick={handleFollow}
            disabled={isPending}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
                isFollowing 
                ? 'bg-transparent border-white/10 text-trenchy-text-secondary hover:border-red-500/30 hover:text-red-500 hover:bg-red-500/5' 
                : 'bg-trenchy-orange border-trenchy-orange text-white hover:bg-orange-600 shadow-lg shadow-trenchy-orange/20'
            }`}
        >
            {isFollowing ? (
                <>
                    <UserCheck className="w-4 h-4" />
                    <span className="group-hover:hidden">Seguindo</span>
                    {/* Optional: Show 'Deixar de seguir' on hover? */}
                </>
            ) : (
                <>
                    <UserPlus className="w-4 h-4" />
                    Seguir
                </>
            )}
        </button>
    );
}
