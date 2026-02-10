import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // Busca todas as submissões pendentes
        // Inclui dados do usuário e do módulo para contexto
        const submissions = await prisma.documentSubmission.findMany({
            where: {
                status: 'PENDING'
            },
            include: {
                user: {
                    select: { name: true, email: true }
                }
                // Se houver relação com Module, incluiria aqui.
                // Como no schema atual ModuleId é string sem relation explícita em Submission (conferir schema),
                // talvez precisemos ajustar ou buscar separado.
                // O schema diz: `moduleId String` mas não tem `@relation` com `Module`.
                // Vamos assumir que o Admin sabe o módulo pelo ID ou ajustar o schema se der.
                // Para MVP, mostraremos o ID do módulo ou buscaremos o título se possível.
            },
            orderBy: {
                // id: 'desc' // ou createdAt se houver
                // Como não tem createdAt explícito no schema submission, usamos ID
                id: 'desc'
            }
        });

        return NextResponse.json({ success: true, data: submissions });
    } catch (error) {
        console.error("Erro ao buscar submissões:", error);
        return NextResponse.json({ error: "Erro ao buscar pendências." }, { status: 500 });
    }
}
