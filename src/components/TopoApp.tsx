"use client";

import Link from "next/link";
import Image from "next/image";
import { Crown, Newspaper, Search } from "lucide-react";
import { MenuAreas } from "@/components/MenuAreas";
import type { Portal } from "@/lib/categorias";

/**
 * Topo do aplicativo: saudação à esquerda, o menu das áreas no centro e o
 * selo do plano à direita.
 *
 * O menu é o que transforma o site em sistema — o catálogo inteiro fica
 * acessível de qualquer página. Por isso a busca saiu daqui e foi para a
 * linha do título: no topo ela competia com o menu pelo mesmo espaço.
 */
export function TopoApp({
  nome,
  assinante,
  logado,
  portais = [],
  comBusca = false,
}: {
  nome: string | null;
  assinante: boolean;
  logado: boolean;
  portais?: Portal[];
  /** Telas sem busca própria (as internas) mantêm o campo aqui. */
  comBusca?: boolean;
}) {
  const primeiroNome = nome?.split(" ")[0] ?? null;

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/85 backdrop-blur-md">
      <div className="flex h-[72px] items-center gap-4 px-5">
        {/* A logo oficial fica em TODAS as larguras: o monograma do trilho
            é um atalho de navegação, não substitui a marca. */}
        <Link href="/" className="shrink-0" aria-label="Novare, início">
          <Image
            src="/marca/logo-novare.png"
            alt="Novare"
            width={100}
            height={26}
            priority
            style={{ height: 24, width: "auto" }}
          />
        </Link>

        {/* Selo de parceria oficial com a Nord Investimentos */}
        <div className="hidden shrink-0 items-center gap-2 border-l border-slate-200 pl-3 lg:flex">
          <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
            Parceiro
          </span>
          <Image
            src="/marca/novare-site/logo-nord.png"
            alt="Nord Investimentos"
            width={72}
            height={23}
            style={{ height: 18, width: "auto" }}
          />
        </div>

        <div className="hidden min-w-0 shrink-0 border-l border-slate-200 pl-4 2xl:block">
          <p className="truncate text-[15px] font-bold text-foreground">
            {primeiroNome ? `Olá, ${primeiroNome}` : "Bem-vindo à Novare"}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            Seus aplicativos financeiros
          </p>
        </div>

        {/* O menu das áreas ocupa o centro; ele some no celular, onde o
            acesso é pela busca e pelos cards. */}
        <div className="mx-auto">
          <MenuAreas portais={portais} />
        </div>

        <Link
          href="/novare-news"
          className="hidden shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition-colors hover:border-primary/30 hover:text-primary md:flex"
        >
          <Newspaper className="h-3.5 w-3.5" />
          News
        </Link>

        {/* min-w-0 + flex-1: sem isso a busca não cede espaço e o botão da
            direita sai da tela no celular. */}
        {comBusca ? (
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("novare:abrir-paleta"))}
            className="flex h-11 min-w-0 flex-1 items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 text-left text-sm text-muted-foreground transition-colors hover:border-primary/30 hover:bg-white sm:max-w-xs"
          >
            <Search className="h-4 w-4 shrink-0" />
            <span className="flex-1 truncate">Pesquisar...</span>
            <kbd className="hidden rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] sm:block">
              ⌘K
            </kbd>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("novare:abrir-paleta"))}
            aria-label="Pesquisar"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:border-primary/30 hover:text-primary xl:hidden"
          >
            <Search className="h-4 w-4" />
          </button>
        )}

        {logado ? (
          <div
            className={`hidden shrink-0 items-center gap-2 rounded-xl border px-3 py-2 sm:flex ${
              assinante
                ? "border-accent-soft bg-accent-tint"
                : "border-slate-200 bg-white"
            }`}
          >
            <Crown
              className={`h-4 w-4 ${assinante ? "text-accent" : "text-slate-500"}`}
            />
            <div className="leading-tight">
              <p className="text-xs font-bold text-foreground">
                {assinante ? "Workspace" : "Plano Free"}
              </p>
              <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    assinante ? "bg-success" : "bg-slate-300"
                  }`}
                />
                {assinante ? "Ativo" : "Gratuito"}
              </p>
            </div>
          </div>
        ) : (
          <Link
            href="/login"
            className="shrink-0 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-primary-soft"
          >
            Entrar
          </Link>
        )}
      </div>
    </header>
  );
}
