-- NovareCash · Open Finance · CONNECT SESSIONS (21/11/2026)
--
-- Cada toque em "Conectar <banco>" cria uma sessão na mcp.ai SÓ daquela pessoa. A conexão nasce
-- carimbada com o `ref` (client_ref) da sessão, e é por esta tabela que o Hub sabe de quem ela é —
-- sem adivinhar pela hora (o antigo `claim`). Ver src/lib/novarecash/sessao-banco.ts.
--
--   cs      → o id da sessão na mcp.ai (cs_…), que volta na URL de retorno.
--   ref     → o client_ref: aleatório NOSSO (ncs_…), nunca o id ou o e-mail da pessoa. Volta no
--             webhook connection.created.
--   status  → pending | connected | expired | canceled | conflito.
--   item_id → a conexão criada (connection_id), quando conectar.
--
-- Só o servidor (service role) lê e grava: RLS ligado e sem policy.
-- Pode rodar mais de uma vez.

create table if not exists public.ncash_of_sessoes (
  cs            text primary key,
  ref           text not null unique,
  user_id       uuid not null references auth.users (id) on delete cascade,
  connector_id  text,
  banco         text,
  status        text not null default 'pending',
  item_id       text,
  criado_em     timestamptz not null default now(),
  concluido_em  timestamptz
);
alter table public.ncash_of_sessoes enable row level security;
create index if not exists ncash_of_sessoes_user_idx on public.ncash_of_sessoes (user_id, criado_em desc);
create index if not exists ncash_of_sessoes_item_idx on public.ncash_of_sessoes (item_id);

-- Conferência: deve listar a tabela com RLS ligado (rowsecurity = true).
select tablename, rowsecurity from pg_tables where schemaname = 'public' and tablename = 'ncash_of_sessoes';
