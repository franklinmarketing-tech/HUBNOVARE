-- ============================================================================
-- Novare Hub — promover o dono a administrador
-- Projeto Supabase: hjikeevfzfswqydduars (mesmo do novareapp)
--
-- Rode UMA VEZ no SQL Editor, trocando o e-mail pelo da SUA conta de login.
-- (O e-mail não fica gravado neste arquivo de propósito: o repositório é
-- público, e e-mail de pessoa não entra em repositório público.)
--
-- O papel 'admin' abre tudo: o Hub trata role != 'cliente' como assinante,
-- então o Planejamento Financeiro, a Íris e o painel /meu-dia ficam
-- liberados sem depender do campo `plano`.
-- ============================================================================

update public.hub_profiles
   set role = 'admin'
 where id = (select id from auth.users where email = 'SEU-EMAIL-DE-LOGIN@AQUI');

-- Confira o resultado (deve mostrar role = 'admin'):
select p.role, p.plano, u.email
  from public.hub_profiles p
  join auth.users u on u.id = p.id
 where u.email = 'SEU-EMAIL-DE-LOGIN@AQUI';
