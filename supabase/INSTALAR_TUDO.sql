-- ============================================================================
-- NOVARE HUB — INSTALACAO COMPLETA DO BANCO
--
-- Cole TUDO isto de uma vez no SQL Editor do Supabase e clique em RUN.
-- Projeto: hjikeevfzfswqydduars
--
-- Este arquivo e a juncao dos scripts abaixo, ja na ordem certa de dependencia
-- (hub_leads depende de hub_profiles, porque a regra de leitura consulta o
-- papel do usuario). Rodar de novo e seguro: tudo usa
-- `if not exists` / `or replace` / `on conflict do nothing`.
--
--   1. hub_profiles.sql           perfis, papeis e planos
--   2. hub_profiles_completo.sql  campos de cadastro
--   3. hub_leads.sql              leads captados pelas ferramentas
--   4. tool_states.sql            estado das ferramentas por usuario
--   5. conta_consultores.sql      acesso de equipe aos consultores
-- ============================================================================




-- ==========================================================================
-- hub_profiles.sql
-- ==========================================================================

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

-- Cada um lê o próprio perfil.
drop policy if exists "hub_profiles: leitura propria" on public.hub_profiles;
create policy "hub_profiles: leitura propria"
  on public.hub_profiles for select
  using (auth.uid() = id);

