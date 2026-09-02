-- ============================================================================
-- CORRECAO URGENTE - qualquer usuario podia virar admin sozinho
--
-- Rode no SQL Editor do Supabase (projeto hjikeevfzfswqydduars) o quanto antes.
-- Seguro rodar de novo: usa `or replace` e `drop ... if exists`.
--
-- ----------------------------------------------------------------------------
-- O QUE ESTAVA ERRADO
--
-- A policy "perfil proprio: atualizar" (de hub_profiles_completo.sql) libera
-- UPDATE da propria linha:
--
--     for update using (auth.uid() = id) with check (auth.uid() = id)
--
-- Ela existe para a pessoa editar nome, telefone e cidade na tela /perfil.
-- Mas RLS trabalha por LINHA, nao por coluna: a mesma permissao deixa o
-- usuario alterar QUALQUER campo da propria linha, inclusive `role` e
-- `plano`.
--
-- Na pratica, qualquer pessoa com uma conta gratis podia abrir o console do
-- navegador e rodar:
--
--     supabase.from('hub_profiles')
--       .update({ role: 'admin', plano: 'pro' })
--       .eq('id', <o proprio id>)
--
-- ...virando administrador e assinante. Testado e confirmado em 02/09/2026
-- com uma conta comum: passou. A conta usada no teste foi devolvida para
-- cliente/free logo em seguida.
--
-- ----------------------------------------------------------------------------
-- A CORRECAO, EM DUAS CAMADAS
--
-- 1. REVOKE por coluna: o Postgres sabe negar UPDATE em colunas especificas.
--    E a trava mais forte, aplicada antes de qualquer policy.
-- 2. TRIGGER: garante a regra mesmo que alguem conceda o GRANT de novo por
--    engano, e devolve uma mensagem clara em vez de falhar em silencio.
--
-- Quem continua podendo mudar papel e plano: o SQL Editor (service_role) e
-- qualquer rotina de backend com a service key. Ou seja, voce.
-- ============================================================================


-- ── Camada 1: negar a escrita das colunas sensiveis ─────────────────────────
revoke update (role, plano, plano_expira_em)
  on public.hub_profiles
  from authenticated, anon;


-- ── Camada 2: trigger de guarda ─────────────────────────────────────────────
create or replace function public.hub_profiles_protege_privilegio()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  jwt_role text := coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'role', '');
begin
  -- Só barra quem chega pela API como usuario do navegador (authenticated /
  -- anon). O SQL Editor e o backend com service key NAO tem esse claim
  -- (jwt_role fica vazio), entao passam direto -- e por ali que VOCE promove
  -- admin. A versao anterior so liberava 'service_role' e acabava barrando
  -- o proprio SQL Editor.
  if jwt_role in ('authenticated', 'anon') then
    if (new.role            is distinct from old.role
     or new.plano           is distinct from old.plano
     or new.plano_expira_em is distinct from old.plano_expira_em)
    then
      raise exception 'Papel e plano nao podem ser alterados por aqui.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists hub_profiles_protege_privilegio on public.hub_profiles;
create trigger hub_profiles_protege_privilegio
  before update on public.hub_profiles
  for each row execute function public.hub_profiles_protege_privilegio();


-- ── Conferencia: nenhuma conta virou admin ou pro sem voce saber ────────────
-- Olhe a lista. Deve ter SO os e-mails que voce mesmo promoveu.
select u.email, p.role, p.plano, p.plano_expira_em, p.criado_em
  from public.hub_profiles p
  join auth.users u on u.id = p.id
 where p.role <> 'cliente' or p.plano <> 'free'
 order by p.criado_em desc;
