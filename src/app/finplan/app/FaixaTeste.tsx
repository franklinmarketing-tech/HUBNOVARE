"use client";

import { Clock, Sparkles } from "lucide-react";
import { useAssinatura } from "@/lib/planejamento/useAssinatura";
import { BotaoAssinarPlano } from "@/components/BotaoAssinarPlano";
import {
  ASSINATURA_GARANTIA,
  ASSINATURA_PRECO_ANUAL_MENSAL_ROTULO,
  ASSINATURA_PRECO_ROTULO,
} from "@/lib/assinatura";

/**
 * O ponto de cobrança DENTRO do app.
 *
 * É o segundo lugar onde a assinatura se paga — o primeiro é a página de
 * venda. A diferença importa: aqui a pessoa já usou o produto, já viu o
 * próprio número, e a conversa deixa de ser "vale a pena?" para ser "quero
 * continuar". Por isso a faixa fala do que ela perde, não do que ela ganha.
 *
 * Enquanto o teste está correndo a faixa é discreta. Quando falta pouco, ou
 * quando venceu, ela toma a tela. LER continua sempre liberado — cortar a
 * visão de quem está no meio de um plano é perder o cliente e o dado junto —
 * mas as três AÇÕES do produto (gerar plano, fechar o mês, baixar o
 * relatório) passam a pedir assinatura, via <AcaoAssinante>. É exatamente o
 * que esta faixa sempre prometeu.
 *
 * ⚠️ POR QUE ELA AINDA FALA EM "TESTE" DEPOIS DE O TESTE SAIR DA VENDA
 *
 * A oferta agora é garantia de 7 dias, não teste grátis — e nenhuma página
 * pública anuncia teste. Mas o motor continua ligado (`lib/trial.ts`) e tem
 * gente com dias correndo AGORA, sob uma promessa que a casa fez. Esta faixa
 * não anuncia nada: ela relata o estado de quem já está dentro. Trocar o
 * texto para "garantia" aqui seria mentir para a única pessoa que sabe, pela
 * própria tela, que está em teste.
 *
 * Quando `trial.ts` for desligado (no dia em que o checkout entrar no ar),
 * este componente inteiro sai junto.
 */
export function FaixaTeste() {
  // A leitura vem do módulo compartilhado: uma consulta por carga, com o
  // erro tratado lá (antes, uma rejeição de rede sumia com a faixa em
  // silêncio, porque a promise não tinha .catch).
  const estado = useAssinatura();

  // Quem paga não precisa ver nada disso.
  if (estado.fase === "carregando") return null;
  const assinatura = estado.assinatura;
  if (!assinatura || assinatura.status === "active") return null;

  const dias = assinatura.diasRestantes ?? 0;
  const venceu = !assinatura.liberado;
  const acabando = !venceu && dias <= 3;

  if (venceu) {
    return (
      <div className="nao-imprimir mb-5 rounded-2xl border border-accent-soft bg-accent-tint p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 font-display text-base font-bold text-primary">
              <Clock className="h-4 w-4 text-accent-strong" />
              Seu período de teste terminou
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Seus dados continuam aqui, intactos. Assine por{" "}
              {ASSINATURA_PRECO_ANUAL_MENSAL_ROTULO}/mês no plano anual (ou{" "}
              {ASSINATURA_PRECO_ROTULO}/mês avulso) para voltar a gerar plano,
              fechar o mês e baixar o relatório. {ASSINATURA_GARANTIA}.
            </p>
          </div>
          <BotaoAssinarPlano contexto="workspace" objetivo="pagar" rotulo="Assinar agora" />
        </div>
      </div>
    );
  }

  if (acabando) {
    return (
      <div className="nao-imprimir mb-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-warning/40 bg-warning/5 p-4">
        <p className="min-w-0 text-sm text-slate-600">
          <strong className="text-foreground">
            {dias === 1 ? "Último dia" : `Faltam ${dias} dias`} do seu teste.
          </strong>{" "}
          Depois é {ASSINATURA_PRECO_ROTULO}/mês — ou{" "}
          {ASSINATURA_PRECO_ANUAL_MENSAL_ROTULO}/mês no anual —, e você mantém
          tudo o que já construiu aqui.
        </p>
        <BotaoAssinarPlano contexto="workspace" objetivo="pagar" rotulo="Continuar assinando" />
      </div>
    );
  }

  return (
    <div className="nao-imprimir mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-2.5">
      <p className="flex items-center gap-1.5 text-2xs font-semibold text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5 text-accent-strong" />
        Seu teste · {dias} {dias === 1 ? "dia restante" : "dias restantes"}
      </p>
      <BotaoAssinarPlano contexto="workspace" objetivo="pagar" rotulo={`Assinar por ${ASSINATURA_PRECO_ROTULO}`} />
    </div>
  );
}
