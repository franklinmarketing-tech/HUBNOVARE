/**
 * O QUE AVISAR, E QUANDO.
 *
 * ═══ ESTE ARQUIVO NÃO FALA COM O BANCO ═══════════════════════════════════
 *
 * Ele recebe o que já foi lido e devolve os alertas. Quem lê o banco é
 * `alertas-do-dia.ts`, e quem mostra é o pop-up do app (`PopupAlertas.tsx`).
 * A separação é o que permite provar as regras sem banco e sem sessão
 * (`scripts/testar-alertas.mjs`).
 *
 * ⚠️ NINGUÉM VÊ NADA SEM TER LIGADO. Todo alerta começa desligado em
 * `fin_alertas`, e cada função abaixo volta vazia quando o campo
 * correspondente é falso.
 *
 * ⚠️ UM AVISO POR ASSUNTO POR DIA. A janela ("vence em até 2 dias") é a
 * mesma a cada abertura do app, então sem trava a mesma conta apareceria a
 * cada vez. As datas `ultimo_*`, gravadas quando a pessoa fecha o pop-up,
 * calam o assunto até o dia seguinte.
 */

/** O que o cliente escolheu receber. Espelha `fin_alertas`. */
export type ConfigAlertas = {
  contas_ligado: boolean;
  contas_dias_antes: number;
  fatura_ligado: boolean;
  fatura_dias_antes: number;
  orcamento_ligado: boolean;
  orcamento_limite: number;
  resumo_ligado: boolean;
  resumo_dia_semana: number;
  ultimo_contas: string | null;
  ultimo_fatura: string | null;
  ultimo_orcamento: string | null;
  ultimo_resumo: string | null;
};

export type Recorrencia = {
  descricao: string;
  valor: number;
  dia: number;
  tipo: "receita" | "despesa";
  ativa: boolean;
};

export type Cartao = { nome: string; dia_fechamento: number };

export type OrcamentoGasto = {
  categoria: string;
  teto: number;
  gasto: number;
};

