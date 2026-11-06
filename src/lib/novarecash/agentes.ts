import type { ChavePlano } from "./config";

/**
 * OS AGENTES DE IA DO NOVARECASH (06/11/2026, pedido do dono).
 *
 * Cada agente é a MESMA IA (`lib/novarecash/ia.ts`, com as regras da CVM intactas),
 * com um FOCO próprio: o trecho `foco` entra no prompt de sistema, e as `sugestoes`
 * abrem a conversa. Nenhum agente recomenda investimento — não existe "agente de
 * investimentos" de propósito (isso é consultoria, e exige registro na CVM).
 *
 * POR PLANO (`AGENTES_DO_PLANO`): a trava é REAL — a rota `/api/novarecash/ia` recusa
 * agente fora do plano de quem pergunta. A equipe vê todos. Mudar quantos agentes cada
 * plano tem = mexer só na lista abaixo (a venda e o app leem daqui).
 */

export type ChaveAgente = "gastos" | "contas" | "orcamento" | "assinaturas" | "metas";

export type Agente = {
  chave: ChaveAgente;
  nome: string;
  /** O que ele faz, numa linha (cartão do app e lista da venda). */
  resumo: string;
  /** Instrução extra no prompt de sistema. */
  foco: string;
  sugestoes: string[];
};

export const AGENTES: readonly Agente[] = [
  {
    chave: "gastos",
    nome: "Agente de Gastos",
    resumo: "Mostra para onde o dinheiro está indo e o que dá para cortar.",
    foco:
      "Você é o AGENTE DE GASTOS. Seu foco: onde a pessoa mais gasta no mês, por categoria e por lançamento, o que cresceu em relação ao normal e o que dá para cortar sem sofrimento. Compare categorias, aponte os 3 maiores ralos e sugira um corte concreto em reais.",
    sugestoes: ["Onde estou gastando mais este mês?", "O que dá para cortar sem sofrimento?", "Posso gastar R$ 300 este mês?"],
  },
  {
    chave: "contas",
    nome: "Agente de Contas",
    resumo: "Organiza os vencimentos e diz o que pagar primeiro.",
    foco:
      "Você é o AGENTE DE CONTAS. Seu foco: contas a pagar, vencimentos próximos, faturas de cartão em aberto e o que pagar primeiro para não cair em juros e multa. Se o dinheiro não der para tudo, ordene por custo de atraso (cartão e cheque especial primeiro) e mostre a conta.",
    sugestoes: ["O que vence nos próximos dias?", "O que eu pago primeiro?", "Quanto está a fatura do cartão?"],
  },
  {
    chave: "orcamento",
    nome: "Agente de Orçamento",
    resumo: "Diz quanto ainda cabe em cada categoria até o fim do mês.",
    foco:
      "Você é o AGENTE DE ORÇAMENTO. Seu foco: o limite de cada categoria, quanto já foi usado, quanto ainda cabe até o fim do mês e o ritmo de gasto por dia. Se não houver orçamento definido, ajude a montar um a partir dos gastos reais (e diga para registrar em Orçamento).",
    sugestoes: ["Como está o meu orçamento?", "Quanto ainda posso gastar com mercado?", "Monta um orçamento para mim?"],
  },
  {
    chave: "assinaturas",
    nome: "Agente de Assinaturas",
    resumo: "Caça cobranças recorrentes, tarifas e assinaturas esquecidas.",
    foco:
      "Você é o AGENTE DE ASSINATURAS. Seu foco: cobranças que se repetem todo mês (streaming, apps, academia, seguros), tarifas bancárias, juros e cobranças duplicadas — use os ALERTAS do app. Some quanto isso custa por mês e por ano. A pessoa decide o que cancelar; nunca afirme que uma cobrança é indevida.",
    sugestoes: ["Quais assinaturas eu pago todo mês?", "Quanto gasto por ano com assinaturas?", "Estou pagando alguma tarifa?"],
  },
  {
    chave: "metas",
    nome: "Agente de Metas",
    resumo: "Monta o plano para juntar o valor que você quer, no prazo.",
    foco:
      "Você é o AGENTE DE METAS. Seu foco: as metas de guardar dinheiro — quanto já guardou, quanto falta, quanto guardar por mês para chegar no prazo e se isso cabe na sobra do mês. Se a meta não couber, mostre as duas saídas: esticar o prazo ou cortar um gasto (com o valor). Onde aplicar o dinheiro guardado é com um consultor da Novare.",
    sugestoes: ["Quanto preciso guardar por mês para a minha meta?", "Minha meta cabe no meu orçamento?", "Quero juntar R$ 10 mil em 1 ano"],
  },
];

/** Quais agentes cada plano tem (na ordem em que aparecem). */
export const AGENTES_DO_PLANO: Record<ChavePlano, readonly ChaveAgente[]> = {
  essencial: ["gastos", "contas"],
  plus: ["gastos", "contas", "orcamento", "assinaturas"],
  premium: ["gastos", "contas", "orcamento", "assinaturas", "metas"],
};

export const ehChaveAgente = (v: unknown): v is ChaveAgente => AGENTES.some((a) => a.chave === v);

export function agentePorChave(chave: string | null | undefined): Agente {
  return AGENTES.find((a) => a.chave === chave) ?? AGENTES[0];
}

/** O plano mais barato que tem este agente (para o cadeado dizer "no plano Plus"). */
export function planoMinimoDoAgente(chave: ChaveAgente): ChavePlano {
  return (["essencial", "plus", "premium"] as const).find((p) => AGENTES_DO_PLANO[p].includes(chave)) ?? "premium";
}

/** "2 agentes de IA" / "Os 5 agentes de IA". */
export function textoAgentes(plano: ChavePlano): string {
  const n = AGENTES_DO_PLANO[plano].length;
  return n === AGENTES.length ? `Os ${n} agentes de IA` : `${n} ${n === 1 ? "agente" : "agentes"} de IA`;
}
