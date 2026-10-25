"use client";

import { useCallback, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MessageSquareText, Play, Search, X } from "lucide-react";
import { JanelaManual } from "@/components/BotaoManual";
import { ABRIR_MENSAGEM } from "@/components/BotaoMensagem";
import { MANUAIS, arquivoDoVideo, type Manual } from "@/lib/manuais";

type Filtro = "todos" | "ferramentas" | "fincash";

/** Sem acento e sem maiúscula: "13º Salário" acha "13o salario", "Juros" acha "juros". */
const normalizar = (t: string) =>
  t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/º/g, "o")
    .replace(/ª/g, "a")
    .toLowerCase();

const ehFincash = (chave: string) => chave.startsWith("/fincash");

type Item = { chave: string; manual: Manual; fincash: boolean; texto: string; tituloNorm: string };

const ITENS: Item[] = Object.entries(MANUAIS).map(([chave, manual]) => ({
  chave,
  manual,
  fincash: ehFincash(chave),
  tituloNorm: normalizar(manual.titulo),
  texto: normalizar(
    [
      manual.titulo,
      manual.oQueFaz,
      ...manual.passos,
      ...manual.campos.flatMap((c) => [c.nome, c.explica]),
      ...manual.duvidas.flatMap((d) => [d.p, d.r]),
    ].join(" "),
  ),
}));

/**
 * A CENTRAL DE AJUDA (25/10/2026). Todos os manuais (ferramentas + FINCASH)
 * numa tela só, com busca NO TOPO (padrão da casa).
 *
 * ⚠️ BUSCA LOCAL, NO NAVEGADOR: nada de IA nem API. Cada palavra digitada tem
 * de aparecer em algum texto do manual; quem bate no título vem primeiro.
 */
export function CentralAjuda() {
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [aberto, setAberto] = useState<string | null>(null);
  const fechar = useCallback(() => setAberto(null), []);

  const resultado = useMemo(() => {
    const palavras = normalizar(busca).split(/\s+/).filter(Boolean);
    return ITENS.filter((i) => (filtro === "todos" ? true : filtro === "fincash" ? i.fincash : !i.fincash))
      .filter((i) => palavras.every((p) => i.texto.includes(p)))
      .map((i) => ({ i, peso: palavras.filter((p) => i.tituloNorm.includes(p)).length }))
      .sort((a, b) => b.peso - a.peso)
      .map((x) => x.i);
  }, [busca, filtro]);

  return (
    <>
      <section aria-label="Buscar nos manuais" className="mt-6 rounded-[1.75rem] border border-border bg-white p-4 shadow-[0_24px_60px_-30px_hsl(199_75%_12%_/_0.55)] sm:p-6">
        <label htmlFor="busca-ajuda" className="sr-only">
          Como posso ajudar?
        </label>
        <div className="relative">
          <Search aria-hidden className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            id="busca-ajuda"
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Como posso ajudar? Ex.: importar extrato, 13º, juros"
            autoComplete="off"
            className="h-14 w-full min-w-0 rounded-2xl border-2 border-border bg-background pl-12 pr-12 text-base text-foreground placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:appearance-none focus:border-primary focus:outline-none sm:h-16 sm:text-lg"
          />
          {busca && (
            <button
              type="button"
              onClick={() => setBusca("")}
              aria-label="Limpar a busca"
              className="absolute right-1.5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div role="radiogroup" aria-label="Filtrar manuais" className="flex flex-wrap items-center gap-1 rounded-2xl border border-border bg-white p-1.5 shadow-sm">
            {(
              [
                ["todos", "Todos"],
                ["ferramentas", "Ferramentas"],
                ["fincash", "FINCASH"],
              ] as const
            ).map(([v, r]) => {
              const ativo = v === filtro;
              return (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={ativo}
                  onClick={() => setFiltro(v)}
                  className={`flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors ${
                    ativo ? "bg-primary text-white" : "text-muted-foreground hover:bg-slate-100 hover:text-primary"
                  }`}
                >
                  <span
                    aria-hidden
                    className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border-2 ${ativo ? "border-white" : "border-slate-300"}`}
                  >
                    {ativo && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </span>
                  {r}
                </button>
              );
            })}
          </div>
          <p aria-live="polite" className="text-sm text-muted-foreground">
            {resultado.length === 1 ? "1 manual" : `${resultado.length} manuais`}
          </p>
        </div>
      </section>

      {resultado.length === 0 ? (
        <div className="mt-8 rounded-[1.75rem] border-2 border-dashed border-border bg-white px-6 py-10 text-center">
          <p className="font-display text-xl font-semibold text-primary">Não achamos nenhum manual com isso.</p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            Tente outra palavra (por exemplo, “fatura”, “férias” ou “aluguel”) ou mande sua dúvida: a
            equipe da Novare responde.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event(ABRIR_MENSAGEM))}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-5 text-sm font-bold text-white transition-colors hover:bg-accent-strong"
            >
              <MessageSquareText className="h-4 w-4" />
              Fale com a gente
            </button>
            <button
              type="button"
              onClick={() => {
                setBusca("");
                setFiltro("todos");
              }}
              className="inline-flex min-h-11 items-center rounded-full px-5 text-sm font-semibold text-primary hover:bg-muted"
            >
              Ver todos os manuais
            </button>
          </div>
        </div>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resultado.map(({ chave, manual, fincash }) => (
            <li key={chave} className="flex min-w-0 flex-col overflow-hidden rounded-[1.5rem] border border-border bg-white shadow-sm">
              <button
                type="button"
                onClick={() => setAberto(chave)}
                aria-label={`Ver o vídeo de ${manual.titulo}`}
                className="group relative block h-44 w-full overflow-hidden bg-slate-900"
              >
                <Image
                  src={arquivoDoVideo(chave).replace(/\.mp4$/, ".jpg")}
                  alt=""
                  width={360}
                  height={640}
                  unoptimized
                  loading="lazy"
                  className="h-full w-full object-cover object-top opacity-90 transition-transform duration-300 group-hover:scale-105"
                />
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/95 text-accent shadow-lg">
                    <Play className="ml-0.5 h-5 w-5 fill-current" />
                  </span>
                </span>
                <span className="absolute left-3 top-3 rounded-full bg-primary/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white">
                  {fincash ? "FINCASH" : "Ferramenta"}
                </span>
              </button>
              <div className="flex flex-1 flex-col p-5">
                <h2 className="font-display text-lg font-semibold leading-snug text-primary">{manual.titulo}</h2>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">{manual.oQueFaz}</p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAberto(chave)}
                    aria-haspopup="dialog"
                    className="inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-4 text-sm font-bold text-white transition-colors hover:bg-accent-strong"
                  >
                    <Play className="h-4 w-4 fill-current" />
                    Ver vídeo e manual
                  </button>
                  <Link
                    href={fincash ? chave : `/ferramentas/${chave}`}
                    className="inline-flex min-h-11 items-center gap-1 rounded-full px-3 text-sm font-semibold text-primary hover:bg-muted"
                  >
                    Abrir a tela
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {aberto && <JanelaManual chave={aberto} aoFechar={fechar} semLinkAjuda />}
    </>
  );
}
