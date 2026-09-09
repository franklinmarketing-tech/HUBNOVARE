-- ============================================================================
-- FINCASH — o banco
-- ----------------------------------------------------------------------------
-- Rodar UMA vez no SQL Editor do Supabase (projeto hjikeevfzfswqydduars).
-- É idempotente: pode rodar de novo sem estragar nada.
--
-- POR QUE TABELAS PRÓPRIAS, e não o `tool_states` que as ferramentas usam
-- O `tool_states` guarda um blob JSON por chave. Serve para uma calculadora
-- que lembra 10 itens. Não serve para o FINCASH, por três motivos que
-- aparecem cedo:
--   1. Cada lançamento novo reescreveria o blob INTEIRO. Com 800 lançamentos
--      isso fica lento, e uma escrita concorrente de duas abas perde dados.
--   2. Não dá para consultar por período no banco — "os gastos de março"
--      exigiria baixar tudo e filtrar no navegador.
--   3. O CONSULTOR precisa ler. A revisão trimestral é o diferencial da casa,
--      e ela depende de conseguir consultar o que o cliente lançou.
--
-- O PREFIXO `fin_` existe para não colidir com as tabelas do Planejamento
-- (clients, income, expenses, debts, assets…), que descrevem o RETRATO anual
-- do cliente. Aqui é o dia a dia. São coisas diferentes e vão conversar por
-- uma ponte explícita, não por mistura de tabela.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Contas — onde o dinheiro está
-- ----------------------------------------------------------------------------
-- Sem conta não há SALDO, e saldo é a primeira coisa que a pessoa abre o app
-- para ver. É a peça que hoje não existe em ferramenta nenhuma da casa.
create table if not exists public.fin_contas (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nome          text not null check (char_length(nome) between 1 and 60),
  tipo          text not null default 'corrente'
                check (tipo in ('corrente', 'poupanca', 'carteira', 'investimento')),

  -- O saldo do dia em que a pessoa cadastrou a conta. Todo o resto é somado
  -- em cima disto — sem ele, o app só sabe a variação, não o saldo real.
  saldo_inicial numeric(14,2) not null default 0,

  cor           text not null default '#1e3a5f',
  arquivada     boolean not null default false,
  criado_em     timestamptz not null default now()
);

comment on table public.fin_contas is
  'Contas do FINCASH: onde o dinheiro do cliente está.';


-- ----------------------------------------------------------------------------
-- 2. Cartões
-- ----------------------------------------------------------------------------
-- Modelado desde já, mesmo que as telas venham depois: acrescentar cartão a um
-- schema que não o previu obrigaria a migrar lançamento já gravado de cliente.
create table if not exists public.fin_cartoes (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nome                text not null check (char_length(nome) between 1 and 60),
  limite              numeric(14,2),

  -- O par que define a fatura. Dia do mês, 1 a 31.
  dia_fechamento      int not null default 1  check (dia_fechamento  between 1 and 31),
  dia_vencimento      int not null default 10 check (dia_vencimento  between 1 and 31),

  -- De qual conta a fatura é debitada quando paga.
  conta_pagamento_id  uuid references public.fin_contas(id) on delete set null,

  cor                 text not null default '#e8703a',
  arquivado           boolean not null default false,
  criado_em           timestamptz not null default now()
);


-- ----------------------------------------------------------------------------
-- 3. Categorias — do CLIENTE, não do código
-- ----------------------------------------------------------------------------
-- Hoje as categorias são uma constante dentro de `gastos/page.tsx`. Quem gasta
-- com "ração do cachorro" tem de escolher "Outros" — e categoria que não
-- descreve a vida da pessoa é categoria que ela para de preencher.
--
-- `grupo` mantém a leitura 50/30/20 que o Orçamento Inteligente já usa, para
-- as duas telas falarem a mesma língua.
create table if not exists public.fin_categorias (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nome      text not null check (char_length(nome) between 1 and 40),
  tipo      text not null check (tipo in ('receita', 'despesa')),
  grupo     text check (grupo in ('necessidades', 'estilo', 'futuro')),
  cor       text not null default '#64748b',
  arquivada boolean not null default false,
  criado_em timestamptz not null default now(),
  unique (user_id, nome, tipo)
);


