"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { hojeNoBrasil } from "@/lib/novarecash/dados";
import { somarDias } from "@/lib/novarecash/cartoes";
import { avisarDadosMudaram, useRefazerServidorAoMudar } from "./dadosMudaram";

import {
  contasComSaldo,
  faturaAtual,
  itensParaRefazer,
  listarCartoesDoBanco,
  listarConexoes,
  marcarSincronizado,
  precisaReconectar,
  precisaSincronizar,
  refeito,
  reivindicar,
  sincronizar,
  trazerTudo,
} from "@/lib/novarecash/openfinance";
import { Toast, useToast } from "./Toast";

const CHAVE_TRAVA = "ncash:open-finance:sincronizando";
/** A mesma chave da TelaBanco: a conexão em andamento. */
const CHAVE_ESPERA = "ncash:open-finance:esperando";

/**
 * ATUALIZA SOZINHO (13/11/2026; revisto na varredura do mesmo dia). Quem tem banco conectado não
 * precisa lembrar do "Sincronizar agora": ao abrir o NovareCash, se a última atualização (neste
 * aparelho) passou de 6 h, traz os saldos e os lançamentos DESDE O ÚLTIMO de cada conta (sem buraco,
 * mesmo depois de semanas sem abrir), sem duplicar. Banco cuja 1ª importação pegou o banco ainda
 * "atualizando" refaz os 12 meses. Silencioso: só avisa quando entra lançamento novo ou quando um
 * banco precisa ser reconectado.
 *
 * Trava de 10 min (outra aba não roda junto); "em dia" só é marcado quando dá certo — antes marcava
 * antes de rodar, e uma falha esperava 6 h para tentar de novo.
 *
 * Só é montado (na casca) para quem tem o recurso "banco" liberado.
 */
export function AtualizaBanco() {
  const toast = useToast();
  const { mostrar } = toast;
  const router = useRouter();
  // Início (servidor) também se refaz quando o banco traz dado novo.
  useRefazerServidorAoMudar();

  // CONEXÃO QUE FICOU PELA METADE (13/11/2026): o banco devolveu o cliente em outra aba/app e ele
  // reabriu o NovareCash por outro caminho. Em qualquer tela (fora da Banco, que cuida disso sozinha),
  // confere a autorização e traz os 12 meses — sem o cliente precisar voltar àquela janela.
  useEffect(() => {
    if (window.location.pathname.includes("/novarecash/app/banco")) return;
    let espera: { quando?: number; banco?: string; url?: string; item?: string } | null = null;
    try {
      const bruto = localStorage.getItem(CHAVE_ESPERA);
      espera = bruto && !/^\d+$/.test(bruto) ? JSON.parse(bruto) : null;
    } catch {
      return;
    }
    if (!espera?.url || espera.item || Date.now() - Number(espera.quando) > 60 * 60_000) return;
    let vivo = true;
    (async () => {
      try {
        const r = await reivindicar();
        if (!r.ok) return; // dúvida (confirmar/escolher) ou ainda não autorizou: a tela Banco resolve
        try {
          localStorage.removeItem(CHAVE_ESPERA);
        } catch {}
        const t = await trazerTudo({ itemId: r.itemId ?? null, dias: 365 });
        marcarSincronizado();
        avisarDadosMudaram();
        if (vivo)
          mostrar({
            texto: `${r.banco || espera?.banco || "Banco"} conectado! ${t.resultado.novas} lançamentos entraram no extrato.`,
            acao: { rotulo: "Ver", fazer: () => router.push("/novarecash/app/banco") },
          });
      } catch {
        /* a tela Banco retoma */
      }
    })();
    return () => {
      vivo = false;
    };
  }, [mostrar, router]);

  useEffect(() => {
    if (!precisaSincronizar()) return;
    try {
      if (Date.now() - Number(localStorage.getItem(CHAVE_TRAVA) || 0) < 10 * 60_000) return;
      localStorage.setItem(CHAVE_TRAVA, String(Date.now()));
    } catch {
      return;
    }
    let vivo = true;
    (async () => {
      try {
        const conexoes = await listarConexoes();
        if (!conexoes.length) return;
        const reconectar = conexoes.filter((c) => precisaReconectar(c.status));
        const contas = await contasComSaldo();
        if (contas.length) {
          const refazer = new Set(itensParaRefazer());
          const doze = contas.filter((c) => c.itemId && refazer.has(c.itemId));
          const resto = contas.filter((c) => !(c.itemId && refazer.has(c.itemId)));
          let novas = 0;
          if (doze.length) {
            novas += (await sincronizar({ contas: doze, conexoes, dias: 365 })).novas;
            for (const id of refazer) refeito(id);
          }
          if (resto.length) novas += (await sincronizar({ contas: resto, conexoes })).novas;
          marcarSincronizado();
          // As telas abertas (Extrato, Início…) recarregam sozinhas — antes só um F5 mostrava o novo.
          if (novas > 0) avisarDadosMudaram();
          if (vivo && novas > 0) {
            mostrar({
              texto: `Banco atualizado: ${novas} ${novas === 1 ? "lançamento novo" : "lançamentos novos"} no extrato.`,
              acao: { rotulo: "Ver", fazer: () => router.push("/novarecash/app/extrato") },
            });
            return;
          }
        }
        // Fatura do cartão vencendo em até 3 dias (e ainda não paga): avisa.
        // 15/11/2026: o "hoje" do Brasil (o de UTC virava amanhã depois das 21h).
        const hoje = hojeNoBrasil();
        const em3 = somarDias(hoje, 3);
        const vencendo = (await listarCartoesDoBanco().catch(() => []))
          .map((c) => ({ c, f: faturaAtual(c) }))
          .find(({ f }) => f && f.vence && f.situacao !== "paga" && f.vence >= hoje && f.vence <= em3);
        if (vivo && vencendo?.f) {
          const conexao = conexoes.find((x) => x.itemId === vencendo.c.itemId);
          const valor = vencendo.f.total ? ` de ${vencendo.f.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}` : "";
          mostrar({
            texto: `Fatura${conexao ? ` do ${conexao.banco}` : ""}${valor} vence em ${vencendo.f.vence!.slice(8, 10)}/${vencendo.f.vence!.slice(5, 7)}.`,
            tom: "alerta",
            acao: { rotulo: "Ver", fazer: () => router.push("/novarecash/app/banco") },
          });
          return;
        }
        if (vivo && reconectar.length) {
          mostrar({
            texto: `${reconectar.map((c) => c.banco).join(", ")} precisa ser reconectado para continuar atualizando.`,
            tom: "alerta",
            acao: { rotulo: "Reconectar", fazer: () => router.push("/novarecash/app/banco") },
          });
        }
      } catch {
        /* silencioso: a tela Banco tem o "Sincronizar agora"; tenta de novo na próxima abertura */
      } finally {
        try {
          localStorage.removeItem(CHAVE_TRAVA);
        } catch {}
      }
    })();
    return () => {
      vivo = false;
    };
  }, [mostrar, router]);

  return <Toast {...toast} />;
}
