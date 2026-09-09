/**
 * Metas — "pague seus sonhos primeiro".
 *
 * A CONTA QUE IMPORTA é uma só: quanto separar POR MÊS para chegar no prazo.
 * Barra de progresso bonita sem esse número é decoração — a pessoa olha, acha
 * bonito, e não guarda nada. Todo o resto deste arquivo existe para essa conta
 * ser honesta.
 *
 * O ACUMULADO NÃO É UM CAMPO. É `valor_inicial + aportes − resgates`, somado
 * aqui a cada leitura. Uma coluna com o total só está certa enquanto todo mundo
 * lembrar de atualizá-la — e um dia alguém apaga um aporte, o total não é
 * corrigido, e a meta passa a afirmar um dinheiro que não existe.
 *
 * A REGRA DO SINAL vale aqui também: `valor` é sempre positivo e o sentido vem
 * de `tipo` ('aporte' ou 'resgate').
 */

import { createClient } from "@/lib/supabase/client";
import { hojeIso, mesVizinho, mesesEntre, refDaData } from "./modelo";

export type PrioridadeMeta = "alta" | "media" | "baixa";
export type StatusMeta = "ativa" | "pausada" | "concluida" | "cancelada";
export type TipoAporte = "aporte" | "resgate";

export type Meta = {
  id: string;
  nome: string;
  valor_alvo: number;
  /** O que já havia guardado quando cadastrou a meta. Ponto de partida, como o
      `saldo_inicial` da conta. */
  valor_inicial: number;
  /** Nulo é legítimo: a reserva de emergência não tem data. Sem prazo o app
      não consegue dizer quanto separar por mês — e o motor devolve `null` em
      vez de inventar. */
  prazo: string | null;
  prioridade: PrioridadeMeta;
  status: StatusMeta;
  conta_id: string | null;
  investimento_id: string | null;
  cor: string;
  icone: string | null;
  observacao: string | null;
};

export type Aporte = {
  id: string;
  meta_id: string;
  tipo: TipoAporte;
  valor: number;
  /** yyyy-mm-dd */
  data: string;
  /** Preenchido quando o aporte também virou lançamento no fluxo de caixa. */
  lancamento_id: string | null;
  observacao: string | null;
};

/** Peso para ordenar. Explícito porque prioridade em texto não se ordena
    sozinha, e alfabética colocaria 'alta' depois de 'baixa'. */
export const PESO_PRIORIDADE: Record<PrioridadeMeta, number> = {
  alta: 0,
  media: 1,
  baixa: 2,
};

export const ROTULO_PRIORIDADE: Record<PrioridadeMeta, string> = {
  alta: "Alta",
  media: "Média",
  baixa: "Baixa",
};

export type ProgressoMeta = {
  meta: Meta;
  /** valor_inicial + aportes − resgates. */
  acumulado: number;
  falta: number;
  /** 0..1 na prática, mas passa de 1 quando a pessoa superou o alvo — a tela
      deve usar `Math.min(1, progresso)` na barra e o número cru no texto. */
  progresso: number;
  /** Nulo quando a meta não tem prazo. Zero quando o prazo já passou. */
  mesesRestantes: number | null;
  /** O número que faz a meta acontecer. Nulo sem prazo. */
  aporteNecessario: number | null;
  /** O que ela de fato guardou por mês, desde o primeiro aporte. */
  aporteMedio: number;
  /** Quantos meses distintos tiveram aporte. Vem junto porque "média de R$ 620"
      com um mês de histórico não é média, é um número solto — e a tela precisa
      saber a diferença para não vender confiança que o dado não tem. */
  mesesComAporte: number;
  /** Nulo sem prazo. */
  noRitmo: boolean | null;
  /** Em que mês ela chega mantendo o ritmo atual. Nulo se ainda não aportou. */
  previsaoNoRitmo: string | null;
  /** Prazo vencido e alvo não atingido. */
  atrasada: boolean;
  atingida: boolean;
};

