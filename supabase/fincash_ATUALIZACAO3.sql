-- ============================================================================
-- FINCASH — ATUALIZAÇÃO 3 (módulo de Dívidas + lixeira e exportação)
-- ============================================================================
-- Cole inteiro no SQL Editor do Supabase e execute de uma vez só.
--
-- ⚠️ RODE DEPOIS de `fincash_TUDO.sql`, `fincash_ATUALIZACAO2.sql` e
-- `fincash_CORRECAO_URGENTE.sql`, que já foram executados.
--
-- Os dois arquivos aqui são INDEPENDENTES entre si: nenhum depende do outro,
-- e a ordem só importa para a leitura. Ambos são aditivos e não apagam dado.
--
--   1. fincash_dividas.sql   o módulo de Dívidas: credor, saldo devedor, taxa
--                            de juros, parcelas, e o registro de cada pagamento
--   2. fincash_lixeira.sql   soft delete em lançamentos (30 dias para
--                            arrepender), e a `fin_saldos` recriada já
--                            ignorando o que foi apagado
--
-- O QUE MUDA EM TABELA QUE JÁ TEM DADO
--   • `fin_lancamentos` ganha `apagado_em` (nulo = vivo, que é o estado de
--     todo lançamento que já existe hoje: nada muda de comportamento sozinho)
--   • `fin_saldos` é RECRIADA com o filtro do apagado — e continua com
--     `security_invoker = on`, a opção que corrigiu o vazamento entre
--     usuários. Ela está no arquivo; não a remova ao editar
--
-- ⚠️ ATENÇÃO À POLICY RESTRITIVA
-- A lixeira cria uma policy `as restrictive` de SELECT em `fin_lancamentos`.
-- Restritiva, e não permissiva, porque permissiva soma com OR e nunca tira
-- linha. É ela que torna o lançamento apagado invisível para toda leitura do
-- app de uma vez, inclusive as que estão em arquivos que ninguém lembrou de
-- filtrar. As funções da lixeira são `security definer` justamente porque essa
-- policy cega até a tela que precisa listar o que foi apagado.
--
-- É seguro rodar mais de uma vez: tudo é `if not exists` / `create or replace`.
-- ============================================================================



-- ####################################################################
-- ARQUIVO fincash_dividas.sql
-- ####################################################################

