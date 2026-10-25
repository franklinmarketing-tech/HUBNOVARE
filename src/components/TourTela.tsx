"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import { MANUAIS } from "@/lib/manuais";
import { acharCampos, type Achado } from "@/lib/manuais/achar";
import { registrarUso } from "@/lib/uso";

/** Dispare este evento para começar o tour da tela atual (convite de primeiro uso, Manual). */
export const INICIAR_TOUR = "novare:tour";

const chaveDa = (rota: string, modo: "ferramenta" | "fincash") =>
  modo === "ferramenta" ? rota.split("/")[2] ?? "" : rota.replace(/\/$/, "");

/**
 * TOUR GUIADO NA PRÓPRIA TELA (25/10/2026). A tela escurece e um recorte mostra o campo de
 * verdade, com a explicação do manual ao lado — "1 de 5", Próximo, Voltar, Pular.
 *
 * Os passos saem do manual (`campos`) achados na tela por `acharCampos`: tela nova com manual já
 * tem tour, sem escrever nada à parte. Só começa por clique (evento `novare:tour`) — nunca sozinho.
 */
export function TourTela({ modo }: { modo: "ferramenta" | "fincash" }) {
  const rota = usePathname();
  const chave = chaveDa(rota, modo);
  const manual = MANUAIS[chave];
  const [passos, setPassos] = useState<Achado[] | null>(null);
  const [i, setI] = useState(0);
  const [caixa, setCaixa] = useState<DOMRect | null>(null);
  const cartao = useRef<HTMLDivElement>(null);

  const fechar = useCallback(() => {
    setPassos(null);
    setI(0);
  }, []);

  useEffect(() => {
    const iniciar = () => {
      if (!manual) return;
      const achados = acharCampos(manual, 6);
      if (!achados.length) return;
      registrarUso(`tour:${chave}`, "usou");
      setI(0);
      setPassos(achados);
    };
    window.addEventListener(INICIAR_TOUR, iniciar);
    return () => window.removeEventListener(INICIAR_TOUR, iniciar);
  }, [manual, chave]);

  // Leva o campo da vez para o meio da tela e mede onde ele ficou.
  useLayoutEffect(() => {
    if (!passos) return;
    const el = passos[i]?.el;
    if (!el) return;
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    const medir = () => setCaixa(el.getBoundingClientRect());
    const t = setTimeout(medir, 380);
    window.addEventListener("resize", medir);
    window.addEventListener("scroll", medir, true);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", medir);
      window.removeEventListener("scroll", medir, true);
    };
  }, [passos, i]);

  useEffect(() => {
    if (!passos) return;
    cartao.current?.querySelector<HTMLElement>("button[data-proximo]")?.focus();
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") fechar();
      if (e.key === "ArrowRight") setI((n) => Math.min(n + 1, passos.length - 1));
      if (e.key === "ArrowLeft") setI((n) => Math.max(n - 1, 0));
    };
    document.addEventListener("keydown", tecla);
    return () => document.removeEventListener("keydown", tecla);
  }, [passos, fechar, i]);

  if (!passos || !manual) return null;
  const passo = passos[i];
  const ultimo = i === passos.length - 1;
  const folga = 8;
  const r = caixa;
  // Cartão embaixo do campo; se não couber, em cima. No celular, sempre preso embaixo da tela.
  const embaixo = r ? r.bottom + 230 < window.innerHeight : true;

  return createPortal(
    <div className="fixed inset-0 z-[75] print:hidden" aria-live="polite">
      {/* Clique fora do recorte não faz nada: o tour só sai por Pular/Concluir/Esc. */}
      <div className="absolute inset-0" />
      {r && (
        <div
          aria-hidden
          className="pointer-events-none absolute rounded-2xl ring-4 ring-accent transition-all duration-300"
          style={{
            top: r.top - folga,
            left: r.left - folga,
            width: r.width + folga * 2,
            height: r.height + folga * 2,
            boxShadow: "0 0 0 9999px rgba(6,18,28,.68)",
          }}
        />
      )}
      <div
        ref={cartao}
        role="dialog"
        aria-modal="true"
        aria-label={`Tour: passo ${i + 1} de ${passos.length}`}
        className="absolute inset-x-3 bottom-4 mx-auto max-w-md rounded-[1.5rem] border-2 border-primary bg-white p-5 shadow-[0_30px_70px_-25px_rgba(0,0,0,.7)] sm:inset-x-auto sm:mx-0 sm:w-[24rem]"
        style={
          r && typeof window !== "undefined" && window.innerWidth >= 640
            ? { left: Math.min(Math.max(16, r.left), window.innerWidth - 400), top: embaixo ? r.bottom + 18 : undefined, bottom: embaixo ? undefined : window.innerHeight - r.top + 18 }
            : undefined
        }
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent-strong">
            Passo {i + 1} de {passos.length}
          </p>
          <button type="button" onClick={fechar} aria-label="Pular o tour" className="-mr-1 -mt-1 flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1 font-display text-lg font-semibold text-primary">{passo.nome}</p>
        <p className="mt-1.5 text-sm leading-relaxed text-foreground">{passo.explica}</p>
        <div className="mt-4 flex items-center gap-2">
          {i > 0 && (
            <button type="button" onClick={() => setI(i - 1)} className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-border px-4 text-sm font-semibold text-primary hover:bg-muted">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </button>
          )}
          <button
            type="button"
            data-proximo
            onClick={() => (ultimo ? fechar() : setI(i + 1))}
            className="ml-auto inline-flex min-h-11 items-center gap-1.5 rounded-full bg-accent px-5 text-sm font-bold text-white hover:bg-accent-strong"
          >
            {ultimo ? (
              <>
                <Check className="h-4 w-4" />
                Concluir
              </>
            ) : (
              <>
                Próximo
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
        <div className="mt-3 flex gap-1" aria-hidden>
          {passos.map((_, n) => (
            <span key={n} className={`h-1.5 flex-1 rounded-full ${n <= i ? "bg-accent" : "bg-slate-200"}`} />
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}
