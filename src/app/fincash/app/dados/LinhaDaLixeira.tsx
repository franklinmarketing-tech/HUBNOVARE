"use client";

import { useState } from "react";
import { RotateCcw, Trash2 } from "lucide-react";
import { CartaoTransacao, Pastilha } from "../pecas";
import type { Lancamento } from "@/lib/fincash/modelo";

/**
 * Uma linha da lixeira.
 *
 * PEÇA PRÓPRIA por causa de UM detalhe: o "apagar de vez" precisa de confirmação
 * em dois toques, e confirmação exige estado. Estado dentro do `map` da página
 * significaria um `Set` de ids em confirmação vivendo lá em cima — e é assim que
 * se acaba confirmando a exclusão da linha errada quando a lista reordena.
 *
 * A CONFIRMAÇÃO É INLINE, e não um `window.confirm`. O diálogo do navegador rouba
 * o contexto ("Tem certeza?" — certeza de quê, qual dos oito?), não diz o valor
 * nem a descrição, e no celular aparece colado no topo, longe do dedo. Aqui o
 * botão vira "Confirmar" no lugar onde a pessoa já estava olhando.
 *
 * O RESTAURAR TEM O PESO VISUAL, o apagar-de-vez não. São ações de gravidade
 * oposta na mesma linha: a que desfaz um engano é a que a pessoa veio fazer; a
 * que destrói para sempre não pode competir por atenção com ela.
 */
export function LinhaDaLixeira({
  lancamento,
  quando,
  categoria,
  aoRestaurar,
  aoApagar,
  ocupado,
}: {
  lancamento: Lancamento;
  /** "há 3 dias" — a página formata; a peça não sabe contar tempo. */
  quando: string;
  categoria?: string;
  aoRestaurar: () => void;
  aoApagar: () => void;
  ocupado: boolean;
}) {
  const [confirmando, setConfirmando] = useState(false);

  return (
    <CartaoTransacao
      descricao={lancamento.descricao}
      valor={lancamento.valor}
      sinal={lancamento.tipo === "receita" ? "entrada" : "saida"}
      quando={quando}
      categoria={categoria}
      estado={
        lancamento.pago
          ? undefined
          : { tom: "neutro" as const, texto: "Era previsto" }
      }
      acao={
        <span className="flex items-center gap-1">
          {confirmando ? (
            <>
              <button
                type="button"
                onClick={aoApagar}
                disabled={ocupado}
                className="min-h-11 rounded-xl bg-destructive px-3 text-2xs font-bold text-white transition-colors hover:bg-destructive/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-destructive disabled:opacity-50"
              >
                Apagar de vez
              </button>
              <button
                type="button"
                onClick={() => setConfirmando(false)}
                className="min-h-11 rounded-xl border border-border px-3 text-2xs font-semibold text-muted-foreground transition-colors hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Não
              </button>
            </>
          ) : (
            <>
              {/* Ícone MAIS palavra: só o ícone de seta circular é adivinhação, e
                  numa tela onde o erro é irreversível ninguém deveria adivinhar. */}
              <button
                type="button"
                onClick={aoRestaurar}
                disabled={ocupado}
                className="flex min-h-11 items-center gap-1.5 rounded-xl bg-ciano-tint px-3 text-2xs font-bold text-ciano-forte transition-colors hover:bg-ciano-tint/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ciano-forte disabled:opacity-50"
              >
                <RotateCcw className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
                Restaurar
              </button>
              <button
                type="button"
                onClick={() => setConfirmando(true)}
                disabled={ocupado}
                aria-label={`Apagar de vez: ${lancamento.descricao}`}
                className="flex min-h-11 w-11 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-destructive disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" strokeWidth={2} aria-hidden />
              </button>
            </>
          )}
        </span>
      }
    />
  );
}

/** O prazo, dito na própria linha. Quem abre a lixeira quer saber quanto tempo
    ainda tem — e "há 28 dias" com o expurgo em 30 é a diferença entre restaurar
    hoje e perder amanhã. */
export function PrazoRestante({ dias }: { dias: number }) {
  const resta = Math.max(0, dias);
  return (
    <Pastilha tom={resta <= 5 ? "aviso" : "neutro"}>
      {resta === 0 ? "expira hoje" : `${resta} dia${resta === 1 ? "" : "s"}`}
    </Pastilha>
  );
}
