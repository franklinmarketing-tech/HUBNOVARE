"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { brl, pct } from "@/lib/calculos";
import {
  AnaliseVazia,
  CartaoGrafico,
  CascaAnalise,
  CORES_ANALISE,
  GradeGraficos,
  GradeIndicadores,
  Indicador,
  Recomendacoes,
  Veredito,
  type Recomendacao,
} from "./kit";

/**
 * A ANÁLISE DA AMORTIZAÇÃO EXTRA, como um consultor leria os dois caminhos.
 *
 * Recebe os dois cenários que a página já calculou, cada um contra a sua
 * própria base (é a regra da página: não misturar critérios). Daqui só saem
 * divisões e diferenças. A "taxa que o aporte rende" é a taxa do contrato
 * que a pessoa digitou — juro que deixa de ser cobrado.
 */

const mesesTexto = (m: number) => {
  const anos = Math.floor(m / 12);
  const resto = m % 12;
  if (anos <= 0) return `${resto} ${resto === 1 ? "mês" : "meses"}`;
  if (resto === 0) return `${anos} ${anos === 1 ? "ano" : "anos"}`;
  return `${anos} ${anos === 1 ? "ano" : "anos"} e ${resto} ${resto === 1 ? "mês" : "meses"}`;
};

const k = (v: number) =>
  v >= 1000 ? `${Math.round(v / 1000).toLocaleString("pt-BR")}k` : `${Math.round(v)}`;

