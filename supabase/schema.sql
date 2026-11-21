-- ============================================================
--  Biblioteca de Jogos Steampunk — schema Supabase
--  Rode este arquivo inteiro no SQL Editor do Supabase.
--  É seguro rodar mais de uma vez (idempotente).
-- ============================================================

create extension if not exists pgcrypto;

-- ---------- Tipos ----------
do $$ begin
  create type public.user_role as enum ('aluno', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.game_status as enum (
    'pendente',
    'recusado',
    'aguardando_capa',
    'capa_recebida',
    'publicado'
  );
exception when duplicate_object then null; end $$;

-- ---------- Tabelas ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null default '',
  role public.user_role not null default 'aluno',
  criado_em timestamptz not null default now()
);

create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  titulo text not null check (char_length(trim(titulo)) >= 3),
  link text not null check (link ~* '^https?://'),
  categoria text not null check (
    categoria in ('Ação', 'Aventura', 'Arcade', 'Puzzle', 'Estratégia', 'RPG', 'Corrida', 'Esporte')
  ),
  descricao text not null default '',
  capa_url text,
  status public.game_status not null default 'pendente',
  autor_id uuid not null references public.profiles (id) on delete cascade,
  motivo_recusa text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  publicado_em timestamptz
);

create table if not exists public.ratings (
  game_id uuid not null references public.games (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  nota smallint not null check (nota between 1 and 5),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  primary key (game_id, user_id)
);

create table if not exists public.favorites (
  game_id uuid not null references public.games (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  criado_em timestamptz not null default now(),
  primary key (game_id, user_id)
);

create index if not exists games_status_idx on public.games (status);
create index if not exists games_autor_idx on public.games (autor_id);
create index if not exists games_publicado_idx on public.games (publicado_em desc);
create index if not exists ratings_game_idx on public.ratings (game_id);
create index if not exists favorites_user_idx on public.favorites (user_id);

-- ---------- Funções auxiliares ----------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Cria o perfil automaticamente quando alguém se cadastra
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nome)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'nome', ''),
      split_part(coalesce(new.email, 'aluno'), '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Perfis de usuários que já existiam antes do trigger
insert into public.profiles (id, nome)
select u.id,
       coalesce(
         nullif(u.raw_user_meta_data ->> 'nome', ''),
         split_part(coalesce(u.email, 'aluno'), '@', 1)
       )
from auth.users u
on conflict (id) do nothing;

-- Regras de transição de status (aluno só faz o que o fluxograma permite)
create or replace function public.enforce_game_rules()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.autor_id is distinct from auth.uid() then
      raise exception 'O envio precisa pertencer a você.';
    end if;
    if new.status <> 'pendente' then
      raise exception 'Todo envio começa como pendente.';
    end if;
    return new;
  end if;

  new.atualizado_em := now();

  if new.status = 'publicado' and old.status <> 'publicado' then
    new.publicado_em := coalesce(new.publicado_em, now());
  end if;

  if public.is_admin() then
    return new;
  end if;

  if new.autor_id <> old.autor_id then
    raise exception 'Não é permitido trocar o autor do envio.';
  end if;

  -- Aluno corrige um envio recusado e ele volta para a fila
  if old.status = 'recusado' and new.status = 'pendente' then
    new.motivo_recusa := null;
    return new;
  end if;

  -- Aluno envia a capa de um jogo já aprovado
  if old.status = 'aguardando_capa' and new.status = 'capa_recebida' then
    if coalesce(new.capa_url, '') = '' then
      raise exception 'Envie a imagem da capa antes de concluir.';
    end if;
    return new;
  end if;

  raise exception 'Transição de status não permitida (%).', new.status;
end;
$$;

drop trigger if exists games_enforce_rules on public.games;
create trigger games_enforce_rules
  before insert or update on public.games
  for each row execute function public.enforce_game_rules();

-- Ninguém vira admin pela aplicação.
-- Alterações feitas diretamente no banco (SQL Editor / service role), onde
-- auth.uid() é nulo, são permitidas — é assim que o admin é criado.
create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'Você não pode alterar seu perfil de acesso.';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_prevent_escalation on public.profiles;
create trigger profiles_prevent_escalation
  before update on public.profiles
  for each row execute function public.prevent_role_escalation();

-- ---------- View com média das avaliações ----------
create or replace view public.games_com_media
with (security_invoker = true)
as
select
  g.*,
  coalesce(round(avg(r.nota)::numeric, 1), 0) as media,
  count(r.nota)::int as total_avaliacoes
from public.games g
left join public.ratings r on r.game_id = g.id
group by g.id;

-- ---------- Row Level Security ----------
alter table public.profiles enable row level security;
alter table public.games enable row level security;
alter table public.ratings enable row level security;
alter table public.favorites enable row level security;

-- profiles
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles
  for insert to authenticated
  with check (id = auth.uid());

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- games
drop policy if exists games_select on public.games;
create policy games_select on public.games
  for select to authenticated
  using (
    status = 'publicado'
    or autor_id = auth.uid()
    or public.is_admin()
  );

drop policy if exists games_insert on public.games;
create policy games_insert on public.games
  for insert to authenticated
  with check (autor_id = auth.uid() and status = 'pendente');

drop policy if exists games_update on public.games;
create policy games_update on public.games
  for update to authenticated
  using (autor_id = auth.uid() or public.is_admin())
  with check (autor_id = auth.uid() or public.is_admin());

drop policy if exists games_delete on public.games;
create policy games_delete on public.games
  for delete to authenticated
  using (
    public.is_admin()
    or (autor_id = auth.uid() and status in ('pendente', 'recusado'))
  );

-- ratings
drop policy if exists ratings_select on public.ratings;
create policy ratings_select on public.ratings
  for select to authenticated
  using (true);

drop policy if exists ratings_insert on public.ratings;
create policy ratings_insert on public.ratings
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists ratings_update on public.ratings;
create policy ratings_update on public.ratings
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists ratings_delete on public.ratings;
create policy ratings_delete on public.ratings
  for delete to authenticated
  using (user_id = auth.uid());

-- favorites
drop policy if exists favorites_select on public.favorites;
create policy favorites_select on public.favorites
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists favorites_insert on public.favorites;
create policy favorites_insert on public.favorites
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists favorites_delete on public.favorites;
create policy favorites_delete on public.favorites
  for delete to authenticated
  using (user_id = auth.uid());

-- ---------- Permissões ----------
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.games to authenticated;
grant select, insert, update, delete on public.ratings to authenticated;
grant select, insert, update, delete on public.favorites to authenticated;
grant select on public.games_com_media to authenticated;

-- ---------- Storage: capas ----------
insert into storage.buckets (id, name, public)
values ('capas', 'capas', true)
on conflict (id) do update set public = true;

drop policy if exists capas_select on storage.objects;
create policy capas_select on storage.objects
  for select using (bucket_id = 'capas');

drop policy if exists capas_insert on storage.objects;
create policy capas_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'capas'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists capas_update on storage.objects;
create policy capas_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'capas'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists capas_delete on storage.objects;
create policy capas_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'capas'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================
--  TORNAR-SE ADMINISTRADOR
--  Depois de criar sua conta pelo app, troque o e-mail abaixo
--  pelo seu e rode este comando uma única vez no SQL Editor:
--
--  update public.profiles
--  set role = 'admin'
--  where id = (select id from auth.users where email = 'seu@email.com');
-- ============================================================
