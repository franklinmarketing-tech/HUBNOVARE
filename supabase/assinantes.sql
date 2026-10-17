-- ============================================================================
-- Quem paga, quem está testando, quem venceu — e como liberar alguém
-- ----------------------------------------------------------------------------
-- Rodar UMA vez no SQL Editor do Supabase (projeto hjikeevfzfswqydduars).
-- É idempotente: pode rodar de novo sem estragar nada.
--
-- POR QUE ISTO EXISTE
-- Hoje, quando alguém paga, a liberação é feita À MÃO dentro do painel do
-- Supabase: um UPDATE em hub_profiles. Isso significa que a operação de
-- cobrança da empresa depende de alguém lembrar a sintaxe de um UPDATE, sem
-- registro de quem fez, quando e por quê. Para uma tela de dinheiro, isso não
-- serve — nem depois que houver checkout automático, porque reembolso,
-- cortesia e conta de equipe continuam sendo liberação manual.
--
-- O PROBLEMA QUE ESTA FUNÇÃO RESOLVE
-- O estado de um assinante mora em DOIS lugares, por herança:
--   • hub_profiles          → plano 'pro' e plano_expira_em  (o Hub)
--   • vidaplan_subscriptions → o teste de 7 dias             (o Vida Plan)
-- E o e-mail não mora em nenhum dos dois: está em auth.users, que o PostgREST
-- não expõe. Sem juntar os três, a tela mostraria "plano free" para quem está
-- no meio do teste, ou uma lista de nomes sem como identificar ninguém.
--
-- A regra de leitura é a MESMA de src/lib/trial.ts, de propósito. Se as duas
-- divergirem, o painel diz uma coisa e o app faz outra — e o cliente que
-- reclamar vai estar certo.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. A lista, com o estado já resolvido
-- ----------------------------------------------------------------------------
-- `security definer` porque precisa ler auth.users, fora do alcance do
-- PostgREST. A trava está DENTRO da função: sem papel de admin, ela devolve
-- zero linhas — nunca um erro, para não virar oráculo de "existe admin aqui".
create or replace function public.hub_assinantes()
returns table (
  id              uuid,
  nome            text,
  email           text,
  papel           text,
  plano           text,
  plano_expira_em timestamptz,
  trial_until     timestamptz,
  criado_em       timestamptz,
  -- 'pagante' | 'equipe' | 'teste' | 'vencido' | 'sem_acesso'
  estado          text
)
language sql
security definer
stable
set search_path = public
as $$
  select
    p.id,
    p.nome,
    u.email::text,
    p.role                                as papel,
    p.plano,
    p.plano_expira_em,
    s.trial_until,
    u.created_at                          as criado_em,
    case
      when p.role in ('admin', 'equipe')                              then 'equipe'
      when p.plano = 'pro'
       and (p.plano_expira_em is null or p.plano_expira_em > now())    then 'pagante'
      when s.status = 'trial' and s.trial_until > now()                then 'teste'
      when s.trial_until is not null                                   then 'vencido'
      else 'sem_acesso'
    end                                   as estado
  from public.hub_profiles p
  join auth.users u                        on u.id = p.id
  left join public.vidaplan_subscriptions s on s.user_id = p.id
  where public.hub_papel() = 'admin'
  order by u.created_at desc;
$$;

revoke all on function public.hub_assinantes() from public, anon;
grant execute on function public.hub_assinantes() to authenticated;


-- ----------------------------------------------------------------------------
-- 2. O registro de quem liberou
-- ----------------------------------------------------------------------------
-- Mexer no acesso pago de alguém é mexer em dinheiro. Sem registro, a única
-- resposta possível para "por que esta conta está liberada?" seria dar de
-- ombros. Uma linha por ação, e nada aqui é apagável pela tela.
create table if not exists public.hub_liberacoes (
  id          uuid primary key default gen_random_uuid(),
  alvo_id     uuid not null references public.hub_profiles(id) on delete cascade,
  feito_por   uuid not null references public.hub_profiles(id),
  -- 'liberou' | 'cortou'
  acao        text not null check (acao in ('liberou', 'cortou')),
  -- Até quando o acesso vale. Nulo em 'cortou', e em liberação sem prazo.
  ate         timestamptz,
  -- Por quê. Escrito por quem clicou: "pagou por PIX", "cortesia", "reembolso".
  motivo      text not null default '',
  criado_em   timestamptz not null default now()
);

comment on table public.hub_liberacoes is
  'Trilha de auditoria de quem mexeu no acesso pago de quem, e por quê.';

create index if not exists hub_liberacoes_alvo_idx
  on public.hub_liberacoes (alvo_id, criado_em desc);

alter table public.hub_liberacoes enable row level security;

drop policy if exists "liberacoes: admin le" on public.hub_liberacoes;
create policy "liberacoes: admin le"
  on public.hub_liberacoes for select
  using (public.hub_papel() = 'admin');

-- Só INSERT, e nunca update/delete: registro que se apaga não é registro.
drop policy if exists "liberacoes: admin grava" on public.hub_liberacoes;
create policy "liberacoes: admin grava"
  on public.hub_liberacoes for insert
  with check (public.hub_papel() = 'admin' and feito_por = auth.uid());


-- ----------------------------------------------------------------------------
-- 3. A ação, numa transação só
-- ----------------------------------------------------------------------------
-- Mudar o plano e escrever o registro têm de acontecer juntos. Feito em duas
-- chamadas separadas do navegador, a segunda pode falhar e sobra um acesso
-- liberado sem nenhuma explicação de quem o liberou.
create or replace function public.hub_definir_acesso(
  p_alvo   uuid,
  p_meses  int,      -- 0 (ou negativo) corta o acesso
  p_motivo text default ''
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ate timestamptz;
begin
  if public.hub_papel() <> 'admin' then
    raise exception 'Apenas admin pode mexer no acesso.'
      using errcode = '42501';
  end if;

  if p_meses > 0 then
    -- Soma sobre o que a pessoa JÁ tem, quando ainda está valendo: renovar
    -- quem tem 10 dias de crédito não pode apagar esses 10 dias.
    select greatest(coalesce(plano_expira_em, now()), now()) + (p_meses || ' months')::interval
      into v_ate
      from public.hub_profiles
     where id = p_alvo;

    update public.hub_profiles
       set plano = 'pro', plano_expira_em = v_ate
     where id = p_alvo;

    insert into public.hub_liberacoes (alvo_id, feito_por, acao, ate, motivo)
    values (p_alvo, auth.uid(), 'liberou', v_ate, p_motivo);
  else
    update public.hub_profiles
       set plano = 'free', plano_expira_em = null
     where id = p_alvo;

    insert into public.hub_liberacoes (alvo_id, feito_por, acao, ate, motivo)
    values (p_alvo, auth.uid(), 'cortou', null, p_motivo);
  end if;
end;
$$;

revoke all on function public.hub_definir_acesso(uuid, int, text) from public, anon;
grant execute on function public.hub_definir_acesso(uuid, int, text) to authenticated;


-- ----------------------------------------------------------------------------
-- Conferência
-- ----------------------------------------------------------------------------
-- Deve devolver a sua própria conta com estado 'equipe' (você é admin).
select nome, email, estado, plano_expira_em
  from public.hub_assinantes()
 limit 5;
