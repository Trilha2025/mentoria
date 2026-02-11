import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: List all tickets for SAC operators
export async function GET(req: Request) {
    try {
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
                            );
                        } catch { }
                    },
                },
            }
        );

        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !user.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const dbUser = await prisma.user.findUnique({
            where: { email: user.email },
        });

        if (!dbUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Only SUPPORT, ADMIN and MENTOR can access
        if (dbUser.role !== 'SUPPORT' && dbUser.role !== 'ADMIN' && dbUser.role !== 'MENTOR') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Parse query parameters
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');
        const search = searchParams.get('search');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const category = searchParams.get('category');

        // Build where clause
        const whereClause: any = {};
        if (category) {
            whereClause.category = category as any;
        }
        if (status) {
            whereClause.status = status;
        }
        if (search) {
            whereClause.OR = [
                { subject: { contains: search, mode: 'insensitive' } },
                { user: { name: { contains: search, mode: 'insensitive' } } },
                { user: { email: { contains: search, mode: 'insensitive' } } },
            ];
        }

        // Get total count
        const total = await prisma.supportTicket.count({ where: whereClause });

        // Get tickets with pagination
        const tickets = await prisma.supportTicket.findMany({
            where: whereClause,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatarUrl: true,
                    },
                },
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
                        senderId: true,
                    },
                },
            },
            orderBy: { updatedAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        });

        // Calculate unread count for each ticket
        const ticketsWithUnread = await Promise.all(
            tickets.map(async (ticket) => {
                const unreadCount = await prisma.ticketMessage.count({
                    where: {
                        ticketId: ticket.id,
                        read: false,
                        senderId: { not: dbUser.id },
                    },
                });

                return {
                    ...ticket,
                    unreadCount,
                    lastMessage: ticket.messages[0] || null,
                };
            })
        );

        return NextResponse.json({
            success: true,
            tickets: ticketsWithUnread,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching tickets:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
