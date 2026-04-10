import { InterceptedModal } from "@/components/Community/InterceptedModal";
import { PostDetail } from "@/components/Community/PostDetail";
import { prisma } from "@/lib/prisma";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

interface PostModalProps {
    params: {
        id: string;
        slug: string;
    }
}

export default async function FeedPostModal({ params }: PostModalProps) {
    const { id, slug } = await params;
    
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
    const { data: { user } } = await supabase.auth.getUser();

    let dbUser = null;
    if (user?.email) {
        dbUser = await prisma.user.findUnique({
            where: { email: user.email },
            include: {
                likes: true,
                favorites: true,
                following: true
            }
        });
    }

    return (
        <InterceptedModal>
            <PostDetail postId={id} dbUser={dbUser} isModal />
        </InterceptedModal>
    );
}
