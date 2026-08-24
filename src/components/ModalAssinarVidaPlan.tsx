"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Lock, X } from "lucide-react";
import {
  VIDA_PLAN_CHECKOUT_URL,
  VIDA_PLAN_INCLUI,
  VIDA_PLAN_PRECO_ROTULO,
} from "@/lib/vidaplan";
import { falarNoWhatsApp } from "@/lib/contato";

/**
 * Pop-up de assinatura do Vida Plan.
 *
 * Enquanto `VIDA_PLAN_CHECKOUT_URL` estiver vazio, o botão leva à Novare pelo
 * WhatsApp: melhor uma conversa real do que um botão de compra que não cobra.
 * No dia em que o link existir, o mesmo botão passa a abrir o checkout.
 */
export function ModalAssinarVidaPlan({
  aberto,
  aoFechar,
}: {
  aberto: boolean;
  aoFechar: () => void;
}) {
  const caixaRef = useRef<HTMLDivElement>(null);
  const [fechando, setFechando] = useState(false);

  // Esc fecha e o fundo não rola enquanto o pop-up está aberto.
  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") aoFechar();
    };
    document.addEventListener("keydown", aoTeclar);
    const overflowAntes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    caixaRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.body.style.overflow = overflowAntes;
    };
  }, [aberto, aoFechar]);

  if (!aberto) return null;

  const temCheckout = VIDA_PLAN_CHECKOUT_URL.trim().length > 0;
  const destino = temCheckout
    ? VIDA_PLAN_CHECKOUT_URL
    : falarNoWhatsApp(
        `Olá! Quero assinar o Vida Plan (${VIDA_PLAN_PRECO_ROTULO} por mês).`,
      );

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-primary/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={aoFechar}
      role="presentation"
    >
      <div
        ref={caixaRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-assinar-vidaplan"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md overflow-hidden rounded-t-3xl bg-card shadow-elevated outline-none sm:rounded-3xl"
      >
        {/* Cabeçalho navy com o preço */}
        <div className="relative bg-primary p-6 text-white sm:p-7">
          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar"
            className="absolute right-4 top-4 rounded-lg p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>

          <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
            Assinatura Vida Plan
          </p>
          <h2
            id="titulo-assinar-vidaplan"
            className="mt-1.5 font-display text-2xl font-bold leading-tight"
          >
            Seu plano de vida, acompanhado de perto
          </h2>

          <div className="mt-5 flex items-baseline gap-1.5">
            <span className="font-display text-4xl font-black tabular-nums">
              {VIDA_PLAN_PRECO_ROTULO}
            </span>
            <span className="text-sm text-white/70">por mês</span>
          </div>
        </div>

        {/* O que está incluso */}
        <div className="p-6 sm:p-7">
          <ul className="space-y-2.5">
            {VIDA_PLAN_INCLUI.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-foreground">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <a
            href={destino}
            target={temCheckout ? "_self" : "_blank"}
            rel="noopener noreferrer"
            onClick={() => !temCheckout && setFechando(true)}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-accent-btn px-5 py-3.5 text-sm font-bold text-white transition-colors hover:bg-accent-strong"
          >
            {temCheckout ? "Assinar agora" : "Quero assinar"}
          </a>

          {!temCheckout && !fechando && (
            <p className="mt-2.5 text-center text-xs text-muted-foreground">
              O pagamento online está sendo liberado. Por enquanto um consultor
              conclui a assinatura com você pelo WhatsApp.
            </p>
          )}

          <p className="mt-4 flex items-center justify-center gap-1.5 text-2xs text-muted-foreground">
            <Lock className="h-3 w-3" />
            Cancele quando quiser. Seus dados seguem a LGPD.
          </p>
        </div>
      </div>
    </div>
  );
}
