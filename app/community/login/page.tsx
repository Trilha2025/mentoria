
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function CommunityLoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { data, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (authError) {
            setError(authError.message);
            setLoading(false);
        } else {
            // Success! The cookie is shared (.lvh.me or .domain.com)
            // Redirect to community home
            window.location.href = '/community';
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-trenchy-bg text-trenchy-text-primary">
            <div className="p-8 bg-trenchy-card border border-trenchy-border rounded-2xl w-full max-w-md shadow-2xl">
                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-gradient-to-br from-trenchy-orange to-orange-600 rounded-xl flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                        C
                    </div>
                    <h1 className="text-2xl font-bold">Entrar na Comunidade</h1>
                    <p className="text-trenchy-text-secondary text-sm mt-2">
                        Faça login com sua conta da Consultoria.
                    </p>
                </div>

                <form className="space-y-5" onSubmit={handleLogin}>
                    <div>
                        <label className="block text-sm font-medium text-trenchy-text-secondary mb-1">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-3 bg-trenchy-bg border border-trenchy-border rounded-lg focus:ring-1 focus:ring-trenchy-orange focus:border-trenchy-orange outline-none transition text-trenchy-text-primary"
                            placeholder="seu@email.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-trenchy-text-secondary mb-1">Senha</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3 bg-trenchy-bg border border-trenchy-border rounded-lg focus:ring-1 focus:ring-trenchy-orange focus:border-trenchy-orange outline-none transition text-trenchy-text-primary"
                            placeholder="••••••••"
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/10 text-red-400 text-sm rounded-lg text-center border border-red-500/20">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-trenchy-orange text-white p-3 rounded-lg font-bold hover:bg-orange-600 transition shadow-lg shadow-orange-900/20 disabled:opacity-50"
                    >
                        {loading ? 'Entrando...' : 'Acessar Comunidade'}
                    </button>
                </form>
            </div>
        </div>
    );
}
