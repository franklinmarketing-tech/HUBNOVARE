-- ═══════════════════════════════════════════════════════════════════════
-- PAINEL DA NOVARE, VERSÃO 2 — editar clientes, responder leads, avisar
--
-- ⚠️ RODE DEPOIS DE `painel_admin_INSTALAR.sql`, `painel_novare_INSTALAR.sql`
-- e `limpar_tudo_que_e_teste.sql`. Este arquivo usa `hub_papel()` e
-- `hub_eh_demo()`, que nascem neles.
--
-- ⚠️ É SEGURO RODAR MAIS DE UMA VEZ. Tudo é `create or replace` /
-- `if not exists`. Não apaga dado nenhum.
--
-- ── O QUE ESTE ARQUIVO RESOLVE ──────────────────────────────────────────
--
-- 1. "QUERO EDITAR CLIENTE." Não havia como: a tela de Clientes só lia, e a
--    de Assinantes só liberava acesso pago — que deixou de existir quando o
--    Hub virou gratuito. O e-mail morava numa tela e o cadastro na outra.
--    Agora é uma lista só, com e-mail, e editável.
--
-- 2. "QUERO RESPONDER PELO ADMIN." O painel mostrava o lead e mandava a
--    pessoa abrir o próprio e-mail para escrever. Agora a mensagem sai do
--    painel e FICA REGISTRADA em `hub_mensagens` — quem mandou, para quem,
--    o quê e quando. Sem esse registro, dois sócios respondem o mesmo lead.
--
-- 3. ⚠️ O ADMIN NÃO VIA OS AVISOS MANDADOS PARA UMA PESSOA SÓ. A policy de
--    leitura de `hub_notificacoes` era `usuario_id = auth.uid() or usuario_id
--    is null`: o admin enxergava os avisos para todos e os próprios, e mais
--    nada. Um aviso para um cliente específico sumia da tela de quem mandou.
--
-- ⚠️ TODA FUNÇÃO É `security definer` E CHECA O PAPEL NA PRIMEIRA LINHA.
-- As de leitura devolvem vazio para quem não pode; as de ESCRITA levantam
-- erro — quem tentou gravar precisa saber que não gravou.
-- ═══════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────
-- 0. AS MENSAGENS QUE A CASA MANDOU
--
-- ⚠️ ESTA TABELA VEM PRIMEIRO, antes das funções, e não por estética: o
-- Postgres valida o corpo de uma função `language sql` NA CRIAÇÃO. A
-- `hub_clientes()` conta mensagens; criada antes da tabela, o arquivo
-- inteiro falha — e o editor do Supabase desfaz tudo que veio antes.
--
-- ⚠️ É ELA QUE IMPEDE DOIS SÓCIOS DE RESPONDEREM O MESMO LEAD. Antes desta
-- tabela, quem escrevia pelo próprio Gmail não deixava rastro nenhum no
-- painel, e o outro sócio ligava para a mesma pessoa no dia seguinte.
--
-- Guarda o texto inteiro, de propósito: "o que foi dito a esse cliente?" é
-- uma pergunta que alguém vai fazer, e "mandamos um e-mail" não responde.
-- ─────────────────────────────────────────────────────────────────────
create table if not exists public.hub_mensagens (
  id          uuid primary key default gen_random_uuid(),
  lead_id     uuid references public.hub_leads (id) on delete set null,
  usuario_id  uuid references auth.users (id) on delete set null,
  para_email  text not null,
  canal       text not null default 'email' check (canal in ('email', 'aviso', 'whatsapp')),
  assunto     text,
  corpo       text not null,
  enviado_por uuid references auth.users (id) on delete set null,
  criado_em   timestamptz not null default now(),
  -- Preenchido quando o envio FALHOU. A linha fica mesmo assim: saber que
  -- se tentou falar com alguém e não chegou é informação, não sujeira.
  erro        text
);

create index if not exists hub_mensagens_lead_idx    on public.hub_mensagens (lead_id, criado_em desc);
create index if not exists hub_mensagens_usuario_idx on public.hub_mensagens (usuario_id, criado_em desc);
create index if not exists hub_mensagens_email_idx   on public.hub_mensagens (lower(para_email), criado_em desc);

