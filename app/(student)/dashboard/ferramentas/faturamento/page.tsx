'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
    CurrencyDollarIcon, 
    ShoppingCartIcon, 
    ArrowPathIcon, 
    LinkIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
    BuildingStorefrontIcon,
    PresentationChartLineIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { 
    LineChart, 
    Line, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer, 
    AreaChart, 
    Area,
    Legend
} from 'recharts';

type TabType = 'GERAL' | 'MERCADOLIVRE' | 'SHOPEE';

export default function FaturamentoPage() {
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('GERAL');
    const [mlConnected, setMlConnected] = useState(false);
    const [shopeeConnected, setShopeeConnected] = useState(false);
    const [revenueData, setRevenueData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        init();
    }, []);

    useEffect(() => {
        if (userId) {
            fetchRevenue(userId, activeTab);
        }
    }, [activeTab, userId]);

    const init = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: dbUser } = await supabase
                .from('User')
                .select('id')
                .eq('email', user.email)
                .single();

            if (!dbUser) return;
            setUserId(dbUser.id);

            const { data: connections } = await supabase
                .from('PlatformConnection')
                .select('platform')
                .eq('userId', dbUser.id);

            if (connections) {
                setMlConnected(connections.some(c => c.platform === 'MERCADOLIVRE'));
                setShopeeConnected(connections.some(c => c.platform === 'SHOPEE'));
            }
        } catch (err) {
            console.error('Error init:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchRevenue = async (uid: string, tab: TabType) => {
        try {
            setLoading(true);
            setError(null);

            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

            // Mapping tab to platform param for the Edge Function
            const platform = tab === 'GERAL' ? 'geral' : tab.toLowerCase();

            const response = await fetch(`${supabaseUrl}/functions/v1/get-total-revenue`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${supabaseAnonKey}`,
                },
                body: JSON.stringify({ 
                    platform, 
                    userId: uid, 
                    dateRange: { 
                        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), 
                        to: new Date().toISOString() 
                    } 
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || errorData.error || `Erro ${response.status}`);
            }

            const data = await response.json();
            setRevenueData(data);
        } catch (err: any) {
            console.error('Error fetching revenue:', err);
            setError(err.message || 'Erro ao carregar dados');
        } finally {
            setLoading(false);
        }
    };

    // Prepare chart data with localized dates
    const chartData = revenueData?.dailyData?.map((item: any) => ({
        ...item,
        formattedDate: new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    })) || [];

    return (
        <main className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-7xl mx-auto space-y-8 pb-20">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-trenchy-orange/10 rounded-2xl">
                            <PresentationChartLineIcon className="h-8 w-8 text-trenchy-orange" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-trenchy-text-primary tracking-tight">Business Intelligence</h1>
                            <p className="text-trenchy-text-secondary mt-1">Soma geral e desempenho por canal de venda.</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => userId && fetchRevenue(userId, activeTab)}
                            className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-trenchy-text-secondary hover:text-white hover:bg-white/10 transition-all flex items-center gap-2 text-sm font-medium"
                        >
                            <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            Atualizar
                        </button>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="flex p-1.5 bg-black/30 backdrop-blur-md rounded-2xl border border-white/5 w-fit">
                    <TabButton 
                        active={activeTab === 'GERAL'} 
                        onClick={() => setActiveTab('GERAL')}
                        label="Soma Geral"
                        icon={BuildingStorefrontIcon}
                    />
                    <TabButton 
                        active={activeTab === 'MERCADOLIVRE'} 
                        onClick={() => setActiveTab('MERCADOLIVRE')}
                        label="Mercado Livre"
                        icon={ShoppingCartIcon}
                        color="group-hover:text-[#FFE600]"
                        activeColor="text-[#FFE600]"
                    />
                    <TabButton 
                        active={activeTab === 'SHOPEE'} 
                        onClick={() => setActiveTab('SHOPEE')}
                        label="Shopee"
                        icon={ShoppingCartIcon}
                        color="group-hover:text-[#EE4D2D]"
                        activeColor="text-[#EE4D2D]"
                    />
                </div>

                {/* Content Section */}
                {loading && !revenueData ? (
                    <div className="flex flex-col items-center justify-center py-40 space-y-4">
                        <div className="w-16 h-16 border-4 border-trenchy-orange/20 border-t-trenchy-orange rounded-full animate-spin" />
                        <p className="text-trenchy-text-secondary animate-pulse">Sincronizando dados...</p>
                    </div>
                ) : (
                    <div className="space-y-8 animate-in fade-in duration-1000">
                        {/* Metrics Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <MetricCard 
                                title="Faturamento Total" 
                                value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(revenueData?.revenue || 0)}
                                subValue={`${chartData.length} dias de análise`}
                                icon={CurrencyDollarIcon}
                                color="text-green-400"
                                trend="+12.5%"
                            />
                            <MetricCard 
                                title="Volume de Pedidos" 
                                value={revenueData?.totalOrders?.toString() || '0'}
                                subValue="Conversão otimizada"
                                icon={ShoppingCartIcon}
                                color="text-white"
                                trend="+5.2%"
                            />
                            <MetricCard 
                                title="Ticket Médio" 
                                value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(revenueData?.revenue / (revenueData?.totalOrders || 1) || 0)}
                                subValue="Valor por venda"
                                icon={LinkIcon}
                                color="text-blue-400"
                            />
                        </div>

                        {/* Chart Area */}
                        <div className="bg-trenchy-card border border-trenchy-border p-6 rounded-3xl shadow-2xl relative overflow-hidden">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-xl font-bold text-trenchy-text-primary">Evolução Diária</h3>
                                    <p className="text-sm text-trenchy-text-secondary mt-1">Comparativo de performance entre plataformas</p>
                                </div>
                                <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-trenchy-orange"></div>
                                        <span className="text-trenchy-text-secondary">ML</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-[#EE4D2D]"></div>
                                        <span className="text-trenchy-text-secondary">Shopee</span>
                                    </div>
                                </div>
                            </div>

                            <div className="h-[400px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorMl" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                                            </linearGradient>
                                            <linearGradient id="colorShopee" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#EE4D2D" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#EE4D2D" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                                        <XAxis 
                                            dataKey="formattedDate" 
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                                            dy={10}
                                        />
                                        <YAxis 
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                                            tickFormatter={(value) => `R$ ${value}`}
                                        />
                                        <Tooltip 
                                            contentStyle={{ 
                                                backgroundColor: '#0f172a', 
                                                border: '1px solid #ffffff10',
                                                borderRadius: '16px',
                                                color: '#f8fafc'
                                            }}
                                            itemStyle={{ fontSize: '12px' }}
                                        />
                                        <Area 
                                            type="monotone" 
                                            dataKey="ml" 
                                            stroke="#f97316" 
                                            strokeWidth={3}
                                            fillOpacity={1} 
                                            fill="url(#colorMl)" 
                                            name="Mercado Livre"
                                        />
                                        <Area 
                                            type="monotone" 
                                            dataKey="shopee" 
                                            stroke="#EE4D2D" 
                                            strokeWidth={3}
                                            fillOpacity={1} 
                                            fill="url(#colorShopee)" 
                                            name="Shopee"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Integration Status / Call to Action */}
                        {(activeTab === 'MERCADOLIVRE' && !mlConnected) && (
                            <IntegrationCTA 
                                platform="Mercado Livre" 
                                color="[#FFE600]" 
                                href="/dashboard/integracao/mercado-livre" 
                            />
                        )}
                        {(activeTab === 'SHOPEE' && !shopeeConnected) && (
                            <IntegrationCTA 
                                platform="Shopee" 
                                color="[#EE4D2D]" 
                                href="/dashboard/integracao/shopee" 
                            />
                        )}
                        {(activeTab === 'GERAL' && !mlConnected && !shopeeConnected) && (
                            <div className="bg-amber-500/10 border border-amber-500/20 p-10 rounded-3xl flex flex-col items-center text-center space-y-6">
                                <div className="p-4 bg-amber-500/20 rounded-full">
                                    <ExclamationTriangleIcon className="h-10 w-10 text-amber-500" />
                                </div>
                                <div>
                                    <h4 className="text-2xl font-bold text-trenchy-text-primary">Nenhuma Integração Ativa</h4>
                                    <p className="text-trenchy-text-secondary mt-2 max-w-md mx-auto leading-relaxed">
                                        Conecte suas contas para ativar o BI e visualizar a soma geral de faturamento automatizada.
                                    </p>
                                </div>
                                <Link 
                                    href="/dashboard/integracao/mercado-livre"
                                    className="px-10 py-3 bg-trenchy-orange text-white rounded-xl font-bold hover:scale-105 transition-all shadow-xl shadow-orange-900/30"
                                >
                                    Começar Configuração
                                </Link>
                            </div>
                        )}
                    </div>
                )}

                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400">
                        <ExclamationTriangleIcon className="h-5 w-5" />
                        <p className="text-sm font-medium">{error}</p>
                    </div>
                )}
            </div>
        </main>
    );
}

function TabButton({ active, onClick, label, icon: Icon, color = "group-hover:text-trenchy-text-primary", activeColor = "text-white" }: any) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-3 px-8 py-3.5 rounded-xl text-sm font-bold transition-all group ${
                active 
                ? 'bg-trenchy-card border border-trenchy-border text-white shadow-xl scale-[1.02]' 
                : `text-trenchy-text-secondary hover:bg-white/5`
            }`}
        >
            <Icon className={`h-5 w-5 transition-colors ${active ? activeColor : `text-gray-500 ${color}`}`} />
            {label}
        </button>
    );
}

function MetricCard({ title, value, subValue, icon: Icon, color, trend }: any) {
    return (
        <div className="bg-trenchy-card border border-trenchy-border p-7 rounded-3xl space-y-4 hover:border-trenchy-orange/40 transition-all group shadow-sm hover:shadow-trenchy-orange/5">
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                    <span className="text-sm font-bold text-trenchy-text-secondary uppercase tracking-tight">{title}</span>
                    {trend && (
                        <span className="text-[10px] font-black text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full w-fit">
                            {trend}
                        </span>
                    )}
                </div>
                <div className={`p-2.5 bg-white/5 rounded-xl`}>
                    <Icon className={`h-6 w-6 ${color} opacity-80 group-hover:scale-110 transition-transform`} />
                </div>
            </div>
            <div className="space-y-1">
                <h4 className={`text-3xl font-black tracking-tighter text-trenchy-text-primary ${color}`}>{value}</h4>
                <p className="text-xs text-trenchy-text-secondary/60 font-medium">{subValue}</p>
            </div>
        </div>
    );
}

function IntegrationCTA({ platform, color, href }: any) {
    return (
        <div className={`bg-trenchy-card border border-trenchy-border p-10 rounded-3xl flex flex-col lg:flex-row items-center justify-between gap-8 overflow-hidden relative group`}>
            <div className="relative z-10 flex items-center gap-6 text-center lg:text-left flex-col lg:flex-row">
                <div className={`p-5 bg-${color}/10 rounded-3xl border border-white/5`}>
                    <ShoppingCartIcon className={`h-10 w-10 text-${color}`} />
                </div>
                <div>
                    <h3 className="text-2xl font-black text-trenchy-text-primary tracking-tight">Conecte sua conta {platform}</h3>
                    <p className="text-trenchy-text-secondary mt-1 max-w-md">Importação de dados criptografada e segura para gerar seus relatórios de BI.</p>
                </div>
            </div>
            <Link 
                href={href}
                className="relative z-10 px-10 py-4 bg-trenchy-orange text-white rounded-xl font-bold hover:scale-105 transition-all shadow-xl shadow-orange-900/40 active:scale-95 text-lg min-w-[200px] text-center"
            >
                Conectar Agora
            </Link>
            <div className={`absolute -bottom-20 -right-20 w-60 h-60 bg-${color}/5 rounded-full blur-[80px] group-hover:bg-${color}/10 transition-colors`} />
        </div>
    );
}
