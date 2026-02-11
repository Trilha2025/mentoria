import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: List messages for a ticket
export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id: ticketId } = await context.params;
        const messages = await prisma.ticketMessage.findMany({
            where: { ticketId },
            orderBy: { createdAt: 'asc' },
            include: { sender: { select: { name: true, role: true } } }
        });

        return NextResponse.json({ success: true, messages });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST: Send a message
export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
    console.log("POST /api/tickets/[id]/messages started");
    try {
        const { id: ticketId } = await context.params;
        console.log("Ticket ID:", ticketId);

        const body = await req.json();
        console.log("Request body:", body);
        const { content, attachmentUrl } = body;

        // Validate content
        if (!content || typeof content !== 'string' || content.trim() === '') {
            console.error('Invalid content:', content);
            return NextResponse.json({ error: 'Content is required' }, { status: 400 });
        }

        const cookieStore = await cookies();
        const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { getAll() { return cookieStore.getAll() }, setAll(c) { try { c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch { } } } });
        const { data: { user } } = await supabase.auth.getUser();

        if (!user || !user.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
        if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // Security Check: Verify if user owns ticket or is Staff
        const ticketOwnerCheck = await prisma.supportTicket.findUnique({
            where: { id: ticketId },
            select: { userId: true }
        });

        if (!ticketOwnerCheck) {
            return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
        }

        const isStaff = ['ADMIN', 'SUPPORT', 'MENTOR'].includes(dbUser.role);
        const isOwner = ticketOwnerCheck.userId === dbUser.id;

        if (!isStaff && !isOwner) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        console.log('Creating message for ticket:', ticketId, 'from user:', dbUser.id);
        const message = await prisma.ticketMessage.create({
            data: {
                ticketId,
                senderId: dbUser.id,
                content,
                attachmentUrl,
                read: false
            }
        });
        console.log('Message created successfully:', message.id);

        // Update Ticket UpdatedAt
        await prisma.supportTicket.update({
            where: { id: ticketId },
            data: { updatedAt: new Date(), status: 'OPEN' } // Reopen if closed? Or just update time.
        });

        // NOTIFICATION LOGIC
        // If sender is MENTEE -> Notify MENTOR
        // If sender is ADMIN/MENTOR -> Notify MENTEE
        const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId }, select: { userId: true, user: { select: { mentorId: true } } } });

        if (ticket) {
            if (dbUser.role === 'MENTEE') {
                // Notify Mentor
                if (ticket.user.mentorId) {
                    await prisma.notification.create({
                        data: {
                            userId: ticket.user.mentorId,
                            title: 'Nova Mensagem de Suporte 💬',
                            message: `Mensagem de ${dbUser.name || 'Aluno'}: "${content.substring(0, 30)}..."`,
                            type: 'INFO',
                            link: `/admin/support` // Link to admin chat view
                        }
                    });
                }
            } else {
                // Notify Mentee
                await prisma.notification.create({
                    data: {
                        userId: ticket.userId,
                        title: 'Nova Mensagem do Mentor 💬',
                        message: `Mentor respondeu: "${content.substring(0, 30)}..."`,
                        type: 'INFO',
                        link: `/dashboard` // Should link to open chat drawer? Need logic for that.
                    }
                });
            }
        }

        return NextResponse.json({ success: true, message });
    } catch (error) {
        console.error('Error in POST /api/tickets/[id]/messages:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
    }
}
