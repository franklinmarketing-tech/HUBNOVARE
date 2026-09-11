-- ============================================================================
-- FINCASH → Planejamento Financeiro: o diário da ponte
-- ----------------------------------------------------------------------------
-- Rodar UMA vez no SQL Editor do Supabase. Idempotente.
-- ⚠️ NÃO foi rodado ainda. Até rodar, a tela /fincash/app/planejamento mostra
--    "falta rodar o SQL" em vez de meio funcionar.
--
-- POR QUE UMA TABELA NOVA, E NÃO UMA COLUNA NAS TABELAS DO PLANEJAMENTO
-- A marca de origem poderia ser uma coluna `origem text` em income, expenses,
-- debts e assets. Foi descartado, e o motivo vale ser lido antes de alguém
-- reverter a decisão:
--
--   • Essas quatro tabelas sustentam um SERVIÇO PAGO (a revisão trimestral) e
--     são lidas pelo app dos consultores, que não está neste repositório.
--     Coluna nova lá é mudança de contrato com um código que não vemos.
--   • `mesSeguinte.ts` CLONA linhas de um mês para o outro campo a campo. Uma
--     coluna de origem seria clonada junto, e o mês seguinte nasceria dizendo
--     "veio do FINCASH" sobre um número que ninguém mediu.
--   • Uma coluna guarda que veio da ponte. NÃO guarda o que estava lá antes —
--     e sem isso não existe desfazer, só existe carimbo.
--
-- Este diário resolve as três: mora do nosso lado, não viaja no clone, e
-- guarda o valor anterior. Se um dia o dono quiser também a marca na própria
-- linha, ela pode ser acrescentada depois sem desfazer nada disto.
--
-- O QUE ESTE ARQUIVO **NÃO** FAZ
-- Não cria, não altera e não remove nada em clients, income, expenses, debts,
-- assets, insurance ou goals. Não toca em policy nenhuma delas. É puramente
-- aditivo, e inteiramente dentro do território `fin_*` do FINCASH.
-- ============================================================================

create table if not exists public.fin_ponte_envios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,

  -- O lote é o "desfazer" inteiro: tudo que foi numa confirmação volta junto.
  -- Desfazer linha a linha deixaria o retrato meio migrado, que é o pior dos
  -- dois estados — nem o número medido, nem o número que a pessoa lembrava.
  lote_id uuid not null,

  -- `month_ref` do Planejamento (primeiro dia do mês), não o "2026-03" do
  -- FINCASH: é o mês da linha que foi tocada, e é assim que se reencontra lá.
  mes_ref date not null,

  tabela text not null check (tabela in ('income', 'expenses', 'debts', 'assets')),
  linha_id uuid not null,

  acao text not null check (acao in ('inserida', 'atualizada')),

  -- O valor que estava na linha ANTES. Nulo quando a linha não existia.
  -- É isto, e só isto, que torna a ponte reversível.
  valor_anterior jsonb,
  valor_novo jsonb,

  criado_em timestamptz not null default now(),
  -- Marcado, nunca apagado: saber que um envio foi desfeito é informação, e
  -- apagar a linha do diário apagaria o histórico de que a ponte passou por ali.
  desfeito_em timestamptz
);

-- A consulta real é sempre "meus envios vivos deste mês, do mais novo para o
-- mais velho". Sem este índice ela vira varredura assim que o histórico cresce.
create index if not exists fin_ponte_envios_dono_idx
  on public.fin_ponte_envios (user_id, mes_ref, criado_em desc);

create index if not exists fin_ponte_envios_lote_idx
  on public.fin_ponte_envios (lote_id);

alter table public.fin_ponte_envios enable row level security;

-- Um diário de quem tocou no dado de dinheiro de alguém é, ele próprio, dado
-- sensível: ele diz quanto a pessoa ganhava e quanto passou a ganhar. As
-- policies são as mesmas do resto do FINCASH — dono, e mais ninguém.
drop policy if exists "fin_ponte_envios_ler" on public.fin_ponte_envios;
create policy "fin_ponte_envios_ler"
  on public.fin_ponte_envios for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "fin_ponte_envios_inserir" on public.fin_ponte_envios;
create policy "fin_ponte_envios_inserir"
  on public.fin_ponte_envios for insert to authenticated
  with check (user_id = auth.uid());

-- UPDATE existe só para marcar `desfeito_em`. Não há policy de DELETE de
-- propósito: diário que pode ser apagado não é diário.
drop policy if exists "fin_ponte_envios_atualizar" on public.fin_ponte_envios;
create policy "fin_ponte_envios_atualizar"
  on public.fin_ponte_envios for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
