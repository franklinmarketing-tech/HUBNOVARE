import Image from "next/image";
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
      className={`glass-card group cine relative flex min-w-0 items-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-ciano-tint/80 via-white to-white p-3 shadow-card ring-1 ring-ciano/15 transition-all hover:-translate-y-0.5 hover:shadow-card-hover hover:ring-ciano/30 ${className}`}
    >
      {/* O avatar dela é o holograma, redondo.
      
          A cena chegou a entrar como retangulo de fundo no canto direito da
          faixa, mas arte escura sobre uma faixa clara vira uma caixa colada:
          via-se a borda, não a imagem. Recortada em círculo no lugar do
          ícone ela faz o mesmo trabalho — dizer "isso é a IA" antes da
          leitura — sem sujar o bloco. */}
      <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-primary ring-1 ring-ciano/30">
        <Image
          alt=""
          src="/cenas/cena-iris.webp"
          fill
          sizes="36px"
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
      </span>

      <span className="relative min-w-0 flex-1">
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

      <ArrowRight className="relative h-4 w-4 shrink-0 text-ciano-forte transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
