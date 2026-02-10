import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { submissionId, action, feedback } = await req.json();

        if (!submissionId || !action) {
            return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
        }

        // Define novo status baseada na ação
        const newStatus = action === 'APPROVE' ? 'APPROVED' : 'ADJUST_REQUIRED';

        // 1. Atualiza a submissão
        const updatedSubmission = await prisma.documentSubmission.update({
            where: { id: submissionId },
            data: {
                status: newStatus,
                mentorFeedback: feedback,
                evaluatedAt: new Date() // Importante para KPIs
            },
            include: { Module: true } // Incluir para notificação
        });

        // NOTIFICAÇÃO: Avisar o Aluno da avaliação
        let notifTitle = '';
        let notifMessage = '';
        let notifType = 'INFO';

        if (newStatus === 'APPROVED') {
            notifTitle = 'Tarefa Aprovada! 🎉';
            notifMessage = `Sua tarefa do módulo "${updatedSubmission.Module.title}" foi aprovada!`;
            notifType = 'SUCCESS';
        } else {
            notifTitle = 'Ajuste Solicitado ⚠️';
            notifMessage = `O mentor solicitou ajustes na tarefa de "${updatedSubmission.Module.title}".`;
            notifType = 'WARNING';
        }

        await prisma.notification.create({
            data: {
                userId: updatedSubmission.userId,
                title: notifTitle,
                message: notifMessage,
                type: notifType,
                link: `/modulo/${updatedSubmission.moduleId}`
            }
        });


        // 2. Se Aprovado, libera o módulo como COMPLETED
        if (newStatus === 'APPROVED') {
            const access = await prisma.userModuleAccess.findFirst({
                where: {
                    userId: updatedSubmission.userId,
                    moduleId: updatedSubmission.moduleId
                }
            });

            if (access) {
                await prisma.userModuleAccess.update({
                    where: { id: access.id },
                    data: { status: 'COMPLETED' }
                });
            }
        }

        return NextResponse.json({ success: true, data: updatedSubmission });

    } catch (error) {
        console.error("Erro ao avaliar submissão:", error);
        return NextResponse.json({ error: "Erro interno ao avaliar." }, { status: 500 });
    }
}
