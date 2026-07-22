-- =====================================================================
-- SISTEMA DE CUPONES DE DESCUENTO
--
-- Panel de Supabase → SQL Editor → New query → pegar todo → RUN
-- =====================================================================

-- 1. Tabla de cupones
create table if not exists public.cupones (
  code text primary key,                          -- ej: 'BIENVENIDO10' (siempre mayúsculas)
  tipo text not null check (tipo in ('porcentaje', 'fijo')),
  valor numeric not null check (valor > 0),       -- 10 = 10% o 10 USD según tipo
  usos_maximos integer,                           -- null = usos ilimitados
  usos integer not null default 0,
  min_total numeric not null default 0,           -- compra mínima en USD para aplicar
  activo boolean not null default true,
  expira_at timestamptz,                          -- null = no vence
  created_at timestamptz not null default now()
);

-- 2. Registrar el cupón usado en cada orden
alter table public.orders add column if not exists coupon_code text;
alter table public.orders add column if not exists discount numeric not null default 0;

-- 3. CANJE ATÓMICO: valida y consume un uso en una sola operación.
--    Devuelve el descuento en USD. Si el cupón no aplica, lanza un error
--    con un código que el servidor traduce a un mensaje amigable.
create or replace function public.canjear_cupon(
  p_code text,
  p_total numeric
)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cupon record;
  v_descuento numeric;
begin
  -- Bloquea la fila del cupón: dos compras simultáneas se procesan en orden
  select * into v_cupon
    from public.cupones
   where code = upper(trim(p_code))
   for update;

  if not found then raise exception 'CUPON_NO_EXISTE'; end if;
  if not v_cupon.activo then raise exception 'CUPON_INACTIVO'; end if;
  if v_cupon.expira_at is not null and v_cupon.expira_at < now() then
    raise exception 'CUPON_VENCIDO';
  end if;
  if v_cupon.usos_maximos is not null and v_cupon.usos >= v_cupon.usos_maximos then
    raise exception 'CUPON_AGOTADO';
  end if;
  if p_total < v_cupon.min_total then
    raise exception 'CUPON_MINIMO_%', v_cupon.min_total;
  end if;

  if v_cupon.tipo = 'porcentaje' then
    v_descuento := round(p_total * (v_cupon.valor / 100.0), 2);
  else
    v_descuento := least(v_cupon.valor, p_total); -- un cupón fijo nunca descuenta más que el total
  end if;

  update public.cupones set usos = usos + 1 where code = v_cupon.code;

  return v_descuento;
end;
$$;

-- 4. Liberar un uso (si la orden falló después de canjear, devolvemos el uso)
create or replace function public.liberar_cupon(p_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.cupones
     set usos = greatest(usos - 1, 0)
   where code = upper(trim(p_code));
end;
$$;

-- 5. Seguridad: nada de esto es accesible desde el navegador.
alter table public.cupones enable row level security;

revoke all on function public.canjear_cupon(text, numeric) from public, anon, authenticated;
grant execute on function public.canjear_cupon(text, numeric) to service_role;
revoke all on function public.liberar_cupon(text) from public, anon, authenticated;
grant execute on function public.liberar_cupon(text) to service_role;

-- =====================================================================
-- EJEMPLO: crear tu primer cupón (editá los valores y corré solo esto)
-- =====================================================================
-- insert into public.cupones (code, tipo, valor, usos_maximos, min_total, expira_at)
-- values ('BIENVENIDO10', 'porcentaje', 10, 100, 5, now() + interval '30 days');
