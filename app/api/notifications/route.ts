import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: Fetch notifications for the current user
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

        if (!user || !user.email) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const dbUser = await prisma.user.findUnique({
            where: { email: user.email },
            select: { id: true }
        });

        if (!dbUser) {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
        }

        const notifications = await prisma.notification.findMany({
            where: { userId: dbUser.id },
            orderBy: { createdAt: 'desc' },
            take: 20 // Limit to last 20
        });

        // Count unread
        const unreadCount = await prisma.notification.count({
            where: { userId: dbUser.id, read: false }
        });

        return NextResponse.json({ success: true, notifications, unreadCount });

    } catch (error: any) {
        console.error("Notification API Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// PATCH: Mark notifications as read
export async function PATCH(req: Request) {
    try {
        const { notificationIds } = await req.json(); // Array of IDs or 'all'

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
        if (!user || !user.email) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
        if (!dbUser) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });

        if (notificationIds === 'all') {
            await prisma.notification.updateMany({
                where: { userId: dbUser.id, read: false },
                data: { read: true }
            });
        } else if (Array.isArray(notificationIds)) {
            await prisma.notification.updateMany({
                where: { userId: dbUser.id, id: { in: notificationIds } },
                data: { read: true }
            });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
// DELETE: Delete a notification
export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
        }

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
        if (!user || !user.email) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
        if (!dbUser) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });

        // Verify ownership before deleting
        const notification = await prisma.notification.findUnique({
            where: { id }
        });

        if (!notification) {
            return NextResponse.json({ success: false, error: 'Notification not found' }, { status: 404 });
        }

        if (notification.userId !== dbUser.id) {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        await prisma.notification.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
