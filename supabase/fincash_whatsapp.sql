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
