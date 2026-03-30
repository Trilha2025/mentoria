import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, {
                            ...options,
                            domain: process.env.NODE_ENV === 'production'
                                ? '.atrilhadoecommerce.com.br'
                                : hostname.includes('localhost')
                                    ? 'localhost'
                                    : hostname.endsWith('.lvh.me') || hostname.includes('.lvh.me:')
                                        ? '.lvh.me'
                                        : undefined,
                            sameSite: 'lax',
                            secure: process.env.NODE_ENV === 'production',
                        })
                    )
                },
            },
        }
    )

    // --- SUBDOMAIN ROUTING (Community) ---
    const hostname = request.headers.get('host') || '';
    const url = request.nextUrl;

    // Check if accessing via 'community' or 'comunidade' subdomain
    // Compatible with local development (comunidade.localhost:3000) and production
    if (hostname.startsWith('community.') || hostname.startsWith('comunidade.')) {
        // Rewrite to /community internal route
        // e.g. community.domain.com/feed -> /community/feed
        // e.g. community.domain.com/ -> /community

        // Prevent rewrite loop if already rewrited (though middleware usually runs on request)
        if (!url.pathname.startsWith('/community')) {
            url.pathname = `/community${url.pathname}`;
            return NextResponse.rewrite(url);
        }
    }

    const { data: { session } } = await supabase.auth.getSession()

    // Use the potentially rewritten URL for path checking
    const targetPath = url.pathname;

    // Rotas protegidas (Dashboard, Admin, Support, Modulo, Community)
    if (targetPath.startsWith('/dashboard') ||
        targetPath.startsWith('/admin') ||
        targetPath.startsWith('/support') ||
        targetPath.startsWith('/modulo') ||
        targetPath.startsWith('/community') // Added Community
    ) {
        if (!session) {
            // Check if subdomain to redirect correctly?
            // For now, redirect to main login. 
            // In future, community might have its own login page or shared session.
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
