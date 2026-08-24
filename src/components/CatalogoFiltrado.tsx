"use client";

import { useMemo, useState, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, ArrowUpRight, Check, Lock } from "lucide-react";
import {
  corDe,
  gradienteDe,
  iconeDe,
  raioDe,
  sombraCardDe,
  sombraTileDe,
} from "@/lib/icones";
import { capaDe, emblemaDe } from "@/lib/capas";
import { BotaoLampada, ModalApp } from "@/components/ModalApp";
import { INTRO_FAMILIAS, type Familia } from "@/lib/apps";
import type { AppLeve } from "@/lib/navegacao";

/**
 * O catálogo: estrutura limpa (títulos fortes, página direta) com os tiles
 * coloridos da marca. O equilíbrio é esse — organização de fintech, cor e
 * profundidade de produto premium.
 */

type Filtro = { chave: string; rotulo: string; total: number };

/** Card dos apps do Workspace: navy com aurora, uma linha. */
function CardWorkspace({ app }: { app: AppLeve }) {
  const Icone = iconeDe(app.slug);

  const miolo = (
    <div
      className="glass-card rounded-2xl p-5 text-white"
      style={{
        "--brilho": "hsl(16 90% 60% / 0.3)",
        "--eleva": "0 22px 48px -18px hsl(215 60% 12% / 0.75)",
      } as CSSProperties}
    >
      <div className="flex items-center gap-4">
        <span className="tile-cine flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/[0.12] ring-1 ring-inset ring-white/25">
          <Icone className="h-5 w-5 text-white" strokeWidth={1.5} />
        </span>

        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-lg font-bold">
            {app.nome}
          </h3>
          <p className="truncate text-sm text-white/70">{app.chamada}</p>
        </div>

        <p className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-[hsl(16_90%_70%)] transition-colors group-hover:text-white">
          <span className="hidden sm:block">
            {app.aberto ? "Abrir" : "Liberar"}
          </span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </p>
      </div>
    </div>
  );

  if (app.externo) {
    return (
      <a href={app.href} target="_blank" rel="noopener noreferrer" className="group block">
        {miolo}
      </a>
    );
  }
  return (
    <Link href={app.href} className="group block">
      {miolo}
    </Link>
  );
}

/** Card padrão: tile com gradiente da categoria + vetor branco fino. */
function CardApp({ app }: { app: AppLeve }) {
  const [aberto, setAberto] = useState(false);
  const Icone = iconeDe(app.slug);
  // Produto da casa tem foto; ferramenta gratuita fica no tile de cor.
  const capa = capaDe(app.slug);
  const emblema = emblemaDe(app.slug);
  const temExplicacao =
    !app.emBreve && Boolean(app.descricao || app.pontosFortes?.length);

  // A cor do app entra por variáveis CSS: o hover reage na cor da categoria.
  const estilo = {
    "--tom": corDe(app.slug),
    "--eleva": sombraCardDe(app.slug),
    // O halo do cursor acende na cor da própria categoria.
    "--brilho": corDe(app.slug).replace(")", " / 0.16)").replace("hsl(", "hsl("),
  } as CSSProperties;

  const miolo = (
    <>
      {/* Coluna de texto à esquerda, foto de verdade sangrando pela
          direita — é a foto que dá vida ao card, não um fundo apagado. */}
      <div className="relative flex h-full items-stretch gap-3">
        <div className="flex min-w-0 flex-1 flex-col py-0.5">
          {emblema ? (
            <span className="flex h-11 w-11 shrink-0 items-center justify-center">
              <Image
                src={emblema}
                alt=""
                width={44}
                height={44}
                className="h-11 w-11 object-contain drop-shadow-[0_6px_12px_hsl(215_50%_23%_/_0.28)] transition-transform duration-300 group-hover:-translate-y-0.5"
              />
            </span>
          ) : (
            <span
              className={`tile-cine flex h-11 w-11 shrink-0 items-center justify-center ${raioDe(app.slug)}`}
              style={{
                backgroundImage: gradienteDe(app.slug),
                boxShadow: app.emBreve ? undefined : sombraTileDe(app.slug),
              }}
            >
              {!app.aberto && !app.emBreve ? (
                <Lock className="h-5 w-5 text-white" strokeWidth={1.5} />
              ) : (
                <Icone className="h-5 w-5 text-white" strokeWidth={1.5} />
              )}
            </span>
          )}

          <h3 className="mt-3 text-[15px] font-bold leading-tight text-foreground">
            {app.nome}
          </h3>
          <p className="mt-1 line-clamp-2 text-xs leading-snug text-muted-foreground">
            {app.emBreve
              ? "em breve"
              : app.aberto
                ? app.chamada
                : "Incluso no Workspace"}
          </p>

          {/* O padrão que a ferramenta persegue: prova de que o nível foi
              escolhido, não improvisado. */}
          {app.referencia && (
            <p className="mt-auto border-t border-slate-100 pt-2 text-[10px] text-slate-500">
              padrão{" "}
              <span className="font-medium text-slate-500">{app.referencia}</span>
            </p>
          )}
        </div>

        {/* A foto: real, sem véu apagando ela — só o degradê mínimo na
            costura para o card não parecer dois blocos colados. */}
        {capa && (
          <div className="relative -my-4 -mr-4 w-[38%] shrink-0 overflow-hidden rounded-r-2xl sm:w-[42%]">
            <Image
              src={capa}
              alt=""
              fill
              sizes="140px"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div
              className="absolute inset-y-0 left-0 w-8"
              style={{
                background:
                  "linear-gradient(90deg, white 0%, transparent 100%)",
              }}
            />
          </div>
        )}

        {!app.emBreve && (
          <ArrowUpRight
            className={`pointer-events-none absolute right-2 top-2 h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${
              capa
                ? "text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]"
                : "text-slate-300 group-hover:text-(--tom)"
            }`}
          />
        )}
      </div>

      {/* A lâmpada: acende no hover e abre a explicação no clique.
          Só existe onde há o que explicar. */}
      {temExplicacao && <BotaoLampada aoAbrir={() => setAberto(true)} />}
    </>
  );

  const className = "glass-card group relative block h-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 hover:border-(--tom)";

  const modal = aberto ? (
    <ModalApp
      app={app}
      capa={capa}
      emblema={emblema}
      aoFechar={() => setAberto(false)}
    />
  ) : null;

  if (app.emBreve) {
    return (
      <div className={`${className} opacity-60`} style={estilo} aria-disabled="true">
        {miolo}
      </div>
    );
  }

  if (app.externo) {
    return (
      <div style={estilo} className="relative h-full">
        <a
          href={app.href}
          target="_blank"
          rel="noopener noreferrer"
          className={className}
        >
          {miolo}
        </a>
        {modal}
      </div>
    );
  }

  return (
    <div style={estilo} className="relative h-full">
      <Link href={app.href} className={className}>
        {miolo}
      </Link>
      {modal}
    </div>
  );
}