const somaAportes = (aportes: Aporte[]) =>
  aportes.reduce((t, a) => t + (a.tipo === "resgate" ? -a.valor : a.valor), 0);

/**
 * O retrato de uma meta.
 *
 * Aceita a lista INTEIRA de aportes e filtra por `meta_id` — quem chama não
 * precisa fatiar. `progressoDasMetas` agrupa antes para não pagar esse filtro N
 * vezes.
 *
 * O PRAZO ENTRA EM MESES CHEIOS, incluindo o mês do prazo: meta para dezembro
 * consultada em setembro tem quatro meses de aporte (set, out, nov, dez), e não
 * três. Contar três empurraria a mensalidade para cima e faria a meta parecer
 * mais dura do que é — que é como se desiste dela.
 */
export function progressoDaMeta(
  meta: Meta,
  aportes: Aporte[],
  hoje = hojeIso(),
): ProgressoMeta {
  const meus = aportes.filter((a) => a.meta_id === meta.id);
  return montarProgresso(meta, meus, hoje);
}

function montarProgresso(
  meta: Meta,
  meus: Aporte[],
  hoje: string,
): ProgressoMeta {
  const acumulado = meta.valor_inicial + somaAportes(meus);
  const falta = Math.max(0, meta.valor_alvo - acumulado);
  const atingida = falta <= 0;

  const refHoje = refDaData(hoje);
  const vencido = meta.prazo !== null && meta.prazo < hoje;

  const mesesRestantes =
    meta.prazo === null
      ? null
      : vencido
        ? 0
        : Math.max(1, mesesEntre(refHoje, refDaData(meta.prazo)) + 1);

  /* Prazo vencido devolve `falta` inteiro: o que resta tem de sair agora, e
     dividir por zero (ou por um mês que não existe) mentiria para baixo. */
  const aporteNecessario =
    mesesRestantes === null
      ? null
      : atingida
        ? 0
        : mesesRestantes === 0
          ? falta
          : falta / mesesRestantes;

  // Média sobre os meses DECORRIDOS desde o primeiro aporte, e não sobre os
  // meses em que houve aporte: quem guardou uma vez em janeiro e nada até
  // setembro não tem média de R$ 500, tem de R$ 55.
  const refs = meus.map((a) => refDaData(a.data)).sort();
  const decorridos =
    refs.length === 0 ? 0 : Math.max(1, mesesEntre(refs[0], refHoje) + 1);
  const aporteMedio = decorridos === 0 ? 0 : somaAportes(meus) / decorridos;

  const previsaoNoRitmo =
    aporteMedio > 0 && !atingida
      ? mesVizinho(refHoje, Math.ceil(falta / aporteMedio))
      : atingida
        ? refHoje
        : null;

  return {
    meta,
    acumulado,
    falta,
    progresso: meta.valor_alvo > 0 ? acumulado / meta.valor_alvo : 0,
    mesesRestantes,
    aporteNecessario,
    aporteMedio,
    mesesComAporte: new Set(refs).size,
    noRitmo: aporteNecessario === null ? null : aporteMedio >= aporteNecessario,
    previsaoNoRitmo,
    atrasada: vencido && !atingida,
    atingida,
  };
}

/**
 * Todas as metas, na ordem em que a pessoa deve olhar.
 *
 * ORDEM: prioridade primeiro, prazo mais apertado depois. Metas concluídas e
 * canceladas vão para o fim — elas continuam na lista porque apagar levaria o
 * histórico de aportes junto, mas não disputam a atenção com o que ainda pode
 * ser feito.
 */
