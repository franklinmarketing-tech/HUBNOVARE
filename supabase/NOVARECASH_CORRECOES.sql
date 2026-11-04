-- NOVARECASH: CORREÇÕES DA VARREDURA (04/11/2026 18:52). Só os 4 arquivos que mudaram, na ordem.
-- ⚠️ Fecha a falha da conta compartilhada. Cole inteiro no SQL Editor (hjikeevfzfswqydduars) e clique em Run.

-- ===== novarecash.sql =====
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- NOVARECASH â€” ASSINATURA, ACESSO E O DIÃRIO DA HOTMART (03/11/2026)
--
-- O NovareCash Ã© o produto PAGO da Novare (Open Finance + WhatsApp + IA); o
-- FINCASH continua gratuito. Quem pagou Ã© decidido AQUI, no banco â€” nunca num
-- `if` de tela.
--
-- COMO O ACESSO NASCE: a Hotmart avisa a rota /api/novarecash/hotmart a cada
-- compra, renovaÃ§Ã£o, cancelamento ou reembolso. A rota grava em
-- `ncash_assinantes` (uma linha por e-mail, o estado de hoje) e guarda o aviso
-- cru em `ncash_hotmart_eventos` (o diÃ¡rio, para auditoria).
--
-- âš ï¸ A CHAVE Ã‰ O E-MAIL, NÃƒO O user_id: quem compra na Hotmart muitas vezes
-- ainda nÃ£o tem conta no Hub. Quando criar a conta com o MESMO e-mail, o acesso
-- jÃ¡ estÃ¡ lÃ¡ â€” `ncash_tem_acesso()` compara com `auth.email()`.
--
-- CANCELOU A ASSINATURA â‰  PERDEU O ACESSO: quem cancela usa atÃ© `expira_em`
-- (o perÃ­odo que jÃ¡ pagou). REEMBOLSO e CHARGEBACK cortam na hora.
--
-- A EQUIPE (admin/equipe) sempre tem acesso, para dar suporte.
--
-- Rode no SQL Editor do projeto hjikeevfzfswqydduars. Ã‰ seguro rodar de novo.
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

create table if not exists public.ncash_assinantes (
  email         text primary key,                 -- sempre minÃºsculo (a rota normaliza)
  nome          text,
  status        text not null default 'ativa'
                check (status in ('ativa', 'cancelada', 'atrasada', 'reembolsada', 'chargeback')),
  plano         text,                             -- 'mensal' | 'anual' (vem do nome do plano na Hotmart)
  expira_em     timestamptz,                      -- atÃ© quando vale o que jÃ¡ foi pago
  assinatura    text,                             -- cÃ³digo do assinante na Hotmart
  ultima_transacao text,
  comprou_em    timestamptz,
  atualizado_em timestamptz not null default now()
);

create table if not exists public.ncash_hotmart_eventos (
  id          bigserial primary key,
  evento      text not null,
  email       text,
  transacao   text,
  payload     jsonb not null,
  recebido_em timestamptz not null default now()
);
create index if not exists ncash_hotmart_eventos_email_idx on public.ncash_hotmart_eventos (email, recebido_em desc);

alter table public.ncash_assinantes enable row level security;
alter table public.ncash_hotmart_eventos enable row level security;

-- A pessoa lÃª a PRÃ“PRIA assinatura (para a tela "Minha assinatura"); a equipe lÃª todas.
-- NinguÃ©m escreve pelo navegador: sÃ³ a rota da Hotmart, com a chave de serviÃ§o.
drop policy if exists "ncash: le a propria" on public.ncash_assinantes;
create policy "ncash: le a propria" on public.ncash_assinantes
  for select to authenticated
  using (lower(email) = lower(coalesce(auth.email(), '')) or public.hub_papel() in ('admin', 'equipe'));

