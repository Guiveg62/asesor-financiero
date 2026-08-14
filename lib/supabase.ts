import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Cliente de Supabase para uso EXCLUSIVO en el servidor.
 *
 * Usa la service_role key, que salta el RLS. Nunca debe importarse desde
 * componentes de cliente ("use client") ni exponerse al navegador.
 */
let cached: SupabaseClient | null = null;

export function getServiceClient(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      'Faltan variables de entorno: define NEXT_PUBLIC_SUPABASE_URL y ' +
        'SUPABASE_SERVICE_ROLE_KEY en .env.local (ver .env.local.example).'
    );
  }

  cached = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