export function progressoDasMetas(
  metas: Meta[],
  aportes: Aporte[],
  hoje = hojeIso(),
): ProgressoMeta[] {
  const porMeta = new Map<string, Aporte[]>();
  for (const a of aportes) {
    const lista = porMeta.get(a.meta_id);
    if (lista) lista.push(a);
    else porMeta.set(a.meta_id, [a]);
  }

  const viva = (s: StatusMeta) => (s === "ativa" || s === "pausada" ? 0 : 1);

  return metas
    .map((m) => montarProgresso(m, porMeta.get(m.id) ?? [], hoje))
    .sort((a, b) => {
      const vivas = viva(a.meta.status) - viva(b.meta.status);
      if (vivas !== 0) return vivas;

      const prio =
        PESO_PRIORIDADE[a.meta.prioridade] - PESO_PRIORIDADE[b.meta.prioridade];
      if (prio !== 0) return prio;

      // Sem prazo vai para o fim do próprio grupo: sem data, não é urgente.
      if (!a.meta.prazo) return b.meta.prazo ? 1 : 0;
      if (!b.meta.prazo) return -1;
      return a.meta.prazo.localeCompare(b.meta.prazo);
    });
}

export type FaixaComprometimento = "folgado" | "apertado" | "irreal" | "sem_renda";

export type ComprometimentoMetas = {
  /** A soma do que as metas ATIVAS exigem por mês. */
  necessarioMensal: number;
  renda: number;
  /** 0..1+. Zero quando não há renda informada. */
  fracao: number;
  faixa: FaixaComprometimento;
  porMeta: { id: string; nome: string; necessario: number; fracao: number }[];
};

/**
 * Quanto das metas somadas pesa sobre a renda do mês.
 *
 * POR QUE ISTO EXISTE: cada meta, sozinha, parece razoável. Cinco metas
 * razoáveis somam 60% da renda e nenhuma delas acontece — a pessoa desiste de
 * todas ao mesmo tempo e conclui que "não dá para guardar dinheiro". Ver a
 * soma antes é o que permite escolher qual meta esperar, que é uma decisão
 * possível; descobrir depois não é.
 *
 * AS FAIXAS SÃO OPINIÃO, e vale dizer isso na tela. Vêm da leitura 50/30/20
 * que o Orçamento já usa: 20% da renda para o futuro é a referência, e nele
 * cabe também a aposentadoria. Por isso 15% em metas de curto prazo ainda é
 * confortável, 30% já disputa com as necessidades, e acima disso o plano
 * costuma ser abandonado no segundo mês.
 *
 * PAUSADA NÃO CONTA de propósito: pausar é justamente a saída de quem viu este
 * número alto demais, e ela precisa fazer o número cair.
 */
export function comprometimentoDeMetas(
  progressos: ProgressoMeta[],
  rendaMensal: number,
): ComprometimentoMetas {
  const ativas = progressos.filter(
    (p) => p.meta.status === "ativa" && (p.aporteNecessario ?? 0) > 0,
  );

  const necessarioMensal = ativas.reduce(
    (t, p) => t + (p.aporteNecessario ?? 0),
    0,
  );
  const temRenda = rendaMensal > 0;
  const fracao = temRenda ? necessarioMensal / rendaMensal : 0;

  const faixa: FaixaComprometimento = !temRenda
    ? "sem_renda"
    : fracao <= 0.15
      ? "folgado"
      : fracao <= 0.3
        ? "apertado"
        : "irreal";

  return {
    necessarioMensal,
    renda: rendaMensal,
    fracao,
    faixa,
    porMeta: ativas.map((p) => ({
      id: p.meta.id,
      nome: p.meta.nome,
      necessario: p.aporteNecessario ?? 0,
      fracao: temRenda ? (p.aporteNecessario ?? 0) / rendaMensal : 0,
    })),
  };
}

