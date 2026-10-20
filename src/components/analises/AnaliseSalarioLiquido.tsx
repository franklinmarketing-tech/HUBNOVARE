"use client";

import { brl, pct } from "@/lib/calculos";
import { DEDUCAO_DEPENDENTE, TETO_INSS, TETO_ISENCAO, type SalarioLiquido } from "@/lib/trabalhista";
import {
  AnaliseVazia,
  BarraAlvo,
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
import { Rosca } from "./pecasTrabalhistas";

/**
 * A análise do salário líquido, como um consultor leria o holerite.
 *
 * ⚠️ Tudo sai do resultado de `salarioLiquido()` que a página já calculou.
 * O veredito NÃO pune quem ganha mais e paga mais imposto (a tabela é
 * progressiva, não há o que "corrigir"): ele olha para o que a pessoa
 * controla, os outros descontos.
 */
export function AnaliseSalarioLiquido({ r, dependentes }: { r: SalarioLiquido; dependentes: number }) {
  if (r.bruto <= 0) {
    return <AnaliseVazia texto="Informe o salário bruto para ver quanto fica com você, para onde vai cada desconto e o que fazer com o líquido." />;
  }

  const fica = (r.liquido / r.bruto) * 100;
  const impostos = r.inss + r.irrf;
  const porDia = r.liquido / 30; // a folha conta o mês como 30 dias
  const economia = r.detalheIrrf.economiaDoRedutor;

  /* ── O veredito ─────────────────────────────────────────────────────── */
  const veredito =
    r.liquido <= 0
      ? { tom: "ruim" as const, titulo: "Os descontos levam o salário inteiro",
          texto: `Com ${brl(r.outrosDescontos)} em pensão e outros descontos, nada chega na conta. Confira esses valores com o RH antes de qualquer outra coisa.` }
      : r.outrosDescontos > impostos
        ? { tom: "atencao" as const, titulo: `O que mais pesa não é imposto: são ${brl(r.outrosDescontos)} de outros descontos`,
            texto: `De cada R$ 100 do bruto, R$ ${Math.round(fica)} chegam na conta. Pensão e outros descontos tiram mais que INSS e IR juntos (${brl(impostos)}).` }
        : { tom: "bom" as const, titulo: `De cada R$ 100 do bruto, R$ ${Math.round(fica)} ficam com você`,
            texto: r.irrf === 0 && r.bruto <= TETO_ISENCAO
              ? "Você está isento de imposto de renda. O que sai é basicamente o INSS, que vira aposentadoria e auxílios."
              : `INSS e IR levam ${brl(impostos)} por mês. É o desconto obrigatório: o que dá para planejar é o destino dos ${brl(r.liquido)} que sobram.` };

  /* ── Rosca: para onde vai o bruto ───────────────────────────────────── */
  const fatias = [
    { nome: "Líquido (na sua conta)", valor: r.liquido, cor: CORES_ANALISE.verde },
    { nome: "INSS", valor: r.inss, cor: CORES_ANALISE.navy },
    { nome: "Imposto de renda", valor: r.irrf, cor: CORES_ANALISE.laranja },
    { nome: "Pensão e outros", valor: r.outrosDescontos, cor: CORES_ANALISE.azul },
  ];

  /* ── Recomendações, em ordem de prioridade ──────────────────────────── */
  const recs: Recomendacao[] = [];
  if (r.outrosDescontos > 0) {
    recs.push({ titulo: `Conferir os ${brl(r.outrosDescontos)} de pensão e outros descontos`,
      texto: "INSS e IR são fixos por lei; os outros descontos (plano, vale, adiantamento) são os únicos que dá para rever. Confira cada linha do holerite com o RH." });
  }
  if (r.liquido > 0) {
    recs.push({ titulo: `Planejar o mês com ${brl(r.liquido)}, não com ${brl(r.bruto)}`,
      texto: "O erro mais comum é fazer as contas pelo valor da carteira. A renda do orçamento é o que cai no banco.",
      href: "/ferramentas/orcamento", link: "Montar o orçamento com o líquido" });
    recs.push({ titulo: `Separar ${brl(r.liquido * 0.2)} por mês para o futuro`,
      texto: "É 20% do líquido, a referência da regra 50/30/20 que usamos no orçamento. Primeiro destino: a reserva de emergência.",
      href: "/ferramentas/reserva", link: "Planejar a reserva" });
  }
  if (r.bruto > TETO_INSS) {
    recs.push({ titulo: "Pensar na aposentadoria além do INSS",
      texto: `Seu salário passa do teto de contribuição (${brl(TETO_INSS)}). O benefício do INSS também trava nesse teto, então ele não acompanha a sua renda de hoje.`,
      href: "/ferramentas/raio-x-previdencia", link: "Fazer o raio-x da previdência" });
  } else if (dependentes === 0 && r.irrf > 0) {
    recs.push({ titulo: "Tem filho ou dependente? Informe no RH",
      texto: `Cada dependente abate ${brl(DEDUCAO_DEPENDENTE)} da base do imposto. Coloque no campo acima para ver o efeito e confira com o RH se ele está no cadastro.` });
  }

  return (
    <CascaAnalise titulo="O que o seu holerite diz">
      <Veredito {...veredito} />

      <GradeIndicadores>
        <Indicador rotulo="Fica com você" valor={pct(Math.max(0, fica), 0)} nota="do bruto chega na conta" ruim={r.liquido <= 0} />
        <Indicador rotulo="Alíquota efetiva do IR" valor={pct(r.detalheIrrf.aliquotaEfetiva, 1)}
          nota={r.irrf === 0 ? "Isento neste salário" : "do bruto vai para o IR — menor que a da faixa"} />
        <Indicador rotulo="Cada dia vale" valor={brl(Math.max(0, porDia))} nota="líquido ÷ 30 dias, como a folha conta" />
      </GradeIndicadores>

      {economia > 0 ? (
        <GradeGraficos>
          <CartaoGrafico titulo="Para onde vai o seu salário bruto" legenda="A rosca inteira é o bruto; o verde é o que chega na conta.">
            <Rosca fatias={fatias} base={r.bruto} centro={pct(Math.max(0, fica), 0)} rotuloCentro="fica com você" />
          </CartaoGrafico>
          <CartaoGrafico titulo="O efeito da regra nova de 2026" legenda="A barra é o IR de hoje; o traço é o que seria pela tabela antiga.">
            <div className="space-y-5">
              <BarraAlvo rotulo="IR por mês" valor={r.irrf} alvo={r.irrf + economia} maximo={r.irrf + economia}
                formato={(v) => brl(v)} cor={CORES_ANALISE.verde} />
              <BarraAlvo rotulo="IR no ano" valor={r.irrf * 12} alvo={(r.irrf + economia) * 12} maximo={(r.irrf + economia) * 12}
                formato={(v) => brl(v)} cor={CORES_ANALISE.verde} />
            </div>
            <p className="mt-4 text-xs text-slate-600">
              O redutor tira <b className="text-primary">{brl(economia)}</b> do seu imposto por mês:{" "}
              <b className="text-primary">{brl(economia * 12)}</b> em 12 meses.
            </p>
          </CartaoGrafico>
        </GradeGraficos>
      ) : (
        <CartaoGrafico titulo="Para onde vai o seu salário bruto" legenda="A rosca inteira é o bruto; o verde é o que chega na conta.">
          <Rosca fatias={fatias} base={r.bruto} centro={pct(Math.max(0, fica), 0)} rotuloCentro="fica com você" />
        </CartaoGrafico>
      )}

      <Recomendacoes itens={recs.slice(0, 4)}
        rodape={r.liquido > 0 ? (
          <>Em 12 meses entram <b className="text-primary">{brl(r.liquido * 12)}</b> de salário líquido na sua conta, sem contar 13º e férias.</>
        ) : undefined} />
    </CascaAnalise>
  );
}
