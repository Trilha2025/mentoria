import { prisma } from "@/lib/prisma";
// Force rebuild v7
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pin, User as UserIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CommentSection } from "@/components/Community/CommentSection";
import { PostActions } from "@/components/Community/PostActions";
import { FollowButton } from "@/components/Community/FollowButton";

interface PostDetailProps {
    postId: string;
    dbUser: any;
    isModal?: boolean;
}

export async function PostDetail({ postId, dbUser, isModal }: PostDetailProps) {
    const post = await prisma.post.findUnique({
        where: { id: postId },
        include: {
            author: { include: { followers: true } },
            space: true,
            comments: {
                orderBy: { createdAt: 'asc' },
                include: {
                    author: { select: { name: true, avatarUrl: true } },
                    likes: true,
                    replies: {
                        include: { 
                            author: { select: { name: true, avatarUrl: true } },
                            likes: true
                        }
                    }
                }
            },
            likes: true,
            favorites: true
        }
    });

    if (!post) return notFound();

    const isLiked = dbUser?.likes.some((l: any) => l.postId === postId) || false;
    const isFavorited = dbUser?.favorites.some((f: any) => f.postId === postId) || false;
    const isFollowing = dbUser?.following.some((f: any) => f.followingId === post.authorId) || false;

    const mainContent = (
        <article className="p-6 md:p-8">
            {/* Post Header */}
            <div className="flex items-start justify-between mb-6 pb-6 border-b dark:border-white/5 border-black/5">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-trenchy-silver/10 overflow-hidden border dark:border-white/5 border-black/5 flex items-center justify-center p-0.5">
                        {post.author.avatarUrl ? (
                            <img src={post.author.avatarUrl} alt={post.author.name || ''} className="w-full h-full object-cover rounded-full" />
                        ) : (
                            <UserIcon className="w-5 h-5 text-trenchy-text-secondary" />
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-lg font-bold dark:text-white text-black tracking-tight">{post.author.name || 'Anônimo'}</h2>
                            <FollowButton 
                                followingId={post.authorId} 
                                isFollowing={isFollowing} 
                                currentUserId={dbUser?.id || ''} 
                            />
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-trenchy-text-secondary uppercase tracking-widest font-bold opacity-60">
                            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: ptBR })}
                        </div>
                    </div>
                </div>

                {post.isPinned && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-trenchy-orange/20 rounded-full border border-trenchy-orange/30">
                        <Pin className="w-3 h-3 text-trenchy-orange fill-trenchy-orange" />
                        <span className="text-[10px] font-bold text-trenchy-orange uppercase tracking-wider">Fixado</span>
                    </div>
                )}
            </div>

            {/* Post Body */}
            <h1 className="text-2xl md:text-3xl font-extrabold dark:text-white text-black mb-4 tracking-tight leading-tight">{post.title}</h1>
            <div 
                className="prose prose-invert prose-sm max-w-none dark:text-white text-black leading-relaxed space-y-4 font-arial"
                style={{ fontFamily: 'Arial, sans-serif' }}
                dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br />') }}
            />

            {/* Media */}
            {post.mediaUrls.length > 0 && (
                <div className="mt-6 space-y-3">
                    {post.mediaUrls.map((url, i) => (
                        <div key={i} className="rounded-xl overflow-hidden border dark:border-white/10 border-black/10 shadow-xl">
                            <img src={url} alt="media" className="w-full h-auto object-cover max-h-[500px]" />
                        </div>
                    ))}
                </div>
            )}

            {/* Post Actions */}
            <PostActions 
                postId={post.id}
                likesCount={post.likes.length}
                isLiked={isLiked}
                isFavorited={isFavorited}
                commentsCount={post.comments.length}
            />

            {/* Comment Section */}
            <CommentSection 
                postId={post.id}
                comments={post.comments}
                currentUser={dbUser}
            />
        </article>
    );

    if (isModal) {
        return (
            <>
                <div className="px-6 py-3 border-b dark:border-white/5 border-black/5 flex items-center justify-between dark:bg-black/20 bg-gray-50 shrink-0">
                    <div className="flex items-center gap-2">
                        <span className="text-lg">{post.space.emoji}</span>
                        <h4 className="text-[10px] font-bold dark:text-white/60 text-black/60 uppercase tracking-widest">{post.space.name}</h4>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {mainContent}
                </div>
            </>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-6 px-4">
            <Link href={`/community/space/${post.space.slug}`} className="flex items-center gap-2 text-trenchy-text-secondary hover:text-white mb-6 transition-colors text-xs font-bold uppercase tracking-wider">
                <ArrowLeft className="w-3 h-3" />
                Voltar para {post.space.name}
            </Link>
            <div className="dark:bg-[#1e292d] bg-white rounded-2xl border dark:border-white/5 border-black/5 shadow-2xl overflow-hidden">
                {mainContent}
            </div>
        </div>
    );
}
