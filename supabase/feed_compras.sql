-- =====================================================================
-- FEED DE COMPRAS EN TIEMPO REAL (reemplaza el polling cada 5 segundos)
--
-- Cómo funciona:
--   1. Cada vez que se inserta una orden, un trigger copia SOLO los datos
--      públicos (nombre del cliente y primer artículo) a `feed_compras`.
--   2. El navegador se suscribe a esa tabla por Supabase Realtime y recibe
--      el aviso al instante — cero polling, cero datos sensibles expuestos.
--
-- CÓMO INSTALARLO:
-- Panel de Supabase → SQL Editor → New query → pegar todo → RUN
-- Después: Database → Replication → verificá que `feed_compras` esté en
-- la publicación `supabase_realtime` (este script ya la agrega, pero si
-- tu panel usa otra interfaz, activá Realtime para esa tabla desde ahí).
-- =====================================================================

-- 1. Tabla pública y anonimizada
create table if not exists public.feed_compras (
  id bigserial primary key,
  name text not null default 'Gamer Anónimo',
  item text not null default 'Recarga de Saldo',
  created_at timestamptz not null default now()
);

-- 2. Trigger: cada orden nueva alimenta el feed (sin email, sin Epic ID,
--    sin precio — solo lo que ya mostrabas en el toast de la home).
create or replace function public.alimentar_feed_compras()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.feed_compras (name, item)
  values (
    coalesce(nullif(new.user_name, ''), 'Gamer Anónimo'),
    coalesce((new.items->0->>'name'), 'Recarga de Saldo')
  );

  -- Limpieza: el feed nunca acumula más de una semana de historial
  delete from public.feed_compras where created_at < now() - interval '7 days';

  return new;
end;
$$;

drop trigger if exists trg_feed_compras on public.orders;
create trigger trg_feed_compras
  after insert on public.orders
  for each row
  execute function public.alimentar_feed_compras();

-- 3. Seguridad: cualquiera puede LEER el feed (es información pública del
--    toast), pero nadie puede escribirlo desde el navegador.
alter table public.feed_compras enable row level security;

drop policy if exists "feed lectura publica" on public.feed_compras;
create policy "feed lectura publica"
  on public.feed_compras
  for select
  to anon, authenticated
  using (true);
-- (Sin políticas de INSERT/UPDATE/DELETE = solo el trigger y el
--  service_role pueden escribir.)

-- 4. Activar Realtime para esta tabla
do $$
begin
  alter publication supabase_realtime add table public.feed_compras;
exception
  when duplicate_object then null; -- ya estaba agregada
end;
$$;
