-- ============================================================================
-- Pedido de análise — o cliente chama o consultor
-- ----------------------------------------------------------------------------
-- Rodar UMA vez no SQL Editor do Supabase (projeto hjikeevfzfswqydduars).
-- É idempotente: pode rodar de novo sem quebrar nada.
--
-- POR QUE ISTO EXISTE
-- A revisão trimestral é do consultor para o cliente, no ritmo do calendário.
-- Falta o caminho inverso: a pessoa que estourou o orçamento em março não
-- pode esperar até junho para alguém olhar. Este é o botão que ela aperta.
--
-- POR QUE TABELA SEPARADA, e não uma coluna em `revisoes`
-- `revisoes` é escrita só pela equipe — é a regra que impede o cliente de
-- editar um parecer sobre si mesmo. Abrir escrita ali para o cliente, ainda
-- que de uma coluna, exigiria uma policy que o RLS não sabe restringir por
-- campo. Uma tabela própria mantém as duas regras simples: aqui o cliente
-- escreve o pedido dele, lá só a equipe escreve o parecer.
-- ============================================================================

create table if not exists public.pedidos_revisao (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references public.clients(id) on delete cascade,

  -- O que estava fora do lugar quando a pessoa pediu. Gravado no momento do
  -- clique porque é isso que o consultor precisa ler primeiro — e porque o
  -- número muda: em duas semanas o motivo já não seria o mesmo.
  motivo     text not null default '',

  criado_em  timestamptz not null default now(),

  -- Fecha quando a revisão sai. Sem isto o pedido fica na fila para sempre.
  atendido_em timestamptz
);

comment on table public.pedidos_revisao is
  'Pedido do cliente para o consultor olhar o plano fora do ciclo trimestral.';

-- A fila do consultor pergunta "quem está pedindo e ainda não foi atendido".
create index if not exists pedidos_revisao_abertos_idx
  on public.pedidos_revisao (client_id, criado_em desc)
  where atendido_em is null;

alter table public.pedidos_revisao enable row level security;

-- O cliente cria o pedido dele, e só o dele.
drop policy if exists "pedidos: cliente cria o proprio" on public.pedidos_revisao;
create policy "pedidos: cliente cria o proprio"
  on public.pedidos_revisao for insert
  with check (
    exists (
      select 1 from public.clients c
       where c.id = pedidos_revisao.client_id
         and c.user_id = auth.uid()
    )
  );

-- E lê os dele, para a tela saber que já pediu (e não deixar pedir de novo).
drop policy if exists "pedidos: cliente le os proprios" on public.pedidos_revisao;
create policy "pedidos: cliente le os proprios"
  on public.pedidos_revisao for select
  using (
    exists (
      select 1 from public.clients c
       where c.id = pedidos_revisao.client_id
         and c.user_id = auth.uid()
    )
  );

-- A equipe lê tudo e marca como atendido.
drop policy if exists "pedidos: equipe le e atende" on public.pedidos_revisao;
create policy "pedidos: equipe le e atende"
  on public.pedidos_revisao for all
  using (public.hub_papel() in ('admin', 'equipe'))
  with check (public.hub_papel() in ('admin', 'equipe'));


-- ----------------------------------------------------------------------------
-- Conferência — deve listar 3 policies
-- ----------------------------------------------------------------------------
select policyname, cmd
  from pg_policies
 where schemaname = 'public' and tablename = 'pedidos_revisao'
 order by policyname;
