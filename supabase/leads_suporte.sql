-- ═══════════════════════════════════════════════════════════════════════
-- LEADS DE TESTE VÃO PARA O SUPORTE (pedido do dono, 21/10/2026)
--
-- "Tire meu nome dos leads e das análises do admin; parametrize as iscas
-- só pelos leads reais; não contabilize os acessos de teste; jogue os testes
-- num campo de suporte com senha que só eu acesso."
--
-- O QUE MUDA:
--   1. hub_leads ganha a coluna `eh_teste`. O lead de teste NÃO é mais
--      descartado na entrada: é gravado MARCADO, e só aparece em
--      /admin/suporte (com senha). Some do painel de leads, da Saúde, das
--      Iscas, de Clientes e do CSV.
--   2. A regra de teste passa a pegar QUALQUER e-mail com "franklin" e o
--      "novareadm…" (o print mostrava franklincastriani.trader@, que a regra
--      antiga `franklincastriani@` deixava passar).
--   3. hub_eh_interno(email): demo + equipe + teste. Sai das contagens de
--      cadastro da Saúde e dos ACESSOS das Iscas.
--
-- Rode inteiro, de uma vez. Não apaga nada.
-- A mesma regra existe em `src/lib/leads-teste.ts` — mudou uma, mude a outra.
-- ═══════════════════════════════════════════════════════════════════════

alter table public.hub_leads add column if not exists eh_teste boolean not null default false;
create index if not exists hub_leads_eh_teste_idx on public.hub_leads (eh_teste, criado_em desc);

-- ─── A REGRA ────────────────────────────────────────────────────────────
create or replace function public.hub_lead_eh_teste(p_email text, p_nome text)
returns boolean
language sql
immutable
as $$
  select
       coalesce(p_email, '') ilike any (array[
         '%.invalid', '%@exemplo.%', '%@example.%', '%@teste.%', '%@test.%',
         'teste%@%', 'test@%', 'test.%@%', 'demo.%', '%+teste@%', '%+test@%',
         'visitante.teste.%',
         -- a equipe: o que ela preenche é teste, não lead
         '%franklin%', 'novareadm%',
         'jefferson.ariane1402@%', 'ariane.bafreitas@%'
       ])
    or coalesce(p_nome, '') ilike any (array['zz %', 'teste', 'teste %', 'test', 'maria teste']);
$$;

/* Conta que não é cliente: demonstração, equipe (papel admin/equipe) ou
   e-mail de teste. Fica fora das estatísticas. */
