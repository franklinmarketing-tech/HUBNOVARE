-- ═══════════════════════════════════════════════════════════════════════
-- LEADS SEM TESTE — limpa o que é teste e impede que volte a entrar.
-- Pedido do dono em 20/10/2026: "limpar todos os testes do banco de leads,
-- não deixar eles entrarem lá e atrapalhar".
--
-- RODE EM DOIS PASSOS, NESTA ORDEM:
--   PASSO 1 — cole e rode SÓ o bloco "PRÉVIA". Ele não apaga nada: lista
--             o que seria apagado. Confira se não há cliente de verdade.
--   PASSO 2 — cole e rode o resto (da linha "A REGRA" até o fim).
--
-- ⚠️ O PASSO 2 APAGA E NÃO TEM DESFAZER.
--
-- ⚠️ ATÉ AQUI OS TESTES DA EQUIPE FICAVAM (ver `limpar_leads_de_teste.sql`:
-- "a decisão de apagar é dele"). Agora o dono pediu TODOS: os e-mails da
-- equipe entram na regra — e, daqui para a frente, o que a equipe preencher
-- no site também não vira lead. Para testar o painel, isso conta.
--
-- A mesma regra existe no código, em `src/lib/leads-teste.ts`. Mudou uma,
-- mude a outra.
-- ═══════════════════════════════════════════════════════════════════════


-- ─── PRÉVIA (PASSO 1) — não apaga nada ──────────────────────────────────
select email, nome, tipo, origem, criado_em
from public.hub_leads
where email ilike '%.invalid'
   or email ilike '%@exemplo.%'   or email ilike '%@example.%'
   or email ilike '%@teste.%'     or email ilike '%@test.%'
   or email ilike 'teste%@%'      or email ilike 'test@%'     or email ilike 'test.%@%'
   or email ilike 'demo.%'        or email ilike '%+teste@%'  or email ilike '%+test@%'
   or email ilike 'visitante.teste.%'
   or nome ilike 'zz %'           or nome ilike 'teste'       or nome ilike 'teste %'
   or nome ilike 'test'           or nome ilike 'maria teste'
   or email ilike 'jefferson.ariane1402@%'
   or email ilike 'ariane.bafreitas@%'
   or email ilike 'franklincastriani@%'
   or email ilike 'novareadmapp@%'
order by criado_em desc;


-- ─── A REGRA (PASSO 2 começa aqui) ──────────────────────────────────────
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
         'franklincastriani@%', 'novareadmapp@%'
       ])
    or coalesce(p_nome, '') ilike any (array['zz %', 'teste', 'teste %', 'test', 'maria teste']);
$$;

-- O porteiro: lead de teste é descartado na entrada, em silêncio (o
-- formulário recebe "ok", só que nada é gravado). Vale para qualquer
-- caminho — a rota do site ou um INSERT direto pela chave pública.
create or replace function public.hub_leads_barra_teste()
returns trigger
language plpgsql
as $$
begin
  if public.hub_lead_eh_teste(new.email, new.nome) then
    return null;
  end if;
  return new;
end;
$$;

drop trigger if exists hub_leads_barra_teste on public.hub_leads;
create trigger hub_leads_barra_teste
  before insert on public.hub_leads
  for each row execute function public.hub_leads_barra_teste();


-- ─── A LIMPEZA ──────────────────────────────────────────────────────────
-- As mensagens já enviadas a um lead apagado continuam no histórico
-- (`on delete set null` em hub_mensagens).
with apagados as (
  delete from public.hub_leads
  where public.hub_lead_eh_teste(email, nome)
  returning email
)
select
  count(*)                                           as leads_de_teste_apagados,
  (select count(*) from public.hub_leads) - count(*) as leads_que_ficaram,
  (array_agg(email order by email))[1:30]            as o_que_foi_apagado
from apagados;
