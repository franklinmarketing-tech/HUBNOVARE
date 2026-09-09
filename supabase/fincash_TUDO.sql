-- ============================================================================
-- FINCASH — INSTALAÇÃO COMPLETA DO BANCO
-- ============================================================================
-- Cole este arquivo inteiro no SQL Editor do Supabase (projeto do Novare Hub)
-- e execute de uma vez só.
--
-- Junta os quatro arquivos na ORDEM das dependências:
--   1. fincash.sql            contas, cartões, categorias, lançamentos, recorrências
--   2. fincash_orcamento.sql  orçamento por categoria
--   3. fincash_v2.sql         metas, aportes, investimentos
--   4. fincash_whatsapp.sql   vínculo do telefone e log de mensagens
--
-- Trocar a ordem quebra: as tabelas de baixo têm chave estrangeira para as de
-- cima (fin_metas → fin_contas, fin_whatsapp_contas → fin_cartoes, etc.).
--
-- São 11 tabelas, todas com prefixo `fin_`, mais a view `fin_saldos` e as
-- funções `fin_semear_categorias`, `fin_historico_categoria`,
-- `fin_whatsapp_gerar_codigo` e `fin_whatsapp_limpar_pendentes`.
--
-- É seguro rodar mais de uma vez: tudo é `if not exists` / `create or replace`.
-- Cada bloco termina com um `select` de conferência que lista as policies
-- criadas; se algum vier vazio, aquele pedaço não aplicou.
-- ============================================================================



-- ####################################################################
-- ARQUIVO fincash.sql
-- ####################################################################

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


-- ####################################################################
-- ARQUIVO fincash_orcamento.sql
-- ####################################################################

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


-- ####################################################################
-- ARQUIVO fincash_v2.sql
-- ####################################################################

