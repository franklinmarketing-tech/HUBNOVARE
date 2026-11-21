-- ═══════════════════════════════════════════════════════════════════════
-- VISITA DE QUEM NÃO ESTÁ LOGADO VOLTA A CONTAR (21/11/2026)
--
-- O DEFEITO: desde `visitas_sem_equipe.sql` (30/10), o porteiro
-- `hub_eventos_barra_equipe` chama `hub_eh_equipe(...)` — e o papel `anon`
-- não tem permissão nessa função (o próprio arquivo a revogou). O Postgres
-- confere a permissão mesmo quando `usuario_id` é nulo, então TODA visita de
-- visitante sem conta era recusada ("permission denied for function
-- hub_eh_equipe", 42501). A aba Iscas do painel passou a contar só quem
-- estava logado.
--
-- A CORREÇÃO:
--   1. o porteiro olha `usuario_id` primeiro e só pergunta "é da equipe?"
--      quando há alguém logado; e roda como dono da função (security
--      definer), para a pergunta funcionar para qualquer papel;
--   2. o visitante sem conta pode gravar evento SEM DONO (usuario_id nulo) —
--      nunca em nome de outra pessoa.
--
-- Isto também deixa o site gravar a visita direto do navegador, sem passar
-- pelo servidor da Vercel a cada página (`gravarEvento`, em src/lib/uso.ts).
--
-- Rode no SQL Editor do projeto hjikeevfzfswqydduars. É seguro rodar de novo.
-- Não apaga nada.
-- ═══════════════════════════════════════════════════════════════════════

-- PASSO 1 — o porteiro, com o "tem dono?" antes de tudo.
create or replace function public.hub_eventos_barra_equipe()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.usuario_id is null then
    return new;
  end if;
  if public.hub_eh_equipe(new.usuario_id) then
    return null; -- visita da equipe: descartada em silêncio
  end if;
  return new;
end;
$$;

-- PASSO 2 — visitante sem conta grava só evento sem dono.
drop policy if exists "hub_eventos: anonimo grava sem dono" on public.hub_eventos;
create policy "hub_eventos: anonimo grava sem dono"
  on public.hub_eventos for insert
  to anon
  with check (usuario_id is null);

-- CONFERÊNCIA — deve listar a policy nova e as de antes.
select policyname, roles::text, cmd from pg_policies where tablename = 'hub_eventos';
