"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import {
  ModalAssinarPlano,
  type ContextoAssinatura,
  type ObjetivoAssinatura,
} from "@/components/ModalAssinarPlano";
import { PLANO_TRIAL_DIAS } from "@/lib/planejamento/oferta";

/**
 * Abre o pop-up de assinatura. Fica na landing page, depois da pessoa já ter
 * entendido o produto e visto o próprio número na calculadora.
 */
export function BotaoAssinarPlano({
  variante = "principal",
  contexto = "plano",
  objetivo = "comecar",
  rotulo,
  tamanho = "normal",
}: {
  /** `clara` é para usar sobre o bloco navy do fim da página. */
  variante?: "principal" | "clara";
  /** Muda a conversa do pop-up; a compra é a mesma. */
  contexto?: ContextoAssinatura;
  /** `pagar` para quem já está usando o produto e vai fechar a assinatura. */
  objetivo?: ObjetivoAssinatura;
  /** Sobrescreve o texto quando a seção pede outra chamada. */
  rotulo?: string;
  /** `grande` é para o herói e o bloco de preço. */
  tamanho?: "normal" | "grande";
}) {
  const [aberto, setAberto] = useState(false);

  const estilo =
    variante === "clara"
      ? "bg-white text-primary hover:bg-white/90"
      : "bg-accent-btn text-white hover:bg-accent-strong";

  const medida =
    tamanho === "grande"
      ? "px-7 py-4 text-base shadow-[0_14px_34px_-16px_hsl(16_80%_35%_/_0.75)]"
      : "px-5 py-3 text-sm";

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className={`group inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-all hover:-translate-y-0.5 ${estilo} ${medida}`}
      >
        {rotulo ?? `Começar ${PLANO_TRIAL_DIAS} dias grátis`}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </button>

      <ModalAssinarPlano
        aberto={aberto}
        aoFechar={() => setAberto(false)}
        contexto={contexto}
        objetivo={objetivo}
      />
    </>
  );
}
