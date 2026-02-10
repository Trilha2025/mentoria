import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
    try {
        const { currentPassword, newPassword } = await req.json();

        if (!currentPassword || !newPassword) {
            return NextResponse.json({ success: false, error: 'Senhas obrigatórias' }, { status: 400 });
        }

        if (newPassword.length < 6) {
            return NextResponse.json({ success: false, error: 'A nova senha deve ter pelo menos 6 caracteres' }, { status: 400 });
        }

        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() { return cookieStore.getAll(); },
                    setAll(cookiesToSet) { try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch { } },
                },
            }
        );

        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !user.email) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        // 1. Verify current password by trying to sign in (or re-authenticate)
        // Since we are already logged in, we can try to updateUser with password which requires re-authentication or we can just try to signInWithPassword
        // However, Supabase Admin API doesn't expose easy "verifyCurrentPassword".
        // The common pattern is to try to signOut and signIn, or use specific endpoint if available.
        // Actually, supabase.auth.updateUser({ password: newPassword }) DOES NOT require current password if the user has an active session!
        // BUT the user REQUESTED "with validation of previous".
        // SO we must verify the current password first.
        // We can do this by attempting a signIn with the current email and provided currentPassword.

        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: user.email,
            password: currentPassword
        });

        if (signInError) {
            return NextResponse.json({ success: false, error: 'Senha atual incorreta' }, { status: 400 });
        }

        // 2. If successful, update the password
        const { error: updateError } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (updateError) {
            return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
