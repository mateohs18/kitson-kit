import { createClient } from '@supabase/supabase-js';

// Usamos valores de respaldo vacíos ("") para engañar al compilador de Next.js 
// y evitar que arroje el error "supabaseUrl is required" durante el 'next build'.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ejemplo.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'clave-temporal-de-construccion';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);