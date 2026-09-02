"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock, Lock, ShieldCheck } from "lucide-react";
import { ETAPAS } from "./etapas";

/**
 * A primeira tela de quem acabou de entrar e ainda não preencheu nada.
 *
 * Antes era uma caixa branca com um título e um botão. Funcionava como aviso
 * e falhava como primeira impressão: a pessoa não fazia ideia do que ia
 * ganhar depois de responder, então o formulário parecia um pedágio.
 *
 * Aqui ela vê a trilha inteira antes de começar — os seis emblemas, o que
 * cada etapa entrega e onde isso termina. É a mesma ideia do painel vazio na
 * home do Workspace: mostrar a forma do resultado é o que faz alguém topar
 * gastar dez minutos.
 *
 * As três objeções que sempre aparecem no suporte — "quanto tempo leva",
 * "precisa do meu banco", "vão me vender alguma coisa" — estão respondidas em
 * uma linha cada, logo abaixo do botão, porque é ali que elas travam o clique.
 */
export function BoasVindas({ nome }: { nome?: string }) {
  const primeira = ETAPAS[0];

  return (
    <div className="surgir">
      <section
        className="relative overflow-hidden rounded-3xl p-7 text-white sm:p-9"
        style={{
          background:
            "linear-gradient(155deg, hsl(215 50% 23%) 0%, hsl(215 55% 15%) 100%)",
        }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(22rem 14rem at 88% -12%, hsl(16 88% 60% / 0.35), transparent 65%)",
          }}
        />

        <div className="relative max-w-2xl">
          <p className="text-2xs font-semibold uppercase tracking-wider text-white/60">
            Seu planejamento financeiro
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold leading-tight sm:text-4xl">
            {nome ? `Vamos começar, ${nome}?` : "Vamos começar?"}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-white/80 sm:text-base">
            São oito perguntas em português simples sobre quanto entra e quanto
            sai. A partir delas, as cinco telas seguintes se montam sozinhas —
            com os seus números, não com exemplos.
          </p>

          <Link
            href={primeira.href}
            className="group mt-7 inline-flex items-center gap-2 rounded-xl bg-accent-btn px-6 py-3.5 text-sm font-bold text-white shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
          >
            {primeira.acao}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>

          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-2xs text-white/65">
            <li className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-ciano-claro" strokeWidth={2} />
              Leva 10 minutos
            </li>
            <li className="flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-ciano-claro" strokeWidth={2} />
              Sem conectar seu banco
            </li>
            <li className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-ciano-claro" strokeWidth={2} />
              Nada é vendido aqui
            </li>
          </ul>
        </div>
      </section>

      <p className="mt-8 text-2xs font-semibold uppercase tracking-wider text-accent-strong">
        O caminho completo
      </p>

      <ol className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ETAPAS.map((etapa, i) => {
          const primeiraEtapa = i === 0;
          return (
            <li key={etapa.slug}>
              <Link
                href={etapa.href}
                className={`group flex h-full items-start gap-3 rounded-2xl border bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-card ${
                  // Só a etapa 1 fica acesa: as outras dependem dela, e um
                  // cartão em destaque por vez diz para onde ir sem precisar
                  // de instrução escrita.
                  primeiraEtapa
                    ? "border-accent/40 shadow-card ring-1 ring-accent/20"
                    : "border-border"
                }`}
              >
                <Image
                  src={etapa.icone}
                  alt=""
                  width={40}
                  height={40}
                  className={`shrink-0 object-contain transition-transform duration-300 group-hover:scale-110 ${
                    primeiraEtapa ? "" : "opacity-70 saturate-[0.6]"
                  }`}
                />
                <span className="min-w-0">
                  <span className="flex items-baseline gap-2">
                    <span className="text-[10px] font-bold tabular-nums text-muted-foreground">
                      {String(etapa.numero).padStart(2, "0")}
                    </span>
                    <span className="font-display text-sm font-bold text-primary">
                      {etapa.titulo}
                    </span>
                  </span>
                  <span className="mt-1 block text-xs leading-snug text-muted-foreground">
                    {etapa.resumo}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
