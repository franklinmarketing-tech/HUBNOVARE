"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Registra que alguém abriu uma ferramenta.
 *
 * ⚠️ ANTES DISTO A CASA ERA CEGA NO TOPO DO FUNIL. Só se sabia de quem
 * deixava o e-mail. Quem abria três calculadoras, usava, e ia embora sem se
 * cadastrar — que é a maioria — não existia em nenhum lugar. Sem este
 * registro, não há como responder "qual isca atrai mais" nem "qual todo
 * mundo abandona", que são as duas perguntas que decidem onde a Novare
 * investe divulgação.
 *
 * ⚠️ NÃO GUARDA DADO PESSOAL. Vai o caminho da página e, quando a pessoa
 * está logada, o `user_id` — que o banco preenche sozinho com `auth.uid()`.
 * Nada de IP, de user-agent, nem do que foi digitado na calculadora. É
 * dinheiro de gente do outro lado: um log de uso que vaze hábito financeiro
 * é pior do que não ter log nenhum.
 *
 * ⚠️ VISITANTE ANÔNIMO CONTA. A função aceita `auth.uid()` nulo de
 * propósito: quase toda isca abre sem cadastro, e é exatamente esse público
 * que se queria enxergar. Nesse caso a visita entra sem dono — serve para
 * contar quantas vezes a ferramenta foi aberta, não quem a abriu.
 *
 * ⚠️ FALHA EM SILÊNCIO, E AQUI ISSO É CERTO. Se a medição não gravar — rede
 * caída, SQL ainda não rodado, bloqueador de anúncio —, a pessoa não pode
 * nem perceber. Medição que atrapalha quem está usando a ferramenta
 * inverteu a prioridade. É o oposto da regra que vale para o FINCASH, onde
 * escrita que falha TEM de avisar: lá é o dado do cliente; aqui é a nossa
 * estatística.
 */
export function RegistrarVisita() {
  const caminho = usePathname();

  /* Uma visita por caminho, por carregamento. Sem isto, o React em
     desenvolvimento monta o efeito duas vezes e todo número nasce dobrado. */
  const jaContou = useRef<string | null>(null);

  useEffect(() => {
    if (!caminho || jaContou.current === caminho) return;
    // O localhost (desenvolvimento e testes automáticos) grava no banco de
    // PRODUÇÃO: sem isto, cada teste virava "acesso" nas Iscas.
    if (/^(localhost|127\.0\.0\.1)$/.test(window.location.hostname)) return;
    jaContou.current = caminho;

    createClient()
      .rpc("hub_registrar_visita", { p_modulo: caminho })
      .then(() => {
        /* De propósito sem tratamento: ver o comentário acima. */
      });
  }, [caminho]);

  return null;
}
