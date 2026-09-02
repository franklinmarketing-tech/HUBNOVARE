import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * A faixa da Íris na home.
 *
 * Voltou a ser CLARA e fina depois de um período em navy: o bloco escuro
 * pesava demais no meio de uma home clara e, com a barra "Pergunte à Íris"
 * agora no topo da página, ele virava o segundo chamado da mesma coisa na
 * mesma tela. Aqui ele faz o papel menor que lhe cabe — o atalho para a
 * página dela — e devolve a altura que a home precisa para caber sem rolar.
 *
 * O robô é SVG inline: não existe arte dele em /public, e desenhar aqui
 * mantém a ilustração nítida em qualquer tela sem custo de download.
 */
export function BannerIris({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/iris"
      className={`glass-card group cine flex min-w-0 items-center gap-3 rounded-2xl bg-gradient-to-r from-ciano-tint/80 via-white to-white p-3 shadow-card ring-1 ring-ciano/15 transition-all hover:-translate-y-0.5 hover:shadow-card-hover hover:ring-ciano/30 ${className}`}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ciano-tint">
        <RoboIlustrado />
      </span>

      <span className="min-w-0 flex-1">
        {/* flex-wrap + min-w-0: sem os dois, o título e o selo "beta" se
            recusam a quebrar e empurram a faixa para fora da tela no
            celular — foi assim que a home passou a rolar de lado. */}
        <span className="flex min-w-0 flex-wrap items-center gap-x-2">
          <span className="font-display text-sm font-bold text-primary">
            Íris, a IA financeira
          </span>
          <span className="rounded-md bg-ciano-tint px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-ciano-forte">
            beta
          </span>
        </span>
        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
          Cole seu extrato e veja onde seu dinheiro está sumindo.
        </span>
      </span>

      <ArrowRight className="h-4 w-4 shrink-0 text-ciano-forte transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

/** O rosto dela. Decorativo — o texto ao lado é quem nomeia a faixa. */
function RoboIlustrado() {
  return (
    <svg aria-hidden viewBox="0 0 64 64" className="h-5 w-5">
      <g fill="currentColor" className="text-ciano-forte">
        <rect x="6" y="26" width="6" height="13" rx="3" opacity="0.55" />
        <rect x="52" y="26" width="6" height="13" rx="3" opacity="0.55" />
        <rect x="13" y="13" width="38" height="35" rx="13" />
      </g>
      <line x1="32" y1="7" x2="32" y2="13" stroke="currentColor" strokeWidth="2.5"
        strokeLinecap="round" className="text-ciano-forte" />
      <circle cx="32" cy="6" r="2.6" className="fill-ciano" />
      <rect x="18" y="19" width="28" height="21" rx="9.5" className="fill-white/95" />
      <circle cx="26" cy="29" r="3.2" className="fill-ciano" />
      <circle cx="38" cy="29" r="3.2" className="fill-ciano" />
    </svg>
  );
}
