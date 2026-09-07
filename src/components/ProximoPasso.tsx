"use client";

import Link from "next/link";
import { ArrowRight, CalendarCheck, CircleCheckBig } from "lucide-react";
import { brl } from "@/app/planejamento/app/pecas";
import { rotuloMes, mesAtual } from "@/lib/planejamento/catalogos";
import { nextMonthRef } from "@/lib/planejamento/mesSeguinte";

/**
 * "Fechei o mês. E agora?"
 *
 * Antes daqui, fechar o mês jogava a pessoa na tela de evolução e, se ela
 * voltasse, encontrava uma tarja verde de uma linha: "este mês já está
 * fechado". Isso diz o ESTADO e não diz a AÇÃO — e é exatamente onde alguém
 * que acabou de cumprir a tarefa fica sem saber o que fazer com o app.
 *
 * As três perguntas que este painel responde, nesta ordem:
 *   1. o que eu acabei de fazer?
 *   2. o que faço até o mês virar?
 *   3. quando eu volto?
 *
 * A do meio é a única que exige julgamento, e ela sai do próprio plano: a
 * prioridade é sempre o buraco mais caro primeiro — reserva antes de aporte,
 * porque sem reserva o primeiro imprevisto desmonta o aporte; dívida cara
 * antes de investir, porque nenhum investimento paga juro de cartão.
 */
export function ProximoPasso({
  mes,
  reserva,
  comprometimentoDividas,
  sobraMensal,
  aporteRecomendado,
}: {
  /** O mês que acabou de ser fechado, em `YYYY-MM-01`. */
  mes: string;
  reserva: { completa: boolean; faltam: number; meses: number };
  comprometimentoDividas: number;
  sobraMensal: number;
  aporteRecomendado: number;
}) {
  const proximo = nextMonthRef(mes);

  /* A prioridade. Uma só: lista de cinco coisas para fazer é lista que
     ninguém faz. */
  const foco = (() => {
    if (sobraMensal <= 0) {
      return {
        titulo: "Seu mês fecha no vermelho",
        texto:
          "Antes de guardar qualquer coisa, é preciso sobrar. Abra o seu plano e veja onde o corte dói menos.",
        href: "/planejamento/app/plano",
        cta: "Ver onde cortar",
      };
    }
    if (comprometimentoDividas > 30) {
      return {
        titulo: "A dívida está comendo o seu mês",
        texto: `Hoje ${Math.round(comprometimentoDividas)}% da sua renda vai em parcela. Enquanto isso não cair, nenhum investimento compensa — o juro que você paga é maior que o que você ganharia.`,
        href: "/planejamento/app/plano",
        cta: "Ver o plano da dívida",
      };
    }
    if (!reserva.completa) {
      return {
        titulo: "Complete a sua reserva",
        texto: `Faltam ${brl(reserva.faltam)} para os ${reserva.meses} meses de reserva. É ela que segura o primeiro imprevisto sem desmontar o resto do plano.`,
        href: "/planejamento/app/plano",
        cta: "Ver o plano da reserva",
      };
    }
    if (aporteRecomendado > 0) {
      return {
        titulo: "Mantenha o aporte de pé",
        texto: `Reserva feita e dívida sob controle. O movimento agora é guardar ${brl(aporteRecomendado)} por mês — é o que fecha a conta no prazo que você definiu.`,
        href: "/planejamento/app/plano",
        cta: "Ver o meu plano",
      };
    }
    return {
      titulo: "Você está no ritmo",
      texto:
        "Reserva feita, dívida sob controle e aporte em dia. Não há nada urgente — o próximo movimento é só continuar.",
      href: "/planejamento/app/evolucao",
      cta: "Ver a minha evolução",
    };
  })();

  return (
    <section className="mb-6 overflow-hidden rounded-3xl border border-success/25 bg-success/[0.04]">
      <div className="border-b border-success/15 px-6 py-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-success-strong">
          <CircleCheckBig className="h-4 w-4 shrink-0" strokeWidth={2} />
          {rotuloMes(mes)} fechado. Os números entraram na sua evolução.
        </p>
      </div>

      <div className="px-6 py-5">
        <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-accent-strong">
          E agora?
        </p>
        <h3 className="mt-1.5 font-display text-lg font-semibold text-primary">
          {foco.titulo}
        </h3>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
          {foco.texto}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
          <Link
            href={foco.href}
            className="inline-flex items-center gap-2 rounded-xl bg-accent-btn px-5 py-2.5 text-sm font-bold text-white shadow-[0_4px_14px_-6px_hsl(16_80%_45%_/_0.6)] transition-all hover:-translate-y-0.5"
          >
            {foco.cta}
            <ArrowRight className="h-4 w-4" />
          </Link>

          {/* Quando voltar. Sem isto a pessoa não sabe se o app pede algo dela
              amanhã ou daqui a um mês — e na dúvida ela para de abrir. */}
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <CalendarCheck className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
            {proximo > mesAtual()
              ? `Volte no começo de ${rotuloMes(proximo)} para fechar o próximo.`
              : `${rotuloMes(proximo)} já está aberto para lançar.`}
          </p>
        </div>

        <p className="mt-4 border-t border-success/15 pt-3 text-[11px] leading-relaxed text-muted-foreground">
          Não precisa lançar nada até lá. Se algo mudar no meio do caminho —
          salário, dívida nova, um objetivo — atualize em{" "}
          <Link
            href="/planejamento/app/meus-dados"
            className="font-semibold text-accent-strong underline-offset-2 hover:underline"
          >
            Meus dados
          </Link>{" "}
          e o plano inteiro se recalcula.
        </p>
      </div>
    </section>
  );
}
