"use client";

import dynamic from "next/dynamic";

import type { Tema } from "./tema";

/**
 * A BUSCA (Ctrl K), O TOUR E AS BOAS-VINDAS fora do pacote de cada tela (15/11/2026, velocidade):
 * carregam num pedaço à parte, logo depois de a tela aparecer. Só escutam os sinais de
 * `eventos.ts` — quem dispara (menu, avatar, "?") não depende deles.
 */
const Paleta = dynamic(() => import("./Paleta").then((m) => m.Paleta), { ssr: false });
const TourNovareCash = dynamic(() => import("./TourNovareCash").then((m) => m.TourNovareCash), { ssr: false });
const BoasVindas = dynamic(() => import("./BoasVindas").then((m) => m.BoasVindas), { ssr: false });

export function ExtrasCasca({ tema }: { tema: Tema }) {
  return (
    <>
      <Paleta tema={tema} />
      {/* Depois da barra do polegar no DOM: a janela pinta por cima dela. */}
      <BoasVindas />
      <TourNovareCash />
    </>
  );
}
