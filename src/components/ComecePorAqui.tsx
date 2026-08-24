import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * A recomendação da casa numa TIRA, não num bloco de cards.
 * Curadoria humana com o mínimo de cromo: quem chega vê a ordem
 * sugerida e, logo abaixo, os aplicativos.
 */
const PASSOS = [
  {
    numero: "1",
    rotulo: "Diagnóstico Financeiro",
    href: "https://novareapp.com.br/ferramentas/score-de-saude-financeira",
    externo: true,
  },
  { numero: "2", rotulo: "Orçamento Mensal", href: "/ferramentas/orcamento", externo: false },
  { numero: "3", rotulo: "Calculadora de Aportes", href: "/ferramentas/aportes", externo: false },
];

export function ComecePorAqui() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-accent-soft bg-accent-tint px-4 py-3">
      <span className="text-sm font-semibold text-foreground">
        Nunca usou? Comece nesta ordem:
      </span>
      {PASSOS.map((p) => {
        const conteudo = (
          <>
            <span className="font-display font-bold text-accent-strong">
              {p.numero}.
            </span>{" "}
            {p.rotulo}
            <ArrowRight className="ml-1 inline h-3.5 w-3.5 align-[-2px] text-slate-500 transition-colors group-hover:text-primary" />
          </>
        );
        const classe =
          "group text-sm font-medium text-slate-600 transition-colors hover:text-primary";
        return p.externo ? (
          <a key={p.numero} href={p.href} target="_blank" rel="noopener noreferrer" className={classe}>
            {conteudo}
          </a>
        ) : (
          <Link key={p.numero} href={p.href} className={classe}>
            {conteudo}
          </Link>
        );
      })}
    </div>
  );
}
