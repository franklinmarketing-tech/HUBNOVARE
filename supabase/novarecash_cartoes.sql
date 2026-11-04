-- ═══════════════════════════════════════════════════════════════════════
-- NOVARECASH — CARTÕES COM FATURA, CONTAS A PAGAR E LEMBRETE NO WHATSAPP (04/11/2026)
--
-- ORDEM DE RODAR (SQL Editor do Supabase, projeto hjikeevfzfswqydduars):
--   1. `novarecash.sql`, `novarecash_app.sql`
--   2. `novarecash_dados.sql`        — cria `ncash_contas` e `ncash_transacoes`
--   3. `novarecash_compartilhar.sql` — cria a regra `ncash_pode()`
--   4. ESTE ARQUIVO                  — depende dos passos 2 e 3
-- Seguro rodar de novo: só `if not exists` e `drop policy if exists`.
--
-- O QUE ENTRA
-- 1. Cartão: dia de fechamento, dia de vencimento e limite (em `ncash_contas`).
-- 2. Compra parcelada: `parcela`, `parcelas` e `compra_id` (em `ncash_transacoes`).
--    "R$ 600 em 6x" = 6 lançamentos, um por fatura, com o mesmo `compra_id`.
--    O "Pagar fatura" também usa `compra_id` para ligar as duas pernas
--    (saída na conta + entrada no cartão), e desfazer apaga as duas.
--    A FATURA NÃO É GUARDADA: sai da data de cada lançamento e do fechamento
--    (regra em `src/lib/novarecash/cartoes.ts`).
-- 3. Contas a pagar (`ncash_contas_pagar`) e os pagamentos por competência
--    (`ncash_contas_pagas`). O índice único (conta, competência) impede pagar
--    o mesmo mês duas vezes.
-- 4. `ncash_lembretes_enviados`: um lembrete por dono por dia, no máximo.
--
-- ACESSO: toda tabela nova usa a regra única `ncash_pode(user_id)` (dono ou
-- membro aceito da conta compartilhada). `user_id` = o DONO do NovareCash.
-- A EQUIPE NÃO LÊ (decisão de 03/11). O lembrete roda com a chave de serviço.
--
-- A CATEGORIA `pagamento_fatura` mora no código (`categorias.ts`), não aqui:
-- `ncash_transacoes.categoria` é texto livre.
-- ═══════════════════════════════════════════════════════════════════════

-- ── 1. Cartão: fechamento, vencimento e limite ──────────────────────────
alter table public.ncash_contas
  add column if not exists fecha_dia smallint check (fecha_dia between 1 and 31);
alter table public.ncash_contas
  add column if not exists vence_dia smallint check (vence_dia between 1 and 31);
alter table public.ncash_contas
  add column if not exists limite numeric(14, 2) check (limite >= 0);

-- ── 2. Compra parcelada ─────────────────────────────────────────────────
alter table public.ncash_transacoes add column if not exists parcela smallint;
alter table public.ncash_transacoes add column if not exists parcelas smallint;
alter table public.ncash_transacoes add column if not exists compra_id uuid;

-- Parcela coerente: as duas vazias (à vista) ou 1 ≤ parcela ≤ parcelas ≤ 72.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'ncash_transacoes_parcela_ok') then
    alter table public.ncash_transacoes add constraint ncash_transacoes_parcela_ok check (
      (parcela is null and parcelas is null)
      or (parcelas between 1 and 72 and parcela between 1 and parcelas)
    );
  end if;
end $$;

create index if not exists ncash_transacoes_compra_idx
  on public.ncash_transacoes (user_id, compra_id) where compra_id is not null;
create index if not exists ncash_transacoes_conta_data_idx
  on public.ncash_transacoes (conta_id, data);

