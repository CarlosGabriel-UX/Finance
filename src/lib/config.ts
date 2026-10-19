export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** Sem Supabase configurado, o app roda em modo demonstração com dados fictícios. */
export const isDemo = !supabaseUrl || !supabaseAnonKey;