-- ----------------------------------------------------------------------------
-- 4. Lançamentos — receita e despesa na MESMA tabela
-- ----------------------------------------------------------------------------
-- Duas tabelas separadas obrigariam a unir tudo em toda tela que mostra
-- extrato, saldo ou fluxo — que são quase todas.
--
-- O VALOR É SEMPRE POSITIVO. O sinal vem de `tipo`. Guardar despesa como
-- número negativo E ter um campo de tipo é a receita clássica de somar duas
-- vezes o mesmo sinal e mostrar saldo errado.
create table if not exists public.fin_lancamentos (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,

  tipo          text not null check (tipo in ('receita', 'despesa')),
  descricao     text not null check (char_length(descricao) between 1 and 120),
  valor         numeric(14,2) not null check (valor > 0),
  data          date not null,

  categoria_id  uuid references public.fin_categorias(id) on delete set null,

  -- Ou saiu de uma conta, ou foi no cartão. Nunca os dois, nunca nenhum.
  conta_id      uuid references public.fin_contas(id)  on delete cascade,
  cartao_id     uuid references public.fin_cartoes(id) on delete cascade,

  -- Falso = previsto (conta a pagar, salário que ainda vai cair). O saldo
  -- realizado conta só o que é verdadeiro; a projeção conta os dois.
  pago          boolean not null default true,

  -- Parcelamento: "3 de 12". Nulo quando é lançamento avulso.
  parcela_num   int check (parcela_num   >= 1),
  parcela_total int check (parcela_total >= 1),

  recorrencia_id uuid,
  observacao    text,
  criado_em     timestamptz not null default now(),

  constraint fin_lancamento_origem_unica check (
    (conta_id is not null and cartao_id is null) or
    (conta_id is null and cartao_id is not null)
  ),
  constraint fin_parcela_coerente check (
    (parcela_num is null and parcela_total is null) or
    (parcela_num is not null and parcela_total is not null and parcela_num <= parcela_total)
  )
);

comment on table public.fin_lancamentos is
  'Entradas e saídas do dia a dia. Valor sempre positivo; o sinal vem de tipo.';

-- A consulta que o app faz o tempo todo: o mês de um usuário.
create index if not exists fin_lancamentos_periodo_idx
  on public.fin_lancamentos (user_id, data desc);

-- A consulta da fatura: o que caiu neste cartão no período.
create index if not exists fin_lancamentos_cartao_idx
  on public.fin_lancamentos (user_id, cartao_id, data)
  where cartao_id is not null;


-- ----------------------------------------------------------------------------
-- 5. Recorrências — "todo mês, dia 10"
-- ----------------------------------------------------------------------------
-- O molde, não o lançamento. Gerar 12 meses de aluguel de uma vez encheria a
-- tabela de futuro que muda; guardar a regra e materializar sob demanda
-- mantém a edição barata ("o aluguel subiu" muda uma linha, não doze).
create table if not exists public.fin_recorrencias (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,

  tipo         text not null check (tipo in ('receita', 'despesa')),
  descricao    text not null check (char_length(descricao) between 1 and 120),
  valor        numeric(14,2) not null check (valor > 0),
  categoria_id uuid references public.fin_categorias(id) on delete set null,
  conta_id     uuid references public.fin_contas(id)  on delete cascade,
  cartao_id    uuid references public.fin_cartoes(id) on delete cascade,

  frequencia   text not null default 'mensal'
               check (frequencia in ('mensal', 'semanal', 'anual')),
  dia          int not null check (dia between 1 and 31),
  inicio       date not null,
  fim          date,
  ativa        boolean not null default true,
  criado_em    timestamptz not null default now()
);

-- O vínculo do lançamento com o molde que o gerou.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'fin_lancamentos_recorrencia_fk'
  ) then
    alter table public.fin_lancamentos
      add constraint fin_lancamentos_recorrencia_fk
      foreign key (recorrencia_id) references public.fin_recorrencias(id)
      on delete set null;
  end if;
