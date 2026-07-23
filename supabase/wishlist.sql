-- =====================================================================
-- LISTA DE DESEOS + ALERTA "¡VOLVIÓ TU SKIN!"
--
-- Los clientes guardan cualquier cosmético de Fortnite. Un cron diario
-- revisa la tienda: si un ítem deseado apareció, se le avisa por email
-- con link para comprarlo en Kitson Kit.
--
-- Panel de Supabase → SQL Editor → New query → pegar todo → RUN
-- =====================================================================

create table if not exists public.wishlist (
  id bigserial primary key,
  email text not null,
  cosmetic_id text not null,        -- id oficial del cosmético en la API de Fortnite
  cosmetic_name text not null,
  cosmetic_image text,
  created_at timestamptz not null default now(),
  notified_at timestamptz,          -- último aviso enviado (evita spamear cada día que siga en tienda)
  unique (email, cosmetic_id)
);

create index if not exists idx_wishlist_cosmetic on public.wishlist (cosmetic_id);
create index if not exists idx_wishlist_email on public.wishlist (email);

-- Solo el servidor accede (el cliente pasa por la API con su sesión)
alter table public.wishlist enable row level security;
