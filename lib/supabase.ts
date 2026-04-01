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
        return '.atrilhadoecommerce.com.br';
    } else if (hostname.endsWith('.lvh.me')) {
        return '.lvh.me';
    }
    
    return undefined;
};

export const supabase = createBrowserClient(
    supabaseUrl,
    supabaseAnonKey,
    {
        cookieOptions: {
            domain: getCookieDomain(),
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
        }
    }
);
