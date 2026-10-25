"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Gift, X } from "lucide-react";
import { CHAVE_NOVIDADES_VISTO, NOVIDADES, temNovidade } from "@/lib/novidades";

/** "25 out" — a data ISO é só dia, então lê em UTC para não voltar um dia. */
function dataCurta(iso: string): string {
  return new Date(`${iso}T12:00:00Z`)
    .toLocaleDateString("pt-BR", { day: "numeric", month: "short", timeZone: "UTC" })
    .replace(".", "");
}

/**
 * O botão "Novidades": ícone de presente com um ponto laranja quando saiu
 * algo depois da última vez que a pessoa abriu a lista.
 *
 * NUNCA ABRE SOZINHO (docs/GUIDELINE-UX.md, regra 1): o ponto avisa, a pessoa
 * decide. Abrir marca como visto.
 *
 * No computador é um painel preso ao botão; no celular, uma folha que sobe do
 * pé da tela. A folha vai por portal para o `body`: o topo usa
 * `backdrop-blur`, e `backdrop-filter` vira o bloco de referência de quem é
 * `fixed` dentro dele — sem o portal, a "folha de baixo" ficaria presa no
 * topo.
 */
export function BotaoNovidades({
  className = "",
  alinhar = "direita",
}: {
  className?: string;
  /** Lado do botão por onde o painel se alinha no computador: no topo do
      site o botão fica à direita; no FINCASH, à esquerda. */
  alinhar?: "esquerda" | "direita";
}) {
  const [aberto, setAberto] = useState(false);
  const [celular, setCelular] = useState(false);
  // Começa sem ponto: o servidor não lê localStorage, e o ponto só aparece
  // depois da hidratação para o HTML bater.
  const [novo, setNovo] = useState(false);

  const botao = useRef<HTMLButtonElement>(null);
  const painel = useRef<HTMLDivElement>(null);
  const idTitulo = useId();

  useEffect(() => {
    try {
      setNovo(temNovidade(window.localStorage.getItem(CHAVE_NOVIDADES_VISTO)));
    } catch {
      /* Armazenamento bloqueado: sem ponto, que é o lado seguro. */
    }
  }, []);

  const fechar = useCallback((devolverFoco: boolean) => {
    setAberto(false);
    if (devolverFoco) botao.current?.focus();
  }, []);

  function abrir() {
    setCelular(window.matchMedia("(max-width: 639px)").matches);
    setAberto(true);
    setNovo(false);
    try {
      if (NOVIDADES[0]) window.localStorage.setItem(CHAVE_NOVIDADES_VISTO, NOVIDADES[0].id);
    } catch {}
  }

  useEffect(() => {
    if (!aberto) return;
    painel.current?.focus();

    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") fechar(true);
    }
    function aoClicarFora(e: MouseEvent) {
      const alvo = e.target as Node;
      if (painel.current?.contains(alvo) || botao.current?.contains(alvo)) return;
      fechar(false);
    }
    document.addEventListener("keydown", aoTeclar);
    document.addEventListener("mousedown", aoClicarFora);
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.removeEventListener("mousedown", aoClicarFora);
    };
  }, [aberto, fechar]);

  const lista = (
    <>
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 py-2 pl-4 pr-2">
        <p id={idTitulo} className="font-display text-sm font-bold text-primary">
          Novidades
        </p>
        <button
          type="button"
          onClick={() => fechar(true)}
          aria-label="Fechar novidades"
          className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-50 hover:text-primary"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <ul className="max-h-[min(24rem,60dvh)] overflow-y-auto">
        {NOVIDADES.map((n) => {
          const conteudo = (
            <>
              <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                {dataCurta(n.data)}
              </span>
              <span className="mt-0.5 block text-[13px] font-bold leading-tight text-slate-900">
                {n.titulo}
              </span>
              <span className="mt-1 block text-xs leading-snug text-slate-600">{n.texto}</span>
              {n.href && (
                <span className="mt-1.5 block text-xs font-semibold text-accent-strong">Ver agora</span>
              )}
            </>
          );
          return (
            <li key={n.id} className="border-b border-slate-100 last:border-0">
              {n.href ? (
                <Link
                  href={n.href}
                  onClick={() => fechar(false)}
                  className="block min-h-10 px-4 py-3 transition-colors hover:bg-slate-50"
                >
                  {conteudo}
                </Link>
              ) : (
                <div className="px-4 py-3">{conteudo}</div>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );

  return (
    <div className={`relative shrink-0 ${className}`}>
      <button
        ref={botao}
        type="button"
        onClick={() => (aberto ? fechar(false) : abrir())}
        aria-expanded={aberto}
        aria-haspopup="dialog"
        aria-label={novo ? "Novidades, há itens novos" : "Novidades"}
        className={`relative flex h-10 w-10 items-center justify-center rounded-xl border transition-colors ${
          aberto
            ? "border-primary/30 bg-primary-light text-primary"
            : "border-slate-200 bg-white text-slate-500 hover:border-primary/30 hover:text-primary"
        }`}
      >
        <Gift className="h-4 w-4" />
        {novo && (
          <span aria-hidden className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-accent ring-2 ring-white" />
        )}
      </button>

      {aberto &&
        (celular ? (
          createPortal(
            <div className="fixed inset-0 z-[60]">
              <div aria-hidden className="absolute inset-0 bg-slate-900/40" />
              <div
                ref={painel}
                role="dialog"
                aria-modal="true"
                aria-labelledby={idTitulo}
                tabIndex={-1}
                className="absolute inset-x-0 bottom-0 overflow-hidden rounded-t-3xl bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-24px_60px_-24px_hsl(215_50%_23%_/_0.45)] outline-none animate-[surgir_.18s_ease-out]"
              >
                <span aria-hidden className="mx-auto mt-2 block h-1 w-10 rounded-full bg-slate-200" />
                {lista}
              </div>
            </div>,
            document.body,
          )
        ) : (
          <div
            ref={painel}
            role="dialog"
            aria-labelledby={idTitulo}
            tabIndex={-1}
            className={`absolute ${alinhar === "esquerda" ? "left-0 origin-top-left" : "right-0 origin-top-right"} top-[calc(100%+8px)] z-40 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-[0_24px_60px_-24px_hsl(215_50%_23%_/_0.45)] outline-none animate-[surgir_.18s_ease-out]`}
          >
            {lista}
          </div>
        ))}
    </div>
  );
}
