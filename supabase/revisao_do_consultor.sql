-- ============================================================================
-- Revisão do consultor — o parecer trimestral que a assinatura passou a incluir
-- ----------------------------------------------------------------------------
-- Rodar UMA vez no SQL Editor do Supabase (projeto hjikeevfzfswqydduars).
-- É idempotente: pode rodar de novo sem quebrar nada.
--
-- POR QUE ISTO EXISTE
-- A assinatura deixou de ser só software: a cada trimestre um consultor da
-- Novare lê o plano do cliente e escreve o que mudou, o que está travando e
-- qual é o próximo passo. Este arquivo cria a tabela onde esse parecer mora e
-- o acesso que o consultor precisa para escrevê-lo.
--
-- ⚠️ O QUE ISTO MUDA NA PRIVACIDADE — leia antes de rodar
-- Hoje o retrato financeiro de cada cliente é lido apenas pelo dono
-- (`clients.user_id = auth.uid()`). Para escrever o parecer, o consultor
-- precisa ENXERGAR esses números. A parte 2 abre leitura das tabelas do plano
-- para quem tem `hub_profiles.role` em ('admin','equipe').
--
-- Isso é uma decisão de negócio, não um detalhe técnico: a equipe passa a
-- poder ler o retrato financeiro de qualquer assinante. É o que torna a
-- consultoria assistida possível — e é exatamente o que uma consultoria faz —,
-- mas precisa estar dito na Política de Privacidade antes de entrar no ar.
--
-- Só LEITURA. Nenhuma policy de escrita é criada para a equipe nas tabelas do
-- cliente: o consultor comenta, não edita o plano de ninguém.
--
-- O QUE ISTO NÃO FAZ
-- Não toca em `investment_recommendations`. Recomendar produto sem suitability
-- é risco regulatório, e a decisão da casa é explícita: presta-se consultoria
-- FINANCEIRA (organizar, projetar, priorizar), não indicação de ativo.
--
-- Não altera nem enfraquece nenhuma policy existente — nem as do app legado
-- dos consultores (que checam `super_admin`, outro sistema de papel), nem as
-- do produto autônomo (`planejamento_autonomo.sql`). É puramente aditivo.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. A tabela do parecer
-- ----------------------------------------------------------------------------
create table if not exists public.revisoes (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null references public.clients(id) on delete cascade,

  -- Quem escreveu. Fica registrado para dar nome ao parecer na tela do cliente
  -- e para saber quem fez o quê.
  autor_id     uuid not null references auth.users(id),

  -- O trimestre a que o parecer se refere, como PRIMEIRO DIA do mês inicial
  -- (2026-07-01 = 3º trimestre). Mesma convenção de `month_ref` no resto do
  -- banco: data, sempre dia 1, para ordenar e comparar sem ambiguidade.
  periodo_ref  date not null,

  texto        text not null default '',

  -- `rascunho` fica invisível para o cliente. Só `enviada` aparece — o
  -- consultor precisa poder salvar no meio do caminho sem publicar.
  status       text not null default 'rascunho'
               check (status in ('rascunho', 'enviada')),

  criada_em    timestamptz not null default now(),
  atualizada_em timestamptz not null default now(),
  enviada_em   timestamptz,

  -- Um parecer por cliente por trimestre. Sem isto, dois consultores abrindo
  -- o mesmo cliente criariam dois pareceres e o cliente veria os dois.
  unique (client_id, periodo_ref)
);

comment on table public.revisoes is
  'Parecer trimestral do consultor sobre o plano do cliente. Consultoria financeira: comenta o plano, não indica ativo.';

create index if not exists revisoes_client_idx
  on public.revisoes (client_id, periodo_ref desc);

-- Para a fila do consultor: "quem tem parecer pendente".
create index if not exists revisoes_status_idx
  on public.revisoes (status, periodo_ref desc);

alter table public.revisoes enable row level security;


-- ----------------------------------------------------------------------------
-- 2. Quem pode o quê na tabela do parecer
-- ----------------------------------------------------------------------------
-- `hub_papel()` já existe (hub_profiles.sql) e é `security definer`: lê o papel
-- SEM passar pelas policies. Usar um select direto em hub_profiles aqui
-- recriaria a recursão infinita que `CORRIGIR_RECURSAO.sql` teve de consertar.

-- O cliente lê os pareceres dele — e só os já enviados.
drop policy if exists "revisoes: cliente le as enviadas" on public.revisoes;
create policy "revisoes: cliente le as enviadas"
  on public.revisoes for select
  using (
    status = 'enviada'
    and exists (
      select 1 from public.clients c
       where c.id = revisoes.client_id
         and c.user_id = auth.uid()
    )
  );

-- A equipe lê todas, inclusive rascunhos.
drop policy if exists "revisoes: equipe le tudo" on public.revisoes;
create policy "revisoes: equipe le tudo"
  on public.revisoes for select
  using (public.hub_papel() in ('admin', 'equipe'));

-- Só a equipe escreve. O cliente nunca cria nem edita um parecer sobre si.
drop policy if exists "revisoes: equipe escreve" on public.revisoes;
create policy "revisoes: equipe escreve"
  on public.revisoes for insert
  with check (
    public.hub_papel() in ('admin', 'equipe')
    and autor_id = auth.uid()          -- ninguém assina em nome de outro
  );

drop policy if exists "revisoes: equipe edita" on public.revisoes;
create policy "revisoes: equipe edita"
  on public.revisoes for update
  using (public.hub_papel() in ('admin', 'equipe'));

-- Sem policy de DELETE de propósito: parecer enviado é registro do que foi
-- dito ao cliente. Para retirar da vista, volte o status para 'rascunho'.


-- ----------------------------------------------------------------------------
-- 3. A equipe passa a LER o retrato financeiro (é o que permite o parecer)
-- ----------------------------------------------------------------------------
-- Só SELECT. A escrita continua exclusiva do dono dos dados.
do $$
declare
  t text;
begin
  foreach t in array array[
    'clients', 'income', 'expenses', 'debts', 'assets', 'insurance', 'goals',
    'diagnosis', 'parecer_metas', 'monthly_closings', 'acompanhamento_entradas'
  ]
  loop
    execute format(
      'drop policy if exists "equipe le para revisar" on public.%I', t
    );
    execute format(
      'create policy "equipe le para revisar" on public.%I
         for select using (public.hub_papel() in (''admin'', ''equipe''))', t
    );
  end loop;
end $$;


-- ----------------------------------------------------------------------------
-- 4. Conferência — rode depois e leia o resultado
-- ----------------------------------------------------------------------------
-- Deve listar 4 policies em `revisoes`:
select policyname, cmd
  from pg_policies
 where schemaname = 'public' and tablename = 'revisoes'
 order by policyname;

-- Deve listar 11 linhas, uma por tabela do retrato:
select tablename
  from pg_policies
 where schemaname = 'public' and policyname = 'equipe le para revisar'
 order by tablename;
