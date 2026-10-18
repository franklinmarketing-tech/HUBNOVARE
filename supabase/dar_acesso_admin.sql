-- ═══════════════════════════════════════════════════════════════════════
-- ABRIR O PAINEL DA NOVARE PARA O FRANKLIN E PARA O JEFFERSON
--                                        hub.novareapp.com.br/admin
--
-- ⚠️ SELECIONE TUDO (Ctrl+A) ANTES DE RODAR. O editor do Supabase executa
-- só o trecho marcado — rodar "o bloco de cima" e achar que correu tudo é
-- o engano mais comum aqui.
--
-- ⚠️ 404 NO /admin NÃO É ENDEREÇO ERRADO. Testado: numa aba sem sessão, o
-- /admin manda para o login. Se você vê 404, está logado — só falta o
-- papel. O painel devolve 404 de propósito: "acesso restrito" em 200
-- confirmaria, para quem está tentando, que existe administração ali.
-- ═══════════════════════════════════════════════════════════════════════


-- ─── 1) PROMOVER AS CONTAS ─────────────────────────────────────────────
-- Cobre de uma vez todas as contas que podem ser a sua, mais a do
-- Jefferson. O que não existir é simplesmente ignorado — não dá erro.
--
-- ⚠️ É UPSERT, não UPDATE. O perfil nasce no primeiro login; se faltar,
-- ele é criado aqui. Um UPDATE diria "0 rows" sem explicar e você ficaria
-- olhando o mesmo 404 achando que o comando rodou.
insert into hub_profiles (id, role)
select u.id, 'admin'
  from auth.users u
 where lower(u.email) in (
   'franklincastriani@gmail.com',
   'marketingcastriani@gmail.com',
   'jefferson.ariane1402@gmail.com'
   -- Falta alguma? Acrescente aqui, entre aspas e com vírgula antes.
 )
on conflict (id) do update set role = 'admin';


-- ─── 2) QUEM ENTRA NO PAINEL AGORA ─────────────────────────────────────
-- Tem de aparecer pelo menos a SUA conta com papel = admin.
select u.email,
       p.role as papel,
       u.last_sign_in_at as ultimo_login
from hub_profiles p
join auth.users u on u.id = p.id
where p.role in ('admin', 'equipe')
order by p.role, u.email;


-- ─── 3) SE A SUA CONTA NÃO APARECEU ACIMA ──────────────────────────────
-- É porque o e-mail de LOGIN é outro (não confunda com o e-mail que você
-- digitou no formulário do site). Esta lista mostra quem entrou por
-- último — a sua conta é quase sempre a primeira linha. Ache o e-mail,
-- acrescente na lista do bloco 1 e rode de novo.
select u.email,
       coalesce(p.role, '— sem perfil —') as papel,
       u.last_sign_in_at as ultimo_login
from auth.users u
left join hub_profiles p on p.id = u.id
order by u.last_sign_in_at desc nulls last
limit 30;


-- ═══════════════════════════════════════════════════════════════════════
-- ⚠️ AGORA SAIA E ENTRE DE NOVO NO HUB. Esta é a parte que costuma faltar:
-- o papel é lido no momento do login, então a sessão que já está aberta
-- continua valendo o papel antigo e o /admin seguiria em 404 mesmo com o
-- banco certo.
--
-- 1. hub.novareapp.com.br/perfil  →  sair da conta
-- 2. entrar de novo
-- 3. hub.novareapp.com.br/admin
-- ═══════════════════════════════════════════════════════════════════════
