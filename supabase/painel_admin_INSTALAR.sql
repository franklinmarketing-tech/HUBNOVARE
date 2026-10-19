-- ═══════════════════════════════════════════════════════════════════════
-- O PAINEL DE ADMINISTRAÇÃO INTEIRO — instalar de uma vez
--
-- ⚠️ POR QUE ISTO EXISTE: as telas de /admin foram escritas, commitadas e
-- publicadas, mas as funções de banco que elas chamam NUNCA FORAM CRIADAS no
-- projeto. O sintoma é o da tela de Assinantes:
--
--     Could not find the function public.hub_assinantes
--     without parameters in the schema cache
--
-- Não é bug de código: é SQL que ficou por rodar. Os arquivos existiam
-- soltos no repositório (`assinantes.sql`, `hub_eventos.sql`,
-- `CORRIGIR_RECURSAO.sql`) e cada um tinha de ser rodado à mão, na ordem
-- certa. Este junta os três, na ordem das dependências.
--
-- ⚠️ É SEGURO RODAR MAIS DE UMA VEZ. Tudo é `create or replace` /
-- `if not exists`. Rodar de novo não apaga dado nenhum.
--
-- ⚠️ O QUE MUDOU DESDE QUE OS ORIGINAIS FORAM ESCRITOS: o Hub virou gratuito
-- e o FINPLAN deixou de existir. A função de assinantes dependia de
-- `vidaplan_subscriptions`, uma tabela do projeto ANTIGO (`novareapp`) que
-- pode não existir mais neste banco — e era isso que derrubava o
-- `assinantes.sql` original quando alguém tentava rodá-lo. Aqui ela é
-- OPCIONAL: a função se adapta, e o painel abre dos dois jeitos.
--
-- Rode no SQL Editor do projeto hjikeevfzfswqydduars.
-- ═══════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────
-- 1. `hub_papel()` — a base de tudo
--
-- Toda função deste arquivo pergunta a ela quem está chamando. Ela existe
-- separada, e é `security definer`, para quebrar a recursão de RLS: uma
-- policy de `hub_profiles` que consultasse `hub_profiles` para saber o papel
-- chamaria a si mesma sem fim.
-- ─────────────────────────────────────────────────────────────────────
create or replace function public.hub_papel()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select role from public.hub_profiles where id = auth.uid()),
    'cliente'   -- quem entra sem perfil cai no MENOR privilégio
  );
$$;

revoke all on function public.hub_papel() from public;
grant execute on function public.hub_papel() to anon, authenticated;


-- ─────────────────────────────────────────────────────────────────────
-- 2. A trilha de auditoria das liberações
--
-- Dinheiro e acesso mudam de mão aqui: fica registrado quem fez, quando e
-- por quê. Sem isto, liberar alguém é um UPDATE anônimo no painel do
-- Supabase, e ninguém sabe explicar depois.
-- ─────────────────────────────────────────────────────────────────────
create table if not exists public.hub_liberacoes (
  id         uuid primary key default gen_random_uuid(),
  alvo_id    uuid not null references auth.users (id) on delete cascade,
  feito_por  uuid references auth.users (id) on delete set null,
  acao       text not null check (acao in ('liberou', 'cortou')),
  ate        timestamptz,
  motivo     text,
  criado_em  timestamptz not null default now()
);

alter table public.hub_liberacoes enable row level security;

drop policy if exists "hub_liberacoes: so admin le" on public.hub_liberacoes;
create policy "hub_liberacoes: so admin le"
  on public.hub_liberacoes for select
  to authenticated
  using (public.hub_papel() = 'admin');


-- ─────────────────────────────────────────────────────────────────────
-- 3. `hub_assinantes()` — quem é quem, com o e-mail junto
--
-- `security definer` porque precisa ler `auth.users`, que o PostgREST não
-- expõe. A trava fica DENTRO da função: sem papel de admin ela devolve zero
-- linhas, nunca um erro — um erro aqui confirmaria que existe administração
-- neste endereço.
--
-- ⚠️ O BLOCO É DINÂMICO POR CAUSA DE UMA TABELA SÓ. `vidaplan_subscriptions`
-- é do projeto antigo e pode não existir. `to_regclass` devolve nulo quando a
-- tabela não está lá, e aí a função é criada sem o `join` — com
-- `trial_until` nulo e sem os estados 'teste' e 'vencido', que de todo modo
-- não existem mais desde que tudo virou gratuito.
-- ─────────────────────────────────────────────────────────────────────
do $instalar$
begin
  if to_regclass('public.vidaplan_subscriptions') is not null then

    execute $f$
      create or replace function public.hub_assinantes()
      returns table (
        id uuid, nome text, email text, papel text, plano text,
        plano_expira_em timestamptz, trial_until timestamptz,
        criado_em timestamptz, estado text
      )
      language sql security definer stable set search_path = public
      as $corpo$
        select
          p.id, p.nome, u.email::text, p.role, p.plano, p.plano_expira_em,
          s.trial_until, u.created_at,
          case
            when p.role in ('admin','equipe')                            then 'equipe'
            when p.plano = 'pro'
             and (p.plano_expira_em is null or p.plano_expira_em > now()) then 'pagante'
            when s.status = 'trial' and s.trial_until > now()             then 'teste'
            when s.trial_until is not null                                then 'vencido'
            else 'sem_acesso'
          end
        from public.hub_profiles p
        join auth.users u on u.id = p.id
        left join public.vidaplan_subscriptions s on s.user_id = p.id
        where public.hub_papel() = 'admin'
        order by u.created_at desc;
      $corpo$;
    $f$;

    raise notice 'hub_assinantes criada COM o trial do Vida Plan.';

  else

    execute $f$
      create or replace function public.hub_assinantes()
      returns table (
        id uuid, nome text, email text, papel text, plano text,
        plano_expira_em timestamptz, trial_until timestamptz,
        criado_em timestamptz, estado text
      )
      language sql security definer stable set search_path = public
      as $corpo$
        select
          p.id, p.nome, u.email::text, p.role, p.plano, p.plano_expira_em,
          null::timestamptz, u.created_at,
          case
            when p.role in ('admin','equipe')                            then 'equipe'
            when p.plano = 'pro'
             and (p.plano_expira_em is null or p.plano_expira_em > now()) then 'pagante'
            else 'sem_acesso'
          end
        from public.hub_profiles p
        join auth.users u on u.id = p.id
        where public.hub_papel() = 'admin'
        order by u.created_at desc;
      $corpo$;
    $f$;

    raise notice 'hub_assinantes criada SEM o Vida Plan (a tabela nao existe neste banco).';

  end if;
