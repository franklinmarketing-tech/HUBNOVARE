"use client";

import { useEffect, useState } from "react";
import { BotaoAcao } from "../pecas";
import {
  atualizarCartao,
  cicloDaFatura,
  salvarCartao,
} from "@/lib/fincash/faturas";
import {
  mesVizinho,
  refDoMes,
  type Cartao,
  type Conta,
} from "@/lib/fincash/modelo";
import { CORES, porExtenso } from "./comum";

/**
 * O cadastro do cartão.
 *
 * A PRÉVIA DO CICLO É A PEÇA IMPORTANTE DAQUI. "Dia de fechamento" é a pergunta
 * que mais gente responde errado num app de finanças — muita gente acha que é o
 * dia do vencimento, ou o dia em que a fatura chega por e-mail. Mostrar, com os
 * números que a pessoa acabou de digitar, exatamente qual período a fatura vai
 * pegar e quando ela vence transforma um campo obscuro em algo conferível.
 *
 * O QUE MUDOU NA REVISÃO VISUAL: a sombra da janela virou a da casa
 * (`--fin-sombra-flutua`, a de elemento flutuante) no lugar do `shadow-elevated`
 * do site, o rodapé virou `BotaoAcao` como no resto do app, e os discos de cor
 * ganharam 44px de alvo — antes eram círculos de 40px soltos, que é o toque que
 * erra e pinta o cartão da cor errada.
 */
