import type { SupabaseClient } from "@supabase/supabase-js";

import {
  alertaDeContas,
  alertaDeFatura,
  alertaDeOrcamento,
  alertaDeResumo,
  type Alerta,
  type ConfigAlertas,
} from "./alertas";
import { limitesDoMes, refDoMes, resumirMes } from "./modelo";

/**
 * OS ALERTAS DE HOJE DE UMA PESSOA: lê o que precisa e passa pelo motor.
 *
 * ⚠️ RODA NO NAVEGADOR, COM A SESSÃO DA PRÓPRIA PESSOA. O alerta do FINCASH é
 * um pop-up dentro do app (decisão do dono, 19/10/2026): sem WhatsApp, sem
 * e-mail e sem rotina diária no servidor. Por isso não há chave de serviço
 * aqui — a RLS já deixa cada um ler só o que é seu, que é exatamente o que
 * esta conta precisa.
 *
 * As regras continuam em `alertas.ts`, sem banco e sem rede, provadas por
 * `scripts/testar-alertas.mjs`. Este arquivo só busca os dados.
 */
export async function alertasDoDia(
  db: SupabaseClient,
  usuarioId: string,
  cfg: ConfigAlertas,
  hoje = new Date(),
): Promise<Alerta[]> {
  const ref = refDoMes(hoje);
  const { inicio, fim } = limitesDoMes(ref);
  const alertas: Alerta[] = [];

  if (cfg.contas_ligado || cfg.fatura_ligado) {
    const [{ data: recorrencias }, { data: cartoes }] = await Promise.all([
      db
        .from("fin_recorrencias")
        .select("descricao, valor, dia, tipo, ativa")
        .eq("user_id", usuarioId),
      db
        .from("fin_cartoes")
        .select("nome, dia_fechamento")
        .eq("user_id", usuarioId)
        .eq("arquivado", false),
    ]);

    const a = alertaDeContas(cfg, recorrencias ?? [], hoje);
    if (a) alertas.push(a);
    const f = alertaDeFatura(cfg, cartoes ?? [], hoje);
    if (f) alertas.push(f);
  }

  /* Orçamento e resumo leem os lançamentos do mês: uma consulta só serve
     aos dois. */
  if (cfg.orcamento_ligado || cfg.resumo_ligado) {
    const { data: lancamentos } = await db
      .from("fin_lancamentos")
      .select("valor, categoria_id, tipo, pago")
      .eq("user_id", usuarioId)
      .gte("data", inicio)
      .lte("data", fim);

    if (cfg.orcamento_ligado) {
      /* Teto por categoria no mês, e o que já saiu em cada uma. */
      const { data: tetos } = await db
        .from("fin_orcamentos")
        .select("valor, categoria_id, fin_categorias(nome)")
        .eq("user_id", usuarioId)
        .eq("mes_ref", ref);

      const porCat = new Map<string, number>();
      for (const g of lancamentos ?? []) {
        if (g.tipo !== "despesa" || !g.categoria_id) continue;
        porCat.set(g.categoria_id, (porCat.get(g.categoria_id) ?? 0) + Number(g.valor));
      }

      const lista = (tetos ?? []).map((t) => {
        const cat = t.fin_categorias as unknown as { nome?: string } | null;
        return {
          categoria: cat?.nome ?? "Sem categoria",
          teto: Number(t.valor),
          gasto: porCat.get(t.categoria_id as string) ?? 0,
        };
      });

      const o = alertaDeOrcamento(cfg, lista, hoje);
      if (o) alertas.push(o);
    }

    if (cfg.resumo_ligado) {
      /* ⚠️ A MESMA FUNÇÃO QUE O PAINEL USA. Recalcular "quanto ainda dá para
         gastar" com uma conta própria aqui produziria dois números para a
         mesma pergunta — e num app de dinheiro, dois números encerram a
         conversa: a pessoa para de acreditar nos dois. */
      const resumo = resumirMes(
        (lancamentos ?? []).map((l) => ({
          valor: Number(l.valor),
          tipo: l.tipo,
          pago: l.pago,
        })) as Parameters<typeof resumirMes>[0],
      );

      const diasRestantes = Math.max(0, new Date(fim).getDate() - hoje.getDate());
      const r = alertaDeResumo(cfg, resumo.sobraPrevista, diasRestantes, hoje);
      if (r) alertas.push(r);
    }
  }

  return alertas;
}

/** O título curto de cada alerta. */
export const TITULO_DO_ALERTA: Record<Alerta["tipo"], string> = {
  contas: "Conta chegando",
  fatura: "Fatura fechando",
  orcamento: "Orçamento apertando",
  resumo: "Quanto ainda dá para gastar",
};

/** A tela onde a pessoa resolve cada alerta. */
export const DESTINO_DO_ALERTA: Record<Alerta["tipo"], string> = {
  contas: "/fincash/app/fixas",
  fatura: "/fincash/app/faturas",
  orcamento: "/fincash/app/orcamento",
  resumo: "/fincash/app",
};

/** O texto sem a primeira linha em `*negrito*`: no pop-up o título já está em cima. */
export const corpoDoAlerta = (texto: string) =>
  texto.replace(/^\*[^*\n]+\*\n+/, "");
