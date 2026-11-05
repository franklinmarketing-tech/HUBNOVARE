-- ═══════════════════════════════════════════════════════════════════════
-- NOVARECASH — GUIA DE PRIMEIRO USO (05/11/2026)
--
-- O "já viu" das boas-vindas e do cartão "Primeiros passos" do Início, para
-- valer em qualquer aparelho. Lido e gravado por `src/lib/novarecash/preferencias.ts`.
--
-- OPCIONAL: sem esta tabela o app guarda o "já viu" só no localStorage, sem
-- erro (as boas-vindas podem reaparecer num aparelho novo, e só).
-- Seguro rodar de novo (idempotente). Não depende de nenhum outro SQL.
--
-- REGRA DE ACESSO: cada PESSOA só lê e grava a PRÓPRIA linha (`auth.uid()`).
-- De propósito NÃO é `ncash_pode(user_id)`, a regra das tabelas de dados:
-- lá `user_id` é o DONO do NovareCash e o membro convidado também enxerga.
-- Aqui a preferência é de quem está logado — na conta compartilhada, o membro
-- vê as próprias boas-vindas e não marca as do dono como vistas.
-- ═══════════════════════════════════════════════════════════════════════

create table if not exists public.ncash_preferencias (
  user_id                  uuid primary key references auth.users (id) on delete cascade,
  boas_vindas_em           timestamptz,
  checklist_dispensado_em  timestamptz,
  atualizado_em            timestamptz not null default now()
);

alter table public.ncash_preferencias enable row level security;

drop policy if exists "ncash: a propria pessoa" on public.ncash_preferencias;
create policy "ncash: a propria pessoa" on public.ncash_preferencias
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Conferência: deve devolver uma linha com `rls = true` e `politicas = 1`.
select
  to_regclass('public.ncash_preferencias') is not null as tabela,
  (select relrowsecurity from pg_class where oid = 'public.ncash_preferencias'::regclass) as rls,
  (select count(*) from pg_policies where schemaname = 'public' and tablename = 'ncash_preferencias') as politicas;
