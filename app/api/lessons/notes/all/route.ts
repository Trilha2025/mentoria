import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

export async function GET() {
    try {
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() { return cookieStore.getAll(); },
                },
            }
        );

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
        if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // Fetch all notes for the user with lesson and module info
        const notes = await prisma.lessonNote.findMany({
            where: { userId: dbUser.id },
            include: {
                lesson: {
                    include: {
                        module: {
                            select: {
                                id: true,
                                title: true,
                                order: true
                            }
                        }
                    }
                }
            },
            orderBy: [
                { lesson: { module: { order: 'asc' } } },
                { updatedAt: 'desc' }
            ]
        });

        // Group notes by module
        // Group notes by module
        const groupedByModule = notes.reduce((acc: any, note: any) => {
            const moduleId = note.lesson.module.id;
            if (!acc[moduleId]) {
                acc[moduleId] = {
                    moduleId,
                    moduleTitle: note.lesson.module.title,
                    moduleOrder: note.lesson.module.order,
                    notes: []
                };
            }
            // @ts-ignore
            acc[moduleId].notes.push({
                id: note.id,
                lessonId: note.lessonId,
                lessonTitle: note.lesson.title,
                content: note.content,
                updatedAt: note.updatedAt
            });
            return acc;
        }, {});

        const result = Object.values(groupedByModule).sort((a: any, b: any) => a.moduleOrder - b.moduleOrder);

        return NextResponse.json({ notebooks: result });

    } catch (error: any) {
        console.error("Erro ao listar cadernos:", error);
        return NextResponse.json({
            error: "Erro interno.",
            details: error.message
        }, { status: 500 });
    }
}
