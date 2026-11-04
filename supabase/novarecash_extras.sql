-- ═══════════════════════════════════════════════════════════════════════
-- NOVARECASH — IMPORTAR EXTRATO, CATEGORIAS PRÓPRIAS, PATRIMÔNIO E O CONVITE (04/11/2026)
--
-- ⚠️ RODE DEPOIS DE `novarecash_compartilhar.sql` (usa `ncash_pode()` e
-- `ncash_membros`). Ordem completa: novarecash.sql → novarecash_app.sql →
-- novarecash_dados.sql → novarecash_compartilhar.sql → ESTE. Seguro rodar de novo.
--
-- O que entra:
--   1. Importação de extrato (OFX/CSV, lido no NAVEGADOR — o arquivo não sobe):
--      origem nova 'importacao' em `ncash_transacoes`, a coluna `importacao_id`
--      e a tabela `ncash_importacoes` (para "desfazer a última importação").
--   2. `ncash_categorias_custom`: categorias que a pessoa cria (chave `c_<slug>`).
--   3. `ncash_investimentos`: investimentos lançados à mão (Patrimônio).
--   4. Conta compartilhada: o convidado lê o NOME de quem o convidou e pode sair
--      ou recusar — duas funções `security definer`, porque a RLS de
--      `hub_profiles` e de `ncash_membros` (com razão) não deixam por conta própria.
--
-- A REGRA DE ACESSO é a única do app: `ncash_pode(user_id)`. As linhas guardam o
-- `user_id` do DONO do NovareCash (não de quem digitou). A equipe NÃO lê.
-- ═══════════════════════════════════════════════════════════════════════

-- ── 1. Importação de extrato ────────────────────────────────────────────

create table if not exists public.ncash_importacoes (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade, -- o DONO
  criado_por    uuid default auth.uid() references auth.users (id) on delete set null,       -- quem importou
  conta_id      uuid references public.ncash_contas (id) on delete set null,
  arquivo       text not null,
  formato       text not null check (formato in ('ofx', 'csv')),
  quantas       integer not null default 0 check (quantas >= 0),
  criado_em     timestamptz not null default now(),
  desfeita_em   timestamptz
);
create index if not exists ncash_importacoes_user_idx on public.ncash_importacoes (user_id, criado_em desc);

alter table public.ncash_transacoes
  add column if not exists importacao_id uuid references public.ncash_importacoes (id) on delete set null;
create index if not exists ncash_transacoes_importacao_idx on public.ncash_transacoes (importacao_id) where importacao_id is not null;

-- A origem nova. O check nasceu sem nome em `novarecash_dados.sql`; o Postgres o
-- chama de `ncash_transacoes_origem_check`. ⚠️ Se outro arquivo também mexer
-- neste check, a lista dos dois tem que ser somada — quem roda por último vence.
alter table public.ncash_transacoes drop constraint if exists ncash_transacoes_origem_check;
alter table public.ncash_transacoes
  add constraint ncash_transacoes_origem_check
  check (origem in ('manual', 'whatsapp', 'openfinance', 'importacao'));

alter table public.ncash_importacoes enable row level security;
drop policy if exists "ncash: dono manda" on public.ncash_importacoes;
create policy "ncash: dono manda" on public.ncash_importacoes
  for all to authenticated using (public.ncash_pode(user_id)) with check (public.ncash_pode(user_id));

-- ── 2. Categorias personalizadas ────────────────────────────────────────

create table if not exists public.ncash_categorias_custom (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade, -- o DONO
  chave      text not null check (chave ~ '^c_[a-z0-9_]{1,40}$'),
  rotulo     text not null check (char_length(btrim(rotulo)) between 1 and 40),
  tipo       text not null check (tipo in ('entrada', 'saida')),
  arquivada  boolean not null default false,  -- some dos seletores; o que já foi lançado continua com ela
  criado_em  timestamptz not null default now(),
  primary key (user_id, chave)
);

