import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Hash, MessageCircle, Heart, Bookmark, MoreHorizontal } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export default async function CommunityPage() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll() }
            }
        }
    );
    const { data: { user: authUser } } = await supabase.auth.getUser();

    const recentPosts = await prisma.post.findMany({
        take: 20,
        orderBy: [
            { isPinned: 'desc' },
            { createdAt: 'desc' }
        ],
        include: {
            author: { select: { id: true, name: true, avatarUrl: true } },
            space: { select: { name: true, slug: true, emoji: true } },
            likes: {
                where: { userId: authUser?.id || '' }
            },
            _count: {
                select: {
                    comments: true,
                    likes: true
                }
            }
        }
    });

    return (
        <div className="py-8 px-4 md:px-8 max-w-5xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-black tracking-tight dark:text-white text-black mb-2">Feed Geral 👋</h1>
                <p className="dark:text-white/60 text-black/60 text-sm font-medium">
                    Acompanhe as últimas publicações de todos os espaços da sua comunidade.
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Feed Column */}
                <div className="lg:col-span-2 space-y-4">
                    {recentPosts.length === 0 ? (
                        <div className="bg-trenchy-card border border-trenchy-border rounded-xl p-12 text-center backdrop-blur-sm bg-white/5">
                            <MessageCircle className="w-12 h-12 text-trenchy-text-secondary opacity-20 mx-auto mb-4" />
                            <p className="text-trenchy-text-secondary font-medium">Nenhuma publicação ainda.</p>
                        </div>
                    ) : (
                        recentPosts.map(post => {
                            const postUrl = `/community/space/${post.space.slug}/post/${post.id}`;
                            const isLiked = post.likes.length > 0;
                            
                            return (
                                <div key={post.id} className={`bg-trenchy-card border ${post.isPinned ? 'border-trenchy-orange/30 bg-trenchy-orange/5' : 'border-trenchy-border'} rounded-xl overflow-hidden transition-all duration-300 hover:border-white/10 backdrop-blur-md`}>
                                    <div className="p-5">
                                        {/* Header: Space Badge + Icons */}
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <Link href={`/community/space/${post.space.slug}`} className="flex items-center gap-1.5 px-2 py-1 dark:bg-white/5 bg-black/5 rounded-md border dark:border-white/5 border-black/5 hover:dark:bg-white/10 hover:bg-black/10 transition-colors">
                                                    <span className="text-xs">{post.space.emoji || '💬'}</span>
                                                    <span className="text-[10px] font-black uppercase tracking-wider dark:text-white/60 text-black/60">{post.space.name}</span>
                                                </Link>
                                                <span className="text-[10px] text-trenchy-text-secondary opacity-40 uppercase font-black tracking-widest leading-none mt-0.5">
                                                    • {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: ptBR })}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-trenchy-text-secondary/30">
                                                <Bookmark className="w-4 h-4 cursor-pointer hover:text-white transition-colors" />
                                                <MoreHorizontal className="w-4 h-4 cursor-pointer hover:text-white transition-colors" />
                                            </div>
                                        </div>

                                        {/* Title */}
                                        <Link href={postUrl} className="block group mb-3">
                                            <h3 className="text-lg font-bold dark:text-white text-black group-hover:text-trenchy-orange transition-colors tracking-tight leading-snug">
                                                {post.title}
                                            </h3>
                                        </Link>

                                        {/* Author */}
                                        <div className="flex items-center gap-2.5 mb-4">
                                            <div className="w-8 h-8 rounded-full bg-trenchy-silver/10 overflow-hidden border dark:border-white/5 border-black/5 flex items-center justify-center">
                                                {post.author.avatarUrl ? (
                                                    <img src={post.author.avatarUrl} alt={post.author.name || ''} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-[10px] font-bold opacity-30">{(post.author.name || 'A')[0]}</span>
                                                )}
                                            </div>
                                            <p className="text-[13px] font-bold dark:text-white text-black">{post.author.name || 'Anônimo'}</p>
                                        </div>

                                        {/* Text Body */}
                                        <div className="dark:text-white/80 text-black/80 text-[13px] leading-relaxed mb-3 line-clamp-3 font-arial" style={{ fontFamily: 'Arial, sans-serif' }}>
                                            {post.content.replace(/<[^>]*>?/gm, '')}
                                        </div>

                                        {/* Ver Mais */}
                                        <Link href={postUrl} className="inline-block text-trenchy-orange font-bold text-xs hover:underline mb-3">
                                            Ver mais
                                        </Link>

                                        {/* Images */}
                                        {/* @ts-ignore */}
                                        {post.mediaUrls && post.mediaUrls.length > 0 && (
                                            <div className="mt-2 rounded-lg overflow-hidden border dark:border-white/5 border-black/5 shadow-inner">
                                                <img src={post.mediaUrls[0]} alt="Post media" className="w-full h-auto max-h-[300px] object-cover" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Footer */}
                                    <div className="border-t dark:border-white/5 border-black/5 px-5 py-3 flex items-center justify-between dark:bg-black/5 bg-gray-50">
                                        <div className="flex items-center gap-4">
                                            <Heart className={`w-4 h-4 ${isLiked ? 'text-red-500 fill-red-500' : 'text-trenchy-text-secondary/30'}`} />
                                            <MessageCircle className="w-4 h-4 text-trenchy-text-secondary/30" />
                                        </div>
                                        <p className="text-[10px] text-trenchy-text-secondary/60 font-bold uppercase tracking-tight">
                                            {post._count.likes} curtidas • {post._count.comments} comentários
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Sidebar Widget */}
                <div className="hidden lg:block space-y-6">
                    <div className="dark:bg-white/5 bg-white border dark:border-white/5 border-black/5 rounded-2xl p-6 shadow-sm">
                        <h3 className="font-black text-xs uppercase tracking-[0.2em] text-trenchy-orange mb-4">Sugestão</h3>
                        <div className="space-y-4">
                            <div className="p-3 dark:bg-white/5 bg-gray-50 rounded-xl border dark:border-white/5 border-black/5">
                                <p className="text-xs font-bold dark:text-white text-black mb-1 leading-tight">Complete seu perfil</p>
                                <p className="text-[10px] dark:text-white/40 text-black/40 leading-relaxed">Adicione uma foto e biografia para aumentar sua autoridade na comunidade.</p>
                            </div>
                            <div className="p-3 dark:bg-white/5 bg-gray-50 rounded-xl border dark:border-white/5 border-black/5">
                                <p className="text-xs font-bold dark:text-white text-black mb-1 leading-tight">Explore os Espaços</p>
                                <p className="text-[10px] dark:text-white/40 text-black/40 leading-relaxed">Navegue pelos grupos na barra lateral e participe das conversas.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
