-- ============================================================================
-- hub_eventos.acao GANHA "clicou" E "fechou" (05/11/2026)
-- ============================================================================
--
-- Para medir a venda e a captação (`src/lib/medir.ts`): quantas pessoas
-- VIRAM o pop-up da Black, o convite de saída e o balão de boas-vindas
-- ("abriu"), quantas CLICARAM ("clicou") e quantas FECHARAM ("fechou"), e
-- qual botão do /novarecash foi clicado ("venda:heroi", "venda:plano"...).
--
-- ⚠️ SEM ESTE ARQUIVO, "clicou" E "fechou" NÃO GRAVAM. A rota `/api/uso`
-- já aceita as duas; o banco recusa (erro 23514) e o evento se perde em
-- silêncio — o site não quebra, só não mede.
--
-- ⚠️ HÁ DUAS VERSÕES DA TABELA NO REPO: `hub_eventos.sql` (com check de quatro
-- ações) e `painel_admin_INSTALAR.sql` (sem check nenhum). Daqui não dá para
-- saber qual criou a de produção, então o PASSO 1 serve para as duas: apaga
-- QUALQUER check que fale de `acao` e põe um só, com nome fixo.
--
-- Nada de dado pessoal: o evento continua sendo só módulo + ação (+ o
-- usuario_id de quem está logado, que o gatilho `hub_eventos_barra_equipe`
-- usa para descartar a equipe).
--
-- Rode no SQL Editor do projeto hjikeevfzfswqydduars. É idempotente: pode
-- rodar de novo sem quebrar nada.
-- ============================================================================

-- PASSO 1 — o check da ação, com as seis.
do $$
declare
  r record;
begin
  for r in
    select c.conname
      from pg_constraint c
     where c.conrelid = 'public.hub_eventos'::regclass
       and c.contype = 'c'
       and pg_get_constraintdef(c.oid) ilike '%acao%'
  loop
    execute format('alter table public.hub_eventos drop constraint %I', r.conname);
  end loop;
end
$$;

-- `not valid`: vale para toda linha NOVA sem reler o histórico (que só tem
-- as quatro antigas). Uma linha velha fora da regra não derruba a instalação.
alter table public.hub_eventos
  add constraint hub_eventos_acao_valida
  check (acao in ('abriu', 'usou', 'salvou', 'exportou', 'clicou', 'fechou')) not valid;

-- PASSO 2 — o visitante ANÔNIMO grava.
-- Quase toda impressão de pop-up é de quem não está logado. `hub_eventos.sql`
-- já deixava (policy `hub_eventos_insert`); `painel_admin_INSTALAR.sql` só
-- deixa o logado gravar em nome próprio. Esta policy garante o anônimo SEM
-- dono e mantém o logado só em seu nome. Somar policy de insert só alarga o
-- que já era permitido nas duas versões; não abre leitura nenhuma.
drop policy if exists hub_eventos_grava_anonimo on public.hub_eventos;
create policy hub_eventos_grava_anonimo
  on public.hub_eventos for insert
  to anon, authenticated
  with check (usuario_id is null or usuario_id = auth.uid());

-- PASSO 3 — conferir: tem de aparecer `hub_eventos_acao_valida` com as seis.
select c.conname, pg_get_constraintdef(c.oid) as regra
  from pg_constraint c
 where c.conrelid = 'public.hub_eventos'::regclass
   and c.contype = 'c';

-- ============================================================================
-- PARA LER DEPOIS (não roda junto): o funil das janelas e dos botões de venda.
--
--   select modulo, acao, count(*) as eventos
--     from public.hub_eventos
--    where criado_em > now() - interval '30 days'
--      and (modulo in ('popup-black', 'convite-saida', 'balao-ola') or modulo like 'venda:%')
--    group by modulo, acao
--    order by modulo, acao;
-- ============================================================================