drop policy if exists "ncash: equipe le eventos" on public.ncash_hotmart_eventos;
create policy "ncash: equipe le eventos" on public.ncash_hotmart_eventos
  for select to authenticated
  using (public.hub_papel() in ('admin', 'equipe'));

-- A REGRA DO ACESSO, numa funÃ§Ã£o sÃ³ (a tela, a IA e o WhatsApp perguntam a ela).
create or replace function public.ncash_tem_acesso_email(p_email text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.ncash_assinantes a
     where a.email = lower(coalesce(p_email, ''))
       and a.status in ('ativa', 'cancelada', 'atrasada')
       and (a.expira_em is null or a.expira_em > now())
  );
$$;

-- âš ï¸ SÃ“ CRIA SE AINDA NÃƒO EXISTIR (04/11/2026): `novarecash_compartilhar.sql`
-- substitui esta funÃ§Ã£o por uma que tambÃ©m deixa entrar o MEMBRO da conta
-- compartilhada. Com `create or replace` aqui, rodar este arquivo de novo
-- depois daquele voltava a versÃ£o curta â€” e o convidado era barrado na porta
-- do app sem nenhum erro aparecer.
do $do$
begin
  if to_regprocedure('public.ncash_tem_acesso()') is null then
    execute $f$
      create function public.ncash_tem_acesso()
      returns boolean
      language sql
      stable
      security definer
      set search_path = public
      as $$
        select coalesce(public.hub_papel() in ('admin', 'equipe'), false)
            or public.ncash_tem_acesso_email(auth.email());
      $$
    $f$;
  end if;
end $do$;

revoke all on function public.ncash_tem_acesso_email(text) from public, anon, authenticated;
-- âš ï¸ `revoke ... from public` tira de TODOS os papÃ©is, inclusive o da chave de serviÃ§o: o servidor do
-- WhatsApp (que nÃ£o tem sessÃ£o de usuÃ¡rio) pergunta por e-mail, entÃ£o o service_role precisa do grant.
grant execute on function public.ncash_tem_acesso_email(text) to service_role;
revoke all on function public.ncash_tem_acesso() from public, anon;
grant execute on function public.ncash_tem_acesso() to authenticated;

-- ConferÃªncia: as duas tabelas e a funÃ§Ã£o existem.
select
  to_regclass('public.ncash_assinantes')      is not null as assinantes,
  to_regclass('public.ncash_hotmart_eventos') is not null as eventos,
  to_regprocedure('public.ncash_tem_acesso()') is not null as funcao_acesso;


-- ===== novarecash_dados.sql =====
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- NOVARECASH â€” OS DADOS PRÃ“PRIOS DO APP (03/11/2026)
--
-- DecisÃ£o do dono: o NovareCash Ã© OUTRO app, sem o FINCASH dentro. Ele tem o
-- prÃ³prio extrato, que enche sozinho pelo banco (Open Finance) e pelo WhatsApp,
-- e aceita lanÃ§amento Ã  mÃ£o. Nada aqui lÃª ou escreve nas tabelas `fin_*`.
--
-- âš ï¸ PRIVACIDADE: diferente do FINCASH, a EQUIPE NÃƒO LÃŠ estes dados. SÃ³ o dono.
-- (No FINCASH a equipe lÃª para escrever a revisÃ£o do plano; aqui nÃ£o hÃ¡ esse
-- serviÃ§o, e a regra mais estreita evita misturar dados de clientes na tela de
-- quem Ã© da equipe.)
--
-- REGRA DO MODELO (a mesma do FINCASH, por ser a que nÃ£o erra): `valor` Ã©
-- SEMPRE positivo; o sinal vem de `tipo` ('entrada' | 'saida').
--
-- DEDUPLICAÃ‡ÃƒO: o que vem de fora (banco, WhatsApp) traz `externo_id`; o Ã­ndice
-- Ãºnico (user_id, origem, externo_id) impede a mesma transaÃ§Ã£o entrar duas vezes.
--
-- Rode DEPOIS de `novarecash.sql` e `novarecash_app.sql`. Seguro rodar de novo.
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

