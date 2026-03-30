
import { prisma } from "@/lib/prisma";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MemberManagement } from "@/components/Community/Settings/MemberManagement";

export default async function CommunitySettingsPage() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll() },
            }
        }
    );

    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user?.email) {
        redirect("/login");
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { communityMember: true }
    });

    if (!user || !user.communityMember) {
        redirect("/community");
    }

    const { role } = user.communityMember;

    if (role !== 'ADMIN' && role !== 'MODERATOR') {
        redirect("/community");
    }

    // Fetch ADMIN, MENTOR, SUPPORT for management
    const allMembers = await prisma.communityMember.findMany({
        where: {
            user: {
                role: {
                    in: ['ADMIN', 'MENTOR', 'SUPPORT']
                }
            }
        },
        include: {
            user: {
                select: {
                    name: true,
                    email: true,
                    avatarUrl: true,
                    role: true // Include platform role to display
                }
            }
        },
        orderBy: { joinedAt: 'desc' }
    });

    return (
        <div className="max-w-4xl mx-auto py-8">
            <h1 className="text-2xl font-bold mb-6 text-trenchy-text-primary">Configurações da Comunidade</h1>

            <div className="bg-trenchy-card border border-trenchy-border rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4 text-trenchy-text-primary">Gerenciar Membros</h2>
                <p className="text-sm text-trenchy-text-secondary mb-6">
                    Visualize todos os membros da comunidade e gerencie suas permissões.
                </p>

                <MemberManagement members={allMembers} />
            </div>
        </div>
    );
}