-- Admin lê todos os perfis.
drop policy if exists "hub_profiles: admin le tudo" on public.hub_profiles;
create policy "hub_profiles: admin le tudo"
  on public.hub_profiles for select
  using (
    exists (
      select 1 from public.hub_profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Admin escreve.
drop policy if exists "hub_profiles: admin escreve" on public.hub_profiles;
create policy "hub_profiles: admin escreve"
  on public.hub_profiles for all
  using (
    exists (
      select 1 from public.hub_profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.hub_profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

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


-- ==========================================================================
-- hub_profiles_completo.sql
-- ==========================================================================

-- Perfil completo do cliente no Novare Workspace.
--
-- Roda depois de `hub_profiles.sql`. Tudo é `add column if not exists`,
-- então pode ser executado mais de uma vez sem estragar nada.
--
-- Onde rodar: SQL Editor do projeto Supabase hjikeevfzfswqydduars.

alter table public.hub_profiles
  add column if not exists apelido       text,
  add column if not exists telefone      text,
  add column if not exists nascimento    date,
  add column if not exists cidade        text,
  add column if not exists uf            text,
  add column if not exists profissao     text,
  -- O que a pessoa quer resolver. É por onde a consultoria começa a
  -- conversa, em vez de perguntar do zero na primeira reunião.
  add column if not exists objetivo      text,
  add column if not exists avatar_url    text,
  add column if not exists aceita_email  boolean not null default true,
  add column if not exists atualizado_em timestamptz not null default now();

-- Carimbo de atualização: saber quando o cliente mexeu no próprio cadastro
-- evita pedir de novo o que ele já respondeu semana passada.
create or replace function public.hub_profiles_touch()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

drop trigger if exists hub_profiles_touch on public.hub_profiles;
create trigger hub_profiles_touch
  before update on public.hub_profiles
  for each row execute function public.hub_profiles_touch();

-- O cliente edita o próprio cadastro, e só ele.
-- `role` e `plano` ficam de fora de propósito: quem muda plano é o
-- webhook de pagamento, não o formulário do usuário.
drop policy if exists "perfil proprio: atualizar" on public.hub_profiles;
create policy "perfil proprio: atualizar"
  on public.hub_profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);


-- ==========================================================================
-- hub_leads.sql
-- ==========================================================================

-- ============================================================================
-- Novare Hub — leads captados pelas ferramentas e landing pages
-- Projeto Supabase: hjikeevfzfswqydduars (mesmo do novareapp)
--
-- Rode este script UMA VEZ no SQL Editor do Supabase.
-- Só cria coisas novas com prefixo `hub_` — não toca em nada existente.
-- ============================================================================

create table if not exists public.hub_leads (
  id         uuid primary key default gen_random_uuid(),
  email      text not null check (char_length(email) between 3 and 200),
  nome       text,
  telefone   text,
  origem     text,        -- rota/ferramenta de onde veio o lead
  tipo       text,        -- 'ferramenta' | 'vida-plan' | 'saude-financeira'
  payload    jsonb,       -- dados do cálculo (renda, score, etc.)
  criado_em  timestamptz not null default now()
);

alter table public.hub_leads enable row level security;

-- Qualquer visitante (mesmo anônimo) pode CRIAR um lead — as iscas são públicas.
-- Não pode ler nem alterar; só inserir com um e-mail plausível.
drop policy if exists "hub_leads: qualquer um cria" on public.hub_leads;
create policy "hub_leads: qualquer um cria"
  on public.hub_leads for insert
  to anon, authenticated
  with check (char_length(email) between 3 and 200);

-- Só admin/equipe leem os leads captados (via hub_profiles.role).
drop policy if exists "hub_leads: equipe le" on public.hub_leads;
create policy "hub_leads: equipe le"
  on public.hub_leads for select
  to authenticated
  using (
    exists (
      select 1 from public.hub_profiles p
      where p.id = auth.uid() and p.role in ('admin', 'equipe')
    )
  );

create index if not exists hub_leads_criado_idx on public.hub_leads (criado_em desc);


-- ==========================================================================
-- tool_states.sql
-- ==========================================================================

-- Estado das ferramentas sincronizado por usuario. Execute no SQL Editor do Supabase.
create table if not exists public.tool_states (
  user_id uuid not null references auth.users(id) on delete cascade,
  chave text not null check (char_length(chave) between 1 and 80),
  dados jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, chave)
);

alter table public.tool_states enable row level security;

drop policy if exists "Usuarios leem apenas seus estados" on public.tool_states;
create policy "Usuarios leem apenas seus estados"
  on public.tool_states for select
  using (auth.uid() = user_id);

drop policy if exists "Usuarios inserem apenas seus estados" on public.tool_states;
create policy "Usuarios inserem apenas seus estados"
  on public.tool_states for insert
  with check (auth.uid() = user_id);

drop policy if exists "Usuarios atualizam apenas seus estados" on public.tool_states;
create policy "Usuarios atualizam apenas seus estados"
  on public.tool_states for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Usuarios removem apenas seus estados" on public.tool_states;
create policy "Usuarios removem apenas seus estados"
  on public.tool_states for delete
  using (auth.uid() = user_id);

create or replace function public.atualizar_tool_states_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tool_states_updated_at on public.tool_states;
create trigger tool_states_updated_at
  before update on public.tool_states
  for each row execute procedure public.atualizar_tool_states_updated_at();


-- ==========================================================================
-- conta_consultores.sql
-- ==========================================================================

-- ============================================================================
-- Conta dos consultores da Novare — acesso de EQUIPE
--
-- A conta já existe no Auth (criada pelo fluxo de cadastro). O que falta é o
-- papel: `equipe` abre todos os aplicativos, inclusive os internos e os que
-- forem marcados como pagos no futuro, além da home logada (/hub).
--
-- Isto NÃO pode ser feito pelo app: a policy de `hub_profiles` só deixa o
-- usuário editar os próprios dados de cadastro, nunca o `role` nem o `plano`
-- — é o que impede qualquer pessoa de se promover sozinha. Por isso roda aqui,
-- no SQL Editor do Supabase (projeto hjikeevfzfswqydduars).
-- ============================================================================

update public.hub_profiles
   set role = 'equipe',
       nome = coalesce(nome, 'Consultores Novare')
 where id = (select id from auth.users
              where email = 'consultores@novareapp.com.br');

-- Confere se aplicou (deve devolver uma linha com role = 'equipe'):
select u.email, p.role, p.plano, p.nome
  from public.hub_profiles p
  join auth.users u on u.id = p.id
 where u.email = 'consultores@novareapp.com.br';

-- ============================================================================
-- Para criar UM CONSULTOR POR PESSOA (recomendado — dá para saber quem fez o
-- quê e revogar acesso individual): a pessoa se cadastra em /login usando
-- "Criar conta grátis" e depois você roda o mesmo update trocando o e-mail.
--
-- Para revogar o acesso de alguém, basta rebaixar para cliente:
--   update public.hub_profiles set role = 'cliente'
--    where id = (select id from auth.users where email = 'PESSOA@AQUI');
-- ============================================================================


