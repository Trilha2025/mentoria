import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { email, password, name, role } = await req.json();

        // Validação básica
        if (!email || !password || !role) {
            return NextResponse.json({ success: false, error: 'Email, senha e função são obrigatórios.' }, { status: 400 });
        }

        // Cria cliente Supabase com Service Role (Privilégio Admin Total)
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );

        // 1. Cria usuário no Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true // Já confirma o e-mail
        });

        if (authError) {
            console.error("Erro ao criar Auth User:", authError);
            return NextResponse.json({ success: false, error: authError.message }, { status: 400 });
        }

        if (!authData.user) {
            return NextResponse.json({ success: false, error: 'Erro inesperado ao criar usuário.' }, { status: 500 });
        }

        const userId = authData.user.id;

        // 2. Cria registro na tabela Public.User com o Role correto
        // Nota: O trigger handle_new_user pode já ter criado o user como MENTEE.
        // Vamos tentar UPDATE primeiro (upsert) para garantir que o role seja aplicado.

        const { error: dbError } = await supabaseAdmin
            .from('User')
            .upsert({
                id: userId,
                email: email,
                name: name || email.split('@')[0],
                role: role,
                lastAccess: new Date().toISOString()
            });

        if (dbError) {
            console.error("Erro ao criar Public User:", dbError);
            // Se falhar no banco, talvez devêssemos deletar do Auth? Por enquanto, apenas reporta erro.
            return NextResponse.json({ success: false, error: 'Erro ao salvar dados do perfil: ' + dbError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, userId });

    } catch (error: any) {
        console.error("Erro interno:", error);
        return NextResponse.json({ success: false, error: 'Erro interno no servidor.' }, { status: 500 });
    }
}
