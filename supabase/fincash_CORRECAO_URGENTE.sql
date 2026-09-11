-- ============================================================================
-- FINCASH — CORREÇÃO URGENTE: a view `fin_saldos` vaza saldo entre usuários
-- ============================================================================
-- RODE ESTE ARQUIVO ANTES DE QUALQUER OUTRA COISA.
--
-- O QUE ESTÁ ACONTECENDO
-- No PostgreSQL, uma view é executada com os privilégios de QUEM A CRIOU, não
-- de quem a consulta. É o comportamento padrão, e a consequência é que a RLS
-- das tabelas por baixo simplesmente NÃO É APLICADA quando alguém lê a view.
--
-- `fin_saldos` soma `fin_contas` com `fin_lancamentos`. As duas tabelas têm RLS
-- correta e restritiva. A view, não: qualquer pessoa autenticada que consulte
-- `fin_saldos` recebe as linhas de TODOS os usuários — nome da conta e saldo.
--
-- Confirmado em produção em 10/09/2026: uma conta recém-criada, sem nenhum
-- lançamento, leu 11 contas de outras pessoas somando cerca de R$ 119 mil. O
-- efeito aparecia na tela de Investimentos, onde "parado em conta" mostrava o
-- patrimônio somado de estranhos.
--
-- POR QUE PASSOU
-- A RLS foi aplicada em loop sobre a lista de TABELAS, e view não é tabela:
-- não entrou na lista e não deu erro nenhum. Silêncio dos dois lados.
--
-- A CORREÇÃO
-- `security_invoker = on` faz a view rodar com os privilégios de quem consulta,
-- e aí a RLS das tabelas base volta a valer. Disponível no PostgreSQL 15+, que
-- é o que o Supabase serve.
-- ============================================================================

alter view public.fin_saldos set (security_invoker = on);

comment on view public.fin_saldos is
  'Saldo por conta. security_invoker = on: sem isso a view roda com o privilégio do criador e IGNORA a RLS das tabelas base, devolvendo as contas de todos os usuários. Nunca remova essa opção.';


-- ----------------------------------------------------------------------------
-- Conferência: rode e leia o resultado
-- ----------------------------------------------------------------------------
-- `security_invoker` precisa aparecer como `on`. Se a coluna vier vazia ou com
-- `off`, a correção não aplicou e o vazamento continua aberto.
select
  c.relname                                             as view,
  coalesce(
    (select option_value
       from pg_options_to_table(c.reloptions)
      where option_name = 'security_invoker'),
    'NAO DEFINIDO — AINDA VAZANDO'
  )                                                     as security_invoker
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'v'
  and c.relname like 'fin\_%';


-- ----------------------------------------------------------------------------
-- E o resto do schema? Uma varredura, porque o mesmo erro se repete calado
-- ----------------------------------------------------------------------------
-- Lista TODA view do schema público sem `security_invoker`. Nem toda view
-- precisa da opção (uma que só lê tabela pública, por exemplo), mas qualquer
-- uma que toque tabela com RLS precisa. Vale conferir cada linha que aparecer.
select
  c.relname as view_sem_security_invoker
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'v'
  and not exists (
    select 1
      from pg_options_to_table(c.reloptions)
     where option_name = 'security_invoker'
       and option_value = 'true'
  )
order by c.relname;
