import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Target } from "lucide-react";
import { PLANO_PRECO_ROTULO, PLANO_TRIAL_DIAS } from "@/lib/planejamento/oferta";

/**
 * O Planejamento Financeiro como PRIMEIRO card da home, na mesma forma
 * palco + rodapé dos cards de área — mas no laranja da marca, porque é o
 * único produto que se compra. O rodapé troca "Acessar" pela oferta.
 */
export function CardPlanejamentoHome({
  /** `/planejamento/app` para quem já tem conta (mesmo em teste — o app se
   *  protege por dentro); `/planejamento` (a venda) para quem não tem. Sem
   *  esta prop o card sempre mandava para a venda, até para quem já podia
   *  simplesmente entrar. */
  href = "/planejamento",
}: {
  href?: string;
}) {
  return (
    <Link
      href={href}
      className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-primary/5 transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
    >
      <span
        // A MESMA altura do CardPortal, incluindo o degrau em tela alta: este
        // card fica lado a lado com os outros três e é um componente separado
        // — mexer só lá deixou o PRO mais baixo que os vizinhos.
        className="relative flex min-h-[10.5rem] flex-1 flex-col items-center justify-center gap-2 px-4 text-center text-white transition-[filter] duration-300 group-hover:brightness-[1.12] [@media(min-height:860px)]:min-h-[13rem]"
        style={{
          background:
            "linear-gradient(160deg, hsl(18 76% 44%) 0%, hsl(15 74% 32%) 60%, hsl(13 70% 24%) 100%)",
          boxShadow: "inset 0 1px 0 hsl(35 90% 80% / 0.28)",
        }}
      >
        {/* O render dos painéis de vidro por trás do laranja. Entra em
            `soft-light` e com opacidade baixa: vira textura e brilho, não
            uma segunda imagem competindo com o título do card. */}
        <Image
          aria-hidden
          alt=""
          src="/cenas/cena-painel-3d.webp"
          fill
          sizes="(max-width: 640px) 100vw, 25vw"
          className="pointer-events-none object-cover opacity-25 mix-blend-soft-light transition-transform duration-500 group-hover:scale-105"
        />

        <span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(16rem 9rem at 50% -20%, hsl(38 95% 62% / 0.32), transparent 65%)",
          }}
        />
        <span className="absolute right-3 top-3 rounded-md bg-white px-1.5 py-0.5 text-2xs font-extrabold uppercase tracking-wider text-accent-strong">
          PRO
        </span>
        <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.14] ring-1 ring-white/[0.18]">
          <Target className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <span className="relative font-display text-lg font-extrabold uppercase tracking-tight">
          Planejamento
        </span>
        <span className="relative text-xs leading-snug text-white/80">
          Diagnóstico e plano em 10 minutos
        </span>
      </span>

      <span className="flex items-center justify-between border-t border-primary/5 px-4 py-3">
        <span className="text-sm font-bold text-accent-strong">
          {PLANO_TRIAL_DIAS} dias grátis
        </span>
        <span className="flex items-center gap-1.5 text-2xs font-semibold text-muted-foreground">
          depois {PLANO_PRECO_ROTULO}/mês
          <ArrowRight className="h-3.5 w-3.5 text-accent-strong transition-transform group-hover:translate-x-0.5" />
        </span>
      </span>
    </Link>
  );
}
