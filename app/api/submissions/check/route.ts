import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');
        const moduleId = searchParams.get('moduleId');
        const lessonId = searchParams.get('lessonId');

        if (!userId || !moduleId) {
            return NextResponse.json({ error: "userId e moduleId são obrigatórios." }, { status: 400 });
        }

        const query: any = { userId, moduleId };
        if (lessonId) {
            query.lessonId = lessonId;
        } else {
            // Se for carregamento geral do módulo sem aula específica, pega as que não tem aula ou a última
            query.lessonId = null;
        }

        const submission = await (prisma.documentSubmission as any).findFirst({
            where: query,
            orderBy: {
                id: 'desc'
            }
        });

        if (!submission) {
            return NextResponse.json({ found: false });
        }

        return NextResponse.json({
            found: true,
            status: submission.status,
            feedback: submission.mentorFeedback,
            fileUrl: submission.fileUrl
        });

    } catch (error) {
        console.error("Erro ao verificar submissão:", error);
        return NextResponse.json({ error: "Erro interno." }, { status: 500 });
    }
}
