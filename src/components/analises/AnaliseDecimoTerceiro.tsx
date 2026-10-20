"use client";

import { brl, pct } from "@/lib/calculos";
import type { DecimoTerceiro } from "@/lib/trabalhista";
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
import { BarrasEmpilhadas, Rosca } from "./pecasTrabalhistas";

/**
 * A análise do 13º, como um consultor leria as duas parcelas.
 *
 * O ponto central é o da própria página: todo o desconto cai na 2ª parcela.
 * Quem planeja dezembro com "metade do 13º" erra pelo valor do desconto.
 *
 * ⚠️ Tudo sai de `decimoTerceiro()`, que a página já calculou. O corte de
 * 15% do veredito (quanto a 2ª parcela encolhe) é leitura de consultor.
 */
export function AnaliseDecimoTerceiro({ r, meses }: { r: DecimoTerceiro; meses: number }) {
  if (r.bruto <= 0) {
    return <AnaliseVazia texto="Informe o salário bruto e os meses trabalhados no ano para ver as duas parcelas lado a lado e o melhor destino para o 13º." />;
  }

  const descontos = r.inss + r.irrf;
  const metade = r.bruto / 2;
  const encolhe = r.primeiraParcela > 0 ? (descontos / r.primeiraParcela) * 100 : 0;
  const fica = (r.liquido / r.bruto) * 100;
  const porMes = r.bruto / Math.max(1, meses); // cada mês trabalhado vale 1/12 do salário

  /* ── O veredito ─────────────────────────────────────────────────────── */
  const veredito =
    r.segundaParcela <= 0
      ? { tom: "ruim" as const, titulo: "A 2ª parcela vem zerada",
          texto: `Os descontos de ${brl(descontos)} consomem a parcela de dezembro inteira. Todo o 13º é o adiantamento de novembro.` }
      : encolhe >= 15
        ? { tom: "atencao" as const, titulo: `Dezembro vem ${brl(descontos)} menor que novembro`,
            texto: `A 1ª parcela é ${brl(r.primeiraParcela)}, limpa. A 2ª é ${brl(r.segundaParcela)}, porque todo o INSS e o IR do 13º saem dela. Planeje dezembro com esse valor, não com a metade.` }
        : { tom: "bom" as const, titulo: `De cada R$ 100 do 13º, R$ ${Math.round(fica)} ficam com você`,
            texto: `Os descontos são pequenos: a 2ª parcela fica só ${brl(descontos)} abaixo da 1ª. O que importa agora é decidir o destino antes de o dinheiro cair.` };

  /* ── Gráficos ───────────────────────────────────────────────────────── */
  const parcelas = [
    { rotulo: "1ª · novembro", recebe: r.primeiraParcela, desconto: 0 },
    { rotulo: "2ª · dezembro", recebe: Math.max(0, r.segundaParcela), desconto: descontos },
  ];
  const fatias = [
    { nome: "Líquido (as duas parcelas)", valor: r.liquido, cor: CORES_ANALISE.verde },
    { nome: "INSS", valor: r.inss, cor: CORES_ANALISE.navy },
    { nome: "Imposto de renda", valor: r.irrf, cor: CORES_ANALISE.laranja },
  ];

  /* ── Recomendações ──────────────────────────────────────────────────── */
  const recs: Recomendacao[] = [
    { titulo: `Planejar dezembro com ${brl(Math.max(0, r.segundaParcela))}, não com ${brl(metade)}`,
      texto: "Contar com a metade exata é o erro clássico de fim de ano. Coloque o valor certo nas contas de dezembro e janeiro.",
      href: "/ferramentas/orcamento", link: "Montar o orçamento de fim de ano" },
    { titulo: "Se tem dívida cara, ela vem primeiro",
      texto: `Usar parte dos ${brl(r.liquido)} para quitar ou adiantar parcelas de uma dívida com juros pode valer mais do que guardar. Compare o juro que você paga com o que o dinheiro renderia parado.`,
      href: "/ferramentas/amortizacao", link: "Simular amortizar uma dívida" },
    { titulo: `Separar a 1ª parcela, ${brl(r.primeiraParcela)}, para a reserva`,
      texto: "Ela chega limpa em novembro, antes das festas. Separar no dia em que cai evita que ela vire gasto do mês.",
      href: "/ferramentas/reserva", link: "Planejar a reserva" },
  ];
  if (meses < 12) {
    recs.push({ titulo: `Conferir os ${meses} meses contados`,
      texto: `Cada mês trabalhado vale ${brl(porMes)} de 13º bruto, e mês com 15 dias ou mais conta inteiro. Se o valor vier diferente, confira com o RH.` });
  } else {
    recs.push({ titulo: "Ver quanto isso vira com o tempo",
      texto: `Guardar o 13º líquido todo ano soma ${brl(r.liquido * 5)} em 5 anos, sem contar rendimento. Simule com a taxa que você conseguir.`,
      href: "/ferramentas/juros-compostos", link: "Simular os juros compostos" });
  }

  return (
    <CascaAnalise titulo="O que o seu 13º diz">
      <Veredito {...veredito} />

      <GradeIndicadores>
        <Indicador rotulo="Fica com você" valor={pct(Math.max(0, fica), 0)} nota="do 13º bruto, somando as parcelas" />
        <Indicador rotulo="A 2ª parcela encolhe" valor={brl(descontos)} nota={`${pct(encolhe, 0)} menor que a 1ª`} ruim={r.segundaParcela <= 0} />
        <Indicador rotulo="Cada mês trabalhado vale" valor={brl(porMes)} nota="de 13º bruto (1/12 do salário)" />
      </GradeIndicadores>

      <GradeGraficos>
        <CartaoGrafico titulo="As duas parcelas, lado a lado" legenda="O verde é o que cai na conta; o laranja é o desconto do 13º inteiro, todo na 2ª.">
          <BarrasEmpilhadas dados={parcelas} series={[
            { chave: "recebe", nome: "Cai na conta", cor: CORES_ANALISE.verde },
            { chave: "desconto", nome: "INSS + IR", cor: CORES_ANALISE.laranja },
          ]} />
        </CartaoGrafico>
        <CartaoGrafico titulo="Para onde vai o 13º bruto" legenda="A rosca inteira é o 13º bruto; o verde é o que fica com você.">
          <Rosca fatias={fatias} base={r.bruto} centro={pct(Math.max(0, fica), 0)} rotuloCentro="fica com você" />
        </CartaoGrafico>
      </GradeGraficos>

      <Recomendacoes itens={recs.slice(0, 4)}
        rodape={<>Dê destino aos <b className="text-primary">{brl(r.liquido)}</b> antes de a 1ª parcela cair, em novembro.
          Dinheiro sem plano costuma sumir nas compras de fim de ano.</>} />
    </CascaAnalise>
  );
}
