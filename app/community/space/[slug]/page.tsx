import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { SpaceView } from "@/components/Community/SpaceView";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

interface SpacePageProps {
    params: {
        slug: string;
    };
    searchParams: {
        sort?: string;
    };
}

export default async function SpacePage({ params, searchParams }: SpacePageProps) {
    const { slug } = await params;
    const { sort } = await searchParams;
    
    const sortOrder = sort === 'oldest' ? 'asc' : 'desc';

    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll() }
            }
        }
    );
    const { data: { user: authUser } } = await supabase.auth.getUser();

    const space = await prisma.space.findUnique({
        where: { slug },
        include: {
            posts: {
                orderBy: [
                    { isPinned: 'desc' },
                    { createdAt: sortOrder }
                ],
                include: {
                    author: { select: { id: true, name: true, avatarUrl: true } },
                    likes: {
                        where: { userId: authUser?.id || '' }
                    },
                    _count: {
                        select: {
                            comments: true,
                            likes: true
                        }
                    }
                }
            }
        }
    });

    if (!space) {
        notFound();
    }

    return (
        <div className="min-h-full">
            <SpaceView space={space} />
        </div>
    );
}
