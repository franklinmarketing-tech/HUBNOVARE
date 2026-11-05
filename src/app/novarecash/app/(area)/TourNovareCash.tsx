"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";

import { TOUR_APP, guiaDaRota, type PassoGuia } from "@/lib/novarecash/guias";
import { registrarUso } from "@/lib/uso";
import { GRUPOS } from "./menu";

/**
 * O TOUR GUIADO DO NOVARECASH (05/11/2026). Dois tours, um componente:
 *   • `app`  — a casca: Lançar gasto, busca, as telas principais e o menu da conta
 *              (depois das boas-vindas, no menu da conta e na paleta);
 *   • `tela` — a tela aberta, pelo "?" do cabeçalho (`BotaoGuia`).
 *
 * MESMO PADRÃO do `TourTela` do Hub (src/components/TourTela.tsx): a tela escurece,
 * um recorte com anel mostra o elemento de verdade, o cartão com seta fica embaixo
 * ou em cima (ou ao lado, no trilho), "1 de 5", Voltar/Próximo/Pular, Esc fecha e,
 * no celular, o cartão mora no pé da tela e o alvo sobe para logo abaixo do cabeçalho.
 *
 * Por que não o `TourTela` em si: ele acha os alvos pelo TEXTO dentro do `<main>`
 * e pela rota do manual. Aqui metade dos alvos é a casca (trilho, barra do polegar,
 * avatar), fora do `<main>` e diferente em cada tamanho; por isso o alvo é
 * `data-guia` (ver `src/lib/novarecash/guias.ts`). E o cartão usa as cores do
 * tema do app (escuro e claro), por isso o portal vai para a casca `#ncash-casca`
 * — que não tem `transform` nem `backdrop-blur`, então o `fixed` vale a tela toda.
 */

export const EVENTO_TOUR = "ncash:tour";
export type QualTour = "app" | "tela";

export function iniciarTour(qual: QualTour) {
  window.dispatchEvent(new CustomEvent<QualTour>(EVENTO_TOUR, { detail: qual }));
}

const INICIO = "/novarecash/app";
const rotaLimpa = (r: string) => r.replace(/\/$/, "");

type Achado = { el: HTMLElement; titulo: string; explica: string };

function visivel(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden";
}

function primeiroVisivel(alvo: string): HTMLElement | null {
  return [...document.querySelectorAll<HTMLElement>(`[data-guia="${CSS.escape(alvo)}"]`)].find(visivel) ?? null;
}

/** `tela-<ícone>` que não está à vista cai no grupo recolhido do trilho e, no celular, no "Mais". */
function alternativas(alvo: string): string[] {
  const lista = alvo.split("|").map((a) => a.trim());
  const extras: string[] = [];
  for (const a of lista) {
    if (!a.startsWith("tela-")) continue;
    const grupo = GRUPOS.find((g) => g.telas.some((t) => t.icone === a.slice(5)));
    if (grupo) extras.push(`grupo-${grupo.titulo}`);
    extras.push("mais");
  }
  return [...lista, ...extras];
}

function acharPassos(passos: PassoGuia[]): Achado[] {
  const celular = window.innerWidth < 768;
  const achados: Achado[] = [];
  for (const p of passos) {
    let el: HTMLElement | null = null;
    let usado = "";
    for (const a of alternativas(p.alvo)) {
      el = primeiroVisivel(a);
      if (el) {
        usado = a;
        break;
      }
    }
    if (!el) continue;
    let explica = celular && p.explicaCelular ? p.explicaCelular : p.explica;
    if (usado === "mais") explica = `Fica no botão “Mais”. ${explica}`;
    else if (usado.startsWith("grupo-")) explica = `Fica no grupo “${usado.slice(6)}” do menu. ${explica}`;
    achados.push({ el, titulo: p.titulo, explica });
  }
  return achados;
}

/**
 * Está dentro de algo `fixed` (trilho, barra do polegar)? Então a página não precisa rolar.
 * `sticky` (o cabeçalho do celular) NÃO entra: se a página tiver rolado, ele pode estar
 * fora da vista, e o caminho normal (rolar até ele) o traz de volta.
 */
