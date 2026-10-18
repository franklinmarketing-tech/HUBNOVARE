-- ═══════════════════════════════════════════════════════════════════════
-- ENTRAR NO PAINEL DA NOVARE  —  hub.novareapp.com.br/admin
--
-- ⚠️ 404 NO /admin NÃO É ERRO DE ENDEREÇO. Significa que você ESTÁ logado,
-- mas a sua conta não é `admin` nem `equipe`. (Se não estivesse logado, o
-- Hub teria mandado para a tela de login.) O painel devolve 404 de propósito:
-- uma página de "acesso restrito" responderia 200 e confirmaria, para quem
-- está tentando, que existe administração naquele endereço.
--
-- Rode os blocos NA ORDEM, de cima para baixo.
-- ═══════════════════════════════════════════════════════════════════════


-- ─── 1) COM QUAL CONTA VOCÊ ESTÁ LOGADO? ──────────────────────────────
-- O último login é quase sempre a conta aberta no navegador. Ache a sua
-- nesta lista e confira se o e-mail é mesmo o que você espera — foi por
-- aqui que já se promoveu a conta errada.
select u.email,
       coalesce(p.role, '— sem perfil —') as papel,
       u.last_sign_in_at as ultimo_login
from auth.users u
left join hub_profiles p on p.id = u.id
order by u.last_sign_in_at desc nulls last
limit 30;


-- ─── 2) DAR O ACESSO ───────────────────────────────────────────────────
-- ⚠️ TROQUE O E-MAIL ABAIXO pelo que você viu no passo 1.
--
-- Isto é um UPSERT, e não um UPDATE simples, por um motivo: o perfil nasce
-- no primeiro login, e se por qualquer razão ele não existir, um UPDATE
-- diria "0 rows" sem explicar nada — você ficaria olhando o 404 achando
-- que o comando rodou. Assim, perfil que falta é criado na hora.
insert into hub_profiles (id, role)
select u.id, 'admin'
  from auth.users u
 where lower(u.email) = lower('franklincastriani@gmail.com')
on conflict (id) do update set role = 'admin';


-- ─── 3) CONFERIR ───────────────────────────────────────────────────────
-- Tem de voltar UMA linha, com papel = admin. Se voltar vazio, o e-mail do
-- passo 2 não existe em auth.users: essa conta nunca entrou no Hub. Faça
-- login uma vez em hub.novareapp.com.br/login e rode o passo 2 de novo.
select u.email, p.role as papel
from hub_profiles p
join auth.users u on u.id = p.id
where lower(u.email) = lower('franklincastriani@gmail.com');


-- ⚠️ DEPOIS DE RODAR: SAIA E ENTRE DE NOVO no Hub. O papel é lido no
-- login; a sessão que já está aberta continua valendo o papel antigo e o
-- /admin seguiria dando 404 mesmo com o banco certo.


-- ═══════════════════════════════════════════════════════════════════════
-- EXTRA — o lead que você mandou ontem está gravado?
--
-- Está. O e-mail é que não saiu: faltava a RESEND_API_KEY na Vercel (ela
-- só existia no .env.local, na sua máquina). O lead foi gravado normalmente.
-- ═══════════════════════════════════════════════════════════════════════
select criado_em, email, nome, telefone, origem, tipo
from hub_leads
order by criado_em desc
limit 20;
