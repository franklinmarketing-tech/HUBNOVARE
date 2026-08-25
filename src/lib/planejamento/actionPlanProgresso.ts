/**
 * Quanto do plano já foi cumprido, em porcentagem.
 *
 * O `planCompletion` do app original contava tarefas-folha de `action_items`.
 * Aqui a unidade é a meta: cada uma vale o mesmo, e uma meta conta como
 * cumprida quando o valor lançado alcançou o alvo — na direção certa.
 *
 * A direção importa. "Chegar a R$ 30.000 de reserva" cumpre-se subindo;
 * "zerar R$ 12.000 de cartão" cumpre-se descendo. Tratar as duas como a mesma
 * conta é o erro que faz uma dívida crescente aparecer como progresso.
 */

export type MetaProgresso = {
  meta_valor: number | null;
  current_value: number | null;
  source_id: string;
};

export function planCompletion(
  metas: MetaProgresso[],
  valoresLancados: Record<string, string>,
): number {
  const comAlvo = metas.filter((m) => m.meta_valor != null);
  if (comAlvo.length === 0) return 0;

  const cumpridas = comAlvo.filter((m) => {
    const partida = m.current_value ?? 0;
    const alvo = m.meta_valor!;
    const bruto = valoresLancados[m.source_id];
    const atual = bruto != null && bruto !== "" ? Number(bruto) : partida;
    if (!Number.isFinite(atual)) return false;
    return alvo < partida ? atual <= alvo : atual >= alvo;
  }).length;

  return Math.round((cumpridas / comAlvo.length) * 100);
}
