-- ═══════════════════════════════════════════════════════════════════════
-- NOVARECASH — ASSINATURA, ACESSO E O DIÁRIO DA HOTMART (03/11/2026)
--
-- O NovareCash é o produto PAGO da Novare (Open Finance + WhatsApp + IA); o
-- FINCASH continua gratuito. Quem pagou é decidido AQUI, no banco — nunca num
-- `if` de tela.
--
-- COMO O ACESSO NASCE: a Hotmart avisa a rota /api/novarecash/hotmart a cada
-- compra, renovação, cancelamento ou reembolso. A rota grava em
-- `ncash_assinantes` (uma linha por e-mail, o estado de hoje) e guarda o aviso
-- cru em `ncash_hotmart_eventos` (o diário, para auditoria).
--
-- ⚠️ A CHAVE É O E-MAIL, NÃO O user_id: quem compra na Hotmart muitas vezes
-- ainda não tem conta no Hub. Quando criar a conta com o MESMO e-mail, o acesso
-- já está lá — `ncash_tem_acesso()` compara com `auth.email()`.
--
-- CANCELOU A ASSINATURA ≠ PERDEU O ACESSO: quem cancela usa até `expira_em`
-- (o período que já pagou). REEMBOLSO e CHARGEBACK cortam na hora.
--
-- A EQUIPE (admin/equipe) sempre tem acesso, para dar suporte.
--
-- Rode no SQL Editor do projeto hjikeevfzfswqydduars. É seguro rodar de novo.
-- ═══════════════════════════════════════════════════════════════════════

create table if not exists public.ncash_assinantes (
  email         text primary key,                 -- sempre minúsculo (a rota normaliza)
  nome          text,
  status        text not null default 'ativa'
                check (status in ('ativa', 'cancelada', 'atrasada', 'reembolsada', 'chargeback')),
  plano         text,                             -- 'mensal' | 'anual' (vem do nome do plano na Hotmart)
  expira_em     timestamptz,                      -- até quando vale o que já foi pago
  assinatura    text,                             -- código do assinante na Hotmart
  ultima_transacao text,
  comprou_em    timestamptz,
  atualizado_em timestamptz not null default now()
);

create table if not exists public.ncash_hotmart_eventos (
  id          bigserial primary key,
  evento      text not null,
  email       text,
  transacao   text,
  payload     jsonb not null,
  recebido_em timestamptz not null default now()
);
create index if not exists ncash_hotmart_eventos_email_idx on public.ncash_hotmart_eventos (email, recebido_em desc);

alter table public.ncash_assinantes enable row level security;
alter table public.ncash_hotmart_eventos enable row level security;

-- A pessoa lê a PRÓPRIA assinatura (para a tela "Minha assinatura"); a equipe lê todas.
-- Ninguém escreve pelo navegador: só a rota da Hotmart, com a chave de serviço.
drop policy if exists "ncash: le a propria" on public.ncash_assinantes;
create policy "ncash: le a propria" on public.ncash_assinantes
  for select to authenticated
  using (lower(email) = lower(coalesce(auth.email(), '')) or public.hub_papel() in ('admin', 'equipe'));

drop policy if exists "ncash: equipe le eventos" on public.ncash_hotmart_eventos;
create policy "ncash: equipe le eventos" on public.ncash_hotmart_eventos
  for select to authenticated
  using (public.hub_papel() in ('admin', 'equipe'));

-- A REGRA DO ACESSO, numa função só (a tela, a IA e o WhatsApp perguntam a ela).
create or replace function public.ncash_tem_acesso_email(p_email text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.ncash_assinantes a
     where a.email = lower(coalesce(p_email, ''))
       and a.status in ('ativa', 'cancelada', 'atrasada')
       and (a.expira_em is null or a.expira_em > now())
  );
$$;

-- ⚠️ SÓ CRIA SE AINDA NÃO EXISTIR (04/11/2026): `novarecash_compartilhar.sql`
-- substitui esta função por uma que também deixa entrar o MEMBRO da conta
-- compartilhada. Com `create or replace` aqui, rodar este arquivo de novo
-- depois daquele voltava a versão curta — e o convidado era barrado na porta
-- do app sem nenhum erro aparecer.
do $do$
begin
  if to_regprocedure('public.ncash_tem_acesso()') is null then
    execute $f$
      create function public.ncash_tem_acesso()
      returns boolean
      language sql
      stable
      security definer
      set search_path = public
      as $$
        select coalesce(public.hub_papel() in ('admin', 'equipe'), false)
            or public.ncash_tem_acesso_email(auth.email());
      $$
    $f$;
  end if;
end $do$;

revoke all on function public.ncash_tem_acesso_email(text) from public, anon, authenticated;
-- ⚠️ `revoke ... from public` tira de TODOS os papéis, inclusive o da chave de serviço: o servidor do
-- WhatsApp (que não tem sessão de usuário) pergunta por e-mail, então o service_role precisa do grant.
grant execute on function public.ncash_tem_acesso_email(text) to service_role;
revoke all on function public.ncash_tem_acesso() from public, anon;
grant execute on function public.ncash_tem_acesso() to authenticated;

-- Conferência: as duas tabelas e a função existem.
select
  to_regclass('public.ncash_assinantes')      is not null as assinantes,
  to_regclass('public.ncash_hotmart_eventos') is not null as eventos,
  to_regprocedure('public.ncash_tem_acesso()') is not null as funcao_acesso;
