import { createBrowserClient } from '@supabase/ssr';

// Cliente Supabase configurado para rodar no Browser e gerenciar Cookies automaticamente.
// Isso é essencial para que o Middleware detecte a sessão e não bloqueie o acesso.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const getCookieDomain = () => {
    if (typeof window === 'undefined') return undefined;
    
    const hostname = window.location.hostname;
    const isProd = process.env.NODE_ENV === 'production';
    
    if (isProd) {
        // Match production domain exactly for sharing
        return '.atrilhadoecommerce.com.br';
    } else if (hostname === 'lvh.me' || hostname.endsWith('.lvh.me')) {
        return '.lvh.me';
    } else if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
        // For localhost, explicitly using '.localhost' is often better than undefined
        // to ensure consistency across subdomains like community.localhost
        return '.localhost';
    }
    
    return undefined;
};

// Circuit breaker to stop Auth Storms (infinite refresh loops)
// Store in global/window to persist through HMR reloads
const getGlobalCircuitState = () => {
    if (typeof window === 'undefined') return { broken: false };
    const g = window as any;
    if (!g.__supabase_circuit_breaker) {
        g.__supabase_circuit_breaker = { broken: false, timer: null };
    }
    return g.__supabase_circuit_breaker;
};

const breakCircuit = () => {
    const state = getGlobalCircuitState();
    state.broken = true;
    if (state.timer) clearTimeout(state.timer);
    state.timer = setTimeout(() => {
        state.broken = false;
    }, 10000); // 10 second quiet period
};

// Use a global variable to persist the Supabase client across HMR reloads in development
const globalForSupabase = globalThis as unknown as {
    supabase: ReturnType<typeof createBrowserClient>;
};

const createClientInstance = () => {
    return createBrowserClient(
        supabaseUrl,
        supabaseAnonKey,
        {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true,
                flowType: 'pkce'
            },
            cookieOptions: {
                domain: getCookieDomain(),
                path: '/',
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production'
            },
            global: {
                fetch: async (url, options) => {
                    const urlStr = typeof url === 'string' ? url : url.toString();
                    const circuit = getGlobalCircuitState();
                    
                    if (circuit.broken && urlStr.includes('/auth/v1/token')) {
                        return new Response(JSON.stringify({ 
                            error: 'rate_limit', 
                            message: 'Auth loop protection active.' 
                        }), { 
                            status: 429,
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }

                    const response = await fetch(url, options);
                    
                    if (response.status === 429) {
                        breakCircuit();
                    } else if (response.status === 400 || response.status === 401) {
                        try {
                            const clonedResponse = response.clone();
                            const body = await clonedResponse.json();
                            const errorMsg = (body?.error_description || body?.message || '').toLowerCase();
                            
                            const isAlreadyUsed = errorMsg.includes('already used');
                            const isFatal = errorMsg.includes('refresh_token_not_found') || errorMsg.includes('invalid_grant') || errorMsg.includes('not_found');

                            if (isAlreadyUsed || isFatal) {
                                console.error('[Supabase Client] Auth Error:', errorMsg.slice(0, 100));
                                
                                breakCircuit();
                                
                                if (typeof window !== 'undefined') {
                                    const projectRef = supabaseUrl.split('//')[1].split('.')[0];
                                    const storageKey = `sb-${projectRef}-auth-token`;
                                    localStorage.removeItem(storageKey);
                                    localStorage.removeItem('supabase.auth.token');
                                }
                            }
                        } catch (e) {
                            // ignore parse errors
                        }
                    }
                    
                    return response;
                }
            }
        }
    );
};

export const supabase = globalForSupabase.supabase || createClientInstance();

if (process.env.NODE_ENV !== 'production') {
    globalForSupabase.supabase = supabase;
}

// Hard Lock: Override getSession and getUser to stop internal retries during a noise storm
const originalGetSession = supabase.auth.getSession.bind(supabase.auth);
const originalGetUser = supabase.auth.getUser.bind(supabase.auth);

supabase.auth.getSession = async () => {
    if (getGlobalCircuitState().broken) {
        return { data: { session: null }, error: null };
    }
    try {
        return await originalGetSession();
    } catch (e) {
        return { data: { session: null }, error: e as any };
    }
};

supabase.auth.getUser = async (token?: string) => {
    // Only block if no explicit token is provided (standard check)
    if (!token && getGlobalCircuitState().broken) {
        return { data: { user: null }, error: null };
    }
    try {
        return await originalGetUser(token);
    } catch (e) {
        return { data: { user: null }, error: e as any };
    }
};
