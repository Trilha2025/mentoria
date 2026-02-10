import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST: Mark all messages in a ticket as read (for current user)
export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id: ticketId } = await context.params;

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
        const { data: { user } } = await supabase.auth.getUser();

        if (!user || !user.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
        if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // Mark all messages in this ticket as read (except messages sent by current user)
        await prisma.ticketMessage.updateMany({
            where: {
                ticketId,
                senderId: { not: dbUser.id },
                read: false
            },
            data: { read: true }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error marking messages as read:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
    }
}
