-- ═══════════════════════════════════════════════════════════════════════
-- NOVARECASH — O QUE A ÁREA DO APP PRECISA (03/11/2026)
--
-- ⚠️ ORDEM: rode DEPOIS de `supabase/novarecash.sql` (assinantes e a regra de
-- acesso). Este arquivo não depende de nenhuma tabela nova daquele, mas a área
-- do app só abre para quem `ncash_tem_acesso()` deixa — sem o primeiro, nada
-- daqui é alcançável.
--
-- Rode no SQL Editor do projeto hjikeevfzfswqydduars. É seguro rodar de novo
-- (idempotente: `if not exists`, `create or replace`, `drop policy if exists`).
--
-- O QUE TEM AQUI
--   1. `ncash_ia_uso` — a COTA DIÁRIA da IA, por pessoa. A IA custa por
--      pergunta; sem teto, um script ou um curioso insistente vira conta alta.
--   2. `ncash_ia_consumir(p_cota)` / `ncash_ia_devolver()` — o único jeito de
--      mexer no contador. Ninguém escreve na tabela pelo navegador.
--
-- O QUE NÃO TEM, de propósito: coluna de "id externo" em `fin_lancamentos`.
-- A importação do Open Finance reaproveita a dedup que o FINCASH já tem para o
-- OFX (`fin_import_itens`, índice único `(user_id, chave)`, em
-- `fincash_importacao.sql`), com a chave `of:<id da transação no banco>`. É a
-- mesma garantia — o banco recusa a segunda — e o "desfazer importação" do
-- FINCASH passa a valer também para o que veio do banco.
-- ═══════════════════════════════════════════════════════════════════════

-- ----------------------------------------------------------------------------
-- 1. A cota da IA
-- ----------------------------------------------------------------------------
-- Uma linha por pessoa por DIA DO BRASIL (não UTC: depois das 21h o dia da
-- Vercel já virou, e a cota "renovaria" três horas antes da meia-noite).
create table if not exists public.ncash_ia_uso (
  user_id   uuid not null references auth.users(id) on delete cascade,
  dia       date not null,
  contagem  int  not null default 0 check (contagem >= 0),
  atualizado_em timestamptz not null default now(),
  primary key (user_id, dia)
);

comment on table public.ncash_ia_uso is
  'Perguntas feitas à IA do NovareCash por pessoa e por dia (fuso de São Paulo). Só as funções ncash_ia_* escrevem.';

alter table public.ncash_ia_uso enable row level security;

-- A pessoa LÊ o próprio uso (a tela mostra "x de y hoje"); a equipe lê todos,
-- para suporte e para medir custo. Ninguém tem policy de escrita: a escrita
-- passa só pelas funções abaixo, que usam `auth.uid()` e não confiam em nada
-- que venha do navegador.
drop policy if exists "ncash ia: le o proprio" on public.ncash_ia_uso;
create policy "ncash ia: le o proprio" on public.ncash_ia_uso
  for select to authenticated
  using (user_id = auth.uid() or public.hub_papel() in ('admin', 'equipe'));

-- ----------------------------------------------------------------------------
-- 2. Consumir e devolver
-- ----------------------------------------------------------------------------
-- Conta UMA pergunta, atomicamente, só se ainda couber na cota. Devolve se
-- passou e quantas já foram usadas hoje.
--
-- POR QUE A CONTA É ANTES DE CHAMAR O MODELO, e não depois: contar depois deixa
-- uma janela em que dez abas perguntam ao mesmo tempo e todas passam. Contando
-- antes, o `on conflict ... where` do Postgres é quem decide, uma de cada vez.
-- Se o modelo falhar, a rota chama `ncash_ia_devolver()` — a pessoa não perde a
-- pergunta por erro nosso.
--
-- `p_cota` vem do servidor (constante `COTA_DIARIA_IA` em
-- `src/lib/novarecash/ia.ts`). Quem chamar a função direto pelo navegador com
-- uma cota inventada só consegue inflar o PRÓPRIO contador: a rota compara de
-- novo com a constante dela.
create or replace function public.ncash_ia_consumir(p_cota int)
returns table (permitido boolean, usadas int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dia  date := (now() at time zone 'America/Sao_Paulo')::date;
  v_usadas int;
begin
  if auth.uid() is null then
    raise exception 'sem sessão';
  end if;

  insert into public.ncash_ia_uso as u (user_id, dia, contagem)
  values (auth.uid(), v_dia, 1)
  on conflict (user_id, dia) do update
     set contagem = u.contagem + 1,
         atualizado_em = now()
   where u.contagem < greatest(coalesce(p_cota, 0), 0)
  returning u.contagem into v_usadas;

  if v_usadas is null then
    -- Não coube (o `where` do conflito barrou): devolve o que já foi usado.
    select contagem into v_usadas
      from public.ncash_ia_uso
     where user_id = auth.uid() and dia = v_dia;
    return query select false, coalesce(v_usadas, 0);
  else
    return query select (v_usadas <= greatest(coalesce(p_cota, 0), 0)), v_usadas;
  end if;
end $$;

-- Desfaz uma contagem de hoje (o modelo falhou, a pergunta não foi respondida).
create or replace function public.ncash_ia_devolver()
returns void
language sql
security definer
set search_path = public
as $$
  update public.ncash_ia_uso
     set contagem = greatest(contagem - 1, 0),
         atualizado_em = now()
   where user_id = auth.uid()
     and dia = (now() at time zone 'America/Sao_Paulo')::date;
$$;

revoke all on function public.ncash_ia_consumir(int) from public, anon;
grant execute on function public.ncash_ia_consumir(int) to authenticated;
revoke all on function public.ncash_ia_devolver() from public, anon;
grant execute on function public.ncash_ia_devolver() to authenticated;

-- Conferência: a tabela e as duas funções existem.
select
  to_regclass('public.ncash_ia_uso') is not null                    as tabela_cota,
  to_regprocedure('public.ncash_ia_consumir(integer)') is not null  as funcao_consumir,
  to_regprocedure('public.ncash_ia_devolver()') is not null         as funcao_devolver;