export function AnaliseAmortizacao({
  validos,
  abatimento,
  taxaAnualPct,
  parcelaInformada,
  parcelaTeorica,
  prazo,
  caminhoPrazo,
  caminhoParcela,
}: {
  validos: boolean;
  abatimento: number;
  taxaAnualPct: number;
  parcelaInformada: number;
  parcelaTeorica: number;
  /** Prazo restante, em meses. */
  prazo: number;
  /** Mantém a parcela, encurta o prazo. `ok` é falso se a parcela não cobre os juros. */
  caminhoPrazo: { ok: boolean; jurosSem: number; jurosCom: number; mesesSem: number | null; mesesCom: number | null; economia: number };
  /** Mantém o prazo, recalcula a PRICE sobre o saldo menor. */
  caminhoParcela: { jurosSem: number; jurosCom: number; parcelaNova: number; queda: number; economia: number };
}) {
  if (!validos) {
    return (
      <AnaliseVazia texto="Informe o saldo devedor, os juros, o prazo restante e o valor do abatimento para ver qual caminho vale mais." />
    );
  }

  // Parcela digitada muito longe da PRICE teórica: seguro/taxa embutidos ou contrato SAC.
  const divergencia = parcelaTeorica > 0 ? Math.abs(parcelaInformada - parcelaTeorica) / parcelaTeorica : 0;
  const divergente = divergencia > 0.05;
  const conferir: Recomendacao = {
    titulo: "Confira a parcela no extrato",
    texto: `Você informou ${brl(parcelaInformada)}, mas para esse saldo, taxa e prazo a parcela PRICE seria ${brl(parcelaTeorica)}. A diferença costuma ser seguro e taxas embutidos, ou um contrato em SAC. Use a parcela sem seguros para a conta ficar exata.`,
  };
  const reserva: Recomendacao = {
    titulo: "Não tire esse dinheiro da reserva de emergência",
    texto: "O que se abate no financiamento não volta para a sua mão. Use para isso só o que sobra depois de ter a reserva completa.",
    href: "/ferramentas/reserva",
    link: "Conferir a reserva de emergência",
  };

  /* ── Parcela que não cobre os juros: não há caminho de prazo para comparar ── */
  if (!caminhoPrazo.ok) {
    return (
      <CascaAnalise titulo="O que este aporte diz">
        <Veredito tom="ruim" titulo="A parcela informada não paga nem os juros do mês"
          texto={`Com ${brl(parcelaInformada)} de parcela e ${pct(taxaAnualPct, 2)} ao ano, o saldo só cresceria. Confira os números do contrato. Enquanto isso, reduzir a parcela levaria a ${brl(caminhoParcela.parcelaNova)} por mês e evitaria ${brl(caminhoParcela.economia)} de juros.`} />
        <Recomendacoes itens={[conferir, reserva]} />
      </CascaAnalise>
    );
  }

  const melhorPrazo = caminhoPrazo.economia >= caminhoParcela.economia;
  const melhor = melhorPrazo ? caminhoPrazo : caminhoParcela;
  const outro = melhorPrazo ? caminhoParcela : caminhoPrazo;
  const mesesCaem = (caminhoPrazo.mesesSem ?? 0) - (caminhoPrazo.mesesCom ?? 0);
  const porReal = abatimento > 0 ? melhor.economia / abatimento : 0;
  const corteJuros = melhor.jurosSem > 0 ? (melhor.economia / melhor.jurosSem) * 100 : 0;

  /* ── O veredito ─────────────────────────────────────────────────────── */
  const aviso = divergente ? " Antes, confira a parcela: ela não bate com a conta do saldo (veja abaixo)." : "";
  const veredito = melhorPrazo
    ? { titulo: `Reduzir o prazo é o melhor uso dos ${brl(abatimento, 0)}`,
        texto: `Com a mesma parcela, você deixa de pagar ${brl(caminhoPrazo.economia)} de juros e termina ${mesesTexto(mesesCaem)} antes. Cada R$ 1 abatido evita ${brl(porReal)} de juros.${aviso}` }
    : { titulo: "Neste contrato, reduzir a parcela economiza mais",
        texto: `Mantendo o prazo, a parcela cai para ${brl(caminhoParcela.parcelaNova)} e você evita ${brl(caminhoParcela.economia)} de juros — ${brl(caminhoParcela.economia - caminhoPrazo.economia)} a mais do que reduzindo o prazo.${aviso}` };

  /* ── Gráfico 1: os juros que faltam, antes e depois, no melhor caminho ── */
  const fatias = [
    { nome: "Juros evitados", valor: melhor.economia, cor: CORES_ANALISE.verde },
    { nome: "Juros que continuam", valor: Math.max(0, melhor.jurosCom), cor: CORES_ANALISE.navy },
  ].filter((f) => f.valor > 0);

  /* ── Gráfico 2: cada caminho contra a sua própria base ──────────────── */
  const barras = [
    { nome: "Reduzir prazo", sem: caminhoPrazo.jurosSem, com: caminhoPrazo.jurosCom },
    { nome: "Reduzir parcela", sem: caminhoParcela.jurosSem, com: caminhoParcela.jurosCom },
  ];

  /* ── Recomendações ──────────────────────────────────────────────────── */
  const recs: Recomendacao[] = [];
  if (divergente) recs.push(conferir);
  recs.push(
    melhorPrazo
      ? { titulo: "Peça ao banco a redução de PRAZO",
          texto: `A parcela fica em ${brl(parcelaInformada)} e o contrato acaba em ${mesesTexto(caminhoPrazo.mesesCom ?? 0)}, em vez de ${mesesTexto(caminhoPrazo.mesesSem ?? 0)}. Só troque por reduzir a parcela se o mês estiver apertado: ela libera ${brl(caminhoParcela.queda)} por mês, mas economiza ${brl(caminhoParcela.economia)} em vez de ${brl(caminhoPrazo.economia)}.`,
          href: "/ferramentas/orcamento", link: "Ver se o orçamento precisa de alívio" }
      : { titulo: "Peça ao banco a redução de PARCELA",
          texto: `A parcela cai para ${brl(caminhoParcela.parcelaNova)} (${brl(caminhoParcela.queda)} a menos por mês) e o prazo segue em ${mesesTexto(prazo)}. Guarde ou abata de novo o alívio do mês: assim a economia cresce.`,
          href: "/ferramentas/orcamento", link: "Dar destino ao alívio no orçamento" },
  );
  recs.push(reserva);
  if (taxaAnualPct > 0) {
    recs.push({
      titulo: "Compare com deixar o dinheiro aplicado",
      texto: `Abater a dívida "rende", na prática, a taxa do contrato: ${pct(taxaAnualPct, 2)} ao ano, sem risco — é juro que deixa de ser cobrado. Só compensa manter aplicado o que render mais que isso depois do imposto.`,
      href: "/ferramentas/rentabilidade-real",
      link: "Calcular o ganho real de uma aplicação",
    });
  }

  return (
    <CascaAnalise titulo="O que este aporte diz">
      <Veredito tom={divergente ? "atencao" : "bom"} titulo={veredito.titulo} texto={veredito.texto} />

      <GradeIndicadores>
        <Indicador rotulo="Juros que ainda faltam" valor={brl(melhor.jurosSem, 0)}
          nota={`O aporte apaga ${pct(corteJuros, 0)} disso`} />
        <Indicador rotulo="Alívio na parcela" valor={brl(Math.max(0, caminhoParcela.queda))}
          nota="por mês, se escolher reduzir a parcela" />
        <Indicador rotulo="O aporte rende" valor={`${pct(taxaAnualPct, 1)} a.a.`}
          nota="a taxa do contrato, em juros evitados" />
      </GradeIndicadores>

      <GradeGraficos>
        <CartaoGrafico titulo={`O que o aporte faz com os juros (${melhorPrazo ? "reduzindo o prazo" : "reduzindo a parcela"})`}
          legenda="A rosca é todo o juro que faltava pagar. A fatia verde é o que o aporte apaga.">
          <div className="relative mx-auto h-56 w-full max-w-[16rem]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={fatias} dataKey="valor" nameKey="nome" innerRadius="62%" outerRadius="92%"
                  paddingAngle={2} stroke="none" isAnimationActive>
                  {fatias.map((f) => <Cell key={f.nome} fill={f.cor} />)}
                </Pie>
                <Tooltip formatter={(v) => brl(Number(v ?? 0))} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-2xl font-bold tabular-nums text-primary">{pct(corteJuros, 0)}</span>
              <span className="text-2xs text-slate-500">dos juros, apagados</span>
            </div>
          </div>
          <ul className="mt-3 space-y-1.5 text-xs">
            {fatias.map((f) => (
              <li key={f.nome} className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: f.cor }} />
                <span className="min-w-0 truncate text-slate-600">{f.nome}</span>
                <span className="ml-auto whitespace-nowrap font-semibold tabular-nums text-slate-800">{brl(f.valor, 0)}</span>
              </li>
            ))}
          </ul>
        </CartaoGrafico>

        <CartaoGrafico titulo="Juros que faltam, em cada caminho"
          legenda="Cinza é sem o aporte; azul é com ele. Quanto maior a distância entre as duas barras, maior a economia.">
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barras} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" vertical={false} />
                <XAxis dataKey="nome" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis tickLine={false} axisLine={false} width={44} tickFormatter={k} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <Tooltip formatter={(v) => brl(Number(v ?? 0))} cursor={{ fill: "#f8fafc" }}
                  contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="sem" name="Sem o aporte" fill={CORES_ANALISE.cinza} radius={[6, 6, 0, 0]} />
                <Bar dataKey="com" name="Com o aporte" fill={CORES_ANALISE.navy} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CartaoGrafico>
      </GradeGraficos>

      <Recomendacoes itens={recs}
        rodape={<>O aporte de <b className="text-primary">{brl(abatimento, 0)}</b> vira <b className="text-primary">{brl(melhor.economia, 0)}</b> de juros que você não paga — {brl(melhor.economia - outro.economia, 0)} a mais do que o outro caminho.</>} />
    </CascaAnalise>
  );
}
