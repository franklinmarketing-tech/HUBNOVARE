-- ============================================================================
-- FINCASH — lixeira (soft delete) em lançamentos
-- ----------------------------------------------------------------------------
-- ADITIVO. Rodar UMA vez no SQL Editor do Supabase, DEPOIS de `fincash.sql`.
-- É idempotente. Não apaga nada e não muda o significado de nenhuma coluna que
-- já está em produção.
--
-- O PROBLEMA
-- `apagarLancamento` era um `delete`. Um toque errado na lista do mês e o
-- lançamento sumia para sempre — sem desfazer, sem histórico, sem nada. Num app
-- de dinheiro isso não é "o usuário que se cuide": é a pessoa perdendo o
-- registro de uma compra parcelada em 12 e não tendo como descobrir o que
-- faltou quando a conta do mês não fechar.
--
-- POR QUE UMA COLUNA E NÃO UMA TABELA `fin_lixeira`
-- Mover a linha para outra tabela obrigaria a copiar TODAS as colunas — e cada
-- coluna nova de `fin_lancamentos` a partir de amanhã teria de ser lembrada nos
-- dois lugares. A que fosse esquecida voltaria vazia na restauração. Uma coluna
-- de data mantém a linha exatamente onde está, com o mesmo `id`: quem apontava
-- para ela (as outras parcelas, `fin_import_itens`, `fin_aportes.lancamento_id`)
-- continua apontando, e restaurar é escrever `null`.
--
-- ⚠️ O CUSTO DESSA ESCOLHA, e ele é o ponto crítico deste arquivo: a linha
-- continua na tabela, então TODA leitura que não filtrar passa a contar dinheiro
-- que a pessoa apagou. Uma consulta esquecida e o saldo do painel diverge do
-- saldo da projeção. A defesa está na seção 3 — uma policy RESTRITIVA — e não na
-- disciplina de lembrar do filtro em cada `select` novo.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. A coluna
-- ----------------------------------------------------------------------------
-- `timestamptz` e não um booleano `apagado`: sem a hora não existe expurgo
-- ("o que está na lixeira há mais de 30 dias") nem a tela consegue dizer há
-- quanto tempo aquilo está lá — e "apagado" sem data é um estado de que ninguém
-- sai.
alter table public.fin_lancamentos
  add column if not exists apagado_em timestamptz;

comment on column public.fin_lancamentos.apagado_em is
  'Lixeira: quando a pessoa apagou. Nulo = vivo. Toda leitura DEVE filtrar.';


-- ----------------------------------------------------------------------------
-- 2. Índices
-- ----------------------------------------------------------------------------
-- O índice do dia a dia é PARCIAL (`where apagado_em is null`). Ele serve a
-- consulta que roda em toda abertura do app — o mês de um usuário —, é menor
-- que o total, cabe melhor em memória e não é tocado quando alguém apaga algo.
-- Na prática ele substitui o `fin_lancamentos_periodo_idx`, que fica onde está:
-- derrubar índice em produção para trocar por outro é ganho que não paga o risco.
create index if not exists fin_lancamentos_vivos_idx
  on public.fin_lancamentos (user_id, data desc)
  where apagado_em is null;

-- A consulta da própria lixeira, e a do expurgo. Também parcial, por um motivo
-- ainda melhor: a lixeira é uma fração minúscula da tabela, então este índice
-- nasce com algumas dezenas de linhas e assim continua.
create index if not exists fin_lancamentos_lixeira_idx
  on public.fin_lancamentos (user_id, apagado_em desc)
  where apagado_em is not null;