create table if not exists public.ncash_contas (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome          text not null,
  tipo          text not null default 'conta' check (tipo in ('conta', 'cartao', 'investimento')),
  instituicao   text,
  origem        text not null default 'manual' check (origem in ('manual', 'openfinance')),
  externo_id    text,                       -- id da conta no Open Finance
  saldo         numeric(14, 2),             -- Ãºltimo saldo conhecido (banco) ou informado
  saldo_em      timestamptz,
  ativa         boolean not null default true,
  criado_em     timestamptz not null default now()
);
create unique index if not exists ncash_contas_externo_uq on public.ncash_contas (user_id, origem, externo_id) where externo_id is not null;

create table if not exists public.ncash_transacoes (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  conta_id      uuid references public.ncash_contas (id) on delete set null,
  data          date not null,
  descricao     text not null,
  valor         numeric(14, 2) not null check (valor > 0),
  tipo          text not null check (tipo in ('entrada', 'saida')),
  categoria     text not null default 'outros',   -- chave de CATEGORIAS em src/lib/novarecash/categorias.ts
  origem        text not null default 'manual' check (origem in ('manual', 'whatsapp', 'openfinance')),
  externo_id    text,
  observacao    text,
  criado_em     timestamptz not null default now()
);
create unique index if not exists ncash_transacoes_externo_uq on public.ncash_transacoes (user_id, origem, externo_id) where externo_id is not null;
create index if not exists ncash_transacoes_user_data_idx on public.ncash_transacoes (user_id, data desc);

-- OrÃ§amento: um limite MENSAL por categoria (vale para todo mÃªs atÃ© mudar).
create table if not exists public.ncash_orcamentos (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  categoria  text not null,
  limite     numeric(14, 2) not null check (limite >= 0),
  primary key (user_id, categoria)
);

alter table public.ncash_contas enable row level security;
alter table public.ncash_transacoes enable row level security;
alter table public.ncash_orcamentos enable row level security;

-- âš ï¸ SÃ“ CRIA SE AINDA NÃƒO EXISTIR (04/11/2026): `novarecash_compartilhar.sql`
-- troca esta policy pela regra Ãºnica `ncash_pode()`. Com o antigo
-- "drop + create", rodar ESTE arquivo de novo depois daquele voltava a regra
-- para "sÃ³ o prÃ³prio" â€” e quem estÃ¡ na conta compartilhada perdia o acesso aos
-- dados da casa sem nenhum erro aparecer.
do $$
declare
  t text;
begin
  foreach t in array array['ncash_contas', 'ncash_transacoes', 'ncash_orcamentos'] loop
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = t and policyname = 'ncash: dono manda') then
      execute format(
        'create policy "ncash: dono manda" on public.%I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())',
        t
      );
    end if;
  end loop;
end $$;

select
  to_regclass('public.ncash_contas')     is not null as contas,
  to_regclass('public.ncash_transacoes') is not null as transacoes,
  to_regclass('public.ncash_orcamentos') is not null as orcamentos;


-- ===== novarecash_compartilhar.sql =====
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- NOVARECASH â€” CONTA COMPARTILHADA (CASAL/FAMÃLIA) E A REGRA DE QUEM VÃŠ (04/11/2026)
--
-- O dono do NovareCash (quem paga) pode convidar UMA ou mais pessoas pelo
-- e-mail. Quem aceita passa a ver e lanÃ§ar no MESMO NovareCash do dono â€” o
-- extrato da casa fica junto. O convidado nÃ£o precisa assinar.
--
-- âš ï¸ A REGRA ÃšNICA DE ACESSO: `ncash_pode(dono uuid)`. Toda tabela `ncash_*`
-- com dado financeiro usa ela na policy â€” e toda tabela NOVA tambÃ©m deve usar.
-- Ela Ã© verdadeira para o prÃ³prio dono e para membro ACEITO do grupo dele.
--
-- COMO SE GRAVA: as linhas continuam com `user_id` = o DONO do NovareCash
-- (nÃ£o quem digitou). O app descobre de quem Ã© o NovareCash que estÃ¡ aberto com
-- `ncash_dono_atual()` e grava com esse id; a policy confere com `ncash_pode`.
--
-- A EQUIPE CONTINUA SEM LER (decisÃ£o de 03/11): nada de hub_papel() aqui.
--
-- Rode DEPOIS de `novarecash_dados.sql`. Seguro rodar de novo.
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

