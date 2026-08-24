-- ============================================================================
-- Novare Hub — leads captados pelas ferramentas e landing pages
-- Projeto Supabase: hjikeevfzfswqydduars (mesmo do novareapp)
--
-- Rode este script UMA VEZ no SQL Editor do Supabase.
-- Só cria coisas novas com prefixo `hub_` — não toca em nada existente.
-- ============================================================================

create table if not exists public.hub_leads (
  id         uuid primary key default gen_random_uuid(),
  email      text not null check (char_length(email) between 3 and 200),
  nome       text,
  telefone   text,
  origem     text,        -- rota/ferramenta de onde veio o lead
  tipo       text,        -- 'ferramenta' | 'vida-plan' | 'saude-financeira'
  payload    jsonb,       -- dados do cálculo (renda, score, etc.)
  criado_em  timestamptz not null default now()
);

alter table public.hub_leads enable row level security;

-- Qualquer visitante (mesmo anônimo) pode CRIAR um lead — as iscas são públicas.
-- Não pode ler nem alterar; só inserir com um e-mail plausível.
drop policy if exists "hub_leads: qualquer um cria" on public.hub_leads;
create policy "hub_leads: qualquer um cria"
  on public.hub_leads for insert
  to anon, authenticated
  with check (char_length(email) between 3 and 200);

-- Só admin/equipe leem os leads captados (via hub_profiles.role).
drop policy if exists "hub_leads: equipe le" on public.hub_leads;
create policy "hub_leads: equipe le"
  on public.hub_leads for select
  to authenticated
  using (public.hub_papel() in ('admin', 'equipe'));

create index if not exists hub_leads_criado_idx on public.hub_leads (criado_em desc);
