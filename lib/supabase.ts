import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// null cuando faltan las variables de entorno — la app debe funcionar igual
// en modo local (sin guardar en la nube) si aún no configuraste Supabase.
export const supabase = url && key ? createClient(url, key) : null;
