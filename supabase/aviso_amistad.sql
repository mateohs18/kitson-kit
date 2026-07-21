-- =====================================================================
-- Columna nueva en profiles: cuándo se le avisó al cliente que sus
-- 48 horas de amistad ya se cumplieron (para nunca avisar dos veces).
--
-- Panel de Supabase → SQL Editor → New query → pegar → RUN
-- =====================================================================

alter table public.profiles
  add column if not exists friend_ready_notified_at timestamptz;

-- Opcional pero recomendado: si en algún momento reseteás la amistad de un
-- cliente (friend_requested_at nuevo), este trigger limpia el aviso para que
-- el ciclo de 48hs y su email vuelvan a funcionar desde cero.
create or replace function public.resetear_aviso_amistad()
returns trigger
language plpgsql
as $$
begin
  if new.friend_requested_at is distinct from old.friend_requested_at then
    new.friend_ready_notified_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_resetear_aviso_amistad on public.profiles;
create trigger trg_resetear_aviso_amistad
  before update on public.profiles
  for each row
  execute function public.resetear_aviso_amistad();
