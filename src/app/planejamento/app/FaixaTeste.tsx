"use client";

import { useEffect, useState } from "react";
import { Clock, Sparkles } from "lucide-react";
import { garantirTeste, type Assinatura } from "@/lib/trial";
import { BotaoAssinarPlano } from "@/components/BotaoAssinarPlano";
import { ASSINATURA_PRECO_ROTULO } from "@/lib/assinatura";

/**
 * O ponto de cobrança DENTRO do app.
 *
 * É o segundo lugar onde a assinatura se paga — o primeiro é a página de
 * venda. A diferença importa: aqui a pessoa já usou o produto, já viu o
 * próprio número, e a conversa deixa de ser "vale a pena?" para ser "quero
 * continuar". Por isso a faixa fala do que ela perde, não do que ela ganha.
 *
 * Enquanto o teste está correndo a faixa é discreta. Quando falta pouco, ou
 * quando venceu, ela toma a tela — mas nunca bloqueia: cortar o acesso de
 * quem está no meio de um plano é a forma mais rápida de perder o cliente e
 * o dado dele junto.
 */
export function FaixaTeste() {
  const [assinatura, setAssinatura] = useState<Assinatura | null>(null);

  useEffect(() => {
    let ativo = true;
    garantirTeste().then((a) => {
      if (ativo) setAssinatura(a);
    });
    return () => {
      ativo = false;
    };
  }, []);

  // Quem paga não precisa ver nada disso.
  if (!assinatura || assinatura.status === "active") return null;

  const dias = assinatura.diasRestantes ?? 0;
  const venceu = !assinatura.liberado;
  const acabando = !venceu && dias <= 3;

  if (venceu) {
    return (
      <div className="mb-5 rounded-2xl border border-accent-soft bg-accent-tint p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 font-display text-base font-bold text-primary">
              <Clock className="h-4 w-4 text-accent-strong" />
              Seu teste grátis terminou
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Seus dados continuam aqui, intactos. Assine por{" "}
              {ASSINATURA_PRECO_ROTULO}/mês para voltar a gerar plano, fechar o
              mês e baixar o relatório.
            </p>
          </div>
          <BotaoAssinarPlano contexto="workspace" objetivo="pagar" rotulo="Assinar agora" />
        </div>
      </div>
    );
  }

  if (acabando) {
    return (
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-warning/40 bg-warning/5 p-4">
        <p className="min-w-0 text-sm text-slate-600">
          <strong className="text-foreground">
            {dias === 1 ? "Último dia" : `Faltam ${dias} dias`} do seu teste.
          </strong>{" "}
          Depois é {ASSINATURA_PRECO_ROTULO}/mês, e você mantém tudo o que já
          construiu aqui.
        </p>
        <BotaoAssinarPlano contexto="workspace" objetivo="pagar" rotulo="Continuar assinando" />
      </div>
    );
  }

  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-2.5">
      <p className="flex items-center gap-1.5 text-2xs font-semibold text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5 text-accent-strong" />
        Teste grátis · {dias} {dias === 1 ? "dia restante" : "dias restantes"}
      </p>
      <BotaoAssinarPlano contexto="workspace" objetivo="pagar" rotulo={`Assinar por ${ASSINATURA_PRECO_ROTULO}`} />
    </div>
  );
}
