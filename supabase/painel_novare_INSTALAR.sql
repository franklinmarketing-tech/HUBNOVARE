-- ═══════════════════════════════════════════════════════════════════════
-- O PAINEL DA NOVARE — a saúde da casa, os leads e as iscas
--
-- ⚠️ RODE DEPOIS DE `painel_admin_INSTALAR.sql`. Este arquivo supõe que
-- `hub_papel()` e `hub_eventos` já existem. Se a conferência do final daquele
-- não devolveu as quatro funções, rode-o primeiro.
--
-- ⚠️ É SEGURO RODAR MAIS DE UMA VEZ: tudo é `create or replace` /
-- `if not exists` / `add column if not exists`. Não apaga dado nenhum.
--
-- ── O QUE ESTE ARQUIVO RESOLVE ────────────────────────────────────────
--
-- A pergunta "como vai a Novare?" não tinha resposta possível. Dava para
-- listar os leads e listar os cadastros, mas não para LIGAR os dois: o
-- e-mail de quem criou conta mora em `auth.users`, que o PostgREST não
-- expõe. Sem esse encontro, a taxa de conversão — o número que diz se as
-- iscas estão funcionando — era invisível.
--
-- ⚠️ TODA FUNÇÃO AQUI É `security definer` E CHECA O PAPEL NA PRIMEIRA
-- LINHA. `security definer` sem essa checagem não é conveniência: é dar a
-- qualquer sessão autenticada a lista de e-mails de todo mundo.
--
-- ⚠️ A GUARDA DEVOLVE LISTA VAZIA, E NÃO ERRO. Um erro de permissão
-- confirmaria para quem está sondando que existe administração neste
-- endereço. Vazio não conta nada a ninguém.
-- ═══════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────
-- 1. O ANDAMENTO DE CADA LEAD
--
-- COLUNAS NA PRÓPRIA `hub_leads`, e não uma tabela de histórico: o que o
-- Jefferson precisa é saber em que pé está CADA pessoa agora. Histórico de
-- quem mudou o quê seria uma tabela a mais para manter e uma tela a mais
-- para ler, sem responder nada que ele tenha perguntado.
-- ─────────────────────────────────────────────────────────────────────
alter table public.hub_leads
  add column if not exists situacao text not null default 'novo',
  add column if not exists anotacao text,
  add column if not exists tratado_por uuid references auth.users (id) on delete set null,
  add column if not exists tratado_em timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'hub_leads_situacao_valida'
  ) then
    alter table public.hub_leads
      add constraint hub_leads_situacao_valida
      check (situacao in ('novo', 'falando', 'cliente', 'sem_interesse'));
  end if;
end $$;

create index if not exists hub_leads_situacao_idx on public.hub_leads (situacao, criado_em desc);
create index if not exists hub_leads_criado_idx   on public.hub_leads (criado_em desc);

comment on column public.hub_leads.situacao is
  'novo | falando | cliente | sem_interesse — onde a conversa parou.';


-- ─────────────────────────────────────────────────────────────────────
-- 2. A SAÚDE DA CASA, num número de cada
--
-- ⚠️ A CONVERSÃO É O CORAÇÃO DISTO. `hub_leads.email` casado com
-- `auth.users.email`, em minúsculas e sem espaço dos dois lados: a pessoa
-- digita "Joao@Gmail.com " na isca e se cadastra como "joao@gmail.com", e
-- comparar cru diria que ninguém nunca converteu.
-- ─────────────────────────────────────────────────────────────────────
create or replace function public.hub_saude(p_dias int default 30)
returns table (
  leads              bigint,
  leads_antes        bigint,   -- o mesmo período imediatamente anterior
  cadastros          bigint,
  cadastros_antes    bigint,
  leads_convertidos  bigint,   -- leads que viraram conta
  contas_fincash     bigint,   -- contas que lançaram ALGUMA coisa
  ativos_7d          bigint,   -- lançaram nos últimos 7 dias
  sumidos_30d        bigint,   -- já usaram, mas não nos últimos 30
  por_tratar         bigint    -- leads ainda em 'novo'
)
language sql
security definer
stable
set search_path = public
as $$
  with
  janela as (
    select
      now() - make_interval(days => greatest(p_dias, 1))     as de,
      now() - make_interval(days => greatest(p_dias, 1) * 2) as de_antes
  ),
  /* Os e-mails normalizados, de um lado e do outro. */
  emails_lead as (
    select distinct lower(btrim(email)) as e from public.hub_leads
  ),
  emails_conta as (
    select distinct lower(btrim(email::text)) as e from auth.users
  ),
  /* Quem já lançou alguma coisa no FINCASH, e quando foi a última vez.

     ⚠️ `criado_em` É QUANDO A LINHA NASCEU, e não a coluna `data`, que é a
     data que a pessoa digitou: ela pode lançar hoje uma conta de três meses
     atrás, e isso é uso de HOJE.

     ⚠️ E É `criado_em`, NÃO `created_at`. As tabelas desta casa são escritas
     em português; só `auth.users`, que é do Supabase, usa inglês — por isso
     as duas grafias convivem neste arquivo, cada uma na sua tabela. Supor o
     nome em inglês numa tabela nossa devolve 42703 e derruba o arquivo
     INTEIRO, porque o editor do Supabase roda tudo numa transação só.
     `scripts/testar-colunas-sql.mjs` existe para pegar exatamente isto. */
  uso as (
    select user_id, max(criado_em) as ultimo
      from public.fin_lancamentos
     group by user_id
  )
  select
    (select count(*) from public.hub_leads, janela where criado_em >= janela.de),
    (select count(*) from public.hub_leads, janela
      where criado_em >= janela.de_antes and criado_em < janela.de),
    (select count(*) from auth.users, janela where created_at >= janela.de),
    (select count(*) from auth.users, janela
      where created_at >= janela.de_antes and created_at < janela.de),
    (select count(*) from emails_lead l where exists
      (select 1 from emails_conta c where c.e = l.e)),
    (select count(*) from uso),
    (select count(*) from uso where ultimo > now() - interval '7 days'),
    (select count(*) from uso where ultimo < now() - interval '30 days'),
    (select count(*) from public.hub_leads where situacao = 'novo')
  where public.hub_papel() in ('admin', 'equipe');
