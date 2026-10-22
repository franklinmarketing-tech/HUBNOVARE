-- ═══════════════════════════════════════════════════════════════════════
-- FEEDBACK DAS FERRAMENTAS E MENSAGENS DO CLIENTE (pedido do dono, 21/10/2026)
-- "Local onde o cliente possa dar um feedback das ferramentas e mandar
--  mensagem para nós."
--
-- Duas tabelas novas, ambas recebendo de formulário PÚBLICO (sem login):
--   hub_avaliacoes — a nota de 1 a 5 no fim de cada ferramenta, com
--                    comentário, nome e e-mail OPCIONAIS.
--   hub_contatos   — o "Fale com a gente": nome, e-mail, WhatsApp, assunto
--                    e mensagem, com a situação pendente/respondida.
--
-- Quem lê é só admin e equipe (aba Feedback do admin). Teste e equipe
-- entram MARCADOS (`eh_teste`), pela mesma regra dos leads
-- (`hub_lead_eh_teste`), e ficam fora das contagens.
--
-- Rode DEPOIS do leads_suporte.sql e do contas_suporte.sql (usa as funções
-- de lá). Não apaga nada; pode rodar de novo sem estrago.
-- ═══════════════════════════════════════════════════════════════════════

create table if not exists public.hub_avaliacoes (
  id          uuid primary key default gen_random_uuid(),
  rota        text not null check (char_length(rota) <= 200),
  ferramenta  text check (char_length(ferramenta) <= 120),
  nota        smallint not null check (nota between 1 and 5),
  comentario  text check (char_length(comentario) <= 1000),
  nome        text check (char_length(nome) <= 120),
  email       text check (char_length(email) <= 200),
  eh_teste    boolean not null default false,
  criado_em   timestamptz not null default now()
);

create index if not exists hub_avaliacoes_criado_em on public.hub_avaliacoes (criado_em desc);
create index if not exists hub_avaliacoes_rota on public.hub_avaliacoes (rota);

create table if not exists public.hub_contatos (
  id             uuid primary key default gen_random_uuid(),
  nome           text not null check (char_length(nome) between 1 and 120),
  email          text not null check (char_length(email) between 3 and 200),
  telefone       text check (char_length(telefone) <= 40),
  assunto        text not null check (assunto in ('duvida', 'sugestao', 'problema', 'consultor')),
  mensagem       text not null check (char_length(mensagem) between 1 and 4000),
  pagina         text check (char_length(pagina) <= 200),
  situacao       text not null default 'pendente' check (situacao in ('pendente', 'respondida')),
  respondida_em  timestamptz,
  eh_teste       boolean not null default false,
  criado_em      timestamptz not null default now()
);

create index if not exists hub_contatos_criado_em on public.hub_contatos (criado_em desc);

-- ─── O PORTEIRO: marca teste, não descarta ─────────────────────────────
-- Mesma regra dos leads, e também quem está logado como admin ou equipe
-- (o Jefferson testando a ferramenta não vira nota de cliente).
create or replace function public.hub_feedback_marca_teste()
returns trigger
language plpgsql
as $$
begin
  if public.hub_lead_eh_teste(coalesce(new.email, ''), new.nome)
     or coalesce(public.hub_papel(), '') in ('admin', 'equipe') then
    new.eh_teste := true;
  end if;
  return new;
end;
$$;

drop trigger if exists hub_avaliacoes_marca_teste on public.hub_avaliacoes;
create trigger hub_avaliacoes_marca_teste
  before insert on public.hub_avaliacoes
  for each row execute function public.hub_feedback_marca_teste();

drop trigger if exists hub_contatos_marca_teste on public.hub_contatos;
create trigger hub_contatos_marca_teste
  before insert on public.hub_contatos
  for each row execute function public.hub_feedback_marca_teste();

-- ─── QUEM PODE O QUÊ ───────────────────────────────────────────────────
alter table public.hub_avaliacoes enable row level security;
alter table public.hub_contatos enable row level security;

-- Qualquer um envia (o formulário é público; o limite por IP fica na rota).
drop policy if exists "hub_avaliacoes: qualquer um avalia" on public.hub_avaliacoes;
create policy "hub_avaliacoes: qualquer um avalia"
  on public.hub_avaliacoes for insert to anon, authenticated
  with check (true);

drop policy if exists "hub_contatos: qualquer um escreve" on public.hub_contatos;
create policy "hub_contatos: qualquer um escreve"
  on public.hub_contatos for insert to anon, authenticated
  with check (situacao = 'pendente' and respondida_em is null);

-- Só a casa lê.
drop policy if exists "hub_avaliacoes: equipe le" on public.hub_avaliacoes;
create policy "hub_avaliacoes: equipe le"
  on public.hub_avaliacoes for select to authenticated
  using (public.hub_papel() in ('admin', 'equipe'));

drop policy if exists "hub_contatos: equipe le" on public.hub_contatos;
create policy "hub_contatos: equipe le"
  on public.hub_contatos for select to authenticated
  using (public.hub_papel() in ('admin', 'equipe'));

-- Só a casa marca como respondida.
drop policy if exists "hub_contatos: equipe atualiza" on public.hub_contatos;
create policy "hub_contatos: equipe atualiza"
  on public.hub_contatos for update to authenticated
  using (public.hub_papel() in ('admin', 'equipe'))
  with check (public.hub_papel() in ('admin', 'equipe'));

grant insert on public.hub_avaliacoes, public.hub_contatos to anon, authenticated;
grant select on public.hub_avaliacoes, public.hub_contatos to authenticated;
grant update (situacao, respondida_em) on public.hub_contatos to authenticated;

-- ─── CONFERÊNCIA ────────────────────────────────────────────────────────
-- Tem de voltar 2 linhas, com rls = true: hub_avaliacoes com 2 policies
-- (enviar, ler) e hub_contatos com 3 (enviar, ler, marcar respondida).
select c.relname as tabela,
       c.relrowsecurity as rls,
       (select count(*) from pg_policies p where p.tablename = c.relname) as policies
  from pg_class c
 where c.relname in ('hub_avaliacoes', 'hub_contatos')
 order by 1;
