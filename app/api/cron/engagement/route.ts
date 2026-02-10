import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Simulação de envio de mensagem (Placeholder)
const sendWhatsApp = (phone: string, message: string) => {
    console.log(`[WhatsApp] Para: ${phone} | Msg: ${message}`);
};

const sendEmail = (email: string, subject: string, message: string) => {
    console.log(`[Email] Para: ${email} | Assunto: ${subject} | Msg: ${message}`);
};

export async function GET() {
    try {
        const today = new Date();
        const threeDaysAgo = new Date(today.setDate(today.getDate() - 3));

        // Busca usuários inativos há mais de 3 dias
        const inactiveUsers = await prisma.user.findMany({
            where: {
                lastAccess: {
                    lt: threeDaysAgo
                }
            },
            include: {
                modulesAccess: {
                    where: { status: 'UNLOCKED' },
                    include: { module: true }
                }
            }
        });

        const results = inactiveUsers.map((user: any) => {
            const currentModule = user.modulesAccess[0]?.module.title || "Início";
            const daysInactive = Math.floor((Date.now() - new Date(user.lastAccess).getTime()) / (1000 * 60 * 60 * 24));

            const message = `Olá ${user.name}, notamos que você parou no módulo ${currentModule}. Esse ponto é crucial para destravar seu crescimento. Vamos retomar hoje?`;

            if (daysInactive >= 7) {
                // Canal principal (WhatsApp) para inatividade crítica
                sendWhatsApp(user.email, message); // Usando email como placeholder de telefone se não houver campo phone
                return { user: user.name, channel: 'WhatsApp', daysInactive };
            } else {
                // Backup (Email) para lembretes leves
                sendEmail(user.email, "Sentimos sua falta!", message);
                return { user: user.name, channel: 'Email', daysInactive };
            }
        });

        return NextResponse.json({
            success: true,
            processed: results.length,
            details: results
        });

    } catch (error) {
        console.error('Erro no Cron Job:', error);
        return NextResponse.json({ success: false, error: 'Falha ao processar engajamento' }, { status: 500 });
    }
}
