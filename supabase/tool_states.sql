-- Estado das ferramentas sincronizado por usuario. Execute no SQL Editor do Supabase.
create table if not exists public.tool_states (
  user_id uuid not null references auth.users(id) on delete cascade,
  chave text not null check (char_length(chave) between 1 and 80),
  dados jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, chave)
);

alter table public.tool_states enable row level security;

drop policy if exists "Usuarios leem apenas seus estados" on public.tool_states;
create policy "Usuarios leem apenas seus estados"
  on public.tool_states for select
  using (auth.uid() = user_id);

drop policy if exists "Usuarios inserem apenas seus estados" on public.tool_states;
create policy "Usuarios inserem apenas seus estados"
  on public.tool_states for insert
  with check (auth.uid() = user_id);

drop policy if exists "Usuarios atualizam apenas seus estados" on public.tool_states;
create policy "Usuarios atualizam apenas seus estados"
  on public.tool_states for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Usuarios removem apenas seus estados" on public.tool_states;
create policy "Usuarios removem apenas seus estados"
  on public.tool_states for delete
  using (auth.uid() = user_id);

create or replace function public.atualizar_tool_states_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tool_states_updated_at on public.tool_states;
create trigger tool_states_updated_at
  before update on public.tool_states
  for each row execute procedure public.atualizar_tool_states_updated_at();
