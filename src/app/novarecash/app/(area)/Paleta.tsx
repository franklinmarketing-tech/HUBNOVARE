"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CornerDownLeft, Search, X } from "lucide-react";

import { Icone3D } from "./Icone3D";
import { iniciarTour } from "./TourNovareCash";
import { guiaDaRota } from "@/lib/novarecash/guias";
import { CONSULTOR, GRUPOS, LANCAR_GASTO, estaAtivo, telaDaRota, type NomeIcone } from "./menu";
import type { Tema } from "./tema";
import { useTema } from "./TrocaTema";

/**
 * A PALETA DO NOVARECASH (Ctrl K / ⌘K), 05/11/2026.
 *
 * Mesmo padrão da paleta do Workspace (`src/components/PaletaComandos.tsx`):
 * busca que ignora acento, setas, Enter e Esc. Esta é só do NovareCash, mora na
 * casca do app e não conversa com a outra (o evento é outro: `ncash:abrir-paleta`).
 *
 * Acessibilidade: combobox + listbox da WAI-ARIA. O foco fica no campo; a opção
 * "ativa" é anunciada por `aria-activedescendant`. Tab preso na janela.
 *
 * Montada na raiz da casca, fora de qualquer `backdrop-blur`/`transform`.
 */

export const EVENTO_ABRIR_PALETA = "ncash:abrir-paleta";

export function abrirPaleta() {
  window.dispatchEvent(new Event(EVENTO_ABRIR_PALETA));
}

type Item = {
  id: string;
  secao: "Ações rápidas" | "Telas";
  rotulo: string;
  dica: string;
  icone: NomeIcone;
  palavras?: string;
  ir: { href: string } | { externo: string } | { tema: true } | { tour: "app" | "tela" };
};

