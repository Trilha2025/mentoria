import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH: Update ticket status
export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id: ticketId } = await context.params;
        const { status } = await req.json();

        // Validate status
        if (!status || !['OPEN', 'RESOLVED'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

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

        // Only MENTOR or ADMIN can close tickets
        if (dbUser.role !== 'MENTOR' && dbUser.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden: Only mentors can close tickets' }, { status: 403 });
        }

        // Update ticket status
        const ticket = await prisma.supportTicket.update({
            where: { id: ticketId },
            data: { status, updatedAt: new Date() }
        });

        return NextResponse.json({ success: true, ticket });
    } catch (error) {
        console.error('Error updating ticket:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
    }
}