create table if not exists public.ncash_membros (
  dono_id       uuid not null references auth.users (id) on delete cascade,
  email         text not null,                    -- minÃºsculo; o convite Ã© pelo e-mail
  membro_id     uuid references auth.users (id) on delete cascade, -- preenchido ao aceitar
  status        text not null default 'convidado' check (status in ('convidado', 'aceito')),
  convidado_em  timestamptz not null default now(),
  aceito_em     timestamptz,
  primary key (dono_id, email)
);
create index if not exists ncash_membros_membro_idx on public.ncash_membros (membro_id) where status = 'aceito';

alter table public.ncash_membros enable row level security;

-- O dono vÃª os convites dele, convida e tira; o convidado vÃª o convite que Ã© para o e-mail dele.
--
-- âš ï¸ SEM "for all" (corrigido em 04/11/2026): com escrita livre, o dono podia
-- gravar pela API um convite JÃ ACEITO, com `membro_id` = o id de qualquer
-- pessoa. A vÃ­tima passava a abrir o NovareCash DELE (`ncash_dono_atual()`) e
-- tudo o que lanÃ§asse â€” no app ou pelo WhatsApp â€” caÃ­a na conta de quem a
-- "convidou". Agora o dono sÃ³ INSERE convite pendente (sem `membro_id`) e
-- APAGA; o aceite passa SÃ“ por `ncash_aceitar_convite()`, que confere o e-mail
-- de quem aceita. NÃ£o hÃ¡ policy de UPDATE: ninguÃ©m altera convite pela API.
drop policy if exists "ncash membros: dono gerencia" on public.ncash_membros;
drop policy if exists "ncash membros: dono le" on public.ncash_membros;
create policy "ncash membros: dono le" on public.ncash_membros
  for select to authenticated
  using (dono_id = auth.uid());

drop policy if exists "ncash membros: dono convida" on public.ncash_membros;
create policy "ncash membros: dono convida" on public.ncash_membros
  for insert to authenticated
  with check (
    dono_id = auth.uid()
    and status = 'convidado'
    and membro_id is null
    and aceito_em is null
    and email = lower(email)
  );

drop policy if exists "ncash membros: dono tira" on public.ncash_membros;
create policy "ncash membros: dono tira" on public.ncash_membros
  for delete to authenticated
  using (dono_id = auth.uid());

-- Faxina do buraco acima: aceite cujo `membro_id` nÃ£o Ã© a dona do e-mail
-- convidado sÃ³ pode ter sido forjado. NÃ£o apaga nada legÃ­timo (o aceite de
-- verdade grava o prÃ³prio id em convite do prÃ³prio e-mail).
delete from public.ncash_membros m
 using auth.users u
 where m.membro_id = u.id
   and lower(coalesce(u.email, '')) <> lower(m.email);

drop policy if exists "ncash membros: convidado le" on public.ncash_membros;
create policy "ncash membros: convidado le" on public.ncash_membros
  for select to authenticated
  using (lower(email) = lower(coalesce(auth.email(), '')));

