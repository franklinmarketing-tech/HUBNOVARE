"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsUpDown, LogOut, Moon, Sun, Compass } from "lucide-react";

import { Icone3D } from "./Icone3D";
import { CONSULTOR, iniciais } from "./menu";
import type { Tema } from "./tema";
import { useTema } from "./TrocaTema";
import { iniciarTour } from "./TourNovareCash";

/**
 * O CARTÃO DO USUÁRIO e o menu dele (05/11/2026): tema claro/escuro, consultor,
 * voltar ao Workspace e sair. Antes eram quatro botões soltos no rodapé do
 * trilho e um "Sair" + tema no cabeçalho do celular.
 *
 * Três lugares, três formas (`variante`):
 *   • `trilho`  — rodapé do trilho; o menu sobe. Recolhido, só o avatar.
 *   • `avatar`  — cabeçalho do celular; o menu desce, alinhado à direita.
 *   • `folha`   — topo da folha "Mais"; o menu desce na largura do cartão.
 *
 * Teclado (padrão "menu button" da WAI-ARIA): setas, Home/End, Esc fecha e
 * devolve o foco; o Tab fica preso no menu enquanto ele está aberto.
 *
 * O menu é `absolute` (nunca `fixed`): o cabeçalho do celular tem `backdrop-blur`,
 * que prende `fixed` dentro dele.
 */

export function Avatar({ nome, tamanho = 36 }: { nome?: string | null; tamanho?: number }) {
  return (
    <span
      aria-hidden
      className="ncash-avatar flex shrink-0 items-center justify-center rounded-full font-bold tracking-tight"
      style={{ width: tamanho, height: tamanho, fontSize: Math.round(tamanho * 0.36) }}
    >
      {iniciais(nome)}
    </span>
  );
}

const ITEM =
  "flex min-h-11 w-full items-center gap-3 rounded-xl px-2.5 text-left text-sm font-medium text-white/85 outline-none transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:bg-white/[0.06] focus-visible:text-white focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ouro motion-reduce:transition-none";
const MOLDURA_ICONE = "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] ring-1 ring-inset ring-white/10";

