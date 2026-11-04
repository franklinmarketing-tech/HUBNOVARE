-- ═══════════════════════════════════════════════════════════════════════
-- NOVARECASH — OS DADOS PRÓPRIOS DO APP (03/11/2026)
--
-- Decisão do dono: o NovareCash é OUTRO app, sem o FINCASH dentro. Ele tem o
-- próprio extrato, que enche sozinho pelo banco (Open Finance) e pelo WhatsApp,
-- e aceita lançamento à mão. Nada aqui lê ou escreve nas tabelas `fin_*`.
--
-- ⚠️ PRIVACIDADE: diferente do FINCASH, a EQUIPE NÃO LÊ estes dados. Só o dono.
-- (No FINCASH a equipe lê para escrever a revisão do plano; aqui não há esse
-- serviço, e a regra mais estreita evita misturar dados de clientes na tela de
-- quem é da equipe.)
--
-- REGRA DO MODELO (a mesma do FINCASH, por ser a que não erra): `valor` é
-- SEMPRE positivo; o sinal vem de `tipo` ('entrada' | 'saida').
--
-- DEDUPLICAÇÃO: o que vem de fora (banco, WhatsApp) traz `externo_id`; o índice
-- único (user_id, origem, externo_id) impede a mesma transação entrar duas vezes.
--
-- Rode DEPOIS de `novarecash.sql` e `novarecash_app.sql`. Seguro rodar de novo.
-- ═══════════════════════════════════════════════════════════════════════

create table if not exists public.ncash_contas (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome          text not null,
  tipo          text not null default 'conta' check (tipo in ('conta', 'cartao', 'investimento')),
  instituicao   text,
  origem        text not null default 'manual' check (origem in ('manual', 'openfinance')),
  externo_id    text,                       -- id da conta no Open Finance
  saldo         numeric(14, 2),             -- último saldo conhecido (banco) ou informado
  saldo_em      timestamptz,
  ativa         boolean not null default true,
  criado_em     timestamptz not null default now()
);
create unique index if not exists ncash_contas_externo_uq on public.ncash_contas (user_id, origem, externo_id) where externo_id is not null;

create table if not exists public.ncash_transacoes (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  conta_id      uuid references public.ncash_contas (id) on delete set null,
  data          date not null,
  descricao     text not null,
  valor         numeric(14, 2) not null check (valor > 0),
  tipo          text not null check (tipo in ('entrada', 'saida')),
  categoria     text not null default 'outros',   -- chave de CATEGORIAS em src/lib/novarecash/categorias.ts
  origem        text not null default 'manual' check (origem in ('manual', 'whatsapp', 'openfinance')),
  externo_id    text,
  observacao    text,
  criado_em     timestamptz not null default now()
);
create unique index if not exists ncash_transacoes_externo_uq on public.ncash_transacoes (user_id, origem, externo_id) where externo_id is not null;
create index if not exists ncash_transacoes_user_data_idx on public.ncash_transacoes (user_id, data desc);

-- Orçamento: um limite MENSAL por categoria (vale para todo mês até mudar).
create table if not exists public.ncash_orcamentos (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  categoria  text not null,
  limite     numeric(14, 2) not null check (limite >= 0),
  primary key (user_id, categoria)
);

alter table public.ncash_contas enable row level security;
alter table public.ncash_transacoes enable row level security;
alter table public.ncash_orcamentos enable row level security;

-- ⚠️ SÓ CRIA SE AINDA NÃO EXISTIR (04/11/2026): `novarecash_compartilhar.sql`
-- troca esta policy pela regra única `ncash_pode()`. Com o antigo
-- "drop + create", rodar ESTE arquivo de novo depois daquele voltava a regra
-- para "só o próprio" — e quem está na conta compartilhada perdia o acesso aos
-- dados da casa sem nenhum erro aparecer.
do $$
declare
  t text;
begin
  foreach t in array array['ncash_contas', 'ncash_transacoes', 'ncash_orcamentos'] loop
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = t and policyname = 'ncash: dono manda') then
      execute format(
        'create policy "ncash: dono manda" on public.%I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())',
        t
      );
    end if;
  end loop;
end $$;

select
  to_regclass('public.ncash_contas')     is not null as contas,
  to_regclass('public.ncash_transacoes') is not null as transacoes,
  to_regclass('public.ncash_orcamentos') is not null as orcamentos;
