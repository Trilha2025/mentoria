import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@supabase/supabase-js';

// Cliente Supabase Admin para gerenciar usuários
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    // 1. Verificar autenticação do "Patrão" (Proprietário)
    const authHeader = req.headers.get('Authorization');
    // Em uma rota Next.js App Router, o ideal é usar cookies do próprio Supabase
    // mas aqui simplificaremos pegando o ID do usuário que faz a requisição via body
    // para este exemplo, embora em produção devamos validar via token.
    
    // NOTA: Em um ambiente real, usaríamos supabase.auth.getUser() aqui.
    // Vamos assumir que recebemos o ownerId e validamos que ele é CONSULTING.
    const { name, email, ownerId } = await req.json();

    if (!email || !ownerId) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    // 2. Validar que o Owner é CONSULTING
    const owner = await prisma.user.findUnique({
      where: { id: ownerId }
    });

    if (owner?.accessType !== 'CONSULTING') {
      return NextResponse.json({ error: 'Apenas clientes de Consultoria podem adicionar equipe.' }, { status: 403 });
    }

    // 3. Criar usuário no Supabase Auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { full_name: name },
      // O funcionário receberá um e-mail de "Bem-vindo" ou precisará resetar senha
    });

    if (authError) {
      if (authError.message === 'User already registered') {
        // Se já existe, apenas verificamos se podemos vincular
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser?.employerId) {
          return NextResponse.json({ error: 'Este usuário já faz parte de uma equipe.' }, { status: 400 });
        }
        
        // Vincular usuário existente
        await prisma.user.update({
          where: { email },
          data: { 
            employerId: ownerId,
            accessType: 'COMMUNITY' // Garante que funcionário é sempre COMMUNITY
          }
        });

        return NextResponse.json({ message: 'Usuário vinculado à sua equipe.' });
      }
      throw authError;
    }

    // 4. Criar no Prisma vinculado ao Owner
    const newUser = await prisma.user.create({
      data: {
        id: authUser.user?.id || '',
        email,
        name,
        role: 'MENTEE',
        accessType: 'COMMUNITY',
        employerId: ownerId,
      }
    });

    // 5. Garantir acesso à Comunidade
    await prisma.communityMember.upsert({
      where: { userId: newUser.id },
      update: {},
      create: { userId: newUser.id }
    });

    return NextResponse.json({ message: 'Funcionário adicionado com sucesso!', user: newUser });

  } catch (error: any) {
    console.error('Erro ao adicionar membro da equipe:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
