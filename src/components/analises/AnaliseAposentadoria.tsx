"use client";

import { brl, pct } from "@/lib/calculos";
import type { ResultadoAposentadoria } from "@/lib/aposentadoria";
import { CascaAnalise, GradeIndicadores, Indicador, Recomendacoes, Veredito, type Recomendacao } from "./kit";

/**
 * A leitura de consultor da calculadora de aposentadoria (27/10/2026). Só aritmética sobre o
 * resultado; não indica produto (regra CVM).
 */
export function AnaliseAposentadoria({ r, rentabilidadeRealPct }: { r: ResultadoAposentadoria; rentabilidadeRealPct: number }) {
  if (r.necessario <= 0) return null;
  const folga = r.idadeIndependencia != null ? r.idadeAposentar - r.idadeIndependencia : null;
  const parteDoAporte = r.projetado > 0 ? (r.totalAportado / r.projetado) * 100 : 0;

  const veredito = r.atingiu
    ? {
        tom: "bom" as const,
        titulo: folga && folga > 0 ? `Você chega lá ${folga} ${folga === 1 ? "ano" : "anos"} antes do que planejou` : "No ritmo de hoje você chega na meta",
        texto: `Aos ${r.idadeAposentar} anos o seu patrimônio projetado paga ${brl(r.rendaProjetada)} por mês, acima dos ${brl((r.necessario * 0.04) / 12)} que você quer.`,
      }
    : r.percentualMeta >= 70
      ? {
          tom: "atencao" as const,
          titulo: `Você está a ${pct(100 - r.percentualMeta, 0)} da meta`,
          texto: `Falta pouco: ${brl(r.aporteFaltante)} a mais por mês fecham a conta aos ${r.idadeAposentar}.`,
        }
      : {
          tom: "ruim" as const,
          titulo: `No ritmo de hoje você chega a ${pct(r.percentualMeta, 0)} da meta`,
          texto:
            r.idadeIndependencia != null
              ? `A independência chega por volta dos ${r.idadeIndependencia} anos, não aos ${r.idadeAposentar}. Dá para mudar o aporte, o prazo ou a renda desejada.`
              : `Nesse ritmo o patrimônio não chega à meta até os 95 anos. Dá para mudar o aporte, o prazo ou a renda desejada.`,
        };

  const recs: Recomendacao[] = [];
  if (!r.atingiu && r.aporteFaltante > 0)
    recs.push({
      titulo: `Aumente o aporte em ${brl(r.aporteFaltante)} por mês`,
      texto: `Com ${brl(r.aporteNecessario)} por mês você chega exatamente na meta aos ${r.idadeAposentar}. Comece pelo que der e reajuste a cada aumento de salário.`,
      href: "/ferramentas/orcamento",
      link: "Achar espaço no orçamento",
    });
  if (rentabilidadeRealPct > 6)
    recs.push({
      titulo: "Confira se a rentabilidade não está otimista",
      texto: `${pct(rentabilidadeRealPct, 1)} acima da inflação por décadas é alto. Refaça a conta com 4% ou 5% e veja se o plano ainda fecha.`,
    });
  recs.push({
    titulo: "Proteja o caminho antes de acelerar",
    texto: "Uma reserva de emergência evita resgatar o investimento da aposentadoria no primeiro imprevisto.",
    href: "/ferramentas/reserva",
    link: "Calcular a reserva",
  });
  if (r.atingiu)
    recs.push({
      titulo: "Decida o que fazer com a folga",
      texto: "Você pode se aposentar antes, aumentar a renda desejada ou investir com menos risco. Cada escolha muda a conta.",
    });

  return (
    <CascaAnalise>
      <Veredito tom={veredito.tom} titulo={veredito.titulo} texto={veredito.texto} />
      <GradeIndicadores>
        <Indicador rotulo={`Da meta, aos ${r.idadeAposentar}`} valor={pct(r.percentualMeta, 0)} nota={`${brl(r.projetado)} de ${brl(r.necessario)}`} ruim={!r.atingiu} />
        <Indicador rotulo="Do seu bolso" valor={pct(Math.min(100, parteDoAporte), 0)} nota="do patrimônio final; o resto vem dos juros" />
        <Indicador rotulo="Anos até a meta" valor={r.idadeIndependencia != null ? `${r.idadeIndependencia - r.idadeAtual}` : "+ de " + (95 - r.idadeAtual)} nota="no ritmo de hoje" ruim={r.idadeIndependencia == null || r.idadeIndependencia > r.idadeAposentar} />
      </GradeIndicadores>
      <Recomendacoes itens={recs} />
    </CascaAnalise>
  );
}
