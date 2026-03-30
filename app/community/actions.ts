'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function slugify(text: string) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
}

async function checkAdmin() {
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
    if (!authUser?.email) return false;

    const user = await prisma.user.findUnique({
        where: { email: authUser.email },
        select: { role: true }
    });

    return user?.role === 'ADMIN' || user?.role === 'MENTOR';
}

export async function createSpaceGroup(formData: FormData) {
    const isAdmin = await checkAdmin();
    if (!isAdmin) throw new Error("Unauthorized");

    const name = formData.get('name') as string;

    if (!name) throw new Error("Name is required");

    let slug = slugify(name);
    // Simple uniqueness check (demo)
    const existing = await prisma.spaceGroup.findUnique({ where: { slug } });
    if (existing) {
        slug = `${slug}-${Date.now()}`;
    }

    const last = await prisma.spaceGroup.findFirst({ orderBy: { order: 'desc' } });
    const order = (last?.order || 0) + 1;

    await prisma.spaceGroup.create({
        data: {
            name,
            slug,
            order
        }
    });

    revalidatePath('/community');
    return { success: true };
}

export async function updateSpaceGroup(groupId: string, formData: FormData) {
    const isAdmin = await checkAdmin();
    if (!isAdmin) throw new Error("Unauthorized");

    const name = formData.get('name') as string;

    if (!name) throw new Error("Name is required");

    // Check if we need to update the slug (optional, but usually name change implies slug change)
    // For simplicity, let's just update the name first.
    await prisma.spaceGroup.update({
        where: { id: groupId },
        data: {
            name
        }
    });

    revalidatePath('/community');
    return { success: true };
}

export async function createSpace(formData: FormData) {
    const isAdmin = await checkAdmin();
    if (!isAdmin) throw new Error("Unauthorized");

    const name = formData.get('name') as string;
    const emoji = formData.get('emoji') as string;
    const groupId = formData.get('groupId') as string;
    const type = formData.get('type') as any; // POST, CHAT, LINK
    const isPrivate = formData.get('isPrivate') === 'true';
    const externalLink = formData.get('externalLink') as string | null;

    if (!name || !groupId) throw new Error("Name and Group are required");
    if (type === 'LINK' && !externalLink) throw new Error("URL is required for Link spaces");

    let slug = slugify(name);
    const existing = await prisma.space.findUnique({ where: { slug } });
    if (existing) {
        slug = `${slug}-${Date.now()}`;
    }

    await prisma.space.create({
        data: {
            name,
            emoji: emoji || (type === 'LINK' ? '🔗' : '💬'),
            slug,
            groupId,
            type: type || 'POST',
            isPrivate,
            externalLink: type === 'LINK' ? externalLink : null
        }
    });

    revalidatePath('/community');
    return { success: true };
}

export async function reorderGroup(groupId: string, direction: 'UP' | 'DOWN') {
    const isAdmin = await checkAdmin();
    if (!isAdmin) throw new Error("Unauthorized");

    // Get all groups ordered by current order to determine sequence
    const allGroups = await prisma.spaceGroup.findMany({
        orderBy: { order: 'asc' }
    });

    const currentIndex = allGroups.findIndex(g => g.id === groupId);
    if (currentIndex === -1) return { success: false };

    const newIndex = direction === 'UP' ? currentIndex - 1 : currentIndex + 1;

    // Check bounds
    if (newIndex < 0 || newIndex >= allGroups.length) return { success: false };

    // Swap positions in the array
    const targetGroup = allGroups[newIndex];
    allGroups[newIndex] = allGroups[currentIndex];
    allGroups[currentIndex] = targetGroup;

    // Persist new order for ALL groups to ensure clean sequence (0, 1, 2...)
    // Using transaction to prevent race conditions or partial updates
    await prisma.$transaction(
        allGroups.map((g, index) =>
            prisma.spaceGroup.update({
                where: { id: g.id },
                data: { order: index }
            })
        )
    );

    revalidatePath('/community');
    return { success: true };
}