-- ============================================================================
-- FINCASH — Dívidas: a ponte entre "estou afogado" e "consigo investir"
-- ----------------------------------------------------------------------------
-- Rodar UMA vez no SQL Editor do Supabase, DEPOIS de `fincash.sql`. É
-- idempotente e ADITIVO: não altera uma coluna sequer do que já existe, então
-- rodar num banco com cliente lançando todo dia não estraga nada.
--
-- POR QUE DÍVIDA MERECE TABELA PRÓPRIA, e não uma categoria de despesa
-- O concorrente líder trata dívida como um indicador do painel — "grau de
-- comprometimento", um número e nada a fazer com ele. Isso funciona para quem
-- já está no azul. Para quem não está, é o mesmo que um termômetro sem
-- remédio: a pessoa vê 68% todo mês e não tem nem uma tela que responda a
-- única pergunta que importa, que é QUANDO ISSO ACABA.
--
-- Responder isso exige três coisas que uma despesa recorrente não guarda:
--   1. o SALDO DEVEDOR (a despesa guarda o quanto sai por mês, não o quanto
--      ainda se deve — e sem saldo não há amortização nem data de saída);
--   2. a TAXA DE JUROS (é ela que separa o consignado de 1,7% a.m. do rotativo
--      de 14% a.m., e é essa diferença que decide qual dívida atacar primeiro);
--   3. o SISTEMA (Price ou SAC), porque a mesma dívida amortiza diferente nos
--      dois, e chutar o errado erra o saldo de todos os meses seguintes.
--
-- A FRONTEIRA COM O CARTÃO PARCELADO — a decisão mais delicada deste arquivo
-- Compra parcelada no cartão JÁ É uma dívida, e ela já existe no FINCASH: o
-- `salvarLancamento` explode as parcelas em `fin_lancamentos`, e elas já pesam
-- na fatura e no fluxo de caixa. Se a pessoa cadastrar a mesma geladeira aqui
-- também, o comprometimento da renda passa a contá-la DUAS VEZES e o app
-- mente para cima — o que, num app que existe para tirar gente de dívida, é o
-- pior erro possível: assusta quem já está assustado.
--
-- A regra, então, é uma linha só e vale para o app inteiro:
--   ► O QUE JÁ ESTÁ EM `fin_lancamentos` NÃO SE CADASTRA AQUI.
--
-- Só que existe o caso do meio, e ele é comum: a pessoa lança a fatura inteira
-- do cartão como uma despesa mensal e quer ver o parcelamento de 18x da
-- reforma como dívida, com saldo e data de saída. Para isso existe
-- `ja_no_fluxo`: a dívida entra na foto (total devido, ordem de pagamento,
-- data de saída) mas o motor devolve a parcela dela em separado, para quem
-- for projetar caixa não subtrair o mesmo dinheiro duas vezes. A flag é do
-- usuário, não adivinhada: o banco não tem como saber se a fatura que ele
-- lança já embute aquela parcela.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Dívidas — o saldo, o juro e o prazo
-- ----------------------------------------------------------------------------
create table if not exists public.fin_dividas (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users(id) on delete cascade,

  credor          text not null check (char_length(credor) between 1 and 80),

  -- O TIPO NÃO É DECORAÇÃO: ele é o que permite a tela dizer "cheque especial
  -- a 8% ao mês é a dívida mais cara que existe no Brasil" sem que a pessoa
  -- precise entender de taxa. Lista fechada porque é sobre isso que o motor
  -- e os textos falam — tipo livre viraria "cartão", "Cartão", "cc" e nenhum
  -- conselho conseguiria se ancorar neles.
  tipo            text not null default 'emprestimo_pessoal'
                  check (tipo in ('cartao_rotativo', 'cheque_especial',
                                  'emprestimo_pessoal', 'consignado',
                                  'financiamento', 'parcelamento', 'outro')),

  -- O que a dívida era no dia em que nasceu. Serve para UMA coisa: a barra de
  -- quitação ("você já pagou 40% do que devia"). Não entra em conta nenhuma —
  -- quem manda em juro e prazo é o saldo de hoje.
  valor_original  numeric(14,2) not null check (valor_original > 0),

  -- ⚠️ O CAMPO MAIS IMPORTANTE DA TABELA. Tudo — amortização, data de saída,
  -- ordem de pagamento, economia do aporte extra — sai daqui. É atualizado
  -- pelo app a cada pagamento registrado, e por isso NÃO é calculado a partir
  -- de `fin_divida_pagamentos`: o saldo real vem do extrato do credor, e ele
  -- diverge do nosso somatório sempre que houver tarifa, IOF, seguro
  -- prestamista ou um mês de atraso. A verdade é o boleto, não a nossa soma.
  saldo_atual     numeric(14,2) not null check (saldo_atual >= 0),

  -- TAXA MENSAL, EM PERCENTUAL (2.5 = 2,5% ao mês), e não anual.
  --
  -- POR QUE MENSAL: é a unidade do contrato brasileiro. O consignado diz
  -- "1,66% a.m.", a fatura do cartão diz "13,9% a.m.", o CET do financiamento
  -- vem nas duas. Guardar em anual obrigaria a converter na entrada e na
  -- saída, e conversão de juro composto feita duas vezes é onde entra o erro
  -- de arredondamento que ninguém vê.
  --
  -- POR QUE PERCENTUAL E NÃO FRAÇÃO: é o que a pessoa digita. Guardar 0.025 e
  -- exibir 2,5 é uma tradução a mais em cada ponta, e uma delas um dia
  -- esquece — e aí a tela mostra uma dívida a 250% ao mês.
  --
  -- ZERO É LEGÍTIMO: parcelamento sem juros do boleto do IPTU, empréstimo com
  -- a família. O motor trata o caso (dividir por zero na fórmula de Price é
  -- justamente onde as calculadoras da internet quebram).
  taxa_mensal     numeric(9,6) not null default 0 check (taxa_mensal >= 0 and taxa_mensal <= 100),

  -- Price = parcela fixa (a esmagadora maioria: consignado, pessoal, CDC).
  -- SAC   = amortização fixa, parcela caindo (financiamento imobiliário).
  -- A escolha muda o saldo de TODOS os meses, não só a estética da parcela.
  sistema         text not null default 'price' check (sistema in ('price', 'sac')),

  -- Quanto sai por mês. NÃO é derivado da fórmula de propósito: o valor do
  -- carnê é o que o credor cobra, com seguro e tarifa embutidos, e ele quase
  -- nunca bate no centavo com o Price puro. Cobrar do usuário o valor real e
  -- conferir contra a fórmula é honesto; calcular e afirmar que é aquilo, não.
  parcela         numeric(14,2) not null check (parcela > 0),

  -- NULO É O ROTATIVO. Cartão rotativo e cheque especial não têm prazo: existe
  -- um saldo, um juro e o quanto a pessoa consegue pagar por mês. É o caso em
  -- que a dívida pode CRESCER, e é o caso que o app precisa saber nomear.
  parcelas_total  int check (parcelas_total between 1 and 600),
  parcelas_pagas  int not null default 0 check (parcelas_pagas >= 0),

  dia_vencimento  int not null default 10 check (dia_vencimento between 1 and 31),

  -- Quando a dívida É de um cartão da casa. Só uma pista para a tela e para o
  -- alerta de contagem dupla — NUNCA a fonte do saldo, que é o do credor.
  cartao_id       uuid references public.fin_cartoes(id) on delete set null,

  -- ► A FLAG DA FRONTEIRA (leia o cabeçalho). Marcada = "a parcela desta
  -- dívida já sai no meu fluxo de caixa, dentro de um lançamento que eu já
  -- registrei". O motor continua contando a dívida no total devido e na ordem
  -- de pagamento (ela existe), mas devolve a parcela em separado para quem
  -- projetar caixa não descontar o mesmo dinheiro duas vezes.
  ja_no_fluxo     boolean not null default false,

  -- Quitada e renegociada são ARQUIVAMENTO, não exclusão: apagar levaria junto
  -- (cascade) o histórico de pagamentos, e com ele a prova de que a pessoa
  -- pagou R$ 18 mil de dívida em dois anos — que é exatamente a memória que
  -- sustenta o hábito quando ela pensa em desistir.
  -- `renegociada` existe separada de `quitada` porque a diferença importa: uma
  -- some porque acabou, a outra some porque virou outra dívida nesta mesma
  -- tabela, e somar as duas na comemoração seria mentira.
  status          text not null default 'ativa'
                  check (status in ('ativa', 'quitada', 'renegociada', 'cancelada')),

  cor             text not null default '#dc2626',
  observacao      text,
  criado_em       timestamptz not null default now()
);

