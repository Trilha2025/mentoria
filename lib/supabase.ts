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
        
        // Listen for changes from other tabs
        window.addEventListener('storage', (e) => {
            if (e.key === 'supabase-circuit-broken') {
                g.__supabase_circuit_breaker.broken = e.newValue === 'true';
                if (g.__supabase_circuit_breaker.broken) {
                    // If broken in another tab, set local timer to reset
                    if (g.__supabase_circuit_breaker.timer) clearTimeout(g.__supabase_circuit_breaker.timer);
                    g.__supabase_circuit_breaker.timer = setTimeout(() => {
                        g.__supabase_circuit_breaker.broken = false;
                        localStorage.removeItem('supabase-circuit-broken');
                    }, 30000); // 30 second quiet period
                }
            }
        });
    }
    return g.__supabase_circuit_breaker;
};

const breakCircuit = () => {
    const state = getGlobalCircuitState();
    state.broken = true;
    
    if (typeof window !== 'undefined') {
        localStorage.setItem('supabase-circuit-broken', 'true');
    }

    if (state.timer) clearTimeout(state.timer);
    state.timer = setTimeout(() => {
        state.broken = false;
        if (typeof window !== 'undefined') {
            localStorage.removeItem('supabase-circuit-broken');
        }
    }, 30000); // Increased to 30 second quiet period
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
                persistSession: true,
                autoRefreshToken: !getGlobalCircuitState().broken,
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
                    const bodyStr = typeof options?.body === 'string' ? options.body : '';
                    
                    // Only block if it's an automatic refresh token request
                    if (circuit.broken && 
                        urlStr.includes('/auth/v1/token') && 
                        bodyStr.includes('grant_type=refresh_token')) {
                        return new Response(JSON.stringify({ 
                            error: 'rate_limit', 
                            message: 'Auth loop protection active. Please wait 30s.' 
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
                                    // Clear all Supabase related storage
                                    const projectRef = supabaseUrl.split('//')[1].split('.')[0];
                                    const keys = [
                                        `sb-${projectRef}-auth-token`,
                                        `sb-${projectRef}-auth-token-code-verifier`,
                                        'supabase.auth.token'
                                    ];
                                    keys.forEach(k => localStorage.removeItem(k));
                                    
                                    // Optionally dispatch a custom event for the UI to react
                                    window.dispatchEvent(new CustomEvent('supabase-auth-corruption'));
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

// O cliente Supabase agora confia no interceptor de fetch acima para gerenciar os bloqueios.
// Removendo overrides manuais que poderiam travar o estado local do usuário.
