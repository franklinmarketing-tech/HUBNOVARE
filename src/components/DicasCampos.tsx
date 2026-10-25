"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { MANUAIS } from "@/lib/manuais";
import { acharCampos } from "@/lib/manuais/achar";

/**
 * O "?" QUE FUNCIONA NO TOQUE, ao lado de cada termo que o manual explica (25/10/2026).
 * Antes a explicação de SAC, IPCA, Previsto, OFX… estava só no manual ou num `title` de passar o
 * mouse — que não existe no celular.
 *
 * ⚠️ É DESENHADO POR CIMA (portal, posição absoluta na página), não enfiado no rótulo: mexer em
 * nó do React quebra a próxima renderização. A posição é refeita quando a tela muda de tamanho
 * ou de conteúdo. Só em rótulos e títulos — botão já diz o que faz.
 */
const SO_EM = new Set(["LABEL", "LEGEND", "DT", "TH", "H3", "H4", "P", "SPAN"]);

type Ponto = { id: number; x: number; y: number; nome: string; explica: string };

/** Dentro de caixa que rola de lado (tabela larga no celular), o "?" se descolaria do termo
 *  ao arrastar — e o da coluna escondida empurrava a PÁGINA para o lado (Projeção, 25/10). */
function dentroDeRolagemLateral(el: Element) {
  for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
    const ox = getComputedStyle(a).overflowX;
    if ((ox === "auto" || ox === "scroll") && a.scrollWidth > a.clientWidth) return true;
  }
  return false;
}

export function DicasCampos({ modo }: { modo: "ferramenta" | "fincash" }) {
  const rota = usePathname();
  const chave = modo === "ferramenta" ? rota.split("/")[2] ?? "" : rota.replace(/\/$/, "");
  const manual = MANUAIS[chave];
  const [pontos, setPontos] = useState<Ponto[]>([]);
  const [aberta, setAberta] = useState<Ponto | null>(null);
  const [montado, setMontado] = useState(false);
  const espera = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const medir = useCallback(() => {
    if (!manual) return setPontos([]);
    const achados = acharCampos(manual, 12).filter((a) => SO_EM.has(a.el.tagName) && !dentroDeRolagemLateral(a.el));
    const largura = document.documentElement.clientWidth;
    setPontos(
      achados
        .map((a, id) => {
          // logo depois do TEXTO do rótulo, não no fim da caixa (rótulo de bloco ocupa a linha toda).
          // Mede só os nós de TEXTO: num rótulo com caixinha de marcar, medir o conteúdo todo punha
          // o "?" logo depois da caixinha, em cima da primeira palavra (Rescisão, 25/10).
          const textos: Text[] = [];
          const andar = document.createTreeWalker(a.el, NodeFilter.SHOW_TEXT);
          for (let n = andar.nextNode(); n; n = andar.nextNode()) if (n.textContent?.trim()) textos.push(n as Text);
          const faixa = document.createRange();
          if (textos.length) {
            faixa.setStart(textos[0], 0);
            const ultimo = textos[textos.length - 1];
            faixa.setEnd(ultimo, ultimo.length);
          } else faixa.selectNodeContents(a.el);
          const linhas = faixa.getClientRects();
          // primeira linha do texto (rótulo de uma linha só = a linha toda); se quebrar, a última
          const t = linhas[linhas.length - 1] ?? a.el.getBoundingClientRect();
          return { id, x: t.right + window.scrollX + 6, y: t.top + window.scrollY + t.height / 2, nome: a.nome, explica: a.explica };
        })
        .filter((p) => p.x - window.scrollX + 30 <= largura),
    );
  }, [manual]);

  useEffect(() => {
    setMontado(true);
    setAberta(null);
    const agendar = () => {
      clearTimeout(espera.current);
      espera.current = setTimeout(medir, 350);
    };
    agendar();
    const obs = new MutationObserver(agendar);
    const main = document.querySelector("main");
    if (main) obs.observe(main, { childList: true, subtree: true, characterData: true });
    window.addEventListener("resize", agendar);
    return () => {
      obs.disconnect();
      clearTimeout(espera.current);
      window.removeEventListener("resize", agendar);
    };
  }, [medir, chave]);

  useEffect(() => {
    if (!aberta) return;
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && setAberta(null);
    document.addEventListener("keydown", tecla);
    return () => document.removeEventListener("keydown", tecla);
  }, [aberta]);

  if (!montado || !pontos.length) return null;

  return createPortal(
    <>
      {pontos.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => setAberta(aberta?.id === p.id ? null : p)}
          aria-label={`O que é: ${p.nome}`}
          aria-expanded={aberta?.id === p.id}
          // O botão tem 44 px (o dedo pede 44); o círculo desenhado continua de 24, no mesmo lugar.
          className="group absolute z-20 flex h-11 w-11 -translate-x-2.5 -translate-y-1/2 items-center justify-center print:hidden"
          style={{ left: p.x, top: p.y }}
        >
          <span
            aria-hidden
            className="flex h-6 w-6 items-center justify-center rounded-full bg-ciano-tint text-[12px] font-bold text-ciano-forte ring-1 ring-ciano/30 transition-colors group-hover:bg-ciano group-hover:text-white"
          >
            ?
          </span>
        </button>
      ))}
      {aberta && (
        <div
          role="dialog"
          aria-label={`O que é: ${aberta.nome}`}
          className="surgir absolute z-[60] w-[min(20rem,calc(100vw-24px))] rounded-2xl border-2 border-primary bg-white p-4 shadow-[0_24px_50px_-20px_rgba(0,0,0,.55)] print:hidden"
          style={{
            top: aberta.y + 18,
            left: Math.max(12, Math.min(aberta.x - 160, document.documentElement.clientWidth - Math.min(320, document.documentElement.clientWidth - 24) - 12)),
          }}
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-bold text-primary">{aberta.nome}</p>
            <button type="button" onClick={() => setAberta(null)} aria-label="Fechar" className="-mr-1 -mt-1 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted">
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-foreground">{aberta.explica}</p>
        </div>
      )}
    </>,
    document.body,
  );
}