-- ── 3. Contas a pagar ───────────────────────────────────────────────────
create table if not exists public.ncash_contas_pagar (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  descricao    text not null check (length(trim(descricao)) between 1 and 120),
  valor        numeric(14, 2) not null check (valor > 0),
  categoria    text not null default 'outros',      -- chave de `categorias.ts`
  recorrencia  text not null default 'mensal' check (recorrencia in ('mensal', 'unica')),
  vence_dia    smallint check (vence_dia between 1 and 31),   -- mensal
  vence_em     date,                                          -- única
  conta_id     uuid references public.ncash_contas (id) on delete set null, -- de onde sai
  ativa        boolean not null default true,
  criado_em    timestamptz not null default now(),
  constraint ncash_contas_pagar_vencimento_ok check (
    (recorrencia = 'mensal' and vence_dia is not null)
    or (recorrencia = 'unica' and vence_em is not null)
  )
);
create index if not exists ncash_contas_pagar_user_idx on public.ncash_contas_pagar (user_id);

create table if not exists public.ncash_contas_pagas (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  conta_pagar_id  uuid not null references public.ncash_contas_pagar (id) on delete cascade,
  competencia     text not null check (competencia ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),  -- "2026-11"
  transacao_id    uuid references public.ncash_transacoes (id) on delete set null,
  pago_em         date not null,
  valor           numeric(14, 2) not null check (valor > 0),
  criado_em       timestamptz not null default now()
);
create unique index if not exists ncash_contas_pagas_uq on public.ncash_contas_pagas (conta_pagar_id, competencia);
create index if not exists ncash_contas_pagas_user_idx on public.ncash_contas_pagas (user_id, competencia);

-- ── 4. Lembretes enviados (um por dono por dia) ─────────────────────────
create table if not exists public.ncash_lembretes_enviados (
  user_id          uuid not null references auth.users (id) on delete cascade,
  dia              date not null,                 -- o dia do envio, no fuso de São Paulo
  contas           integer not null default 0,    -- quantas contas foram lembradas
  provedor_msg_id  text,
  criado_em        timestamptz not null default now(),
  primary key (user_id, dia)
);

-- ── RLS: a regra única ──────────────────────────────────────────────────
alter table public.ncash_contas_pagar enable row level security;
alter table public.ncash_contas_pagas enable row level security;
alter table public.ncash_lembretes_enviados enable row level security;

drop policy if exists "ncash: dono manda" on public.ncash_contas_pagar;
create policy "ncash: dono manda" on public.ncash_contas_pagar
  for all to authenticated using (public.ncash_pode(user_id)) with check (public.ncash_pode(user_id));

drop policy if exists "ncash: dono manda" on public.ncash_contas_pagas;
create policy "ncash: dono manda" on public.ncash_contas_pagas
  for all to authenticated using (public.ncash_pode(user_id)) with check (public.ncash_pode(user_id));

drop policy if exists "ncash: dono manda" on public.ncash_lembretes_enviados;
create policy "ncash: dono manda" on public.ncash_lembretes_enviados
  for all to authenticated using (public.ncash_pode(user_id)) with check (public.ncash_pode(user_id));

-- ── Conferência: tudo deve voltar `true` ────────────────────────────────
select
  exists (select 1 from information_schema.columns where table_schema = 'public'
           and table_name = 'ncash_contas' and column_name = 'fecha_dia')        as cartao_fechamento,
  exists (select 1 from information_schema.columns where table_schema = 'public'
           and table_name = 'ncash_contas' and column_name = 'limite')           as cartao_limite,
  exists (select 1 from information_schema.columns where table_schema = 'public'
           and table_name = 'ncash_transacoes' and column_name = 'compra_id')    as parcelas,
  to_regclass('public.ncash_contas_pagar')       is not null                     as contas_pagar,
  to_regclass('public.ncash_contas_pagas')       is not null                     as contas_pagas,
  to_regclass('public.ncash_lembretes_enviados') is not null                     as lembretes,
  (select count(*) from pg_policies where schemaname = 'public'
     and tablename in ('ncash_contas_pagar', 'ncash_contas_pagas', 'ncash_lembretes_enviados')
     and qual like '%ncash_pode%') = 3                                           as rls_ncash_pode;
