"use client";

import { brl, pct } from "@/lib/calculos";
import type { SeguroDesemprego } from "@/lib/trabalhista";
import {
  AnaliseVazia,
  CartaoGrafico,
  CascaAnalise,
  CORES_ANALISE,
  GradeIndicadores,
  Indicador,
  Recomendacoes,
  Veredito,
  type Recomendacao,
} from "./kit";
import { BarrasEmpilhadas } from "./pecasTrabalhistas";

/**
 * A análise do seguro-desemprego, como um consultor leria o benefício.
 *
 * O número que importa não é a parcela: é o BURACO — quanto a renda cai por
 * mês e quanto isso soma no período. É esse valor que a rescisão, o FGTS ou
 * a reserva precisam cobrir.
 *
 * ⚠️ Tudo sai de `seguroDesemprego()`, que a página já calculou. Os cortes
 * de 80% e 50% do veredito são leitura de consultor, não regra do benefício.
 */
export function AnaliseSeguroDesemprego({ r }: { r: SeguroDesemprego }) {
  if (r.media <= 0) {
    return <AnaliseVazia texto="Informe os três últimos salários brutos e os meses trabalhados para ver quanto a renda cai e como cobrir a diferença." />;
  }

  /* Sem direito: não há parcela para analisar, só o plano B. */
  if (!r.temDireito) {
    return (
      <CascaAnalise titulo="O que o seu caso diz">
        <Veredito tom="ruim" titulo="Sem seguro, a renda vai a zero"
          texto={`${r.motivo ?? "Com esses dados, ainda não há direito ao benefício."} Até o próximo emprego, as contas saem da rescisão, do FGTS ou da reserva.`} />
        <Recomendacoes itens={[
          { titulo: "Saber exatamente quanto vem da rescisão",
            texto: "É o dinheiro que vai segurar o período sem renda. Confira verba por verba antes de assinar.",
            href: "/ferramentas/rescisao", link: "Calcular a rescisão" },
          { titulo: `Refazer o orçamento sem os ${brl(r.media)} da média`,
            texto: "Corte primeiro o que não é essencial: cada mês a menos de gasto é um mês a mais de fôlego.",
            href: "/ferramentas/orcamento", link: "Montar o orçamento" },
          { titulo: "Conferir a regra com quem entende",
            texto: "Se você acha que tem direito, confira com o RH/sindicato ou no atendimento da Carteira de Trabalho Digital." },
        ]} />
      </CascaAnalise>
    );
  }

  const cobertura = (r.valorParcela / r.media) * 100;
  const quedaMes = Math.max(0, r.media - r.valorParcela);
  const buraco = quedaMes * r.parcelas;

  /* ── O veredito ─────────────────────────────────────────────────────── */
  const veredito =
    cobertura >= 80
      ? { tom: "bom" as const, titulo: `O seguro cobre ${pct(Math.min(100, cobertura), 0)} da sua renda`,
          texto: quedaMes > 0
            ? `Por ${r.parcelas} meses você recebe ${brl(r.valorParcela)}, só ${brl(quedaMes)} abaixo da média. O padrão de vida dá para manter com pouco ajuste.`
            : `Por ${r.parcelas} meses a parcela de ${brl(r.valorParcela)} repõe a sua média inteira. O desafio é o que vem depois da última parcela.` }
      : cobertura >= 50
        ? { tom: "atencao" as const, titulo: `A renda cai ${brl(quedaMes)} por mês`,
            texto: `O seguro cobre ${pct(cobertura, 0)} do que você ganhava. Em ${r.parcelas} parcelas, faltam ${brl(buraco)} para manter o padrão — esse é o valor a cobrir com rescisão e FGTS.` }
        : { tom: "ruim" as const, titulo: `O seguro cobre menos da metade da sua renda`,
            texto: `A parcela trava em ${brl(r.valorParcela)}, contra uma média de ${brl(r.media)}. Em ${r.parcelas} meses, o buraco chega a ${brl(buraco)}. O orçamento precisa mudar já no primeiro mês.` };

  /* ── Barras: mês a mês, o que o seguro paga × o que falta ───────────── */
  const meses = Array.from({ length: r.parcelas }, (_, i) => ({
    rotulo: `${i + 1}º mês`,
    seguro: r.valorParcela,
    falta: quedaMes,
  }));

  /* ── Recomendações ──────────────────────────────────────────────────── */
  const recs: Recomendacao[] = [];
  recs.push({ titulo: "Pedir dentro do prazo",
    texto: "O pedido vai de 7 a 120 dias depois da demissão. Perdeu o prazo, perdeu o benefício — inclusive o total de " + brl(r.total) + "." });
  if (buraco > 0) {
    recs.push({ titulo: `Reservar ${brl(buraco)} da rescisão para cobrir a diferença`,
      texto: `São ${brl(quedaMes)} por mês, durante ${r.parcelas} meses. Separe esse valor antes de gastar a rescisão com outra coisa.`,
      href: "/ferramentas/rescisao", link: "Calcular a rescisão" });
  }
  recs.push({ titulo: `Ajustar o orçamento para ${brl(r.valorParcela)} por mês`,
    texto: "É a renda certa do período. Planeje também o mês seguinte à última parcela, quando o benefício acaba.",
    href: "/ferramentas/orcamento", link: "Montar o orçamento com a parcela" });
  recs.push({ titulo: "Montar a reserva para a próxima vez",
    texto: "Quando a renda voltar, uma reserva de emergência evita depender só do seguro e da rescisão.",
    href: "/ferramentas/reserva", link: "Planejar a reserva" });

  return (
    <CascaAnalise titulo="O que o seu benefício diz">
      <Veredito {...veredito} />

      <GradeIndicadores>
        <Indicador rotulo="Cobertura da renda" valor={pct(Math.min(100, cobertura), 0)} nota="parcela ÷ média dos salários" ruim={cobertura < 50} />
        <Indicador rotulo="Queda por mês" valor={brl(quedaMes)} nota="o que falta para a média" ruim={cobertura < 50} />
        <Indicador rotulo="Buraco no período" valor={brl(buraco)} nota={`em ${r.parcelas} parcelas`} ruim={cobertura < 50} />
      </GradeIndicadores>

      <CartaoGrafico titulo="Sua renda mês a mês, durante o benefício"
        legenda={quedaMes > 0 ? "A parte verde o seguro paga; a laranja é o que falta para chegar à sua média." : "A barra é a parcela: ela já repõe a sua média inteira."}>
        <BarrasEmpilhadas dados={meses} series={[
          { chave: "seguro", nome: "Seguro-desemprego", cor: CORES_ANALISE.verde },
          ...(quedaMes > 0 ? [{ chave: "falta", nome: "Falta para a média", cor: CORES_ANALISE.laranja }] : []),
        ]} />
      </CartaoGrafico>

      <Recomendacoes itens={recs.slice(0, 4)}
        rodape={<>No total, o benefício paga <b className="text-primary">{brl(r.total)}</b>. Manter a média por {r.parcelas} meses custaria{" "}
          <b className="text-primary">{brl(r.media * r.parcelas)}</b>.</>} />
    </CascaAnalise>
  );
}
