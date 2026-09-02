"use client";

import { useEffect, useState } from "react";
import { garantirTeste, type Assinatura } from "@/lib/trial";

/**
 * A assinatura, para qualquer tela do app perguntar "posso deixar agir?".
 *
 * UMA chamada por carga de página, não uma por tela: o resultado fica numa
 * promise de módulo que todo mundo espera. Sem isso, a faixa de teste e as
 * três telas com ação bloqueável fariam quatro leituras idênticas do banco
 * a cada navegação.
 *
 * `fase: "carregando"` NUNCA bloqueia botão: enquanto não se sabe, o app se
 * comporta como liberado. Bloquear no escuro puniria justamente a conexão
 * lenta — e quem paga não pode ver a própria assinatura piscar em "assine".
 */

let promessa: Promise<Assinatura | null> | null = null;

function carregar(): Promise<Assinatura | null> {
  if (!promessa) {
    promessa = garantirTeste().catch(() => {
      // Falhou (rede, tabela ausente): solta a promise para a próxima tela
      // tentar de novo, e trata ESTA carga como liberada — indisponibilidade
      // nossa nunca vira porta na cara do cliente.
      promessa = null;
      return null;
    });
  }
  return promessa;
}

export type EstadoAssinatura =
  | { fase: "carregando"; liberado: true }
  | { fase: "pronto"; liberado: boolean; assinatura: Assinatura | null };

export function useAssinatura(): EstadoAssinatura {
  const [estado, setEstado] = useState<EstadoAssinatura>({
    fase: "carregando",
    liberado: true,
  });

  useEffect(() => {
    let ativo = true;
    carregar().then((assinatura) => {
      if (!ativo) return;
      setEstado({
        fase: "pronto",
        // Sem linha nenhuma (null) = não deu para saber = liberado, pela
        // mesma regra de nunca punir indisponibilidade.
        liberado: assinatura?.liberado ?? true,
        assinatura,
      });
    });
    return () => {
      ativo = false;
    };
  }, []);

  return estado;
}