export function CatalogoFiltrado({
  apps,
  filtros,
}: {
  apps: AppLeve[];
  filtros: Filtro[];
}) {
  // O portal da home chega como ?area=credito e ja abre filtrado.
  const params = useSearchParams();
  const areaInicial = params.get("area");
  const [ativo, setAtivo] = useState(
    areaInicial && filtros.some((f) => f.chave === areaInicial)
      ? areaInicial
      : "todos",
  );

  const visiveis = useMemo(
    () => (ativo === "todos" ? apps : apps.filter((a) => a.filtro === ativo)),
    [apps, ativo],
  );

  const grupos = useMemo(() => {
    if (ativo !== "todos") return null;
    const mapa = new Map<string, AppLeve[]>();
    for (const app of apps) {
      const lista = mapa.get(app.filtro) ?? [];
      lista.push(app);
      mapa.set(app.filtro, lista);
    }
    return filtros
      .filter((f) => f.chave !== "todos")
      .map((f) => ({ ...f, apps: mapa.get(f.chave) ?? [] }))
      .filter((g) => g.apps.length > 0);
  }, [apps, ativo, filtros]);

  function Grade({ lista }: { lista: AppLeve[] }) {
    const workspace = lista.filter((a) => a.filtro === "workspace");
    const comuns = lista.filter((a) => a.filtro !== "workspace");
    return (
      <>
        {workspace.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {workspace.map((app) => (
              <CardWorkspace key={app.slug} app={app} />
            ))}
          </div>
        )}
        {comuns.length > 0 && (
          <div
            className={`grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 ${
              workspace.length > 0 ? "mt-3" : ""
            }`}
          >
            {comuns.map((app, i) => (
              <div
                key={app.slug}
                className="surgir"
                style={{ animationDelay: `${Math.min(i * 45, 360)}ms` }}
              >
                <CardApp app={app} />
              </div>
            ))}
          </div>
        )}
      </>
    );
  }

  return (
    <>
      {/* Filtros: ativo no laranja da marca, com o brilho de volta. */}
      <div className="-mx-5 mb-7 overflow-x-auto px-5 pb-1">
        <div className="flex w-max gap-1.5">
          {filtros.map((f) => {
            const selecionado = ativo === f.chave;
            return (
              <button
                key={f.chave}
                type="button"
                onClick={() => setAtivo(f.chave)}
                aria-pressed={selecionado}
                className={`shrink-0 rounded-full px-4 py-1.5 text-[13px] font-semibold transition-all ${
                  selecionado
                    ? "bg-accent-btn text-accent-foreground shadow-[0_6px_16px_-6px_hsl(16_80%_45%_/_0.6)]"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {f.rotulo}
              </button>
            );
          })}
        </div>
      </div>

      {grupos ? (
        <div className="space-y-10">
          {grupos.map((grupo) => {
            const intro = INTRO_FAMILIAS[grupo.chave as Familia];
            return (
              <section key={grupo.chave} className="surgir">
                <h2 className="titulo-secao text-xl sm:text-2xl">
                  {grupo.rotulo}
                </h2>
                {intro && (
                  <p className="mt-2.5 max-w-lg text-sm text-muted-foreground">
                    {intro}
                  </p>
                )}
                <div className="mt-4">
                  <Grade lista={grupo.apps} />
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <Grade lista={visiveis} />
      )}
    </>
  );
}
