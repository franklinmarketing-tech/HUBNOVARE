-- ═══════════════════════════════════════════════════════════════════════
-- DAR ACESSO AO PAINEL PARA O JEFFERSON
--
-- ⚠️ TROQUE O E-MAIL NA LINHA ABAIXO se não for esse. O que está aqui veio
-- do lead que ele próprio preencheu em /ferramentas/orcamento — pode não ser
-- o mesmo que ele usa para entrar.
--
-- ── A ORDEM IMPORTA ──────────────────────────────────────────────────────
--
-- ⚠️ ELE PRECISA CRIAR A CONTA PRIMEIRO. Não dá para criar usuário por SQL:
-- a senha é dele, e senha não se inventa para os outros. O caminho é:
--
--   1. ele entra em hub.novareapp.com.br, cria a conta com o e-mail abaixo
--   2. você roda ESTE arquivo
--   3. ele recarrega a página e o /admin aparece
--
-- Se rodar antes de ele criar a conta, o passo 1 avisa que não encontrou —
-- e aí é só rodar de novo depois.
--
-- ── POR QUE `equipe`, E NÃO `admin` ──────────────────────────────────────
--
-- `equipe` abre Saúde, Leads, Iscas, Clientes, Uso e Avisos — tudo que ele
-- precisa para trabalhar os leads e divulgar.
--
-- ⚠️ O QUE `equipe` NÃO ABRE: a tela de Assinantes, que libera e corta
-- acesso pago. Isso exige `admin`, e a separação é de propósito: mexer em
-- dinheiro é outra conversa, e um papel só para tudo é como um acesso vira
-- um problema que ninguém sabe explicar depois.
--
-- É seguro rodar mais de uma vez.
-- ═══════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────
-- PASSO 1 — ELE JÁ TEM CONTA? Este bloco não muda nada.
--
-- `tem_conta` precisa ser `true` para o passo 2 funcionar.
-- ─────────────────────────────────────────────────────────────────────
select
  u.email,
  u.created_at::date          as criou_a_conta_em,
  u.last_sign_in_at           as ultimo_acesso,
  p.nome,
  p.role                      as papel_hoje,
  (u.id is not null)          as tem_conta
from auth.users u
left join public.hub_profiles p on p.id = u.id
where lower(btrim(u.email::text)) = lower(btrim('jefferson.ariane1402@gmail.com'));


-- ─────────────────────────────────────────────────────────────────────
-- PASSO 2 — DAR O PAPEL `equipe`.
--
-- Mexe em `hub_profiles`, não em `auth.users`: o papel é nosso, a conta é
-- do Supabase. O `insert ... on conflict` cobre o caso de alguém ter
-- criado a conta antes de o gatilho de perfil existir — aí o perfil não
-- existe e um `update` puro não acharia nada para atualizar.
-- ─────────────────────────────────────────────────────────────────────
insert into public.hub_profiles (id, nome, role)
select u.id, coalesce(p.nome, 'Jefferson Freitas'), 'equipe'
  from auth.users u
  left join public.hub_profiles p on p.id = u.id
 where lower(btrim(u.email::text)) = lower(btrim('jefferson.ariane1402@gmail.com'))
on conflict (id) do update
  set role = 'equipe',
      nome = coalesce(public.hub_profiles.nome, excluded.nome);


-- ─────────────────────────────────────────────────────────────────────
-- PASSO 3 — CONFERIR. `papel` tem de ser `equipe`.
-- ─────────────────────────────────────────────────────────────────────
select u.email, p.nome, p.role as papel
  from auth.users u
  join public.hub_profiles p on p.id = u.id
 where lower(btrim(u.email::text)) = lower(btrim('jefferson.ariane1402@gmail.com'));
