"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, ChevronDown, ChevronLeft, Plus, Search, X } from "lucide-react";

import { MarcaNovareCash } from "@/components/novarecash/MarcaNovareCash";
import { useAtalhoPaleta } from "@/lib/atalho";
import { Icone3D } from "./Icone3D";
import { CONSULTOR, GRUPOS, LANCAR_GASTO, NA_BARRA, TODAS, estaAtivo } from "./menu";
import { MenuUsuario } from "./MenuUsuario";
import { abrirPaleta } from "./Paleta";
import { EVENTO_TOUR } from "./TourNovareCash";
import { COOKIE_MENU, COOKIE_OPCOES, type Tema } from "./tema";

/**
 * O MENU DO NOVARECASH (04/11/2026: 14 telas; 05/11/2026: trilho moderno com
 * ícones 3D, recolher/expandir, busca, cartão do usuário e folha-lançador).
 *
 * O mapa das telas mora em `menu.ts`. Aqui só se desenha.
 *
 * TRILHO (tablet para cima): 76px só com ícones até 1023px; do `lg` para cima
 * abre com rótulos, e o chevron na borda recolhe (cookie `ncash_menu`, lido no
 * servidor, sem piscar). A largura é a variável `--ncash-trilho` da casca e as
 * variantes `trilho-aberto:`/`trilho-fechado:` decidem o que aparece — tudo CSS,
 * porque o servidor não sabe a largura da tela (ver o fim do globals.css).
 *
 * CELULAR: barra do polegar com 4 telas + "Mais", que abre a folha-lançador.
 *
 * ⚠️ Nada `fixed` dentro de elemento com `backdrop-blur` ou `transform` (vira
 * bloco de contenção). Por isso a dica do trilho recolhido é UMA só, `fixed`,
 * filha direta do `<aside>` (que não tem nenhum dos dois), e não um balão
 * dentro de cada item (a lista rola e cortaria o balão).
 */

const ANEL =
  "outline-none focus-visible:ring-2 focus-visible:ring-ouro focus-visible:ring-offset-2 focus-visible:ring-offset-noite-2";

/** Grupos recolhidos pela pessoa (só no trilho aberto). */
const CHAVE_GRUPOS = "ncash_menu_grupos";

type Comum = { nome?: string | null; plano: string; tema: Tema; sair: () => Promise<void> };