comment on table public.fin_dividas is
  'Dívidas com saldo, juro e prazo. O que já está em fin_lancamentos NÃO entra aqui (ver ja_no_fluxo).';

comment on column public.fin_dividas.taxa_mensal is
  'Percentual AO MÊS (2.5 = 2,5% a.m.). Zero é válido: parcelamento sem juros.';

comment on column public.fin_dividas.ja_no_fluxo is
  'A parcela já sai como lançamento/fatura. Conta na dívida, não na projeção de caixa.';

-- A consulta da tela: as dívidas vivas do usuário. `status` no índice porque a
-- lista ativa é aberta cem vezes mais que o histórico.
create index if not exists fin_dividas_ativas_idx
  on public.fin_dividas (user_id, status);


-- ----------------------------------------------------------------------------
-- 2. Pagamentos — a prova de que está andando
-- ----------------------------------------------------------------------------
-- Sem esta tabela o app só sabe o saldo de hoje, e saldo sem histórico não
-- responde "estou melhorando?". Quem está endividado precisa dessa resposta
-- mais do que precisa da data de saída: a data está longe, o gráfico que desce
-- é de hoje.
--
-- POR QUE `juros` E `amortizacao` SÃO GRAVADOS, e não recalculados
-- O motor sabe calcular a divisão de qualquer parcela. Mas o que o motor
-- calcula é o que DEVERIA ter acontecido pela taxa cadastrada; o que a pessoa
-- copia do extrato é o que aconteceu, com o IOF e a tarifa que o contrato tem
-- e a nossa taxa não. Guardar o real permite a tela dizer, um dia, "a sua taxa
-- efetiva é 3,1% e não os 2,5% que você cadastrou" — que é uma descoberta que
-- vale o módulo inteiro. Nulo é permitido: quem não tem o extrato à mão
-- registra só o valor, e é melhor um pagamento sem detalhe do que nenhum.
create table if not exists public.fin_divida_pagamentos (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  divida_id     uuid not null references public.fin_dividas(id) on delete cascade,

  -- A REGRA DO SINAL da casa vale aqui: sempre positivo, o sentido vem de
  -- `tipo`. `extra` é a amortização avulsa (o 13º jogado na dívida), separada
  -- da `parcela` normal porque é justamente ela que o app quer celebrar e
  -- contar em separado — foi ela que antecipou a data de saída.
  tipo          text not null default 'parcela'
                check (tipo in ('parcela', 'extra')),
  valor         numeric(14,2) not null check (valor > 0),
  data          date not null,

  juros         numeric(14,2) check (juros >= 0),
  amortizacao   numeric(14,2) check (amortizacao >= 0),

  -- O saldo que sobrou DEPOIS deste pagamento, copiado do extrato do credor.
  -- É o que permite desenhar a curva real de saldo em vez da curva teórica —
  -- e a distância entre as duas é uma informação, não um defeito.
  saldo_apos    numeric(14,2) check (saldo_apos >= 0),

  -- Quando o pagamento também virou lançamento no fluxo de caixa. Mesmo
  -- cuidado do `lancamento_id` de `fin_aportes`, pelo mesmo motivo: sem ele,
  -- o dinheiro sairia duas vezes de qualquer projeção que somasse os dois.
  lancamento_id uuid references public.fin_lancamentos(id) on delete set null,

  observacao    text,
  criado_em     timestamptz not null default now()
);

