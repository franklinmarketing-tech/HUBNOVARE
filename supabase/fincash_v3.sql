-- ============================================================================
-- FINCASH v3 — Subcategorias, ordem e orçamento FIXO × VARIÁVEL
-- ----------------------------------------------------------------------------
-- Rodar UMA vez no SQL Editor do Supabase, DEPOIS de `fincash.sql` e de
-- `fincash_orcamento.sql`. É idempotente e ADITIVO.
--
-- ⚠️ ESTE ARQUIVO NASCE NUM BANCO QUE JÁ TEM CLIENTE LANÇANDO. Nenhuma coluna
-- nova é `not null` sem default, nenhuma coluna existente muda de tipo, e
-- nenhuma linha é reescrita. Migração que precisa de janela de manutenção num
-- app de dinheiro é migração que não acontece.
--
-- AS DUAS LACUNAS QUE ELE FECHA
--   1. Categoria de um nível só. "Gastei quanto em streaming?" não tem
--      resposta quando streaming está dissolvido dentro de "Lazer". Categoria
--      é para ORÇAR; subcategoria é para DESCOBRIR. São perguntas diferentes e
--      por isso pedem dois níveis, não vinte categorias planas.
--   2. Orçamento sempre por competência. Aluguel é o mesmo número em doze
--      meses e obriga doze digitações — até a pessoa parar de digitar e o
--      orçamento morrer por atrito.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Subcategoria — a MESMA tabela, apontando para si
-- ----------------------------------------------------------------------------
-- POR QUE AUTO-REFERÊNCIA e não uma tabela `fin_subcategorias`
-- Subcategoria tem exatamente os mesmos campos de categoria: nome, cor, grupo,
-- ordem, arquivada. Tabela nova seria a mesma DDL escrita duas vezes, e daí em
-- diante duas RLS, dois seeds e dois lugares para esquecer de aplicar a
-- correção. Auto-referência também deixa o CRUD, a tela e a política de
-- segurança serem UM só.
--
-- POR QUE SÓ DOIS NÍVEIS, e o banco não impede o terceiro
-- Um `check` de profundidade precisaria consultar a linha pai (não cabe em
-- check) ou de mais um gatilho. O motor e a tela tratam neto como filho do
-- avô; o custo de um terceiro nível acidental é cosmético, o custo de mais um
-- gatilho no caminho de escrita não é.
alter table public.fin_categorias
  add column if not exists pai_id uuid references public.fin_categorias(id) on delete cascade;

comment on column public.fin_categorias.pai_id is
  'Nulo = categoria (nivel 1). Preenchido = subcategoria do pai. on delete cascade porque filho orfao apontando para o nada e pior que filho apagado junto.';

-- `ordem` porque a lista alfabética é a ordem de ninguém: quem gasta metade da
-- renda com moradia quer moradia em cima, e não "Assinaturas" só porque começa
-- com A. Inteiro ESPARSO (10, 20, 30…) para arrastar uma linha entre outras
-- duas custar UM update, e não renumerar a lista inteira.
alter table public.fin_categorias
  add column if not exists ordem int not null default 0;

create index if not exists fin_categorias_pai_idx
  on public.fin_categorias (user_id, pai_id, ordem);

-- ── O nome deixa de ser único no usuário e passa a ser único DENTRO DO PAI ───
-- A restrição original `unique (user_id, nome, tipo)` impede justamente o que
-- a hierarquia existe para permitir: "Streaming" dentro de Assinaturas E
-- "Streaming" dentro de Trabalho; ou "Restaurante" como categoria de quem come
-- fora todo dia e como subcategoria de Alimentação de quem não come.
--
-- Índice de EXPRESSÃO com coalesce porque, em Postgres, dois nulos são
-- distintos entre si: sem o coalesce, `unique (user_id, tipo, pai_id, nome)`
-- deixaria criar duas categorias-raiz com o mesmo nome — exatamente o que a
-- restrição antiga acertava.
do $$
begin
  if exists (
    select 1 from pg_constraint
     where conname = 'fin_categorias_user_id_nome_tipo_key'
  ) then
    alter table public.fin_categorias
      drop constraint fin_categorias_user_id_nome_tipo_key;
  end if;
end $$;

create unique index if not exists fin_categorias_nome_no_pai_idx
  on public.fin_categorias (
    user_id,
    tipo,
    coalesce(pai_id, '00000000-0000-0000-0000-000000000000'::uuid),
    nome
  );


