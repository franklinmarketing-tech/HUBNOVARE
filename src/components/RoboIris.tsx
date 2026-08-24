"use client";

import { useEffect, useRef, useState } from "react";
import { Bot } from "lucide-react";

/**
 * A Íris se apresentando e dizendo o que fazer.
 *
 * Uma IA sem rosto é uma caixa de texto. Aqui ela fala em primeira pessoa,
 * digitando, e conduz a pessoa pelo passo seguinte — porque a dúvida real
 * de quem chega não é "o que é a Íris", é "e agora, o que eu faço?".
 *
 * As falas mudam conforme o estado da tela: enquanto não há extrato, ela
 * ensina; quando o extrato entra, ela reage ao que viu.
 */

const APRESENTACAO = [
  "Oi! Eu sou a Íris, a inteligência financeira da Novare.",
  "Meu trabalho é achar o dinheiro que some do seu bolso sem você perceber.",
  "Me mostre seu extrato: arraste o arquivo do banco aqui embaixo, ou cole a lista de lançamentos.",
  "Serve CSV ou OFX — é o que todo banco exporta. Se o seu extrato for PDF, copie o texto e cole.",
  "Não guardo nada e não conecto conta nenhuma. A leitura acontece aí no seu navegador.",
];

const VELOCIDADE_MS = 26;
const PAUSA_MS = 2600;

export function RoboIris({
  lancamentos = 0,
  analisando = false,
}: {
  /** Quantos lançamentos a tela já reconheceu. */
  lancamentos?: number;
  analisando?: boolean;
}) {
  const [indice, setIndice] = useState(0);
  const [escrito, setEscrito] = useState("");
  const timers = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  // A fala do momento. Reagir ao estado é o que faz parecer que ela está
  // olhando junto, em vez de recitar um texto pronto.
  const falas =
    analisando
      ? ["Deixa comigo. Estou lendo lançamento por lançamento..."]
      : lancamentos > 0
        ? [
            `Peguei ${lancamentos} lançamentos. Já somei tudo aqui embaixo.`,
            "Agora é comigo: clique em pedir a leitura e eu te digo o que está pesando.",
          ]
        : APRESENTACAO;

  useEffect(() => {
    for (const t of timers.current) clearTimeout(t);
    timers.current = [];
    setIndice(0);
    setEscrito("");
  }, [lancamentos > 0, analisando]);

  useEffect(() => {
    for (const t of timers.current) clearTimeout(t);
    timers.current = [];

    const fala = falas[indice] ?? falas[0];
    setEscrito("");

    for (let i = 1; i <= fala.length; i++) {
      timers.current.push(
        setTimeout(() => setEscrito(fala.slice(0, i)), i * VELOCIDADE_MS),
      );
    }

    if (falas.length > 1) {
      timers.current.push(
        setTimeout(
          () => setIndice((n) => (n + 1) % falas.length),
          fala.length * VELOCIDADE_MS + PAUSA_MS,
        ),
      );
    }

    return () => {
      for (const t of timers.current) clearTimeout(t);
    };
    // `falas` é derivado — recriar a cada render faria a digitação reiniciar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indice, lancamentos > 0, analisando]);

  const fala = falas[indice] ?? falas[0];
  const digitando = escrito.length < fala.length;

  return (
    <div className="palco-iris relative overflow-hidden rounded-3xl p-6 sm:p-7">
      <div className="relative flex items-start gap-4">
        {/* O rosto dela: anel que pulsa como quem está ouvindo. */}
        <span className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[hsl(188_70%_50%_/_0.18)] ring-1 ring-inset ring-[hsl(188_80%_60%_/_0.35)]">
          <span className="absolute inset-0 animate-ping rounded-2xl bg-[hsl(188_70%_50%_/_0.12)] [animation-duration:2.8s]" />
          <Bot
            className="relative h-7 w-7 text-[hsl(188_95%_78%)]"
            strokeWidth={1.75}
          />
          <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/60" />
            <span className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-[hsl(215_55%_11%)] bg-success" />
          </span>
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-display text-base font-bold text-white">
              Íris
            </span>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[hsl(188_95%_78%)]">
              IA da Novare
            </span>
            <span className="text-[11px] text-white/60">online agora</span>
          </div>

          {/* Altura reservada: sem isso o bloco pula a cada troca de frase. */}
          <p className="mt-2 min-h-[3.25rem] text-[15px] leading-relaxed text-white/85 sm:min-h-[2.5rem]">
            {escrito}
            {digitando && (
              <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-pulse bg-[hsl(188_95%_78%)] align-middle" />
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
