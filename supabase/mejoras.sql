-- =====================================================================
-- MEJORAS: reseñas verificadas + historial de movimientos de billetera
--
-- Panel de Supabase → SQL Editor → New query → pegar todo → RUN
-- (Requiere haber corrido antes descontar_saldo.sql y referidos.sql)
-- =====================================================================

-- ============ 1. RESEÑAS VERIFICADAS ============
alter table public.reviews add column if not exists verified boolean not null default false;
alter table public.reviews add column if not exists order_id text;

-- ============ 2. HISTORIAL DE MOVIMIENTOS DE LA BILLETERA ============
create table if not exists public.movimientos (
  id bigserial primary key,
  email text not null,
  concepto text not null,       -- ej: 'Compra #123', 'Recarga aprobada', 'Recompensa por referido'
  monto numeric not null,       -- negativo = gasto, positivo = ingreso
  created_at timestamptz not null default now()
);

create index if not exists idx_movimientos_email on public.movimientos (email, created_at desc);

-- Solo el servidor puede leer/escribir (el cliente los ve vía API con sesión)
alter table public.movimientos enable row level security;

-- ============ 3. LAS FUNCIONES DE SALDO AHORA REGISTRAN CADA MOVIMIENTO ============

-- Descontar (compra con saldo)
create or replace function public.descontar_saldo(
  p_email text,
  p_monto numeric
)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nuevo_saldo numeric;
begin
  if p_monto is null or p_monto <= 0 then
    raise exception 'MONTO_INVALIDO';
  end if;

  update public.profiles
     set balance = balance - p_monto
   where email = p_email
     and balance >= p_monto
  returning balance into v_nuevo_saldo;

  if v_nuevo_saldo is null then
    if exists (select 1 from public.profiles where email = p_email) then
      raise exception 'SALDO_INSUFICIENTE';
    else
      raise exception 'PERFIL_NO_ENCONTRADO';
    end if;
  end if;

  insert into public.movimientos (email, concepto, monto)
  values (p_email, 'Compra en la tienda', -p_monto);

  return v_nuevo_saldo;
end;
$$;

-- Devolver (reembolso por fallo)
create or replace function public.devolver_saldo(
  p_email text,
  p_monto numeric
)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nuevo_saldo numeric;
begin
  if p_monto is null or p_monto <= 0 then
    raise exception 'MONTO_INVALIDO';
  end if;

  update public.profiles
     set balance = balance + p_monto
   where email = p_email
  returning balance into v_nuevo_saldo;

  if v_nuevo_saldo is null then
    raise exception 'PERFIL_NO_ENCONTRADO';
  end if;

  insert into public.movimientos (email, concepto, monto)
  values (p_email, 'Reembolso automático', p_monto);

  return v_nuevo_saldo;
end;
$$;

-- Recompensas de referidos
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
  select coalesce((select value::numeric from site_config where key = 'ref_recompensa_referidor'), 0),
         coalesce((select value::numeric from site_config where key = 'ref_recompensa_referido'), 0),
         coalesce((select value::numeric from site_config where key = 'ref_compra_minima'), 0)
    into v_rec_referidor, v_rec_referido, v_minimo;

  if p_total_pedido < v_minimo then return null; end if;

  select * into v_comprador
    from profiles
   where email = p_email_comprador
   for update;

  if not found then return null; end if;
  if v_comprador.referred_by is null then return null; end if;
  if v_comprador.referral_credited_at is not null then return null; end if;

  select * into v_referidor
    from profiles
   where referral_code = v_comprador.referred_by;

  if not found then return null; end if;
  if v_referidor.email = v_comprador.email then return null; end if;

  update profiles set balance = balance + v_rec_referidor where email = v_referidor.email;
  update profiles
     set balance = balance + v_rec_referido,
         referral_credited_at = now()
   where email = v_comprador.email;

  if v_rec_referidor > 0 then
    insert into public.movimientos (email, concepto, monto)
    values (v_referidor.email, 'Recompensa por invitar a un amigo', v_rec_referidor);
  end if;
  if v_rec_referido > 0 then
    insert into public.movimientos (email, concepto, monto)
    values (v_comprador.email, 'Regalo de bienvenida por referido', v_rec_referido);
  end if;

  return jsonb_build_object(
    'referidor_email', v_referidor.email,
    'recompensa_referidor', v_rec_referidor,
    'recompensa_referido', v_rec_referido
  );
end;
$$;
