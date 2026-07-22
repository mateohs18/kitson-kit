-- =====================================================================
-- PROGRAMA DE REFERIDOS
--
-- Cada cliente tiene un código único (link para compartir). Cuando su
-- referido hace la PRIMERA compra y esta se ENTREGA, ambos reciben
-- crédito en la billetera. Los montos se configuran desde el admin.
--
-- Panel de Supabase → SQL Editor → New query → pegar todo → RUN
-- (Requiere haber corrido antes site_config.sql)
-- =====================================================================

-- 1. Columnas nuevas en profiles
alter table public.profiles add column if not exists referral_code text unique;
alter table public.profiles add column if not exists referred_by text;          -- código de quien lo invitó
alter table public.profiles add column if not exists referral_credited_at timestamptz; -- cuándo se pagó la recompensa

create index if not exists idx_profiles_referral_code on public.profiles (referral_code);

-- 2. Configuración (editable desde el panel de admin)
insert into public.site_config (key, value) values
  ('ref_recompensa_referidor', '0.50'),  -- USD para el que invita
  ('ref_recompensa_referido',  '0.50'),  -- USD para el invitado
  ('ref_compra_minima',        '5')      -- USD mínimos del primer pedido para que pague
on conflict (key) do nothing;

-- 3. ACREDITACIÓN ATÓMICA
--    Se llama cuando se entrega un pedido. Si el comprador fue referido y
--    todavía no se pagó su recompensa, acredita a ambos y lo marca.
--    Todo en una transacción: imposible pagar dos veces.
create or replace function public.acreditar_referido(
  p_email_comprador text,
  p_total_pedido numeric
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_comprador record;
  v_referidor record;
  v_rec_referidor numeric;
  v_rec_referido numeric;
  v_minimo numeric;
begin
  -- Configuración vigente
  select coalesce((select value::numeric from site_config where key = 'ref_recompensa_referidor'), 0),
         coalesce((select value::numeric from site_config where key = 'ref_recompensa_referido'), 0),
         coalesce((select value::numeric from site_config where key = 'ref_compra_minima'), 0)
    into v_rec_referidor, v_rec_referido, v_minimo;

  -- ¿El pedido alcanza el mínimo?
  if p_total_pedido < v_minimo then return null; end if;

  -- Comprador: bloqueamos su fila para que dos entregas simultáneas
  -- del mismo cliente no paguen la recompensa dos veces
  select * into v_comprador
    from profiles
   where email = p_email_comprador
   for update;

  if not found then return null; end if;
  if v_comprador.referred_by is null then return null; end if;         -- no fue referido
  if v_comprador.referral_credited_at is not null then return null; end if; -- ya se pagó

  -- Quien lo invitó
  select * into v_referidor
    from profiles
   where referral_code = v_comprador.referred_by;

  if not found then return null; end if;
  if v_referidor.email = v_comprador.email then return null; end if;   -- auto-referencia, por si acaso

  -- Acreditar a ambos y marcar como pagado
  update profiles set balance = balance + v_rec_referidor where email = v_referidor.email;
  update profiles
     set balance = balance + v_rec_referido,
         referral_credited_at = now()
   where email = v_comprador.email;

  return jsonb_build_object(
    'referidor_email', v_referidor.email,
    'recompensa_referidor', v_rec_referidor,
    'recompensa_referido', v_rec_referido
  );
end;
$$;

revoke all on function public.acreditar_referido(text, numeric) from public, anon, authenticated;
grant execute on function public.acreditar_referido(text, numeric) to service_role;
