-- ═══════════════════════════════════════════════════════════════════════
-- SÓ CLIENTES DE VERDADE: apagar contas de teste e zerar a medição
--
-- ⚠️ ISTO APAGA, E NÃO TEM DESFAZER. O passo 1 não apaga nada — rode-o
-- primeiro e confira os números antes de seguir.
--
-- ── POR QUE EXISTE UMA SEGUNDA LIMPEZA ───────────────────────────────────
--
-- A primeira (19/10/2026) apagou 91 contas `demo.fincash.*` e o filtro
-- parecia completo. Não era: existe um SEGUNDO padrão, `visitante.teste.*`,
-- criado pela rota `/finplan/testar` — que nem existe mais, porque o FINPLAN
-- foi excluído em 18/10. As contas ficaram.
--
-- ⚠️ A LIÇÃO, e o motivo do passo 1 ser o que é: filtrar pelo padrão que se
-- conhece deixa de fora o padrão que não se conhece. Em vez de adivinhar
-- mais um prefixo, o passo 1 LISTA os padrões por conta própria e deixa os
-- números à vista. Se aparecer um terceiro, ele aparece ali — e não daqui a
-- um mês, numa tela do painel, inflando um número que alguém vai usar para
-- decidir.
--
-- ── A MEDIÇÃO TAMBÉM É ZERADA ────────────────────────────────────────────
--
-- `hub_eventos` guarda quem abriu qual ferramenta. Ela entrou no ar em
-- 18/10/2026 e, até agora, as únicas linhas são as visitas que os TESTES
-- geraram ao conferir se a gravação funcionava. Começar do zero é mais
-- honesto do que descontar: o painel passa a contar só gente de verdade, a
-- partir de hoje.
-- ═══════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────
-- PASSO 1 — O QUE EXISTE. Não muda nada.
--
-- Confira: em `exemplos`, nenhum e-mail pode ser de gente de verdade.
-- ─────────────────────────────────────────────────────────────────────
select
  case
    when email like 'demo.fincash.%'    then '1. demo.fincash (rota /fincash/testar)'
    when email like 'demo.finplan.%'    then '2. demo.finplan (rota antiga)'
    when email like 'visitante.teste.%' then '3. visitante.teste (rota /finplan/testar, extinta)'
    when email like 'teste%' or email like '%@teste.%' or email like '%+teste%'
                                        then '4. outros que parecem teste'
    else                                     '5. GENTE DE VERDADE'
  end                                   as grupo,
  count(*)                              as quantas,
  (array_agg(email order by created_at))[1:3] as exemplos
from auth.users
group by 1
order by 1;


-- Quantos eventos de medição existem, e de onde vieram:
select
  'medicao de uso'                      as o_que,
  count(*)                              as eventos,
  count(distinct modulo)                as ferramentas,
  min(criado_em)::date                  as desde,
  max(criado_em)::date                  as ate
from public.hub_eventos;


-- ─────────────────────────────────────────────────────────────────────
-- PASSO 2 — APAGAR AS CONTAS DE TESTE.
--
-- ⚠️ O FILTRO EXIGE AS DUAS COISAS: o prefixo conhecido E o domínio da
-- casa. Os sócios e a equipe usam @novareapp.com.br, e é o prefixo que
-- separa máquina de gente. Sozinho, o domínio apagaria vocês.
--
-- O cascade leva junto lançamentos, contas, cartões, dívidas, metas e o
-- perfil de cada uma.
-- ─────────────────────────────────────────────────────────────────────
delete from auth.users
where (
      email like 'demo.fincash.%'
   or email like 'demo.finplan.%'
   or email like 'visitante.teste.%'
  )
  and email like '%@novareapp.com.br';


-- ─────────────────────────────────────────────────────────────────────
-- PASSO 3 — ZERAR A MEDIÇÃO DE USO.
--
-- Só os testes passaram por aqui até agora. A contagem recomeça hoje,
-- limpa, e daqui para a frente é só gente de verdade.
-- ─────────────────────────────────────────────────────────────────────
delete from public.hub_eventos;


-- ─────────────────────────────────────────────────────────────────────
-- PASSO 4 — O FILTRO DAS ESTATÍSTICAS PASSA A CONHECER O TERCEIRO PADRÃO.
--
-- `hub_eh_demo` é consultada por `hub_saude`, `hub_linha_do_tempo` e
-- `hub_leads_painel`. Trocando só esta função, as três passam a ignorar
-- `visitante.teste.*` sem serem tocadas — era para isso que ela existia
-- em vez de um `not like` repetido em quatro lugares.
-- ─────────────────────────────────────────────────────────────────────
create or replace function public.hub_eh_demo(p_email text)
returns boolean
language sql
immutable
as $$
  select coalesce(p_email, '') like 'demo.fincash.%'
      or coalesce(p_email, '') like 'demo.finplan.%'
      or coalesce(p_email, '') like 'visitante.teste.%';
$$;

comment on function public.hub_eh_demo(text) is
  'Conta criada por rota de demonstracao, e nao por uma pessoa. Fica fora de toda estatistica. Tres padroes: demo.fincash (/fincash/testar), demo.finplan e visitante.teste (ambas de rotas ja extintas).';


-- ─────────────────────────────────────────────────────────────────────
-- PASSO 5 — CONFERIR. `contas_de_teste` e `eventos` têm de voltar 0.
-- ─────────────────────────────────────────────────────────────────────
select
  (select count(*) from auth.users
    where email like 'demo.fincash.%'
       or email like 'demo.finplan.%'
       or email like 'visitante.teste.%')        as contas_de_teste,
  (select count(*) from public.hub_eventos)      as eventos,
  (select count(*) from auth.users)              as contas_restantes,
  case when (select count(*) from auth.users
              where email like 'demo.fincash.%'
                 or email like 'demo.finplan.%'
                 or email like 'visitante.teste.%') = 0
       then 'limpo: so gente de verdade'
       else 'ATENCAO: ainda sobrou conta de teste'
  end                                            as resultado;
