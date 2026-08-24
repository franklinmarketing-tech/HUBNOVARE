import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Home, LayoutGrid, Newspaper } from "lucide-react";

/**
 * A página de endereço errado.
 *
 * Antes disto, quem digitasse um endereço torto caía na tela padrão do
 * Next: "404 — This page could not be found", em inglês, fundo branco,
 * sem marca e sem um único link. A pessoa não tinha como voltar a não ser
 * pelo botão do navegador.
 *
 * Vale também para as rotas dinâmicas (artigo ou profissão inexistente),
 * que antes perdiam até o layout do site.
 */
export default function NaoEncontrada() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-white px-5 py-16 text-center">
      <Image
        src="/marca/logo-novare.png"
        alt="Novare"
        width={132}
        height={33}
        className="h-8 w-auto"
      />

      <p className="mt-10 font-display text-6xl font-black text-primary/15">
        404
      </p>
      <h1 className="mt-2 font-display text-2xl font-bold text-primary sm:text-3xl">
        Esta página não existe
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-500">
        O endereço pode ter mudado de lugar ou vindo com um erro de
        digitação. Nada se perdeu — é só escolher por onde continuar.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
        >
          <Home className="h-4 w-4" />
          Ir para o início
        </Link>
        <Link
          href="/aplicativos"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition-colors hover:border-primary/30 hover:text-primary"
        >
          <LayoutGrid className="h-4 w-4" />
          Ver as ferramentas
        </Link>
        <Link
          href="/novare-news"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition-colors hover:border-primary/30 hover:text-primary"
        >
          <Newspaper className="h-4 w-4" />
          Novare News
        </Link>
      </div>

      <Link
        href="/consultoria"
        className="mt-8 inline-flex items-center gap-1.5 text-xs font-semibold text-accent-strong hover:underline"
      >
        Procurava falar com a gente?
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
