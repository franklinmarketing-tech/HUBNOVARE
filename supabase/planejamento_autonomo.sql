-- ============================================================================
-- App Novare Planejamento Financeiro — permissões do produto autônomo
-- ----------------------------------------------------------------------------
-- Rodar UMA vez no SQL Editor do Supabase (projeto hjikeevfzfswqydduars).
-- É idempotente: pode rodar de novo sem quebrar nada.
--
-- POR QUE ISTO EXISTE
-- O banco foi desenhado para a consultoria ASSISTIDA: o cliente escreve o
-- próprio retrato financeiro (income, expenses, debts, assets, insurance,
-- goals — isso já funciona desde a migration 20260226030202), mas tudo o que o
-- consultor produzia a partir desses dados é só-leitura para ele: diagnóstico,
-- metas, plano de ação e fechamento do mês.
--
-- No produto autônomo não existe consultor. Quem gera essas linhas é o próprio
-- dono dos dados, a partir de cálculo determinístico. Estas policies dão a ele
-- esse direito — e SÓ sobre as linhas dele.
--
-- O QUE ISTO **NÃO** FAZ
-- Não altera, não remove e não enfraquece nenhuma policy de admin ou de
-- super_admin. É puramente aditivo. O app dos consultores continua idêntico.
--
-- Não mexe em investment_recommendations de propósito: recomendar produto de
-- investimento sem suitability é risco regulatório, e o produto autônomo fala
-- de classe de ativo, não de produto.
--
-- Também não mexe em acompanhamento_entradas: as policies de lá já permitem a
-- escrita do dono quando clients.client_can_log_acompanhamento = true, e o
-- cliente pode ligar essa flag sozinho (a policy de UPDATE em clients não tem
-- WITH CHECK). O app faz isso na primeira visita à tela do mês.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- diagnosis — os números derivados do retrato financeiro
-- ----------------------------------------------------------------------------
drop policy if exists "client_insert_own_diagnosis" on public.diagnosis;
create policy "client_insert_own_diagnosis"
  on public.diagnosis for insert to authenticated
  with check (
    exists (
      select 1 from public.clients c
      where c.id = diagnosis.client_id and c.user_id = auth.uid()
    )
  );

drop policy if exists "client_update_own_diagnosis" on public.diagnosis;
create policy "client_update_own_diagnosis"
  on public.diagnosis for update to authenticated
  using (
    exists (
      select 1 from public.clients c
      where c.id = diagnosis.client_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.clients c
      where c.id = diagnosis.client_id and c.user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- parecer_metas — as metas do plano
--
-- DELETE entra junto porque o cliente refaz o próprio plano quando os dados
-- mudam: sem DELETE, meta antiga vira lixo que nunca some da tela.
-- ----------------------------------------------------------------------------
drop policy if exists "client_insert_own_parecer_metas" on public.parecer_metas;
create policy "client_insert_own_parecer_metas"
  on public.parecer_metas for insert to authenticated
  with check (
    exists (
      select 1 from public.clients c
      where c.id = parecer_metas.client_id and c.user_id = auth.uid()
    )
  );

drop policy if exists "client_update_own_parecer_metas" on public.parecer_metas;
create policy "client_update_own_parecer_metas"
  on public.parecer_metas for update to authenticated
  using (
    exists (
      select 1 from public.clients c
      where c.id = parecer_metas.client_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.clients c
      where c.id = parecer_metas.client_id and c.user_id = auth.uid()
    )
  );

drop policy if exists "client_delete_own_parecer_metas" on public.parecer_metas;
create policy "client_delete_own_parecer_metas"
  on public.parecer_metas for delete to authenticated
  using (
    exists (
      select 1 from public.clients c
      where c.id = parecer_metas.client_id and c.user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- action_plans — o cabeçalho do plano de ação
-- ----------------------------------------------------------------------------
drop policy if exists "client_insert_own_action_plans" on public.action_plans;
create policy "client_insert_own_action_plans"
  on public.action_plans for insert to authenticated
  with check (
    exists (
      select 1 from public.clients c
      where c.id = action_plans.client_id and c.user_id = auth.uid()
    )
  );

drop policy if exists "client_update_own_action_plans" on public.action_plans;
create policy "client_update_own_action_plans"
  on public.action_plans for update to authenticated
  using (
    exists (
      select 1 from public.clients c
      where c.id = action_plans.client_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.clients c
      where c.id = action_plans.client_id and c.user_id = auth.uid()
    )
  );

drop policy if exists "client_delete_own_action_plans" on public.action_plans;
create policy "client_delete_own_action_plans"
  on public.action_plans for delete to authenticated
  using (
    exists (
      select 1 from public.clients c
      where c.id = action_plans.client_id and c.user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- action_items — as tarefas
--
-- action_items não tem client_id: o vínculo é action_plan_id -> action_plans.
-- Por isso o EXISTS aqui tem dois níveis.
-- ----------------------------------------------------------------------------
drop policy if exists "client_insert_own_action_items" on public.action_items;
create policy "client_insert_own_action_items"
  on public.action_items for insert to authenticated
  with check (
    exists (
      select 1 from public.action_plans p
      join public.clients c on c.id = p.client_id
      where p.id = action_items.action_plan_id and c.user_id = auth.uid()
    )
  );

drop policy if exists "client_update_own_action_items" on public.action_items;
create policy "client_update_own_action_items"
  on public.action_items for update to authenticated
  using (
    exists (
      select 1 from public.action_plans p
      join public.clients c on c.id = p.client_id
      where p.id = action_items.action_plan_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.action_plans p
      join public.clients c on c.id = p.client_id
      where p.id = action_items.action_plan_id and c.user_id = auth.uid()
    )
  );

drop policy if exists "client_delete_own_action_items" on public.action_items;
create policy "client_delete_own_action_items"
  on public.action_items for delete to authenticated
  using (
    exists (
      select 1 from public.action_plans p
      join public.clients c on c.id = p.client_id
      where p.id = action_items.action_plan_id and c.user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- monthly_closings — o fechamento do mês
--
-- Era o gargalo do produto: cloneToNextMonth() só rodava no botão do consultor,
-- e sem ele o mês seguinte nunca nascia. Agora o dono fecha o próprio mês.
-- O UPDATE existe para reabrir um mês (evento atípico: demissão, doença).
-- ----------------------------------------------------------------------------
drop policy if exists "client_insert_own_closings" on public.monthly_closings;
create policy "client_insert_own_closings"
  on public.monthly_closings for insert to authenticated
  with check (
    exists (
      select 1 from public.clients c
      where c.id = monthly_closings.client_id and c.user_id = auth.uid()
    )
  );

drop policy if exists "client_update_own_closings" on public.monthly_closings;
create policy "client_update_own_closings"
  on public.monthly_closings for update to authenticated
  using (
    exists (
      select 1 from public.clients c
      where c.id = monthly_closings.client_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.clients c
      where c.id = monthly_closings.client_id and c.user_id = auth.uid()
    )
  );

-- ============================================================================
-- Conferência: deve listar 14 linhas, todas começando com "client_".
-- ============================================================================
select tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and policyname like 'client\_%own%'
  and tablename in (
    'diagnosis','parecer_metas','action_plans','action_items','monthly_closings'
  )
order by tablename, policyname;
