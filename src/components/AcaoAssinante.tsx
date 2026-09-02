"use client";

import { Lock } from "lucide-react";
import { useAssinatura } from "@/lib/planejamento/useAssinatura";
import { BotaoAssinarPlano } from "@/components/BotaoAssinarPlano";
import { ASSINATURA_PRECO_ROTULO } from "@/lib/assinatura";

/**
 * A porta das três ações pagas do Planejamento: gerar plano, fechar o mês e
 * baixar o relatório.
 *
 * LER nunca é bloqueado — os números da pessoa continuam na tela mesmo com o
 * teste vencido, porque prender o dado do cliente é o jeito mais rápido de
 * perdê-lo. O que expira é o direito de ACIONAR: no lugar do botão entra o
 * convite de assinatura, dizendo qual ação está presa.
 *
 * Enquanto a assinatura carrega, a ação fica liberada (regra do
 * useAssinatura): bloquear no escuro puniria a conexão lenta, e quem paga
 * veria o próprio botão piscar em "assine".
 *
 * ⚠️ Isto é trava de PRODUTO, não de segurança: o dado continua protegido
 * pela RLS do banco, e um usuário técnico sempre pode chamar a API na mão.
 * O objetivo é o fluxo honesto cobrar o preço, não blindar contra fraude.
 */
export function AcaoAssinante({
  acao,
  children,
}: {
  /** O nome da ação presa, ex.: "gerar o plano de novo". */
  acao: string;
  children: React.ReactNode;
}) {
  const estado = useAssinatura();

  if (estado.liberado) return <>{children}</>;

  return (
    <div className="nao-imprimir flex flex-wrap items-center gap-3 rounded-2xl border border-accent-soft bg-accent-tint px-4 py-3">
      <p className="flex min-w-0 items-center gap-2 text-xs text-slate-600">
        <Lock className="h-3.5 w-3.5 shrink-0 text-accent-strong" />
        Seu teste terminou. Assine por {ASSINATURA_PRECO_ROTULO}/mês para{" "}
        {acao}.
      </p>
      <BotaoAssinarPlano contexto="workspace" objetivo="pagar" rotulo="Assinar agora" />
    </div>
  );
}
