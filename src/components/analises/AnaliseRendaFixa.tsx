"use client";

import { brl, pct } from "@/lib/calculos";
import { aliquotaIr, type ResultadoRendaFixa } from "@/lib/renda-fixa";
import { CascaAnalise, GradeIndicadores, Indicador, Recomendacoes, Veredito, type Recomendacao } from "./kit";

/**
 * A leitura de consultor do simulador de renda fixa (27/10/2026). Compara números; não indica
 * produto (regra CVM).
 */
export function AnaliseRendaFixa({
  r,
  poupanca,
  anualPct,
  ipca12,
  meses,
}: {
  r: ResultadoRendaFixa;
  poupanca: ResultadoRendaFixa;
  anualPct: number;
  ipca12: number;
  meses: number;
}) {
  if (r.investido <= 0) return null;
  const real = ((1 + anualPct / 100) / (1 + ipca12 / 100) - 1) * 100;
  const contraPoupanca = r.liquido - poupanca.liquido;
  const mordida = r.rendimentoBruto > 0 ? (r.ir / r.rendimentoBruto) * 100 : 0;
  const mesesPara15 = meses * (365 / 12) <= 720 ? Math.ceil((721 * 12) / 365) : null;

  const veredito =
    contraPoupanca > 0
      ? { tom: "bom" as const, titulo: `Rende ${brl(contraPoupanca)} a mais que a poupança`, texto: `No fim de ${meses} meses, já com o imposto, sobra mais do que deixando o mesmo dinheiro na poupança.` }
      : { tom: "ruim" as const, titulo: `Rende ${brl(-contraPoupanca)} a menos que a poupança`, texto: "Com essa taxa e esse prazo, a poupança, que é isenta, deixaria mais dinheiro no bolso." };

  const recs: Recomendacao[] = [];
  if (r.aliquota > 15 && mesesPara15)
    recs.push({
      titulo: `Veja se dá para deixar ${mesesPara15} meses ou mais`,
      texto: `Hoje o imposto é ${pct(r.aliquota, 1)} sobre o rendimento. Acima de 720 dias ele cai para 15%, se você não precisar do dinheiro antes.`,
    });
  if (r.aliquota > 0)
    recs.push({
      titulo: "Compare com um isento de taxa menor",
      texto: "LCI e LCA costumam pagar uma porcentagem menor do CDI. A linha de empate, acima, mostra até onde a isenção compensa.",
    });
  recs.push({
    titulo: "Confira a liquidez antes de aplicar",
    texto: "Alguns títulos só deixam sacar no vencimento. Dinheiro da reserva de emergência precisa poder sair a qualquer dia.",
    href: "/ferramentas/reserva",
    link: "Calcular a reserva",
  });

  return (
    <CascaAnalise>
      <Veredito tom={veredito.tom} titulo={veredito.titulo} texto={veredito.texto} />
      <GradeIndicadores>
        <Indicador rotulo="Ganho real" valor={`${pct(real, 2)} ao ano`} nota={`acima do IPCA de 12 meses (${pct(ipca12, 2)}), antes do IR`} ruim={real <= 0} />
        <Indicador rotulo="Mordida do IR" valor={pct(mordida, 1)} nota={r.aliquota > 0 ? `do rendimento; alíquota de ${pct(aliquotaIr(meses), 1)}` : "isento"} />
        <Indicador rotulo="Contra a poupança" valor={brl(contraPoupanca)} nota="de diferença no fim do prazo" ruim={contraPoupanca < 0} />
      </GradeIndicadores>
      <Recomendacoes itens={recs} />
    </CascaAnalise>
  );
}
