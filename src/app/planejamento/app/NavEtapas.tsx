"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { Check } from "lucide-react";
import { ETAPAS } from "./etapas";

/**
 * A trilha das seis etapas.
 *
 * Fica no topo em vez de numa sidebar porque é uma SEQUÊNCIA, não um menu: a
 * pessoa precisa ver onde está e quanto falta, e isso lê melhor na horizontal.
 *
 * O que mudou em relação à primeira versão, e por quê:
 *
 * - **Emblema no lugar do número.** Seis bolinhas cinzas numeradas obrigam a
 *   ler o rótulo para saber o que é cada etapa. O emblema 3D é reconhecido
 *   antes da leitura — prancheta é preencher, velocímetro é diagnóstico, mapa
 *   é plano —, e é a mesma linguagem visual do resto do app.
 * - **Barra de progresso.** "Etapa 3 de 6" respondia só depois de contar os
 *   itens. A barra responde de relance, que é a pergunta real de quem está no
 *   meio de um formulário: quanto falta.
 * - **As já percorridas ganham um tique.** Não é promessa de "concluído" — a
 *   pessoa navega livre —, é a marca de por onde ela passou, que é o que
 *   sustenta a sensação de avanço.
 * - **A etapa atual se centraliza sozinha no celular.** A barra rola de lado;
 *   sem isso, quem estava na etapa 5 abria a tela vendo a 1 e achava que tinha
 *   voltado ao começo.
 */
export function NavEtapas() {
  const caminho = usePathname();
  const atualRef = useRef<HTMLLIElement>(null);

  const indiceAtual = ETAPAS.findIndex(
    (e) => caminho === e.href || caminho.startsWith(`${e.href}/`),
  );
  // Fora da trilha (a home do app, por exemplo): nada fica aceso, e a barra
  // de progresso some em vez de mentir uma posição.
  const naTrilha = indiceAtual >= 0;
  const progresso = naTrilha ? ((indiceAtual + 1) / ETAPAS.length) * 100 : 0;

  useEffect(() => {
    atualRef.current?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [caminho]);

  return (
    <nav
      aria-label="Etapas do seu planejamento"
      className="relative border-b border-border/70 bg-white/70 backdrop-blur-md"
    >
      <ol className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-5 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {ETAPAS.map((etapa, i) => {
          const atual = i === indiceAtual;
          const percorrida = naTrilha && i < indiceAtual;

          return (
            <li
              key={etapa.slug}
              ref={atual ? atualRef : undefined}
              className="shrink-0 scroll-mx-5"
            >
              <Link
                href={etapa.href}
                aria-current={atual ? "step" : undefined}
                title={etapa.resumo}
                className={`group flex items-center gap-2 rounded-xl py-1.5 pl-1.5 pr-3 text-2xs font-semibold transition-all ${
                  atual
                    ? "bg-primary text-white shadow-card"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <span className="relative flex h-7 w-7 shrink-0 items-center justify-center">
                  <Image
                    src={etapa.icone}
                    alt=""
                    width={28}
                    height={28}
                    className={`object-contain transition-transform duration-300 group-hover:scale-110 ${
                      // Etapa que ainda não foi visitada entra dessaturada: a
                      // cor cheia fica reservada para onde a pessoa está e
                      // por onde já passou, senão os seis emblemas gritam
                      // juntos e nenhum se destaca.
                      atual || percorrida ? "" : "opacity-55 saturate-50"
                    }`}
                  />
                  {percorrida && (
                    <span
                      aria-hidden
                      className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-success text-white ring-2 ring-white"
                    >
                      <Check className="h-2 w-2" strokeWidth={4} />
                    </span>
                  )}
                </span>
                {etapa.titulo}
              </Link>
            </li>
          );
        })}
      </ol>

      {/* A barra vive na borda de baixo da nav: é a própria linha divisória
          que se preenche, então não custa altura numa tela de celular. */}
      <span
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-gradient-to-r from-ciano to-accent transition-transform duration-700 ease-out"
        style={{ transform: `scaleX(${progresso / 100})` }}
      />
      {naTrilha && (
        <span className="sr-only">
          Etapa {indiceAtual + 1} de {ETAPAS.length}
        </span>
      )}
    </nav>
  );
}
