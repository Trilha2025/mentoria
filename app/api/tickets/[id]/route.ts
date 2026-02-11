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

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const supabase = await createSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
        }

        const ticketId = params.id;
        const userId = session.user.id;

        const ticket = await prisma.supportTicket.findUnique({
            where: { id: ticketId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        role: true, // Para identificar staff nas mensagens
                    }
                },
                messages: {
                    orderBy: { createdAt: 'asc' },
                    include: {
                        sender: {
                            select: {
                                id: true,
                                name: true,
                                role: true,
                            }
                        }
                    }
                }
            }
        });

        if (!ticket) {
            return NextResponse.json({ success: false, error: 'Ticket não encontrado' }, { status: 404 });
        }

        // Verifica se o ticket pertence ao usuário
        if (ticket.userId !== userId) {
            return NextResponse.json({ success: false, error: 'Acesso negado ao ticket' }, { status: 403 });
        }

        return NextResponse.json({ success: true, ticket });

    } catch (error: any) {
        console.error("Erro ao buscar detalhes do ticket (user):", error);
        return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
    }
}
