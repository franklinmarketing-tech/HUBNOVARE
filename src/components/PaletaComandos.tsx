"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Lock, Search } from "lucide-react";
import { gradienteDe, iconeDe, raioDe } from "@/lib/icones";
import type { AppLeve } from "@/lib/navegacao";

/**
 * Paleta de comandos (Cmd+K / Ctrl+K).
 *
 * É o que transforma um catálogo em ferramenta de trabalho: com quatorze
 * aplicativos, achar pelo teclado é mais rápido do que caçar com o olho.
 */

/** Busca tolerante: ignora acento e caixa, e casa por trecho em qualquer campo. */
function normalizar(texto: string) {
  // ̀-ͯ é o bloco de acentos combinantes. Escrito com escape de
  // propósito: o caractere literal no fonte é invisível e quebra fácil.
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

export function PaletaComandos({ apps }: { apps: AppLeve[] }) {
  const router = useRouter();
  const [aberta, setAberta] = useState(false);
  const [busca, setBusca] = useState("");
  const [indice, setIndice] = useState(0);
  const campoRef = useRef<HTMLInputElement>(null);

  const resultados = useMemo(() => {
    const termo = normalizar(busca.trim());
    if (!termo) return apps;
    return apps.filter((a) =>
      normalizar(`${a.nome} ${a.chamada} ${a.grupo}`).includes(termo),
    );
  }, [apps, busca]);

  // Atalho global. Registrado uma vez, com limpeza no unmount.
  useEffect(() => {
    function aoTeclar(evento: KeyboardEvent) {
      if ((evento.metaKey || evento.ctrlKey) && evento.key.toLowerCase() === "k") {
        evento.preventDefault();
        setAberta((v) => !v);
      }
      if (evento.key === "Escape") setAberta(false);
    }

    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, []);

  // Abre pelo botão da barra lateral, sem precisar de estado global.
  useEffect(() => {
    function abrir() {
      setAberta(true);
    }
    window.addEventListener("novare:abrir-paleta", abrir);
    return () => window.removeEventListener("novare:abrir-paleta", abrir);
  }, []);

  useEffect(() => {
    if (!aberta) return;
    setBusca("");
    setIndice(0);
    // Foco direto: o input já está montado quando este efeito roda. Fazer
    // isso dentro de requestAnimationFrame falhava de forma intermitente e
    // as teclas iam parar no body, sem filtrar nada.
    campoRef.current?.focus();
  }, [aberta]);

  useEffect(() => {
    setIndice(0);
  }, [busca]);

  if (!aberta) return null;

  function abrirApp(app: AppLeve) {
    // Solução ainda não lançada: não há para onde navegar.
    if (app.emBreve) return;

    setAberta(false);
    if (app.externo) {
      window.open(app.href, "_blank", "noopener,noreferrer");
    } else {
      router.push(app.href);
    }
  }

  function aoTeclarNoCampo(evento: React.KeyboardEvent) {
    if (evento.key === "ArrowDown") {
      evento.preventDefault();
      setIndice((i) => Math.min(i + 1, resultados.length - 1));
    }
    if (evento.key === "ArrowUp") {
      evento.preventDefault();
      setIndice((i) => Math.max(i - 1, 0));
    }
    if (evento.key === "Enter" && resultados[indice]) {
      evento.preventDefault();
      abrirApp(resultados[indice]);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/45 px-4 pt-[12vh] backdrop-blur-sm"
      onClick={() => setAberta(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Buscar aplicativo"
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card backdrop-blur-xl shadow-[0_24px_60px_-20px_hsl(215_60%_8%_/_0.7)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={campoRef}
            autoFocus
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            onKeyDown={aoTeclarNoCampo}
            placeholder="Buscar aplicativo ou ferramenta"
            className="h-12 w-full bg-transparent text-[15px] outline-none placeholder:text-muted-foreground/70"
          />
          <kbd className="hidden shrink-0 rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground sm:block">
            esc
          </kbd>
        </div>

        <div className="max-h-[52vh] overflow-y-auto p-2">
          {resultados.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              Nada encontrado para “{busca}”.
            </p>
          ) : (
            resultados.map((app, i) => {
              const Icone = iconeDe(app.slug);
              return (
              <button
                key={app.slug}
                onClick={() => abrirApp(app)}
                onMouseEnter={() => setIndice(i)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors ${
                  i === indice ? "bg-foreground/[0.07]" : ""
                }`}
              >
                <span
                  aria-hidden
                  className={`flex h-8 w-8 shrink-0 items-center justify-center ${raioDe(app.slug)}`}
                  style={{ backgroundImage: gradienteDe(app.slug) }}
                >
                  {app.aberto ? (
                    <Icone className="h-4 w-4 text-white" strokeWidth={1.5} />
                  ) : (
                    <Lock className="h-3.5 w-3.5 text-white" strokeWidth={1.5} />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-foreground">
                    {app.nome}
                  </span>
                  <span className="block truncate text-[11px] text-muted-foreground">
                    {app.grupo}
                  </span>
                </span>
                {app.emBreve ? (
                  <span className="shrink-0 text-[10px] text-muted-foreground">
                    em breve
                  </span>
                ) : app.aberto ? (
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                ) : (
                  <span className="shrink-0 text-[10px] font-medium text-accent-strong">
                    Workspace
                  </span>
                )}
              </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