end $$;


-- ----------------------------------------------------------------------------
-- 6. Saldo — a conta feita em UM lugar só
-- ----------------------------------------------------------------------------
-- Se cada tela somar do seu jeito, uma hora duas telas mostram saldos
-- diferentes para a mesma conta — e aí o cliente não confia em nenhuma.
create or replace view public.fin_saldos as
  select
    c.id                                        as conta_id,
    c.user_id,
    c.nome,
    c.saldo_inicial
      + coalesce(sum(
          case when l.pago then
            case when l.tipo = 'receita' then l.valor else -l.valor end
          else 0 end
        ), 0)                                   as saldo
  from public.fin_contas c
  left join public.fin_lancamentos l on l.conta_id = c.id
  where not c.arquivada
  group by c.id, c.user_id, c.nome, c.saldo_inicial;


-- ----------------------------------------------------------------------------
-- 7. RLS — o dono escreve, a equipe lê
-- ----------------------------------------------------------------------------
-- A equipe LÊ para poder escrever a revisão trimestral, que é o diferencial da
-- casa. Não escreve: o lançamento é do cliente, e consultor que edita o
-- extrato do cliente é problema, não recurso.
--
-- ⚠️ ISTO EXIGE A POLÍTICA DE PRIVACIDADE ATUALIZADA. Ela ainda não diz que a
-- equipe Novare lê os dados financeiros do assinante. É pendência aberta.
do $$
declare
  t text;
begin
  foreach t in array array[
    'fin_contas', 'fin_cartoes', 'fin_categorias',
    'fin_lancamentos', 'fin_recorrencias'
  ] loop
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
-- 8. Categorias iniciais — para a primeira tela não nascer vazia
-- ----------------------------------------------------------------------------
-- Tela de finanças que abre sem nenhuma categoria obriga a pessoa a
-- configurar antes de usar, e é onde ela desiste. Estas são um ponto de
-- partida editável, não uma regra.
create or replace function public.fin_semear_categorias()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.fin_categorias (user_id, nome, tipo, grupo, cor)
  values
    (auth.uid(), 'Salário',      'receita', null,           '#16a34a'),
    (auth.uid(), 'Extra',        'receita', null,           '#22c55e'),
    (auth.uid(), 'Moradia',      'despesa', 'necessidades', '#1e3a5f'),
    (auth.uid(), 'Mercado',      'despesa', 'necessidades', '#2563eb'),
    (auth.uid(), 'Transporte',   'despesa', 'necessidades', '#0891b2'),
    (auth.uid(), 'Saúde',        'despesa', 'necessidades', '#0d9488'),
    (auth.uid(), 'Educação',     'despesa', 'necessidades', '#7c3aed'),
    (auth.uid(), 'Lazer',        'despesa', 'estilo',       '#e8703a'),
    (auth.uid(), 'Restaurante',  'despesa', 'estilo',       '#f59e0b'),
    (auth.uid(), 'Assinaturas',  'despesa', 'estilo',       '#db2777'),
    (auth.uid(), 'Compras',      'despesa', 'estilo',       '#ec4899'),
    (auth.uid(), 'Investimento', 'despesa', 'futuro',       '#059669'),
    (auth.uid(), 'Dívidas',      'despesa', 'futuro',       '#dc2626'),
    (auth.uid(), 'Outros',       'despesa', null,           '#64748b')
  on conflict (user_id, nome, tipo) do nothing;
end $$;

revoke all on function public.fin_semear_categorias() from public, anon;
grant execute on function public.fin_semear_categorias() to authenticated;



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
  foreach t in array array['fin_contas','fin_cartoes','fin_categorias','fin_lancamentos','fin_recorrencias']
  loop
    execute format('alter table public.%I alter column user_id set default auth.uid()', t);
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- Conferência — deve listar 5 tabelas com 2 policies cada
-- ----------------------------------------------------------------------------
select tablename, count(*) as policies
  from pg_policies
 where schemaname = 'public' and tablename like 'org\_%'
 group by tablename
 order by tablename;