-- A REGRA: posso mexer nos dados deste dono?
create or replace function public.ncash_pode(p_dono uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_dono = auth.uid()
      or exists (
        select 1 from public.ncash_membros m
         where m.dono_id = p_dono and m.membro_id = auth.uid() and m.status = 'aceito'
      );
$$;
revoke all on function public.ncash_pode(uuid) from public, anon;
grant execute on function public.ncash_pode(uuid) to authenticated;

-- De quem Ã© o NovareCash que estÃ¡ aberto? O do grupo que aceitei; senÃ£o, o meu.
create or replace function public.ncash_dono_atual()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select m.dono_id from public.ncash_membros m
      where m.membro_id = auth.uid() and m.status = 'aceito'
      order by m.aceito_em desc limit 1),
    auth.uid()
  );
$$;
revoke all on function public.ncash_dono_atual() from public, anon;
grant execute on function public.ncash_dono_atual() to authenticated;

-- Aceitar o convite que estÃ¡ no meu e-mail.
create or replace function public.ncash_aceitar_convite(p_dono uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.ncash_membros
     set membro_id = auth.uid(), status = 'aceito', aceito_em = now()
   where dono_id = p_dono and lower(email) = lower(coalesce(auth.email(), '')) and dono_id <> auth.uid();
  return found;
end;
$$;
revoke all on function public.ncash_aceitar_convite(uuid) from public, anon;
grant execute on function public.ncash_aceitar_convite(uuid) to authenticated;

-- O convidado tambÃ©m usa o app: a porta (`ncash_tem_acesso`) passa a deixar
-- entrar quem Ã© membro aceito de um dono que tem acesso.
create or replace function public.ncash_tem_acesso()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.hub_papel() in ('admin', 'equipe'), false)
      or public.ncash_tem_acesso_email(auth.email())
      or exists (
        select 1 from public.ncash_membros m
          join auth.users u on u.id = m.dono_id
         where m.membro_id = auth.uid() and m.status = 'aceito'
           and public.ncash_tem_acesso_email(u.email)
      );
$$;

-- As policies das tabelas que jÃ¡ existem passam a usar a regra Ãºnica.
drop policy if exists "ncash: dono manda" on public.ncash_contas;
create policy "ncash: dono manda" on public.ncash_contas
  for all to authenticated using (public.ncash_pode(user_id)) with check (public.ncash_pode(user_id));

drop policy if exists "ncash: dono manda" on public.ncash_transacoes;
create policy "ncash: dono manda" on public.ncash_transacoes
  for all to authenticated using (public.ncash_pode(user_id)) with check (public.ncash_pode(user_id));

drop policy if exists "ncash: dono manda" on public.ncash_orcamentos;
create policy "ncash: dono manda" on public.ncash_orcamentos
  for all to authenticated using (public.ncash_pode(user_id)) with check (public.ncash_pode(user_id));

select
  to_regclass('public.ncash_membros') is not null as membros,
  to_regprocedure('public.ncash_pode(uuid)') is not null as regra,
  to_regprocedure('public.ncash_dono_atual()') is not null as dono_atual,
  not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'ncash_membros'
               and cmd in ('ALL', 'UPDATE')) as membros_sem_escrita_livre;


