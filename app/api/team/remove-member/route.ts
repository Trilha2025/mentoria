import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(req: Request) {
  try {
    const { userId, ownerId } = await req.json();

    if (!userId || !ownerId) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    // 1. Validar que o Owner é CONSULTING e é realmente o Employer
    const member = await prisma.user.findUnique({
      where: { id: userId },
      select: { employerId: true }
    });

    if (member?.employerId !== ownerId) {
      return NextResponse.json({ error: 'Você não tem permissão para remover este membro.' }, { status: 403 });
    }

    // 2. Desvincular ou desativar acesso
    // Vamos apenas desvincular o Employer ID por enquanto, ou remover o acesso Mentoria
    await prisma.user.update({
      where: { id: userId },
      data: { 
        employerId: null,
        // Opcional: accessType: 'COMMUNITY' (já era)
      }
    });

    return NextResponse.json({ message: 'Membro removido da sua equipe com sucesso.' });

  } catch (error: any) {
    console.error('Erro ao remover membro da equipe:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
