// Arquivo: /app/api/setup-users/route.ts
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { email, role, name, businessData } = await req.json();

        if (!email || !role) {
            return NextResponse.json({ error: "Email e Role obrigatórios." }, { status: 400 });
        }

        // Upsert garante que se o usuário já existir no banco (atrelado ao Auth),
        // ele apenas atualiza o ROLE para o correto.
        // O ID do Auth User não temos acesso direto aqui sem a Service Key,
        // mas vamos confiar que o `email` é único e usar `upsert` baseada nele se possível.

        // O Prisma schema define `email` como @unique.
        const user = await prisma.user.upsert({
            where: { email },
            update: {
                role,
                name,
                businessData
            },
            create: {
                email,
                role,
                name,
                businessData
            }
        });

        return NextResponse.json({ success: true, data: user });

    } catch (error) {
        console.error("Erro no setup de usuário:", error);
        return NextResponse.json({ error: "Erro ao configurar usuário." }, { status: 500 });
    }
}
