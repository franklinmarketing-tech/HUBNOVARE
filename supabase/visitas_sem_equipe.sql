-- ═══════════════════════════════════════════════════════════════════════
-- VISITAS SEM A EQUIPE (30/10/2026)
--
-- Pedido do Jefferson: as visitas que o painel mostrava (aba Iscas, tabela
-- `hub_eventos`) eram dos próprios administradores. Este arquivo:
--   1. zera TODAS as visitas contadas até hoje;
--   2. passa a descartar, na entrada, a visita de quem é da equipe — pelo
--      papel (admin/equipe em hub_profiles) OU pelo e-mail;
--   3. põe os dois e-mails do Jefferson (novare.investimentos@gmail.com e
--      jefferson@novare.com.br) também na regra dos leads de teste.
--
-- ⚠️ A LISTA DE E-MAILS É A MESMA DE `src/lib/leads-teste.ts`
-- (EQUIPE_CONTEM). Mudou uma, mude a outra.
-- ⚠️ Visita de quem NÃO está logado não tem dono: se um sócio navegar
-- deslogado, ela conta. Para não contar, navegue logado.
--
-- Rode no SQL Editor do projeto hjikeevfzfswqydduars. É seguro rodar de novo
-- (só o PASSO 4 apaga, e apaga só visitas).
-- ═══════════════════════════════════════════════════════════════════════

-- PASSO 1 — quem é da equipe, numa função só.
create or replace function public.hub_eh_equipe(p_usuario uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1 from public.hub_profiles p
     where p.id = p_usuario and p.role in ('admin', 'equipe')
  )
  or exists (
    select 1 from auth.users u
     where u.id = p_usuario
       and (
            u.email ilike '%franklin%'
         or u.email ilike 'novareadm%'
         or u.email ilike '%castriani%'
         or u.email ilike '%@novareapp.com.br'
         or u.email ilike 'consultores.novare@%'
         or u.email ilike 'jefferson.ariane1402@%'
         or u.email ilike 'ariane.bafreitas@%'
         or u.email ilike 'novare.investimentos@%'
         or u.email ilike 'jefferson@novare.com.br'
       )
  );
$$;

revoke all on function public.hub_eh_equipe(uuid) from public, anon;

-- PASSO 2 — o porteiro: visita da equipe é descartada em silêncio.
create or replace function public.hub_eventos_barra_equipe()
returns trigger
language plpgsql
as $$
begin
  if new.usuario_id is not null and public.hub_eh_equipe(new.usuario_id) then
    return null;
  end if;
  return new;
end;
$$;

drop trigger if exists hub_eventos_barra_equipe on public.hub_eventos;
create trigger hub_eventos_barra_equipe
  before insert on public.hub_eventos
  for each row execute function public.hub_eventos_barra_equipe();

-- PASSO 3 — os dois e-mails do Jefferson também não viram lead.
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
         'jefferson.ariane1402@%', 'ariane.bafreitas@%',
         'franklincastriani@%', 'novareadmapp@%',
         'novare.investimentos@%', 'jefferson@novare.com.br'
       ])
    or coalesce(p_nome, '') ilike any (array['zz %', 'teste', 'teste %', 'test', 'maria teste']);
$$;

-- PASSO 4 — ZERAR as visitas contadas até hoje.
delete from public.hub_eventos;

-- PASSO 5 — conferir: tem de voltar 0.
select count(*) as visitas_restantes from public.hub_eventos;