-- ----------------------------------------------------------------------------
-- 2. O lançamento ganha subcategoria — e `categoria_id` NÃO muda de sentido
-- ----------------------------------------------------------------------------
-- A DECISÃO QUE SUSTENTA A MIGRAÇÃO INTEIRA:
-- `categoria_id` continua sendo SEMPRE a categoria-pai. A subcategoria entra
-- numa coluna nova e opcional.
--
-- A alternativa — apontar `categoria_id` direto para a subcategoria — é mais
-- "normalizada" e teria quebrado o app no dia em que rodasse: extrato, painel,
-- gastos, faturas, orçamento e o robô do WhatsApp agrupam por `categoria_id` e
-- passariam a mostrar "Streaming" como bloco de primeiro nível, com "Lazer"
-- sumindo do total. Seriam seis telas a migrar de uma vez, três delas fora
-- deste trabalho — e migração que exige seis telas em sincronia é a migração
-- que nunca é feita inteira.
--
-- O preço é uma redundância controlada (o pai está no lançamento e também em
-- `fin_categorias.pai_id` da sub). O gatilho abaixo é quem impede que os dois
-- discordem.
alter table public.fin_lancamentos
  add column if not exists subcategoria_id uuid
    references public.fin_categorias(id) on delete set null;

comment on column public.fin_lancamentos.subcategoria_id is
  'Opcional. Nulo = o gasto e da categoria-pai e nada mais: continua valido e continua somando no pai. categoria_id e sempre o pai.';

-- `on delete set null` e não cascade: apagar a subcategoria não pode apagar o
-- gasto. Sem ela, o lançamento volta ao estado em que nasceu — "é da
-- categoria". Mesma escolha do `recorrencia_id`, pelo mesmo motivo.

create index if not exists fin_lancamentos_subcategoria_idx
  on public.fin_lancamentos (user_id, subcategoria_id, data)
  where subcategoria_id is not null;

-- ── Coerência pai/filho, no único lugar que não dá para esquecer ────────────
-- `check` não consegue: precisaria de subconsulta. Gatilho BEFORE, então — e
-- ele sai cedo quando `subcategoria_id` é nulo, que é a maioria das escritas.
-- Sem isto, um dia um insert grava Streaming sob Moradia e o total de
-- Assinaturas passa a mentir sem erro nenhum aparecer na tela.
create or replace function public.fin_valida_subcategoria()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pai uuid;
begin
  if new.subcategoria_id is null then
    return new;
  end if;

  select pai_id into v_pai
    from public.fin_categorias
   where id = new.subcategoria_id;

  if v_pai is null then
    raise exception 'subcategoria_id % nao e subcategoria: nao tem pai', new.subcategoria_id;
  end if;

  -- Quem manda é a hierarquia, não quem chamou. Corrigir `categoria_id` aqui
  -- poupa toda tela de lembrar de mandar os dois campos coerentes — e é a
  -- diferença entre um erro barulhento e um total silenciosamente errado.
  if new.categoria_id is distinct from v_pai then
    new.categoria_id := v_pai;
  end if;

  return new;
end $$;

drop trigger if exists fin_lancamentos_subcategoria_tg on public.fin_lancamentos;
create trigger fin_lancamentos_subcategoria_tg
  before insert or update of categoria_id, subcategoria_id
  on public.fin_lancamentos
  for each row execute function public.fin_valida_subcategoria();

-- A recorrência também pode ser de uma subcategoria: Netflix é "todo mês".
alter table public.fin_recorrencias
  add column if not exists subcategoria_id uuid
    references public.fin_categorias(id) on delete set null;


-- ----------------------------------------------------------------------------
-- 3. Orçamento FIXO × VARIÁVEL
-- ----------------------------------------------------------------------------
-- O QUE SÃO OS DOIS MODOS
--   • variavel — um valor POR COMPETÊNCIA. Mercado em dezembro não é mercado
--     em fevereiro. `mes_ref` preenchido, uma linha por mês.
--   • fixo — UM registro, sem competência, que vale para todos os meses.
--     Aluguel. `mes_ref` nulo, uma linha só, projetada para sempre.
--
-- POR QUE NA MESMA TABELA
-- Porque a pergunta que a tela faz é sempre "quanto está orçado para março
-- nesta linha?", e ela precisa de UMA leitura. Duas tabelas fariam toda tela
-- unir as duas e escolher — e escolher em seis lugares é escolher diferente em
-- pelo menos um.
--
-- COMO O FIXO SE COMPORTA QUANDO A PESSOA EDITA UM MÊS SÓ  ← a decisão
-- O fixo NÃO vira variável e NÃO é reescrito. Nasce uma EXCEÇÃO: uma linha
-- `variavel` daquele mês, que vence o fixo por precedência. É literalmente o
-- padrão que o app já usa em `fin_recorrencias`: a regra permanece, o mês vira
-- registro editável, e a exceção não contamina os outros onze.
--   • dezembro ajustado para R$ 2.100 não muda janeiro;
--   • "voltar ao fixo" é APAGAR a exceção, não redigitar o valor de cabeça;
--   • e fica gravado o que foi planejado naquele mês.
-- Editar o VALOR DO FIXO, por outro lado, vale de imediato para todo mês sem
-- exceção — inclusive os passados. É o limite conhecido deste desenho: o fixo
-- não guarda a própria história. Guardá-la exigiria vigência com início e fim,
-- e vigência é uma tela inteira de complexidade paga por quem só queria dizer
-- "meu aluguel é 1.800".
alter table public.fin_orcamentos
  add column if not exists modo text not null default 'variavel';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'fin_orcamentos_modo_chk') then
    alter table public.fin_orcamentos
      add constraint fin_orcamentos_modo_chk check (modo in ('fixo', 'variavel'));
  end if;
