-- ═══════════════════════════════════════════════════════════════════════
-- CORREÇÃO: APAGAR LANÇAMENTO ESTAVA QUEBRADO
--
-- ⚠️ O SINTOMA, e por que ninguém percebeu: a pessoa liga o modo de
-- apagar, toca na lixeira da linha e NADA ACONTECE. O lançamento continua
-- lá. Nenhuma mensagem de erro aparece na tela — a falha morre no console
-- do navegador, onde cliente nenhum olha.
--
-- ⚠️ A CAUSA está no próprio `fincash_lixeira.sql`, e é sutil:
--
--     create policy "fincash: lixeira invisivel" on fin_lancamentos
--       as restrictive for select using (apagado_em is null);
--
-- No PostgreSQL, um UPDATE valida a linha RESULTANTE contra as policies.
-- Apagar é justamente preencher `apagado_em` — então a linha resultante
-- viola a policy que exige `apagado_em is null`, e o banco recusa com
--
--     42501: new row violates row-level security policy
--
-- O arquivo da lixeira previu esse efeito para LISTAR e RESTAURAR, e criou
-- funções `security definer` para as duas. A operação que MANDA para a
-- lixeira ficou de fora e continuou fazendo UPDATE direto — que é
-- exatamente a que o botão da tela usa.
--
-- ⚠️ A FUNÇÃO CHECA `auth.uid()` NA PRIMEIRA LINHA, como as outras da
-- lixeira. `security definer` sem esse filtro não é conveniência: é
-- escalação de privilégio, porque passaria a deixar qualquer sessão apagar
-- lançamento de qualquer pessoa.
--
-- Rode no SQL Editor do projeto hjikeevfzfswqydduars.
-- ═══════════════════════════════════════════════════════════════════════

create or replace function public.fin_lixeira_mandar(p_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.fin_lancamentos
     set apagado_em = now()
   where id = p_id
     and user_id = auth.uid()
     and apagado_em is null;
$$;

comment on function public.fin_lixeira_mandar(uuid) is
  'Manda um lançamento para a lixeira. Existe porque a policy restritiva "lixeira invisivel" recusa o UPDATE direto: a linha resultante tem apagado_em preenchido e viola a própria policy.';

revoke all on function public.fin_lixeira_mandar(uuid) from public;
grant execute on function public.fin_lixeira_mandar(uuid) to authenticated;


-- ── CONFERÊNCIA ───────────────────────────────────────────────────────
-- Tem de voltar uma linha, com 1.
select 'fin_lixeira_mandar criada' as o_que, count(*) as quantas
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and p.proname = 'fin_lixeira_mandar';
