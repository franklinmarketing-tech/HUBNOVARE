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
      {/* Card claro, não bloco navy.
          Este era um retângulo escuro de 320px ocupando a primeira dobra da
          tela — o único elemento pesado de uma área que, em qualquer app de
          finanças bem resolvido, é toda clara. O navy continua na marca (no
          texto, no rodapé, na landing); aqui ele dava peso sem dar
          informação. A figura 3D entra no lugar do brilho laranja. */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-7 shadow-[0_1px_2px_hsl(215_40%_20%_/_0.03),0_10px_30px_-18px_hsl(215_40%_20%_/_0.22)] sm:p-9">
        <div className="sm:flex sm:items-center sm:gap-8">
          <div className="max-w-2xl">
            <p className="text-xs text-muted-foreground">
              Seu planejamento financeiro
            </p>
            <h1 className="mt-1.5 font-display text-3xl font-semibold leading-tight text-primary sm:text-4xl">
              {nome ? `Vamos começar, ${nome}?` : "Vamos começar?"}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
              São oito perguntas em português simples sobre quanto entra e
              quanto sai. A partir delas, as cinco telas seguintes se montam
              sozinhas — com os seus números, não com exemplos.
            </p>

            <Link
              href={primeira.href}
              className="group mt-7 inline-flex items-center gap-2 rounded-xl bg-accent-btn px-6 py-3.5 text-sm font-bold text-white shadow-[0_4px_14px_-6px_hsl(16_80%_45%_/_0.6)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-6px_hsl(16_80%_45%_/_0.7)]"
            >
              {primeira.acao}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>

            <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-2xs text-muted-foreground">
              <li className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-ciano-forte" strokeWidth={2} />
                Leva 10 minutos
              </li>
              <li className="flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-ciano-forte" strokeWidth={2} />
                Sem conectar seu banco
              </li>
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-ciano-forte" strokeWidth={2} />
                Nada é vendido aqui
              </li>
            </ul>
          </div>

          {/* A figura que o bloco escuro não tinha. */}
          <span className="relative mt-8 hidden h-40 w-40 shrink-0 items-center justify-center sm:mt-0 sm:flex">
            <span
              aria-hidden
              className="absolute inset-0 rounded-full blur-2xl"
              style={{
                background:
                  "radial-gradient(circle, hsl(197 80% 55% / 0.3), transparent 70%)",
              }}
            />
            <Image
              src={primeira.icone}
              alt=""
              width={160}
              height={160}
              priority
              className="relative object-contain"
            />
          </span>
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