end $$;

-- O default 'variavel' é o que torna a migração gratuita: TODA linha que já
-- existe em produção tem `mes_ref` preenchido e é, por definição, variável.
-- Nada a converter, nada a inspecionar, nenhum backfill.

-- Subcategoria também se orça: "R$ 90 de streaming" é um limite mais acionável
-- que "R$ 600 de lazer". Nulo = o orçamento é da categoria como um todo.
alter table public.fin_orcamentos
  add column if not exists subcategoria_id uuid
    references public.fin_categorias(id) on delete cascade;

-- `mes_ref` deixa de ser obrigatório — é justamente ele que o fixo não tem.
alter table public.fin_orcamentos alter column mes_ref drop not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'fin_orcamentos_competencia_chk') then
    alter table public.fin_orcamentos
      add constraint fin_orcamentos_competencia_chk check (
        (modo = 'fixo'     and mes_ref is null) or
        (modo = 'variavel' and mes_ref is not null)
      );
  end if;
end $$;

-- ── Unicidade: uma linha por escopo. Dois índices porque são dois formatos ──
-- A restrição antiga `unique (user_id, categoria_id, mes_ref)` não conhece
-- subcategoria e não sabe recusar o fixo: com `mes_ref` nulo, e nulos sendo
-- distintos entre si, ela deixaria criar dez fixos para a mesma categoria.
do $$
begin
  if exists (
    select 1 from pg_constraint
     where conname = 'fin_orcamentos_user_id_categoria_id_mes_ref_key'
  ) then
    alter table public.fin_orcamentos
      drop constraint fin_orcamentos_user_id_categoria_id_mes_ref_key;
  end if;
end $$;

create unique index if not exists fin_orcamentos_variavel_idx
  on public.fin_orcamentos (
    user_id, categoria_id,
    coalesce(subcategoria_id, '00000000-0000-0000-0000-000000000000'::uuid),
    mes_ref
  )
  where modo = 'variavel';

create unique index if not exists fin_orcamentos_fixo_idx
  on public.fin_orcamentos (
    user_id, categoria_id,
    coalesce(subcategoria_id, '00000000-0000-0000-0000-000000000000'::uuid)
  )
  where modo = 'fixo';

-- ⚠️ CONSEQUÊNCIA CONHECIDA, e ela é deliberada
-- `src/app/fincash/app/page.tsx` (`.in("mes_ref", refs)`) e o robô do WhatsApp
-- (`.eq("mes_ref", ref)`) continuam funcionando: linha com `mes_ref` nulo
-- simplesmente não casa em `in`/`eq`. Eles passam a IGNORAR os orçamentos
-- fixos — subestimam o planejado, nunca quebram e nunca somam errado. Ligar os
-- dois no fixo é trabalho dos donos daqueles arquivos, e a conta já está
-- pronta em `orcamentoDoMes()` de `src/lib/fincash/categorias.ts`.


-- ----------------------------------------------------------------------------
-- 4. RLS — o padrão da casa, reaplicado
-- ----------------------------------------------------------------------------
-- Coluna nova herda a política da tabela; não há o que fazer por ela. O laço
-- existe para o v3 ser rodável mesmo num banco em que alguém tenha mexido nas
-- políticas à mão — `drop`+`create` devolve todas ao padrão.
do $$
declare
  t text;