/**
 * O mapa ref → aporte planejado que a projeção de 12 meses consome.
 *
 * ⚠️ ARMADILHA DE DUPLA CONTAGEM: se a pessoa já tem uma recorrência
 * "investimento mensal, R$ 500" no fluxo, esse dinheiro já sai do caixa na
 * projeção. Passar este mapa junto tiraria os mesmos R$ 500 duas vezes. A tela
 * decide: ou a meta é bancada por uma recorrência (e este mapa não vai para a
 * projeção), ou ela é um plano ainda não lançado (e vai). Não dá para o motor
 * adivinhar qual das duas é — o vínculo entre a recorrência e a meta não
 * existe no banco, e criá-lo custaria mais do que resolve.
 */
export function aportesPlanejadosPorMes(
  progressos: ProgressoMeta[],
  refInicial: string,
  meses = 12,
): Record<string, number> {
  const mapa: Record<string, number> = {};
  for (let i = 0; i < meses; i++) mapa[mesVizinho(refInicial, i)] = 0;

  for (const p of progressos) {
    if (p.meta.status !== "ativa") continue;
    const valor = p.aporteNecessario ?? 0;
    if (valor <= 0) continue;

    // Depois do prazo a meta não pede mais nada: manter o aporte até o fim da
    // janela faria a projeção mostrar uma saída eterna que não existe.
    const limite = p.meta.prazo ? refDaData(p.meta.prazo) : null;

    for (let i = 0; i < meses; i++) {
      const ref = mesVizinho(refInicial, i);
      if (limite && ref > limite) break;
      mapa[ref] += valor;
    }
  }

  return mapa;
}

/** Quanto foi de fato aportado em cada mês — o histórico, para o gráfico. */
export function aportesPorMes(aportes: Aporte[]): Record<string, number> {
  const mapa: Record<string, number> = {};
  for (const a of aportes) {
    const ref = refDaData(a.data);
    mapa[ref] = (mapa[ref] ?? 0) + (a.tipo === "resgate" ? -a.valor : a.valor);
  }
  return mapa;
}

// ── Banco ───────────────────────────────────────────────────────────────────

/**
 * Metas e aportes numa viagem só.
 *
 * TODOS os aportes, sem recorte de período: o acumulado é a soma da história
 * inteira, e recortar por mês daria um progresso menor do que a verdade — que é
 * o defeito que faz a pessoa parar de confiar na barra.
 */
export async function carregarMetas(): Promise<{
  metas: Meta[];
  aportes: Aporte[];
}> {
  const supabase = createClient();
  const [metas, aportes] = await Promise.all([
    supabase.from("fin_metas").select("*").order("criado_em"),
    supabase.from("fin_aportes").select("*").order("data", { ascending: false }),
  ]);

  const erro = metas.error ?? aportes.error;
  if (erro) throw erro;

  return {
    metas: (metas.data ?? []) as Meta[],
    aportes: (aportes.data ?? []) as Aporte[],
  };
}

export type NovaMeta = Omit<Meta, "id" | "status"> & { status?: StatusMeta };

export async function salvarMeta(m: NovaMeta) {
  const supabase = createClient();
  const { error } = await supabase.from("fin_metas").insert(m);
  if (error) throw error;
}

export async function atualizarMeta(id: string, campos: Partial<NovaMeta>) {
  const supabase = createClient();
  const { error } = await supabase.from("fin_metas").update(campos).eq("id", id);
  if (error) throw error;
}

/** Concluir, pausar ou cancelar — nunca apagar. Apagar levaria os aportes
    junto (`on delete cascade`) e com eles a prova de que a pessoa guardou. */
export async function mudarStatusMeta(id: string, status: StatusMeta) {
  const supabase = createClient();
  const { error } = await supabase.from("fin_metas").update({ status }).eq("id", id);
  if (error) throw error;
}

export type NovoAporte = Omit<Aporte, "id">;

export async function salvarAporte(a: NovoAporte) {
  const supabase = createClient();
  const { error } = await supabase.from("fin_aportes").insert(a);
  if (error) throw error;
}

export async function apagarAporte(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("fin_aportes").delete().eq("id", id);
  if (error) throw error;
}
