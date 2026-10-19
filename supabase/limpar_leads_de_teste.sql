-- ═══════════════════════════════════════════════════════════════════════
-- APAGAR OS LEADS DE TESTE — cole e rode de uma vez.
--
-- ⚠️ ISTO APAGA, E NÃO TEM DESFAZER. Os padrões são estreitos de propósito:
-- só o que é inequivocamente falso. O resultado mostra EXATAMENTE o que
-- foi apagado — se aparecer alguém de verdade ali, avise na hora.
--
-- De onde vieram: `teste.limite.N@exemplo.invalid` é do teste do limite de
-- envio do formulário (06/09/2026). `.invalid` é o domínio que a norma
-- (RFC 2606) reserva justamente para nunca existir — nenhum cliente real
-- tem e-mail nele.
--
-- ⚠️ FICAM DE FORA, de propósito, os leads do Jefferson
-- (jefferson.ariane1402@ e ariane.bafreitas@). Foram testes do dono, mas a
-- decisão de apagar é dele, não de um padrão.
--
-- As mensagens já enviadas a um lead apagado continuam no histórico
-- (`on delete set null` em hub_mensagens).
-- ═══════════════════════════════════════════════════════════════════════

with apagados as (
  delete from public.hub_leads
  where (
        email ilike '%.invalid'          -- domínio reservado, nunca existe
     or email ilike '%@exemplo.%'
     or email ilike '%@example.%'
     or email ilike '%@teste.%'
     or email ilike '%@test.%'
     or email ilike 'teste.%'
     or email ilike 'teste@%'
     or email ilike 'test@%'
     or email ilike 'demo.%'
     or email ilike 'visitante.teste.%'
     or nome  ilike 'zz %'               -- marca dos testes automáticos
  )
  -- Cinto e suspensório: os sócios nunca entram, mesmo que um padrão
  -- acima um dia passe a casar com eles.
  and email not ilike 'jefferson.ariane1402@%'
  and email not ilike 'ariane.bafreitas@%'
  and email not ilike 'franklincastriani@%'
  and email not ilike 'novareadmapp@%'
  returning email
)
select
  count(*)                                        as leads_de_teste_apagados,
  (select count(*) from public.hub_leads) - count(*) as leads_que_ficaram,
  (array_agg(email order by email))[1:20]         as o_que_foi_apagado
from apagados;
