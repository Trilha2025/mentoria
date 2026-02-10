import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const lessonId = searchParams.get('lessonId');

        if (!lessonId) {
            return NextResponse.json({ error: "lessonId é obrigatório." }, { status: 400 });
        }

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

        const note = await prisma.lessonNote.findUnique({
            where: {
                userId_lessonId: {
                    userId: dbUser.id,
                    lessonId
                }
            }
        });

        return NextResponse.json({ content: note?.content || "" });

    } catch (error: any) {
        const pKeys = Object.keys(prisma || {});
        console.error("Erro ao carregar nota:", error);
        return NextResponse.json({
            error: "Erro interno.",
            details: error.message,
            availableModels: pKeys.filter(k => !k.startsWith('$'))
        }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { lessonId, content } = await req.json();

        if (!lessonId) {
            return NextResponse.json({ error: "lessonId é obrigatório." }, { status: 400 });
        }

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

        const note = await prisma.lessonNote.upsert({
            where: {
                userId_lessonId: {
                    userId: dbUser.id,
                    lessonId
                }
            },
            update: { content },
            create: {
                userId: dbUser.id,
                lessonId,
                content
            }
        });

        return NextResponse.json({ success: true, note });

    } catch (error: any) {
        const pKeys = Object.keys(prisma || {});
        console.error("Erro ao salvar nota:", error);
        return NextResponse.json({
            error: "Erro interno.",
            details: error.message,
            availableModels: pKeys.filter(k => !k.startsWith('$'))
        }, { status: 500 });
    }
}
