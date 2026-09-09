-- ============================================================================
-- FINCASH — importação de extrato (OFX)
-- ----------------------------------------------------------------------------
-- ADITIVO. Rodar UMA vez no SQL Editor do Supabase, DEPOIS de `fincash.sql`.
-- É idempotente: pode rodar de novo sem estragar nada. Não altera nenhuma
-- tabela que já está em produção.
--
-- O PROBLEMA QUE ESTE ARQUIVO RESOLVE
-- Importar o mesmo extrato duas vezes não pode duplicar lançamento. E "duas
-- vezes" não é hipótese remota: é o que acontece quando a pessoa baixa o
-- extrato do mês no dia 20, importa, baixa de novo no dia 30 e importa outra
-- vez — os 20 primeiros dias vêm nos dois arquivos.
--
-- POR QUE A DEDUP MORA NO BANCO, e não numa lista em memória
-- Porque ela precisa valer ENTRE importações, feitas em dias e em aparelhos
-- diferentes. E por que é um ÍNDICE ÚNICO, e não um `select` antes de
-- inserir: o `select` tem uma janela entre a leitura e a escrita — duas abas,
-- um toque duplo no botão ou uma reconexão do Supabase caem nela e gravam as
-- duas. O índice é a única forma de o banco recusar a segunda, sempre.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Importações — o histórico
-- ----------------------------------------------------------------------------
-- Serve para duas perguntas que a pessoa faz: "eu já importei o extrato de
-- março?" e "de onde veio esse lançamento estranho?". Sem o histórico, o app
-- sabe deduplicar mas não sabe explicar — e importação que não se explica é a
-- que a pessoa desfaz na mão, linha por linha.
create table if not exists public.fin_importacoes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,

  -- Só o NOME do arquivo, nunca o conteúdo. O extrato bruto traz agência,
  -- conta e nome do titular; ele é lido no navegador e morre lá. O que sobe
  -- são as transações que a pessoa confirmou na prévia, e nada mais.
  arquivo     text not null check (char_length(arquivo) between 1 and 200),
  banco       text,

  -- Para onde foi. Um dos dois, como em `fin_lancamentos`.
  conta_id    uuid references public.fin_contas(id)  on delete set null,
  cartao_id   uuid references public.fin_cartoes(id) on delete set null,

  -- Período coberto pelo arquivo, quando ele declara.
  periodo_de  date,
  periodo_ate date,

  -- O placar. `lidas` é o que o arquivo tinha; `importadas` + `ignoradas` +
  -- as que a pessoa desmarcou na prévia fecham a conta.
  lidas       int not null default 0 check (lidas       >= 0),
  importadas  int not null default 0 check (importadas  >= 0),
  ignoradas   int not null default 0 check (ignoradas   >= 0),

  criado_em   timestamptz not null default now()
);

comment on table public.fin_importacoes is
  'Histórico de importações de extrato do FINCASH. Guarda o nome do arquivo, nunca o conteúdo.';

create index if not exists fin_importacoes_recentes_idx
  on public.fin_importacoes (user_id, criado_em desc);


-- ----------------------------------------------------------------------------
-- 2. Itens — a memória da dedup
-- ----------------------------------------------------------------------------
-- Uma linha por transação JÁ VISTA. A `chave` é o `FITID` do banco quando ele
-- existe (`fit:...`) e, quando não existe, o hash de data + valor + descrição
-- normalizada (`hash:...`) — ver `chaveDedup` em `src/lib/fincash/ofx.ts`.
--
-- POR QUE UMA TABELA SEPARADA, e não uma coluna em `fin_lancamentos`
-- Três razões, e a terceira é a que decide:
--   1. `fin_lancamentos` é a tabela mais quente do app; um índice único a mais
--      pesa em toda escrita, inclusive nas que nada têm a ver com importação.
--   2. A pessoa pode APAGAR um lançamento importado. Se a chave morresse com
--      ele, a próxima importação do mesmo arquivo o traria de volta — e um app
--      que ressuscita o que você apagou é pior que um que duplica.
--   3. A chave é do IMPORTADOR, não do lançamento. Misturar as duas coisas
--      obrigaria toda tela que grava lançamento a saber o que é FITID.
create table if not exists public.fin_import_itens (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  importacao_id uuid references public.fin_importacoes(id) on delete set null,

  chave         text not null check (char_length(chave) between 1 and 120),

  -- Nulo quando o lançamento foi apagado depois (`set null`), ou no instante
  -- entre reservar a chave e gravar a linha. Ver o comentário do fluxo em
  -- `src/lib/fincash/importar.ts`.
  lancamento_id uuid references public.fin_lancamentos(id) on delete set null,

  criado_em     timestamptz not null default now()
);

-- ⚠️ O CORAÇÃO DESTE ARQUIVO. É este índice — e não o código do app — que
-- garante que o mesmo lançamento não entra duas vezes. Por usuário, porque
-- dois clientes podem ter FITID iguais em bancos diferentes.
create unique index if not exists fin_import_itens_chave_uk
  on public.fin_import_itens (user_id, chave);

create index if not exists fin_import_itens_importacao_idx
  on public.fin_import_itens (user_id, importacao_id);


-- ----------------------------------------------------------------------------
-- 3. RLS — o dono escreve, a equipe lê
-- ----------------------------------------------------------------------------
-- O mesmo par de políticas das cinco tabelas de `fincash.sql`, pelo mesmo
-- motivo: a equipe LÊ para fazer a revisão trimestral e NÃO escreve, porque
-- consultor que edita o extrato do cliente é problema, não recurso.
do $$
declare
  t text;
begin
  foreach t in array array['fin_importacoes', 'fin_import_itens'] loop
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
-- Mesma razão de sempre (ver `fincash.sql`): o app grava sem passar `user_id`,
-- porque quem sabe quem está logado é a sessão do PostgREST. O `default` na
-- definição da coluna resolve o banco novo; este bloco resolve o banco onde a
-- tabela já existe, porque `create table if not exists` não altera coluna.
do $$
declare t text;
begin
  foreach t in array array['fin_importacoes','fin_import_itens']
  loop
    execute format('alter table public.%I alter column user_id set default auth.uid()', t);
  end loop;
end $$;


-- ----------------------------------------------------------------------------
-- Conferência — deve listar 2 tabelas com 2 policies cada
-- ----------------------------------------------------------------------------
select tablename, count(*) as policies
  from pg_policies
 where schemaname = 'public'
   and tablename in ('fin_importacoes', 'fin_import_itens')
 group by tablename
 order by tablename;
