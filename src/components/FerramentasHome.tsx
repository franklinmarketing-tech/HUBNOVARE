"use client";

import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import { useFavoritos, MAX_ATALHOS } from "@/lib/favoritos";

/**
 * A fileira de ferramentas da home, agora fixável.
 *
 * O que a pessoa fixa sobe para a frente da fila — a fileira continua com
 * SEIS lugares, nunca ganha uma linha nova. Foi de propósito: a home tem de
 * caber numa tela, e uma seção "Seus atalhos" separada custaria a altura
 * que não existe.
 *
 * A estrela só aparece no hover (e sempre, quando já está fixada): um
 * enfeite visível em seis cards ao mesmo tempo viraria ruído.
 */

/**
 * As seis calculadoras mais buscadas do Brasil, direto na capa.
 *
 * A seleção segue o ranking real de procura (o que Mobills, iDinheiro e o
 * Google Trends mostram): juros compostos é a campeã nacional, seguida de
 * salário líquido, rescisão, financiamento, CDI e 13º.
 */
export const FERRAMENTAS_CAPA: {
  href: string;
  nome: string;
  chamada: string;
  emoji: string;
  externo?: boolean;
}[] = [
  { href: "/ferramentas/juros-compostos", nome: "Juros Compostos", chamada: "Veja seu dinheiro crescer", emoji: "📈" },
  { href: "/ferramentas/salario-liquido", nome: "Salário Líquido", chamada: "Quanto cai na conta", emoji: "💰" },
  { href: "/ferramentas/rescisao", nome: "Rescisão", chamada: "Confira antes de assinar", emoji: "🧾" },
  { href: "/ferramentas/financiamento", nome: "Financiamento", chamada: "Casa e carro na conta certa", emoji: "🏠" },
  { href: "https://novareapp.com.br/ferramentas/simulador-de-renda-fixa", nome: "Simulador CDI", chamada: "CDB e renda fixa no líquido", emoji: "📊", externo: true },
  { href: "/ferramentas/decimo-terceiro", nome: "13º Salário", chamada: "As duas parcelas", emoji: "🎁" },
];

export function FerramentasHome() {
  const { favoritos, alternar, eFavorito } = useFavoritos();

  // Fixadas primeiro, o resto na ordem original. `sort` puro sobre uma cópia
  // — ordenar o array do módulo mudaria a fileira para sempre.
  const ordenadas = [...FERRAMENTAS_CAPA].sort((a, b) => {
    const fa = favoritos.indexOf(a.href);
    const fb = favoritos.indexOf(b.href);
    if (fa === -1 && fb === -1) return 0;
    if (fa === -1) return 1;
    if (fb === -1) return -1;
    return fa - fb;
  });

  const temAtalho = favoritos.length > 0;

  return (
    <section className="cine" style={{ transitionDelay: "420ms" }}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-base font-extrabold tracking-tight text-primary">
          {temAtalho ? "Seus atalhos" : "Ferramentas gratuitas"}
        </h2>
        <Link
          href="/aplicativos"
          className="inline-flex items-center gap-1 text-xs font-bold text-accent-strong underline-offset-2 hover:underline"
        >
          Ver todas
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <ul className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        {ordenadas.map(({ href, nome, chamada, emoji, externo }, i) => {
          const fixada = eFavorito(href);
          return (
            <li key={href} className="group/i relative">
              <Link
                href={href}
                target={externo ? "_blank" : undefined}
                rel={externo ? "noopener noreferrer" : undefined}
                className="glass-card group flex h-full items-center gap-2 rounded-2xl bg-white p-2.5 pr-7 shadow-card ring-1 ring-primary/5 transition-all hover:-translate-y-0.5 hover:shadow-card-hover hover:ring-accent/25"
              >
                {/* Emoji vivo, sem chip: leveza é a modernidade aqui. */}
                <span
                  className="emoji-vivo text-lg transition-transform duration-200 group-hover:scale-110"
                  style={{ animationDelay: `${i * 0.4}s` }}
                >
                  {emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-xs font-bold leading-tight text-primary">
                    {nome}
                  </span>
                  <span className="block truncate text-2xs leading-tight text-muted-foreground [@media(max-height:820px)]:hidden">
                    {chamada}
                  </span>
                </span>
              </Link>

              {/* Fora do <Link>: uma âncora dentro de outra é HTML inválido,
                  e o clique na estrela não pode navegar. */}
              <button
                type="button"
                onClick={() => alternar(href)}
                aria-pressed={fixada}
                aria-label={fixada ? `Desafixar ${nome}` : `Fixar ${nome} nos atalhos`}
                title={fixada ? "Desafixar" : "Fixar nos atalhos"}
                className={`absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-lg transition-all ${
                  fixada
                    ? "text-accent opacity-100"
                    : "text-slate-300 opacity-0 hover:text-accent focus-visible:opacity-100 group-hover/i:opacity-100"
                }`}
              >
                <Star className="h-3.5 w-3.5" fill={fixada ? "currentColor" : "none"} />
              </button>
            </li>
          );
        })}
      </ul>

      {favoritos.length >= MAX_ATALHOS && (
        <p className="mt-1.5 text-2xs text-muted-foreground">
          Sua fileira está cheia — desafixe uma para fixar outra.
        </p>
      )}
    </section>
  );
}
