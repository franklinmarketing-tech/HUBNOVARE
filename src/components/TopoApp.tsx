"use client";

import Link from "next/link";
import Image from "next/image";
import { Newspaper, Search } from "lucide-react";
import { MenuAreas } from "@/components/MenuAreas";
import { MenuConta } from "@/components/MenuConta";
import { SinoNotificacoes } from "@/components/SinoNotificacoes";
import type { Portal } from "@/lib/categorias";
import type { Notificacao } from "@/lib/notificacoes";

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
  email = "",
  assinante,
  admin = false,
  logado,
  portais = [],
  notificacoes = [],
  comBusca = false,
}: {
  nome: string | null;
  email?: string;
  assinante: boolean;
  admin?: boolean;
  logado: boolean;
  portais?: Portal[];
  notificacoes?: Notificacao[];
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

        {/* Selo de parceria oficial com a Nord Investimentos.
            Só a partir de 2xl: entre 1280 e 1536 ele disputava espaço com o
            menu de áreas e empurrava o botão "Entrar" para fora da tela. */}
        <div className="hidden shrink-0 items-center gap-2 border-l border-slate-200 pl-3 2xl:flex">
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

        {/* O News com pulso de "ao vivo": o canal publica sempre, e o ponto
            pulsando é o jeito de dizer isso sem mais um botão colorido. */}
        <Link
          href="/novare-news"
          className="hidden shrink-0 items-center gap-2 rounded-xl bg-ciano-tint px-3 py-2 text-xs font-bold text-ciano-forte ring-1 ring-ciano/20 transition-all hover:-translate-y-px hover:ring-ciano/40 md:flex"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-ciano opacity-60 motion-safe:animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-ciano" />
          </span>
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

        {/* Sino e avatar: o selo de plano que ficava aqui só informava, e o
            plano continua visível — agora dentro do menu, junto do caminho
            para trocá-lo, ver o cadastro e sair. */}
        {logado ? (
          <>
            <SinoNotificacoes notificacoes={notificacoes} />
            <MenuConta
              nome={nome ?? ""}
              email={email}
              assinante={assinante}
              admin={admin}
            />
          </>
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
