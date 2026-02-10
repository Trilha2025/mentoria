import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { PrismaClient } from '@prisma/client';

// DELETE: Remove a lesson from the study plan
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ lessonId: string }> } // Params is a Promise in Next.js 15+
) {
    const prisma = new PrismaClient();

    try {
        // Unwrap params
        const { lessonId } = await params;
        console.log('[StudyPlan] DELETE Request started for lesson:', lessonId);

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
            console.log('[StudyPlan] DELETE: Unauthorized');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const internalUser = await prisma.user.findUnique({
            where: { email: user.email }
        });

        if (!internalUser) {
            console.log('[StudyPlan] DELETE: User not found');
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (!lessonId) {
            console.error('[StudyPlan] DELETE: lessonId is missing after unwrap');
            return NextResponse.json({ error: 'Lesson ID is required' }, { status: 400 });
        }

        console.log(`[StudyPlan] DELETE: Removing lesson ${lessonId} for user ${internalUser.id}`);

        // IMPORTANT: Use deleteMany but ensure lessonId is definitely provided to avoid accidental mass deletion
        const deleted = await (prisma as any).studyPlanItem.deleteMany({
            where: {
                userId: internalUser.id,
                lessonId: lessonId
            }
        });

        console.log(`[StudyPlan] DELETE: Removed ${deleted.count} items`);

        if (deleted.count === 0) {
            return NextResponse.json({ error: 'Item not found in study plan' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: 'Lesson removed from study plan'
        });

    } catch (error: any) {
        console.error('[StudyPlan] DELETE Error:', error);
        return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
