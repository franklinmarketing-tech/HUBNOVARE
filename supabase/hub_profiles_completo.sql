-- Perfil completo do cliente no Novare Workspace.
--
-- Roda depois de `hub_profiles.sql`. Tudo é `add column if not exists`,
-- então pode ser executado mais de uma vez sem estragar nada.
--
-- Onde rodar: SQL Editor do projeto Supabase hjikeevfzfswqydduars.

alter table public.hub_profiles
  add column if not exists apelido       text,
  add column if not exists telefone      text,
  add column if not exists nascimento    date,
  add column if not exists cidade        text,
  add column if not exists uf            text,
  add column if not exists profissao     text,
  -- O que a pessoa quer resolver. É por onde a consultoria começa a
  -- conversa, em vez de perguntar do zero na primeira reunião.
  add column if not exists objetivo      text,
  add column if not exists avatar_url    text,
  add column if not exists aceita_email  boolean not null default true,
  add column if not exists atualizado_em timestamptz not null default now();

-- Carimbo de atualização: saber quando o cliente mexeu no próprio cadastro
-- evita pedir de novo o que ele já respondeu semana passada.
create or replace function public.hub_profiles_touch()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

drop trigger if exists hub_profiles_touch on public.hub_profiles;
create trigger hub_profiles_touch
  before update on public.hub_profiles
  for each row execute function public.hub_profiles_touch();

-- O cliente edita o próprio cadastro, e só ele.
-- `role` e `plano` ficam de fora de propósito: quem muda plano é o
-- webhook de pagamento, não o formulário do usuário.
drop policy if exists "perfil proprio: atualizar" on public.hub_profiles;
create policy "perfil proprio: atualizar"
  on public.hub_profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);
