'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
    ShoppingCartIcon, 
    ExclamationTriangleIcon,
    CheckCircleIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';

const ML_CLIENT_ID = "5647657845823420";
const ML_REDIRECT_URI = "https://uvexbrjuiqwjdgqveamy.supabase.co/functions/v1/ml-callback";

// PKCE helpers
async function generatePKCE() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const codeVerifier = btoa(String.fromCharCode(...array))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

    return { codeVerifier, codeChallenge };
}

export default function MercadoLivreIntegrationPage() {
    const [loading, setLoading] = useState(true);
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        checkConnection();
    }, []);

    const checkConnection = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: dbUser } = await supabase
                .from('User')
                .select('id')
                .eq('email', user.email)
                .single();

            if (!dbUser) return;

            const { data: connection } = await supabase
                .from('PlatformConnection')
                .select('platform')
                .eq('userId', dbUser.id)
                .eq('platform', 'MERCADOLIVRE')
                .single();

            setConnected(!!connection);
        } catch (err) {
            console.error('Error checking connection:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: dbUser } = await supabase
                .from('User')
                .select('id')
                .eq('email', user.email)
                .single();

            if (!dbUser) {
                setError('Usuário não encontrado');
                return;
            }

            const { codeVerifier, codeChallenge } = await generatePKCE();
            const state = btoa(JSON.stringify({ userId: dbUser.id, codeVerifier }));

            const authUrl = `https://auth.mercadolivre.com.br/authorization` +
                `?response_type=code` +
                `&client_id=${ML_CLIENT_ID}` +
                `&redirect_uri=${encodeURIComponent(ML_REDIRECT_URI)}` +
                `&code_challenge=${codeChallenge}` +
                `&code_challenge_method=S256` +
                `&state=${encodeURIComponent(state)}`;

            window.location.href = authUrl;
        } catch (err) {
            console.error('Error starting connection:', err);
            setError('Erro ao iniciar conexão');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="flex-1 p-6">
            <div className="max-w-4xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-trenchy-text-primary">Integração Mercado Livre</h1>
                    <p className="text-trenchy-text-secondary mt-1">Conecte sua conta para importar vendas e métricas.</p>
                </div>

                <div className="bg-trenchy-card border border-trenchy-border p-8 rounded-2xl relative overflow-hidden group">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="p-4 bg-[#FFE600]/10 rounded-2xl">
                                <ShoppingCartIcon className="h-8 w-8 text-[#FFE600]" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-trenchy-text-primary">Status da Conexão</h3>
                                {connected ? (
                                    <div className="flex items-center gap-2 text-green-400 mt-1">
                                        <CheckCircleIcon className="h-5 w-5" />
                                        <span>Conta conectada com sucesso</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-trenchy-text-secondary mt-1">
                                        <ExclamationTriangleIcon className="h-5 w-5" />
                                        <span>Nenhuma conta vinculada</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="flex flex-col gap-3">
                            <button 
                                onClick={handleConnect}
                                disabled={loading}
                                className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                                    connected 
                                    ? 'bg-white/5 text-trenchy-text-secondary border border-white/10 hover:bg-white/10' 
                                    : 'bg-trenchy-orange text-white shadow-lg shadow-orange-900/20 hover:scale-105 active:scale-95'
                                }`}
                            >
                                {loading ? (
                                    <ArrowPathIcon className="h-5 w-5 animate-spin" />
                                ) : connected ? (
                                    'Reconectar Conta'
                                ) : (
                                    'Conectar Mercado Livre'
                                )}
                            </button>
                            
                            {connected && (
                                <p className="text-[10px] text-center text-trenchy-text-secondary opacity-50 uppercase tracking-widest font-bold">
                                    Última sincronização: Agora
                                </p>
                            )}
                        </div>
                    </div>
                    
                    <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-[#FFE600]/5 rounded-full blur-3xl" />
                </div>

                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400">
                        <ExclamationTriangleIcon className="h-5 w-5" />
                        <p className="text-sm">{error}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                    <BenefitCard 
                        title="Sincronização Automática"
                        description="Seus dados são atualizados em tempo real conforme as vendas acontecem."
                    />
                    <BenefitCard 
                        title="Métricas Avançadas"
                        description="Acesse ticket médio, conversão e faturamento por categoria."
                    />
                </div>
            </div>
        </main>
    );
}

function BenefitCard({ title, description }: any) {
    return (
        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-2">
            <h4 className="font-bold text-trenchy-text-primary">{title}</h4>
            <p className="text-sm text-trenchy-text-secondary leading-relaxed">{description}</p>
        </div>
    );
}
