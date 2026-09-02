-- ============================================================================
-- NOVARE HUB - INSTALACAO COMPLETA DO BANCO
--
-- Cole TUDO isto de uma vez no SQL Editor do Supabase e clique em RUN.
-- Projeto: hjikeevfzfswqydduars
--
-- Rodar de novo e SEGURO: tudo usa `if not exists` / `or replace` /
-- `drop policy if exists` / `on conflict do nothing`. Nada e apagado.
--
-- ORDEM (importa: hub_leads consulta o papel em hub_profiles):
--   1. hub_profiles            perfis, papeis e planos
--   2. hub_profiles_completo   campos de cadastro
--   3. hub_leads               leads captados pelas ferramentas
--   4. tool_states             estado das ferramentas + premissas do plano
--   5. conta_consultores       acesso de equipe aos consultores
--   6. planejamento_autonomo   o app de Planejamento sem consultor
--   7. hub_notificacoes        o sino de avisos
--
-- DEPOIS DE RODAR: veja o bloco 8 no fim para se promover a admin.
-- ============================================================================




-- ==========================================================================
-- 1. PERFIS, PAPEIS E PLANOS
-- (origem: supabase/hub_profiles.sql)
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


-- ==========================================================================
-- 2. CAMPOS DE CADASTRO
-- (origem: supabase/hub_profiles_completo.sql)
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
-- 3. LEADS DAS FERRAMENTAS
-- (origem: supabase/hub_leads.sql)
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
  using (public.hub_papel() in ('admin', 'equipe'));

create index if not exists hub_leads_criado_idx on public.hub_leads (criado_em desc);


-- ==========================================================================
-- 4. ESTADO DAS FERRAMENTAS (e premissas do plano)
-- (origem: supabase/tool_states.sql)
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
-- 5. ACESSO DE EQUIPE
-- (origem: supabase/conta_consultores.sql)
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


-- ==========================================================================
-- 6. PLANEJAMENTO FINANCEIRO (autonomo)
-- (origem: supabase/planejamento_autonomo.sql)
-- ==========================================================================

-- ============================================================================
-- App Novare Planejamento Financeiro — permissões do produto autônomo
-- ----------------------------------------------------------------------------
-- Rodar UMA vez no SQL Editor do Supabase (projeto hjikeevfzfswqydduars).
-- É idempotente: pode rodar de novo sem quebrar nada.
--
-- POR QUE ISTO EXISTE
-- O banco foi desenhado para a consultoria ASSISTIDA: o cliente escreve o
-- próprio retrato financeiro (income, expenses, debts, assets, insurance,
-- goals — isso já funciona desde a migration 20260226030202), mas tudo o que o
-- consultor produzia a partir desses dados é só-leitura para ele: diagnóstico,
-- metas, plano de ação e fechamento do mês.
--
-- No produto autônomo não existe consultor. Quem gera essas linhas é o próprio
-- dono dos dados, a partir de cálculo determinístico. Estas policies dão a ele
-- esse direito — e SÓ sobre as linhas dele.
--
-- O QUE ISTO **NÃO** FAZ
-- Não altera, não remove e não enfraquece nenhuma policy de admin ou de
-- super_admin. É puramente aditivo. O app dos consultores continua idêntico.
--
-- Não mexe em investment_recommendations de propósito: recomendar produto de
-- investimento sem suitability é risco regulatório, e o produto autônomo fala
-- de classe de ativo, não de produto.
--
-- Também não mexe em acompanhamento_entradas: as policies de lá já permitem a
-- escrita do dono quando clients.client_can_log_acompanhamento = true, e o
-- cliente pode ligar essa flag sozinho (a policy de UPDATE em clients não tem
-- WITH CHECK). O app faz isso na primeira visita à tela do mês.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- diagnosis — os números derivados do retrato financeiro
-- ----------------------------------------------------------------------------
drop policy if exists "client_insert_own_diagnosis" on public.diagnosis;
create policy "client_insert_own_diagnosis"
  on public.diagnosis for insert to authenticated
  with check (
    exists (
      select 1 from public.clients c
      where c.id = diagnosis.client_id and c.user_id = auth.uid()
    )
  );

