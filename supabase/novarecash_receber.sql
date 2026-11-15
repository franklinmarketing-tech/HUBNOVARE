-- ═════════════════════════════════════════════════════════════════════════
-- NOVARECASH: A RECEBER / FIADO + LEMBRETE POR E-MAIL (15/11/2026)
--
-- Pode rodar mais de uma vez (tudo é "if not exists"). Depende de
-- `ncash_pode()` e de `ncash_transacoes` (NOVARECASH_CORRECOES.sql).
--
-- 1. `ncash_receber`: quem deve, quanto, do quê e quando cobrar.
-- 2. `ncash_receber_baixas`: cada pagamento recebido (total ou parcial),
--    com a ENTRADA que ele gerou no Extrato. Apagar esse lançamento apaga a
--    baixa junto (on delete cascade): o que falta receber nunca descola do
--    extrato.
-- 3. `ncash_lembretes_email`: um e-mail de lembrete por dono por dia, no máximo.
-- 4. `ncash_preferencias.lembretes_email`: a pessoa pode desligar o e-mail.
--
-- ACESSO: a regra única `ncash_pode(user_id)` (dono ou membro aceito da conta
-- compartilhada). `user_id` = o DONO do NovareCash. O lembrete e o WhatsApp
-- rodam com a chave de serviço.
-- ═════════════════════════════════════════════════════════════════════════

-- ── 1. A receber ─────────────────────────────────────────────────────────
create table if not exists public.ncash_receber (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  pessoa      text not null check (char_length(pessoa) between 1 and 60),
  telefone    text check (telefone is null or char_length(telefone) <= 15),
  descricao   text not null default '' check (char_length(descricao) <= 120),
  valor       numeric(14, 2) not null check (valor > 0),
  categoria   text not null default 'renda_extra',
  vence_em    date,
  origem      text not null default 'manual' check (origem in ('manual', 'whatsapp')),
  arquivado   boolean not null default false,
  criado_em   timestamptz not null default now()
);
create index if not exists ncash_receber_dono on public.ncash_receber (user_id, arquivado, vence_em);

-- ── 2. As baixas (pagamentos recebidos) ──────────────────────────────────
create table if not exists public.ncash_receber_baixas (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  receber_id    uuid not null references public.ncash_receber (id) on delete cascade,
  valor         numeric(14, 2) not null check (valor > 0),
  recebido_em   date not null,
  transacao_id  uuid references public.ncash_transacoes (id) on delete cascade,
  criado_em     timestamptz not null default now()
);
create index if not exists ncash_receber_baixas_item on public.ncash_receber_baixas (receber_id);
create index if not exists ncash_receber_baixas_dono on public.ncash_receber_baixas (user_id);

-- ── 3. Lembrete por e-mail: um por dono por dia ──────────────────────────
create table if not exists public.ncash_lembretes_email (
  user_id    uuid not null references auth.users (id) on delete cascade,
  dia        date not null,                 -- o dia do envio, no fuso de São Paulo
  itens      integer not null default 0,    -- quantas contas + cobranças entraram no e-mail
  criado_em  timestamptz not null default now(),
  primary key (user_id, dia)
);

-- ── 4. Desligar o e-mail (só se a tabela de preferências já existir) ─────
do $$
begin
  if to_regclass('public.ncash_preferencias') is not null then
    alter table public.ncash_preferencias add column if not exists lembretes_email boolean not null default true;
  end if;
end $$;

-- ── RLS: a regra única ───────────────────────────────────────────────────
alter table public.ncash_receber          enable row level security;
alter table public.ncash_receber_baixas   enable row level security;
alter table public.ncash_lembretes_email  enable row level security;

drop policy if exists "ncash: dono manda" on public.ncash_receber;
create policy "ncash: dono manda" on public.ncash_receber
  for all to authenticated using (public.ncash_pode(user_id)) with check (public.ncash_pode(user_id));

drop policy if exists "ncash: dono manda" on public.ncash_receber_baixas;
create policy "ncash: dono manda" on public.ncash_receber_baixas
  for all to authenticated using (public.ncash_pode(user_id)) with check (public.ncash_pode(user_id));

drop policy if exists "ncash: dono manda" on public.ncash_lembretes_email;
create policy "ncash: dono manda" on public.ncash_lembretes_email
  for all to authenticated using (public.ncash_pode(user_id)) with check (public.ncash_pode(user_id));

-- ── Conferência: tudo deve voltar `true` ─────────────────────────────────
select
  to_regclass('public.ncash_receber')         is not null as a_receber,
  to_regclass('public.ncash_receber_baixas')  is not null as baixas,
  to_regclass('public.ncash_lembretes_email') is not null as lembretes_email,
  (to_regclass('public.ncash_preferencias') is null
    or exists (select 1 from information_schema.columns where table_schema = 'public'
                and table_name = 'ncash_preferencias' and column_name = 'lembretes_email')) as preferencia_email,
  (select count(*) from pg_policies where schemaname = 'public'
     and tablename in ('ncash_receber', 'ncash_receber_baixas', 'ncash_lembretes_email')
     and qual like '%ncash_pode%') = 3 as rls_ncash_pode;
