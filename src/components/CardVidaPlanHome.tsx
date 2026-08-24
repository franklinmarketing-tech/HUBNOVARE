import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Target } from "lucide-react";
import { VIDA_PLAN_PRECO_ROTULO } from "@/lib/vidaplan";

/**
 * O card do Vida Plan na home.
 *
 * É o único produto pago do Workspace, então ganha um lugar só dele — navy,
 * enquanto o resto da home é claro. O clique leva para a landing page, onde a
 * pessoa entende o produto antes de ver o pop-up de assinatura: preço no
 * primeiro clique afasta quem ainda não sabe o que está comprando.
 */
export function CardVidaPlanHome() {
  return (
    <Link
      href="/vida-plan"
      className="glass-card group relative flex h-full items-center gap-5 overflow-hidden rounded-2xl bg-primary p-5 text-white shadow-[0_10px_28px_-14px_hsl(215_50%_23%_/_0.5)] sm:p-6"
    >
      {/* Halo da marca no canto, o mesmo tratamento dos cards de área. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(16rem 9rem at 88% -10%, hsl(16 90% 58% / 0.34), transparent 62%)",
        }}
      />

      <div className="relative flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-accent-btn px-2 py-0.5 text-2xs font-extrabold uppercase tracking-wider">
            Assinatura
          </span>
          <span className="text-2xs font-semibold text-white/60">
            o único produto pago do Workspace
          </span>
        </div>

        <h3 className="mt-2.5 font-display text-lg font-bold leading-tight sm:text-xl">
          Vida Plan
        </h3>
        <p className="mt-1 max-w-md text-xs leading-snug text-white/75 sm:text-sm">
          Transforma os seus objetivos num número só — o Marco Horizonte — e mostra o
          caminho até ele, ano a ano.
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-2xs text-white/70">
          <span className="flex items-center gap-1.5">
            <Check className="h-3 w-3 text-accent-claro" /> Cancele quando quiser
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="h-3 w-3 text-accent-claro" /> Consultor acompanhando
          </span>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-xl bg-accent-btn px-4 py-2 text-xs font-bold transition-colors group-hover:bg-accent-strong sm:text-sm">
            Conhecer o Vida Plan
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
          <span className="text-xs text-white/70">
            <b className="font-display text-base font-black text-white tabular-nums">
              {VIDA_PLAN_PRECO_ROTULO}
            </b>{" "}
            por mês
          </span>
        </div>
      </div>

      {/* Arte do produto: some no celular para o texto respirar. */}
      <div className="relative hidden h-28 w-28 shrink-0 overflow-hidden rounded-2xl lg:block">
        <Image
          src="/cards/card-projeto-vida.webp"
          alt=""
          fill
          sizes="112px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-primary/35" />
        <span className="absolute inset-0 flex items-center justify-center">
          <Target className="h-8 w-8 text-white/90" strokeWidth={1.5} />
        </span>
      </div>
    </Link>
  );
}
