"use client";

import { useTransition } from "react";
import { Heart, Bookmark, MessageCircle, Share2 } from "lucide-react";
import { toggleLike, toggleFavorite } from "@/app/community/actions/posts";
import { useRouter } from "next/navigation";

interface PostActionsProps {
    postId: string;
    likesCount: number;
    isLiked: boolean;
    isFavorited: boolean;
    commentsCount: number;
}

export function PostActions({ postId, likesCount, isLiked, isFavorited, commentsCount }: PostActionsProps) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleLike = () => {
        startTransition(async () => {
            await toggleLike(postId);
            router.refresh();
        });
    };

    const handleFavorite = () => {
        startTransition(async () => {
            await toggleFavorite(postId);
            router.refresh();
        });
    };

    return (
        <div className="flex items-center justify-between py-3 border-y dark:border-white/5 border-black/5 bg-transparent my-4">
            <div className="flex items-center gap-4">
                {/* Like Button */}
                <button 
                    onClick={handleLike}
                    disabled={isPending}
                    className={`flex items-center gap-1 transition-all group ${isLiked ? 'text-trenchy-orange' : 'text-trenchy-text-secondary hover:dark:text-white hover:text-black'}`}
                >
                    <div className={`p-1.5 rounded-full transition-colors ${isLiked ? 'bg-trenchy-orange/10' : 'group-hover:dark:bg-white/5 group-hover:bg-black/5'}`}>
                        <Heart className={`w-4 h-4 ${isLiked ? 'fill-trenchy-orange' : ''}`} />
                    </div>
                    <span className="text-[13px] font-bold">{likesCount}</span>
                </button>

                {/* Comment Count Trigger/Indicator */}
                <div className="flex items-center gap-1 text-trenchy-text-secondary">
                    <div className="p-1.5 rounded-full">
                        <MessageCircle className="w-4 h-4" />
                    </div>
                    <span className="text-[13px] font-bold">{commentsCount}</span>
                </div>
            </div>

            <div className="flex items-center gap-1">
                {/* Favorite/Save Button */}
                <button 
                    onClick={handleFavorite}
                    disabled={isPending}
                    className={`p-1.5 rounded-full transition-all ${isFavorited ? 'text-trenchy-orange bg-trenchy-orange/10' : 'text-trenchy-text-secondary hover:dark:text-white hover:text-black hover:dark:bg-white/5 hover:bg-black/5'}`}
                    title={isFavorited ? "Remover dos favoritos" : "Salvar nos favoritos"}
                >
                    <Bookmark className={`w-4 h-4 ${isFavorited ? 'fill-trenchy-orange' : ''}`} />
                </button>

                {/* Share Button (Mocked) */}
                <button className="p-1.5 rounded-full text-trenchy-text-secondary hover:dark:text-white hover:text-black hover:dark:bg-white/5 hover:bg-black/5 transition-all">
                    <Share2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
