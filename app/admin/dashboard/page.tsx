'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AdminStats } from '@/components/Dashboard/AdminStats';
import Link from 'next/link';
import { UserGroupIcon, RectangleStackIcon, AcademicCapIcon } from '@heroicons/react/24/outline';

export default function AdminDashboardPage() {
    const [stats, setStats] = useState({
        newStudents: 0,
        revenue: 'R$ 0',
        modules: 0,
        engagement: '0%'
    });
    const [loading, setLoading] = useState(true);
    const [recentUsers, setRecentUsers] = useState<any[]>([]);

    useEffect(() => {
        fetchAdminData();
    }, []);

    const fetchAdminData = async () => {
        try {
            // 1. New Students (Last 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const { count: newStudentsCount } = await supabase
                .from('User')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'MENTEE')
                .gte('createdAt', thirtyDaysAgo.toISOString());

            // 2. Total Modules
            const { count: modulesCount } = await supabase
                .from('Module')
                .select('*', { count: 'exact', head: true });

            // 3. Revenue (Mock logic for now, or sum businessData if structured)
            // Vamos somar revenue declarado se possível, senão count mock
            const { data: revenueData } = await supabase
                .from('User')
                .select('businessData')
                .eq('role', 'MENTEE');

            let totalRev = 0;
            revenueData?.forEach((u: any) => {
                const rev = u.businessData?.currentRevenue;
                if (rev) {
                    // Tenta limpar string "R$ 1.000,00" -> 1000.00
                    const num = parseFloat(rev.replace(/[^0-9,-]+/g, "").replace(",", "."));
                    if (!isNaN(num)) totalRev += num;
                }
            });

            // 4. Engagement (Active in last 7 days / Total Mentees)
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const { count: activeCount } = await supabase
                .from('User')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'MENTEE')
                .gte('lastAccess', sevenDaysAgo.toISOString());

            const { count: totalMentees } = await supabase
                .from('User')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'MENTEE');

            const engagementRate = totalMentees ? Math.round((activeCount || 0) / totalMentees * 100) : 0;

            setStats({
                newStudents: newStudentsCount || 0,
                revenue: totalRev.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                modules: modulesCount || 0,
                engagement: `${engagementRate}%`
            });

            // 5. Recent Users
            const { data: users } = await supabase
                .from('User')
                .select('id, name, email, createdAt, role')
                .order('createdAt', { ascending: false })
                .limit(5);

            setRecentUsers(users || []);

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-trenchy-text-primary">Control Room</h1>
                <p className="text-trenchy-text-secondary mt-2">Visão macro da operação.</p>
            </header>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-trenchy-orange"></div>
                </div>
            ) : (
                <>
                    <AdminStats
                        newStudentsCount={stats.newStudents}
                        totalRevenue={stats.revenue}
                        activeModulesCount={stats.modules}
                        engagementRate={stats.engagement}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Recent Activity / New Users */}
                        <div className="bg-trenchy-card border border-trenchy-border rounded-xl p-6">
                            <h3 className="font-bold text-lg text-trenchy-text-primary mb-4">Últimos Cadastros</h3>
                            <div className="space-y-4">
                                {recentUsers.map(user => (
                                    <div key={user.id} className="flex items-center justify-between border-b border-trenchy-border pb-2 last:border-0 last:pb-0">
                                        <div>
                                            <p className="text-sm font-bold text-trenchy-text-primary">{user.name || 'Sem nome'}</p>
                                            <p className="text-xs text-trenchy-text-secondary">{user.email}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${user.role === 'MENTEE' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                                                {user.role}
                                            </span>
                                            <p className="text-[10px] text-gray-500 mt-1">
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-trenchy-card border border-trenchy-border rounded-xl p-6">
                            <h3 className="font-bold text-lg text-trenchy-text-primary mb-4">Atalhos do Admin</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <Link href="/admin/team" className="p-4 bg-black/5 dark:bg-white/5 rounded-lg hover:bg-trenchy-orange/10 hover:border-trenchy-orange border border-transparent transition text-center group flex flex-col items-center justify-center">
                                    <UserGroupIcon className="h-8 w-8 mb-2 text-trenchy-text-secondary group-hover:text-trenchy-orange transition-colors" />
                                    <span className="text-sm font-bold text-trenchy-text-primary">Gerir Equipe</span>
                                </Link>
                                <Link href="/admin/modules" className="p-4 bg-black/5 dark:bg-white/5 rounded-lg hover:bg-trenchy-orange/10 hover:border-trenchy-orange border border-transparent transition text-center group flex flex-col items-center justify-center">
                                    <RectangleStackIcon className="h-8 w-8 mb-2 text-trenchy-text-secondary group-hover:text-trenchy-orange transition-colors" />
                                    <span className="text-sm font-bold text-trenchy-text-primary">Módulos</span>
                                </Link>
                                <Link href="/admin/mentoria" className="p-4 bg-black/5 dark:bg-white/5 rounded-lg hover:bg-trenchy-orange/10 hover:border-trenchy-orange border border-transparent transition text-center group flex flex-col items-center justify-center">
                                    <AcademicCapIcon className="h-8 w-8 mb-2 text-trenchy-text-secondary group-hover:text-trenchy-orange transition-colors" />
                                    <span className="text-sm font-bold text-trenchy-text-primary">Mentoria</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
