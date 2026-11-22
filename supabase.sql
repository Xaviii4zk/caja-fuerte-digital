-- Ejecuta este archivo en Supabase > SQL Editor > New query.
-- Cada usuario solo podrá leer e insertar sus propias partidas.

create table if not exists public.partidas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  fecha timestamptz not null default now(),
  resultado text not null,
  puntuacion integer not null check (puntuacion >= 0),
  duracion integer not null check (duracion >= 0),
  intentos integer not null check (intentos > 0)
);

alter table public.partidas enable row level security;

drop policy if exists "Cada usuario puede consultar sus partidas" on public.partidas;
create policy "Cada usuario puede consultar sus partidas"
on public.partidas
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Cada usuario puede insertar sus partidas" on public.partidas;
create policy "Cada usuario puede insertar sus partidas"
on public.partidas
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create index if not exists partidas_user_fecha_idx
on public.partidas (user_id, fecha desc);

-- No se crean políticas de lectura pública, actualización o borrado.
