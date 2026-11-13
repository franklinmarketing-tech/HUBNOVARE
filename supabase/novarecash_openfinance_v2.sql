-- NovareCash · Open Finance v2 (13/11/2026). Pode rodar mais de uma vez.
--
-- 1. ncash_contas.item_id: de qual conexão (banco) a conta veio. Serve para DESLIGAR
--    (desativa só as contas daquele banco) e para RECONECTAR sem duplicar.
--    'desligado' = a conexão foi desligada pelo cliente (reconectando, a conta volta).
-- 2. ncash_of_pedidos: quem tocou em "Conectar <banco>" e quando. Se dois clientes
--    conectam o MESMO banco no mesmo intervalo, ninguém reivindica sozinho.
--    Só o servidor (service role) lê e grava: RLS ligado e sem policy.

alter table public.ncash_contas add column if not exists item_id text;
create index if not exists ncash_contas_item_idx on public.ncash_contas (user_id, item_id);

create table if not exists public.ncash_of_pedidos (
  user_id       uuid primary key references auth.users (id) on delete cascade,
  connector_id  text,
  banco         text,
  criado_em     timestamptz not null default now()
);
alter table public.ncash_of_pedidos enable row level security;
create index if not exists ncash_of_pedidos_conector_idx on public.ncash_of_pedidos (connector_id, criado_em desc);
