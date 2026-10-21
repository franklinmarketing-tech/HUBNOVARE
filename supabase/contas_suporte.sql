-- ═══════════════════════════════════════════════════════════════════════
-- CONTAS INTERNAS VÃO PARA O SUPORTE (pedido do dono, 21/10/2026)
-- "Tudo para o Suporte isso da aba Clientes."
--
-- Conta interna = demo, teste, papel admin/equipe, e-mail @novareapp.com.br
-- (auditoria, suporte, visitante, teste.cliente), e-mail com "castriani",
-- consultores.novare@, ou nome com "franklin" ou "teste".
-- Sai da aba Clientes e de toda contagem (Saúde, Iscas); aparece só em
-- /admin/suporte. Rode DEPOIS do leads_suporte.sql. Não apaga nada.
-- A mesma regra de e-mail existe em `src/lib/leads-teste.ts`.
-- ═══════════════════════════════════════════════════════════════════════

-- Leads: os mesmos e-mails internos também viram teste.
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
         '%franklin%', 'novareadm%', '%castriani%', '%@novareapp.com.br',
         'consultores.novare@%',
         'jefferson.ariane1402@%', 'ariane.bafreitas@%'
       ])
    or coalesce(p_nome, '') ilike any (array['zz %', 'teste', 'teste %', 'test', 'maria teste', '%franklin%']);
$$;

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
              and (p.role in ('admin', 'equipe')
                   or coalesce(p.nome, '') ilike any (array['%franklin%', '%teste%']))
         );
$$;

update public.hub_leads set eh_teste = true
 where not eh_teste and public.hub_lead_eh_teste(email, nome);

-- Clientes: só gente de fora.
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
  where not public.hub_eh_interno(u.email::text)
    and public.hub_papel() in ('admin', 'equipe')
  order by u.created_at desc;
$$;

-- Suporte: as contas internas (sem as de demonstração, que são descartáveis).
create or replace function public.hub_contas_suporte()
returns table (
  id uuid, nome text, email text, papel text, criado_em timestamptz, ultimo_acesso timestamptz
)
language sql
security definer
stable
set search_path = public
as $$
  select u.id, p.nome, u.email::text, coalesce(p.role, 'cliente'), u.created_at, u.last_sign_in_at
    from auth.users u
    left join public.hub_profiles p on p.id = u.id
   where public.hub_eh_interno(u.email::text)
     and not public.hub_eh_demo(u.email::text)
     and public.hub_papel() = 'admin'
   order by u.created_at desc;
$$;

revoke all on function public.hub_contas_suporte() from public, anon;
grant execute on function public.hub_contas_suporte() to authenticated;

-- ─── CONFERÊNCIA ────────────────────────────────────────────────────────
select
  (select count(*) from auth.users u where not public.hub_eh_interno(u.email::text)) as clientes_de_verdade,
  (select count(*) from auth.users u where public.hub_eh_interno(u.email::text)
     and not public.hub_eh_demo(u.email::text)) as contas_no_suporte,
  (select count(*) from public.hub_leads where eh_teste) as leads_no_suporte;
