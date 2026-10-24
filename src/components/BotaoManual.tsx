"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { BookOpen, X } from "lucide-react";
import { MANUAIS, arquivoDoVideo } from "@/lib/manuais";
import { registrarUso } from "@/lib/uso";

/**
 * O BOTÃO "MANUAL" E A JANELA (24/10/2026). Mesma janela nas ferramentas e
 * no FINCASH: vídeo curto no topo e as 5 partes de `lib/manuais/tipo.ts`.
 *
 * ⚠️ FECHADO POR PADRÃO. Nunca abre sozinho (guideline, docs/GUIDELINE-UX.md).
 * Esc fecha, o fundo trava e o foco volta para o botão.
 *
 * `chave`: slug da ferramenta ou rota do FINCASH. Sem manual, não desenha nada.
 */
export function BotaoManual({ modo }: { modo: "ferramenta" | "fincash" }) {
  const rota = usePathname();
  const chave = modo === "ferramenta" ? rota.split("/")[2] ?? "" : rota.replace(/\/$/, "");
  const manual = MANUAIS[chave];
  const [aberta, setAberta] = useState(false);
  const [montado, setMontado] = useState(false);
  const [semVideo, setSemVideo] = useState(false);
  const painel = useRef<HTMLDivElement>(null);
  const fechar = useCallback(() => setAberta(false), []);

  useEffect(() => setMontado(true), []);
  useEffect(() => setSemVideo(false), [chave]);

  useEffect(() => {
    if (!aberta) return;
    registrarUso(`manual:${chave}`, "usou");
    const antes = document.activeElement as HTMLElement | null;
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && fechar();
    document.addEventListener("keydown", tecla);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    painel.current?.querySelector<HTMLElement>("button")?.focus();
    return () => {
      document.removeEventListener("keydown", tecla);
      document.body.style.overflow = overflow;
      antes?.focus?.();
    };
  }, [aberta, fechar, chave]);

  if (!manual) return null;

  const botao =
    modo === "ferramenta"
      ? "flex items-center gap-2 rounded-full bg-accent px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_-12px_hsl(16_80%_40%_/_0.7)] transition-transform hover:-translate-y-0.5"
      : "inline-flex min-h-10 items-center gap-2 rounded-full border-2 border-primary/20 bg-white px-4 text-xs font-semibold text-primary transition-colors hover:border-primary hover:bg-primary hover:text-white";

  return (
    <>
      <button type="button" onClick={() => setAberta(true)} aria-haspopup="dialog" className={`${botao} print:hidden`}>
        <BookOpen className="h-4 w-4" />
        {modo === "ferramenta" ? "Manual" : "Manual desta tela"}
      </button>

      {aberta &&
        montado &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="manual-titulo"
            onClick={fechar}
            className="fixed inset-0 z-[70] flex items-end justify-center bg-primary/50 p-3 backdrop-blur-sm sm:items-center sm:p-6"
          >
            <div
              ref={painel}
              onClick={(e) => e.stopPropagation()}
              className="surgir relative max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-[1.75rem] border-2 border-primary bg-white shadow-[0_40px_80px_-30px_hsl(199_75%_10%_/_0.7)]"
            >
              <div className="sticky top-0 z-10 bg-primary px-5 py-4 pr-16 text-white sm:px-7">
                <button
                  type="button"
                  onClick={fechar}
                  aria-label="Fechar o manual"
                  className="absolute right-4 top-3.5 flex h-10 w-10 items-center justify-center rounded-full text-white/80 hover:bg-white/10 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ciano-claro">Manual</p>
                <h2 id="manual-titulo" className="mt-0.5 font-display text-xl font-semibold sm:text-2xl">
                  {manual.titulo}
                </h2>
              </div>

              <div className="space-y-6 px-5 py-5 sm:px-7">
                {!semVideo && (
                  <video
                    src={arquivoDoVideo(chave)}
                    controls
                    playsInline
                    preload="metadata"
                    onError={() => setSemVideo(true)}
                    className="mx-auto aspect-[9/16] max-h-[52dvh] rounded-2xl bg-slate-900 shadow-lg"
                  />
                )}

                <Parte titulo="O que esta tela faz">
                  <p className="text-sm leading-relaxed text-foreground">{manual.oQueFaz}</p>
                </Parte>

                <Parte titulo="Passo a passo">
                  <ol className="space-y-2">
                    {manual.passos.map((p, i) => (
                      <li key={i} className="flex gap-3 text-sm leading-relaxed">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
                          {i + 1}
                        </span>
                        <span className="pt-0.5">{p}</span>
                      </li>
                    ))}
                  </ol>
                </Parte>

                <Parte titulo="O que significa cada campo">
                  <dl className="divide-y divide-border rounded-xl border border-border">
                    {manual.campos.map((c) => (
                      <div key={c.nome} className="grid gap-0.5 px-4 py-2.5 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.6fr)] sm:gap-4">
                        <dt className="text-sm font-semibold text-primary">{c.nome}</dt>
                        <dd className="text-sm leading-relaxed text-muted-foreground">{c.explica}</dd>
                      </div>
                    ))}
                  </dl>
                </Parte>

                <Parte titulo="Como ler o resultado">
                  <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed marker:text-accent">
                    {manual.resultado.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </Parte>

                <Parte titulo="Dúvidas frequentes">
                  <div className="space-y-2">
                    {manual.duvidas.map((d) => (
                      <details key={d.p} className="group rounded-xl border border-border px-4 py-3">
                        <summary className="cursor-pointer list-none text-sm font-semibold text-primary">
                          {d.p}
                        </summary>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{d.r}</p>
                      </details>
                    ))}
                  </div>
                </Parte>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

function Parte({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-accent-strong">{titulo}</h3>
      {children}
    </section>
  );
}
