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

const CAMPOS = "input, select, textarea, [role=slider]";

/**
 * O rótulo sozinho ("Saiu") é pequeno demais para o recorte: o valor ficava de fora e o cartão
 * caía em cima dele (25/10). Sobe até o bloco do campo — rótulo + valor/entrada — e para antes de
 * pegar o vizinho: bloco grande, com mais de uma entrada, ou com outro passo dentro.
 */
function blocoDo(el: HTMLElement, outros: HTMLElement[]) {
  let alvo = el;
  for (let a = el.parentElement; a && a.tagName !== "MAIN"; a = a.parentElement) {
    const r = a.getBoundingClientRect();
    if (r.height > 240) break;
    if (a.querySelectorAll(CAMPOS).length > 1) break;
    if (outros.some((o) => o !== el && a.contains(o))) break;
    alvo = a;
  }
  return alvo;
}

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
  const [alturaCartao, setAlturaCartao] = useState(260);
  const cartao = useRef<HTMLDivElement>(null);

  // A altura de verdade do cartão (o texto muda de passo para passo) decide se ele cabe embaixo.
  useLayoutEffect(() => {
    const h = cartao.current?.offsetHeight;
    if (h && h !== alturaCartao) setAlturaCartao(h);
  });

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
      const rotulos = achados.map((a) => a.el);
      setPassos(
        achados.map((a) => ({
          ...a,
          // "Valor do imóvel / Valor do veículo / …": o título mostra só o que está NA tela
          nome: a.nome.includes("/") ? (a.el.innerText.split("\n")[0].replace(/\?$/, "").trim() || a.nome) : a.nome,
          el: blocoDo(a.el, rotulos),
        })),
      );
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
    // Foco no cartão, não no botão: o anel de foco do botão desenhava um contorno duplo no
    // "Próximo" (25/10). Tab continua levando aos botões.
    cartao.current?.focus({ preventScroll: true });
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
  // ⚠️ Só UM dos dois (top OU bottom): com os dois o cartão esticava até o pé da tela (25/10).
  const LARGURA = 384;
  const vao = folga + 14;
  const cabeEmbaixo = !!r && r.bottom + vao + alturaCartao + 12 <= window.innerHeight;
  const cabeEmCima = !!r && r.top - vao - alturaCartao - 12 >= 0;
  // Não cabe nem embaixo nem em cima (campo alto): fica preso no pé da tela, sem setinha.
  const solto = !!r && window.innerWidth >= 640 && (cabeEmbaixo || cabeEmCima);
  const embaixo = cabeEmbaixo;
  const esquerda = r ? Math.min(Math.max(16, r.left + r.width / 2 - LARGURA / 2), window.innerWidth - LARGURA - 16) : 0;
  const seta = r ? Math.min(Math.max(28, r.left + r.width / 2 - esquerda), LARGURA - 28) : 0;

  return createPortal(
    <div className="fixed inset-0 z-[75] print:hidden" aria-live="polite">
      {/* Clique fora do recorte não faz nada: o tour só sai por Pular/Concluir/Esc. */}
      <div className="absolute inset-0" />
      {r && (
        <div
          aria-hidden
          className="pointer-events-none absolute rounded-2xl transition-all duration-300"
          style={{
            top: r.top - folga,
            left: r.left - folga,
            width: r.width + folga * 2,
            height: r.height + folga * 2,
            // anel laranja + escurecido numa sombra só: `ring-*` também é box-shadow e era apagado
            boxShadow: "0 0 0 3px var(--color-accent), 0 0 0 9999px rgba(6,18,28,.68)",
          }}
        />
      )}
      <div
        ref={cartao}
        role="dialog"
        aria-modal="true"
        aria-label={`Tour: passo ${i + 1} de ${passos.length}`}
        tabIndex={-1}
        className="absolute inset-x-3 bottom-4 mx-auto h-fit max-w-md rounded-[1.25rem] border border-primary/15 bg-white shadow-[0_30px_70px_-25px_rgba(0,0,0,.7)] outline-none transition-[top,left,bottom] duration-300 sm:inset-x-auto sm:mx-0"
        style={
          solto
            ? { width: LARGURA, left: esquerda, top: embaixo ? r!.bottom + vao : "auto", bottom: embaixo ? "auto" : window.innerHeight - r!.top + vao }
            : r && window.innerWidth >= 640
              ? { width: LARGURA, left: esquerda }
              : undefined
        }
      >
        {/* setinha apontando para o campo aceso */}
        {solto && (
          <span
            aria-hidden
            className={`absolute h-3.5 w-3.5 rotate-45 border-primary/15 ${embaixo ? "-top-[7px] border-l border-t bg-primary" : "-bottom-[7px] border-b border-r bg-white"}`}
            style={{ left: seta - 7 }}
          />
        )}
        {/* faixa escura do título — padrão das janelas da Novare */}
        <div className="relative flex items-center gap-3 rounded-t-[1.25rem] bg-primary px-5 py-3.5 text-white">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold">{i + 1}</span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ciano-claro">
              Passo {i + 1} de {passos.length}
            </p>
            <p className="font-display text-base font-semibold leading-snug">{passo.nome}</p>
          </div>
          <button type="button" onClick={fechar} aria-label="Fechar o tour" className="-mr-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 pb-4 pt-3.5">
        <p className="text-[15px] leading-relaxed text-foreground">{passo.explica}</p>
        <div className="mt-4 flex gap-1" aria-hidden>
          {passos.map((_, n) => (
            <span key={n} className={`h-1.5 flex-1 rounded-full transition-colors ${n <= i ? "bg-accent" : "bg-slate-200"}`} />
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2">
          {!ultimo && (
            <button type="button" onClick={fechar} className="min-h-11 rounded-full px-2 text-sm font-semibold text-muted-foreground hover:text-primary">
              Pular
            </button>
          )}
          {i > 0 && (
            <button type="button" onClick={() => setI(i - 1)} className="ml-auto inline-flex min-h-11 items-center gap-1.5 rounded-full border border-border px-4 text-sm font-semibold text-primary hover:bg-muted">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </button>
          )}
          <button
            type="button"
            data-proximo
            onClick={() => (ultimo ? fechar() : setI(i + 1))}
            className={`${i > 0 ? "" : "ml-auto"} inline-flex min-h-11 items-center gap-1.5 rounded-full bg-accent px-5 text-sm font-bold text-white hover:bg-accent-strong`}
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
        </div>
      </div>
    </div>,
    document.body,
  );
}