create or replace function public.hub_eh_interno(p_email text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.hub_eh_demo(p_email)
      or public.hub_lead_eh_teste(p_email, null)
      or exists (
           select 1 from auth.users u
             join public.hub_profiles p on p.id = u.id
            where lower(btrim(u.email::text)) = lower(btrim(p_email))
              and p.role in ('admin', 'equipe')
         );
$$;

-- ─── O PORTEIRO: agora MARCA, não descarta ──────────────────────────────
create or replace function public.hub_leads_barra_teste()
returns trigger
language plpgsql
as $$
begin
  if public.hub_lead_eh_teste(new.email, new.nome) then
    new.eh_teste := true;
  end if;
  return new;
end;
$$;

drop trigger if exists hub_leads_barra_teste on public.hub_leads;
create trigger hub_leads_barra_teste
  before insert on public.hub_leads
  for each row execute function public.hub_leads_barra_teste();

-- Os que já estão lá (o franklincastriani.trader do print, por exemplo).
update public.hub_leads set eh_teste = true
 where not eh_teste and public.hub_lead_eh_teste(email, nome);


-- ─── SAÚDE ──────────────────────────────────────────────────────────────
create or replace function public.hub_saude(p_dias int default 30)
returns table (
  leads bigint, leads_antes bigint, cadastros bigint, cadastros_antes bigint,
  leads_convertidos bigint, contas_fincash bigint, ativos_7d bigint,
  sumidos_30d bigint, por_tratar bigint
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
  -- Contas de gente de fora: sem demo, sem equipe, sem teste.
  gente as (
    select id, email::text as email, created_at
      from auth.users
     where not public.hub_eh_interno(email::text)
  ),
  reais as (select * from public.hub_leads where not eh_teste),
  emails_lead as (select distinct lower(btrim(email)) as e from reais),
  emails_conta as (select distinct lower(btrim(email)) as e from gente),
  uso as (
    select l.user_id, max(l.criado_em) as ultimo
      from public.fin_lancamentos l
      join gente g on g.id = l.user_id
     group by l.user_id
  )
  select
    (select count(*) from reais, janela where criado_em >= janela.de),
    (select count(*) from reais, janela
      where criado_em >= janela.de_antes and criado_em < janela.de),
    (select count(*) from gente, janela where created_at >= janela.de),
    (select count(*) from gente, janela
      where created_at >= janela.de_antes and created_at < janela.de),
    (select count(*) from emails_lead l where exists
      (select 1 from emails_conta c where c.e = l.e)),
    (select count(*) from uso),
    (select count(*) from uso where ultimo > now() - interval '7 days'),
    (select count(*) from uso where ultimo < now() - interval '30 days'),
    (select count(*) from reais where situacao = 'novo')
  where public.hub_papel() in ('admin', 'equipe');
$$;

create or replace function public.hub_linha_do_tempo(p_dias int default 30)
returns table (dia date, leads bigint, cadastros bigint)
language sql
security definer
stable
set search_path = public
as $$
  select
    d::date,
    (select count(*) from public.hub_leads l
      where l.criado_em::date = d::date and not l.eh_teste),
    (select count(*) from auth.users u
      where u.created_at::date = d::date
        and not public.hub_eh_interno(u.email::text))
  from generate_series(
    (now() - make_interval(days => greatest(p_dias, 1) - 1))::date,
    now()::date,
    interval '1 day'
  ) as d
  where public.hub_papel() in ('admin', 'equipe')
  order by d;
$$;

-- ─── LEADS (o painel) ───────────────────────────────────────────────────
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
    and not l.eh_teste
    and public.hub_papel() in ('admin', 'equipe')
  order by l.criado_em desc
  limit greatest(p_limite, 1);
$$;

-- ─── SUPORTE: só os de teste, só para admin ─────────────────────────────
-- A senha extra é conferida no servidor do Hub (/admin/suporte); aqui a
-- guarda é o papel `admin` (equipe não vê).
create or replace function public.hub_leads_suporte(p_limite int default 500)
returns table (
  id uuid, nome text, email text, telefone text, origem text, tipo text,
  payload jsonb, criado_em timestamptz
)
language sql
security definer
stable
set search_path = public
as $$
  select l.id, l.nome, l.email, l.telefone, l.origem, l.tipo, l.payload, l.criado_em
    from public.hub_leads l
   where l.eh_teste
     and public.hub_papel() = 'admin'
   order by l.criado_em desc
   limit greatest(p_limite, 1);
$$;

revoke all on function public.hub_leads_suporte(int) from public, anon;
grant execute on function public.hub_leads_suporte(int) to authenticated;

-- ─── ISCAS: acessos e leads só de gente de fora ─────────────────────────
create or replace function public.hub_iscas(p_dias int default 30)
returns table (
  caminho text, visitas bigint, visitantes bigint, leads bigint, ultimo timestamptz
)
language sql
security definer
stable
set search_path = public
as $$
  with
  janela as (select now() - make_interval(days => greatest(p_dias, 1)) as de),
  -- Usuários logados que são da casa (equipe, demo, teste): os acessos
  -- deles não contam. Visitante anônimo não dá para separar.
  internos as (
    select u.id from auth.users u where public.hub_eh_interno(u.email::text)
  ),
  vistas as (
    select e.modulo as caminho, count(*) as visitas,
           count(distinct e.usuario_id) as visitantes, max(e.criado_em) as ultimo
      from public.hub_eventos e, janela
     where e.criado_em >= janela.de
       and (e.usuario_id is null or e.usuario_id not in (select id from internos))
     group by e.modulo
  ),
  captados as (
    select l.origem as caminho, count(*) as leads, max(l.criado_em) as ultimo
      from public.hub_leads l, janela
     where l.criado_em >= janela.de and l.origem is not null and not l.eh_teste
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

-- ─── CLIENTES: a contagem de leads de cada conta, sem os de teste ───────
create or replace function public.hub_clientes()
returns table (
  id uuid, nome text, email text, telefone text, cidade text, uf text,
  profissao text, objetivo text, papel text, aceita_email boolean,
  criado_em timestamptz, ultimo_acesso timestamptz, ultimo_lancamento timestamptz,
  leads bigint, mensagens bigint
)
language sql
security definer
stable
set search_path = public
as $$
  select
    u.id, p.nome, u.email::text, p.telefone, p.cidade, p.uf, p.profissao, p.objetivo,
    coalesce(p.role, 'cliente'),
    coalesce(p.aceita_email, true),
    u.created_at, u.last_sign_in_at,
    (select max(l.criado_em) from public.fin_lancamentos l where l.user_id = u.id),
    (select count(*) from public.hub_leads hl
      where lower(btrim(hl.email)) = lower(btrim(u.email::text)) and not hl.eh_teste),
    (select count(*) from public.hub_mensagens m
      where m.usuario_id = u.id
         or lower(btrim(m.para_email)) = lower(btrim(u.email::text)))
  from auth.users u
  left join public.hub_profiles p on p.id = u.id
  where not public.hub_eh_demo(u.email::text)
    and public.hub_papel() in ('admin', 'equipe')
  order by u.created_at desc;
$$;

-- ─── NINGUÉM SEM NOME (pedido do dono, 21/10/2026) ─────────────────────
-- Conta sem nome recebe o nome que a pessoa deixou no lead mais recente com
-- o mesmo e-mail, ou o que veio no cadastro (raw_user_meta_data).
update public.hub_profiles p
   set nome = coalesce(
         nullif(btrim(u.raw_user_meta_data ->> 'nome'), ''),
         nullif(btrim(u.raw_user_meta_data ->> 'full_name'), ''),
         (select nullif(btrim(l.nome), '') from public.hub_leads l
           where lower(btrim(l.email)) = lower(btrim(u.email::text)) and nullif(btrim(l.nome), '') is not null
           order by l.criado_em desc limit 1)
       )
  from auth.users u
 where u.id = p.id
   and nullif(btrim(p.nome), '') is null;

-- ─── CONFERÊNCIA ────────────────────────────────────────────────────────
select
  (select count(*) from public.hub_profiles where nullif(btrim(nome), '') is null) as contas_ainda_sem_nome,
  count(*) filter (where not eh_teste) as leads_reais,
  count(*) filter (where eh_teste)     as leads_de_teste_no_suporte,
  (array_agg(distinct email) filter (where eh_teste))[1:20] as quem_foi_para_o_suporte
from public.hub_leads;
