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
                    cookiesToSet.forEach(({ name, value, options }) => {
                        const hostname = request.headers.get('host') || '';
                        const isProd = process.env.NODE_ENV === 'production';
                        
                        // Domain sharing logic
                        let domain = undefined;
                        if (isProd) {
                            domain = '.atrilhadoecommerce.com.br';
                        } else if (hostname.endsWith('.lvh.me') || hostname.includes('.lvh.me:')) {
                            domain = '.lvh.me';
                        }
                        // On localhost, we skip explicit domain to let browser use default sub-subdomain isolation 
                        // or shared loopback if configured. 

                        response.cookies.set(name, value, {
                            ...options,
                            domain,
                            sameSite: 'lax',
                            secure: isProd,
                        })
                    })
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
        // Exclude specific paths from community rewrite (Auth, API, etc)
        const excludedPaths = ['/login', '/auth', '/api', '/register', '/_next', '/favicon.ico'];
        const isExcluded = excludedPaths.some(path => url.pathname.startsWith(path));
        
        if (!isExcluded) {
            // Rewrite to /community internal route
            if (!url.pathname.startsWith('/community')) {
                url.pathname = `/community${url.pathname}`;
                return NextResponse.rewrite(url);
            }
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