comment on table public.fin_divida_pagamentos is
  'Cada pagamento feito. Valor sempre positivo; o sentido e a natureza vêm de tipo.';

-- NÃO existe coluna `mes_ref`: o pagamento aconteceu num DIA, e repetir o mês
-- numa coluna criaria duas fontes de verdade que uma hora divergem. O
-- agrupamento por mês sai deste índice — mesma decisão de `fin_aportes`.
create index if not exists fin_divida_pagamentos_idx
  on public.fin_divida_pagamentos (user_id, divida_id, data desc);


-- ----------------------------------------------------------------------------
-- 3. RLS — o dono escreve, a equipe lê
-- ----------------------------------------------------------------------------
-- O mesmo padrão das oito tabelas anteriores, e aqui ele importa mais do que
-- em qualquer outra: dívida é o dado mais constrangedor que o cliente entrega
-- à Novare. O consultor LÊ, porque a revisão trimestral é o diferencial da
-- casa e ela é inútil sem enxergar a dívida. Ele não escreve — quitar dívida
-- do cliente na mão do consultor não é recurso, é problema.
--
-- ⚠️ Continua valendo a pendência aberta em `fincash.sql`: a política de
-- privacidade ainda não diz que a equipe Novare lê os dados financeiros do
-- assinante. Se metas e patrimônio já eram sensíveis, dívida é o topo da
-- lista — esta tabela não deveria ir a produção antes daquele texto.
do $$
declare
  t text;
begin
  foreach t in array array['fin_dividas', 'fin_divida_pagamentos'] loop
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
-- O app grava SEM passar `user_id`: quem sabe quem está logado é o banco, pela
-- sessão do PostgREST. O `default auth.uid()` na coluna resolve o banco novo;
-- este bloco resolve o banco onde a tabela já existe, porque
-- `create table if not exists` não altera coluna de tabela existente.
do $$
declare t text;
begin
  foreach t in array array['fin_dividas', 'fin_divida_pagamentos']
  loop
    execute format('alter table public.%I alter column user_id set default auth.uid()', t);
  end loop;
end $$;


-- ----------------------------------------------------------------------------
-- Conferência — deve listar as 2 tabelas novas com 2 policies cada
-- ----------------------------------------------------------------------------
select tablename, count(*) as policies
  from pg_policies
 where schemaname = 'public'
   and tablename in ('fin_dividas', 'fin_divida_pagamentos')
 group by tablename
 order by tablename;


-- ####################################################################
-- ARQUIVO fincash_lixeira.sql
-- ####################################################################

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