-- ===== novarecash_cartoes.sql =====
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- NOVARECASH â€” CARTÃ•ES COM FATURA, CONTAS A PAGAR E LEMBRETE NO WHATSAPP (04/11/2026)
--
-- ORDEM DE RODAR (SQL Editor do Supabase, projeto hjikeevfzfswqydduars):
--   1. `novarecash.sql`, `novarecash_app.sql`
--   2. `novarecash_dados.sql`        â€” cria `ncash_contas` e `ncash_transacoes`
--   3. `novarecash_compartilhar.sql` â€” cria a regra `ncash_pode()`
--   4. ESTE ARQUIVO                  â€” depende dos passos 2 e 3
-- Seguro rodar de novo: sÃ³ `if not exists` e `drop policy if exists`.
--
-- O QUE ENTRA
-- 1. CartÃ£o: dia de fechamento, dia de vencimento e limite (em `ncash_contas`).
-- 2. Compra parcelada: `parcela`, `parcelas` e `compra_id` (em `ncash_transacoes`).
--    "R$ 600 em 6x" = 6 lanÃ§amentos, um por fatura, com o mesmo `compra_id`.
--    O "Pagar fatura" tambÃ©m usa `compra_id` para ligar as duas pernas
--    (saÃ­da na conta + entrada no cartÃ£o), e desfazer apaga as duas.
--    A FATURA NÃƒO Ã‰ GUARDADA: sai da data de cada lanÃ§amento e do fechamento
--    (regra em `src/lib/novarecash/cartoes.ts`).
-- 3. Contas a pagar (`ncash_contas_pagar`) e os pagamentos por competÃªncia
--    (`ncash_contas_pagas`). O Ã­ndice Ãºnico (conta, competÃªncia) impede pagar
--    o mesmo mÃªs duas vezes.
-- 4. `ncash_lembretes_enviados`: um lembrete por dono por dia, no mÃ¡ximo.
--
-- ACESSO: toda tabela nova usa a regra Ãºnica `ncash_pode(user_id)` (dono ou
-- membro aceito da conta compartilhada). `user_id` = o DONO do NovareCash.
-- A EQUIPE NÃƒO LÃŠ (decisÃ£o de 03/11). O lembrete roda com a chave de serviÃ§o.
--
-- A CATEGORIA `pagamento_fatura` mora no cÃ³digo (`categorias.ts`), nÃ£o aqui:
-- `ncash_transacoes.categoria` Ã© texto livre.
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

-- â”€â”€ 1. CartÃ£o: fechamento, vencimento e limite â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
alter table public.ncash_contas
  add column if not exists fecha_dia smallint check (fecha_dia between 1 and 31);
alter table public.ncash_contas
  add column if not exists vence_dia smallint check (vence_dia between 1 and 31);
alter table public.ncash_contas
  add column if not exists limite numeric(14, 2) check (limite >= 0);

-- â”€â”€ 2. Compra parcelada â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
alter table public.ncash_transacoes add column if not exists parcela smallint;
alter table public.ncash_transacoes add column if not exists parcelas smallint;
alter table public.ncash_transacoes add column if not exists compra_id uuid;

-- Parcela coerente: as duas vazias (Ã  vista) ou 1 â‰¤ parcela â‰¤ parcelas â‰¤ 72.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'ncash_transacoes_parcela_ok') then
    alter table public.ncash_transacoes add constraint ncash_transacoes_parcela_ok check (
      (parcela is null and parcelas is null)
      or (parcelas between 1 and 72 and parcela between 1 and parcelas)
    );
  end if;
end $$;

create index if not exists ncash_transacoes_compra_idx
  on public.ncash_transacoes (user_id, compra_id) where compra_id is not null;
create index if not exists ncash_transacoes_conta_data_idx
  on public.ncash_transacoes (conta_id, data);

-- â”€â”€ 3. Contas a pagar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
create table if not exists public.ncash_contas_pagar (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  descricao    text not null check (length(trim(descricao)) between 1 and 120),
  valor        numeric(14, 2) not null check (valor > 0),
  categoria    text not null default 'outros',      -- chave de `categorias.ts`
  recorrencia  text not null default 'mensal' check (recorrencia in ('mensal', 'unica')),
  vence_dia    smallint check (vence_dia between 1 and 31),   -- mensal
  vence_em     date,                                          -- Ãºnica
  conta_id     uuid references public.ncash_contas (id) on delete set null, -- de onde sai
  ativa        boolean not null default true,
  criado_em    timestamptz not null default now(),
  constraint ncash_contas_pagar_vencimento_ok check (
    (recorrencia = 'mensal' and vence_dia is not null)
    or (recorrencia = 'unica' and vence_em is not null)
  )
);
create index if not exists ncash_contas_pagar_user_idx on public.ncash_contas_pagar (user_id);