-- ----------------------------------------------------------------------------
-- 3. A rede: policy RESTRITIVA de leitura
-- ----------------------------------------------------------------------------
-- Esta é a peça que decide se a lixeira funciona ou se ela vira fonte de saldo
-- errado. O app tem leituras de `fin_lancamentos` espalhadas por meia dúzia de
-- arquivos (fatura do cartão, projeção, importação, painel, demo), e confiar em
-- que todas elas — inclusive as que forem escritas no ano que vem — lembrem do
-- `.is("apagado_em", null)` é confiar na memória de quem estiver com pressa. A
-- policy inverte o padrão: apagado é INVISÍVEL por baixo, e quem quiser ver
-- precisa pedir explicitamente (seção 4).
--
-- `as restrictive` E NÃO PERMISSIVA: policies permissivas se somam com OR, então
-- uma nova não restringe coisa nenhuma. As restritivas se somam com AND — é o
-- único tipo capaz de TIRAR linhas que outra policy já liberou.
--
-- Vale também para a equipe: consultor lendo lançamento que o cliente apagou
-- tiraria conclusões, na revisão trimestral, sobre dinheiro que não existe.
--
-- ⚠️ NÃO VALE PARA A `service_role` (o robô do WhatsApp), que por desenho passa
-- por cima de RLS. As leituras de lá precisam do filtro escrito à mão.
drop policy if exists "fincash: lixeira invisivel" on public.fin_lancamentos;
create policy "fincash: lixeira invisivel" on public.fin_lancamentos
  as restrictive
  for select
  using (apagado_em is null);


-- ----------------------------------------------------------------------------
-- 4. A porta dos fundos: as funções da lixeira
-- ----------------------------------------------------------------------------
-- Com a policy acima, a própria tela da lixeira não conseguiria listar nada — e
-- restaurar também não, porque no PostgreSQL um `update ... where id = ?`
-- aplica as policies de SELECT sobre a linha existente. Então as operações da
-- lixeira passam por funções `security definer`, que é o lugar certo para uma
-- exceção: ela fica em UM ponto auditável, com o filtro por `auth.uid()` escrito
-- dentro, em vez de virar um furo permanente na policy.
--
-- Todas checam `auth.uid()` na primeira linha. `security definer` sem esse
-- filtro é escalação de privilégio, não conveniência.

create or replace function public.fin_lixeira()
returns setof public.fin_lancamentos
language sql
security definer
set search_path = public
stable
as $$
  select * from public.fin_lancamentos
   where user_id = auth.uid()
     and apagado_em is not null
   order by apagado_em desc
$$;

