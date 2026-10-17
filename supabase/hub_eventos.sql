-- ============================================================================
-- MEDIÇÃO DE USO DO HUB — hub_eventos
-- ============================================================================
--
-- ⚠️ ANTES DISTO A CASA NÃO SABIA NADA. Não havia tabela de evento, nem
-- biblioteca de analytics, nem registro de abertura de app. O "Continue de
-- onde parou" da home lê `localStorage` — fica no aparelho do cliente, nunca
-- sobe, e some quando ele limpa o navegador. Perguntar "o que os clientes
-- estão acessando?" não tinha resposta possível.
--
-- O único sinal que existia era indireto: `tool_states.updated_at` diz quando
-- alguém gravou estado numa ferramenta. Mas é uma linha por (user_id, chave),
-- sem histórico, e só pega ferramenta que SALVA — quem abriu, olhou e saiu
-- não aparecia em lugar nenhum.
--
-- ── O QUE ESTA TABELA É, E O QUE ELA NÃO É ─────────────────────────────────
--
-- É um log de eventos simples: quem, o quê, quando. Serve para responder
-- "quais apps são usados", "quem sumiu há 30 dias" e "o que esse cliente
-- usa".
--
-- NÃO é analytics de produto. Não há funil, coorte, sessão nem device. Se um
-- dia precisar disso, o caminho é exportar daqui para uma ferramenta própria,
-- não inchar esta tabela.
--
-- ⚠️ NÃO GUARDA DADO PESSOAL ALÉM DO user_id. Nada de IP, nada de
-- user-agent, nada do CONTEÚDO que a pessoa digitou. É o dinheiro dela do
-- outro lado — e um log de uso que vaza hábito financeiro é pior do que não
-- ter log.
-- ============================================================================

create table if not exists public.hub_eventos (
  id uuid primary key default gen_random_uuid(),

  -- Quem. NULL = visitante não logado (as ferramentas são abertas).
  usuario_id uuid references auth.users(id) on delete cascade,

  -- O quê. Texto curto e estável: "fincash", "orcamento", "iris".
  -- ⚠️ É o SLUG do app/ferramenta, não o título — título muda, slug não.
  modulo text not null check (char_length(modulo) between 1 and 60),

  -- Que tipo de uso. Poucos valores de propósito: lista que cresce vira
  -- lista que ninguém entende seis meses depois.
  acao text not null default 'abriu'
    check (acao in ('abriu', 'usou', 'salvou', 'exportou')),

  criado_em timestamptz not null default now()
);

-- ── ÍNDICES ────────────────────────────────────────────────────────────────
-- As três perguntas que o painel faz, uma por índice.

-- "o que anda sendo usado?" (ordenação por data, sempre)
create index if not exists hub_eventos_criado_idx
  on public.hub_eventos (criado_em desc);

-- "o que ESTE cliente usa?" — a ficha do cliente
create index if not exists hub_eventos_usuario_idx
  on public.hub_eventos (usuario_id, criado_em desc);

-- "quanto este módulo é usado?" — o ranking
create index if not exists hub_eventos_modulo_idx
  on public.hub_eventos (modulo, criado_em desc);

-- ── RLS ────────────────────────────────────────────────────────────────────
alter table public.hub_eventos enable row level security;

-- Qualquer um grava, inclusive anônimo: as ferramentas são abertas e o uso
-- delas é justamente o que se quer medir. Mesmo princípio de `hub_leads`.
drop policy if exists hub_eventos_insert on public.hub_eventos;
create policy hub_eventos_insert
  on public.hub_eventos for insert
  to anon, authenticated
  with check (true);

-- ⚠️ SÓ ADMIN E EQUIPE LEEM. Sem esta policy, qualquer cliente logado
-- enxergaria o rastro de uso de todos os outros.
drop policy if exists hub_eventos_select on public.hub_eventos;
create policy hub_eventos_select
  on public.hub_eventos for select
  to authenticated
  using (public.hub_papel() in ('admin', 'equipe'));

-- Ninguém edita nem apaga: log que se reescreve não é log.
-- (A ausência de policy de update/delete já basta sob RLS.)

-- ============================================================================
-- hub_uso_por_modulo() — o ranking que o painel mostra
-- ============================================================================
-- `security definer` para agregar sobre a tabela inteira sem depender da RLS
-- linha a linha, e com `search_path` fixo — função definer sem search_path é
-- porta aberta para sequestro de schema.
-- ============================================================================
create or replace function public.hub_uso_por_modulo(p_dias int default 30)
returns table (
  modulo text,
  eventos bigint,
  pessoas bigint,
  ultimo timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    e.modulo,
    count(*)                              as eventos,
    count(distinct e.usuario_id)          as pessoas,
    max(e.criado_em)                      as ultimo
  from public.hub_eventos e
  where e.criado_em > now() - make_interval(days => greatest(p_dias, 1))
    and public.hub_papel() in ('admin', 'equipe')   -- a guarda vive aqui
  group by e.modulo
  order by count(*) desc;
$$;

revoke all on function public.hub_uso_por_modulo(int) from public, anon;
grant execute on function public.hub_uso_por_modulo(int) to authenticated;

-- ============================================================================
-- COMO RODAR
-- ============================================================================
-- Cole no SQL Editor do Supabase (projeto hjikeevfzfswqydduars) e execute.
-- É idempotente: pode rodar de novo sem quebrar nada.
--
-- Para conferir depois:
--   select * from public.hub_uso_por_modulo(30);
-- ============================================================================
