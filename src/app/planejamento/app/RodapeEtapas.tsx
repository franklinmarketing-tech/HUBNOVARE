"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ETAPAS, etapaAnterior, proximaEtapa } from "./etapas";

/**
 * O próximo passo, no fim de cada tela.
 *
 * A trilha do topo diz onde a pessoa está; ela não diz o que fazer AGORA.
 * Quem termina de preencher os dados chegava ao fim da página e não tinha
 * para onde ir sem voltar os olhos até a barra lá em cima — e no celular
 * ela nem está mais na tela. Este bloco fecha a etapa com o convite
 * seguinte, escrito como ação ("Ver meu diagnóstico"), não como rótulo de
 * menu.
 *
 * Aparece sozinho em todas as telas da trilha, porque vive no layout: nenhuma
 * página precisa lembrar de chamá-lo. Some fora da trilha e na última etapa,
 * onde não há próximo passo para oferecer.
 */
export function RodapeEtapas() {
  const caminho = usePathname();

  const atual = ETAPAS.find(
    (e) => caminho === e.href || caminho.startsWith(`${e.href}/`),
  );
  if (!atual) return null;

  const anterior = etapaAnterior(atual.slug);
  const proxima = proximaEtapa(atual.slug);
  if (!anterior && !proxima) return null;

  return (
    <nav
      aria-label="Navegar entre as etapas"
      className="nao-imprimir mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-6"
    >
      {anterior ? (
        <Link
          href={anterior.href}
          className="group inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          {anterior.titulo}
        </Link>
      ) : (
        // O espaço vazio segura o botão da direita no canto: sem ele, a
        // primeira etapa jogava o "próximo" para a esquerda e o rodapé
        // parecia outro componente.
        <span />
      )}

      {proxima && (
        <Link
          href={proxima.href}
          className="group flex min-w-0 items-center gap-3 rounded-2xl bg-primary py-2.5 pl-3 pr-5 text-white shadow-card transition-all hover:-translate-y-0.5 hover:bg-primary-soft hover:shadow-card-hover"
        >
          <Image
            src={proxima.icone}
            alt=""
            width={36}
            height={36}
            className="shrink-0 object-contain transition-transform duration-300 group-hover:scale-110"
          />
          <span className="min-w-0">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-white/55">
              Próximo passo
            </span>
            <span className="block truncate text-sm font-bold">
              {proxima.acao}
            </span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </nav>
  );
}
