"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { CircleHelp, X } from "lucide-react";

import { GUIAS_FERRAMENTAS } from "@/lib/guias-ferramentas";

/**
 * "COMO USAR": o passo a passo de cada ferramenta, num cartão que não cobre a
 * tela.
 *
 * Pedido do Jefferson (20/10/2026). Segue a regra da casa para explicação:
 * fica FECHADA atrás de um botão, e o conteúdo de trabalho fica livre na
 * página. A única exceção é a PRIMEIRA visita a cada ferramenta: o cartão
 * abre sozinho uma vez, porque é exatamente quem nunca viu a tela que não
 * sabe que existe um guia. Depois de "Entendi", só abre pelo botão.
 *
 * Não é modal: a pessoa pode começar a preencher com o cartão aberto.
 */
export function GuiaFerramenta() {
  const pathname = usePathname();
  const slug = pathname.split("/")[2] ?? "";
  const passos = GUIAS_FERRAMENTAS[slug];
  const chave = `novare:guia-visto:${slug}`;
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    if (!passos) return;
    let visto = true;
    try {
      visto = Boolean(localStorage.getItem(chave));
    } catch {
      /* Sem armazenamento, não abre sozinho: melhor não insistir a cada visita. */
    }
    if (visto) return;
    const t = setTimeout(() => setAberto(true), 900);
    return () => clearTimeout(t);
  }, [passos, chave]);

  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (e: KeyboardEvent) => e.key === "Escape" && fechar();
    /* Começou a preencher? Então já entendeu: o cartão sai da frente. No
       computador ele ficava sobre o resultado enquanto a pessoa trabalhava
       (achado na varredura ao vivo de 20/10/2026). */
    const aoPreencher = () => fechar();
    window.addEventListener("keydown", aoTeclar);
    document.addEventListener("input", aoPreencher, true);
    return () => {
      window.removeEventListener("keydown", aoTeclar);
      document.removeEventListener("input", aoPreencher, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto]);

  function fechar() {
    setAberto(false);
    try {
      localStorage.setItem(chave, "1");
    } catch {}
  }

  if (!passos) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => (aberto ? fechar() : setAberto(true))}
        aria-expanded={aberto}
        className="fixed bottom-20 left-5 z-40 flex items-center gap-2 rounded-full bg-accent px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_-12px_hsl(16_80%_40%_/_0.7)] transition-transform hover:-translate-y-0.5 print:hidden"
      >
        <CircleHelp className="h-4 w-4" />
        Como usar
      </button>

      {aberto && (
        <div
          role="dialog"
          aria-label="Como usar esta ferramenta"
          className="fixed inset-x-3 bottom-36 z-50 mx-auto max-w-sm rounded-[1.75rem] border border-border bg-white p-5 shadow-vidro motion-safe:animate-[surgir_0.35s_ease-out] sm:inset-x-auto sm:left-5 print:hidden"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="font-display text-base font-bold text-primary">Como usar, em 3 passos</p>
            <button
              type="button"
              onClick={fechar}
              aria-label="Fechar"
              className="-mr-1 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-slate-100 hover:text-primary"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <ol className="mt-3 space-y-3">
            {passos.map((p, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-tint text-xs font-bold text-accent-strong">
                  {i + 1}
                </span>
                <span className="pt-1 text-sm leading-snug text-foreground">{p}</span>
              </li>
            ))}
          </ol>

          <p className="mt-4 rounded-xl bg-slate-50 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
            No fim da página você salva o resultado em PDF — sem cadastro. Falar
            com um especialista é opcional.
          </p>

          <button
            type="button"
            onClick={fechar}
            className="btn-petroleo mt-4 w-full"
          >
            Entendi, vamos lá
          </button>
        </div>
      )}
    </>
  );
}
