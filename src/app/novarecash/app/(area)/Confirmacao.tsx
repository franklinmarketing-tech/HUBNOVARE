"use client";

import { useCallback, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";

import { Janela } from "./Janela";
import { Botao } from "./pecas";

/**
 * A CONFIRMAÇÃO NO TEMA DO APP (15/11/2026, auditoria UX): no lugar do `window.confirm` — a caixa
 * cinza do navegador, feia no celular e fora do tema.
 *
 *   const { confirmar, caixa } = useConfirmar("janela" | "dentro");
 *   if (!(await confirmar("Apagar “Aluguel”?", "Apagar"))) return;
 *   …e `{caixa}` na tela.
 *
 * "janela": numa Janela própria (para ações soltas na tela).
 * "dentro": um quadro dentro do formulário em que já se está — uma janela por cima de outra
 * brigaria pelo foco e pelo Esc. Ponha `{caixa}` logo acima dos botões do formulário.
 */
type Pedido = { texto: string; rotulo: string; resolver: (sim: boolean) => void };

export function useConfirmar(modo: "janela" | "dentro" = "janela") {
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const atual = useRef<Pedido | null>(null);

  const confirmar = useCallback(
    (texto: string, rotulo = "Confirmar") =>
      new Promise<boolean>((resolver) => {
        atual.current?.resolver(false);
        atual.current = { texto, rotulo, resolver };
        setPedido(atual.current);
      }),
    [],
  );

  const responder = useCallback((sim: boolean) => {
    atual.current?.resolver(sim);
    atual.current = null;
    setPedido(null);
  }, []);

  const conteudo = pedido && (
    <>
      <p className="flex gap-2 text-sm leading-relaxed text-white/85">
        <AlertTriangle aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
        {pedido.texto}
      </p>
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <Botao variante="fantasma" onClick={() => responder(false)}>
          Cancelar
        </Botao>
        <Botao variante="perigo" onClick={() => responder(true)}>
          {pedido.rotulo}
        </Botao>
      </div>
    </>
  );

  const caixa = !pedido ? null : modo === "janela" ? (
    <Janela titulo="Tem certeza?" onFechar={() => responder(false)}>
      {conteudo}
    </Janela>
  ) : (
    <div role="alertdialog" aria-label="Tem certeza?" className="rounded-2xl border border-warning/35 bg-warning/10 p-4">
      {conteudo}
    </div>
  );

  return { confirmar, caixa };
}