$$;

revoke all on function public.hub_saude(int) from public, anon;
grant execute on function public.hub_saude(int) to authenticated;


-- ─────────────────────────────────────────────────────────────────────
-- 3. A LINHA DO TEMPO — leads e cadastros por dia
--
-- ⚠️ `generate_series` À ESQUERDA, de propósito: um dia sem lead tem de
-- aparecer como zero, e não sumir. Gráfico que pula os dias vazios desenha
-- uma linha subindo onde na verdade houve silêncio.
-- ─────────────────────────────────────────────────────────────────────
create or replace function public.hub_linha_do_tempo(p_dias int default 30)
returns table (dia date, leads bigint, cadastros bigint)
language sql
security definer
stable
set search_path = public
as $$
  select
    d::date,
    (select count(*) from public.hub_leads l where l.criado_em::date = d::date),
    (select count(*) from auth.users u      where u.created_at::date = d::date)
  from generate_series(
    (now() - make_interval(days => greatest(p_dias, 1) - 1))::date,
    now()::date,
    interval '1 day'
  ) as d
  where public.hub_papel() in ('admin', 'equipe')
  order by d;
$$;

revoke all on function public.hub_linha_do_tempo(int) from public, anon;
grant execute on function public.hub_linha_do_tempo(int) to authenticated;


-- ─────────────────────────────────────────────────────────────────────
-- 4. O DESEMPENHO DE CADA ISCA
--
-- Junta as duas metades do funil por ferramenta: quantas pessoas ABRIRAM
-- (de `hub_eventos`) e quantas DEIXARAM O E-MAIL (de `hub_leads.origem`).
--
-- ⚠️ `full outer join` porque as duas metades podem existir sozinhas: uma
-- isca pode ter visita e nenhum lead (a mais comum, e a mais importante de
-- enxergar), e pode ter lead sem visita registrada — todo lead anterior à
-- medição de uso está nesse caso.
-- ─────────────────────────────────────────────────────────────────────
create or replace function public.hub_iscas(p_dias int default 30)
returns table (
  caminho    text,     -- a rota: '/ferramentas/orcamento'
  visitas    bigint,
  visitantes bigint,
  leads      bigint,
  ultimo     timestamptz
)
language sql
security definer
stable
set search_path = public
as $$
  with
  janela as (select now() - make_interval(days => greatest(p_dias, 1)) as de),
  vistas as (
    select e.modulo as caminho, count(*) as visitas,
           count(distinct e.usuario_id) as visitantes, max(e.criado_em) as ultimo
      from public.hub_eventos e, janela
     where e.criado_em >= janela.de
     group by e.modulo
  ),
  captados as (
    select l.origem as caminho, count(*) as leads, max(l.criado_em) as ultimo
      from public.hub_leads l, janela
     where l.criado_em >= janela.de and l.origem is not null
     group by l.origem
  )
  select
    coalesce(v.caminho, c.caminho),
    coalesce(v.visitas, 0),
    coalesce(v.visitantes, 0),
    coalesce(c.leads, 0),
    greatest(v.ultimo, c.ultimo)
  from vistas v
  full outer join captados c on c.caminho = v.caminho
  where public.hub_papel() in ('admin', 'equipe')
  order by coalesce(c.leads, 0) desc, coalesce(v.visitas, 0) desc;
