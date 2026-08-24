-- ============================================================================
-- Novare Hub — perfis de acesso
-- Projeto Supabase: hjikeevfzfswqydduars (mesmo do novareapp)
--
-- Rode este script UMA VEZ no SQL Editor do Supabase.
-- Ele só cria coisas novas com prefixo `hub_` — não toca em nada existente.
-- ============================================================================

create table if not exists public.hub_profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  nome       text,
  role       text not null default 'cliente'
             check (role in ('admin', 'equipe', 'cliente')),
  -- Camada comercial: 'free' abre só as ferramentas gratuitas, 'pro' abre tudo.
  plano      text not null default 'free'
             check (plano in ('free', 'pro')),
  -- Se preenchido e no passado, o Hub trata o usuário como free.
  plano_expira_em timestamptz,
  criado_em  timestamptz not null default now()
);

-- Colunas de plano para quem já rodou uma versão anterior deste script.
alter table public.hub_profiles
  add column if not exists plano text not null default 'free';
alter table public.hub_profiles
  add column if not exists plano_expira_em timestamptz;

alter table public.hub_profiles enable row level security;

-- O papel do usuario logado, lido SEM passar pelas policies.
-- Sem isto, uma policy de hub_profiles que pergunta o papel consultando
-- hub_profiles entra em recursao infinita (erro 42P17).
create or replace function public.hub_papel()
returns text language sql security definer stable set search_path = public
as $$
  select role from public.hub_profiles where id = auth.uid();
$$;

revoke all on function public.hub_papel() from public;
grant execute on function public.hub_papel() to anon, authenticated;

-- Cada um lê o próprio perfil.
drop policy if exists "hub_profiles: leitura propria" on public.hub_profiles;
create policy "hub_profiles: leitura propria"
  on public.hub_profiles for select
  using (auth.uid() = id);

-- Admin lê todos os perfis.
drop policy if exists "hub_profiles: admin le tudo" on public.hub_profiles;
create policy "hub_profiles: admin le tudo"
  on public.hub_profiles for select
  using (public.hub_papel() = 'admin');

-- Admin escreve.
drop policy if exists "hub_profiles: admin escreve" on public.hub_profiles;
create policy "hub_profiles: admin escreve"
  on public.hub_profiles for all
  using (public.hub_papel() = 'admin')
  with check (public.hub_papel() = 'admin');

-- Todo usuário novo entra como cliente (menor privilégio).
create or replace function public.hub_criar_perfil()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.hub_profiles (id, nome, role)
  values (new.id, new.raw_user_meta_data ->> 'nome', 'cliente')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists hub_on_auth_user_created on auth.users;
create trigger hub_on_auth_user_created
  after insert on auth.users
  for each row execute function public.hub_criar_perfil();

-- Backfill: quem já tem conta vira cliente.
insert into public.hub_profiles (id, nome, role)
select u.id, u.raw_user_meta_data ->> 'nome', 'cliente'
from auth.users u
on conflict (id) do nothing;

-- ============================================================================
-- DEPOIS: promova a si mesmo a admin trocando o e-mail abaixo.
-- ============================================================================
-- update public.hub_profiles
--   set role = 'admin'
--   where id = (select id from auth.users where email = 'SEU-EMAIL@AQUI');

-- Liberar o PRO para um cliente (sem data = não expira):
-- update public.hub_profiles
--   set plano = 'pro', plano_expira_em = now() + interval '1 year'
--   where id = (select id from auth.users where email = 'CLIENTE@AQUI');