-- ============================================================================
-- FINCASH Financeiro Novare — Metas, Aportes e Investimentos
-- ----------------------------------------------------------------------------
-- Rodar UMA vez no SQL Editor do Supabase, DEPOIS de `fincash.sql` e de
-- `fincash_orcamento.sql`. É idempotente e ADITIVO: não altera nem uma
-- coluna do que já existe, então rodar de novo (ou rodar num banco que já tem
-- cliente lançando) não estraga nada.
--
-- O QUE ESTAS TRÊS TABELAS RESOLVEM, e por que elas vêm juntas
-- O que existe hoje responde "para onde foi o meu dinheiro". Isso é retrovisor.
-- O que falta é o para-brisa: "para onde ele VAI". São três perguntas, e cada
-- uma virou uma tabela:
--   1. fin_metas         — para onde eu quero levar o dinheiro (o sonho com data)
--   2. fin_aportes       — quanto eu de fato já levei (o progresso real, não o
--                          estimado — a diferença entre os dois é o app inteiro)
--   3. fin_investimentos — onde o dinheiro que já foi guardado está rendendo
--
-- A REGRA DO SINAL VALE AQUI TAMBÉM: `valor` é SEMPRE positivo, o sentido vem
-- de um campo `tipo`. É a mesma decisão de `fin_lancamentos`, pelo mesmo
-- motivo: com valor negativo E campo de tipo, uma hora alguém aplica o sinal
-- duas vezes e o número na tela fica errado.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Metas — "pague seus sonhos primeiro"
-- ----------------------------------------------------------------------------
-- A meta só muda comportamento quando ela sabe responder UMA pergunta:
-- "quanto eu tenho de separar POR MÊS para chegar lá no prazo?". Um cartão
-- bonito com barra de progresso e sem esse número é decoração — a pessoa olha,
-- acha bonito e não guarda nada.
--
-- Esse número não é gravado: é `(alvo - acumulado) / meses que faltam`, e as
-- três parcelas mudam sozinhas o tempo todo. Guardar o resultado significaria
-- recalcular e reescrever a linha a cada aporte, e conviver com o dia em que
-- alguém esqueceu de recalcular e a tela mentiu.
create table if not exists public.fin_metas (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,

  nome          text not null check (char_length(nome) between 1 and 80),
  valor_alvo    numeric(14,2) not null check (valor_alvo > 0),

  -- O que a pessoa JÁ TINHA guardado no dia em que cadastrou a meta. Mesma
  -- ideia do `saldo_inicial` da conta, e pela mesma razão: sem um ponto de
  -- partida, quem já tem R$ 20 mil da entrada do apartamento veria 0% de
  -- progresso e concluiria, com razão, que o app não serve para ele.
  --
  -- O ACUMULADO NÃO É UMA COLUNA: é `valor_inicial + aportes - resgates`. Uma
  -- coluna `valor_acumulado` seria um total denormalizado que só está certo
  -- enquanto todo mundo lembrar de atualizá-lo — e é sempre a mesma história:
  -- um dia o aporte é apagado, o total não é corrigido, e a meta passa a
  -- afirmar um dinheiro que não existe.
  valor_inicial numeric(14,2) not null default 0 check (valor_inicial >= 0),

  -- NULO É PERMITIDO de propósito: a reserva de emergência é uma meta legítima
  -- e não tem data. Mas aí o app fica sem o número que faz a meta acontecer (o
  -- quanto por mês), e o motor devolve `null` em vez de inventar um prazo.
  -- Meta sem prazo é desejo; a tela deve dizer isso à pessoa.
  prazo         date,

  -- Texto, e não 1/2/3. Prioridade numérica obriga todo mundo que abre a
  -- tabela a lembrar se 1 é a mais ou a menos importante — e metade lembra
  -- errado. A ordenação fica no motor, com um mapa explícito.
  prioridade    text not null default 'media'
                check (prioridade in ('alta', 'media', 'baixa')),

  -- `pausada` sai da conta de quanto a renda está comprometida, mas continua
  -- na tela; `cancelada` sai da tela. Nenhuma das duas apaga a meta, porque
  -- apagar levaria junto os aportes (cascade) e com eles o histórico de que a
  -- pessoa guardou R$ 4.000 naquele ano.
  status        text not null default 'ativa'
                check (status in ('ativa', 'pausada', 'concluida', 'cancelada')),

  -- Onde o dinheiro da meta mora. Um dos dois, ou nenhum — e NÃO há constraint
  -- de exclusividade aqui, ao contrário do lançamento (que sai de UMA origem):
  -- a meta pode ter uma parte na conta e outra no CDB, e o vínculo é só uma
  -- pista para a tela, nunca a fonte do acumulado.
  conta_id      uuid references public.fin_contas(id) on delete set null,
  investimento_id uuid,  -- FK adicionada no fim do arquivo (a tabela vem depois)

  cor           text not null default '#e8703a',
  -- Nome do ícone lucide ("home", "plane", "graduation-cap"). Cabe aqui e não
  -- na tela porque a meta é do cliente: se o ícone saísse de uma regra do
  -- código, metas diferentes virariam o mesmo desenho e o painel ficaria
  -- ilegível justamente quando a pessoa tem muitas metas.
  icone         text,
  observacao    text,
  criado_em     timestamptz not null default now()
);

comment on table public.fin_metas is
  'Objetivos com valor e prazo. O acumulado vem de fin_aportes, nunca de coluna.';

-- A consulta do painel: as metas vivas do usuário.
create index if not exists fin_metas_ativas_idx
  on public.fin_metas (user_id, status);


