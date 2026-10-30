-- ═══════════════════════════════════════════════════════════════════════
-- CONTAS DE DEMONSTRAÇÃO SE APAGAM SOZINHAS (30/10/2026)
--
-- ⚠️ O QUE ISTO CORRIGE: em 19/10 a limpeza manual apagou 91 contas
-- `demo.fincash.*`; em 30/10 já eram 146 de novo, e o painel do Novare App
-- mostrava "152 clientes / 146 aguardando onboarding" com 6 pessoas reais.
-- Cada visita a /fincash/testar (e cada teste automático) cria uma conta no
-- banco de produção — limpar à mão só adia o problema.
--
-- O QUE FAZ:
--   1. Apaga AGORA todas as contas `demo.fincash.%` / `demo.finplan.%`.
--   2. Agenda (pg_cron) a mesma limpeza todo dia às 4h (UTC), para contas
--      com mais de 24 horas — quem está testando naquele momento não perde
--      a sessão no meio.
--
-- ⚠️ O FILTRO É O PREFIXO `demo.` + O DOMÍNIO, NUNCA SÓ O DOMÍNIO: os sócios
-- e a equipe usam @novareapp.com.br.
-- Apagar o usuário leva tudo junto (`on delete cascade`): fin_*, perfil, etc.
--
-- Rode no SQL Editor do projeto hjikeevfzfswqydduars. É seguro rodar de novo.
-- ═══════════════════════════════════════════════════════════════════════

-- PASSO 1 — OLHAR. Confira que em `exemplos` só aparece demo.*
select count(*) as contas_demo,
       (array_agg(email order by created_at desc))[1:5] as exemplos
  from auth.users
 where (email like 'demo.fincash.%' or email like 'demo.finplan.%')
   and email like '%@novareapp.com.br';

-- PASSO 2 — A REGRA, numa função só (a limpeza de hoje e a diária usam a mesma).
create or replace function public.hub_apagar_contas_demo(p_mais_velhas_que interval default interval '0')
returns integer
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  apagadas integer;
begin
  delete from auth.users
   where (email like 'demo.fincash.%' or email like 'demo.finplan.%')
     and email like '%@novareapp.com.br'
     and created_at < now() - p_mais_velhas_que;
  get diagnostics apagadas = row_count;
  return apagadas;
end;
$$;

revoke all on function public.hub_apagar_contas_demo(interval) from public, anon, authenticated;

-- PASSO 3 — LIMPAR AGORA. Devolve quantas saíram.
select public.hub_apagar_contas_demo() as apagadas_agora;

-- PASSO 4 — TODO DIA ÀS 4h (UTC), contas demo com mais de 24 horas.
create extension if not exists pg_cron;

select cron.unschedule(jobid)
  from cron.job
 where jobname = 'hub-apagar-contas-demo';

select cron.schedule(
  'hub-apagar-contas-demo',
  '0 4 * * *',
  $$select public.hub_apagar_contas_demo(interval '24 hours')$$
);

-- PASSO 5 — CONFERIR: tem de voltar 0 e o agendamento tem de aparecer.
select count(*) as ainda_sobrou
  from auth.users
 where email like 'demo.fincash.%' or email like 'demo.finplan.%';

select jobname, schedule, active from cron.job where jobname = 'hub-apagar-contas-demo';