alter table public.hub_mensagens enable row level security;

drop policy if exists "hub_mensagens: equipe le" on public.hub_mensagens;
create policy "hub_mensagens: equipe le"
  on public.hub_mensagens for select
  to authenticated
  using (public.hub_papel() in ('admin', 'equipe'));

-- Ninguém escreve direto: só pela função abaixo, que confere o papel.


-- ─────────────────────────────────────────────────────────────────────
-- 1. OS CLIENTES, com e-mail, num lugar só
--
-- Junta `hub_profiles` (o cadastro) com `auth.users` (o e-mail e o último
-- acesso) e diz, por pessoa, se ela USA o FINCASH e quantos leads deixou.
-- Fora as contas de demonstração, pela mesma regra das estatísticas.
-- ─────────────────────────────────────────────────────────────────────
create or replace function public.hub_clientes()
returns table (
  id            uuid,
  nome          text,
  email         text,
  telefone      text,
  cidade        text,
  uf            text,
  profissao     text,
  objetivo      text,
  papel         text,
  aceita_email  boolean,
  criado_em     timestamptz,
  ultimo_acesso timestamptz,
  ultimo_lancamento timestamptz,
  leads         bigint,
  mensagens     bigint
)
language sql
security definer
stable
set search_path = public
as $$
  select
    u.id,
    p.nome,
    u.email::text,
    p.telefone,
    p.cidade,
    p.uf,
    p.profissao,
    p.objetivo,
    coalesce(p.role, 'cliente'),
    coalesce(p.aceita_email, true),
    u.created_at,
    u.last_sign_in_at,
    (select max(l.criado_em) from public.fin_lancamentos l where l.user_id = u.id),
    (select count(*) from public.hub_leads hl
      where lower(btrim(hl.email)) = lower(btrim(u.email::text))),
    (select count(*) from public.hub_mensagens m
      where m.usuario_id = u.id
         or lower(btrim(m.para_email)) = lower(btrim(u.email::text)))
  from auth.users u
  left join public.hub_profiles p on p.id = u.id
  where not public.hub_eh_demo(u.email::text)
    and public.hub_papel() in ('admin', 'equipe')
  order by u.created_at desc;
$$;


