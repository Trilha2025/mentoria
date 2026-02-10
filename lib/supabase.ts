import { createBrowserClient } from '@supabase/ssr';

// Cliente Supabase configurado para rodar no Browser e gerenciar Cookies automaticamente.
// Isso é essencial para que o Middleware detecte a sessão e não bloqueie o acesso.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
