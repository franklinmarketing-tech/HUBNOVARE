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
 *
 * POR QUE ELE PARECIA SEM VIDA, e o que resolveu
 *
 * Seis pílulas do mesmo tamanho, do mesmo peso, uma do lado da outra, e nada
 * acontecendo em nenhuma. O olho não tinha onde pousar. Três correções, todas
 * de hierarquia — nenhuma de enfeite:
 *
 * - **O emblema da etapa atual é MAIOR e flutua.** É o único item da barra que
 *   se mexe sozinho. Menu em que tudo se mexe não é menu, é distração; menu em
 *   que uma coisa só se mexe é menu que responde "você está aqui".
 * - **Três estados legíveis, e não dois.** Percorrida (tique verde, cor
 *   cheia), atual (pílula navy, emblema grande) e a fazer (emblema apagado,
 *   sem cor). Antes, "percorrida" e "a fazer" eram quase o mesmo cinza.
 * - **O número da etapa aparece.** "3 de 6" embaixo do rótulo custa uma linha
 *   de 10px e responde de graça a pergunta que a barra sozinha só aproxima.
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
      {/* A sombra da direita: no celular cabem duas etapas das seis, e a barra
          rola de lado — mas sem nenhum sinal disso a pessoa ve "Meus dados,
          Diagnostico" e conclui que o app tem duas telas. O degrade cortado na
          borda e a convencao que diz "tem mais aqui" sem ocupar espaco.
          Some em telas onde tudo cabe. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-white to-transparent lg:hidden"
      />
      <ol className="mx-auto flex max-w-5xl items-stretch gap-0.5 overflow-x-auto px-4 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {ETAPAS.map((etapa, i) => {
          const atual = i === indiceAtual;
          const percorrida = naTrilha && i < indiceAtual;

          return (
            <li
              key={etapa.slug}
              ref={atual ? atualRef : undefined}
              className="shrink-0 scroll-mx-4"
            >
              <Link
                href={etapa.href}
                aria-current={atual ? "step" : undefined}
                title={etapa.resumo}
                className={`group flex h-full items-center gap-2.5 rounded-2xl py-2 pl-2 pr-3.5 transition-all duration-200 ${
                  atual
                    ? "bg-primary text-white shadow-[0_8px_20px_-10px_hsl(215_50%_23%_/_0.7)]"
                    : "text-muted-foreground hover:bg-white hover:text-foreground hover:shadow-card"
                }`}
              >
                <span
                  className={`relative flex shrink-0 items-center justify-center transition-all duration-300 ${
                    // A etapa atual traz o emblema maior. É o degrau de
                    // hierarquia mais barato que existe: sem cor nova, sem
                    // peso de fonte, sem espaço a mais na barra.
                    //
                    // E traz uma pastilha CLARA embaixo: os emblemas são
                    // navy, a pílula da etapa atual também — sem a pastilha o
                    // emblema da etapa em que a pessoa está é justamente o
                    // único que some no fundo.
                    atual ? "h-9 w-9 rounded-xl bg-white p-0.5 shadow-sm" : "h-7 w-7"
                  }`}
                >
                  <Image
                    src={etapa.icone}
                    alt=""
                    width={40}
                    height={40}
                    className={`h-full w-full object-contain transition-transform duration-300 group-hover:scale-110 ${
                      atual ? "etapa-atual-icone" : ""
                    } ${
                      // Etapa que ainda não foi visitada entra apagada: a cor
                      // cheia fica reservada para onde a pessoa está e por
                      // onde já passou, senão os seis emblemas gritam juntos
                      // e nenhum se destaca.
                      // Só opacidade, sem `grayscale`: os emblemas já são
                      // quase monocromáticos em navy, e dessaturá-los não os
                      // apagava — deixava borrões cinzas com cara de imagem
                      // quebrada.
                      atual || percorrida ? "" : "opacity-45"
                    }`}
                  />
                  {percorrida && (
                    <span
                      aria-hidden
                      className="etapa-tique absolute -bottom-0.5 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-success text-white ring-2 ring-white"
                    >
                      <Check className="h-2 w-2" strokeWidth={4} />
                    </span>
                  )}
                </span>

                <span className="min-w-0 text-left leading-tight">
                  <span
                    className={`block whitespace-nowrap text-xs ${
                      atual ? "font-semibold" : "font-medium"
                    }`}
                  >
                    {etapa.titulo}
                  </span>
                  {/* "3 de 6" custa uma linha de 10px e responde de graça o
                      que a barra de progresso só aproxima.

                      A cor NÃO leva opacidade extra fora da pílula: medido,
                      `text-muted-foreground/70` sobre a barra dá 2,96:1 e
                      reprova AA. A cor cheia dá 5,49:1, e o degrau para o
                      rótulo já vem do tamanho e do peso. Dentro da pílula,
                      `white/60` sobre o navy dá 5,48:1 e passa. */}
                  <span
                    className={`block text-[10px] tabular-nums ${
                      atual ? "text-white/60" : "text-muted-foreground"
                    }`}
                  >
                    {i + 1} de {ETAPAS.length}
                  </span>
                </span>
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
