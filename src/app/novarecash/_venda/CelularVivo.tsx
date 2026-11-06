"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { ConteudoInicio, MolduraCelular, TopoApp } from "./TelasExemplo";

/**
 * O CELULAR VIVO DO HERÓI (06/11/2026, pedido do dono: "efeitos que chamem a atenção").
 *
 * O celular alterna sozinho entre a tela Início e uma conversa com um AGENTE DE IA, em
 * que a pergunta aparece, o agente "digita" e a resposta sai letra a letra. Ilustração
 * com dados de EXEMPLO (a legenda do palco diz isso).
 *
 * LEVE: um `setTimeout` por passo, nada de biblioteca. O servidor e o primeiro desenho
 * mostram a tela Início parada (sem salto de layout). Quem pediu menos movimento
 * (`prefers-reduced-motion`) fica na tela Início, sem troca nem digitação.
 */

const CONVERSAS = [
  {
    agente: "Agente de Gastos",
    pergunta: "Posso gastar R$ 300 no sábado?",
    resposta: "Pode. Depois do passeio ainda sobram R$ 920 no mês. Só segure Restaurantes: já passou R$ 60 do combinado.",
  },
  {
    agente: "Agente de Assinaturas",
    pergunta: "Quanto pago de assinaturas?",
    resposta: "São 6, somando R$ 187,40 por mês (R$ 2.248 por ano). O streaming subiu R$ 5 em outubro.",
  },
  {
    agente: "Agente de Metas",
    pergunta: "Chego na viagem de julho?",
    resposta: "Chega, guardando R$ 310 por mês. Você já tem R$ 3.150 dos R$ 5.000: 63% da meta.",
  },
];

type Fase = "inicio" | "pergunta" | "digitando" | "resposta";

export function CelularVivo() {
  const [fase, setFase] = useState<Fase>("inicio");
  const [indice, setIndice] = useState(0);
  const [letras, setLetras] = useState(0);
  const conversa = CONVERSAS[indice];

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let t: ReturnType<typeof setTimeout>;
    if (fase === "inicio") t = setTimeout(() => setFase("pergunta"), 4200);
    else if (fase === "pergunta") t = setTimeout(() => setFase("digitando"), 900);
    else if (fase === "digitando") t = setTimeout(() => (setLetras(0), setFase("resposta")), 1300);
    else if (letras < conversa.resposta.length) t = setTimeout(() => setLetras((n) => n + 2), 28);
    else
      t = setTimeout(() => {
        setIndice((i) => (i + 1) % CONVERSAS.length);
        setFase("inicio");
      }, 3600);
    return () => clearTimeout(t);
  }, [fase, letras, conversa.resposta.length]);

  const naConversa = fase !== "inicio";

  return (
    <MolduraCelular aba={naConversa ? "ia" : "inicio"}>
      <div className={`ncv-tela absolute inset-0 flex flex-col ${naConversa ? "ncv-tela-sai" : ""}`} aria-hidden={naConversa}>
        <ConteudoInicio />
      </div>
      <div className={`ncv-tela absolute inset-0 flex flex-col ${naConversa ? "" : "ncv-tela-sai"}`} aria-hidden={!naConversa}>
        <div className="mt-4">
          <TopoApp titulo="Agentes" />
        </div>
        <p className="mt-3 flex w-fit items-center gap-1.5 rounded-full bg-ouro/12 px-2.5 py-1 text-[10px] font-semibold text-ouro ring-1 ring-ouro/25">
          <Sparkles className="h-3 w-3" />
          {conversa.agente}
        </p>
        <div className="mt-3 space-y-2.5 text-[11.5px] leading-snug">
          {fase !== "inicio" && (
            <p className="ncv-bolha ml-auto max-w-[86%] rounded-2xl rounded-br-md bg-white/10 px-3 py-2 text-white">{conversa.pergunta}</p>
          )}
          {fase === "digitando" && (
            <p className="ncv-bolha flex w-fit gap-1 rounded-2xl rounded-bl-md bg-ouro/12 px-3 py-2.5 ring-1 ring-ouro/25">
              <span className="ncv-ponto" />
              <span className="ncv-ponto [animation-delay:150ms]" />
              <span className="ncv-ponto [animation-delay:300ms]" />
            </p>
          )}
          {fase === "resposta" && (
            <p className="ncv-bolha max-w-[92%] rounded-2xl rounded-bl-md bg-ouro/12 px-3 py-2 text-white/90 ring-1 ring-ouro/25">
              {conversa.resposta.slice(0, letras)}
              {letras < conversa.resposta.length && <span className="ncv-cursor" />}
            </p>
          )}
        </div>
        <div className="flex-1" />
        <p className="mb-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[10.5px] text-white/45">Pergunte ao agente…</p>
      </div>
    </MolduraCelular>
  );
}