-- ─────────────────────────────────────────────────────────────────────
-- 3. REGISTRAR UMA MENSAGEM ENVIADA
--
-- Chamada pela rota do servidor DEPOIS de tentar enviar, com sucesso ou
-- não. Quando a mensagem vai para um LEAD que ainda está em 'novo', ele
-- passa sozinho para 'falando' — responder é, por definição, começar a
-- conversa, e esquecer de marcar é o que deixa a lista mentir.
-- ─────────────────────────────────────────────────────────────────────
create or replace function public.hub_mensagem_registrar(
  p_para_email text,
  p_corpo      text,
  p_assunto    text default null,
  p_canal      text default 'email',
  p_lead_id    uuid default null,
  p_usuario_id uuid default null,
  p_erro       text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if public.hub_papel() not in ('admin', 'equipe') then
    raise exception 'Sem permissao para registrar mensagem.' using errcode = '42501';
  end if;

  insert into public.hub_mensagens
    (lead_id, usuario_id, para_email, canal, assunto, corpo, enviado_por, erro)
  values
    (p_lead_id, p_usuario_id, btrim(p_para_email), p_canal, p_assunto,
     p_corpo, auth.uid(), p_erro)
  returning id into v_id;

  if p_lead_id is not null and p_erro is null then
    update public.hub_leads
       set situacao    = 'falando',
           tratado_por = auth.uid(),
           tratado_em  = now()
     where id = p_lead_id
       and situacao = 'novo';
  end if;

  return v_id;
end;
$$;


-- ─────────────────────────────────────────────────────────────────────
-- 4. O HISTÓRICO DE UMA PESSOA
--
-- Por e-mail, e não por id: o mesmo humano aparece como lead (só e-mail)
-- e como cliente (conta). Buscar pelos dois junta as duas vidas dele.
-- ─────────────────────────────────────────────────────────────────────
create or replace function public.hub_mensagens_de(p_email text)
returns table (
  id          uuid,
  canal       text,
  assunto     text,
  corpo       text,
  criado_em   timestamptz,
  erro        text,
  enviado_por text
)
language sql
security definer
stable
set search_path = public
as $$
  select
    m.id, m.canal, m.assunto, m.corpo, m.criado_em, m.erro,
    coalesce(p.nome, u.email::text)
  from public.hub_mensagens m
  left join auth.users u          on u.id = m.enviado_por
  left join public.hub_profiles p on p.id = m.enviado_por
  where lower(btrim(m.para_email)) = lower(btrim(p_email))
    and public.hub_papel() in ('admin', 'equipe')
  order by m.criado_em desc
  limit 50;
$$;


-- ─────────────────────────────────────────────────────────────────────
-- 5. EDITAR O CADASTRO DE UM CLIENTE
--
-- ⚠️ NÃO MEXE NO E-MAIL. O e-mail é o login, e mora em `auth.users`:
-- trocá-lo por aqui deixaria a pessoa sem conseguir entrar, sem aviso. Se
-- precisar mudar, é pelo próprio cliente, que confirma pela caixa nova.
--
-- ⚠️ `insert ... on conflict`, e não `update`: a conta pode existir sem
-- perfil (quem entrou antes do gatilho de perfil existir). Um `update`
-- puro não acharia a linha e diria "salvo" sem ter salvado nada.
-- ─────────────────────────────────────────────────────────────────────
create or replace function public.hub_cliente_salvar(
  p_id           uuid,
  p_nome         text,
  p_telefone     text,
  p_cidade       text,
  p_uf           text,
  p_profissao    text,
  p_objetivo     text,
  p_aceita_email boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.hub_papel() not in ('admin', 'equipe') then
    raise exception 'Sem permissao para editar cliente.' using errcode = '42501';
  end if;

  if not exists (select 1 from auth.users where id = p_id) then
    raise exception 'Cliente nao encontrado.' using errcode = 'P0002';
  end if;

  insert into public.hub_profiles
    (id, nome, telefone, cidade, uf, profissao, objetivo, aceita_email)
  values
    (p_id, nullif(btrim(p_nome), ''), nullif(btrim(p_telefone), ''),
     nullif(btrim(p_cidade), ''), nullif(upper(btrim(p_uf)), ''),
     nullif(btrim(p_profissao), ''), nullif(btrim(p_objetivo), ''),
     coalesce(p_aceita_email, true))
  on conflict (id) do update set
    nome          = excluded.nome,
    telefone      = excluded.telefone,
    cidade        = excluded.cidade,
    uf            = excluded.uf,
    profissao     = excluded.profissao,
    objetivo      = excluded.objetivo,
    aceita_email  = excluded.aceita_email,
    atualizado_em = now();
end;
$$;


-- ─────────────────────────────────────────────────────────────────────
-- 6. TROCAR O PAPEL DE ALGUÉM — só admin
--
-- `equipe` edita cadastro e responde lead, mas não promove ninguém:
-- quem pode dar acesso total precisa ser quem já tem.
--
-- ⚠️ NINGUÉM TIRA O PRÓPRIO ADMIN. Sem esta trava, um clique errado no
-- próprio nome trancava a casa para fora do painel — e a única saída
-- seria SQL na mão no Supabase.
-- ─────────────────────────────────────────────────────────────────────
create or replace function public.hub_cliente_papel(p_id uuid, p_papel text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.hub_papel() <> 'admin' then
    raise exception 'So admin troca o papel de alguem.' using errcode = '42501';
  end if;

  if p_papel not in ('admin', 'equipe', 'cliente') then
    raise exception 'Papel invalido: %', p_papel using errcode = '22023';
  end if;

  if p_id = auth.uid() and p_papel <> 'admin' then
    raise exception 'Voce nao pode tirar o seu proprio acesso de admin.' using errcode = '42501';
  end if;

  insert into public.hub_profiles (id, role)
  values (p_id, p_papel)
  on conflict (id) do update set role = excluded.role;
end;
$$;


-- ─────────────────────────────────────────────────────────────────────
-- 7. EDITAR E APAGAR LEAD
--
-- Apagar é DE VERDADE, e por isso a tela pede confirmação. Serve para o
-- lead de teste, o e-mail digitado errado, o pedido de "me tirem da lista".
-- As mensagens já mandadas a ele ficam (`on delete set null`): o registro do
-- que a casa disse não some junto.
-- ─────────────────────────────────────────────────────────────────────
create or replace function public.hub_lead_editar(
  p_id       uuid,
  p_nome     text,
  p_email    text,
  p_telefone text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.hub_papel() not in ('admin', 'equipe') then
    raise exception 'Sem permissao para editar lead.' using errcode = '42501';
  end if;

  if char_length(btrim(coalesce(p_email, ''))) < 3 or position('@' in p_email) = 0 then
    raise exception 'E-mail invalido.' using errcode = '22023';
  end if;

  update public.hub_leads
     set nome     = nullif(btrim(p_nome), ''),
         email    = lower(btrim(p_email)),
         telefone = nullif(btrim(p_telefone), '')
   where id = p_id;

  if not found then
    raise exception 'Lead nao encontrado.' using errcode = 'P0002';
  end if;
end;
$$;

create or replace function public.hub_lead_apagar(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.hub_papel() not in ('admin', 'equipe') then
    raise exception 'Sem permissao para apagar lead.' using errcode = '42501';
  end if;

  delete from public.hub_leads where id = p_id;

  if not found then
    raise exception 'Lead nao encontrado.' using errcode = 'P0002';
  end if;
end;
$$;


-- ─────────────────────────────────────────────────────────────────────
-- 8. OS AVISOS: o admin passa a ver TODOS, e a equipe também manda
--
-- ⚠️ A POLICY DE LEITURA ANTIGA FICA. Ela é a do CLIENTE (ver os próprios
-- avisos e os da casa). Esta se SOMA a ela — policies permissivas somam com
-- OR —, então o cliente continua vendo só o que é dele.
-- ─────────────────────────────────────────────────────────────────────
drop policy if exists "hub_notificacoes: equipe le tudo" on public.hub_notificacoes;
create policy "hub_notificacoes: equipe le tudo"
  on public.hub_notificacoes for select
  to authenticated
  using (public.hub_papel() in ('admin', 'equipe'));

drop policy if exists "hub_notificacoes: equipe escreve" on public.hub_notificacoes;
create policy "hub_notificacoes: equipe escreve"
  on public.hub_notificacoes for insert
  to authenticated
  with check (public.hub_papel() in ('admin', 'equipe'));


-- ─────────────────────────────────────────────────────────────────────
-- 9. PERMISSÕES
-- ─────────────────────────────────────────────────────────────────────
revoke all on function public.hub_clientes()                                  from public, anon;
revoke all on function public.hub_mensagem_registrar(text, text, text, text, uuid, uuid, text) from public, anon;
revoke all on function public.hub_mensagens_de(text)                          from public, anon;
revoke all on function public.hub_cliente_salvar(uuid, text, text, text, text, text, text, boolean) from public, anon;
revoke all on function public.hub_cliente_papel(uuid, text)                   from public, anon;
revoke all on function public.hub_lead_editar(uuid, text, text, text)         from public, anon;
revoke all on function public.hub_lead_apagar(uuid)                           from public, anon;

grant execute on function public.hub_clientes()                                  to authenticated;
grant execute on function public.hub_mensagem_registrar(text, text, text, text, uuid, uuid, text) to authenticated;
grant execute on function public.hub_mensagens_de(text)                          to authenticated;
grant execute on function public.hub_cliente_salvar(uuid, text, text, text, text, text, text, boolean) to authenticated;
grant execute on function public.hub_cliente_papel(uuid, text)                   to authenticated;
grant execute on function public.hub_lead_editar(uuid, text, text, text)         to authenticated;
grant execute on function public.hub_lead_apagar(uuid)                           to authenticated;


-- ─────────────────────────────────────────────────────────────────────
-- 10. CONFERÊNCIA — tem de voltar 7 funções.
-- ─────────────────────────────────────────────────────────────────────
select p.proname as funcao
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public'
   and p.proname in (
     'hub_clientes', 'hub_mensagem_registrar', 'hub_mensagens_de',
     'hub_cliente_salvar', 'hub_cliente_papel', 'hub_lead_editar', 'hub_lead_apagar'
   )
 order by p.proname;
