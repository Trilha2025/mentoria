import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

async function createSupabaseClient() {
    const cookieStore = await cookies();
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll() },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch { } // The `setAll` method was called from a Server Component.
                },
            },
        }
    );
}

export async function GET(req: Request) {
    try {
        const supabase = await createSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
        }

        const userId = session.user.id;
        const { searchParams } = new URL(req.url);
        const category = searchParams.get('category');
        const where: any = { userId };
        if (category) {
            where.category = category as any;
        }

        const tickets = await prisma.supportTicket.findMany({
            where,
            include: {
                _count: {
                    select: { messages: true },
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    select: {
                        content: true,
                        createdAt: true,
                        read: true,
                    },
                },
            },
            orderBy: { updatedAt: 'desc' },
        });

        return NextResponse.json({ success: true, tickets });

    } catch (error: any) {
        console.error("Erro ao listar tickets do usuário:", error);
        return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const supabase = await createSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
        }

        const { subject, content, category } = await req.json();

        if (!subject || !content) {
            return NextResponse.json({ success: false, error: 'Assunto e mensagem são obrigatórios' }, { status: 400 });
        }

        const newTicket = await prisma.supportTicket.create({
            data: {
                userId: session.user.id,
                subject,
                status: 'OPEN',
                category: (category || 'TECHNICAL') as any,
                messages: {
                    create: {
                        senderId: session.user.id,
                        content,
                        read: true // Lido pelo próprio criador
                    }
                }
            }
        });

        return NextResponse.json({ success: true, ticketId: newTicket.id });

    } catch (error: any) {
        console.error("Erro ao criar ticket:", error);
        return NextResponse.json({ success: false, error: 'Erro ao criar ticket' }, { status: 500 });
    }
}