$$;

revoke all on function public.hub_iscas(int) from public, anon;
grant execute on function public.hub_iscas(int) to authenticated;


-- ─────────────────────────────────────────────────────────────────────
-- 5. A LISTA DE LEADS, com o que mais importa junto
--
-- `virou_conta` responde, por linha, a pergunta que o Jefferson faz antes
-- de ligar: "essa pessoa já entrou no Hub ou só deixou o e-mail?".
-- ─────────────────────────────────────────────────────────────────────
create or replace function public.hub_leads_painel(
  p_dias int default 90,
  p_limite int default 500
)
returns table (
  id uuid, nome text, email text, telefone text, origem text, tipo text,
  payload jsonb, criado_em timestamptz,
  situacao text, anotacao text, tratado_em timestamptz,
  virou_conta boolean
)
language sql
security definer
stable
set search_path = public
as $$
  select
    l.id, l.nome, l.email, l.telefone, l.origem, l.tipo,
    l.payload, l.criado_em,
    l.situacao, l.anotacao, l.tratado_em,
    exists (
      select 1 from auth.users u
       where lower(btrim(u.email::text)) = lower(btrim(l.email))
    )
  from public.hub_leads l
  where l.criado_em >= now() - make_interval(days => greatest(p_dias, 1))
    and public.hub_papel() in ('admin', 'equipe')
  order by l.criado_em desc
  limit greatest(p_limite, 1);
$$;

revoke all on function public.hub_leads_painel(int, int) from public, anon;
grant execute on function public.hub_leads_painel(int, int) to authenticated;


-- ─────────────────────────────────────────────────────────────────────
-- 6. MARCAR O ANDAMENTO
--
-- ⚠️ ESTA É A ÚNICA FUNÇÃO QUE ESCREVE, e por isso levanta ERRO quando o
-- papel não serve, ao contrário das de leitura. Quem tentou gravar precisa
-- saber que não gravou — falha silenciosa em escrita é o defeito que custou
-- caro no FINCASH em 18/10/2026.
-- ─────────────────────────────────────────────────────────────────────
create or replace function public.hub_lead_marcar(
  p_id       uuid,
  p_situacao text,
  p_anotacao text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.hub_papel() not in ('admin', 'equipe') then
    raise exception 'Sem permissao para mexer em lead.' using errcode = '42501';
  end if;

  if p_situacao not in ('novo', 'falando', 'cliente', 'sem_interesse') then
    raise exception 'Situacao invalida: %', p_situacao using errcode = '22023';
  end if;

  update public.hub_leads
     set situacao    = p_situacao,
         -- `null` não apaga a anotação que já estava lá: quem só mudou a
         -- situação não quis perder o que havia escrito antes.
         anotacao    = coalesce(p_anotacao, anotacao),
         tratado_por = auth.uid(),
         tratado_em  = now()
   where id = p_id;

  if not found then
    raise exception 'Lead nao encontrado.' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.hub_lead_marcar(uuid, text, text) from public, anon;
grant execute on function public.hub_lead_marcar(uuid, text, text) to authenticated;


-- ─────────────────────────────────────────────────────────────────────
-- 7. GRAVAR UMA VISITA
--
-- Chamada pelo app quando alguém abre uma ferramenta. Aceita visitante
-- ANÔNIMO (`auth.uid()` nulo) de propósito: a maior parte das iscas abre
-- sem cadastro, e é justamente esse público que não se enxergava.
--
-- ⚠️ NÃO GUARDA NADA ALÉM DO CAMINHO E DO user_id. Sem IP, sem
-- user-agent, sem o que a pessoa digitou.
-- ─────────────────────────────────────────────────────────────────────
create or replace function public.hub_registrar_visita(p_modulo text)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.hub_eventos (usuario_id, modulo, acao)
  select auth.uid(), left(btrim(p_modulo), 120), 'abriu'
   where btrim(coalesce(p_modulo, '')) <> '';
$$;

revoke all on function public.hub_registrar_visita(text) from public;
grant execute on function public.hub_registrar_visita(text) to anon, authenticated;


-- ─────────────────────────────────────────────────────────────────────
-- 8. CONFERÊNCIA — tem de voltar seis linhas
-- ─────────────────────────────────────────────────────────────────────
select p.proname as funcao, pg_get_function_identity_arguments(p.oid) as argumentos
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public'
   and p.proname in (
     'hub_saude', 'hub_linha_do_tempo', 'hub_iscas',
     'hub_leads_painel', 'hub_lead_marcar', 'hub_registrar_visita'
   )
 order by p.proname;
