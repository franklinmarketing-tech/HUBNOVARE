import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  LifeBuoy,
  MessageCircleQuestion,
  Sprout,
  type LucideIcon,
} from "lucide-react";

/**
 * "COMECE POR AQUI": a home entra pela SITUAÇÃO da pessoa, e não pela categoria.
 *
 * Pedido do dono em 19/10/2026: deixar o Workspace mais humano. Quem chega
 * apertado não pensa "preciso da área Vida Financeira" — pensa "estou no
 * vermelho". As quatro portas abaixo falam a língua de quem chega e levam à
 * ferramenta certa; as vitrines por área continuam logo abaixo para quem já
 * sabe o que procura.
 *
 * ⚠️ CADA DESTINO É UMA ROTA QUE EXISTE E É GRATUITA. Trocar um destino aqui
 * é trocar uma promessa: a frase do cartão tem de continuar verdadeira lá.
 */
const SITUACOES: {
  icone: LucideIcon;
  frase: string;
  linha: string;
  href: string;
}[] = [
  {
    icone: LifeBuoy,
    frase: "Estou no vermelho",
    linha: "Descubra onde está o aperto e por onde começar.",
    href: "/exame-saude-financeira",
  },
  {
    icone: CalendarCheck,
    frase: "Quero organizar o mês",
    linha: "Veja quanto ainda dá para gastar, sem planilha.",
    href: "/fincash",
  },
  {
    icone: Sprout,
    frase: "Quero que meu dinheiro renda mais",
    linha: "Compare investimentos com calculadoras simples.",
    href: "/aplicativos?area=investimentos",
  },
  {
    icone: MessageCircleQuestion,
    frase: "Tenho uma dúvida",
    linha: "Pergunte à Íris, a IA da Novare, a qualquer hora.",
    href: "/iris",
  },
];

export function ComecePorAqui() {
  return (
    <section aria-labelledby="comece-titulo" className="cine" style={{ transitionDelay: "80ms" }}>
      <h2 id="comece-titulo" className="text-sm font-semibold text-muted-foreground">
        Comece por aqui
      </h2>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {SITUACOES.map(({ icone: Icone, frase, linha, href }) => (
          <li key={href}>
            <Link
              href={href}
              className="group flex h-full items-start gap-3 rounded-2xl border border-border bg-white p-4 shadow-card transition-all hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-card-hover"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-tint text-accent-strong">
                <Icone className="h-5 w-5" strokeWidth={1.9} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-[15px] font-bold leading-snug text-primary">
                  {frase}
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                  {linha}
                </span>
              </span>
              <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-accent-strong" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
