import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { PrismaClient } from '@prisma/client';

// POST: Add a lesson to the study plan
export async function POST(req: NextRequest) {
    const prisma = new PrismaClient();
    console.log('[StudyPlan] POST Request started');

    try {
        if (!prisma.studyPlanItem) {
            console.error('[StudyPlan] CRITICAL: prisma.studyPlanItem is UNDEFINED');
            return NextResponse.json({
                error: 'Server stale: Prisma model not found. PLEASE RESTART npm run dev.',
                debug: Object.keys(prisma).filter(k => !k.startsWith('_'))
            }, { status: 500 });
        }

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

        const internalUser = await prisma.user.findUnique({
            where: { email: user.email }
        });

        if (!internalUser) {
            return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
        }

        const body = await req.json();
        const { lessonId, moduleId } = body;

        const lesson = await prisma.lesson.findFirst({
            where: { id: lessonId, moduleId: moduleId }
        });

        if (!lesson) {
            return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
        }

        const studyPlanItem = await (prisma as any).studyPlanItem.create({
            data: {
                userId: internalUser.id,
                lessonId: lessonId,
                moduleId: moduleId
            }
        });

        console.log('[StudyPlan] POST: Saved item', studyPlanItem.id);
        return NextResponse.json({
            success: true,
            data: studyPlanItem
        });

    } catch (error: any) {
        console.error('[StudyPlan] POST Error:', error);
        return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}

// GET: Fetch items
export async function GET(req: NextRequest) {
    const prisma = new PrismaClient();
    console.log('[StudyPlan] GET Request started');
    try {
        if (!prisma.studyPlanItem) {
            return NextResponse.json({ error: 'Server stale: Prisma model not found' }, { status: 500 });
        }

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
                        } catch { }
                    },
                },
            }
        );

        const { data: { user } } = await supabase.auth.getUser();

        if (!user || !user.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const internalUser = await prisma.user.findUnique({
            where: { email: user.email }
        });

        if (!internalUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        console.log('[StudyPlan] GET: Fetching for user', internalUser.id);
        const studyPlanItems = await (prisma as any).studyPlanItem.findMany({
            where: { userId: internalUser.id },
            include: {
                lesson: true,
                module: true
            },
            orderBy: { addedAt: 'desc' }
        });

        console.log(`[StudyPlan] GET: Found ${studyPlanItems.length} items raw`);

        // Group by module
        const groupedByModule: any = {};
        studyPlanItems.forEach((item: any) => {
            if (!item.module || !item.lesson) return;

            const moduleId = item.module.id;
            if (!groupedByModule[moduleId]) {
                groupedByModule[moduleId] = {
                    moduleId: item.module.id,
                    moduleTitle: item.module.title,
                    moduleOrder: item.module.order || 0,
                    lessons: []
                };
            }
            groupedByModule[moduleId].lessons.push({
                id: item.lesson.id,
                title: item.lesson.title,
                videoUrl: item.lesson.videoUrl,
                content: item.lesson.content,
                addedAt: item.addedAt
            });
        });

        // Convert to array and sort by module order
        const result = Object.values(groupedByModule).sort((a: any, b: any) => a.moduleOrder - b.moduleOrder);

        console.log(`[StudyPlan] GET: Returning ${result.length} modules`);
        return NextResponse.json({
            success: true,
            data: result
        });

    } catch (error: any) {
        console.error('[StudyPlan] GET Error:', error);
        return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
