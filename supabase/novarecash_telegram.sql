-- ═════════════════════════════════════════════════════════════════════════
-- NOVARECASH: O ASSISTENTE NO TELEGRAM (15/11/2026)
--
-- Pode rodar mais de uma vez. O assistente é o mesmo do WhatsApp; esta tabela
-- só liga o CHAT do Telegram ao usuário (o WhatsApp usa telefone e tem regra
-- de formato de número, por isso tabela própria).
--
-- SEGURANÇA: a pessoa só LÊ a própria linha. Quem escreve é o servidor (chave
-- de serviço): o código do link pela rota `/api/telegram/vincular` (com a
-- sessão conferida) e o `chat_id` pelo webhook, com o chat que realmente abriu
-- o link. Se a pessoa pudesse gravar `chat_id`, apontaria o chat de outra
-- pessoa para a própria conta.
--
-- Um chat escreve num NovareCash só (`chat_id` único); uma linha por usuário.
-- O log das mensagens continua em `fin_whatsapp_mensagens` (telefone = "tg:<chat>",
-- provedor = 'telegram').
-- ═════════════════════════════════════════════════════════════════════════

create table if not exists public.ncash_telegram (
  user_id                uuid primary key references auth.users (id) on delete cascade,
  chat_id                text unique check (chat_id is null or chat_id ~ '^-?[0-9]{1,20}$'),
  nome_telegram          text check (nome_telegram is null or char_length(nome_telegram) <= 60),
  codigo                 text unique check (codigo is null or codigo ~ '^[A-Za-z0-9_-]{8,64}$'),
  codigo_expira_em       timestamptz,
  confirmado_em          timestamptz,
  lembretes              boolean not null default true,
  ncash_conta_padrao_id  uuid references public.ncash_contas (id) on delete set null,
  criado_em              timestamptz not null default now(),
  -- Ligado sem chat é estado impossível; o banco recusa.
  constraint ncash_telegram_confirmado_tem_chat check (confirmado_em is null or chat_id is not null)
);

alter table public.ncash_telegram enable row level security;

drop policy if exists "ncash telegram: dono le" on public.ncash_telegram;
create policy "ncash telegram: dono le" on public.ncash_telegram
  for select to authenticated using (user_id = auth.uid());

-- ── Conferência: tudo deve voltar `true` ─────────────────────────────────
select
  to_regclass('public.ncash_telegram') is not null as telegram,
  (select count(*) from pg_policies where schemaname = 'public' and tablename = 'ncash_telegram') = 1 as rls_so_leitura;
