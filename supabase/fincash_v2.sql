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