-- ----------------------------------------------------------------------------
-- 2. Aportes — o progresso REAL
-- ----------------------------------------------------------------------------
-- Sem esta tabela, o progresso da meta seria "o que a pessoa disse que
-- guardou", que é uma intenção. Com ela é "o que ela guardou", que é um fato.
-- É a mesma distinção que existe entre o orçamento e o extrato — e é o que
-- permite dizer "você planejou R$ 500 por mês e nos últimos 6 meses aportou
-- R$ 310 em média", que é a frase que faz a pessoa mudar alguma coisa.
create table if not exists public.fin_aportes (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  meta_id       uuid not null references public.fin_metas(id) on delete cascade,

  -- O resgate existe porque a vida acontece: a pessoa tirou R$ 2.000 da
  -- viagem para o dentista. Registrar isso como aporte negativo violaria a
  -- regra do sinal da casa; não registrar faria a meta afirmar um dinheiro que
  -- já foi gasto — e é aí que ela perde a confiança no número.
  tipo          text not null default 'aporte'
                check (tipo in ('aporte', 'resgate')),
  valor         numeric(14,2) not null check (valor > 0),
  data          date not null,

  -- QUANDO O APORTE TAMBÉM É UM LANÇAMENTO. Se a pessoa registrou "transferi
  -- R$ 500 para a poupança" como despesa e marcou o aporte na meta, o dinheiro
  -- já saiu do fluxo de caixa uma vez. A projeção de 12 meses só soma aportes
  -- com este campo VAZIO — os demais já estão contados como lançamento, e
  -- somá-los de novo derrubaria o saldo projetado abaixo do que é verdade.
  lancamento_id uuid references public.fin_lancamentos(id) on delete set null,

  observacao    text,
  criado_em     timestamptz not null default now()
);

comment on table public.fin_aportes is
  'Depósitos e resgates de uma meta. Valor sempre positivo; o sentido vem de tipo.';

-- NÃO existe coluna `mes_ref` aqui, ao contrário de `fin_orcamentos`. Lá o dado
-- É do mês (não existe "orçamento do dia 12"); aqui o aporte aconteceu num DIA.
-- Repetir o mês numa coluna criaria duas fontes de verdade que uma hora
-- divergem — o agrupamento por mês sai deste índice.
create index if not exists fin_aportes_meta_idx
  on public.fin_aportes (user_id, meta_id, data desc);


-- ----------------------------------------------------------------------------
-- 3. Investimentos — a posição, não a corretora
-- ----------------------------------------------------------------------------
-- POSIÇÃO CONSOLIDADA, e não o histórico de cada compra e venda. A Novare não
-- vai virar home broker: o cliente precisa saber quanto tem, onde está, em que
-- classe e quanto rendeu. Guardar cada operação exigiria preço médio, custódia
-- e cotação ao vivo — três problemas grandes para responder uma pergunta que
-- `valor_aplicado` e `valor_atual` já respondem.
--
-- O PREÇO DISSO é que a atualização é manual, e dado desatualizado mente com
-- convicção. Por isso `data_atualizacao` é obrigatória: com ela a tela
-- consegue dizer "conferido há 4 meses" em vez de fingir que o número é de
-- hoje.
create table if not exists public.fin_investimentos (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users(id) on delete cascade,

  nome            text not null check (char_length(nome) between 1 and 80),
  instituicao     text not null check (char_length(instituicao) between 1 and 80),

  -- Imóvel NÃO entra aqui de propósito: ele é patrimônio, não reserva, e já
  -- vive no Planejamento (tabela `assets`). Misturar os dois estragaria as duas
  -- contas que esta tabela existe para fazer — quanto rende, e quantos meses de
  -- vida o dinheiro banca.
  classe          text not null
                  check (classe in ('renda_fixa', 'renda_variavel', 'fundo',
                                    'previdencia', 'cripto', 'outro')),

  -- Nulo = não indexado (ação, fundo de ações, cripto).
  indexador       text check (indexador in ('cdi', 'ipca', 'selic', 'prefixado')),

  -- UM campo só, lido conforme o indexador — é como o mercado fala, e inventar
  -- uma unidade própria obrigaria a tela a traduzir na entrada e na saída:
  --   cdi / selic → PERCENTUAL do índice  (110 = 110% do CDI)
  --   ipca        → SPREAD ao ano         (6 = IPCA + 6% a.a.)
  --   prefixado   → taxa ao ano           (11.5 = 11,5% a.a.)
  --   nulo        → não se aplica
  taxa            numeric(9,4),

  valor_aplicado  numeric(14,2) not null default 0 check (valor_aplicado >= 0),
  valor_atual     numeric(14,2) not null default 0 check (valor_atual >= 0),

  data_aplicacao  date not null,
  -- Quando alguém olhou o extrato pela última vez. Rendimento sem data não é
  -- rendimento, é um número solto: R$ 800 de lucro em 3 meses e em 3 anos são
  -- fatos opostos.
  data_atualizacao date not null default current_date,

  vencimento      date,

  -- Reserva de emergência que não pode ser sacada hoje não é reserva. Sem este
  -- campo o app somaria o CDB de 5 anos na conta do "quanto eu tenho para uma
  -- urgência" e entregaria uma tranquilidade falsa.
  liquidez        text not null default 'diaria'
                  check (liquidez in ('diaria', 'carencia', 'vencimento')),

  -- Quando preenchido, este investimento MORA nesta conta. O motor de
  -- patrimônio soma o investimento e ignora o saldo dessa conta — sem isso, uma
  -- conta do tipo `investimento` com R$ 50 mil e o CDB de R$ 50 mil cadastrado
  -- virariam R$ 100 mil de patrimônio que não existem.
  conta_id        uuid references public.fin_contas(id) on delete set null,

  -- Resgatado é arquivado, não apagado: apagar levaria junto a resposta para
  -- "quanto eu já tive investido" e furaria as metas que apontavam para cá.
  arquivado       boolean not null default false,
  observacao      text,
  criado_em       timestamptz not null default now()
);

