-- ═══════════════════════════════════════════════════════════════════════
-- NOVARECASH — CONTA COMPARTILHADA (CASAL/FAMÍLIA) E A REGRA DE QUEM VÊ (04/11/2026)
--
-- O dono do NovareCash (quem paga) pode convidar UMA ou mais pessoas pelo
-- e-mail. Quem aceita passa a ver e lançar no MESMO NovareCash do dono — o
-- extrato da casa fica junto. O convidado não precisa assinar.
--
-- ⚠️ A REGRA ÚNICA DE ACESSO: `ncash_pode(dono uuid)`. Toda tabela `ncash_*`
-- com dado financeiro usa ela na policy — e toda tabela NOVA também deve usar.
-- Ela é verdadeira para o próprio dono e para membro ACEITO do grupo dele.
--
-- COMO SE GRAVA: as linhas continuam com `user_id` = o DONO do NovareCash
-- (não quem digitou). O app descobre de quem é o NovareCash que está aberto com
-- `ncash_dono_atual()` e grava com esse id; a policy confere com `ncash_pode`.
--
-- A EQUIPE CONTINUA SEM LER (decisão de 03/11): nada de hub_papel() aqui.
--
-- Rode DEPOIS de `novarecash_dados.sql`. Seguro rodar de novo.
-- ═══════════════════════════════════════════════════════════════════════

create table if not exists public.ncash_membros (
  dono_id       uuid not null references auth.users (id) on delete cascade,
  email         text not null,                    -- minúsculo; o convite é pelo e-mail
  membro_id     uuid references auth.users (id) on delete cascade, -- preenchido ao aceitar
  status        text not null default 'convidado' check (status in ('convidado', 'aceito')),
  convidado_em  timestamptz not null default now(),
  aceito_em     timestamptz,
  primary key (dono_id, email)
);
create index if not exists ncash_membros_membro_idx on public.ncash_membros (membro_id) where status = 'aceito';

alter table public.ncash_membros enable row level security;

-- O dono vê os convites dele, convida e tira; o convidado vê o convite que é para o e-mail dele.
--
-- ⚠️ SEM "for all" (corrigido em 04/11/2026): com escrita livre, o dono podia
-- gravar pela API um convite JÁ ACEITO, com `membro_id` = o id de qualquer
-- pessoa. A vítima passava a abrir o NovareCash DELE (`ncash_dono_atual()`) e
-- tudo o que lançasse — no app ou pelo WhatsApp — caía na conta de quem a
-- "convidou". Agora o dono só INSERE convite pendente (sem `membro_id`) e
-- APAGA; o aceite passa SÓ por `ncash_aceitar_convite()`, que confere o e-mail
-- de quem aceita. Não há policy de UPDATE: ninguém altera convite pela API.
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

-- Faxina do buraco acima: aceite cujo `membro_id` não é a dona do e-mail
-- convidado só pode ter sido forjado. Não apaga nada legítimo (o aceite de
-- verdade grava o próprio id em convite do próprio e-mail).
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

-- De quem é o NovareCash que está aberto? O do grupo que aceitei; senão, o meu.
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

-- Aceitar o convite que está no meu e-mail.
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

-- O convidado também usa o app: a porta (`ncash_tem_acesso`) passa a deixar
-- entrar quem é membro aceito de um dono que tem acesso.
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

-- As policies das tabelas que já existem passam a usar a regra única.
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
