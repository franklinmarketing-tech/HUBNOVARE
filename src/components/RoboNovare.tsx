"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";

type Dica = {
  texto: string;
  ferramenta?: { nome: string; href: string };
};

/** Enquanto as dicas de verdade não chegam, o robô já tem o que dizer. */
const INICIAL: Dica = {
  texto: "Lendo os indicadores do Banco Central...",
};

const VELOCIDADE_MS = 22;
const PAUSA_LENDO_MS = 6500;

/**
 * O Robô Novare: uma faixa viva que lê os indicadores do dia e traduz o que
 * eles significam para o bolso de quem está olhando.
 *
 * O texto é digitado letra a letra de propósito — movimento chama o olho
 * para a única parte da home que muda todo dia, e deixa claro que ali tem
 * alguém acompanhando o mercado, não um aviso parado.
 */
export function RoboNovare() {
  const [dicas, setDicas] = useState<Dica[]>([INICIAL]);
  const [indice, setIndice] = useState(0);
  const [escrito, setEscrito] = useState("");
  const [aoVivo, setAoVivo] = useState(false);
  const timers = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  useEffect(() => {
    let vivo = true;
    fetch("/api/dicas")
      .then((r) => r.json())
      .then((d) => {
        if (!vivo || !Array.isArray(d?.dicas) || d.dicas.length === 0) return;
        setDicas(d.dicas);
        setIndice(0);
        setEscrito("");
        setAoVivo(true);
      })
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, []);

  // Digita a dica atual e agenda a próxima. Guardar os timers é o que
  // impede duas digitações concorrentes quando as dicas chegam no meio.
  useEffect(() => {
    for (const t of timers.current) clearTimeout(t);
    timers.current = [];

    const dica = dicas[indice] ?? INICIAL;
    setEscrito("");

    for (let i = 1; i <= dica.texto.length; i++) {
      timers.current.push(
        setTimeout(() => setEscrito(dica.texto.slice(0, i)), i * VELOCIDADE_MS),
      );
    }

    if (dicas.length > 1) {
      timers.current.push(
        setTimeout(
          () => setIndice((n) => (n + 1) % dicas.length),
          dica.texto.length * VELOCIDADE_MS + PAUSA_LENDO_MS,
        ),
      );
    }

    return () => {
      for (const t of timers.current) clearTimeout(t);
    };
  }, [dicas, indice]);

  const dica = dicas[indice] ?? INICIAL;
  const digitando = escrito.length < dica.texto.length;

  const classe =
    "group mt-3 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 transition-colors hover:border-primary/25";

  // Só vira link quando há ferramenta para abrir; um <a> sem destino é
  // armadilha para quem navega por teclado ou leitor de tela.
  const conteudo = (
    <>
      <span className="robo-novare-face relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-[22px] leading-none">
        {/* Emoji no lugar do vetor: o robô é o personagem da casa e
            precisa de rosto, não de ícone de interface. */}
        <span className="relative animate-[robo-flutua_3.2s_ease-in-out_infinite] motion-reduce:animate-none">
          🤖
        </span>
        {/* O ponto verde só acende quando os dados reais chegaram. */}
        {aoVivo && (
          <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full border-2 border-white bg-success" />
          </span>
        )}
      </span>

      <span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
          Robô IA Novare
        </span>
        {aoVivo && (
          <span className="rounded-full bg-success/12 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-success-strong">
            Ao vivo
          </span>
        )}
        {/* No celular a frase cabia em 83px de 831px — sobrava "Com a Sel...".
            Duas linhas no estreito, uma linha só a partir de sm. */}
        <span className="min-w-0 flex-1 basis-full text-sm leading-snug text-slate-600 sm:basis-auto sm:truncate">
          {escrito}
          {digitando && (
            <span className="ml-0.5 inline-block h-3.5 w-[2px] translate-y-0.5 animate-pulse bg-accent align-middle" />
          )}
        </span>
      </span>

      {dica.ferramenta && (
        <span className="hidden shrink-0 items-center gap-1.5 text-[11px] font-semibold text-slate-500 transition-colors group-hover:text-primary sm:flex">
          {dica.ferramenta.nome}
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      )}
    </>
  );

  return dica.ferramenta ? (
    <Link href={dica.ferramenta.href} className={classe}>
      {conteudo}
    </Link>
  ) : (
    <div className={classe}>{conteudo}</div>
  );
}