export function BarraLateralNovareCash({ nome, plano, tema, sair, recolhidoInicial }: Comum & { recolhidoInicial: boolean }) {
  const caminho = usePathname();
  const atalho = useAtalhoPaleta();
  const [aberto, setAberto] = useState(!recolhidoInicial);
  const [largo, setLargo] = useState(false);
  const [fechados, setFechados] = useState<string[]>([]);
  const [dica, setDica] = useState<{ texto: string; x: number; y: number } | null>(null);
  const nav = useRef<HTMLElement>(null);
  const compacto = !(largo && aberto);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const medir = () => setLargo(mq.matches);
    medir();
    mq.addEventListener("change", medir);
    return () => mq.removeEventListener("change", medir);
  }, []);

  // Grupos recolhidos: lidos uma vez; ao entrar numa tela, o grupo dela abre.
  useEffect(() => {
    try {
      const salvos: unknown = JSON.parse(localStorage.getItem(CHAVE_GRUPOS) ?? "[]");
      if (Array.isArray(salvos)) setFechados(salvos.filter((s): s is string => typeof s === "string"));
    } catch {
      /* localStorage bloqueado: todos abertos */
    }
  }, []);
  useEffect(() => {
    const doAtivo = GRUPOS.find((g) => g.telas.some((t) => estaAtivo(caminho, t)))?.titulo;
    if (doAtivo) setFechados((f) => (f.includes(doAtivo) ? f.filter((x) => x !== doAtivo) : f));
  }, [caminho]);

  function alternarGrupo(titulo: string) {
    setFechados((f) => {
      const novo = f.includes(titulo) ? f.filter((x) => x !== titulo) : [...f, titulo];
      try {
        localStorage.setItem(CHAVE_GRUPOS, JSON.stringify(novo));
      } catch {
        /* sem onde guardar: vale só nesta visita */
      }
      return novo;
    });
  }

  function alternarTrilho() {
    const novo = !aberto;
    setAberto(novo);
    setDica(null);
    document.getElementById("ncash-casca")?.setAttribute("data-menu", novo ? "aberto" : "recolhido");
    document.cookie = `${COOKIE_MENU}=${novo ? "aberto" : "recolhido"}; ${COOKIE_OPCOES}`;
  }

  // Rolagem: fade em cima/embaixo só quando há conteúdo escondido daquele lado.
  useEffect(() => {
    const el = nav.current;
    if (!el) return;
    const medir = () => {
      el.dataset.topo = el.scrollTop > 2 ? "1" : "0";
      el.dataset.fim = el.scrollTop + el.clientHeight < el.scrollHeight - 2 ? "1" : "0";
    };
    const rolou = () => {
      medir();
      setDica(null);
    };
    medir();
    el.addEventListener("scroll", rolou, { passive: true });
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    return () => {
      el.removeEventListener("scroll", rolou);
      ro.disconnect();
    };
  }, []);

  // A tela ativa sempre à vista ao abrir (e ao trocar de tela).
  useEffect(() => {
    const el = nav.current;
    const item = el?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!el || !item) return;
    const topo = item.offsetTop;
    const fim = topo + item.offsetHeight;
    if (topo < el.scrollTop + 12 || fim > el.scrollTop + el.clientHeight - 12) {
      el.scrollTop = topo - el.clientHeight / 2 + item.offsetHeight / 2;
    }
  }, [caminho]);

  // A dica fecha com Esc (WCAG 1.4.13: dá para dispensar sem mover o ponteiro).
  useEffect(() => {
    if (!dica) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setDica(null);
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [dica]);

  /** Eventos da dica: só valem com o trilho recolhido (aberto, o rótulo já está à vista). */
  const comDica = (texto: string) => {
    const mostrar = (e: React.SyntheticEvent<HTMLElement>) => {
      if (!compacto) return;
      const r = e.currentTarget.getBoundingClientRect();
      setDica({ texto, x: r.right + 12, y: r.top + r.height / 2 });
    };
    const esconder = () => setDica(null);
    return { onMouseEnter: mostrar, onMouseLeave: esconder, onFocus: mostrar, onBlur: esconder };
  };

  return (
    <aside className="ncash-trilho nao-imprimir fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-white/10 bg-noite-2 transition-[width] duration-200 ease-out motion-reduce:transition-none md:flex">
      {/* Recolher/expandir: a alça na borda (só do `lg` para cima; abaixo disso o trilho já é compacto). */}
      <button
        type="button"
        onClick={alternarTrilho}
        aria-expanded={aberto}
        aria-controls="ncash-trilho-telas"
        aria-label={aberto ? "Recolher o menu" : "Expandir o menu"}
        title={aberto ? "Recolher o menu" : "Expandir o menu"}
        className="group/alca absolute -right-[22px] top-[18px] z-10 hidden h-11 w-11 items-center justify-center rounded-full outline-none lg:flex"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-noite-2 text-white/70 shadow-[0_4px_14px_-4px_var(--ncash-sombra)] transition-colors group-hover/alca:border-ouro/60 group-hover/alca:text-ouro group-focus-visible/alca:ring-2 group-focus-visible/alca:ring-ouro motion-reduce:transition-none">
          <ChevronLeft
            aria-hidden
            className={`h-4 w-4 transition-transform duration-200 motion-reduce:transition-none ${aberto ? "" : "lg:rotate-180"}`}
          />
        </span>
      </button>

      <div className="shrink-0 px-3 pt-3">
        <div className="flex h-12 items-center trilho-fechado:justify-center">
          <Link
            href="/novarecash/app"
            aria-label="NovareCash, ir para o início"
            {...comDica("Início")}
            className={`flex min-h-11 min-w-0 items-center rounded-lg px-1 ${ANEL}`}
          >
            <span className="trilho-fechado:hidden">
              <MarcaNovareCash tamanho="sm" />
            </span>
            <Image src="/marca/icone-novare.png" alt="" width={30} height={30} className="hidden shrink-0 trilho-fechado:block" />
          </Link>
        </div>

        <Link
          href={LANCAR_GASTO}
          aria-label="Lançar gasto"
          data-guia="lancar"
          {...comDica("Lançar gasto")}
          className={`mt-3 flex min-h-11 items-center justify-center gap-2 rounded-xl bg-accent-btn px-3 text-sm font-semibold text-accent-foreground shadow-[0_10px_24px_-12px_var(--color-accent)] transition hover:brightness-110 active:translate-y-px motion-reduce:transition-none ${ANEL}`}
        >
          <Plus aria-hidden className="h-[18px] w-[18px] shrink-0" strokeWidth={2.5} />
          <span className="truncate trilho-fechado:hidden">Lançar gasto</span>
        </Link>

        <button
          type="button"
          onClick={abrirPaleta}
          aria-label="Buscar telas e ações"
          aria-keyshortcuts="Control+K Meta+K"
          data-guia="busca"
          {...comDica(`Buscar (${atalho})`)}
          className={`mt-2 flex min-h-11 w-full items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm text-white/60 transition-colors hover:border-white/25 hover:text-white motion-reduce:transition-none trilho-fechado:justify-center trilho-fechado:px-0 ${ANEL}`}
        >
          <Search aria-hidden className="h-4 w-4 shrink-0" />
          <span className="flex-1 truncate text-left trilho-fechado:hidden">Buscar…</span>
          <kbd className="shrink-0 rounded-md border border-white/15 bg-white/[0.04] px-1.5 py-0.5 font-sans text-[11px] font-semibold text-white/60 trilho-fechado:hidden">
            {atalho}
          </kbd>
        </button>
      </div>

      <nav
        id="ncash-trilho-telas"
        ref={nav}
        aria-label="Telas do NovareCash"
        className="ncash-rolagem relative mt-3 min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2 pb-3"
      >
        <div>
          {GRUPOS.map((g, gi) => {
            const fechado = fechados.includes(g.titulo);
            const idLista = `ncash-grupo-${gi}`;
            return (
              <div key={g.titulo} className={gi === 0 ? "" : "mt-1 trilho-fechado:mt-2"}>
                {gi > 0 && <span aria-hidden className="mx-auto mb-2 hidden h-px w-8 bg-white/10 trilho-fechado:block" />}
                <button
                  type="button"
                  onClick={() => alternarGrupo(g.titulo)}
                  aria-expanded={!fechado}
                  aria-controls={idLista}
                  data-guia={`grupo-${g.titulo}`}
                  className={`flex min-h-11 w-full items-center justify-between rounded-lg px-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/50 transition-colors hover:text-white/80 motion-reduce:transition-none trilho-fechado:hidden ${ANEL}`}
                >
                  {g.titulo}
                  <ChevronDown
                    aria-hidden
                    className={`h-3.5 w-3.5 transition-transform duration-200 motion-reduce:transition-none ${fechado ? "-rotate-90" : ""}`}
                  />
                </button>
                <ul id={idLista} className={`flex flex-col gap-1 ${fechado ? "trilho-aberto:hidden" : ""}`}>
                  {g.telas.map((t) => {
                    const ativo = estaAtivo(caminho, t);
                    return (
                      <li key={t.href}>
                        <Link
                          href={t.href}
                          aria-label={t.rotulo}
                          aria-current={ativo ? "page" : undefined}
                          data-guia={`tela-${t.icone}`}
                          {...comDica(t.rotulo)}
                          className={`group/item relative flex min-h-11 items-center gap-3 rounded-xl px-2 text-sm font-medium transition-[background-color,color,transform] duration-150 motion-reduce:transition-none trilho-fechado:justify-center trilho-fechado:px-0 ${ANEL} ${
                            ativo
                              ? "ncash-item-ativo text-white"
                              : "text-white/75 hover:-translate-y-px hover:bg-white/[0.05] hover:text-white motion-reduce:hover:translate-y-0"
                          }`}
                        >
                          {ativo && (
                            <span
                              aria-hidden
                              className="absolute -left-2 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-ouro shadow-[0_0_10px_var(--color-ouro)]"
                            />
                          )}
                          <Icone3D
                            nome={t.icone}
                            tamanho={32}
                            ativo={ativo}
                            className="h-7 w-7 transition-transform duration-200 group-hover/item:scale-110 motion-reduce:transition-none motion-reduce:group-hover/item:scale-100 trilho-fechado:h-8 trilho-fechado:w-8"
                          />
                          <span className="min-w-0 flex-1 truncate trilho-fechado:hidden">{t.rotulo}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </nav>

      <div className="shrink-0 border-t border-white/10 p-2">
        <MenuUsuario nome={nome} plano={plano} tema={tema} sair={sair} variante="trilho" gatilhoExtra={comDica(nome?.split(" ")[0] || "Minha conta")} />
      </div>

      {dica && (
        <div
          role="tooltip"
          className="ncash-flutuante pointer-events-none fixed z-[45] -translate-y-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-noite-2 px-2.5 py-1.5 text-xs font-semibold text-white"
          style={{ left: dica.x, top: dica.y }}
        >
          {dica.texto}
        </div>
      )}
    </aside>
  );
}

/** A lupa do cabeçalho do celular: abre a paleta. */
export function BotaoBusca() {
  return (
    <button
      type="button"
      onClick={abrirPaleta}
      aria-label="Buscar telas e ações"
      data-guia="busca"
      className="flex h-11 w-11 items-center justify-center rounded-full text-white/75 outline-none transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:ring-2 focus-visible:ring-ouro motion-reduce:transition-none"
    >
      <Search className="h-5 w-5" />
    </button>
  );
}

/** O ícone do "Mais": quatro ícones 3D em miniatura, como uma pasta de apps. */
function IconeMais() {
  return (
    <span aria-hidden className="grid h-[26px] w-[26px] grid-cols-2 gap-px rounded-lg bg-white/[0.06] p-[2px] ring-1 ring-inset ring-white/10">
      {(["metas", "relatorios", "alertas", "ajustes"] as const).map((n) => (
        <Icone3D key={n} nome={n} tamanho={11} className="h-[10.5px] w-[10.5px]" />
      ))}
    </span>
  );
}

/** A barra do polegar (até 767px): quatro telas + "Mais", que abre a folha-lançador. */
export function NavNovareCashCelular({ nome, plano, tema, sair }: Comum) {
  const caminho = usePathname();
  const [mais, setMais] = useState(false);
  const folha = useRef<HTMLDivElement>(null);
  const botaoMais = useRef<HTMLButtonElement>(null);
  /** Saiu da folha para a paleta: o foco é dela, não volta ao "Mais". */
  const indoParaPaleta = useRef(false);
  const naBarra = TODAS.filter((t) => NA_BARRA.includes(t.href));
  const maisAtivo = !naBarra.some((t) => estaAtivo(caminho, t));

  // Fecha ao trocar de tela; Esc fecha; a página por trás não rola.
  useEffect(() => setMais(false), [caminho]);
  useEffect(() => {
    if (!mais) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setMais(false);
    document.addEventListener("keydown", esc);
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    folha.current?.querySelector<HTMLElement>("a,button")?.focus();
    const quemAbriu = botaoMais.current;
    indoParaPaleta.current = false;
    return () => {
      document.removeEventListener("keydown", esc);
      document.body.style.overflow = antes;
      // Fechou sem trocar de tela (X, Esc, toque fora): o foco volta ao "Mais".
      if (quemAbriu && !indoParaPaleta.current && !document.activeElement?.closest("a")) quemAbriu.focus({ preventScroll: true });
    };
  }, [mais]);

  // O tour (pedido pelo menu da conta, que mora na folha) precisa da tela livre.
  useEffect(() => {
    const fechar = () => {
      indoParaPaleta.current = true;
      setMais(false);
    };
    window.addEventListener(EVENTO_TOUR, fechar);
    return () => window.removeEventListener(EVENTO_TOUR, fechar);
  }, []);

  function buscar() {
    indoParaPaleta.current = true;
    setMais(false);
    abrirPaleta();
  }

  const item = (ativo: boolean) =>
    `relative flex min-h-[60px] w-full flex-col items-center justify-center gap-1 px-0.5 pb-1.5 pt-2 text-[11px] font-medium outline-none transition-colors active:bg-white/[0.06] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ouro motion-reduce:transition-none ${
      ativo ? "text-ouro" : "text-white/70"
    }`;
  const bolha = (ativo: boolean) =>
    `flex h-8 w-12 items-center justify-center rounded-2xl transition-colors motion-reduce:transition-none ${
      ativo ? "bg-ouro/[0.14] ring-1 ring-inset ring-ouro/25" : ""
    }`;

  return (
    <>
      {mais && (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true" aria-label="Todas as telas do NovareCash">
          <button
            type="button"
            aria-label="Fechar"
            tabIndex={-1}
            className="absolute inset-0 bg-[var(--ncash-mascara)] backdrop-blur-sm"
            onClick={() => setMais(false)}
          />
          <div
            ref={folha}
            className="ncash-rolagem ncash-folha absolute inset-x-0 bottom-0 max-h-[88dvh] overflow-y-auto overscroll-contain rounded-t-[28px] border-t border-white/10 bg-noite-2 px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-2.5"
          >
            <span aria-hidden className="mx-auto mb-3 block h-1 w-10 rounded-full bg-white/20" />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={buscar}
                className="flex min-h-11 min-w-0 flex-1 items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-left text-sm text-white/60 outline-none focus-visible:ring-2 focus-visible:ring-ouro"
              >
                <Search aria-hidden className="h-4 w-4 shrink-0" />
                <span className="truncate">Buscar telas e ações</span>
              </button>
              <button
                type="button"
                onClick={() => setMais(false)}
                aria-label="Fechar"
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white/70 hover:bg-white/[0.06] ${ANEL}`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-3">
              <MenuUsuario nome={nome} plano={plano} tema={tema} sair={sair} variante="folha" />
            </div>

            {GRUPOS.map((g) => (
              <section key={g.titulo} aria-label={g.titulo} className="mt-5">
                <h2 className="px-1 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/50">{g.titulo}</h2>
                <ul className="grid grid-cols-4 gap-2">
                  {g.telas.map((t) => {
                    const ativo = estaAtivo(caminho, t);
                    return (
                      <li key={t.href}>
                        <Link
                          href={t.href}
                          aria-current={ativo ? "page" : undefined}
                          className={`flex h-full min-h-[92px] flex-col items-center gap-1.5 rounded-2xl px-1 pb-2 pt-2.5 text-center text-xs font-medium leading-tight outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ouro active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100 ${
                            ativo ? "ncash-item-ativo text-white" : "bg-white/[0.03] text-white/85 ring-1 ring-inset ring-white/[0.07]"
                          }`}
                        >
                          <Icone3D nome={t.icone} tamanho={44} ativo={ativo} />
                          <span className="line-clamp-2 break-words">{t.rotulo}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}

            <a
              href={CONSULTOR}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 flex min-h-16 items-center gap-3 rounded-2xl bg-ouro/[0.08] p-3 ring-1 ring-inset ring-ouro/30 outline-none focus-visible:ring-2 focus-visible:ring-ouro"
            >
              <Icone3D nome="consultor" tamanho={44} />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-white">Falar com um consultor</span>
                <span className="block text-2xs text-white/65">Gente da Novare, pelo WhatsApp</span>
              </span>
              <ArrowUpRight aria-hidden className="h-4 w-4 shrink-0 text-ouro" />
            </a>
          </div>
        </div>
      )}

      <nav
        aria-label="Telas do NovareCash"
        className="nao-imprimir fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-noite-2/90 backdrop-blur-xl md:hidden"
        style={{ paddingBottom: "max(0.25rem, env(safe-area-inset-bottom))" }}
      >
        <ul className="grid grid-cols-5">
          {naBarra.map((t) => {
            const ativo = estaAtivo(caminho, t);
            return (
              <li key={t.href}>
                <Link href={t.href} aria-current={ativo ? "page" : undefined} data-guia={`tela-${t.icone}`} className={item(ativo)}>
                  {ativo && <span aria-hidden className="absolute inset-x-4 top-0 h-0.5 rounded-b-full bg-ouro" />}
                  <span className={bolha(ativo)}>
                    <Icone3D nome={t.icone} tamanho={26} ativo={ativo} />
                  </span>
                  <span className="max-w-full truncate">{t.rotulo}</span>
                </Link>
              </li>
            );
          })}
          <li>
            <button
              ref={botaoMais}
              type="button"
              data-guia="mais"
              onClick={() => setMais((v) => !v)}
              aria-expanded={mais}
              aria-haspopup="dialog"
              aria-label={
                maisAtivo && !mais
                  ? `Mais telas (agora em ${TODAS.find((t) => estaAtivo(caminho, t))?.rotulo ?? "outra tela"})`
                  : "Mais telas"
              }
              className={item(maisAtivo || mais)}
            >
              {(maisAtivo || mais) && <span aria-hidden className="absolute inset-x-4 top-0 h-0.5 rounded-b-full bg-ouro" />}
              <span className={bolha(maisAtivo || mais)}>
                <IconeMais />
              </span>
              <span>Mais</span>
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}
