import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        console.log("Processing lesson progress update (Prisma)...");
        const { lessonId, completed } = await req.json();

        // 1. Get User Session via Supabase
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() { return cookieStore.getAll(); },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            )
                        } catch { }
                    },
                },
            }
        );

        const { data: { user } } = await supabase.auth.getUser();

        if (!user || !user.email) {
            console.error("Unauthorized: No user found");
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Upsert Progress using Prisma
        // We need the internal User ID (from Prisma User table), not just Auth ID.
        // Assuming they are linked or we search by email.

        const internalUser = await prisma.user.findUnique({
            where: { email: user.email }
        });

        if (!internalUser) {
            console.error("User not found in Prisma");
            // Optional: Create user if missing? For now, error.
            return NextResponse.json({ success: false, error: 'User profile not found' }, { status: 404 });
        }

        const progress = await prisma.lessonProgress.upsert({
            where: {
                userId_lessonId: {
                    userId: internalUser.id,
                    lessonId: lessonId
                }
            },
            update: {
                completed: completed,
            },
            create: {
                userId: internalUser.id,
                lessonId: lessonId,
                completed: completed
            }
        });

        console.log("Progress updated:", progress);

        return NextResponse.json({ success: true, progress });

    } catch (error: any) {
        console.error("API Error (Prisma):", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
