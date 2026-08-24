import Link from "next/link";
import { ArrowRight, Target } from "lucide-react";
import { VIDA_PLAN_PRECO_ROTULO } from "@/lib/vidaplan";

/**
 * O card do Vida Plan na home.
 *
 * É o único produto pago do Workspace, então ganha uma faixa só dele — navy,
 * enquanto o resto da home é claro. Compacto de propósito: a home cabe em uma
 * tela, e o detalhe do produto mora na landing page. O clique leva para lá,
 * onde a pessoa entende o produto antes de ver o pop-up de assinatura.
 */
export function CardVidaPlanHome() {
  return (
    <Link
      href="/vida-plan"
      className="glass-card group relative flex items-center gap-4 overflow-hidden rounded-2xl bg-primary px-5 py-4 text-white shadow-[0_10px_26px_-14px_hsl(215_50%_23%_/_0.5)]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(14rem 8rem at 86% -20%, hsl(16 90% 58% / 0.34), transparent 62%)",
        }}
      />

      <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/[0.14]">
        <Target className="h-5 w-5" strokeWidth={1.75} />
      </span>

      <div className="relative min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-display text-base font-bold leading-tight sm:text-lg">
            Vida Plan
          </h3>
          <span className="rounded-md bg-accent-btn px-1.5 py-0.5 text-2xs font-extrabold uppercase tracking-wider">
            Assinatura
          </span>
        </div>
        <p className="mt-0.5 line-clamp-2 text-xs text-white/75 sm:line-clamp-1">
          Seus objetivos viram um número só — o Marco Horizonte — com um consultor
          acompanhando. Cancele quando quiser.
        </p>
      </div>

      <div className="relative hidden shrink-0 text-right sm:block">
        <p className="font-display text-lg font-black leading-none tabular-nums">
          {VIDA_PLAN_PRECO_ROTULO}
        </p>
        <p className="text-2xs text-white/60">por mês</p>
      </div>

      <span className="relative inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-accent-btn px-4 py-2.5 text-xs font-bold transition-colors group-hover:bg-accent-strong sm:text-sm">
        Conhecer
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
