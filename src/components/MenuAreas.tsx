"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronRight, Lock } from "lucide-react";
import { iconeDe } from "@/lib/icones";
import type { Portal } from "@/lib/categorias";

/**
 * Menu horizontal com uma porta por área, no molde do Workspace do D7.
 *
 * Passar o mouse abre a lista das ferramentas daquela área — nome, para que
 * serve e o padrão que ela persegue. É o que separa um site de um sistema:
 * o catálogo inteiro fica a um movimento de distância, de qualquer página,
 * sem ninguém precisar voltar para a home.
 */
export function MenuAreas({ portais }: { portais: Portal[] }) {
  const [aberta, setAberta] = useState<string | null>(null);
  const fechamento = useRef<ReturnType<typeof setTimeout> | null>(null);
  const barra = useRef<HTMLElement>(null);

  // Fecha ao sair do menu, mas com folga: atravessar o vão entre o botão e
  // o painel não pode derrubar a lista na cara de quem está indo clicar.
  function agendarFechamento() {
    if (fechamento.current) clearTimeout(fechamento.current);
    fechamento.current = setTimeout(() => setAberta(null), 180);
  }
  function cancelarFechamento() {
    if (fechamento.current) clearTimeout(fechamento.current);
  }

  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") setAberta(null);
    }
    function aoClicarFora(e: MouseEvent) {
      if (!barra.current?.contains(e.target as Node)) setAberta(null);
    }
    document.addEventListener("keydown", aoTeclar);
    document.addEventListener("mousedown", aoClicarFora);
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.removeEventListener("mousedown", aoClicarFora);
    };
  }, []);

  return (
    <nav
      ref={barra}
      className="relative hidden items-center gap-0.5 xl:flex"
      onMouseLeave={agendarFechamento}
      onMouseEnter={cancelarFechamento}
    >
      {portais.map((area) => {
        const ativa = aberta === area.chave;
        const Icone = iconeDe(area.destaques[0] ?? "");

        return (
          <div key={area.chave} className="relative">
            <button
              type="button"
              onMouseEnter={() => {
                cancelarFechamento();
                setAberta(area.chave);
              }}
              onClick={() => setAberta(ativa ? null : area.chave)}
              aria-expanded={ativa}
              className={`flex h-10 items-center gap-1.5 rounded-xl px-3 text-[13px] font-bold uppercase tracking-wide transition-colors ${
                ativa
                  ? "bg-slate-100 text-primary"
                  : "text-slate-600 hover:bg-slate-50 hover:text-primary"
              }`}
            >
              <Icone
                className="h-4 w-4"
                strokeWidth={2}
                style={{ color: `hsl(${area.h} ${area.s}% 45%)` }}
              />
              {area.curto}
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform duration-200 ${
                  ativa ? "rotate-180" : ""
                }`}
              />
            </button>

            {ativa && (
              <div
                onMouseEnter={cancelarFechamento}
                onMouseLeave={agendarFechamento}
                className="absolute left-0 top-[calc(100%+6px)] z-40 w-[22rem] origin-top overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_60px_-24px_hsl(215_50%_23%_/_0.45)] animate-[surgir_.18s_ease-out]"
              >
                <p
                  className="px-4 pb-2 pt-3.5 text-[11px] font-bold uppercase tracking-wider"
                  style={{ color: `hsl(${area.h} ${area.s}% 40%)` }}
                >
                  {area.descricao}
                </p>

                <div className="max-h-[26rem] overflow-y-auto pb-1">
                  {area.itens.map((item) => {
                    const IconeItem = iconeDe(item.slug);
                    return (
                      <Link
                        key={item.slug}
                        href={item.href}
                        onClick={() => setAberta(null)}
                        className="group/i flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-slate-50"
                      >
                        <span
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                          style={{
                            backgroundColor: `hsl(${area.h} ${area.s}% 45% / 0.1)`,
                          }}
                        >
                          <IconeItem
                            className="h-4 w-4"
                            strokeWidth={1.75}
                            style={{ color: `hsl(${area.h} ${area.s}% 42%)` }}
                          />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-bold uppercase tracking-tight text-slate-800">
                            {item.nome}
                          </span>
                          <span className="block truncate text-[11px] text-slate-500">
                            {item.chamada}
                          </span>
                        </span>
                        {item.aberto ? (
                          <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover/i:translate-x-0.5 group-hover/i:text-slate-500" />
                        ) : (
                          <Lock className="h-3.5 w-3.5 shrink-0 text-slate-300" />
                        )}
                      </Link>
                    );
                  })}
                </div>

                <Link
                  href={`/aplicativos?area=${area.chave}`}
                  onClick={() => setAberta(null)}
                  className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-[13px] font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-primary"
                >
                  Ver todos na página de aplicativos
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