/** Ignora acento e caixa ("orcamento" acha "Orçamento"). */
function normalizar(texto: string) {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function Paleta({ tema }: { tema: Tema }) {
  const router = useRouter();
  const caminho = usePathname();
  const [aberta, setAberta] = useState(false);
  const [busca, setBusca] = useState("");
  const [indice, setIndice] = useState(0);
  const campo = useRef<HTMLInputElement>(null);
  const lista = useRef<HTMLUListElement>(null);
  const caixa = useRef<HTMLDivElement>(null);
  const antes = useRef<HTMLElement | null>(null);
  const idLista = useId();
  const { rotulo: rotuloTema, trocar } = useTema(tema);

  const itens = useMemo<Item[]>(
    () => [
      { id: "a-gasto", secao: "Ações rápidas", rotulo: "Lançar gasto", dica: "Um gasto ou uma entrada, em dois toques", icone: "extrato", palavras: "novo lançamento despesa", ir: { href: LANCAR_GASTO } },
      { id: "a-conta", secao: "Ações rápidas", rotulo: "Nova conta", dica: "Conta, cartão ou investimento, com o saldo de hoje", icone: "cartoes", palavras: "criar banco saldo", ir: { href: "/novarecash/app/extrato?contas=1" } },
      { id: "a-meta", secao: "Ações rápidas", rotulo: "Nova meta", dica: "Quanto juntar e até quando", icone: "metas", palavras: "objetivo guardar", ir: { href: "/novarecash/app/metas" } },
      { id: "a-fatura", secao: "Ações rápidas", rotulo: "Pagar fatura", dica: "As faturas dos seus cartões", icone: "cartoes", palavras: "cartão crédito", ir: { href: "/novarecash/app/cartoes" } },
      { id: "a-importar", secao: "Ações rápidas", rotulo: "Importar arquivo do banco", dica: "Extrato em OFX ou CSV", icone: "importar", palavras: "importar extrato ofx csv", ir: { href: "/novarecash/app/importar" } },
      { id: "a-consultor", secao: "Ações rápidas", rotulo: "Falar com um consultor", dica: "Gente da Novare, pelo WhatsApp", icone: "consultor", palavras: "ajuda suporte atendimento", ir: { externo: CONSULTOR } },
      { id: "a-tour", secao: "Ações rápidas", rotulo: "Ver o tour", dica: "As telas principais do NovareCash, passo a passo", icone: "inicio", palavras: "ajuda guia tutorial como usar primeiro uso", ir: { tour: "app" } },
      ...(guiaDaRota(caminho)
        ? [{ id: "a-guia", secao: "Ações rápidas" as const, rotulo: "Como usar esta tela", dica: `O passo a passo de ${guiaDaRota(caminho)?.titulo}`, icone: telaDaRota(caminho)?.icone ?? ("inicio" as NomeIcone), palavras: "ajuda guia tutorial interrogação", ir: { tour: "tela" as const } }]
        : []),
      { id: "a-tema", secao: "Ações rápidas", rotulo: `Trocar tema: ${rotuloTema.toLowerCase()}`, dica: "Claro ou escuro, fica guardado neste aparelho", icone: "ajustes", palavras: "tema claro escuro dark noite", ir: { tema: true } },
      ...GRUPOS.flatMap((g) =>
        g.telas.map<Item>((t) => ({
          id: `t-${t.icone}`,
          secao: "Telas",
          rotulo: t.rotulo,
          dica: estaAtivo(caminho, t) ? `${g.titulo} · você está aqui` : g.titulo,
          icone: t.icone,
          palavras: t.palavras,
          ir: { href: t.href },
        })),
      ),
    ],
    [rotuloTema, caminho],
  );

  const resultados = useMemo(() => {
    const termo = normalizar(busca.trim());
    if (!termo) return itens;
    return itens.filter((i) => normalizar(`${i.rotulo} ${i.dica} ${i.palavras ?? ""}`).includes(termo));
  }, [itens, busca]);

  // Atalho de qualquer tela + o evento do campo de busca do trilho, do cabeçalho e da folha.
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setAberta((v) => !v);
      }
    };
    const abrir = () => setAberta(true);
    window.addEventListener("keydown", tecla);
    window.addEventListener(EVENTO_ABRIR_PALETA, abrir);
    return () => {
      window.removeEventListener("keydown", tecla);
      window.removeEventListener(EVENTO_ABRIR_PALETA, abrir);
    };
  }, []);

  useEffect(() => {
    if (!aberta) return;
    antes.current = document.activeElement as HTMLElement | null;
    setBusca("");
    setIndice(0);
    campo.current?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
      // Devolve o foco a quem abriu (se ainda existir na página).
      if (antes.current?.isConnected) antes.current.focus({ preventScroll: true });
    };
  }, [aberta]);

  useEffect(() => setIndice(0), [busca]);

  // A opção ativa sempre à vista dentro da lista.
  useEffect(() => {
    lista.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" });
  }, [indice, aberta]);

  if (!aberta) return null;

  function executar(item: Item) {
    if ("tema" in item.ir) {
      trocar();
      return; // fica aberta: dá para ver o tema novo e trocar de volta
    }
    setAberta(false);
    if ("tour" in item.ir) iniciarTour(item.ir.tour);
    else if ("externo" in item.ir) window.open(item.ir.externo, "_blank", "noopener,noreferrer");
    else router.push(item.ir.href);
  }

  function tecla(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      setAberta(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndice((i) => (resultados.length ? (i + 1) % resultados.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndice((i) => (resultados.length ? (i - 1 + resultados.length) % resultados.length : 0));
    } else if (e.key === "Home" && e.ctrlKey) {
      e.preventDefault();
      setIndice(0);
    } else if (e.key === "End" && e.ctrlKey) {
      e.preventDefault();
      setIndice(Math.max(0, resultados.length - 1));
    } else if (e.key === "Enter" && resultados[indice]) {
      e.preventDefault();
      executar(resultados[indice]);
    } else if (e.key === "Tab" && caixa.current) {
      // Tab preso: só o campo e o botão de fechar são focáveis.
      const focaveis = Array.from(caixa.current.querySelectorAll<HTMLElement>("input, button")).filter(
        (el) => el.getClientRects().length > 0,
      );
      const i = focaveis.indexOf(document.activeElement as HTMLElement);
      e.preventDefault();
      focaveis[(i + (e.shiftKey ? -1 : 1) + focaveis.length) % focaveis.length]?.focus();
    }
  }

  const ativo = resultados[indice];
  const idOpcao = (i: Item) => `${idLista}-${i.id}`;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-3 pt-[max(1rem,9vh)] sm:px-4">
      <button
        type="button"
        tabIndex={-1}
        aria-label="Fechar a busca"
        onClick={() => setAberta(false)}
        className="absolute inset-0 bg-[var(--ncash-mascara)] backdrop-blur-sm"
      />
      <div
        ref={caixa}
        role="dialog"
        aria-modal="true"
        aria-label="Buscar telas e ações do NovareCash"
        onKeyDown={tecla}
        className="ncash-flutuante ncash-surge relative flex max-h-[min(80dvh,36rem)] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-noite-2"
      >
        <div className="flex shrink-0 items-center gap-3 border-b border-white/10 px-4">
          <Search aria-hidden className="h-[18px] w-[18px] shrink-0 text-white/55" />
          <input
            ref={campo}
            role="combobox"
            aria-expanded="true"
            aria-controls={idLista}
            aria-autocomplete="list"
            aria-activedescendant={ativo ? idOpcao(ativo) : undefined}
            aria-label="Buscar telas e ações"
            autoComplete="off"
            spellCheck={false}
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar telas e ações…"
            className="h-14 min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-white/45 sm:text-[15px]"
          />
          <kbd className="hidden shrink-0 rounded-md border border-white/15 px-1.5 py-0.5 text-[11px] font-semibold text-white/55 sm:block">
            Esc
          </kbd>
          <button
            type="button"
            onClick={() => setAberta(false)}
            aria-label="Fechar a busca"
            className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white/65 outline-none hover:bg-white/[0.06] hover:text-white focus-visible:ring-2 focus-visible:ring-ouro sm:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <ul ref={lista} id={idLista} role="listbox" aria-label="Resultados" className="ncash-rolagem min-h-0 flex-1 overflow-y-auto p-2">
          {resultados.length === 0 && (
            <li role="presentation" className="px-3 py-10 text-center text-sm text-white/65">
              Nada encontrado para &ldquo;{busca}&rdquo;.
            </li>
          )}
          {resultados.map((item, i) => {
            const novaSecao = i === 0 || resultados[i - 1].secao !== item.secao;
            const marcado = i === indice;
            return (
              <li key={item.id} role="presentation">
                {novaSecao && (
                  <p aria-hidden className={`px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45 ${i === 0 ? "pt-1" : "pt-3"}`}>
                    {item.secao}
                  </p>
                )}
                <div
                  id={idOpcao(item)}
                  role="option"
                  aria-selected={marcado}
                  onClick={() => executar(item)}
                  onMouseMove={() => indice !== i && setIndice(i)}
                  className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl px-2.5 py-1.5 transition-colors motion-reduce:transition-none ${
                    marcado ? "ncash-item-ativo" : ""
                  }`}
                >
                  <Icone3D nome={item.icone} tamanho={36} ativo={marcado} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-white">{item.rotulo}</span>
                    <span className="block truncate text-2xs text-white/60">{item.dica}</span>
                  </span>
                  {marcado && <CornerDownLeft aria-hidden className="h-4 w-4 shrink-0 text-ouro" />}
                </div>
              </li>
            );
          })}
        </ul>

        <p aria-hidden className="hidden shrink-0 items-center gap-4 border-t border-white/10 px-4 py-2 text-[11px] text-white/50 sm:flex">
          <span><kbd className="font-sans font-semibold">↑ ↓</kbd> navegar</span>
          <span><kbd className="font-sans font-semibold">Enter</kbd> abrir</span>
          <span><kbd className="font-sans font-semibold">Esc</kbd> fechar</span>
        </p>
      </div>
    </div>
  );
}
