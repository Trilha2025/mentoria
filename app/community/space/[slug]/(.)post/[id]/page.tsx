import { prisma } from "@/lib/prisma";
// Force rebuild v2
import { PostDetail } from "@/components/Community/PostDetail";
import { InterceptedModal } from "@/components/Community/InterceptedModal";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

interface PostInterceptProps {
    params: {
        slug: string;
        id: string;
    };
}

export default async function PostInterceptPage({ params }: PostInterceptProps) {
    const { id } = await params;
    
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
    
    const dbUser = authUser?.email ? await prisma.user.findUnique({
        where: { email: authUser.email },
        include: {
            likes: { where: { postId: id } },
            favorites: { where: { postId: id } },
            following: true
        }
    }) : null;

    return (
        <InterceptedModal>
            <PostDetail postId={id} dbUser={dbUser} isModal />
        </InterceptedModal>
    );
}
