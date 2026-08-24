-- ============================================================================
-- Conta dos consultores da Novare — acesso de EQUIPE
--
-- A conta já existe no Auth (criada pelo fluxo de cadastro). O que falta é o
-- papel: `equipe` abre todos os aplicativos, inclusive os internos e os que
-- forem marcados como pagos no futuro, além da home logada (/hub).
--
-- Isto NÃO pode ser feito pelo app: a policy de `hub_profiles` só deixa o
-- usuário editar os próprios dados de cadastro, nunca o `role` nem o `plano`
-- — é o que impede qualquer pessoa de se promover sozinha. Por isso roda aqui,
-- no SQL Editor do Supabase (projeto hjikeevfzfswqydduars).
-- ============================================================================

update public.hub_profiles
   set role = 'equipe',
       nome = coalesce(nome, 'Consultores Novare')
 where id = (select id from auth.users
              where email = 'consultores@novareapp.com.br');

-- Confere se aplicou (deve devolver uma linha com role = 'equipe'):
select u.email, p.role, p.plano, p.nome
  from public.hub_profiles p
  join auth.users u on u.id = p.id
 where u.email = 'consultores@novareapp.com.br';

-- ============================================================================
-- Para criar UM CONSULTOR POR PESSOA (recomendado — dá para saber quem fez o
-- quê e revogar acesso individual): a pessoa se cadastra em /login usando
-- "Criar conta grátis" e depois você roda o mesmo update trocando o e-mail.
--
-- Para revogar o acesso de alguém, basta rebaixar para cliente:
--   update public.hub_profiles set role = 'cliente'
--    where id = (select id from auth.users where email = 'PESSOA@AQUI');
-- ============================================================================
