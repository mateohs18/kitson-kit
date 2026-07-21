-- =====================================================================
-- FUNCIÓN: descontar_saldo
-- Descuenta saldo de forma ATÓMICA. Todo pasa en una sola operación de
-- Postgres: o descuenta y devuelve el nuevo saldo, o no toca nada.
-- Esto elimina la condición de carrera donde dos compras simultáneas
-- podían gastar el mismo saldo dos veces.
--
-- CÓMO INSTALARLA:
-- 1. Entrá a tu panel de Supabase → SQL Editor → New query
-- 2. Pegá todo este archivo y apretá RUN.
-- =====================================================================

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
  -- Validaciones básicas dentro de la propia función
  if p_monto is null or p_monto <= 0 then
    raise exception 'MONTO_INVALIDO';
  end if;

  -- UPDATE condicional y atómico: solo descuenta si alcanza el saldo.
  -- Si dos requests llegan al mismo tiempo, Postgres las serializa:
  -- la segunda ve el saldo ya descontado y falla si no alcanza.
  update public.profiles
     set balance = balance - p_monto
   where email = p_email
     and balance >= p_monto
  returning balance into v_nuevo_saldo;

  -- Si no se actualizó ninguna fila: o no existe el perfil, o no alcanza
  if v_nuevo_saldo is null then
    if exists (select 1 from public.profiles where email = p_email) then
      raise exception 'SALDO_INSUFICIENTE';
    else
      raise exception 'PERFIL_NO_ENCONTRADO';
    end if;
  end if;

  return v_nuevo_saldo;
end;
$$;

-- Solo el service_role (tu clave de servidor) puede llamarla.
-- Los clientes anónimos del navegador NO pueden.
revoke all on function public.descontar_saldo(text, numeric) from public;
revoke all on function public.descontar_saldo(text, numeric) from anon;
revoke all on function public.descontar_saldo(text, numeric) from authenticated;
grant execute on function public.descontar_saldo(text, numeric) to service_role;

-- =====================================================================
-- BONUS: función para DEVOLVER saldo si algo falla después del cobro
-- (la usa el checkout nuevo si la creación de la orden falla).
-- =====================================================================
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

  return v_nuevo_saldo;
end;
$$;

revoke all on function public.devolver_saldo(text, numeric) from public;
revoke all on function public.devolver_saldo(text, numeric) from anon;
revoke all on function public.devolver_saldo(text, numeric) from authenticated;
grant execute on function public.devolver_saldo(text, numeric) to service_role;
