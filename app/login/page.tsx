'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        checkUser();
    }, []);

    const checkUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            const { data: profile } = await supabase
                .from('User')
                .select('role')
                .eq('email', session.user.email)
                .single();

            if (profile) {
                if (profile.role === 'ADMIN') window.location.href = '/admin/team';
                else if (profile.role === 'MENTOR') window.location.href = '/admin/mentoria';
                else if (profile.role === 'SUPPORT') window.location.href = '/support';
                else window.location.href = '/dashboard';
            }
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { data, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (authError) {
            if (authError.message.includes("Email not confirmed")) {
                setError("Por favor, confirme seu email antes de entrar. (Ou desative a confirmação no painel do Supabase)");
            } else if (authError.message.includes("Invalid login")) {
                setError("Email ou senha incorretos.");
            } else {
                setError(authError.message);
            }
            setLoading(false);
        } else {
            if (data?.user) {
                try {
                    const { data: profile, error: profileError } = await supabase
                        .from('User')
                        .select('role')
                        .eq('email', email)
                        .single();

                    if (profileError) {
                        console.error("Erro ao buscar perfil:", profileError);
                        window.location.href = '/dashboard';
                        return;
                    }

                    if (profile) {
                        if (profile.role === 'ADMIN') {
                            window.location.href = '/admin/team';
                        } else if (profile.role === 'MENTOR') {
                            window.location.href = '/admin/mentoria';
                        } else if (profile.role === 'SUPPORT') {
                            window.location.href = '/support';
                        } else {
                            // Mentee
                            window.location.href = '/dashboard';
                        }
                    } else {
                        window.location.href = '/dashboard';
                    }
                } catch (err) {
                    console.error("Erro ao buscar perfil:", err);
                    window.location.href = '/dashboard';
                }
            }
        }
        setLoading(false);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background transition-colors duration-300">
            <div className="p-8 bg-trenchy-card shadow-xl rounded-2xl w-full max-w-md border border-trenchy-border">
                <h1 className="text-2xl font-bold mb-2 text-center text-trenchy-text-primary">Bem-vindo</h1>
                <p className="text-trenchy-text-secondary text-center mb-8 text-sm">Insira suas credenciais para continuar.</p>

                <form className="space-y-5" onSubmit={handleLogin}>
                    <div>
                        <label className="block text-sm font-medium text-trenchy-text-primary mb-1">Email</label>
                        <input
                            type="email"
                            name="email"
                            autoComplete="email"
                            placeholder="seu@email.com"
                            className="w-full p-3 bg-background border border-trenchy-border rounded-lg focus:ring-2 focus:ring-trenchy-orange focus:border-trenchy-orange outline-none transition text-trenchy-text-primary placeholder-gray-500"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-trenchy-text-primary mb-1">Senha</label>
                        <input
                            type="password"
                            name="password"
                            autoComplete="current-password"
                            placeholder="••••••••"
                            className="w-full p-3 bg-background border border-trenchy-border rounded-lg focus:ring-2 focus:ring-trenchy-orange focus:border-trenchy-orange outline-none transition text-trenchy-text-primary placeholder-gray-500"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && <div className="p-3 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg text-center border border-red-200 dark:border-red-500/30">{error}</div>}

                    <button
                        type="submit"
                        className="w-full bg-trenchy-orange text-white p-3 rounded-lg font-bold hover:bg-orange-600 transition shadow-lg shadow-orange-900/20"
                        disabled={loading}
                    >
                        {loading ? 'Entrando...' : 'Entrar'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <a href="#" className="text-xs text-trenchy-text-secondary hover:text-trenchy-text-primary transition">Esqueceu sua senha?</a>
                </div>
            </div>
        </div>
    );
}