create table if not exists public.ncash_contas_pagas (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  conta_pagar_id  uuid not null references public.ncash_contas_pagar (id) on delete cascade,
  competencia     text not null check (competencia ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),  -- "2026-11"
  transacao_id    uuid references public.ncash_transacoes (id) on delete set null,
  pago_em         date not null,
  valor           numeric(14, 2) not null check (valor > 0),
  criado_em       timestamptz not null default now()
);
-- Ãšnico POR DONO (04/11/2026): sem o `user_id` no Ã­ndice, quem conhecesse o id
-- de uma conta alheia (um ex-membro da conta compartilhada, por exemplo) podia
-- gravar um "pago" na PRÃ“PRIA conta com aquele id e travar o "Paguei" do dono
-- ("jÃ¡ paga") sem a conta aparecer como paga. O pagamento legÃ­timo tem sempre o
-- mesmo `user_id` da conta, entÃ£o a garantia de "um por competÃªncia" continua.
drop index if exists public.ncash_contas_pagas_uq;
create unique index if not exists ncash_contas_pagas_dono_uq on public.ncash_contas_pagas (user_id, conta_pagar_id, competencia);
create index if not exists ncash_contas_pagas_user_idx on public.ncash_contas_pagas (user_id, competencia);

-- â”€â”€ 4. Lembretes enviados (um por dono por dia) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
create table if not exists public.ncash_lembretes_enviados (
  user_id          uuid not null references auth.users (id) on delete cascade,
  dia              date not null,                 -- o dia do envio, no fuso de SÃ£o Paulo
  contas           integer not null default 0,    -- quantas contas foram lembradas
  provedor_msg_id  text,
  criado_em        timestamptz not null default now(),
  primary key (user_id, dia)
);

-- â”€â”€ RLS: a regra Ãºnica â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
alter table public.ncash_contas_pagar enable row level security;
alter table public.ncash_contas_pagas enable row level security;
alter table public.ncash_lembretes_enviados enable row level security;

drop policy if exists "ncash: dono manda" on public.ncash_contas_pagar;
create policy "ncash: dono manda" on public.ncash_contas_pagar
  for all to authenticated using (public.ncash_pode(user_id)) with check (public.ncash_pode(user_id));

drop policy if exists "ncash: dono manda" on public.ncash_contas_pagas;
create policy "ncash: dono manda" on public.ncash_contas_pagas
  for all to authenticated using (public.ncash_pode(user_id)) with check (public.ncash_pode(user_id));

drop policy if exists "ncash: dono manda" on public.ncash_lembretes_enviados;
create policy "ncash: dono manda" on public.ncash_lembretes_enviados
  for all to authenticated using (public.ncash_pode(user_id)) with check (public.ncash_pode(user_id));

-- â”€â”€ ConferÃªncia: tudo deve voltar `true` â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
select
  exists (select 1 from information_schema.columns where table_schema = 'public'
           and table_name = 'ncash_contas' and column_name = 'fecha_dia')        as cartao_fechamento,
  exists (select 1 from information_schema.columns where table_schema = 'public'
           and table_name = 'ncash_contas' and column_name = 'limite')           as cartao_limite,
  exists (select 1 from information_schema.columns where table_schema = 'public'
           and table_name = 'ncash_transacoes' and column_name = 'compra_id')    as parcelas,
  to_regclass('public.ncash_contas_pagar')       is not null                     as contas_pagar,
  to_regclass('public.ncash_contas_pagas')       is not null                     as contas_pagas,
  to_regclass('public.ncash_lembretes_enviados') is not null                     as lembretes,
  (select count(*) from pg_policies where schemaname = 'public'
     and tablename in ('ncash_contas_pagar', 'ncash_contas_pagas', 'ncash_lembretes_enviados')
     and qual like '%ncash_pode%') = 3                                           as rls_ncash_pode;