export function FormularioCartao({
  cartao,
  contas,
  aoFechar,
  aoSalvar,
}: {
  /** Nulo = criando. */
  cartao: Cartao | null;
  contas: Conta[];
  aoFechar: () => void;
  aoSalvar: () => void;
}) {
  const [nome, setNome] = useState(cartao?.nome ?? "");
  const [limite, setLimite] = useState(
    cartao?.limite ? String(cartao.limite).replace(".", ",") : "",
  );
  const [fechamento, setFechamento] = useState(cartao?.dia_fechamento ?? 25);
  const [vencimento, setVencimento] = useState(cartao?.dia_vencimento ?? 5);
  const [contaId, setContaId] = useState(cartao?.conta_pagamento_id ?? "");
  const [cor, setCor] = useState(cartao?.cor ?? CORES[0]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const sair = (e: KeyboardEvent) => e.key === "Escape" && aoFechar();
    window.addEventListener("keydown", sair);
    return () => window.removeEventListener("keydown", sair);
  }, [aoFechar]);

  const prevendo = cicloDaFatura(
    { dia_fechamento: fechamento, dia_vencimento: vencimento },
    mesVizinho(refDoMes(), 1),
  );

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return;

    setSalvando(true);
    const dados = {
      nome: nome.trim(),
      /* Vazio é nulo, e não zero: `calcularFatura` usa o nulo para saber que
         não deve mostrar uso de limite. Zero faria a divisão sumir do jeito
         certo por acidente hoje e do jeito errado no dia em que alguém trocar
         a checagem por `!= null`. */
      limite: limite.trim()
        ? Number(limite.replace(/\./g, "").replace(",", ".")) || null
        : null,
      dia_fechamento: fechamento,
      dia_vencimento: vencimento,
      conta_pagamento_id: contaId || null,
      cor,
    };

    try {
      if (cartao) await atualizarCartao(cartao.id, dados);
      else await salvarCartao(dados);
      aoSalvar();
    } catch (err) {
      setErro((err as Error).message);
      setSalvando(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-primary/40 p-4 backdrop-blur-sm sm:items-center"
      onClick={aoFechar}
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-cartao"
    >
      <form
        onSubmit={enviar}
        onClick={(e) => e.stopPropagation()}
        className="my-auto w-full max-w-md rounded-3xl bg-white p-6 shadow-[var(--fin-sombra-flutua)] sm:p-7"
      >
        <h2
          id="titulo-cartao"
          className="font-display text-lg font-semibold text-primary"
        >
          {cartao ? `Editar ${cartao.nome}` : "Novo cartão"}
        </h2>

        <label className="mt-5 block">
          <span className="text-xs font-medium text-muted-foreground">Nome</span>
          <input
            autoFocus
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nubank, Itaú Click, Inter…"
            className="mt-1 w-full rounded-xl border border-border px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-accent"
          />
        </label>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">
              Fecha no dia
            </span>
            <input
              type="number"
              min={1}
              max={31}
              value={fechamento}
              onChange={(e) =>
                setFechamento(
                  Math.min(31, Math.max(1, Number(e.target.value) || 1)),
                )
              }
              className="mt-1 w-full rounded-xl border border-border px-3.5 py-2.5 text-sm tabular-nums outline-none transition-colors focus:border-accent"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">
              Vence no dia
            </span>
            <input
              type="number"
              min={1}
              max={31}
              value={vencimento}
              onChange={(e) =>
                setVencimento(
                  Math.min(31, Math.max(1, Number(e.target.value) || 1)),
                )
              }
              className="mt-1 w-full rounded-xl border border-border px-3.5 py-2.5 text-sm tabular-nums outline-none transition-colors focus:border-accent"
            />
          </label>
        </div>

        <p className="mt-2 rounded-xl bg-ciano-tint px-3.5 py-2.5 text-2xs leading-relaxed text-ciano-forte">
          Com esses dias, a fatura que vence em{" "}
          {porExtenso(prevendo.vencimento)} vai pegar as compras de{" "}
          {porExtenso(prevendo.inicio)} a {porExtenso(prevendo.fim)}. Confira no
          app do banco — é esse par de datas que faz todo o resto bater.
        </p>

        <label className="mt-4 block">
          <span className="text-xs font-medium text-muted-foreground">
            Limite (opcional)
          </span>
          <div className="relative mt-1">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
              R$
            </span>
            <input
              inputMode="decimal"
              value={limite}
              onChange={(e) => setLimite(e.target.value)}
              placeholder="0,00"
              className="w-full rounded-xl border border-border py-2.5 pl-10 pr-3.5 text-sm tabular-nums outline-none transition-colors focus:border-accent"
            />
          </div>
          <span className="mt-1 block text-2xs leading-relaxed text-muted-foreground">
            Só serve para mostrar quanto do limite já está tomado, contando as
            parcelas futuras. Deixe vazio se preferir não acompanhar.
          </span>
        </label>

        <label className="mt-4 block">
          <span className="text-xs font-medium text-muted-foreground">
            Conta que paga a fatura
          </span>
          <select
            value={contaId}
            onChange={(e) => setContaId(e.target.value)}
            className="mt-1 w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-accent"
          >
            <option value="">Escolher na hora de pagar</option>
            {contas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </label>

        <fieldset className="mt-4">
          <legend className="text-xs font-medium text-muted-foreground">
            Cor
          </legend>
          {/* 44px de alvo, como nas contas: o disco continua com 32px por
              dentro — o que cresceu foi a área que o dedo acerta, que é onde
              não se economiza pixel. */}
          <div className="mt-1.5 flex flex-wrap gap-1">
            {CORES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCor(c)}
                aria-label={`Cor ${c}`}
                aria-pressed={cor === c}
                className="flex h-11 w-11 items-center justify-center rounded-xl transition-colors hover:bg-gelo"
              >
                <span
                  aria-hidden
                  className={`h-8 w-8 rounded-full transition-transform ${
                    cor === c ? "scale-110 ring-2 ring-primary ring-offset-2" : ""
                  }`}
                  style={{ background: c }}
                />
              </button>
            ))}
          </div>
        </fieldset>

        {erro && (
          <p role="status" className="mt-3 text-2xs text-destructive">
            {erro}
          </p>
        )}

        {/* O rodapé é `BotaoAcao` como no resto do app: era o mesmo botão
            redesenhado à mão, com a sombra laranja copiada linha a linha. */}
        <div className="mt-6 grid grid-cols-2 gap-2">
          <BotaoAcao variante="contorno" larguraTotal onClick={aoFechar}>
            Cancelar
          </BotaoAcao>
          <BotaoAcao
            tipo="submit"
            larguraTotal
            desabilitado={salvando || !nome.trim()}
          >
            {salvando ? "Salvando…" : "Salvar"}
          </BotaoAcao>
        </div>
      </form>
    </div>
  );
}
