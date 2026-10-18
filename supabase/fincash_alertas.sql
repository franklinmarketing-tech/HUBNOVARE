-- ═══════════════════════════════════════════════════════════════════════
-- AVISOS DO FINCASH
--
-- O cliente escolhe o que quer ser avisado. Os avisos chegam no sino do Hub
-- (`hub_notificacoes`) e por e-mail.
--
-- ⚠️ ESTA TABELA NASCEU COMO `fin_whatsapp_alertas`, em 18/10/2026, e foi
-- renomeada no mesmo dia. O canal ia ser WhatsApp até a conta de chegada: a
-- Meta cobra R$ 0,035 por mensagem de utilidade e, desde 1º/10/2026, cobra
-- também dentro da janela de 24h que antes era gratuita. Com o FINCASH
-- gratuito, seria custo por cliente sem receita atrás.
--
-- O bloco de renomeação abaixo existe para quem já rodou a primeira versão.
-- Quem não rodou cai direto no `create table`.
--
-- ⚠️ TUDO DESLIGADO AO NASCER. Quem não configurar não recebe nada.
--
-- Rode no SQL Editor do projeto hjikeevfzfswqydduars.
-- ═══════════════════════════════════════════════════════════════════════

/* ── PARA QUEM JÁ RODOU A PRIMEIRA VERSÃO ──────────────────────────────
   Renomeia em vez de recriar: a tabela pode já ter escolhas de cliente
   dentro, e recriar apagaria tudo sem avisar. */
do $$
begin
  if exists (select 1 from pg_tables
             where schemaname = 'public' and tablename = 'fin_whatsapp_alertas')
     and not exists (select 1 from pg_tables
                     where schemaname = 'public' and tablename = 'fin_alertas')
  then
    alter table public.fin_whatsapp_alertas rename to fin_alertas;
    raise notice 'fin_whatsapp_alertas renomeada para fin_alertas';
  end if;
end $$;

create table if not exists public.fin_alertas (
  usuario_id uuid primary key references auth.users (id) on delete cascade,

  -- ── CONTA A VENCER ──────────────────────────────────────────────────
  contas_ligado      boolean not null default false,
  -- Quantos dias antes do vencimento avisar. 0 = no próprio dia.
  contas_dias_antes  smallint not null default 2
                     check (contas_dias_antes between 0 and 10),

  -- ── FATURA DO CARTÃO ────────────────────────────────────────────────
  fatura_ligado      boolean not null default false,
  fatura_dias_antes  smallint not null default 3
                     check (fatura_dias_antes between 0 and 10),

  -- ── ORÇAMENTO ESTOURANDO ────────────────────────────────────────────
  orcamento_ligado   boolean not null default false,
  -- A partir de quantos % do teto da categoria avisar.
  orcamento_limite   smallint not null default 80
                     check (orcamento_limite between 50 and 100),

  -- ── RESUMO "QUANTO AINDA DÁ PARA GASTAR" ────────────────────────────
  resumo_ligado      boolean not null default false,
  -- 0 = domingo … 6 = sábado.
  resumo_dia_semana  smallint not null default 1
                     check (resumo_dia_semana between 0 and 6),

  /* ⚠️ A TRAVA CONTRA REPETIÇÃO, por tipo de aviso.
     A rotina roda todo dia e olha a mesma janela; sem isto, uma conta que
     vence em 2 dias seria anunciada hoje, amanhã e depois. */
  ultimo_contas      date,
  ultimo_fatura      date,
  ultimo_orcamento   date,
  ultimo_resumo      date,

  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

comment on table public.fin_alertas is
  'O que cada cliente escolheu ser avisado. Chega no sino do Hub e por e-mail. Tudo desligado por padrão.';

alter table public.fin_alertas enable row level security;

/* ── QUEM VÊ E MEXE: só o dono da linha ──────────────────────────────── */
drop policy if exists "alertas: o dono le" on public.fin_alertas;
create policy "alertas: o dono le"
  on public.fin_alertas for select
  using (auth.uid() = usuario_id);

drop policy if exists "alertas: o dono cria" on public.fin_alertas;
create policy "alertas: o dono cria"
  on public.fin_alertas for insert
  with check (auth.uid() = usuario_id);

drop policy if exists "alertas: o dono muda" on public.fin_alertas;
create policy "alertas: o dono muda"
  on public.fin_alertas for update
  using (auth.uid() = usuario_id)
  with check (auth.uid() = usuario_id);

/* ⚠️ NÃO HÁ POLICY PARA A ROTINA, de propósito: ela roda no servidor com a
   chave de serviço, que passa por cima da RLS. Abrir uma policy para "o
   sistema" exigiria um papel que qualquer sessão poderia tentar assumir. */

drop index if exists public.idx_fin_alertas_ligados;
create index if not exists idx_fin_alertas_ligados
  on public.fin_alertas (usuario_id)
  where contas_ligado or fatura_ligado or orcamento_ligado or resumo_ligado;

comment on index public.idx_fin_alertas_ligados is
  'A rotina só se interessa por quem ligou alguma coisa. O índice parcial evita varrer a base inteira todo dia.';
