import { prisma } from "@/lib/prisma";
import { CommunitySidebar } from "@/components/Community/CommunitySidebar";
import { CommunityHeader } from "@/components/Community/CommunityHeader";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Layout for /app/community
export default async function CommunityLayout({ children }: { children: React.ReactNode }) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll() },
                // removed setAll (SC cannot set cookies)
            }
        }
    );

    const { data: { user } } = await supabase.auth.getUser();
    let isCommunityAdmin = false;
    let communityProfile = null;

    if (user?.email) {
        const dbUser = await prisma.user.findUnique({
            where: { email: user.email },
            include: { communityMember: true }
        });

        if (dbUser) {
            // Auto-join logic: If user exists but no community profile, create one
            if (!dbUser.communityMember) {
                try {
                    communityProfile = await prisma.communityMember.create({
                        data: { userId: dbUser.id, role: 'MEMBER' }
                    });
                } catch (e) {
                    console.error("Error auto-joining community:", e);
                }
            } else {
                communityProfile = dbUser.communityMember;
            }

            // Centralized Admin Logic: Checks Community Role
            isCommunityAdmin = communityProfile?.role === 'ADMIN' || communityProfile?.role === 'MODERATOR';
        }
    }

    const groups = await prisma.spaceGroup.findMany({
        include: {
            spaces: {
                orderBy: { order: 'asc' }
            }
        },
        orderBy: { order: 'asc' }
    });

    return (
        <div className="flex items-start min-h-full">
            {/* Sidebar Sticky */}
            {/* Sidebar Sticky */}
            <div className="sticky top-0 h-screen shrink-0 hidden lg:block overflow-hidden border-r border-trenchy-border/50">
                <CommunitySidebar groups={groups as any} isAdmin={isCommunityAdmin} />
            </div>

            {/* Main Content Area */}
            <main className="flex-1 min-w-0 flex flex-col">
                <CommunityHeader />
                <div className="p-4 md:p-6 block">
                    {children}
                </div>
            </main>
        </div>
    );
}
