-- ═══════════════════════════════════════════════════════════════════════
-- LIMPAR AS CONTAS DE DEMONSTRAÇÃO DO BANCO DE PRODUÇÃO
--
-- ⚠️ ISTO APAGA DE VERDADE, E NÃO TEM DESFAZER. Leia o filtro antes de rodar.
--
-- DE ONDE VÊM ESSAS CONTAS: `/fincash/testar` e `/finplan/testar` criam um
-- usuário novo a cada visita, com e-mail no formato
--
--     demo.fincash.<aleatório>@novareapp.com.br
--
-- e o semeiam com sete meses de histórico. Não é sandbox: cai no MESMO
-- Supabase de produção (hjikeevfzfswqydduars), no mesmo pool do novareapp.
-- Cada visita de quem quis "experimentar sem criar conta" deixou uma lá, e os
-- testes automáticos somam mais a cada execução.
--
-- ⚠️ O FILTRO É `demo.fincash.%` / `demo.finplan.%`, E NÃO O DOMÍNIO.
-- Filtrar por `@novareapp.com.br` apagaria as contas dos SÓCIOS e da equipe,
-- que usam o mesmo domínio. O prefixo `demo.` é o que separa máquina de gente.
--
-- NÃO PRECISA APAGAR TABELA POR TABELA: todas as `fin_*`, `hub_profiles` e as
-- demais apontam para `auth.users` com `on delete cascade`. Apagar o usuário
-- leva lançamentos, contas, cartões, dívidas, metas e perfil junto.
--
-- Rode no SQL Editor do projeto hjikeevfzfswqydduars.
-- ═══════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────
-- PASSO 1 — OLHAR ANTES DE APAGAR. Este bloco não muda nada.
--
-- Confira duas coisas na resposta: que o total faz sentido, e que em
-- `exemplos` só aparece gente que não existe.
-- ─────────────────────────────────────────────────────────────────────
select
  count(*)                                   as contas_de_teste,
  min(created_at)::date                      as a_mais_antiga,
  max(created_at)::date                      as a_mais_nova,
  (array_agg(email order by created_at))[1:5] as exemplos
from auth.users
where email like 'demo.fincash.%'
   or email like 'demo.finplan.%';


-- Quanto de dado está pendurado nelas (só para dimensionar):
select
  (select count(*) from public.fin_lancamentos l
     join auth.users u on u.id = l.user_id
    where u.email like 'demo.%')             as lancamentos,
  (select count(*) from public.fin_contas c
     join auth.users u on u.id = c.user_id
    where u.email like 'demo.%')             as contas,
  (select count(*) from public.fin_cartoes k
     join auth.users u on u.id = k.user_id
    where u.email like 'demo.%')             as cartoes;


-- ─────────────────────────────────────────────────────────────────────
-- PASSO 2 — APAGAR. Só rode depois de conferir o passo 1.
--
-- ⚠️ `returning` devolve o que foi apagado: se vier linha que você reconhece,
-- algo está errado no filtro — e aí já foi. Por isso o passo 1 existe.
-- ─────────────────────────────────────────────────────────────────────
delete from auth.users
where (email like 'demo.fincash.%' or email like 'demo.finplan.%')
  and email like '%@novareapp.com.br'   -- cinto e suspensório: as duas coisas
returning email, created_at;


-- ─────────────────────────────────────────────────────────────────────
-- PASSO 3 — CONFERIR QUE ZEROU. Tem de voltar 0.
-- ─────────────────────────────────────────────────────────────────────
select count(*) as ainda_sobrou
  from auth.users
 where email like 'demo.fincash.%'
    or email like 'demo.finplan.%';


-- ─────────────────────────────────────────────────────────────────────
-- EXTRA — LEADS DE TESTE EM `hub_leads`
--
-- Isto NÃO apaga nada: lista os leads que parecem teste para você decidir.
-- O lead do Jefferson (jefferson.ariane1402@gmail.com) é REAL e não pode
-- entrar nessa conta — foi o caso que descobriu o funil furado.
-- ─────────────────────────────────────────────────────────────────────
-- ⚠️ A COLUNA DE DATA AQUI É `criado_em`, e não `created_at`. A tabela é
-- escrita em português (`nome`, `telefone`, `origem`, `criado_em`); supor o
-- nome em inglês devolve 42703 e parece defeito do banco.
select id, nome, email, telefone, origem, criado_em
  from public.hub_leads
 where email ilike '%teste%'
    or email ilike '%test@%'
    or email ilike 'demo.%'
    or nome  ilike 'zz %'
 order by criado_em desc;
