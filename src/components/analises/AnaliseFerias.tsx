"use client";

import { brl, pct } from "@/lib/calculos";
import type { Ferias } from "@/lib/trabalhista";
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
 * A análise das férias, como um consultor leria o recibo.
 *
 * O que quase ninguém percebe: a maior parte do valor é o SALÁRIO dos dias
 * de descanso, pago adiantado (é a linha "Férias (N dias)" da própria
 * página). Dinheiro a mais de verdade é só o terço e, se houver, o abono.
 *
 * ⚠️ Tudo sai de `ferias()`, que a página já calculou (a opção escolhida e
 * as duas comparadas). O corte de 40% do veredito é leitura de consultor.
 */
export function AnaliseFerias({ r, soGozar, vendendo, diferenca }: {
  r: Ferias;
  soGozar: Ferias;
  vendendo: Ferias;
  /** Líquido vendendo 10 dias menos o líquido tirando 30, já calculado pela página. */
  diferenca: number;
}) {
  if (r.bruto <= 0) {
    return <AnaliseVazia texto="Informe o salário bruto para ver quanto das férias é dinheiro a mais e quanto é o salário dos dias de descanso." />;
  }

  const extra = r.tercoFerias + r.abono + r.tercoAbono; // o que vem além do salário dos dias
  const extraPct = (extra / r.bruto) * 100;
  const descontos = r.inss + r.irrf;
  const diaVendido = (vendendo.abono + vendendo.tercoAbono) / Math.max(1, vendendo.diasVendidos);

  /* ── O veredito ─────────────────────────────────────────────────────── */
  const veredito =
    extraPct >= 40
      ? { tom: "bom" as const, titulo: `${brl(extra)} das férias são dinheiro a mais`,
          texto: `É o terço constitucional mais o abono dos ${r.diasVendidos} dias vendidos, que não paga INSS nem IR. O resto, ${brl(r.valorFerias)}, é o salário dos ${r.diasGozados} dias de descanso.` }
      : { tom: "atencao" as const, titulo: `Dos ${brl(r.bruto)}, só ${brl(extra)} são dinheiro a mais`,
          texto: `O resto, ${brl(r.valorFerias)}, é o salário dos ${r.diasGozados} dias de descanso, pago antes. Parece um bônus, mas a maior parte precisa pagar as contas do mês.` };

  /* ── Gráficos ───────────────────────────────────────────────────────── */
  const fatias = [
    { nome: `Salário dos ${r.diasGozados} dias`, valor: r.valorFerias, cor: CORES_ANALISE.navy },
    { nome: "Terço constitucional", valor: r.tercoFerias, cor: CORES_ANALISE.laranja },
    { nome: "Abono + terço do abono", valor: r.abono + r.tercoAbono, cor: CORES_ANALISE.verde },
  ];
  const comparacao = [
    { rotulo: "30 dias", liquido: soGozar.liquido, descontos: soGozar.inss + soGozar.irrf },
    { rotulo: "20 + vender 10", liquido: vendendo.liquido, descontos: vendendo.inss + vendendo.irrf },
  ];

  /* ── Recomendações ──────────────────────────────────────────────────── */
  const recs: Recomendacao[] = [
    { titulo: `Deixar ${brl(r.valorFerias)} reservados para as contas do mês`,
      texto: "É o salário dos dias de descanso, que chegou antes. Gastar tudo na viagem é o que aperta o mês seguinte. Confira com o RH como fica o próximo holerite.",
      href: "/ferramentas/orcamento", link: "Ver se o mês fecha depois das férias" },
    { titulo: `Dar destino aos ${brl(extra)} a mais`,
      texto: "Esse é o dinheiro livre de verdade: pode ir para a viagem, mas uma parte na reserva de emergência faz diferença no ano.",
      href: "/ferramentas/reserva", link: "Planejar a reserva" },
  ];
  if (r.diasVendidos === 0 && diferenca > 0) {
    recs.push({ titulo: `Vender 10 dias renderia ${brl(diferenca)} a mais`,
      texto: `Cada dia vendido vale ${brl(diaVendido)}, sem INSS nem IR. É uma escolha sua: dez dias de descanso também valem alguma coisa.` });
  } else if (r.diasVendidos > 0) {
    recs.push({ titulo: `Os ${r.diasVendidos} dias vendidos renderam ${brl(r.abono + r.tercoAbono)}`,
      texto: "Esse valor é isento de INSS e IR. Em troca, são dias a menos de descanso — vale ter um destino claro para ele." });
  }
  recs.push({ titulo: "Comparar com o seu salário líquido do mês",
    texto: "Ver o líquido normal ajuda a separar o que é salário adiantado do que é extra.",
    href: "/ferramentas/salario-liquido", link: "Calcular o salário líquido" });

  return (
    <CascaAnalise titulo="O que as suas férias dizem">
      <Veredito {...veredito} />

      <GradeIndicadores>
        <Indicador rotulo="Dinheiro a mais" valor={brl(extra)} nota={`${pct(extraPct, 0)} do bruto · terço${r.abono > 0 ? " + abono" : ""}`} />
        <Indicador rotulo="Descontos" valor={pct((descontos / r.bruto) * 100, 1)} nota="do bruto · só a parte gozada paga" />
        <Indicador rotulo="Cada dia vendido vale" valor={brl(diaVendido)} nota="já líquido: sem INSS nem IR" />
      </GradeIndicadores>

      <GradeGraficos>
        <CartaoGrafico titulo="Do que é feito o valor das férias" legenda="O azul-escuro é salário adiantado; laranja e verde são o dinheiro a mais.">
          <Rosca fatias={fatias} base={r.bruto} centro={pct(extraPct, 0)} rotuloCentro="é dinheiro a mais" />
        </CartaoGrafico>
        <CartaoGrafico titulo="Tirar 30 dias × vender 10" legenda="A barra inteira é o bruto; o verde cai na conta, o laranja é INSS + IR.">
          <BarrasEmpilhadas dados={comparacao} series={[
            { chave: "liquido", nome: "Cai na conta", cor: CORES_ANALISE.verde },
            { chave: "descontos", nome: "INSS + IR", cor: CORES_ANALISE.laranja },
          ]} />
        </CartaoGrafico>
      </GradeGraficos>

      <Recomendacoes itens={recs.slice(0, 4)}
        rodape={<>Você recebe <b className="text-primary">{brl(r.liquido)}</b> até dois dias antes do descanso.
          Do bruto de {brl(r.bruto)}, <b className="text-primary">{brl(r.valorFerias)}</b> é o salário dos dias parados.</>} />
    </CascaAnalise>
  );
}
