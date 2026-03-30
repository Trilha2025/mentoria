import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Hash, MessageCircle } from "lucide-react";

export default async function CommunityPage() {
    // Show recent posts or a welcome message
    const recentPosts = await prisma.post.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
            author: { select: { name: true, avatarUrl: true } },
            space: { select: { name: true, slug: true, emoji: true } }
        }
    });

    return (
        <div className="py-8 px-8">
            <h1 className="text-3xl font-bold mb-2">Bem-vindo à Comunidade! 👋</h1>
            <p className="text-trenchy-text-secondary mb-8">
                Aqui você encontra discussões, networking e conteúdos exclusivos.
                Selecione um espaço na barra lateral para começar.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Feed Column */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-xl font-bold mb-4">Destaques</h2>

                    {recentPosts.length === 0 ? (
                        <div className="bg-trenchy-card border border-trenchy-border rounded-xl p-8 text-center">
                            <p className="text-trenchy-text-secondary">Nenhuma publicação ainda.</p>
                            <p className="text-sm mt-2">Seja o primeiro a postar!</p>
                        </div>
                    ) : (
                        recentPosts.map(post => (
                            <Link key={post.id} href={`/community/space/${post.space.slug}/post/${post.id}`} className="block">
                                <div className="bg-trenchy-card border border-trenchy-border rounded-xl p-6 hover:border-trenchy-orange/50 transition-colors">
                                    <div className="flex items-center gap-2 mb-3 text-xs text-trenchy-text-secondary">
                                        <span className="flex items-center gap-1 bg-black/20 rounded px-2 py-1">
                                            {post.space.emoji || <Hash className="w-3 h-3" />}
                                            {post.space.name}
                                        </span>
                                        <span>•</span>
                                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <h3 className="text-lg font-bold mb-2">{post.title}</h3>
                                    <p className="text-trenchy-text-secondary line-clamp-2 text-sm">{post.content.replace(/<[^>]*>?/gm, '')}</p>

                                    <div className="mt-4 flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-trenchy-silver overflow-hidden">
                                            {/* Avatar placeholder */}
                                        </div>
                                        <span className="text-xs font-medium">{post.author.name || 'Anônimo'}</span>
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>

                {/* Widget Column */}
                <div className="space-y-6">
                    <div className="bg-trenchy-card border border-trenchy-border rounded-xl p-6">
                        <h3 className="font-bold mb-4">Comece por aqui</h3>
                        <ul className="space-y-2 text-sm">
                            <li className="flex items-center gap-2 text-trenchy-text-secondary">
                                <span className="w-1.5 h-1.5 rounded-full bg-trenchy-orange" />
                                Leia as regras da comunidade
                            </li>
                            <li className="flex items-center gap-2 text-trenchy-text-secondary">
                                <span className="w-1.5 h-1.5 rounded-full bg-trenchy-orange" />
                                Apresente-se no canal Geral
                            </li>
                            <li className="flex items-center gap-2 text-trenchy-text-secondary">
                                <span className="w-1.5 h-1.5 rounded-full bg-trenchy-orange" />
                                Complete seu perfil
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
