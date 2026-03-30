'use client';

import Link from 'next/link';
import { 
    ChevronRightIcon, 
    ShoppingCartIcon
} from '@heroicons/react/24/outline';

export default function IntegracaoPage() {
    const integrations = [
        {
            name: 'Mercado Livre',
            description: 'Conecte sua conta para importar vendas.',
            href: '/dashboard/integracao/mercado-livre',
            icon: <ShoppingCartIcon className="h-6 w-6 text-yellow-500" />,
            badge: 'Recomendado'
        },
        {
            name: 'Shopee',
            description: 'Acompanhe seu faturamento em tempo real.',
            href: '/dashboard/integracao/shopee',
            icon: <ShoppingCartIcon className="h-6 w-6 text-[#EE4D2D]" />,
            badge: 'Beta'
        }
    ];

    return (
        <main className="flex-1 p-6">
            <div className="max-w-7xl mx-auto space-y-8">
                <div>
                    <h1 className="text-2xl font-bold text-trenchy-text-primary">Integrações</h1>
                    <p className="text-sm text-trenchy-text-secondary mt-1">
                        Gerencie as conexões com suas lojas.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {integrations.map((item) => (
                        <Link 
                            key={item.name}
                            href={item.href}
                            className="group flex flex-col p-5 bg-trenchy-card border border-trenchy-border rounded-xl transition-all hover:border-trenchy-orange active:scale-[0.98]"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="p-2 bg-white/5 rounded-lg group-hover:bg-trenchy-orange/10 transition-colors">
                                    {item.icon}
                                </div>
                                <span className="px-2 py-0.5 bg-white/5 text-white/40 text-[9px] font-bold rounded uppercase tracking-wider">
                                    {item.badge}
                                </span>
                            </div>

                            <div className="space-y-1">
                                <h3 className="font-bold text-trenchy-text-primary">{item.name}</h3>
                                <p className="text-xs text-trenchy-text-secondary leading-relaxed">
                                    {item.description}
                                </p>
                            </div>

                            <div className="pt-4 mt-auto flex items-center text-[11px] text-trenchy-orange font-bold uppercase tracking-wide opacity-0 group-hover:opacity-100 transition-opacity">
                                Configurar
                                <ChevronRightIcon className="ml-1 h-3 w-3" />
                            </div>
                        </Link>
                    ))}
                </div>

                <div className="pt-6 border-t border-trenchy-border">
                    <p className="text-[10px] text-trenchy-text-secondary uppercase tracking-widest font-bold mb-3">Em breve</p>
                    <div className="flex gap-4 opacity-50">
                        <span className="text-xs text-trenchy-text-secondary px-3 py-1 bg-white/5 rounded-full border border-white/5">Magalu</span>
                        <span className="text-xs text-trenchy-text-secondary px-3 py-1 bg-white/5 rounded-full border border-white/5">Amazon</span>
                        <span className="text-xs text-trenchy-text-secondary px-3 py-1 bg-white/5 rounded-full border border-white/5">Nuvemshop</span>
                    </div>
                </div>
            </div>
        </main>
    );
}
