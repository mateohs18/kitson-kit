-- =====================================================================
-- TABLA: site_config
-- Configuración general del sitio editable desde el panel de admin.
-- Por ahora guarda el margen de ganancia de la tienda diaria, pero
-- sirve para cualquier ajuste futuro (banners, avisos, feature flags).
--
-- CÓMO INSTALARLA:
-- Panel de Supabase → SQL Editor → New query → pegar todo → RUN
-- =====================================================================

create table if not exists public.site_config (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

-- Margen inicial: 0% (= exactamente los precios actuales del sitio,
-- así nada cambia hasta que vos decidas subirlo desde el admin).
insert into public.site_config (key, value)
values ('margen_tienda', '0')
on conflict (key) do nothing;

-- Seguridad: nadie desde el navegador puede leer ni tocar esta tabla.
-- Solo tu servidor (service_role) accede a ella.
alter table public.site_config enable row level security;
-- (Sin políticas = nadie con anon/authenticated puede leer ni escribir.
--  El service_role se saltea RLS, así que tus APIs siguen funcionando.)