alter table public.ncash_categorias_custom enable row level security;
drop policy if exists "ncash: dono manda" on public.ncash_categorias_custom;
create policy "ncash: dono manda" on public.ncash_categorias_custom
  for all to authenticated using (public.ncash_pode(user_id)) with check (public.ncash_pode(user_id));

-- ── 3. Investimentos lançados à mão (Patrimônio) ────────────────────────
-- CVM: o app MOSTRA e SOMA. Não há coluna de "recomendação", e não haverá.

create table if not exists public.ncash_investimentos (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade, -- o DONO
  nome          text not null check (char_length(btrim(nome)) between 1 and 80),
  classe        text not null default 'outros'
                check (classe in ('renda_fixa', 'acoes', 'fundos', 'previdencia', 'outros')),
  instituicao   text,
  valor         numeric(14, 2) not null check (valor >= 0),
  data          date not null default current_date,  -- de quando é o valor informado
  criado_em     timestamptz not null default now()
);
create index if not exists ncash_investimentos_user_idx on public.ncash_investimentos (user_id);

alter table public.ncash_investimentos enable row level security;
drop policy if exists "ncash: dono manda" on public.ncash_investimentos;
create policy "ncash: dono manda" on public.ncash_investimentos
  for all to authenticated using (public.ncash_pode(user_id)) with check (public.ncash_pode(user_id));

-- ── 4. Conta compartilhada: o lado do convidado ─────────────────────────

-- Os convites para o MEU e-mail, com o nome de quem convidou. Só devolve o
-- nome/e-mail de um dono que convidou este e-mail — nada além disso vaza.
create or replace function public.ncash_convites_para_mim()
returns table (dono_id uuid, dono_nome text, status text, convidado_em timestamptz, aceito_em timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select m.dono_id,
         coalesce(nullif(btrim(p.nome), ''), u.email, 'o titular') as dono_nome,
         m.status,
         m.convidado_em,
         m.aceito_em
    from public.ncash_membros m
    join auth.users u on u.id = m.dono_id
    left join public.hub_profiles p on p.id = m.dono_id
   where lower(m.email) = lower(coalesce(auth.email(), ''))
     and m.dono_id <> auth.uid()
   order by m.convidado_em desc;
$$;
revoke all on function public.ncash_convites_para_mim() from public, anon;
grant execute on function public.ncash_convites_para_mim() to authenticated;

-- Sair do NovareCash de um dono (aceito) ou recusar o convite (pendente).
-- A RLS de `ncash_membros` só deixa o DONO apagar; o convidado passa por aqui.
create or replace function public.ncash_sair_do_grupo(p_dono uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.ncash_membros
   where dono_id = p_dono
     and (membro_id = auth.uid() or lower(email) = lower(coalesce(auth.email(), '')));
  return found;
end;
$$;
revoke all on function public.ncash_sair_do_grupo(uuid) from public, anon;
grant execute on function public.ncash_sair_do_grupo(uuid) to authenticated;

-- ── Conferência: tudo deve voltar `true` ────────────────────────────────

select
  to_regclass('public.ncash_importacoes')       is not null as importacoes,
  exists (select 1 from information_schema.columns
           where table_schema = 'public' and table_name = 'ncash_transacoes' and column_name = 'importacao_id') as coluna_importacao_id,
  exists (select 1 from pg_constraint
           where conname = 'ncash_transacoes_origem_check'
             and pg_get_constraintdef(oid) like '%importacao%')                              as origem_importacao,
  to_regclass('public.ncash_categorias_custom') is not null as categorias_custom,
  to_regclass('public.ncash_investimentos')     is not null as investimentos,
  to_regprocedure('public.ncash_convites_para_mim()') is not null as convites_para_mim,
  to_regprocedure('public.ncash_sair_do_grupo(uuid)') is not null as sair_do_grupo;
