-- ═══════════════════════════════════════════════════════════════════════
-- ALERTAS DO FINCASH NO WHATSAPP
--
-- O cliente liga o WhatsApp dele (isso já existe, em `fin_whatsapp_contas`)
-- e escolhe aqui o que quer receber. Nada é enviado por padrão: quem não
-- configurar não recebe nada.
--
-- ⚠️ TUDO DESLIGADO AO NASCER, e isso não é cautela exagerada. Mensagem de
-- WhatsApp não pedida é a diferença entre uma ferramenta útil e um número
-- bloqueado — e número bloqueado derruba a entrega de TODO MUNDO, porque a
-- Meta pune o remetente, não o destinatário. Um cliente irritado custa a
-- entrega de todos os outros.
--
-- Rode uma vez no SQL Editor do projeto hjikeevfzfswqydduars.
-- ═══════════════════════════════════════════════════════════════════════

create table if not exists public.fin_whatsapp_alertas (
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
  -- 0 = domingo … 6 = sábado. O dia em que o resumo sai.
  resumo_dia_semana  smallint not null default 1
                     check (resumo_dia_semana between 0 and 6),

  /* ⚠️ A TRAVA CONTRA REPETIÇÃO, e ela é por tipo de alerta.
     O verificador roda todo dia e olha a mesma janela de dias; sem isto,
     uma conta que vence em 2 dias seria anunciada hoje, amanhã e depois.
     Guardar a data do último envio de cada tipo é o que transforma "vence
     em breve" em um aviso só. */
  ultimo_contas      date,
  ultimo_fatura      date,
  ultimo_orcamento   date,
  ultimo_resumo      date,

  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

comment on table public.fin_whatsapp_alertas is
  'O que cada cliente escolheu receber no WhatsApp. Tudo desligado por padrão: quem não configurar não recebe nada.';

alter table public.fin_whatsapp_alertas enable row level security;

/* ── QUEM VÊ E MEXE: só o dono da linha ──────────────────────────────── */
drop policy if exists "alertas: o dono le" on public.fin_whatsapp_alertas;
create policy "alertas: o dono le"
  on public.fin_whatsapp_alertas for select
  using (auth.uid() = usuario_id);

drop policy if exists "alertas: o dono cria" on public.fin_whatsapp_alertas;
create policy "alertas: o dono cria"
  on public.fin_whatsapp_alertas for insert
  with check (auth.uid() = usuario_id);

drop policy if exists "alertas: o dono muda" on public.fin_whatsapp_alertas;
create policy "alertas: o dono muda"
  on public.fin_whatsapp_alertas for update
  using (auth.uid() = usuario_id)
  with check (auth.uid() = usuario_id);

/* ⚠️ NÃO HÁ POLICY DE SELECT PARA O VERIFICADOR, de propósito.
   Quem roda os alertas é uma rotina de servidor, com a chave de serviço,
   que passa por cima da RLS. Abrir uma policy para "o sistema" exigiria
   um papel que qualquer sessão poderia tentar assumir — e esta tabela diz
   para que número cada pessoa recebe aviso. */

create index if not exists idx_fin_alertas_ligados
  on public.fin_whatsapp_alertas (usuario_id)
  where contas_ligado or fatura_ligado or orcamento_ligado or resumo_ligado;

comment on index public.idx_fin_alertas_ligados is
  'O verificador só se interessa por quem ligou alguma coisa. O índice parcial evita varrer a base inteira todo dia.';
