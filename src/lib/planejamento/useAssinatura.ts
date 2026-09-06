"use client";

import { useEffect, useState } from "react";
import { garantirTeste, type Assinatura } from "@/lib/trial";
import { createClient } from "@/lib/supabase/client";

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

type Leitura = { assinatura: Assinatura | null; logado: boolean };

let promessa: Promise<Leitura> | null = null;

function carregar(): Promise<Leitura> {
  if (!promessa) {
    promessa = (async () => {
      // A sessão é lida à parte porque `garantirTeste` devolve `null` tanto
      // para "não tem conta" quanto para "falhou a leitura" — e as duas
      // coisas exigem respostas opostas na porta de uma ferramenta paga.
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const assinatura = await garantirTeste();
      return { assinatura, logado: !!user };
    })().catch(() => {
      // Falhou (rede, tabela ausente): solta a promise para a próxima tela
      // tentar de novo, e trata ESTA carga como liberada — indisponibilidade
      // nossa nunca vira porta na cara do cliente. `logado: true` aqui é
      // deliberado: no escuro, presumir que a pessoa entrou é o lado seguro.
      promessa = null;
      return { assinatura: null, logado: true };
    });
  }
  return promessa;
}

export type EstadoAssinatura =
  | { fase: "carregando"; liberado: true }
  | {
      fase: "pronto";
      liberado: boolean;
      assinatura: Assinatura | null;
      /**
       * A pessoa está logada?
       *
       * `liberado` sozinho não distingue "não deu para saber" (que libera,
       * de propósito) de "não tem conta" — e os dois chegavam como
       * `assinatura: null`. Para as três ações do Planejamento isso não
       * importa: quem está lá dentro já entrou. Para uma ferramenta que é
       * inteira paga, importa muito — sem esta distinção, a porta abria
       * para todo visitante anônimo.
       */
      logado: boolean;
    };

export function useAssinatura(): EstadoAssinatura {
  const [estado, setEstado] = useState<EstadoAssinatura>({
    fase: "carregando",
    liberado: true,
  });

  useEffect(() => {
    let ativo = true;
    carregar().then(({ assinatura, logado }) => {
      if (!ativo) return;
      setEstado({
        fase: "pronto",
        // Sem linha nenhuma (null) = não deu para saber = liberado, pela
        // mesma regra de nunca punir indisponibilidade.
        liberado: assinatura?.liberado ?? true,
        assinatura,
        logado,
      });
    });
    return () => {
      ativo = false;
    };
  }, []);

  return estado;
}
