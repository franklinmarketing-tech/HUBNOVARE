-- ═══════════════════════════════════════════════════════════════════════
-- NOVARECASH — O ASSISTENTE DE WHATSAPP GRAVA NO NOVARECASH (03/11/2026)
--
-- ORDEM DE RODAR (SQL Editor do Supabase, projeto hjikeevfzfswqydduars):
--   1. `fincash_whatsapp.sql`   — já rodado: cria as tabelas do CANAL
--                                 (`fin_whatsapp_contas`, `fin_whatsapp_mensagens`)
--   2. `novarecash.sql`, `novarecash_app.sql`
--   3. `novarecash_dados.sql`   — cria `ncash_contas` e `ncash_transacoes`
--   4. ESTE ARQUIVO             — depende das tabelas do passo 3
-- Seguro rodar de novo: só `add column if not exists` / `create index if not exists`.
--
-- POR QUE EXISTE
-- O assistente nasceu no FINCASH e as duas colunas que ligam o canal aos dados
-- são CHAVE ESTRANGEIRA para tabelas do FINCASH:
--   · `fin_whatsapp_contas.conta_padrao_id`  → `fin_contas`
--   · `fin_whatsapp_contas.cartao_padrao_id` → `fin_cartoes`
--   · `fin_whatsapp_mensagens.lancamento_id` → `fin_lancamentos`
-- Um id de `ncash_*` gravado nelas seria recusado pelo banco. Em vez de soltar
-- a FK (e perder a garantia do FINCASH), entram colunas NOVAS, com FK para o
-- NovareCash. As antigas ficam como história e o webhook não as lê mais.
--
-- O QUE NÃO MUDA
-- As tabelas `fin_whatsapp_*` continuam com esse nome: são infraestrutura do
-- canal (vínculo telefone → usuário, log, idempotência, tetos), não dado
-- financeiro do FINCASH. Nenhuma tabela é renomeada aqui.
--
-- SEM ESTE ARQUIVO o webhook continua de pé (o vínculo tem fallback), mas sem
-- origem padrão, sem "desfazer" e sem confirmar foto com "sim".
-- ═══════════════════════════════════════════════════════════════════════

-- 1. A origem padrão do lançamento, agora no NovareCash.
-- Conta OU cartão: no NovareCash os dois moram em `ncash_contas` (coluna
-- `tipo`), então basta uma coluna. A RLS do vínculo ("dono manda") garante que
-- a LINHA é da pessoa, não que a conta apontada é dela — quem confere isso é o
-- código (`interpretarNoNovareCash` no webhook e o PATCH de
-- `/api/whatsapp/vincular`), lendo `ncash_contas` filtrado pelo dono.
alter table public.fin_whatsapp_contas
  add column if not exists ncash_conta_padrao_id uuid
  references public.ncash_contas (id) on delete set null;

-- 2. A transação do NovareCash que uma mensagem gerou. É por ela que o
-- "desfazer" acha o que apagar, e é ela que fecha a proposta de uma foto.
alter table public.fin_whatsapp_mensagens
  add column if not exists ncash_transacao_id uuid
  references public.ncash_transacoes (id) on delete set null;

-- A consulta quente do "desfazer": a última mensagem desta pessoa que gerou
-- transação. Mesmo desenho do `fin_whatsapp_msg_lancamento_idx`.
create index if not exists fin_whatsapp_msg_ncash_idx
  on public.fin_whatsapp_mensagens (user_id, criado_em desc)
  where ncash_transacao_id is not null;

-- Conferência — as duas devem voltar `true`.
select
  exists (select 1 from information_schema.columns
           where table_schema = 'public' and table_name = 'fin_whatsapp_contas'
             and column_name = 'ncash_conta_padrao_id') as vinculo_tem_padrao_ncash,
  exists (select 1 from information_schema.columns
           where table_schema = 'public' and table_name = 'fin_whatsapp_mensagens'
             and column_name = 'ncash_transacao_id')    as log_tem_transacao_ncash;
