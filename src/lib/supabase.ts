import { createClient } from '@supabase/supabase-js';

// Fallback de placeholders para permitir que o build de produção (estático) ocorra com sucesso
// sem que o compilador do Next.js quebre pela falta das variáveis de ambiente em tempo de build.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.warn('Warning: NEXT_PUBLIC_SUPABASE_URL is not defined. Using placeholder for build phase.');
}

// Cliente público para ações comuns e client-side
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cliente administrativo com privilégios de service role para bypassar RLS (usado na ingestão de conhecimento)
export const supabaseAdmin = supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : supabase;
