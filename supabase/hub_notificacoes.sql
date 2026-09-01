-- ============================================================================
-- Novare Hub — notificações do usuário
-- Projeto Supabase: hjikeevfzfswqydduars (mesmo do novareapp)
--
-- Rode este script UMA VEZ no SQL Editor do Supabase.
-- Só cria coisa nova com prefixo `hub_` — não toca em nada existente.
--
-- O Hub funciona sem esta tabela: enquanto ela não existir, o sino aparece
-- vazio (ver src/lib/notificacoes.ts). Rodar isto é o que liga o recurso.
-- ============================================================================

create table if not exists public.hub_notificacoes (
  id         uuid primary key default gen_random_uuid(),
  -- Dono da notificação. Nulo = aviso da casa para TODO mundo (ver policy).
  usuario_id uuid references auth.users (id) on delete cascade,
  titulo     text not null,
  texto      text,
  -- Para onde o clique leva. Caminho interno do Hub, ex.: '/planejamento'.
  href       text,
  -- Muda só o ícone e a cor da bolinha no sino.
  tipo       text not null default 'aviso'
             check (tipo in ('aviso', 'novidade', 'conta', 'alerta')),
  lida_em    timestamptz,
  criado_em  timestamptz not null default now()
);

-- O sino sempre pede "as minhas, mais recentes primeiro".
create index if not exists hub_notificacoes_usuario_idx
  on public.hub_notificacoes (usuario_id, criado_em desc);

alter table public.hub_notificacoes enable row level security;

-- Cada um lê as suas e os avisos gerais da casa (usuario_id nulo).
drop policy if exists "hub_notificacoes: leitura propria" on public.hub_notificacoes;
create policy "hub_notificacoes: leitura propria"
  on public.hub_notificacoes for select
  to authenticated
  using (usuario_id = auth.uid() or usuario_id is null);

-- Marcar como lida é a ÚNICA escrita que o usuário pode fazer, e só nas
-- próprias linhas: o aviso geral (usuario_id nulo) é compartilhado, então
-- deixá-lo ser marcado por um usuário apagaria o aviso para todos.
drop policy if exists "hub_notificacoes: marcar lida" on public.hub_notificacoes;
create policy "hub_notificacoes: marcar lida"
  on public.hub_notificacoes for update
  to authenticated
  using (usuario_id = auth.uid())
  with check (usuario_id = auth.uid());

-- Quem cria notificação é o admin (ou o service_role, pelo backend).
drop policy if exists "hub_notificacoes: admin escreve" on public.hub_notificacoes;
create policy "hub_notificacoes: admin escreve"
  on public.hub_notificacoes for all
  to authenticated
  using (public.hub_papel() = 'admin')
  with check (public.hub_papel() = 'admin');

-- ============================================================================
-- Exemplos — rode depois, trocando o e-mail.
-- ============================================================================
-- Aviso da casa para todo mundo:
-- insert into public.hub_notificacoes (titulo, texto, href, tipo)
-- values ('Íris agora lê extrato em PDF',
--         'Cole ou suba o arquivo e ela devolve o resumo do mês.',
--         '/iris', 'novidade');
--
-- Aviso para uma pessoa só:
-- insert into public.hub_notificacoes (usuario_id, titulo, texto, href, tipo)
-- select id, 'Seu plano está pronto', 'O Vida Plan já tem seus objetivos.',
--        '/planejamento', 'conta'
-- from auth.users where email = 'CLIENTE@AQUI';
