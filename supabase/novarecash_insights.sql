-- ═══════════════════════════════════════════════════════════════════════
-- NOVARECASH — ALERTAS DISPENSADOS E METAS (04/11/2026)
--
-- ⚠️ RODE DEPOIS DE `novarecash_compartilhar.sql` (usa `ncash_pode`).
-- Seguro rodar de novo (idempotente).
--
-- 1. `ncash_alertas_dispensados`: os alertas da tela /novarecash/app/alertas
--    que a pessoa marcou como "Já resolvi / dispensar". Os alertas em si NÃO
--    moram no banco: são calculados na hora a partir de `ncash_transacoes`
--    (src/lib/novarecash/insights.ts). Aqui fica só a CHAVE ESTÁVEL de cada
--    alerta dispensado, para ele não voltar.
--
-- 2. `ncash_metas`: as metas de guardar dinheiro (/novarecash/app/metas).
--    "Guardei mais R$ X" só soma em `guardado`; NÃO mexe no extrato.
--
-- REGRA DE ACESSO: a mesma de todo o NovareCash — `ncash_pode(user_id)`
-- (dono e membro aceito do grupo). `user_id` é SEMPRE o DONO do NovareCash
-- (`ncash_dono_atual()`), não quem clicou. A equipe NÃO lê.
-- ═══════════════════════════════════════════════════════════════════════

-- ── 1. Alertas dispensados ──────────────────────────────────────────────
create table if not exists public.ncash_alertas_dispensados (
  user_id         uuid not null references auth.users (id) on delete cascade,
  chave           text not null check (length(chave) between 1 and 300),
  dispensado_por  uuid default auth.uid() references auth.users (id) on delete set null,
  dispensado_em   timestamptz not null default now(),
  primary key (user_id, chave)
);

alter table public.ncash_alertas_dispensados enable row level security;

drop policy if exists "ncash: dono manda" on public.ncash_alertas_dispensados;
create policy "ncash: dono manda" on public.ncash_alertas_dispensados
  for all to authenticated
  using (public.ncash_pode(user_id)) with check (public.ncash_pode(user_id));

-- ── 2. Metas ────────────────────────────────────────────────────────────
create table if not exists public.ncash_metas (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  nome          text not null check (length(trim(nome)) between 1 and 80),
  valor_alvo    numeric(14, 2) not null check (valor_alvo > 0),
  prazo         date,                                   -- opcional
  guardado      numeric(14, 2) not null default 0 check (guardado >= 0),
  icone         text not null default 'reserva',        -- chave de ICONES_META em src/lib/novarecash/metas.ts
  categoria     text,                                   -- opcional: chave de CATEGORIAS (categorias.ts)
  concluida     boolean not null default false,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index if not exists ncash_metas_user_idx on public.ncash_metas (user_id, concluida, criado_em);

alter table public.ncash_metas enable row level security;

drop policy if exists "ncash: dono manda" on public.ncash_metas;
create policy "ncash: dono manda" on public.ncash_metas
  for all to authenticated
  using (public.ncash_pode(user_id)) with check (public.ncash_pode(user_id));

-- "Guardei mais R$ X": soma no banco, de uma vez (duas pessoas da casa podem
-- guardar ao mesmo tempo sem uma apagar a outra). SECURITY INVOKER: a RLS de
-- cima vale aqui dentro. Bateu o alvo = concluída.
create or replace function public.ncash_meta_guardar(p_meta uuid, p_valor numeric)
returns numeric
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_guardado numeric;
begin
  if p_valor is null or p_valor = 0 then
    raise exception 'valor inválido';
  end if;
  update public.ncash_metas
     set guardado = greatest(0, guardado + p_valor),
         concluida = concluida or (greatest(0, guardado + p_valor) >= valor_alvo),
         atualizado_em = now()
   where id = p_meta
  returning guardado into v_guardado;
  if v_guardado is null then
    raise exception 'meta não encontrada';
  end if;
  return v_guardado;
end;
$$;
revoke all on function public.ncash_meta_guardar(uuid, numeric) from public, anon;
grant execute on function public.ncash_meta_guardar(uuid, numeric) to authenticated;

-- ── Conferência ─────────────────────────────────────────────────────────
select
  to_regclass('public.ncash_alertas_dispensados') is not null as alertas_dispensados,
  to_regclass('public.ncash_metas') is not null                as metas,
  to_regprocedure('public.ncash_meta_guardar(uuid, numeric)') is not null as guardar,
  (select count(*) from pg_policies
    where schemaname = 'public'
      and tablename in ('ncash_alertas_dispensados', 'ncash_metas')
      and qual like '%ncash_pode%')                           as policies_com_ncash_pode;  -- esperado: 2