create or replace function public.fin_lixeira_restaurar(p_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.fin_lancamentos
     set apagado_em = null
   where id = p_id and user_id = auth.uid() and apagado_em is not null
$$;

-- Apagar DE VEZ. Só o que já está na lixeira: o `apagado_em is not null` no
-- where impede que um bug de tela transforme um clique comum em delete
-- definitivo — para sumir de vez, a linha precisa ter passado pela lixeira antes.
create or replace function public.fin_lixeira_apagar(p_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.fin_lancamentos
   where id = p_id and user_id = auth.uid() and apagado_em is not null
$$;

-- Esvaziar: o botão explícito, para quem quer mesmo.
create or replace function public.fin_lixeira_esvaziar()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare n integer;
begin
  delete from public.fin_lancamentos
   where user_id = auth.uid() and apagado_em is not null;
  get diagnostics n = row_count;
  return n;
end $$;

-- EXPURGO AUTOMÁTICO — 30 DIAS.
--
-- POR QUE 30 E NÃO 7 NEM 365
-- O ciclo deste app é o MÊS: a pessoa percebe que apagou algo por engano quando
-- fecha a conta do mês e o saldo não bate. Sete dias fecham a janela antes desse
-- momento — que é exatamente quando a lixeira teria servido para alguma coisa.
-- Um ano, no outro extremo, transforma a lixeira em arquivo morto: a tabela mais
-- quente do app carrega para sempre linhas que ninguém vai restaurar, e "apagar"
-- deixa de significar apagar. Trinta dias cobrem um fechamento inteiro e ainda
-- assim são um prazo que se explica em uma frase na tela.
--
-- NÃO RODA SOZINHO. Não há cron aqui de propósito: agendamento (pg_cron) é
-- configuração de projeto, e ligá-lo escondido dentro de um arquivo de schema é
-- como se descobre, meses depois, que existe algo apagando dados de produção às
-- 3h da manhã. Quem chama é o app, ao abrir a tela de Dados — barato, previsível
-- e visível para o dono dos dados.
create or replace function public.fin_lixeira_expurgar(p_dias integer default 30)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare n integer;
begin
  -- Piso de 7 dias: `p_dias` vem do cliente, e um `0` (ou negativo) ali dentro
  -- esvaziaria a lixeira inteira com cara de rotina de manutenção.
  if p_dias is null or p_dias < 7 then p_dias := 7; end if;

  delete from public.fin_lancamentos
   where user_id = auth.uid()
     and apagado_em is not null
     and apagado_em < now() - (p_dias || ' days')::interval;
  get diagnostics n = row_count;
  return n;
end $$;

do $$
declare f text;
begin
  foreach f in array array[
    'public.fin_lixeira()',
    'public.fin_lixeira_restaurar(uuid)',
    'public.fin_lixeira_apagar(uuid)',
    'public.fin_lixeira_esvaziar()',
    'public.fin_lixeira_expurgar(integer)'
  ] loop
    execute format('revoke all on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;


-- ----------------------------------------------------------------------------
-- 5. A view do saldo — recriada COM o filtro
-- ----------------------------------------------------------------------------
-- Sem esta seção o arquivo inteiro seria inútil na tela que mais importa: a view
-- soma `fin_lancamentos`, e o saldo continuaria contando o que a pessoa apagou.
-- A policy da seção 3 até ajudaria (a view é `security_invoker`), mas depender
-- só dela deixaria o saldo errado no dia em que alguém consultar a view como
-- `postgres`, num relatório interno.
--
-- ⚠️ `security_invoker = on` VOLTA JUNTO, e não é detalhe de estilo. Em
-- 10/09/2026 esta view estava sem a opção, a RLS não se aplicava a ela e uma
-- conta recém-criada leu o saldo de onze estranhos. `create or replace view`
-- preserva as opções da view que já existe, mas um `drop`/`create` num refactor
-- futuro não preservaria — então a linha fica escrita, explícita, logo abaixo.
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
  -- O filtro entra no ON, e não num WHERE: num `left join`, `where l.apagado_em
  -- is null` descartaria a CONTA inteira que só tem lançamentos apagados, e o
  -- saldo inicial dela sumiria do app.
  left join public.fin_lancamentos l
    on l.conta_id = c.id and l.apagado_em is null
  where not c.arquivada
  group by c.id, c.user_id, c.nome, c.saldo_inicial;

alter view public.fin_saldos set (security_invoker = on);


-- ----------------------------------------------------------------------------
-- 6. O que NÃO se toca: `fin_import_itens`
-- ----------------------------------------------------------------------------
-- Nada a fazer aqui, e isso é uma decisão, não um esquecimento.
--
-- A dedup do OFX guarda a chave (FITID) numa tabela própria justamente para
-- sobreviver ao apagar do lançamento — está escrito em `fincash_importacao.sql`,
-- item 2 da lista de razões. Com soft delete a linha nem sequer sai da tabela,
-- então `lancamento_id` continua apontando para ela e a chave continua
-- reservada: reimportar o mesmo extrato NÃO ressuscita o que a pessoa jogou fora.
--
-- E no expurgo, o `on delete set null` da FK zera apenas o `lancamento_id`,
-- deixando a `chave` de pé. É o comportamento certo: passados 30 dias o
-- lançamento some e a chave continua barrando a reimportação. Um `on delete
-- cascade` ali faria o app ressuscitar, na importação seguinte, exatamente
-- aquilo que a pessoa apagou e o expurgo confirmou.


-- ----------------------------------------------------------------------------
-- Conferência
-- ----------------------------------------------------------------------------
-- Deve listar: coluna 1, indices 2, policy restritiva 1, funcoes 5.
select 'coluna' as o_que, count(*) from information_schema.columns
 where table_schema = 'public' and table_name = 'fin_lancamentos'
   and column_name = 'apagado_em'
union all
select 'indices', count(*) from pg_indexes
 where schemaname = 'public'
   and indexname in ('fin_lancamentos_vivos_idx', 'fin_lancamentos_lixeira_idx')
union all
select 'policy restritiva', count(*) from pg_policies
 where schemaname = 'public' and tablename = 'fin_lancamentos'
   and policyname = 'fincash: lixeira invisivel'
union all
select 'funcoes', count(*) from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and p.proname like 'fin\_lixeira%';
