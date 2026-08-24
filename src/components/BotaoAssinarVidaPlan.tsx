"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { ModalAssinarVidaPlan } from "@/components/ModalAssinarVidaPlan";
import { VIDA_PLAN_TRIAL_DIAS } from "@/lib/vidaplan";

/**
 * Abre o pop-up de assinatura. Fica na landing page, depois da pessoa já ter
 * entendido o produto e visto o próprio número na calculadora.
 */
export function BotaoAssinarVidaPlan({
  variante = "principal",
}: {
  /** `clara` é para usar sobre o bloco navy do fim da página. */
  variante?: "principal" | "clara";
}) {
  const [aberto, setAberto] = useState(false);

  const estilo =
    variante === "clara"
      ? "bg-white text-primary hover:bg-white/90"
      : "bg-accent-btn text-white hover:bg-accent-strong";

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-colors ${estilo}`}
      >
        Começar {VIDA_PLAN_TRIAL_DIAS} dias grátis
        <ArrowRight className="h-4 w-4" />
      </button>

      <ModalAssinarVidaPlan aberto={aberto} aoFechar={() => setAberto(false)} />
    </>
  );
}
