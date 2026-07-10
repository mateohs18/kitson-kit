import { createClient } from '@supabase/supabase-js';

// ⚠️ Este archivo SOLO se debe importar desde rutas de servidor (app/api/.../route.ts).
// Nunca lo importes desde un archivo que empiece con "use client", porque la
// service role key tiene permiso para saltarse todas las reglas de seguridad (RLS)
// de la base de datos, y si termina en el navegador, cualquiera podría usarla
// para leer o modificar todo.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ejemplo.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