export function MenuUsuario({
  nome,
  plano,
  tema,
  sair,
  variante,
  gatilhoExtra,
}: {
  nome?: string | null;
  plano: string;
  tema: Tema;
  sair: () => Promise<void>;
  variante: "trilho" | "avatar" | "folha";
  /** Eventos a mais no botão (a dica do trilho recolhido). */
  gatilhoExtra?: React.HTMLAttributes<HTMLButtonElement>;
}) {
  const [aberto, setAberto] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);
  const gatilho = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const id = useId();
  const caminho = usePathname();
  const { proximo, trocar, rotulo } = useTema(tema);
  const primeiroNome = nome?.split(" ")[0];

  useEffect(() => setAberto(false), [caminho]);

  const itens = () => Array.from(menu.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);

  useEffect(() => {
    if (!aberto) return;
    itens()[0]?.focus();
    const fora = (e: PointerEvent) => {
      if (!raiz.current?.contains(e.target as Node)) setAberto(false);
    };
    document.addEventListener("pointerdown", fora);
    return () => document.removeEventListener("pointerdown", fora);
  }, [aberto]);

  function fechar() {
    setAberto(false);
    gatilho.current?.focus();
  }

  function teclaNoMenu(e: React.KeyboardEvent) {
    const lista = itens();
    const i = lista.indexOf(document.activeElement as HTMLElement);
    const ir = (n: number) => {
      e.preventDefault();
      lista[(n + lista.length) % lista.length]?.focus();
    };
    if (e.key === "ArrowDown") ir(i + 1);
    else if (e.key === "ArrowUp") ir(i - 1);
    else if (e.key === "Home") ir(0);
    else if (e.key === "End") ir(lista.length - 1);
    else if (e.key === "Tab") ir(e.shiftKey ? i - 1 : i + 1);
    else if (e.key === "Escape") {
      e.preventDefault();
      // Só este menu fecha: a folha "Mais" (que também ouve o Esc) continua aberta.
      e.stopPropagation();
      fechar();
    }
  }

  const posicao = {
    trilho: "bottom-full left-0 mb-2 w-64",
    avatar: "right-0 top-full mt-2 w-[min(16rem,calc(100vw-2rem))]",
    folha: "inset-x-0 top-full mt-2",
  }[variante];

  const nomeVisivel = nome?.trim() || "Minha conta";

  return (
    <div ref={raiz} className="relative">
      <button
        ref={gatilho}
        type="button"
        aria-haspopup="menu"
        aria-expanded={aberto}
        aria-controls={aberto ? id : undefined}
        aria-label={`${nomeVisivel}, ${plano}. Abrir o menu da conta`}
        data-guia="usuario"
        onClick={() => setAberto((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            setAberto(true);
          }
        }}
        {...gatilhoExtra}
        className={
          variante === "avatar"
            ? "flex h-11 w-11 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ouro"
            : `flex min-h-12 w-full items-center gap-3 rounded-2xl p-2 text-left outline-none transition-colors hover:bg-white/[0.05] focus-visible:ring-2 focus-visible:ring-ouro motion-reduce:transition-none ${
                variante === "folha" ? "border border-white/10 bg-white/[0.03]" : "trilho-fechado:justify-center trilho-fechado:px-0"
              } ${aberto ? "bg-white/[0.05]" : ""}`
        }
      >
        <Avatar nome={nome} tamanho={variante === "avatar" ? 34 : 36} />
        {variante !== "avatar" && (
          <>
            <span className="min-w-0 flex-1 trilho-fechado:hidden">
              <span className="block truncate text-sm font-semibold text-white">{nomeVisivel}</span>
              <span className="block truncate text-2xs text-white/60">{plano}</span>
            </span>
            <ChevronsUpDown aria-hidden className="h-4 w-4 shrink-0 text-white/50 trilho-fechado:hidden" />
          </>
        )}
      </button>

      {aberto && (
        <div
          ref={menu}
          id={id}
          role="menu"
          aria-label="Menu da conta"
          onKeyDown={teclaNoMenu}
          className={`ncash-flutuante absolute z-50 rounded-2xl border border-white/10 bg-noite-2 p-1.5 ${posicao}`}
        >
          <div role="none" className="flex items-center gap-3 border-b border-white/10 px-2.5 pb-2.5 pt-1.5">
            <Avatar nome={nome} tamanho={32} />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-white">{nomeVisivel}</span>
              <span className="block truncate text-2xs text-white/60">{plano}</span>
            </span>
          </div>
          <div role="none" className="flex flex-col gap-0.5 pt-1.5">
            <button type="button" role="menuitem" onClick={trocar} className={ITEM}>
              <span aria-hidden className={MOLDURA_ICONE}>
                {proximo === "escuro" ? <Moon className="h-4 w-4 text-ciano-claro" /> : <Sun className="h-4 w-4 text-ouro" />}
              </span>
              <span className="flex-1">{rotulo}</span>
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setAberto(false);
                iniciarTour("app");
              }}
              className={ITEM}
            >
              <span aria-hidden className={MOLDURA_ICONE}>
                <Compass className="h-4 w-4 text-ouro" />
              </span>
              <span className="flex-1">Ver o tour de novo</span>
            </button>
            <a role="menuitem" href={CONSULTOR} target="_blank" rel="noopener noreferrer" className={ITEM}>
              <span aria-hidden className={MOLDURA_ICONE}>
                <Icone3D nome="consultor" tamanho={24} />
              </span>
              <span className="flex-1">Falar com um consultor</span>
            </a>
            <Link role="menuitem" href="/" className={ITEM}>
              <span aria-hidden className={MOLDURA_ICONE}>
                <Image src="/marca/icone-novare.png" alt="" width={20} height={20} />
              </span>
              <span className="flex-1">Voltar ao Workspace</span>
            </Link>
            <form action={sair} role="none" className="mt-1 border-t border-white/10 pt-1">
              <button
                type="submit"
                role="menuitem"
                aria-label={primeiroNome ? `Sair da conta de ${primeiroNome}` : "Sair"}
                className={ITEM}
              >
                <span aria-hidden className={MOLDURA_ICONE}>
                  <LogOut className="h-4 w-4 text-white/70" />
                </span>
                <span className="flex-1">Sair</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
