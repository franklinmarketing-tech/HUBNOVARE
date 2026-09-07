"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { ETAPAS } from "@/app/planejamento/app/etapas";

const CHAVE = "novare:guia-trilha-visto";

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
 * estando lá. Quem quiser rever tem o botão "Como funciona" no rodapé da
 * trilha.
 *
 * Fecha com Esc, clique fora e botão — as três saídas, porque um modal que
 * prende é pior que nenhum.
 */
export function GuiaDaTrilha({ forcarAberto = false }: { forcarAberto?: boolean }) {
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    if (forcarAberto) return setAberto(true);
    try {
      if (!localStorage.getItem(CHAVE)) setAberto(true);
    } catch {
      /* navegador sem storage: o guia simplesmente não aparece, e o app
         funciona igual. Não vale quebrar a tela por causa de um aviso. */
    }
  }, [forcarAberto]);

  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (e: KeyboardEvent) => e.key === "Escape" && fechar();
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [aberto]);

  function fechar() {
    setAberto(false);
    try {
      localStorage.setItem(CHAVE, "1");
    } catch {
      /* sem storage o guia volta na próxima visita — irritante, não quebrado */
    }
  }

  if (!aberto) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-primary/40 p-4 backdrop-blur-sm sm:items-center"
      onClick={fechar}
      role="dialog"
      aria-modal="true"
      aria-labelledby="guia-titulo"
    >
      <div
        className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-elevated sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
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

        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          As quatro primeiras você preenche uma vez. Depois disso, o app só
          pede uma coisa por mês — fechar o mês — e leva dois minutos.
        </p>

        <ol className="mt-6 space-y-3.5">
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

        <div className="mt-7 rounded-2xl bg-gelo p-4">
          <p className="text-xs leading-relaxed text-muted-foreground">
            <b className="font-semibold text-primary">Comece por “Meus dados”.</b>{" "}
            Sem ele as outras telas ficam vazias — é dali que todo o resto se
            calcula.
          </p>
        </div>

        <button
          type="button"
          onClick={fechar}
          className="mt-6 w-full rounded-xl bg-accent-btn px-5 py-3 text-sm font-bold text-white shadow-[0_4px_14px_-6px_hsl(16_80%_45%_/_0.6)] transition-all hover:-translate-y-0.5"
        >
          Entendi, quero começar
        </button>
      </div>
    </div>
  );
}