comment on table public.fin_investimentos is
  'Posição consolidada por aplicação. Atualização manual: ver data_atualizacao.';

create index if not exists fin_investimentos_carteira_idx
  on public.fin_investimentos (user_id, arquivado, classe);


-- ----------------------------------------------------------------------------
-- 4. O vínculo meta → investimento
-- ----------------------------------------------------------------------------
-- Adicionado aqui, e não junto da coluna, porque `fin_metas` é criada antes de
-- `fin_investimentos` — a ordem do arquivo segue a narrativa do produto (a meta
-- é o começo da conversa), não a ordem de dependência do banco. É o mesmo
-- padrão do `fin_lancamentos_recorrencia_fk` em `fincash.sql`.
--
-- `set null`: resgatar o investimento não pode apagar a meta.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'fin_metas_investimento_fk'
  ) then
    alter table public.fin_metas
      add constraint fin_metas_investimento_fk
      foreign key (investimento_id) references public.fin_investimentos(id)
      on delete set null;
  end if;
end $$;


-- ----------------------------------------------------------------------------
-- 5. RLS — o dono escreve, a equipe lê
-- ----------------------------------------------------------------------------
-- Exatamente o mesmo padrão das cinco tabelas de `fincash.sql`, e pelo
-- mesmo motivo: a revisão trimestral é o diferencial da casa e depende de o
-- consultor conseguir LER. Ele não escreve — meta e aporte são do cliente, e
-- consultor que edita a meta do cliente é problema, não recurso.
--
-- ⚠️ Continua valendo a pendência aberta em `fincash.sql`: a política de
-- privacidade ainda não diz que a equipe Novare lê os dados financeiros do
-- assinante. Metas e patrimônio são MAIS sensíveis que o extrato, não menos.
do $$
declare
  t text;
