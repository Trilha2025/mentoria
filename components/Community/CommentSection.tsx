"use client";

import { MessageCircle, Send, Heart, Reply, User as UserIcon } from "lucide-react";
import { useState, useTransition } from "react";
import { addComment, toggleCommentLike } from "@/app/community/actions/posts";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useRouter } from "next/navigation";

interface CommentSectionProps {
    postId: string;
    comments: any[];
    currentUser?: any;
}

export function CommentSection({ postId, comments, currentUser }: CommentSectionProps) {
    const [content, setContent] = useState("");
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;

        startTransition(async () => {
            await addComment(postId, content);
            setContent("");
            router.refresh();
        });
    };

    return (
        <div id="comments" className="mt-6 pt-6 border-t dark:border-white/5 border-black/5 space-y-6">
            <h3 className="text-base font-bold dark:text-white text-black flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-trenchy-orange" />
                Conversa ({comments.length})
            </h3>

            {/* Main Input */}
            <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full bg-trenchy-silver/10 overflow-hidden border dark:border-white/5 border-black/5 flex items-center justify-center shrink-0">
                    {currentUser?.avatarUrl ? (
                        <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                    ) : (
                        <UserIcon className="w-4 h-4 text-trenchy-text-secondary" />
                    )}
                </div>
                <form onSubmit={handleSubmit} className="flex-1 relative group">
                    <input
                        placeholder="O que você acha?"
                        className="w-full dark:bg-white/5 bg-gray-50 border dark:border-white/10 border-gray-200 rounded-xl px-3 py-2 text-xs dark:text-white text-black placeholder:text-gray-400 focus:outline-none focus:border-trenchy-orange/50 transition-all pr-12"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                    />
                    <button 
                        type="submit"
                        disabled={isPending || !content.trim()}
                        className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 text-trenchy-orange hover:bg-trenchy-orange/10 rounded-lg transition-all disabled:opacity-30"
                    >
                        <Send className="w-3.5 h-3.5" />
                    </button>
                </form>
            </div>

            {/* List */}
            <div className="space-y-4">
                {comments.filter(c => !c.parentId).map((comment) => (
                    <CommentItem 
                        key={comment.id} 
                        comment={comment} 
                        postId={postId}
                        currentUser={currentUser}
                    />
                ))}
            </div>
        </div>
    );
}

function CommentItem({ comment, postId, currentUser }: any) {
    const [replyContent, setReplyContent] = useState("");
    const [isReplying, setIsReplying] = useState(false);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const isLiked = comment.likes?.some((l: any) => l.userId === currentUser?.id);
    const likesCount = comment.likes?.length || 0;

    const handleLike = () => {
        startTransition(async () => {
            await toggleCommentLike(comment.id);
            router.refresh();
        });
    };

    const handleReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyContent.trim()) return;

        startTransition(async () => {
            await addComment(postId, replyContent, comment.id);
            setReplyContent("");
            setIsReplying(false);
            router.refresh();
        });
    };

    return (
        <div className="flex gap-3 group">
            <div className="w-8 h-8 rounded-full bg-trenchy-silver/10 overflow-hidden border dark:border-white/5 border-black/5 flex items-center justify-center shrink-0">
                {comment.author.avatarUrl ? (
                    <img src={comment.author.avatarUrl} alt={comment.author.name} className="w-full h-full object-cover" />
                ) : (
                    <UserIcon className="w-4 h-4 text-trenchy-text-secondary" />
                )}
            </div>
            <div className="flex-1 space-y-1.5">
                <div className="dark:bg-white/5 bg-gray-50 border dark:border-white/5 border-gray-100 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold dark:text-white text-black">{comment.author.name}</span>
                        <span className="text-[9px] text-trenchy-text-secondary uppercase opacity-60">
                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: ptBR })}
                        </span>
                    </div>
                    <p className="text-xs dark:text-trenchy-text-secondary text-gray-700 leading-relaxed">{comment.content}</p>
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-3 px-1">
                    <button 
                        onClick={handleLike}
                        disabled={isPending}
                        className={`text-[10px] font-bold transition-colors flex items-center gap-1 ${isLiked ? 'text-trenchy-orange' : 'text-trenchy-text-secondary hover:text-white'}`}
                    >
                        {isLiked ? 'Curtido' : 'Curtir'} 
                        {likesCount > 0 && <span className="opacity-60">({likesCount})</span>}
                    </button>
                    <button 
                        onClick={() => setIsReplying(!isReplying)}
                        className="text-[10px] font-bold text-trenchy-text-secondary hover:text-white transition-colors flex items-center gap-1.5"
                    >
                        Responder
                    </button>
                </div>

                {/* Reply Input */}
                {isReplying && (
                    <form onSubmit={handleReply} className="mt-2 flex gap-2 animate-in slide-in-from-top-1 duration-200">
                        <input
                            autoFocus
                            placeholder={`Respondendo...`}
                            className="flex-1 dark:bg-white/5 bg-white border dark:border-white/10 border-gray-200 rounded-lg px-3 py-1.5 text-xs dark:text-white text-black placeholder:text-gray-400 focus:outline-none focus:border-trenchy-orange/50 transition-all"
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                        />
                        <button 
                            type="submit"
                            disabled={isPending || !replyContent.trim()}
                            className="bg-trenchy-orange/10 text-trenchy-orange hover:bg-trenchy-orange hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all disabled:opacity-30"
                        >
                            {isPending ? "..." : "OK"}
                        </button>
                    </form>
                )}

                {/* Nested Replies */}
                {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-3 space-y-4 border-l dark:border-white/5 border-gray-100 pl-4 ml-1">
                        {comment.replies.map((reply: any) => (
                            <CommentItem 
                                key={reply.id} 
                                comment={reply} 
                                postId={postId} 
                                currentUser={currentUser} 
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
