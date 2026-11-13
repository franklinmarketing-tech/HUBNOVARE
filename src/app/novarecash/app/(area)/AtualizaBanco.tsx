"use client";

import { useEffect } from "react";

import { contasComSaldo, listarConexoes, marcarSincronizado, precisaSincronizar, sincronizar } from "@/lib/novarecash/openfinance";
import { Toast, useToast } from "./Toast";

/**
 * ATUALIZA SOZINHO (13/11/2026). Quem tem banco conectado não precisa lembrar do "Sincronizar agora":
 * ao abrir o NovareCash, se a última atualização (neste aparelho) passou de 6 h, traz os saldos e os
 * últimos 30 dias em segundo plano, sem duplicar. Silencioso: só avisa quando entra lançamento novo.
 *
 * Só é montado (na casca) para quem tem o recurso "banco" liberado.
 */
export function AtualizaBanco() {
  const toast = useToast();
  const { mostrar } = toast;

  useEffect(() => {
    if (!precisaSincronizar()) return;
    // Marca ANTES: outra aba não roda junto e uma falha não insiste a cada tela.
    marcarSincronizado();
    let vivo = true;
    (async () => {
      try {
        const conexoes = await listarConexoes();
        if (!conexoes.length) return;
        const contas = await contasComSaldo();
        if (!contas.length) return;
        const r = await sincronizar({ contas, conexoes, dias: 30 });
        if (vivo && r.novas > 0) {
          mostrar({
            texto: `Banco atualizado: ${r.novas} ${r.novas === 1 ? "lançamento novo" : "lançamentos novos"} no extrato.`,
            acao: { rotulo: "Ver", fazer: () => window.location.assign("/novarecash/app/extrato") },
          });
        }
      } catch {
        /* silencioso: a tela Banco tem o "Sincronizar agora" */
      }
    })();
    return () => {
      vivo = false;
    };
  }, [mostrar]);

  return <Toast {...toast} />;
}
