-- ═══════════════════════════════════════════════════════════════════════
-- AS CONTAS DE DEMONSTRAÇÃO SAEM DAS ESTATÍSTICAS
--
-- ⚠️ O DEFEITO QUE ISTO CORRIGE SÓ FICOU VISÍVEL AO LIMPAR O BANCO
-- (19/10/2026). A limpeza apagou 91 contas `demo.fincash.*` — e foram 91
-- "cadastros" que o painel vinha contando como gente de verdade.
--
-- `/fincash/testar` cria uma conta nova A CADA VISITA, no banco de
-- produção. Elas voltam a acumular sozinhas: cada pessoa que clica em
-- "experimentar sem criar conta" vira mais uma linha em `auth.users`.
--
-- ⚠️ POR QUE ISSO É PIOR QUE UM NÚMERO FEIO: o painel existe para decidir
-- onde a Novare investe. "Contas criadas: 91" com zero gente real levaria à
-- conclusão exatamente oposta da verdadeira — e levaria com confiança,
-- porque o número tem cara de medido. Estatística errada é pior que
-- estatística ausente: a ausente ninguém usa para decidir.
--
-- A conversão de lead em conta também mentia: o cruzamento de e-mails
-- nunca casaria com uma conta `demo.*`, mas o DENOMINADOR estava inflado.
--
-- ⚠️ O FILTRO É O MESMO DA LIMPEZA, de propósito: prefixo `demo.`, e não o
-- domínio. Os sócios e a equipe usam @novareapp.com.br.
--
-- É seguro rodar mais de uma vez. Rode depois de `painel_novare_INSTALAR.sql`.
-- ═══════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────
-- Uma função só para a regra, em vez de repetir o `not like` em quatro
-- lugares. Quatro cópias de uma regra são quatro chances de alguém
-- corrigir três.
-- ─────────────────────────────────────────────────────────────────────
create or replace function public.hub_eh_demo(p_email text)
returns boolean
language sql
immutable
as $$
  select coalesce(p_email, '') like 'demo.fincash.%'
      or coalesce(p_email, '') like 'demo.finplan.%';
$$;

comment on function public.hub_eh_demo(text) is
  'Conta criada por /fincash/testar, e nao por uma pessoa. Fica fora de toda estatistica.';


create or replace function public.hub_saude(p_dias int default 30)
returns table (
  leads              bigint,
  leads_antes        bigint,
  cadastros          bigint,
  cadastros_antes    bigint,
  leads_convertidos  bigint,
  contas_fincash     bigint,
  ativos_7d          bigint,
  sumidos_30d        bigint,
  por_tratar         bigint
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
  /* ⚠️ A BASE DE CONTAS JÁ VEM SEM AS DE DEMONSTRAÇÃO. Filtrar aqui, uma
     vez, em vez de repetir o `not like` em cada contagem abaixo. */
  gente as (
    select id, email::text as email, created_at
      from auth.users
     where not public.hub_eh_demo(email::text)
  ),
  emails_lead as (
    select distinct lower(btrim(email)) as e from public.hub_leads
  ),
  emails_conta as (
    select distinct lower(btrim(email)) as e from gente
  ),
  /* Quem já lançou alguma coisa no FINCASH, e quando foi a última vez.
     `criado_em` é quando a LINHA nasceu, não a coluna `data`, que é a data
     que a pessoa digitou: ela pode lançar hoje uma conta de três meses
     atrás, e isso é uso de hoje. */
  uso as (
    select l.user_id, max(l.criado_em) as ultimo
      from public.fin_lancamentos l
      join gente g on g.id = l.user_id
     group by l.user_id
  )
  select
    (select count(*) from public.hub_leads, janela where criado_em >= janela.de),
    (select count(*) from public.hub_leads, janela
      where criado_em >= janela.de_antes and criado_em < janela.de),
    (select count(*) from gente, janela where created_at >= janela.de),
    (select count(*) from gente, janela
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
    (select count(*) from auth.users u
      where u.created_at::date = d::date
        and not public.hub_eh_demo(u.email::text))
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
         and not public.hub_eh_demo(u.email::text)
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
-- CONFERÊNCIA — tem de voltar 4 linhas, e `contas_demo_hoje` em 0.
-- ─────────────────────────────────────────────────────────────────────
select p.proname as funcao
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public'
   and p.proname in ('hub_eh_demo', 'hub_saude', 'hub_linha_do_tempo', 'hub_leads_painel')
 order by p.proname;
