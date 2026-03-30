'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
    ShoppingCartIcon, 
    ExclamationTriangleIcon,
    CheckCircleIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useSearchParams, useRouter } from 'next/navigation';

import { Suspense } from 'react';

export default function ShopeeIntegrationPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <ArrowPathIcon className="h-12 w-12 text-trenchy-orange animate-spin" />
                <p className="text-trenchy-text-secondary text-sm">Carregando integração...</p>
            </div>
        }>
            <ShopeeIntegrationContent />
        </Suspense>
    );
}

function ShopeeIntegrationContent() {
    const [loading, setLoading] = useState(true);
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [connecting, setConnecting] = useState(false);
    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        const code = searchParams.get('code');
        const shopId = searchParams.get('shop_id');
        
        if (code && shopId) {
            handleCallback(code, shopId);
        } else {
            checkConnection();
        }
    }, [searchParams]);

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
                .eq('platform', 'SHOPEE')
                .single();

            setConnected(!!connection);
        } catch (err) {
            console.error('Error checking connection:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCallback = async (code: string, shopId: string) => {
        setConnecting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Usuário não autenticado');

            const { data: dbUser } = await supabase
                .from('User')
                .select('id')
                .eq('email', user.email)
                .single();

            if (!dbUser) throw new Error('Usuário não encontrado no banco');

            const { data, error: exchangeError } = await supabase.functions.invoke('shopee-exchange-token', {
                body: { code, shopId, userId: dbUser.id }
            });

            if (exchangeError || data?.error) {
                throw new Error(exchangeError?.message || data?.error || 'Erro ao trocar token');
            }

            setConnected(true);
            // Clear URL params
            router.replace('/dashboard/integracao/shopee');
        } catch (err: any) {
            console.error('Error in callback:', err);
            setError(err.message);
        } finally {
            setConnecting(false);
            setLoading(false);
        }
    };

    const handleConnect = async () => {
        setLoading(true);
        setError(null);
        try {
            const redirectUri = window.location.origin + window.location.pathname;
            
            const { data, error: authError } = await supabase.functions.invoke('generate-shopee-auth-url', {
                body: { redirectUri }
            });

            if (authError || data?.error) {
                throw new Error(authError?.message || data?.error || 'Erro ao gerar URL de autorização');
            }

            if (data?.authUrl) {
                window.location.href = data.authUrl;
            }
        } catch (err: any) {
            console.error('Error starting connection:', err);
            setError(err.message || 'Erro ao iniciar conexão');
            setLoading(false);
        }
    };

    if (connecting) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <ArrowPathIcon className="h-12 w-12 text-trenchy-orange animate-spin" />
                <h2 className="text-xl font-bold text-trenchy-text-primary">Finalizando conexão com a Shopee...</h2>
                <p className="text-trenchy-text-secondary text-sm">Aguarde um momento enquanto vinculamos sua loja.</p>
            </div>
        );
    }

    return (
        <main className="flex-1 p-6">
            <div className="max-w-4xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-trenchy-text-primary">Integração Shopee</h1>
                    <p className="text-trenchy-text-secondary mt-1">Conecte sua conta para importar vendas e métricas.</p>
                </div>

                <div className="bg-trenchy-card border border-trenchy-border p-8 rounded-2xl relative overflow-hidden group">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="p-4 bg-[#EE4D2D]/10 rounded-2xl">
                                <ShoppingCartIcon className="h-8 w-8 text-[#EE4D2D]" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-trenchy-text-primary">Status da Conexão</h3>
                                {connected ? (
                                    <div className="flex items-center gap-2 text-green-400 mt-1">
                                        <CheckCircleIcon className="h-5 w-5" />
                                        <span>Loja conectada com sucesso</span>
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
                                    : 'bg-[#EE4D2D] text-white shadow-lg shadow-red-900/20 hover:scale-105 active:scale-95'
                                }`}
                            >
                                {loading ? (
                                    <ArrowPathIcon className="h-5 w-5 animate-spin" />
                                ) : connected ? (
                                    'Reconectar Loja'
                                ) : (
                                    'Conectar Shopee'
                                )}
                            </button>
                        </div>
                    </div>
                    
                    <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-[#EE4D2D]/5 rounded-full blur-3xl" />
                </div>

                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400">
                        <ExclamationTriangleIcon className="h-5 w-5" />
                        <p className="text-sm">{error}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                    <BenefitCard 
                        title="Soma Geral no Painel"
                        description="Visualize o faturamento da Shopee somado ao Mercado Livre em tempo real."
                    />
                    <BenefitCard 
                        title="Relatórios de BI"
                        description="Acesse ticket médio, volume de vendas e tendências exclusivas da Shopee."
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
