-- ═══════════════════════════════════════════════════════════════════════
-- MOVER UMA CONTA PARA O SUPORTE, À MÃO (pedido do dono, 21/10/2026)
-- O Jefferson apontou contas na aba Clientes que "pode excluir" — testes com
-- nome de gente (lucas.teste@, maria.endividada@) e uma que não é cliente.
--
-- ⚠️ NÃO APAGA NADA. A conta sai da aba Clientes e de toda contagem
-- (Saúde, Iscas — tudo que usa `hub_eh_interno`) e aparece em
-- /admin/suporte, de onde volta com um clique. Apagar de vez a conta de
-- alguém não tem desfazer; esconder tem.
--
-- Antes, conta interna era só o que a REGRA pegava (e-mail de teste, equipe,
-- domínio do app antigo). Agora também o que alguém da casa mover à mão.
--
-- Rode DEPOIS do contas_suporte.sql. Pode rodar de novo sem estrago.
-- ═══════════════════════════════════════════════════════════════════════

create table if not exists public.hub_contas_no_suporte (
  usuario_id  uuid primary key references auth.users (id) on delete cascade,
  movida_por  uuid references auth.users (id) on delete set null,
  movida_em   timestamptz not null default now()
);

-- Ninguém mexe direto: só pelas duas funções abaixo, que conferem o papel.
alter table public.hub_contas_no_suporte enable row level security;
revoke all on public.hub_contas_no_suporte from anon, authenticated;

-- A regra de conta interna passa a olhar também a lista feita à mão.
create or replace function public.hub_eh_interno(p_email text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.hub_eh_demo(p_email)
      or public.hub_lead_eh_teste(p_email, null)
      or exists (
           select 1 from auth.users u
             join public.hub_profiles p on p.id = u.id
            where lower(btrim(u.email::text)) = lower(btrim(p_email))
              and (p.role in ('admin', 'equipe')
                   or coalesce(p.nome, '') ilike any (array['%franklin%', '%teste%']))
         )
      or exists (
           select 1 from public.hub_contas_no_suporte s
             join auth.users u on u.id = s.usuario_id
            where lower(btrim(u.email::text)) = lower(btrim(p_email))
         );
$$;

-- Mover: admin ou equipe (quem cuida da aba Clientes).
create or replace function public.hub_mover_para_suporte(p_usuario uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(public.hub_papel(), '') not in ('admin', 'equipe') then
    raise exception 'sem permissao';
  end if;
  insert into public.hub_contas_no_suporte (usuario_id, movida_por)
  values (p_usuario, auth.uid())
  on conflict (usuario_id) do nothing;
end;
$$;

-- Voltar: só admin (o Suporte é só dele).
create or replace function public.hub_voltar_para_clientes(p_usuario uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(public.hub_papel(), '') <> 'admin' then
    raise exception 'sem permissao';
  end if;
  delete from public.hub_contas_no_suporte where usuario_id = p_usuario;
end;
$$;

revoke all on function public.hub_mover_para_suporte(uuid) from public, anon;
revoke all on function public.hub_voltar_para_clientes(uuid) from public, anon;
grant execute on function public.hub_mover_para_suporte(uuid) to authenticated;
grant execute on function public.hub_voltar_para_clientes(uuid) to authenticated;

-- O Suporte passa a dizer quais contas foram movidas à mão (essas têm o
-- botão "Voltar para Clientes"; as da regra, não). Mudou o retorno, então
-- a função antiga sai antes.
drop function if exists public.hub_contas_suporte();
create function public.hub_contas_suporte()
returns table (
  id uuid, nome text, email text, papel text, criado_em timestamptz,
  ultimo_acesso timestamptz, movida boolean
)
language sql
security definer
stable
set search_path = public
as $$
  select u.id, p.nome, u.email::text, coalesce(p.role, 'cliente'), u.created_at, u.last_sign_in_at,
         exists (select 1 from public.hub_contas_no_suporte s where s.usuario_id = u.id)
    from auth.users u
    left join public.hub_profiles p on p.id = u.id
   where public.hub_eh_interno(u.email::text)
     and not public.hub_eh_demo(u.email::text)
     and public.hub_papel() = 'admin'
   order by u.created_at desc;
$$;

revoke all on function public.hub_contas_suporte() from public, anon;
grant execute on function public.hub_contas_suporte() to authenticated;