end
$instalar$;

revoke all on function public.hub_assinantes() from public, anon;
grant execute on function public.hub_assinantes() to authenticated;


-- ─────────────────────────────────────────────────────────────────────
-- 4. `hub_definir_acesso()` — liberar ou cortar, com registro
--
-- Mudar o plano e escrever a auditoria têm de acontecer JUNTOS. Em duas
-- chamadas separadas do navegador, a segunda pode falhar e sobra um acesso
-- liberado que ninguém sabe explicar.
-- ─────────────────────────────────────────────────────────────────────
create or replace function public.hub_definir_acesso(
  p_alvo   uuid,
  p_meses  int,                 -- 0 ou negativo corta o acesso
  p_motivo text default ''
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ate timestamptz;
begin
  if public.hub_papel() <> 'admin' then
    raise exception 'Apenas admin pode mexer no acesso.' using errcode = '42501';
  end if;

  if p_meses > 0 then
    -- Soma sobre o que a pessoa JÁ tem: renovar quem ainda tem 10 dias de
    -- crédito não pode apagar esses 10 dias.
    select greatest(coalesce(plano_expira_em, now()), now()) + (p_meses || ' months')::interval
      into v_ate
      from public.hub_profiles
     where id = p_alvo;

    update public.hub_profiles
       set plano = 'pro', plano_expira_em = v_ate
     where id = p_alvo;

    insert into public.hub_liberacoes (alvo_id, feito_por, acao, ate, motivo)
    values (p_alvo, auth.uid(), 'liberou', v_ate, p_motivo);
  else
    update public.hub_profiles
       set plano = 'free', plano_expira_em = null
     where id = p_alvo;

    insert into public.hub_liberacoes (alvo_id, feito_por, acao, ate, motivo)
    values (p_alvo, auth.uid(), 'cortou', null, p_motivo);
  end if;
end;
$$;

revoke all on function public.hub_definir_acesso(uuid, int, text) from public, anon;
grant execute on function public.hub_definir_acesso(uuid, int, text) to authenticated;


-- ─────────────────────────────────────────────────────────────────────
-- 5. A medição de uso — a tela /admin/uso
--
-- ⚠️ NÃO GUARDA DADO PESSOAL ALÉM DO user_id. Nada de IP, de user-agent nem
-- do CONTEÚDO digitado. É o dinheiro do cliente do outro lado, e um log de
-- uso que vaze hábito financeiro é pior do que não ter log nenhum.
-- ─────────────────────────────────────────────────────────────────────
create table if not exists public.hub_eventos (
  id         bigserial primary key,
  usuario_id uuid references auth.users (id) on delete cascade,
  modulo     text not null,
  acao       text not null default 'abriu',
  criado_em  timestamptz not null default now()
);

create index if not exists hub_eventos_modulo_idx on public.hub_eventos (modulo, criado_em desc);
create index if not exists hub_eventos_usuario_idx on public.hub_eventos (usuario_id, criado_em desc);

alter table public.hub_eventos enable row level security;

-- Cada pessoa grava o próprio evento e lê só os próprios.
drop policy if exists "hub_eventos: grava o proprio" on public.hub_eventos;
create policy "hub_eventos: grava o proprio"
  on public.hub_eventos for insert
  to authenticated
  with check (usuario_id = auth.uid());

drop policy if exists "hub_eventos: le o proprio ou admin" on public.hub_eventos;
create policy "hub_eventos: le o proprio ou admin"
  on public.hub_eventos for select
  to authenticated
  using (usuario_id = auth.uid() or public.hub_papel() in ('admin', 'equipe'));


create or replace function public.hub_uso_por_modulo(p_dias int default 30)
returns table (modulo text, eventos bigint, pessoas bigint, ultimo timestamptz)
language sql
security definer
stable
set search_path = public
as $$
  select
    e.modulo,
    count(*)                     as eventos,
    count(distinct e.usuario_id) as pessoas,
    max(e.criado_em)             as ultimo
  from public.hub_eventos e
  where e.criado_em > now() - make_interval(days => greatest(p_dias, 1))
    and public.hub_papel() in ('admin', 'equipe')   -- a guarda vive aqui
  group by e.modulo
  order by count(*) desc;
$$;

revoke all on function public.hub_uso_por_modulo(int) from public, anon;
grant execute on function public.hub_uso_por_modulo(int) to authenticated;


-- ─────────────────────────────────────────────────────────────────────
-- 6. CONFERÊNCIA — tem de voltar as quatro funções, uma linha cada
-- ─────────────────────────────────────────────────────────────────────
select p.proname as funcao, pg_get_function_identity_arguments(p.oid) as argumentos
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public'
   and p.proname in ('hub_papel', 'hub_assinantes', 'hub_definir_acesso', 'hub_uso_por_modulo')
 order by p.proname;
