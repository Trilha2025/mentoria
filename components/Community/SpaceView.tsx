"use client";

import { useState, useTransition } from "react";
import { SpaceHeader } from "./SpaceHeader";
import { CreatePost } from "./CreatePost";
import Link from "next/link";
import { MessageCircle, Pin, Heart, Bookmark, MoreHorizontal } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toggleLike } from "@/app/community/actions/posts";
import { useRouter } from "next/navigation";

interface SpaceViewProps {
    space: any;
}

export function SpaceView({ space }: SpaceViewProps) {
    const [isCreatingPost, setIsCreatingPost] = useState(false);

    return (
        <div className="max-w-4xl mx-auto">
            {/* Circle-style Header */}
            <SpaceHeader 
                name={space.name} 
                emoji={space.emoji} 
                onNewPost={() => setIsCreatingPost(true)} 
            />

            <div className="px-1 md:px-0 mt-4">
                {/* Modal Create Post */}
                <CreatePost 
                    isOpen={isCreatingPost}
                    onClose={() => setIsCreatingPost(false)}
                    spaceId={space.id} 
                    spaceName={space.name} 
                />

                {/* Posts Feed */}
                <div className="space-y-3 pb-20">
                    {space.posts.length === 0 ? (
                        <div className="bg-trenchy-card border border-trenchy-border rounded-xl p-8 text-center backdrop-blur-sm bg-white/5">
                            <div className="w-12 h-12 bg-black/20 rounded-full flex items-center justify-center mx-auto mb-3">
                                <MessageCircle className="w-6 h-6 text-trenchy-text-secondary opacity-20" />
                            </div>
                            <p className="text-trenchy-text-secondary font-medium text-sm">Nenhuma publicação ainda neste espaço.</p>
                        </div>
                    ) : (
                        space.posts.map((post: any) => (
                            <FeedPostCard key={post.id} post={post} spaceSlug={space.slug} />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

function FeedPostCard({ post, spaceSlug }: { post: any, spaceSlug: string }) {
    const postUrl = `/community/space/${spaceSlug}/post/${post.id}`;
    const commentsCount = post._count?.comments || 0;
    const likesCount = post._count?.likes || 0;
    const isLiked = post.likes && post.likes.length > 0;

    return (
        <div className={`bg-trenchy-card border ${post.isPinned ? 'border-trenchy-orange/30 bg-trenchy-orange/5' : 'border-trenchy-border'} rounded-xl overflow-hidden transition-all duration-300 hover:border-white/10 backdrop-blur-md`}>
            <div className="p-5">
                {/* Header: Title + Icons */}
                <div className="flex items-start justify-between mb-3">
                    <Link href={postUrl} className="flex-1 group">
                        <h3 className="text-lg font-bold text-trenchy-text-primary group-hover:text-trenchy-orange transition-colors tracking-tight leading-snug">
                            {post.title}
                        </h3>
                    </Link>
                    <div className="flex items-center gap-2 text-trenchy-text-secondary/40">
                        <Bookmark className="w-4 h-4 cursor-pointer hover:text-white transition-colors" />
                        <MoreHorizontal className="w-4 h-4 cursor-pointer hover:text-white transition-colors" />
                    </div>
                </div>

                {/* Author Section */}
                <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-8 h-8 rounded-full bg-trenchy-silver/10 overflow-hidden border border-white/5 flex items-center justify-center">
                        {post.author.avatarUrl ? (
                            <img src={post.author.avatarUrl} alt={post.author.name || ''} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-[10px] font-bold opacity-30">{(post.author.name || 'A')[0]}</span>
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <p className="text-[13px] font-bold text-trenchy-text-primary">{post.author.name || 'Anônimo'}</p>
                            <div className="w-3 h-3 rounded-full bg-trenchy-orange/20 border border-trenchy-orange/30 flex items-center justify-center">
                                <div className="w-1 h-1 rounded-full bg-trenchy-orange shadow-[0_0_8px_rgba(255,145,0,0.8)]" />
                            </div>
                            <span className="text-[9px] text-trenchy-text-secondary uppercase tracking-wider font-semibold opacity-60">
                                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: ptBR })}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Text Body */}
                <div className="dark:text-white/90 text-black/90 text-[13px] leading-relaxed mb-3 line-clamp-3" style={{ fontFamily: 'Arial, sans-serif' }}>
                    {post.content.replace(/<[^>]*>?/gm, '')}
                </div>

                {/* Ver Mais */}
                <Link href={postUrl} className="inline-block text-trenchy-orange font-bold text-xs hover:underline mb-3">
                    Ver mais
                </Link>

                {/* Images */}
                {post.mediaUrls && post.mediaUrls.length > 0 && (
                    <div className="mt-2 rounded-lg overflow-hidden border border-white/5 shadow-inner">
                        <img src={post.mediaUrls[0]} alt="Post media" className="w-full h-auto max-h-[300px] object-cover" />
                    </div>
                )}
            </div>

            {/* Interactive Footer */}
            <FeedPostFooter 
                postId={post.id} 
                isLiked={isLiked} 
                likesCount={likesCount} 
                commentsCount={commentsCount} 
                postUrl={postUrl}
            />
        </div>
    );
}

function FeedPostFooter({ postId, isLiked, likesCount, commentsCount, postUrl }: { postId: string, isLiked: boolean, likesCount: number, commentsCount: number, postUrl: string }) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleLike = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        startTransition(async () => {
            await toggleLike(postId);
            router.refresh();
        });
    };

    return (
        <div className="border-t border-white/5 px-5 py-3 flex items-center justify-between bg-black/5">
            <div className="flex items-center gap-4">
                <button 
                    onClick={handleLike}
                    disabled={isPending}
                    className={`transition-all ${isLiked ? 'text-red-500 scale-105' : 'text-trenchy-text-secondary/30 hover:text-white'}`}
                >
                    <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                </button>

                <Link href={`${postUrl}#comments`} className="text-trenchy-text-secondary/30 hover:text-white transition-colors">
                    <MessageCircle className="w-4 h-4" />
                </Link>
            </div>
            
            <div className="flex items-center gap-2.5">
                <div className="flex items-center -space-x-1.5 mr-1">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="w-5 h-5 rounded-full border border-[#1e292d] bg-trenchy-silver/20 overflow-hidden shadow-sm">
                            <img src={`https://i.pravatar.cc/100?u=${i + postId}`} alt="avatar" className="w-full h-full object-cover" />
                        </div>
                    ))}
                </div>
                <p className="text-[10px] text-trenchy-text-secondary/60 font-bold uppercase tracking-tight">
                    {likesCount} curtidas • {commentsCount} comentários
                </p>
            </div>
        </div>
    );
}