begin
  foreach t in array array['fin_categorias', 'fin_lancamentos', 'fin_recorrencias', 'fin_orcamentos']
  loop
    execute format('alter table public.%I enable row level security', t);

    execute format('drop policy if exists "fincash: dono manda" on public.%I', t);
    execute format($f$
      create policy "fincash: dono manda" on public.%I
        for all using (auth.uid() = user_id)
        with check (auth.uid() = user_id)
    $f$, t);

    execute format('drop policy if exists "fincash: equipe le" on public.%I', t);
    execute format($f$
      create policy "fincash: equipe le" on public.%I
        for select using (public.hub_papel() in ('admin', 'equipe'))
    $f$, t);
  end loop;
end $$;


-- ----------------------------------------------------------------------------
-- 5. Semear — agora com ordem e com subcategorias
-- ----------------------------------------------------------------------------
-- A versão de `fincash.sql` usava `on conflict (user_id, nome, tipo)`, e essa
-- restrição não existe mais. Trocada por `where not exists`, que dá o mesmo
-- resultado sem depender do nome de um índice — e sobrevive à próxima vez que
-- a chave mudar.
--
-- AS SUBCATEGORIAS SEMEADAS SÃO POUCAS DE PROPÓSITO. Semear trinta é entregar
-- uma árvore que não é a vida de ninguém e que a pessoa vai passar meia hora
-- podando. Estas três ensinam a única coisa que o seed precisa ensinar: que o
-- segundo nível existe. O resto ela cria na tela.
create or replace function public.fin_semear_categorias()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  v_pai uuid;
begin
  for r in
    select * from (values
      ('Salário',      'receita', null,           '#16a34a',  10),
      ('Extra',        'receita', null,           '#22c55e',  20),
      ('Moradia',      'despesa', 'necessidades', '#1e3a5f',  10),
      ('Mercado',      'despesa', 'necessidades', '#2563eb',  20),
      ('Transporte',   'despesa', 'necessidades', '#0891b2',  30),
      ('Saúde',        'despesa', 'necessidades', '#0d9488',  40),
      ('Educação',     'despesa', 'necessidades', '#7c3aed',  50),
      ('Lazer',        'despesa', 'estilo',       '#e8703a',  60),
      ('Restaurante',  'despesa', 'estilo',       '#f59e0b',  70),
      ('Assinaturas',  'despesa', 'estilo',       '#db2777',  80),
      ('Compras',      'despesa', 'estilo',       '#ec4899',  90),
      ('Investimento', 'despesa', 'futuro',       '#059669', 100),
      ('Dívidas',      'despesa', 'futuro',       '#dc2626', 110),
      ('Outros',       'despesa', null,           '#64748b', 120)
    ) as v(nome, tipo, grupo, cor, ordem)
  loop
    insert into public.fin_categorias (user_id, nome, tipo, grupo, cor, ordem)
    select auth.uid(), r.nome, r.tipo, r.grupo, r.cor, r.ordem
     where not exists (
       select 1 from public.fin_categorias c
        where c.user_id = auth.uid()
          and c.tipo = r.tipo
          and c.pai_id is null
          and c.nome = r.nome
     );
  end loop;

  select id into v_pai
    from public.fin_categorias
   where user_id = auth.uid() and tipo = 'despesa'
     and pai_id is null and nome = 'Assinaturas';

  if v_pai is not null then
    for r in
      select * from (values
        ('Streaming',   '#db2777', 10),
        ('Aplicativos', '#a855f7', 20),
        ('Academia',    '#f43f5e', 30)
      ) as v(nome, cor, ordem)
    loop
      insert into public.fin_categorias (user_id, nome, tipo, grupo, cor, ordem, pai_id)
      select auth.uid(), r.nome, 'despesa', 'estilo', r.cor, r.ordem, v_pai
       where not exists (
         select 1 from public.fin_categorias c
          where c.user_id = auth.uid() and c.tipo = 'despesa'
            and c.pai_id = v_pai and c.nome = r.nome
       );
    end loop;
  end if;
end $$;

revoke all on function public.fin_semear_categorias() from public, anon;
grant execute on function public.fin_semear_categorias() to authenticated;

-- Ordem para quem já tinha categorias antes do v3: todas nasceram com 0, e
-- uma lista inteira empatada em 0 volta a ser lista alfabética — a `ordem`
-- existiria sem fazer nada. Numera UMA vez, e só o que ainda está zerado:
-- rodar de novo não mexe em quem já foi reordenado pela tela.
do $$
begin
  with numerada as (
    select id, row_number() over (
             partition by user_id, tipo, coalesce(pai_id, '00000000-0000-0000-0000-000000000000'::uuid)
             order by nome
           ) * 10 as n
      from public.fin_categorias
     where ordem = 0
  )
  update public.fin_categorias c
     set ordem = numerada.n
    from numerada
   where c.id = numerada.id;
