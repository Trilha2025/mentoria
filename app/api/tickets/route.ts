import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: List tickets
// Student: Their own tickets
// Mentor/Admin: All tickets (or assigned ones if logic exists)
export async function GET(req: Request) {
    try {
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() { return cookieStore.getAll(); },
                    setAll(cookiesToSet) { try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch { } },
                },
            }
        );

        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !user.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
        if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        let whereClause = {};
        if (dbUser.role === 'MENTEE') {
            whereClause = { userId: dbUser.id };
        } else if (dbUser.role === 'MENTOR') {
            // Mentors see tickets from their mentees
            // OR see all tickets if they help everyone. Let's start with mentees only + unassigned if we want. 
            // For now: All tickets for simplicity or filter by mentorship relationship logic if strict.
            // Simplified: Mentors can see all tickets for now to help out.
            whereClause = {};
        }

        const tickets = await prisma.supportTicket.findMany({
            where: whereClause,
            include: {
                user: { select: { name: true, email: true } },
                _count: { select: { messages: true } },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1, // Last message preview
                    select: { content: true, createdAt: true, read: true, senderId: true }
                }
            },
            orderBy: { updatedAt: 'desc' }
        });

        return NextResponse.json({ success: true, tickets });
    } catch (error) {
        console.error("Error fetching tickets:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST: Create a new ticket (Automatically done when sending first message usually, but here for explicit creation if needed)
export async function POST(req: Request) {
    console.log("POST /api/tickets started");
    try {
        const body = await req.json();
        console.log("Request body:", body);
        const { subject, initialMessage } = body;
        const cookieStore = await cookies();
        const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { getAll() { return cookieStore.getAll() }, setAll(c) { try { c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch { } } } });

        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !user.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
        if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // Create Ticket + First Message
        if (!prisma.supportTicket) {
            throw new Error('Prisma Client not initialized properly. SupportTicket model missing.');
        }

        // Create Ticket
        const ticket = await prisma.supportTicket.create({
            data: {
                userId: dbUser.id,
                subject: subject || 'Dúvida Geral',
                status: 'OPEN'
            }
        });

        // Create First Message
        await prisma.ticketMessage.create({
            data: {
                ticketId: ticket.id,
                senderId: dbUser.id,
                content: initialMessage || 'Iniciou o atendimento.',
                read: false
            }
        });

        // Fetch complete ticket with messages
        const fullTicket = await prisma.supportTicket.findUnique({
            where: { id: ticket.id },
            include: { messages: true, user: { select: { name: true, email: true } } }
        });

        return NextResponse.json({ success: true, ticket: fullTicket });

        // Notify Admins/Mentors
        // (Implementation of notification logic here later)

        return NextResponse.json({ success: true, ticket });

    } catch (error) {
        console.error("Error creating ticket:", error);
        return NextResponse.json({ error: 'Internal Server Error', details: String(error) }, { status: 500 });
    }
}
