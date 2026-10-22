"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { MessageSquareText, X } from "lucide-react";
import { FormContato } from "@/components/FormContato";

/** Evento para abrir a janela de qualquer lugar (ex.: o agradecimento da avaliação). */
export const ABRIR_MENSAGEM = "novare:abrir-mensagem";

/* Onde o botão NÃO aparece: área interna, telas de login e a própria
   página de contato (lá o formulário já está aberto). */
const SEM_BOTAO = ["/admin", "/fincash/app", "/login", "/auth", "/nova-senha", "/reset-password", "/fale-conosco"];

/**
 * O "FALE COM A GENTE" FLUTUANTE (21/10/2026), em todas as páginas públicas.
 *
 * ⚠️ É UMA ABA NA LATERAL DIREITA, NO MEIO DA TELA — não um botão de canto.
 * Os quatro cantos já têm dono: o assistente das ferramentas (direita), o
 * "Voltar" e o guia (esquerda), a barra de baixo no celular e o aviso de
 * cookies. Mais um botão redondo no canto empilharia em cima deles.
 *
 * A janela segue o `ModalApp`: Esc fecha, o fundo trava, o Tab fica preso
 * dentro e o foco volta para quem abriu.
 */
export function BotaoMensagem() {
  const caminho = usePathname();
  const [aberta, setAberta] = useState(false);
  const [montado, setMontado] = useState(false);
  const painel = useRef<HTMLDivElement>(null);
  const fechar = useCallback(() => setAberta(false), []);

  useEffect(() => setMontado(true), []);

  useEffect(() => {
    const abrir = () => setAberta(true);
    window.addEventListener(ABRIR_MENSAGEM, abrir);
    return () => window.removeEventListener(ABRIR_MENSAGEM, abrir);
  }, []);

  useEffect(() => {
    if (!aberta) return;
    const focadoAntes = document.activeElement as HTMLElement | null;
    const focaveis = () =>
      [
        ...(painel.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not(.sr-only), select, textarea, [tabindex]:not([tabindex="-1"])',
        ) ?? []),
      ].filter((el) => el.offsetParent !== null);

    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") return fechar();
      if (e.key !== "Tab") return;
      const lista = focaveis();
      if (!lista.length) return;
      const [primeiro, ultimo] = [lista[0], lista[lista.length - 1]];
      const atual = document.activeElement;
      if (e.shiftKey && (atual === primeiro || !painel.current?.contains(atual))) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && (atual === ultimo || !painel.current?.contains(atual))) {
        e.preventDefault();
        primeiro.focus();
      }
    }

    document.addEventListener("keydown", aoTeclar);
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    painel.current?.querySelector<HTMLElement>("button")?.focus();
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.body.style.overflow = overflowAnterior;
      focadoAntes?.focus?.();
    };
  }, [aberta, fechar]);

  if (SEM_BOTAO.some((p) => caminho === p || caminho.startsWith(`${p}/`))) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setAberta(true)}
        aria-label="Fale com a gente: mande uma mensagem para a Novare"
        className="fixed right-0 top-1/2 z-30 flex -translate-y-1/2 items-center gap-2 rounded-l-2xl bg-primary px-2.5 py-3 text-white shadow-[0_12px_30px_-12px_hsl(215_50%_15%_/_0.7)] transition-[padding] hover:pr-3.5 print:hidden sm:py-4"
      >
        <MessageSquareText className="h-5 w-5 shrink-0" />
        <span className="hidden text-xs font-semibold tracking-wide [writing-mode:vertical-rl] sm:block sm:rotate-180">
          Fale com a gente
        </span>
      </button>

      {aberta &&
        montado &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="mensagem-titulo"
            onClick={fechar}
            className="fixed inset-0 z-[60] flex items-end justify-center bg-primary/45 p-3 backdrop-blur-sm sm:items-center sm:p-6"
          >
            <div
              ref={painel}
              onClick={(e) => e.stopPropagation()}
              className="surgir relative max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-6 shadow-[0_40px_80px_-30px_hsl(215_50%_15%_/_0.6)] sm:p-7"
            >
              <button
                type="button"
                onClick={fechar}
                aria-label="Fechar"
                className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
              <p className="chapeu chapeu-ciano">Fale com a gente</p>
              <h2 id="mensagem-titulo" className="titulo-cp mt-1.5 pr-10 text-2xl">
                Mande a sua mensagem
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Dúvida, sugestão, algo que não funcionou ou vontade de falar com um consultor — uma pessoa da
                Novare lê e responde.
              </p>
              <div className="mt-5">
                <FormContato />
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
