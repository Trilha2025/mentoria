
"use server";

import { prisma } from "@/lib/prisma";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function updateMemberRole(memberId: string, newRole: 'MEMBER' | 'MODERATOR' | 'ADMIN') {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll() },
            }
        }
    );

    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user?.email) {
        throw new Error("Unauthorized");
    }

    // Verify if requester is ADMIN
    const requester = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { communityMember: true }
    });

    if (!requester?.communityMember || requester.communityMember.role !== 'ADMIN') {
        throw new Error("Forbidden: Only Admins can change roles.");
    }

    // Perform update
    await prisma.communityMember.update({
        where: { id: memberId },
        data: { role: newRole }
    });

    revalidatePath("/community/settings");
    return { success: true };
}