drop policy if exists "client_update_own_diagnosis" on public.diagnosis;
create policy "client_update_own_diagnosis"
  on public.diagnosis for update to authenticated
  using (
    exists (
      select 1 from public.clients c
      where c.id = diagnosis.client_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.clients c
      where c.id = diagnosis.client_id and c.user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- parecer_metas — as metas do plano
--
-- DELETE entra junto porque o cliente refaz o próprio plano quando os dados
-- mudam: sem DELETE, meta antiga vira lixo que nunca some da tela.
-- ----------------------------------------------------------------------------
drop policy if exists "client_insert_own_parecer_metas" on public.parecer_metas;
create policy "client_insert_own_parecer_metas"
  on public.parecer_metas for insert to authenticated
  with check (
    exists (
      select 1 from public.clients c
      where c.id = parecer_metas.client_id and c.user_id = auth.uid()
    )
  );

drop policy if exists "client_update_own_parecer_metas" on public.parecer_metas;
create policy "client_update_own_parecer_metas"
  on public.parecer_metas for update to authenticated
  using (
    exists (
      select 1 from public.clients c
      where c.id = parecer_metas.client_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.clients c
      where c.id = parecer_metas.client_id and c.user_id = auth.uid()
    )
  );

drop policy if exists "client_delete_own_parecer_metas" on public.parecer_metas;
create policy "client_delete_own_parecer_metas"
  on public.parecer_metas for delete to authenticated
  using (
    exists (
      select 1 from public.clients c
      where c.id = parecer_metas.client_id and c.user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- action_plans — o cabeçalho do plano de ação
-- ----------------------------------------------------------------------------
drop policy if exists "client_insert_own_action_plans" on public.action_plans;
create policy "client_insert_own_action_plans"
  on public.action_plans for insert to authenticated
  with check (
    exists (
      select 1 from public.clients c
      where c.id = action_plans.client_id and c.user_id = auth.uid()
    )
  );

drop policy if exists "client_update_own_action_plans" on public.action_plans;
create policy "client_update_own_action_plans"
  on public.action_plans for update to authenticated
  using (
    exists (
      select 1 from public.clients c
      where c.id = action_plans.client_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.clients c
      where c.id = action_plans.client_id and c.user_id = auth.uid()
    )
  );

drop policy if exists "client_delete_own_action_plans" on public.action_plans;
create policy "client_delete_own_action_plans"
  on public.action_plans for delete to authenticated
  using (
    exists (
      select 1 from public.clients c
      where c.id = action_plans.client_id and c.user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- action_items — as tarefas
--
-- action_items não tem client_id: o vínculo é action_plan_id -> action_plans.
-- Por isso o EXISTS aqui tem dois níveis.
-- ----------------------------------------------------------------------------
drop policy if exists "client_insert_own_action_items" on public.action_items;
create policy "client_insert_own_action_items"
  on public.action_items for insert to authenticated
  with check (
    exists (
      select 1 from public.action_plans p
      join public.clients c on c.id = p.client_id
      where p.id = action_items.action_plan_id and c.user_id = auth.uid()
    )
  );

drop policy if exists "client_update_own_action_items" on public.action_items;
create policy "client_update_own_action_items"
  on public.action_items for update to authenticated
  using (
    exists (
      select 1 from public.action_plans p
      join public.clients c on c.id = p.client_id
      where p.id = action_items.action_plan_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.action_plans p
      join public.clients c on c.id = p.client_id
      where p.id = action_items.action_plan_id and c.user_id = auth.uid()
    )
  );

drop policy if exists "client_delete_own_action_items" on public.action_items;
create policy "client_delete_own_action_items"
  on public.action_items for delete to authenticated
  using (
    exists (
      select 1 from public.action_plans p
      join public.clients c on c.id = p.client_id
      where p.id = action_items.action_plan_id and c.user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- monthly_closings — o fechamento do mês
--
-- Era o gargalo do produto: cloneToNextMonth() só rodava no botão do consultor,
-- e sem ele o mês seguinte nunca nascia. Agora o dono fecha o próprio mês.
-- O UPDATE existe para reabrir um mês (evento atípico: demissão, doença).
-- ----------------------------------------------------------------------------
drop policy if exists "client_insert_own_closings" on public.monthly_closings;
create policy "client_insert_own_closings"
  on public.monthly_closings for insert to authenticated
  with check (
    exists (
      select 1 from public.clients c
      where c.id = monthly_closings.client_id and c.user_id = auth.uid()
    )
  );

drop policy if exists "client_update_own_closings" on public.monthly_closings;
create policy "client_update_own_closings"
  on public.monthly_closings for update to authenticated
  using (
    exists (
      select 1 from public.clients c
      where c.id = monthly_closings.client_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.clients c
      where c.id = monthly_closings.client_id and c.user_id = auth.uid()
    )
  );

-- ============================================================================
-- Conferência: deve listar 14 linhas, todas começando com "client_".
-- ============================================================================
select tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and policyname like 'client\_%own%'
  and tablename in (
    'diagnosis','parecer_metas','action_plans','action_items','monthly_closings'
  )
order by tablename, policyname;


-- ==========================================================================
-- 7. SINO DE NOTIFICACOES
-- (origem: supabase/hub_notificacoes.sql)
-- ==========================================================================

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


-- ==========================================================================
-- 8. SE PROMOVER A ADMIN  <<< TROQUE O E-MAIL ABAIXO PELO SEU >>>
-- ==========================================================================
--
-- 'admin' abre tudo: Planejamento, Iris e /meu-dia, sem depender do campo
-- `plano`. O Hub trata qualquer papel diferente de 'cliente' como assinante.

update public.hub_profiles
   set role = 'admin'
 where id = (select id from auth.users where email = 'SEU-EMAIL@AQUI');


-- Confira (deve mostrar role = admin):
select p.role, p.plano, u.email
  from public.hub_profiles p
  join auth.users u on u.id = p.id
 where u.email = 'SEU-EMAIL@AQUI';


-- ==========================================================================
-- 9. OPCIONAL - liberar o PRO para a conta de teste
-- ==========================================================================
-- Ela ja tem 7 dias gratis automaticos. Rode so se quiser testar como
-- assinante pagante (e o mesmo comando que voce usara quando alguem comprar).

-- update public.hub_profiles
--    set plano = 'pro', plano_expira_em = now() + interval '1 year'
--  where id = (select id from auth.users
--              where email = 'marketingcastriani+teste2@gmail.com');


-- ==========================================================================
-- 10. OPCIONAL - criar um aviso de teste no sino
-- ==========================================================================

-- insert into public.hub_notificacoes (titulo, texto, href, tipo)
-- values ('Iris agora le extrato em PDF',
--         'Cole ou suba o arquivo e ela devolve o resumo do mes.',
--         '/iris', 'novidade');