export type Alerta = {
  /** Qual campo `ultimo_*` marcar depois de enviar. */
  tipo: "contas" | "fatura" | "orcamento" | "resumo";
  texto: string;
};

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** AAAA-MM-DD de uma data, no fuso de quem usa (não em UTC). */
export function diaDe(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dia}`;
}

/**
 * Já avisamos isso hoje?
 *
 * ⚠️ A COMPARAÇÃO É POR DIA, não por "nas últimas 24 horas". Se o
 * verificador atrasar e rodar às 23h de um dia e às 7h do outro, uma janela
 * de 24 horas deixaria o segundo aviso passar. O calendário não.
 */
const jaAvisouHoje = (ultimo: string | null, hoje: string) => ultimo === hoje;

/**
 * Quantos dias faltam até o dia `alvo` do mês, a partir de hoje.
 *
 * ⚠️ O MÊS VIRA, E É AÍ QUE ESTA CONTA GANHA SENTIDO: no dia 29, uma conta
 * que vence no dia 2 não vence "daqui a -27 dias" — vence em 3 ou 4,
 * dependendo do tamanho do mês. Por isso a conta é feita com datas de
 * verdade, e não subtraindo números de dia.
 *
 * ⚠️ DIA 31 EM MÊS DE 30: o JavaScript empurraria para o dia 1º do mês
 * seguinte, adiantando o aviso em um dia. Prendemos ao último dia do mês,
 * que é como banco e boleto tratam o caso.
 */
export function diasAte(alvo: number, hoje: Date): number {
  const noMes = (ano: number, mes: number) => {
    const ultimo = new Date(ano, mes + 1, 0).getDate();
    return new Date(ano, mes, Math.min(alvo, ultimo));
  };

  const base = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  let data = noMes(base.getFullYear(), base.getMonth());
  if (data < base) data = noMes(base.getFullYear(), base.getMonth() + 1);

  return Math.round((data.getTime() - base.getTime()) / 86_400_000);
}

/** Contas fixas que vencem dentro da janela escolhida. */
export function alertaDeContas(
  cfg: ConfigAlertas,
  recorrencias: Recorrencia[],
  hoje: Date,
): Alerta | null {
  const dia = diaDe(hoje);
  if (!cfg.contas_ligado || jaAvisouHoje(cfg.ultimo_contas, dia)) return null;

  const proximas = recorrencias
    .filter((r) => r.ativa && r.tipo === "despesa")
    .map((r) => ({ ...r, faltam: diasAte(r.dia, hoje) }))
    .filter((r) => r.faltam <= cfg.contas_dias_antes)
    .sort((a, b) => a.faltam - b.faltam);

  if (!proximas.length) return null;

  const total = proximas.reduce((a, r) => a + r.valor, 0);
  const linhas = proximas
    .map(
      (r) =>
        `• ${r.descricao} — ${brl(r.valor)} ` +
        (r.faltam === 0 ? "(hoje)" : r.faltam === 1 ? "(amanhã)" : `(em ${r.faltam} dias)`),
    )
    .join("\n");

  return {
    tipo: "contas",
    texto:
      `*Contas chegando*\n\n${linhas}\n\n` +
      `Total: ${brl(total)}` +
      (proximas.length > 1 ? ` em ${proximas.length} contas.` : "."),
  };
}

/** Cartões cuja fatura fecha dentro da janela. */
export function alertaDeFatura(
  cfg: ConfigAlertas,
  cartoes: Cartao[],
  hoje: Date,
): Alerta | null {
  const dia = diaDe(hoje);
  if (!cfg.fatura_ligado || jaAvisouHoje(cfg.ultimo_fatura, dia)) return null;

  const fechando = cartoes
    .map((c) => ({ ...c, faltam: diasAte(c.dia_fechamento, hoje) }))
    .filter((c) => c.faltam <= cfg.fatura_dias_antes)
    .sort((a, b) => a.faltam - b.faltam);

  if (!fechando.length) return null;

  const linhas = fechando
    .map(
      (c) =>
        `• ${c.nome} — fecha ` +
        (c.faltam === 0 ? "hoje" : c.faltam === 1 ? "amanhã" : `em ${c.faltam} dias`),
    )
    .join("\n");

  return {
    tipo: "fatura",
    texto:
      `*Fatura fechando*\n\n${linhas}\n\n` +
      `O que você passar depois do fechamento cai na fatura do mês que vem.`,
  };
}

/** Categorias que passaram do limite escolhido do orçamento. */
export function alertaDeOrcamento(
  cfg: ConfigAlertas,
  orcamentos: OrcamentoGasto[],
  hoje: Date,
): Alerta | null {
  const dia = diaDe(hoje);
  if (!cfg.orcamento_ligado || jaAvisouHoje(cfg.ultimo_orcamento, dia)) return null;

  const estourando = orcamentos
    .filter((o) => o.teto > 0)
    .map((o) => ({ ...o, pct: Math.round((o.gasto / o.teto) * 100) }))
    .filter((o) => o.pct >= cfg.orcamento_limite)
    .sort((a, b) => b.pct - a.pct);

  if (!estourando.length) return null;

  const linhas = estourando
    .map(
      (o) =>
        `• ${o.categoria} — ${o.pct}% ` +
        `(${brl(o.gasto)} de ${brl(o.teto)})` +
        (o.pct >= 100 ? " ⚠️" : ""),
    )
    .join("\n");

  return {
    tipo: "orcamento",
    texto:
      `*Orçamento do mês*\n\n${linhas}\n\n` +
      (estourando.some((o) => o.pct >= 100)
        ? "O que passou de 100% já estourou o teto que você mesmo definiu."
        : "Ainda dá para segurar até o fim do mês."),
  };
}

/** O resumo semanal: quanto ainda dá para gastar. */
export function alertaDeResumo(
  cfg: ConfigAlertas,
  sobra: number,
  diasRestantes: number,
  hoje: Date,
): Alerta | null {
  const dia = diaDe(hoje);
  if (!cfg.resumo_ligado || jaAvisouHoje(cfg.ultimo_resumo, dia)) return null;
  if (hoje.getDay() !== cfg.resumo_dia_semana) return null;

  const porDia = diasRestantes > 0 ? sobra / diasRestantes : sobra;

  return {
    tipo: "resumo",
    texto:
      `*Quanto ainda dá para gastar*\n\n` +
      (sobra >= 0
        ? `Sobram ${brl(sobra)} até o fim do mês — ${brl(porDia)} por dia nos ${diasRestantes} dias que faltam.`
        : `O mês já está ${brl(Math.abs(sobra))} no vermelho. O que entrar agora vai tapar esse buraco.`),
  };
}