begin
  foreach t in array array[
    'fin_metas', 'fin_aportes', 'fin_investimentos'
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
  foreach t in array array['fin_metas','fin_aportes','fin_investimentos']
  loop
    execute format('alter table public.%I alter column user_id set default auth.uid()', t);
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- Conferência — deve listar as 3 tabelas novas com 2 policies cada
-- ----------------------------------------------------------------------------
select tablename, count(*) as policies
  from pg_policies
 where schemaname = 'public'
   and tablename in ('fin_metas', 'fin_aportes', 'fin_investimentos')
 group by tablename
 order by tablename;


-- ####################################################################
-- ARQUIVO fincash_whatsapp.sql
-- ####################################################################

-- ============================================================================
-- FINCASH — Assistente de WhatsApp
-- ----------------------------------------------------------------------------
-- Rodar UMA vez no SQL Editor do Supabase (projeto hjikeevfzfswqydduars),
-- DEPOIS de `fincash.sql` e `fincash_orcamento.sql`.
-- É idempotente: pode rodar de novo sem estragar nada.
--
-- O QUE ESTE ARQUIVO RESOLVE
-- O webhook do WhatsApp chega SEM sessão de navegador: não há cookie, não há
-- `auth.uid()`, e o único dado de identidade é um número de telefone. Duas
-- coisas precisam existir no banco antes de qualquer mensagem virar lançamento:
--
--   1. Um VÍNCULO confiável telefone → usuário. Sem confirmação, quem souber o
--      número de alguém escreve na conta financeira dessa pessoa — e "apareceu
--      um gasto que não é meu" é pior do que não ter assistente nenhum.
--   2. Um LOG de mensagens com o id do provedor. Provedor de WhatsApp reenvia
--      webhook quando não recebe 200 rápido; processar duas vezes gera
--      lançamento duplicado, e duplicata num app de dinheiro é o defeito que faz
--      a pessoa desinstalar.
--
-- POR QUE A EQUIPE NÃO LÊ ESTAS TABELAS, ao contrário do resto do FINCASH
-- Nas outras tabelas `fin_` a equipe lê para escrever a revisão trimestral. Aqui
-- não: o log guarda o texto CRU do que a pessoa escreveu (que vai muito além de
-- valor e categoria) e a tabela de vínculo guarda o código de confirmação ainda
-- válido — quem lê o código sequestra o vínculo. A revisão não precisa de
-- nenhum dos dois: o lançamento gerado está em `fin_lancamentos`, onde a equipe
-- lê normalmente.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. O vínculo telefone ↔ usuário
-- ----------------------------------------------------------------------------
-- O FLUXO, e por que ele é neste sentido
-- O app gera um código de 6 dígitos e mostra na tela. A PESSOA manda esse código
-- pelo WhatsApp, do celular dela, para o número da Novare. O webhook casa o
-- código e carimba o telefone que o enviou.
--
-- O sentido inverso (a pessoa digita o número, nós mandamos o código) foi
-- descartado porque este aqui:
--   · prova as DUAS pontas de uma vez — quem manda tem a sessão logada (viu o
--     código) e tem o aparelho (mandou de lá);
--   · não depende da API de envio, que ainda não está plugada;
--   · elimina o erro de digitação do número, que no fluxo inverso mandaria o
--     código de vínculo para um desconhecido.
--
-- `telefone` é nulo enquanto o código não foi usado: a linha pendente nasce sem
-- saber de qual aparelho a pessoa vai mandar. É por isso que o código mora nesta
-- tabela e não numa tabela separada de códigos.
create table if not exists public.fin_whatsapp_contas (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null default auth.uid() references auth.users(id) on delete cascade,

  -- E.164 SEM o "+", como os provedores entregam: "5519981829686".
  -- Único no sistema inteiro: um número escreve em uma conta financeira só.
  telefone          text unique
                    check (telefone ~ '^[1-9][0-9]{7,14}$'),

  -- Seis dígitos são um milhão de combinações. O que impede o chute NÃO é o
  -- tamanho do código: é a validade de dez minutos, o limite de um código
  -- pendente por usuário e o teto de mensagens por telefone que o webhook
  -- aplica (ver `mensagensNaHora` em `whatsapp-servidor.ts`). Sozinho, nenhum
  -- dos três resolve.
  codigo            text check (codigo ~ '^[0-9]{6}$'),
  codigo_expira_em  timestamptz,

  confirmado_em     timestamptz,

  -- Desligar sem apagar: o histórico de mensagens continua fazendo sentido e a
  -- pessoa religa depois sem refazer o vínculo.
  ativo             boolean not null default true,

  -- PARA ONDE O LANÇAMENTO VAI quando a mensagem não diz.
  -- Sem isto, quem tem três contas receberia "de qual conta?" em toda mensagem e
  -- o assistente perderia justamente o que tem de melhor, que é ser rápido.
  -- Continua sendo escolha explícita da pessoa: o assistente nunca elege uma
  -- conta sozinho.
  conta_padrao_id   uuid references public.fin_contas(id)  on delete set null,
  cartao_padrao_id  uuid references public.fin_cartoes(id) on delete set null,

  ultima_em         timestamptz,
  criado_em         timestamptz not null default now(),

  -- Vínculo confirmado sem telefone é estado impossível; o banco recusa.
  constraint fin_whatsapp_confirmado_tem_telefone check (
    confirmado_em is null or telefone is not null
  ),
  -- Mesma regra do lançamento: ou conta, ou cartão. Nunca os dois.
  constraint fin_whatsapp_padrao_unico check (
    conta_padrao_id is null or cartao_padrao_id is null
  )
);

comment on table public.fin_whatsapp_contas is
  'Vínculo entre um número de WhatsApp e um usuário do FINCASH.';

-- Um código pendente por usuário. Pedir um novo invalida o anterior — sem isto,
-- cada clique em "gerar código" deixaria mais um código vivo por aí.
create unique index if not exists fin_whatsapp_pendente_idx
  on public.fin_whatsapp_contas (user_id)
  where confirmado_em is null;

-- E um telefone confirmado por usuário. Não é limitação técnica, é a escolha de
-- ter um estado só na tela ("o seu WhatsApp é este"): com dois números ligados,
-- toda pergunta do app vira "qual deles?" e a resposta do assistente teria de
-- dizer de qual aparelho está falando. Trocar de celular continua fácil — gerar
-- código novo e mandar do aparelho novo SUBSTITUI o vínculo (ver
-- `tentarVincular`).
create unique index if not exists fin_whatsapp_confirmado_idx
  on public.fin_whatsapp_contas (user_id)
  where confirmado_em is not null;


-- ----------------------------------------------------------------------------
-- 2. O log de mensagens — a peça que impede o lançamento duplicado
-- ----------------------------------------------------------------------------
-- Não é auditoria por preciosismo. O webhook INSERE a mensagem ANTES de
-- interpretar; se o índice único recusar, é reenvio do provedor e a mensagem é
-- descartada em silêncio. A inserção é a reserva do direito de processar —
-- fazer o contrário (interpretar e depois registrar) deixa aberta a janela em
-- que dois reenvios simultâneos gravam o mesmo gasto duas vezes.
create table if not exists public.fin_whatsapp_mensagens (
  id               uuid primary key default gen_random_uuid(),

  -- Nulo quando o número não está vinculado a ninguém: a mensagem do
  -- desconhecido também precisa ser registrada, senão não há como limitar a
  -- resposta e o número da Novare vira megafone de graça.
  user_id          uuid references auth.users(id) on delete cascade,
  telefone         text not null,

  direcao          text not null check (direcao in ('entrada', 'saida')),
  provedor         text not null default 'meta',

  -- O id da mensagem no provedor ("wamid.HBg..."). Nulo nas mensagens que nós
  -- geramos enquanto a API de envio não estiver plugada.
  provedor_msg_id  text,

  tipo             text not null default 'texto'
                   check (tipo in ('texto','audio','imagem','documento','video','outro')),
  texto            text,

  -- O que o interpretador entendeu, do jeito que entendeu. É o que vai permitir
  -- descobrir POR QUE o assistente errou seis meses depois, sem ter de
  -- reproduzir a mensagem.
  interpretacao    jsonb,

  -- O lançamento que esta mensagem gerou, quando gerou. É por ele que o
  -- "desfazer" acha o que apagar.
  lancamento_id    uuid references public.fin_lancamentos(id) on delete set null,

  erro             text,
  criado_em        timestamptz not null default now()
);

comment on table public.fin_whatsapp_mensagens is
  'Entradas e saídas do assistente. O índice único por id do provedor é o que impede lançamento duplicado em reenvio de webhook.';

-- A GUARDA CONTRA DUPLICATA. Parcial porque a saída ainda não tem id de
-- provedor, e vários nulos não podem colidir entre si.
create unique index if not exists fin_whatsapp_msg_provedor_idx
  on public.fin_whatsapp_mensagens (provedor, provedor_msg_id)
  where provedor_msg_id is not null;

-- As duas consultas quentes: "esta pessoa acabou de falar comigo?" (limite de
-- resposta a desconhecido) e "qual foi o último lançamento dela?" (desfazer).
create index if not exists fin_whatsapp_msg_telefone_idx
  on public.fin_whatsapp_mensagens (telefone, criado_em desc);

create index if not exists fin_whatsapp_msg_lancamento_idx
  on public.fin_whatsapp_mensagens (user_id, criado_em desc)
  where lancamento_id is not null;


-- ----------------------------------------------------------------------------
-- 3. RLS — só o dono, e no log só leitura
-- ----------------------------------------------------------------------------
-- Mesmo padrão de `fincash.sql` ("fincash: dono manda"), com as duas diferenças
-- explicadas no cabeçalho: não há policy de equipe, e no log o dono só LÊ.
-- Quem escreve no log é o webhook, com a chave de serviço (que passa por cima do
-- RLS) — dar INSERT ao usuário logado deixaria forjar "o assistente me disse".
alter table public.fin_whatsapp_contas    enable row level security;
alter table public.fin_whatsapp_mensagens enable row level security;

drop policy if exists "fincash: dono manda" on public.fin_whatsapp_contas;
create policy "fincash: dono manda"
  on public.fin_whatsapp_contas for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "fincash: dono le" on public.fin_whatsapp_mensagens;
create policy "fincash: dono le"
  on public.fin_whatsapp_mensagens for select
  using (auth.uid() = user_id);


-- ----------------------------------------------------------------------------
-- 4. Gerar o código de vínculo
-- ----------------------------------------------------------------------------
-- No banco, e não no navegador, por dois motivos: o código nasce junto com a
-- linha (não existe janela em que a tela mostra um código que o banco não
-- conhece) e a tela não precisa de permissão de escrita para criar o pendente.
--
-- Pedir um código novo APAGA o pendente anterior. Código acumulado é superfície
-- de ataque que ninguém está olhando.
--
-- Dez minutos é curto de propósito: é o tempo de trocar de app e mandar uma
-- mensagem. Código de vínculo que vale um dia é código que vaza no print.
create or replace function public.fin_whatsapp_gerar_codigo()
returns table (codigo text, expira_em timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_codigo text;
  v_expira timestamptz;
begin
  if auth.uid() is null then
    raise exception 'sem sessão';
  end if;

  delete from public.fin_whatsapp_contas
   where user_id = auth.uid() and confirmado_em is null;

  v_codigo := lpad((floor(random() * 1000000))::int::text, 6, '0');
  v_expira := now() + interval '10 minutes';

  insert into public.fin_whatsapp_contas (user_id, codigo, codigo_expira_em)
  values (auth.uid(), v_codigo, v_expira);

  return query select v_codigo, v_expira;
end $$;

revoke all on function public.fin_whatsapp_gerar_codigo() from public, anon;
grant execute on function public.fin_whatsapp_gerar_codigo() to authenticated;


-- ----------------------------------------------------------------------------
-- 5. Faxina dos pendentes vencidos
-- ----------------------------------------------------------------------------
-- Chamada pelo webhook uma vez a cada ~50 lotes (ver `faxinaEventual`). Existe
-- porque código vencido que continua na tabela é lixo com valor para atacante:
-- basta um dia alguém errar a comparação de data para ele voltar a valer.
create or replace function public.fin_whatsapp_limpar_pendentes()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  n int;
begin
  delete from public.fin_whatsapp_contas
   where confirmado_em is null
     and codigo_expira_em < now() - interval '1 hour';
  get diagnostics n = row_count;
  return n;
end $$;

-- Só a chave de serviço chama. Nenhum papel do app tem motivo para varrer a
-- tabela de vínculo dos outros.
revoke all on function public.fin_whatsapp_limpar_pendentes() from public, anon, authenticated;



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
  foreach t in array array['fin_whatsapp_contas']
  loop
    execute format('alter table public.%I alter column user_id set default auth.uid()', t);
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- Conferência — deve listar as 2 tabelas, com 1 policy cada
-- ----------------------------------------------------------------------------
select tablename, count(*) as policies
  from pg_policies
 where schemaname = 'public' and tablename like 'org\_whatsapp\_%'
 group by tablename
 order by tablename;
