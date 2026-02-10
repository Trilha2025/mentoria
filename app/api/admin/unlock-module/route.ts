// Arquivo: /app/api/admin/unlock-module/route.ts
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { userId, moduleId } = await req.json();

        if (!userId || !moduleId) {
            return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
        }

        // Upsert garante que se já existir um registro (ex: LOCKED), ele atualiza. Se não, cria.
        const access = await prisma.userModuleAccess.upsert({
            where: {
                userId_moduleId: {
                    userId,
                    moduleId
                }
            },
            update: {
                status: 'UNLOCKED'
            },
            create: {
                userId,
                moduleId,
                status: 'UNLOCKED'
            }
        });

        console.log(`[Admin] Módulo ${moduleId} desbloqueado para usuário ${userId}`);

        return NextResponse.json({ success: true, data: access });
    } catch (error) {
        console.error("Erro ao desbloquear módulo:", error);
        return NextResponse.json({ error: "Erro interno ao desbloquear módulo." }, { status: 500 });
    }
}
