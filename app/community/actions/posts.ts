'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

async function getUser() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll() },
                setAll(c) { try { c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch { } }
            }
        }
    );
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser?.email) return null;

    return await prisma.user.findUnique({
        where: { email: authUser.email },
        select: { id: true, role: true }
    });
}

export async function createPost(formData: FormData) {
    const user = await getUser();
    if (!user) throw new Error("Não autorizado");

    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    const spaceId = formData.get('spaceId') as string;
    const mediaUrls = formData.getAll('mediaUrls') as string[];
    const mediaType = formData.get('mediaType') as string || null;

    if (!title || !content || !spaceId) {
        throw new Error("Título, conteúdo e espaço são obrigatórios");
    }

    const post = await prisma.post.create({
        data: {
            title,
            content,
            spaceId,
            authorId: user.id,
            mediaUrls,
            mediaType
        },
        include: {
            space: { select: { slug: true } }
        }
    });

    revalidatePath('/community');
    revalidatePath(`/community/space/${post.space.slug}`);
    
    return { success: true, postId: post.id };
}

export async function togglePinPost(postId: string) {
    const user = await getUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'MENTOR')) {
        throw new Error("Não autorizado");
    }

    const post = await prisma.post.findUnique({
        where: { id: postId },
        select: { isPinned: true, space: { select: { slug: true } } }
    });

    if (!post) throw new Error("Post não encontrado");

    await prisma.post.update({
        where: { id: postId },
        data: { isPinned: !post.isPinned }
    });

    revalidatePath('/community');
    revalidatePath(`/community/space/${post.space.slug}`);
    
    return { success: true, isPinned: !post.isPinned };
}

export async function deletePost(postId: string) {
    const user = await getUser();
    if (!user) throw new Error("Não autorizado");

    const post = await prisma.post.findUnique({
        where: { id: postId },
        select: { authorId: true, space: { select: { slug: true } } }
    });

    if (!post) throw new Error("Post não encontrado");

    // Only author or admin/mentor can delete
    if (post.authorId !== user.id && user.role !== 'ADMIN' && user.role !== 'MENTOR') {
        throw new Error("Não autorizado");
    }

    await prisma.post.delete({
        where: { id: postId }
    });

    revalidatePath('/community');
    revalidatePath(`/community/space/${post.space.slug}`);
    
    return { success: true };
}

export async function toggleLike(postId: string) {
    const user = await getUser();
    if (!user) throw new Error("Não autorizado");

    const existing = await prisma.like.findUnique({
        where: { postId_userId: { postId, userId: user.id } }
    });

    if (existing) {
        await prisma.like.delete({ where: { id: existing.id } });
    } else {
        await prisma.like.create({ data: { postId, userId: user.id } });
    }

    revalidatePath(`/community`);
    return { success: true, liked: !existing };
}

export async function toggleFavorite(postId: string) {
    const user = await getUser();
    if (!user) throw new Error("Não autorizado");

    const existing = await prisma.favorite.findUnique({
        where: { postId_userId: { postId, userId: user.id } }
    });

    if (existing) {
        await prisma.favorite.delete({ where: { id: existing.id } });
    } else {
        await prisma.favorite.create({ data: { postId, userId: user.id } });
    }

    revalidatePath(`/community`);
    return { success: true, favorited: !existing };
}

export async function addComment(postId: string, content: string, parentId?: string) {
    const user = await getUser();
    if (!user) throw new Error("Não autorizado");

    if (!content.trim()) throw new Error("Conteúdo vazio");

    const comment = await prisma.comment.create({
        data: {
            postId,
            content,
            authorId: user.id,
            parentId
        }
    });

    revalidatePath(`/community`);
    return { success: true, commentId: comment.id };
}

export async function toggleFollow(followingId: string) {
    const user = await getUser();
    if (!user) throw new Error("Não autorizado");
    if (user.id === followingId) throw new Error("Você não pode seguir a si mesmo");

    const existing = await prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: user.id, followingId } }
    });

    if (existing) {
        await prisma.follow.delete({ where: { id: existing.id } });
    } else {
        await prisma.follow.create({ data: { followerId: user.id, followingId } });
    }

    revalidatePath(`/community`);
    return { success: true, following: !existing };
}

export async function toggleCommentLike(commentId: string) {
    const user = await getUser();
    if (!user) throw new Error("Não autorizado");

    const existing = await prisma.commentLike.findUnique({
        where: { commentId_userId: { commentId, userId: user.id } }
    });

    if (existing) {
        await prisma.commentLike.delete({ where: { id: existing.id } });
    } else {
        await prisma.commentLike.create({ data: { commentId, userId: user.id } });
    }

    revalidatePath(`/community`);
    return { success: true, liked: !existing };
}
