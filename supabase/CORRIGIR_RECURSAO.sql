-- ============================================================================
-- CORREÇÃO — recursão infinita nas policies de hub_profiles
--
-- Sintoma: qualquer leitura devolve
--   42P17: infinite recursion detected in policy for relation "hub_profiles"
--
-- Causa: a policy "admin le tudo" perguntava o papel CONSULTANDO a própria
-- hub_profiles. Para responder a essa consulta o Postgres precisa avaliar a
-- policy de novo, que consulta de novo… e assim por diante.
--
-- Correção: descobrir o papel por uma função `security definer`, que roda com
-- o dono do banco e NÃO passa pelas policies — quebrando o laço. É o padrão
-- recomendado pelo Supabase para checagem de papel dentro de RLS.
--
-- Cole tudo no SQL Editor (projeto hjikeevfzfswqydduars) e clique em RUN.
-- Seguro rodar mais de uma vez.
-- ============================================================================

-- 1. O papel do usuário logado, lido sem RLS (é isto que quebra a recursão).
create or replace function public.hub_papel()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from public.hub_profiles where id = auth.uid();
$$;

revoke all on function public.hub_papel() from public;
grant execute on function public.hub_papel() to anon, authenticated;

-- 2. Policies de hub_profiles, agora sem consultar a própria tabela.
drop policy if exists "hub_profiles: leitura propria" on public.hub_profiles;
create policy "hub_profiles: leitura propria"
  on public.hub_profiles for select
  using (auth.uid() = id);

drop policy if exists "hub_profiles: admin le tudo" on public.hub_profiles;
create policy "hub_profiles: admin le tudo"
  on public.hub_profiles for select
  using (public.hub_papel() = 'admin');

drop policy if exists "hub_profiles: admin escreve" on public.hub_profiles;
create policy "hub_profiles: admin escreve"
  on public.hub_profiles for all
  using (public.hub_papel() = 'admin')
  with check (public.hub_papel() = 'admin');

drop policy if exists "perfil proprio: atualizar" on public.hub_profiles;
create policy "perfil proprio: atualizar"
  on public.hub_profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 3. hub_leads consultava hub_profiles e caía na mesma armadilha.
drop policy if exists "hub_leads: equipe le" on public.hub_leads;
create policy "hub_leads: equipe le"
  on public.hub_leads for select to authenticated
  using (public.hub_papel() in ('admin', 'equipe'));

-- 4. Garante o papel dos consultores (o update anterior pode ter falhado).
update public.hub_profiles
   set role = 'equipe',
       nome = coalesce(nome, 'Consultores Novare')
 where id = (select id from auth.users
              where email = 'consultores@novareapp.com.br');

-- 5. Conferência: deve devolver uma linha com role = 'equipe'.
select u.email, p.role, p.plano, p.nome
  from public.hub_profiles p
  join auth.users u on u.id = p.id
 where u.email = 'consultores@novareapp.com.br';
