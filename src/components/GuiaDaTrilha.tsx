"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { HelpCircle, X } from "lucide-react";
import { ETAPAS } from "@/app/planejamento/app/etapas";

const CHAVE = "novare:guia-trilha-visto";
const EVENTO = "novare:abrir-guia";

/**
 * O botao que traz o guia de volta.
 *
 * Existe porque o guia aparece uma vez so: sem uma porta de volta, quem
 * fechou sem ler perdeu o mapa da casa para sempre. Fala com o modal por
 * evento de janela, e nao por prop, porque o layout da trilha e Server
 * Component — nao ha estado para os dois dividirem, e um contexto so para
 * isto seria peso sem retorno.
 */
export function BotaoVerGuia({ className = "" }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(EVENTO))}
      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground ${className}`}
    >
      <HelpCircle className="h-3.5 w-3.5" />
      Como funciona
    </button>
  );
}

/**
 * O mapa da casa, na primeira visita.
 *
 * A trilha tem seis telas e o nome de cada uma diz o QUE ela é, não QUANDO
 * usar — e as duas perguntas de quem chega são outras: "por onde começo" e
 * "com que frequência isso me pede alguma coisa". Sem isso a pessoa clica nas
 * seis procurando qual é a certa.
 *
 * Aparece UMA vez e some para sempre (localStorage). Modal que reaparece é
 * modal que se aprende a fechar sem ler, e aí ele deixou de existir mesmo
 * estando lá. Quem quiser rever tem o `BotaoVerGuia` ("Como funciona") no
 * rodapé da trilha.
 *
 * Fecha com Esc, clique fora e botão — as três saídas, porque um modal que
 * prende é pior que nenhum.
 *
 * POR QUE PORTAL, e não um `fixed` no lugar onde ele é escrito
 * Ele é montado dentro do `<header>` da trilha, e esse header tem
 * `backdrop-blur-md`. Qualquer `filter`/`backdrop-filter` cria BLOCO DE
 * CONTENÇÃO: dali para dentro, `position: fixed` deixa de valer contra a
 * janela e passa a valer contra o elemento filtrado. O modal ficava ancorado
 * numa barra de 110px de altura e derramava para fora da tela — não era
 * excesso de altura, era referência errada. O portal manda o nó para o
 * `<body>`, fora do alcance do filtro, e o `fixed` volta a significar
 * "a janela".
 */
export function GuiaDaTrilha({ forcarAberto = false }: { forcarAberto?: boolean }) {
  const [aberto, setAberto] = useState(false);
  const [montado, setMontado] = useState(false);

  // `document` não existe no servidor: o portal só pode nascer depois da
  // hidratação.
  useEffect(() => setMontado(true), []);

  useEffect(() => {
    if (forcarAberto) return setAberto(true);
    try {
      if (!localStorage.getItem(CHAVE)) setAberto(true);
    } catch {
      /* navegador sem storage: o guia simplesmente não aparece, e o app
         funciona igual. Não vale quebrar a tela por causa de um aviso. */
    }
  }, [forcarAberto]);

  // A porta de volta: `BotaoVerGuia` dispara, o guia reabre.
  useEffect(() => {
    const abrir = () => setAberto(true);
    window.addEventListener(EVENTO, abrir);
    return () => window.removeEventListener(EVENTO, abrir);
  }, []);

  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (e: KeyboardEvent) => e.key === "Escape" && fechar();
    document.addEventListener("keydown", aoTeclar);

    // Trava a rolagem do fundo enquanto o guia está aberto: sem isto o dedo
    // que tenta rolar a lista arrasta a página atrás dela.
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.body.style.overflow = antes;
    };
  }, [aberto]);

  function fechar() {
    setAberto(false);
    try {
      localStorage.setItem(CHAVE, "1");
    } catch {
      /* sem storage o guia volta na próxima visita — irritante, não quebrado */
    }
  }

  if (!aberto || !montado) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto overscroll-contain bg-primary/40 p-4 backdrop-blur-sm sm:items-center"
      onClick={fechar}
      role="dialog"
      aria-modal="true"
      aria-labelledby="guia-titulo"
    >
      {/* `dvh` e não `vh`: no celular a barra de endereço come altura, e `vh`
          mede a tela SEM ela — o rodapé do modal ficava embaixo do navegador.
          O `-2rem` desconta o `p-4` do pai, senão o total passa de uma tela. */}
      <div
        className="my-auto flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-elevated"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho fixo. O botão de fechar é a saída, e saída que rola para
            fora da tela junto com o conteúdo não é saída. */}
        <div className="flex items-start justify-between gap-4 border-b border-border/60 px-6 pb-4 pt-6 sm:px-8 sm:pt-7">
          <div>
            <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-accent-strong">
              Como funciona
            </p>
            <h2
              id="guia-titulo"
              className="mt-1.5 font-display text-xl font-semibold text-primary"
            >
              Seis telas, e você só usa duas por mês
            </h2>
          </div>
          <button
            type="button"
            onClick={fechar}
            aria-label="Fechar"
            className="-m-2 shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-slate-100 hover:text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Só o miolo rola. */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5 sm:px-8">
          <p className="text-sm leading-relaxed text-muted-foreground">
            As quatro primeiras você preenche uma vez. Depois disso, o app só
            pede uma coisa por mês — fechar o mês — e leva dois minutos.
          </p>

          <ol className="mt-5 space-y-3.5">
            {ETAPAS.map((e, i) => (
              <li key={e.slug} className="flex items-start gap-3">
                <Image
                  src={e.icone}
                  alt=""
                  width={36}
                  height={36}
                  className="mt-0.5 shrink-0 object-contain"
                />
                <div className="min-w-0">
                  <p className="font-display text-sm font-semibold text-primary">
                    {e.titulo}
                    <span className="ml-2 font-sans text-[11px] font-normal text-muted-foreground">
                      {i < 3
                        ? "uma vez"
                        : i === 3
                          ? "todo mês, 2 minutos"
                          : "quando quiser olhar"}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                    {e.resumo}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-6 rounded-2xl bg-gelo p-4">
            <p className="text-xs leading-relaxed text-muted-foreground">
              <b className="font-semibold text-primary">Comece por “Meus dados”.</b>{" "}
              Sem ele as outras telas ficam vazias — é dali que todo o resto se
              calcula.
            </p>
          </div>
        </div>

        {/* Rodapé fixo, pelo mesmo motivo do cabeçalho: a ação principal não
            pode depender de a pessoa descobrir que precisa rolar. */}
        <div className="border-t border-border/60 px-6 py-4 sm:px-8">
          <button
            type="button"
            onClick={fechar}
            className="w-full rounded-xl bg-accent-btn px-5 py-3 text-sm font-bold text-white shadow-[0_4px_14px_-6px_hsl(16_80%_45%_/_0.6)] transition-all hover:-translate-y-0.5"
          >
            Entendi, quero começar
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
