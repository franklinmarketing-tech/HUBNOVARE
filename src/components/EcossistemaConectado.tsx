"use client";

import { Bot, Calculator, LineChart, Newspaper, Target, Users } from "lucide-react";

/**
 * O ecossistema desenhado: um centro ligado a tudo o que a assinatura abre.
 *
 * A página inteira vinha AFIRMANDO que a Novare é um hub. Este bloco mostra:
 * um núcleo e cinco satélites ligados por linhas com pulso viajando. É a
 * mesma ideia do diagrama de produto do Cortex, trazida para a paleta da
 * casa (navy e ciano, sem violeta).
 *
 * MOBILE: o diagrama vira lista. Cinco cards orbitando num retângulo de
 * 360px viram um amontoado ilegível, e o argumento (tudo ligado ao centro)
 * já está no texto.
 *
 * O movimento é o argumento: o pulso saindo do centro para cada ponta é o
 * que diz "conectado" sem escrever a palavra. Some em prefers-reduced-motion.
 */

/** Posição de cada satélite, em % do quadro. Distribuídos na órbita. */
const NOS = [
  { icone: Target, nome: "Planejamento", x: 50, y: 6, tom: "accent" },
  { icone: Bot, nome: "Íris", x: 90, y: 32, tom: "ciano" },
  { icone: Users, nome: "Consultoria", x: 78, y: 82, tom: "ciano" },
  { icone: Calculator, nome: "Ferramentas", x: 22, y: 82, tom: "ciano" },
  { icone: Newspaper, nome: "News", x: 10, y: 32, tom: "ciano" },
] as const;

const CENTRO = { x: 50, y: 46 };

export function EcossistemaConectado() {
  return (
    <div className="relative">
      {/* ------------------------------------------- o diagrama (>= sm) */}
      <div
        className="relative mx-auto hidden aspect-[4/3] w-full max-w-2xl sm:block"
        role="img"
        aria-label="A assinatura liga o Planejamento, a Íris, a Consultoria, as Ferramentas e o News a um só centro."
      >
        {/* As linhas ficam atrás dos cards, num SVG que ocupa o quadro. */}
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
          aria-hidden
        >
          <defs>
            <linearGradient id="eco-linha" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="hsl(197 70% 45%)" stopOpacity="0.55" />
              <stop offset="100%" stopColor="hsl(197 70% 45%)" stopOpacity="0.12" />
            </linearGradient>
          </defs>

          {NOS.map((no, i) => (
            <g key={no.nome}>
              <line
                x1={CENTRO.x}
                y1={CENTRO.y}
                x2={no.x}
                y2={no.y}
                stroke="url(#eco-linha)"
                strokeWidth="0.4"
                vectorEffect="non-scaling-stroke"
              />
              {/* O pulso que viaja do centro para a ponta. `dur` diferente por
                  linha: sincronizados, os cinco viram um piscar só. */}
              <circle r="0.9" fill="hsl(197 75% 68%)" className="motion-reduce:hidden">
                <animateMotion
                  dur={`${2.6 + i * 0.45}s`}
                  repeatCount="indefinite"
                  path={`M${CENTRO.x},${CENTRO.y} L${no.x},${no.y}`}
                />
                <animate
                  attributeName="opacity"
                  values="0;1;1;0"
                  dur={`${2.6 + i * 0.45}s`}
                  repeatCount="indefinite"
                />
              </circle>
            </g>
          ))}
        </svg>

        {/* O núcleo. */}
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${CENTRO.x}%`, top: `${CENTRO.y}%` }}
        >
          <div className="relative flex h-24 w-24 items-center justify-center">
            <span
              aria-hidden
              className="absolute inset-0 rounded-full opacity-80 blur-xl"
              style={{
                background:
                  "radial-gradient(circle, hsl(197 80% 55% / 0.65), transparent 70%)",
              }}
            />
            {/* Dois anéis parados: giro constante aqui vira distração, e o
                argumento do bloco é conexão, não movimento perpétuo. */}
            <span className="absolute inset-2 rounded-full border border-ciano/30" />
            <span className="absolute inset-0 rounded-full border border-ciano/15" />
            <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/25 backdrop-blur-sm">
              <LineChart className="h-6 w-6 text-ciano-claro" strokeWidth={2} />
            </span>
          </div>
          <p className="mt-1 text-center font-display text-xs font-bold text-white">
            Workspace
          </p>
        </div>

        {/* Os satélites. */}
        {NOS.map((no) => {
          const Icone = no.icone;
          const laranja = no.tom === "accent";
          return (
            <div
              key={no.nome}
              className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-xl border border-white/12 bg-white/[0.06] px-3 py-2 backdrop-blur-sm"
              style={{ left: `${no.x}%`, top: `${no.y}%` }}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                  laranja ? "bg-accent/20 text-accent-claro" : "bg-ciano/20 text-ciano-claro"
                }`}
              >
                <Icone className="h-3.5 w-3.5" strokeWidth={2} />
              </span>
              <span className="whitespace-nowrap text-xs font-bold text-white">
                {no.nome}
              </span>
            </div>
          );
        })}
      </div>

      {/* ------------------------------------------------- a lista (mobile) */}
      <ul className="grid gap-2 sm:hidden">
        {NOS.map((no) => {
          const Icone = no.icone;
          const laranja = no.tom === "accent";
          return (
            <li
              key={no.nome}
              className="flex items-center gap-3 rounded-xl border border-white/12 bg-white/[0.06] px-3 py-2.5"
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  laranja ? "bg-accent/20 text-accent-claro" : "bg-ciano/20 text-ciano-claro"
                }`}
              >
                <Icone className="h-4 w-4" strokeWidth={2} />
              </span>
              <span className="text-sm font-bold text-white">{no.nome}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