function camadaFixa(el: HTMLElement): HTMLElement | null {
  for (let a: HTMLElement | null = el; a; a = a.parentElement) {
    if (getComputedStyle(a).position === "fixed") return a;
  }
  return null;
}

function rolarAte(el: HTMLElement, suave: boolean) {
  const behavior: ScrollBehavior = suave ? "smooth" : "auto";
  const fixa = camadaFixa(el);
  if (fixa) {
    // Só a lista que rola por dentro (as telas do trilho).
    for (let a = el.parentElement; a && fixa.contains(a); a = a.parentElement) {
      if (a.scrollHeight > a.clientHeight + 1 && /(auto|scroll)/.test(getComputedStyle(a).overflowY)) {
        const ra = a.getBoundingClientRect();
        const re = el.getBoundingClientRect();
        a.scrollTo({ top: a.scrollTop + re.top - ra.top - a.clientHeight / 2 + re.height / 2, behavior });
        break;
      }
    }
    return;
  }
  // Celular: o alvo sobe para logo abaixo do cabeçalho (64px); o cartão fica no pé da tela.
  if (window.innerWidth < 640) {
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior });
  } else {
    const alto = el.getBoundingClientRect().height > window.innerHeight * 0.55;
    el.scrollIntoView({ block: alto ? "start" : "center", behavior });
  }
}

const entre = (v: number, min: number, max: number) => Math.min(Math.max(v, min), Math.max(min, max));

