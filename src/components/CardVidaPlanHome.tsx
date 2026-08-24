import Link from "next/link";
import { ArrowRight, Target } from "lucide-react";
import { VIDA_PLAN_PRECO_ROTULO, VIDA_PLAN_TRIAL_DIAS } from "@/lib/vidaplan";

/**
 * O Vida Plan como PRIMEIRO card da home.
 *
 * Tem a mesma forma dos cards de área para a fileira não ficar torta, mas
 * carrega o selo PRO e o laranja da marca — enquanto as áreas gratuitas
 * ficam na cor delas com o selo "Grátis". É a única coisa que se compra no
 * Workspace, e a home deixa isso explícito num olhar.
 */
export function CardVidaPlanHome() {
  return (
    <Link
      href="/vida-plan"
      className="@container glass-card group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl p-5 text-white shadow-[0_10px_26px_-14px_hsl(16_80%_35%_/_0.5)]"
      style={{
        background:
          "linear-gradient(155deg, hsl(16 78% 40%) 0%, hsl(14 70% 26%) 100%)",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(16rem 9rem at 82% -8%, hsl(38 95% 62% / 0.42), transparent 62%)",
        }}
      />

      <div className="relative flex items-start justify-between">
        <span className="tile-cine flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.18] backdrop-blur-sm">
          <Target className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <span className="rounded-md bg-white px-1.5 py-0.5 text-2xs font-extrabold uppercase tracking-wider text-accent-strong">
          PRO
        </span>
      </div>

      <div className="relative mt-5">
        <h3 className="font-display text-lg font-extrabold uppercase tracking-tight @[15rem]:text-xl">
          Vida Plan
        </h3>
        <p className="mt-1 line-clamp-2 text-xs leading-snug text-white/80">
          Seus objetivos viram um número só, com um consultor acompanhando. A Íris vai de brinde.
        </p>
      </div>

      <div className="relative mt-5 flex items-center justify-between border-t border-white/20 pt-3">
        <span className="flex items-center gap-1.5 text-sm font-bold">
          {VIDA_PLAN_TRIAL_DIAS} dias grátis
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
        <span className="text-[11px] font-bold tabular-nums text-white/85">
          depois {VIDA_PLAN_PRECO_ROTULO}/mês
        </span>
      </div>
    </Link>
  );
}
