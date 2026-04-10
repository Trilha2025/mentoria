'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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

export async function addToGallery(imageUrl: string, caption?: string) {
    if (!(await checkAdmin())) throw new Error("Não autorizado");

    const lastImage = await prisma.eventGalleryImage.findFirst({
        orderBy: { order: 'desc' }
    });
    const order = (lastImage?.order || 0) + 1;

    await prisma.eventGalleryImage.create({
        data: {
            imageUrl,
            caption,
            order
        }
    });

    revalidatePath('/agenda');
    revalidatePath('/admin/agenda/gallery');
    return { success: true };
}

export async function deleteFromGallery(id: string) {
    if (!(await checkAdmin())) throw new Error("Não autorizado");

    await prisma.eventGalleryImage.delete({
        where: { id }
    });

    revalidatePath('/agenda');
    revalidatePath('/admin/agenda/gallery');
    return { success: true };
}

export async function updateGalleryOrder(images: { id: string, order: number }[]) {
     if (!(await checkAdmin())) throw new Error("Não autorizado");

    await prisma.$transaction(
        images.map(img => 
            prisma.eventGalleryImage.update({
                where: { id: img.id },
                data: { order: img.order }
            })
        )
    );

    revalidatePath('/agenda');
    revalidatePath('/admin/agenda/gallery');
    return { success: true };
}
