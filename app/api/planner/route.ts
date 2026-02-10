import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

// GET: Fetch event items for a user
export async function GET(req: NextRequest) {
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
                            )
                        } catch (e) { }
                    },
                },
            }
        );

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user || !user.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get query params for start/end date filtering (optional)
        const { searchParams } = new URL(req.url);
        const start = searchParams.get('start');
        const end = searchParams.get('end');

        const whereRaw: any = {
            userId: user.id
        };

        if (start && end) {
            whereRaw.startTime = {
                gte: new Date(start),
                lte: new Date(end)
            };
        }

        const events = await prisma.plannerItem.findMany({
            where: whereRaw,
            include: {
                lesson: {
                    select: {
                        id: true,
                        title: true,
                        moduleId: true
                    }
                }
            },
            orderBy: {
                startTime: 'asc'
            }
        });

        return NextResponse.json({
            success: true,
            data: events
        });

    } catch (error: any) {
        console.error('[Planner] GET Error:', error);
        return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
    }
}

// POST: Create a new event
export async function POST(req: NextRequest) {
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
                            )
                        } catch (e) { }
                    },
                },
            }
        );

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { title, description, startTime, endTime, type, lessonId } = body;

        const newItem = await prisma.plannerItem.create({
            data: {
                userId: user.id,
                title,
                description,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                type: type || 'STUDY',
                lessonId: lessonId || null
            }
        });

        return NextResponse.json({
            success: true,
            data: newItem
        });

    } catch (error: any) {
        console.error('[Planner] POST Error:', error);
        return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
    }
}
