import { prisma as importedPrisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { PrismaClient } from '@prisma/client';

export async function POST(req: Request) {
    // Inicia prisma localmente caso o importado esteja desatualizado no cache do dev server
    const prisma = ((importedPrisma as any).userLessonAccess)
        ? importedPrisma
        : new PrismaClient();

    try {
        // Auth check
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() { return cookieStore.getAll(); },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }: any) =>
                                cookieStore.set(name, value, options)
                            )
                        } catch { }
                    },
                },
            }
        );

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const adminUser = await prisma.user.findUnique({
            where: { email: user.email! },
            select: { role: true }
        });

        if (!adminUser || (adminUser.role !== 'ADMIN' && adminUser.role !== 'MENTOR')) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { userId, targetId, type, status } = await req.json();

        if (!userId || !targetId || !type || !status) {
            return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
        }

        let access;
        if (type === 'MODULE') {
            access = await (prisma as any).userModuleAccess.upsert({
                where: { userId_moduleId: { userId, moduleId: targetId } },
                update: { status },
                create: { userId, moduleId: targetId, status }
            });
            console.log(`[Admin] Módulo ${targetId} alterado para ${status} por ${user.email}`);
        } else if (type === 'LESSON') {
            access = await (prisma as any).userLessonAccess.upsert({
                where: { userId_lessonId: { userId, lessonId: targetId } },
                update: { status },
                create: { userId, lessonId: targetId, status }
            });
            console.log(`[Admin] Aula ${targetId} alterada para ${status} por ${user.email}`);
        } else {
            return NextResponse.json({ error: "Tipo inválido." }, { status: 400 });
        }

        return NextResponse.json({ success: true, data: access });
    } catch (error) {
        console.error("Erro ao alterar acesso:", error);
        return NextResponse.json({ error: "Erro interno ao alterar acesso." }, { status: 500 });
    }
}
