"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { BookOpen, Play, X } from "lucide-react";
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

  /* ⚠️ DESTACADO, MAS NUNCA ABRE SOZINHO (pedido do dono, 24/10/2026: "destaque melhor os vídeos
     que ensinam e os manuais"). O que chama o olho é o círculo de play com um anel pulsando de
     leve e a promessa "vídeo de 15 s" — a janela continua fechada até o clique. */
  const play = (
    <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-accent shadow">
      <span aria-hidden className="absolute inset-0 rounded-full ring-2 ring-white/70 motion-safe:animate-ping" />
      <Play className="relative ml-0.5 h-4 w-4 fill-current" />
    </span>
  );

  return (
    <>
      {modo === "ferramenta" ? (
        <button
          type="button"
          onClick={() => setAberta(true)}
          aria-haspopup="dialog"
          aria-label={`Como usar: vídeo de 15 segundos e manual de ${manual.titulo}`}
          className="flex items-center gap-2.5 rounded-full bg-accent py-1.5 pl-1.5 pr-4 text-left text-white shadow-[0_12px_32px_-10px_hsl(16_80%_40%_/_0.8)] ring-2 ring-white transition-transform hover:-translate-y-0.5 print:hidden"
        >
          {play}
          <span className="leading-tight">
            <span className="block text-sm font-bold">Como usar</span>
            <span className="block text-[11px] font-medium text-white/85">Vídeo de 15 s + manual</span>
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setAberta(true)}
          aria-haspopup="dialog"
          aria-label={`Aprenda esta tela: vídeo de 15 segundos e manual de ${manual.titulo}`}
          className="flex w-full items-center gap-3 rounded-2xl border-2 border-primary bg-primary px-3 py-2.5 text-left text-white shadow-[0_16px_36px_-22px_hsl(199_75%_12%_/_0.8)] transition-transform hover:-translate-y-0.5 sm:w-auto sm:pr-5 print:hidden"
        >
          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-white">
            <span aria-hidden className="absolute inset-0 rounded-full ring-2 ring-accent/60 motion-safe:animate-ping" />
            <Play className="relative ml-0.5 h-4 w-4 fill-current" />
          </span>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block text-sm font-bold">Aprenda esta tela em 15 segundos</span>
            <span className="mt-0.5 flex items-center gap-1 text-xs text-white/75">
              <BookOpen className="h-3.5 w-3.5" />
              Vídeo curto + manual passo a passo
            </span>
          </span>
        </button>
      )}

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
                    // O clique que abriu a janela é o gesto que o navegador exige para tocar com som.
                    autoPlay
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