export function TourNovareCash() {
  const caminho = usePathname();
  const router = useRouter();
  const [passos, setPassos] = useState<Achado[] | null>(null);
  const [i, setI] = useState(0);
  const [caixa, setCaixa] = useState<DOMRect | null>(null);
  const [altura, setAltura] = useState(220);
  const [destino, setDestino] = useState<HTMLElement | null>(null);
  const cartao = useRef<HTMLDivElement>(null);
  const antes = useRef<HTMLElement | null>(null);
  const pendente = useRef(false);
  // A rota do App Router (e não `location.pathname`): é a que o resto da casca usa.
  const rotaAtual = useRef(caminho);
  useLayoutEffect(() => {
    rotaAtual.current = caminho;
  }, [caminho]);
  const idTitulo = useId();
  const idTexto = useId();

  // O portal vai para a casca (cores do tema); fora dela, para o body.
  useEffect(() => setDestino(document.getElementById("ncash-casca") ?? document.body), []);

  useLayoutEffect(() => {
    const h = cartao.current?.offsetHeight;
    if (h && h !== altura) setAltura(h);
  });

  const fechar = useCallback(() => {
    setPassos(null);
    setCaixa(null);
    setI(0);
    const volta = antes.current;
    antes.current = null;
    if (volta?.isConnected) volta.focus({ preventScroll: true });
  }, []);

  const comecar = useCallback((qual: QualTour) => {
    const rota = rotaLimpa(rotaAtual.current);
    const guia = guiaDaRota(rota);
    let achados = acharPassos(qual === "app" ? TOUR_APP : guia?.passos ?? []);
    if (!achados.length) {
      // A tela ainda carregando (esqueleto): ao menos o cabeçalho, com o recado.
      const cab = primeiroVisivel("cabecalho");
      if (!cab) return;
      achados = [
        {
          el: cab,
          titulo: guia?.titulo ?? "Esta tela",
          explica: "Os detalhes aparecem quando a tela terminar de carregar. Toque no “?” de novo em instantes.",
        },
      ];
    }
    const foco = document.activeElement;
    antes.current = foco instanceof HTMLElement && foco !== document.body ? foco : null;
    registrarUso(`novarecash-tour:${qual === "app" ? "app" : rota.split("/")[3] ?? "inicio"}`, "usou");
    setI(0);
    setCaixa(null);
    setPassos(achados);
  }, []);

  // Quem pede o tour: boas-vindas, "?" do cabeçalho, menu da conta, paleta.
  useEffect(() => {
    const ouvir = (e: Event) => {
      const qual = (e as CustomEvent<QualTour>).detail === "app" ? "app" : "tela";
      if (qual === "app" && rotaLimpa(rotaAtual.current) !== INICIO) {
        // O tour do app começa no Início (é lá que o "Lançar gasto" do celular mora).
        pendente.current = true;
        router.push(INICIO);
        return;
      }
      // Um instante para o menu/folha/paleta que chamou fechar e devolver o foco.
      window.setTimeout(() => comecar(qual), 80);
    };
    window.addEventListener(EVENTO_TOUR, ouvir);
    return () => window.removeEventListener(EVENTO_TOUR, ouvir);
  }, [comecar, router]);

  // Trocou de tela: o tour aberto fecha; o pendente (do app) começa quando o Início chegar.
  useEffect(() => {
    setPassos(null);
    if (pendente.current && rotaLimpa(caminho) === INICIO) {
      pendente.current = false;
      const t = window.setTimeout(() => comecar("app"), 450);
      return () => window.clearTimeout(t);
    }
  }, [caminho, comecar]);

  // Leva o alvo da vez à vista e mede onde ele ficou.
  useLayoutEffect(() => {
    if (!passos) return;
    const el = passos[i]?.el;
    if (!el?.isConnected) return;
    const suave = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    rolarAte(el, suave);
    const medir = () => setCaixa(el.getBoundingClientRect());
    medir();
    const t = window.setTimeout(medir, suave ? 400 : 40);
    window.addEventListener("resize", medir);
    window.addEventListener("scroll", medir, true);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("resize", medir);
      window.removeEventListener("scroll", medir, true);
    };
  }, [passos, i]);

  // Teclado: Esc fecha, setas andam, Tab fica preso no cartão.
  useEffect(() => {
    if (!passos) return;
    cartao.current?.focus({ preventScroll: true });
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        fechar();
      } else if (e.key === "ArrowRight") setI((n) => Math.min(n + 1, passos.length - 1));
      else if (e.key === "ArrowLeft") setI((n) => Math.max(n - 1, 0));
      else if (e.key === "Tab" && cartao.current) {
        const focaveis = [...cartao.current.querySelectorAll<HTMLElement>("button")];
        if (!focaveis.length) return;
        const atual = focaveis.indexOf(document.activeElement as HTMLElement);
        e.preventDefault();
        const proximo = atual === -1 ? (e.shiftKey ? focaveis.length - 1 : 0) : atual + (e.shiftKey ? -1 : 1);
        focaveis[(proximo + focaveis.length) % focaveis.length]?.focus();
      }
    };
    document.addEventListener("keydown", tecla, true);
    return () => document.removeEventListener("keydown", tecla, true);
  }, [passos, i, fechar]);

  if (!passos || !destino) return null;
  const passo = passos[i];
  if (!passo) return null;
  const ultimo = i === passos.length - 1;
  const r = caixa;
  const folga = 6;
  const vao = folga + 14;
  const LARGURA = 360;

  // Onde o cartão fica. No celular, preso no pé da tela (ou no topo, se o alvo estiver lá embaixo).
  let estilo: CSSProperties | undefined;
  let seta: { lado: "cima" | "baixo" | "esquerda"; pos: number } | null = null;
  if (r && typeof window !== "undefined") {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (vw >= 640) {
      const noTrilho = !!passo.el.closest(".ncash-trilho");
      if (noTrilho && r.right + vao + LARGURA + 16 <= vw) {
        const topo = entre(r.top + r.height / 2 - altura / 2, 12, vh - altura - 12);
        estilo = { width: LARGURA, left: r.right + vao, top: topo, bottom: "auto" };
        seta = { lado: "esquerda", pos: entre(r.top + r.height / 2 - topo, 22, altura - 22) };
      } else {
        const esquerda = entre(r.left + r.width / 2 - LARGURA / 2, 16, vw - LARGURA - 16);
        const setaX = entre(r.left + r.width / 2 - esquerda, 24, LARGURA - 24);
        if (r.bottom + vao + altura + 12 <= vh) {
          estilo = { width: LARGURA, left: esquerda, top: r.bottom + vao, bottom: "auto" };
          seta = { lado: "cima", pos: setaX };
        } else if (r.top - vao - altura - 12 >= 0) {
          estilo = { width: LARGURA, left: esquerda, bottom: vh - r.top + vao, top: "auto" };
          seta = { lado: "baixo", pos: setaX };
        } else {
          estilo = { width: LARGURA, left: esquerda };
        }
      }
    } else if (r.bottom + folga > vh - altura - 24) {
      estilo = { top: 12, bottom: "auto" };
    }
  }

  const SETA = {
    cima: "-top-[7px] border-l border-t",
    baixo: "-bottom-[7px] border-b border-r",
    esquerda: "-left-[7px] border-b border-l",
  } as const;

  return createPortal(
    <div className="nao-imprimir fixed inset-0 z-[75]">
      {/* Fora do recorte nada responde: o tour sai por Pular, Concluir, X ou Esc. */}
      <div className="absolute inset-0" />
      {r && (
        <div
          aria-hidden
          className="pointer-events-none absolute rounded-2xl transition-all duration-300 motion-reduce:transition-none"
          style={{
            top: r.top - folga,
            left: r.left - folga,
            width: r.width + folga * 2,
            height: r.height + folga * 2,
            // Anel do tema + escurecido numa sombra só (um `ring-*` também é box-shadow e seria apagado).
            boxShadow: "0 0 0 3px var(--color-ouro), 0 0 0 9999px var(--ncash-mascara)",
          }}
        />
      )}
      <div
        ref={cartao}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        aria-describedby={idTexto}
        tabIndex={-1}
        className="ncash-flutuante ncash-surge absolute inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] mx-auto h-fit max-w-md rounded-[1.25rem] border border-white/10 bg-noite-2 text-white outline-none transition-[top,left,bottom] duration-300 motion-reduce:transition-none sm:inset-x-auto sm:mx-0"
        style={estilo}
      >
        {seta && (
          <span
            aria-hidden
            className={`absolute h-3.5 w-3.5 rotate-45 border-white/10 bg-noite-2 ${SETA[seta.lado]}`}
            style={seta.lado === "esquerda" ? { top: seta.pos - 7 } : { left: seta.pos - 7 }}
          />
        )}
        <div className="relative flex items-start gap-3 px-4 pb-1 pt-4 sm:px-5">
          <span
            aria-hidden
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-btn text-sm font-bold text-accent-foreground"
          >
            {i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ouro">
              Passo {i + 1} de {passos.length}
            </p>
            <p id={idTitulo} className="font-display text-base font-semibold leading-snug text-white">
              {passo.titulo}
            </p>
          </div>
          <button
            type="button"
            onClick={fechar}
            aria-label="Fechar o tour"
            className="-mr-2 -mt-1.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white/65 outline-none hover:bg-white/[0.06] hover:text-white focus-visible:ring-2 focus-visible:ring-ouro"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-4 pb-4 sm:px-5">
          <p id={idTexto} aria-live="polite" className="text-sm leading-relaxed text-white/80">
            {passo.explica}
          </p>
          <div className="mt-3.5 flex gap-1" aria-hidden>
            {passos.map((_, n) => (
              <span key={n} className={`h-1.5 flex-1 rounded-full ${n <= i ? "bg-ouro" : "bg-white/15"}`} />
            ))}
          </div>
          <div className="mt-3.5 flex items-center gap-2">
            {!ultimo && (
              <button
                type="button"
                onClick={fechar}
                className="min-h-11 rounded-full px-2 text-sm font-semibold text-white/65 outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-ouro"
              >
                Pular
              </button>
            )}
            {i > 0 && (
              <button
                type="button"
                onClick={() => setI(i - 1)}
                className="ml-auto inline-flex min-h-11 items-center gap-1.5 rounded-full border border-white/20 px-4 text-sm font-semibold text-white outline-none hover:border-ouro/60 focus-visible:ring-2 focus-visible:ring-ouro"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </button>
            )}
            <button
              type="button"
              onClick={() => (ultimo ? fechar() : setI(i + 1))}
              className={`${i > 0 ? "" : "ml-auto"} inline-flex min-h-11 items-center gap-1.5 rounded-full bg-accent-btn px-5 text-sm font-bold text-accent-foreground outline-none hover:brightness-110 focus-visible:ring-2 focus-visible:ring-ouro focus-visible:ring-offset-2 focus-visible:ring-offset-noite-2`}
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
    destino,
  );
}