end $$;


-- ----------------------------------------------------------------------------
-- 6. Histórico — agora ele enxerga os dois níveis
-- ----------------------------------------------------------------------------
-- `drop` antes do `create`: a função ganhou uma coluna de saída, e
-- `create or replace` não muda o tipo de retorno de uma função existente.
--
-- O QUE MUDOU NA SEMÂNTICA, que é a parte que importa:
--   • linha com `subcategoria_id` NULO = o TOTAL da categoria, subcategorias
--     incluídas. É o número da linha-pai na tela, e é exatamente o mesmo que a
--     função devolvia antes do v3 — quem já lia continua lendo certo.
--   • linha com `subcategoria_id` = só aquela subcategoria.
--
-- `grouping sets` faz os dois recortes numa varredura só. Duas consultas
-- dariam os mesmos números pelo dobro do custo — e com a chance de uma delas
-- ganhar um dia um filtro que a outra não ganhou.
drop function if exists public.fin_historico_categoria(int);

create or replace function public.fin_historico_categoria(p_meses int default 6)
returns table (
  categoria_id    uuid,
  subcategoria_id uuid,
  meses           int,
  minimo          numeric,
  media           numeric,
  maximo          numeric
)
language sql
security invoker
stable
set search_path = public
as $$
  with por_mes as (
    select
      l.categoria_id                 as cat,
      l.subcategoria_id              as sub,
      -- ⚠️ A ARMADILHA DO `grouping sets`, e é sutil o bastante para merecer
      -- uma coluna só para ela: o recorte (cat, sub, ref) também produz a
      -- fatia "lançamentos SEM subcategoria", que sai com `sub` nulo — igual,
      -- na aparência, à linha de total do pai. Somadas no mesmo balde, elas
      -- dobrariam `meses` e estragariam mínimo, média e máximo do pai.
      -- `grouping()` devolve 1 quando a coluna foi agregada (é a linha de
      -- total) e 0 quando ela participou do agrupamento (é a fatia). É o
      -- único jeito de separar as duas.
      grouping(l.subcategoria_id)    as eh_total,
      to_char(l.data, 'YYYY-MM')     as ref,
      sum(l.valor)                   as total
    from public.fin_lancamentos l
    where l.user_id = auth.uid()
      and l.tipo = 'despesa'
      and l.categoria_id is not null
      -- Só meses FECHADOS: o corrente está pela metade e puxaria a média para
      -- baixo, sugerindo um orçamento menor do que a vida cabe.
      and to_char(l.data, 'YYYY-MM') < to_char(now(), 'YYYY-MM')
      and l.data >= (date_trunc('month', now()) - (p_meses || ' months')::interval)
    group by grouping sets ((l.categoria_id, ref), (l.categoria_id, l.subcategoria_id, ref))
  )
  select
    cat                  as categoria_id,
    sub                  as subcategoria_id,
    count(*)::int        as meses,
    min(total)           as minimo,
    round(avg(total), 2) as media,
    max(total)           as maximo
  from por_mes
  -- Fica a linha de total do pai (eh_total = 1) e cada subcategoria de fato
  -- (sub not null). A fatia "sem subcategoria" é descartada: ela não é uma
  -- linha da tela — quem quiser esse número tira do total do pai menos as
  -- subs, e não de mais uma linha sem nome para a pessoa entender.
  where eh_total = 1 or sub is not null
  group by cat, sub;
$$;

revoke all on function public.fin_historico_categoria(int) from public, anon;
grant execute on function public.fin_historico_categoria(int) to authenticated;


-- ----------------------------------------------------------------------------
-- Conferência — 5 colunas novas, 3 índices, 1 gatilho
-- ----------------------------------------------------------------------------
select 'colunas' as o_que, count(*) as achados
  from information_schema.columns
 where table_schema = 'public'
   and (table_name || '.' || column_name) in (
     'fin_categorias.pai_id', 'fin_categorias.ordem',
     'fin_lancamentos.subcategoria_id',
     'fin_orcamentos.modo', 'fin_orcamentos.subcategoria_id'
   )
union all
select 'indices', count(*) from pg_indexes
 where schemaname = 'public'
   and indexname in (
     'fin_orcamentos_fixo_idx', 'fin_orcamentos_variavel_idx',
     'fin_categorias_nome_no_pai_idx'
   )
union all
select 'gatilho', count(*) from pg_trigger where tgname = 'fin_lancamentos_subcategoria_tg';
