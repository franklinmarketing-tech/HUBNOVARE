import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * A chamada da Íris na home, no fundo navy da marca.
 *
 * A faixa clara que estava aqui competia de igual para igual com as outras
 * seis fileiras da página — e a Íris é o diferencial da casa, não mais um
 * card. O fundo escuro é o que a separa do resto sem precisar de mais um
 * botão colorido.
 *
 * O robô é SVG inline de propósito: não existe arte dele em /public, e
 * desenhar aqui deixa a ilustração nítida em qualquer tela, respondendo ao
 * tema pelas cores da marca em vez de um PNG com fundo chapado.
 */
export function BannerIris({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/iris"
      className={`group surgir relative flex items-center gap-3.5 overflow-hidden rounded-2xl p-3.5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover ${className}`}
      style={{
        background:
          "linear-gradient(120deg, hsl(219 54% 13%) 0%, hsl(216 52% 20%) 55%, hsl(215 48% 26%) 100%)",
        boxShadow: "inset 0 1px 0 hsl(210 60% 80% / 0.14)",
      }}
    >
      {/* Halo atrás do robô: dá profundidade e evita que ele pareça um
          adesivo colado no retângulo. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -left-6 top-1/2 h-24 w-24 -translate-y-1/2 rounded-full opacity-60 blur-2xl"
        style={{ background: "radial-gradient(circle, hsl(197 70% 45% / 0.40), transparent 70%)" }}
      />

      <RoboIlustrado />

      <span className="relative min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-display text-base font-bold text-white">
            Íris, a IA financeira
          </span>
          <span className="rounded-md bg-ciano/25 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-ciano-claro ring-1 ring-ciano/40">
            beta
          </span>
        </span>
        <span className="mt-0.5 block truncate text-xs text-white/70">
          Cole seu extrato e veja onde seu dinheiro está sumindo.
        </span>
      </span>

      <ArrowRight className="relative h-4 w-4 shrink-0 text-ciano-claro transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

/** O rosto da Íris. Decorativo — o texto ao lado é quem nomeia a seção. */
function RoboIlustrado() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 64 64"
      className="relative h-11 w-11 shrink-0 drop-shadow-[0_5px_12px_hsl(197_70%_45%_/_0.35)] transition-transform duration-300 group-hover:-translate-y-0.5"
    >
      <defs>
        <linearGradient id="iris-corpo" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#c9d8ea" />
        </linearGradient>
        <linearGradient id="iris-visor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(216 45% 22%)" />
          <stop offset="100%" stopColor="hsl(219 54% 11%)" />
        </linearGradient>
      </defs>

      {/* Antena */}
      <line x1="32" y1="6" x2="32" y2="12" stroke="url(#iris-corpo)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="32" cy="5" r="2.6" fill="hsl(197 75% 68%)" />

      {/* Orelhas */}
      <rect x="6" y="24" width="7" height="16" rx="3.5" fill="url(#iris-corpo)" opacity="0.85" />
      <rect x="51" y="24" width="7" height="16" rx="3.5" fill="url(#iris-corpo)" opacity="0.85" />

      {/* Cabeça e visor */}
      <rect x="12" y="12" width="40" height="36" rx="13" fill="url(#iris-corpo)" />
      <rect x="17" y="18" width="30" height="22" rx="10" fill="url(#iris-visor)" />
      <circle cx="26" cy="29" r="3.4" fill="hsl(197 75% 68%)" />
      <circle cx="38" cy="29" r="3.4" fill="hsl(197 75% 68%)" />

      {/* Tronco, só o topo — o corte no rodapé dá a sensação de figura maior */}
      <path d="M20 52h24a8 8 0 0 1 8 8v4H12v-4a8 8 0 0 1 8-8z" fill="url(#iris-corpo)" opacity="0.9" />
      <circle cx="32" cy="57" r="2.6" fill="hsl(197 68% 45%)" />
    </svg>
  );
}
