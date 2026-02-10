// Arquivo: /app/api/submissions/create/route.ts
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { userId, moduleId, lessonId, fileUrl } = await req.json();

        if (!userId || !moduleId || !fileUrl) {
            return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
        }

        const submission = await prisma.documentSubmission.create({
            data: {
                userId,
                moduleId,
                lessonId,
                fileUrl,
                status: 'PENDING'
            },
            include: {
                user: {
                    select: { name: true, mentorId: true }
                },
                Module: {
                    select: { title: true }
                },
                lesson: {
                    select: { title: true }
                }
            }
        });

        // Notificar Mentor
        const lessonTitle = (submission as any).lesson?.title;
        const moduleTitle = (submission as any).Module?.title || 'Módulo';
        const contentInfo = lessonTitle ? `na aula "${lessonTitle}"` : `no módulo "${moduleTitle}"`;

        if ((submission as any).user.mentorId) {
            await prisma.notification.create({
                data: {
                    userId: (submission as any).user.mentorId,
                    title: "Nova Tarefa Recebida 📝",
                    message: `O aluno ${(submission as any).user.name || 'Mentorado'} enviou uma tarefa ${contentInfo}.`,
                    type: "INFO",
                    link: "/admin/mentoria"
                }
            });
        } else {
            // Fallback: Notificar Admin se não tiver mentor
            const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } });
            if (admins.length > 0) {
                await prisma.notification.createMany({
                    data: admins.map(admin => ({
                        userId: admin.id,
                        title: 'Nova Tarefa (Sem Mentor)',
                        message: `${(submission as any).user.name || 'Mentorado'} enviou tarefa ${contentInfo}.`,
                        type: 'WARNING',
                        link: '/admin/mentoria'
                    }))
                });
            }
        }

        return NextResponse.json({ success: true, data: submission });

    } catch (error) {
        console.error("Erro ao registrar submissão:", error);
        return NextResponse.json({ error: "Erro interno ao salvar submissão." }, { status: 500 });
    }
}
