-- ============================================================================
-- FINCASH — Orçamento por categoria
-- ----------------------------------------------------------------------------
-- Rodar UMA vez no SQL Editor do Supabase, DEPOIS de `fincash.sql`.
-- É idempotente: pode rodar de novo sem estragar nada.
--
-- POR QUE O ORÇAMENTO É POR MÊS, e não um valor fixo na categoria
-- Dezembro não é março. Guardar um único "gasto o quanto com mercado" força a
-- pessoa a reescrever o número toda vez que o mês é atípico — e, pior, apaga o
-- histórico: não dá para dizer "em julho você planejou R$ 800 e gastou 1.100"
-- se o planejado de julho foi sobrescrito.
--
-- A CHAVE É (usuário, categoria, mês). Um valor por categoria por mês.
-- ============================================================================

create table if not exists public.fin_orcamentos (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  categoria_id uuid not null references public.fin_categorias(id) on delete cascade,

  -- "2026-03". Texto, e não date: o orçamento é do MÊS, não de um dia dele, e
  -- guardar como data convidaria a comparações por dia que não fazem sentido.
  mes_ref      text not null check (mes_ref ~ '^\d{4}-\d{2}$'),

  valor        numeric(14,2) not null check (valor >= 0),
  criado_em    timestamptz not null default now(),

  unique (user_id, categoria_id, mes_ref)
);

comment on table public.fin_orcamentos is
  'Quanto o cliente planejou gastar em cada categoria, mês a mês.';

create index if not exists fin_orcamentos_mes_idx
  on public.fin_orcamentos (user_id, mes_ref);

alter table public.fin_orcamentos enable row level security;

drop policy if exists "fincash: dono manda" on public.fin_orcamentos;
create policy "fincash: dono manda"
  on public.fin_orcamentos for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- A equipe lê, pela mesma razão das outras tabelas do FINCASH: a revisão
-- trimestral precisa comparar o que foi planejado com o que foi gasto.
drop policy if exists "fincash: equipe le" on public.fin_orcamentos;
create policy "fincash: equipe le"
  on public.fin_orcamentos for select
  using (public.hub_papel() in ('admin', 'equipe'));


-- ----------------------------------------------------------------------------
-- O histórico que torna o orçamento realista
-- ----------------------------------------------------------------------------
-- A ideia é boa e vale ser copiada: mostrar o MÍNIMO, a MÉDIA e o MÁXIMO já
-- gastos na categoria antes de a pessoa digitar o limite. Orçamento chutado é
-- orçamento que estoura no dia 12 e faz a pessoa desistir do app.
--
-- Feito no banco, e não no navegador, porque exige varrer o histórico inteiro
-- de lançamentos — baixar tudo para somar no cliente ficaria lento já no
-- segundo ano de uso.
--
-- `meses` vem junto de propósito: "média de R$ 620" com 1 mês de histórico não
-- é média, é um número solto. A tela precisa saber a diferença para não vender
-- confiança que o dado não tem.
create or replace function public.fin_historico_categoria(p_meses int default 6)
returns table (
  categoria_id uuid,
  meses        int,
  minimo       numeric,
  media        numeric,
  maximo       numeric
)
language sql
security invoker
stable
set search_path = public
as $$
  with por_mes as (
    select
      l.categoria_id,
      to_char(l.data, 'YYYY-MM') as ref,
      sum(l.valor)               as total
    from public.fin_lancamentos l
    where l.user_id = auth.uid()
      and l.tipo = 'despesa'
      and l.categoria_id is not null
      -- Só meses FECHADOS: o mês corrente ainda está pela metade e puxaria a
      -- média para baixo, sugerindo um orçamento menor do que a vida cabe.
      and to_char(l.data, 'YYYY-MM') < to_char(now(), 'YYYY-MM')
      and l.data >= (date_trunc('month', now()) - (p_meses || ' months')::interval)
    group by l.categoria_id, to_char(l.data, 'YYYY-MM')
  )
  select
    categoria_id,
    count(*)::int          as meses,
    min(total)             as minimo,
    round(avg(total), 2)   as media,
    max(total)             as maximo
  from por_mes
  group by categoria_id;
$$;

revoke all on function public.fin_historico_categoria(int) from public, anon;
grant execute on function public.fin_historico_categoria(int) to authenticated;



-- ----------------------------------------------------------------------------
-- Dono automático — quem preenche `user_id` é o banco
-- ----------------------------------------------------------------------------
-- O app grava SEM passar `user_id` (veja `salvarConta`, `salvarLancamento`,
-- `salvarMeta`, `salvarInvestimento`): quem sabe quem está logado é o banco,
-- pela sessão do PostgREST. Repetir `user_id` em cada insert do TypeScript é
-- uma linha a mais para esquecer — e esquecida uma vez, o insert morre no
-- not-null e a tela mostra "null value in column user_id" para o cliente.
--
-- O `default auth.uid()` na definição da coluna resolve o banco NOVO. Este
-- bloco resolve o banco onde a tabela JÁ existe: `create table if not exists`
-- não altera coluna de tabela existente, então sem isto o default nunca
-- chegaria lá. `alter ... set default` é idempotente: rodar de novo não dói.
do $$
declare t text;
begin
  foreach t in array array['fin_orcamentos']
  loop
    execute format('alter table public.%I alter column user_id set default auth.uid()', t);
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- Conferência — deve devolver 1 linha (a tabela) e nenhum erro
-- ----------------------------------------------------------------------------
select tablename, count(*) as policies
  from pg_policies
 where schemaname = 'public' and tablename = 'fin_orcamentos'
 group by tablename;
