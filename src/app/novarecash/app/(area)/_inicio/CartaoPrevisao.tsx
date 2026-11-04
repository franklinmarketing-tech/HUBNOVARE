"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { TrendingUp } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { ErroDados, dataCurta, nomeDoMes, usuarioDaSessao } from "@/lib/novarecash/dados";
import { carregarPrevisao, type Previsao } from "@/lib/novarecash/previsao";
import { AvisoErro, Botao, Cartao, Esqueleto, brl } from "../pecas";

/**
 * A PREVISÃO DO MÊS, para o Início: quanto sobra no fim do mês.
 * Conta em `src/lib/novarecash/previsao.ts`. Lê sozinho (com a sessão), então
 * pode ser posto em qualquer tela, de servidor ou de navegador.
 */
export function CartaoPrevisao() {
  const sb = useMemo(() => createClient(), []);
  const [estado, setEstado] = useState<"carregando" | "pronto" | "sem-tabela" | "erro">("carregando");
  const [p, setP] = useState<Previsao | null>(null);

  const carregar = useCallback(async () => {
    setEstado("carregando");
    try {
      const uid = await usuarioDaSessao(sb);
      setP(await carregarPrevisao(sb, uid));
      setEstado("pronto");
    } catch (e) {
      setEstado(e instanceof ErroDados && e.motivo === "sem-tabela" ? "sem-tabela" : "erro");
    }
  }, [sb]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  if (estado === "carregando") return <Esqueleto linhas={1} />;
  if (estado === "erro") return <AvisoErro titulo="Previsão do mês" mensagem="Não consegui calcular a previsão agora." onTentar={carregar} />;
  if (estado === "sem-tabela" || !p) {
    return (
      <Cartao className="border-dashed border-ouro/35 p-4">
        <p className="font-display text-sm font-semibold text-white">Previsão do mês</p>
        <p className="mt-1 text-xs leading-relaxed text-white/70">
          Em instalação: falta rodar <code className="break-all font-mono text-2xs text-ouro">supabase/novarecash_cartoes.sql</code> no Supabase.
        </p>
      </Cartao>
    );
  }

  if (p.vazia) {
    return (
      <Cartao className="p-4">
        <p className="flex items-center gap-2 font-display text-sm font-semibold text-white">
          <TrendingUp className="h-4 w-4 text-ouro" /> Previsão do mês
        </p>
        <p className="mt-1 text-xs leading-relaxed text-white/70">
          Informe o saldo das suas contas e cadastre as contas a pagar: o NovareCash mostra quanto vai sobrar no fim do mês.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Botao href="/novarecash/app/extrato?contas=1">Informar saldo</Botao>
          <Botao variante="contorno" href="/novarecash/app/contas">
            Contas a pagar
          </Botao>
        </div>
      </Cartao>
    );
  }

  const linhas: { rotulo: string; valor: number; sinal: "+" | "−" | "" }[] = [
    { rotulo: "Saldo das contas hoje", valor: p.saldoContas, sinal: "" },
    { rotulo: p.salarioEsperado > 0 ? "Entradas previstas (inclui o salário do mês passado)" : "Entradas previstas", valor: p.entradasPrevistas, sinal: "+" },
    { rotulo: `Contas a pagar (${p.qtdContasAPagar})`, valor: p.contasAPagar, sinal: "−" },
    { rotulo: "Fatura que vence no mês", valor: p.faturas, sinal: "−" },
  ];

  return (
    <Cartao className="p-4 sm:p-5">
      <p className="flex items-center gap-2 text-2xs font-semibold uppercase tracking-[0.14em] text-ouro">
        <TrendingUp className="h-3.5 w-3.5" /> Previsão · fim de {nomeDoMes(p.ref, false)}
      </p>
      <p className={`mt-1 font-display text-3xl font-semibold tabular-nums ${p.sobra < 0 ? "text-accent-claro" : "text-white"}`}>
        {brl(p.sobra)}
      </p>
      <p className="text-xs text-white/70">{p.sobra < 0 ? "Vai faltar, se nada mudar." : "Deve sobrar no fim do mês."}</p>

      <dl className="mt-3 space-y-1.5 border-t border-white/10 pt-3 text-xs">
        {linhas.map((l) => (
          <div key={l.rotulo} className="flex items-baseline justify-between gap-3">
            <dt className="min-w-0 text-white/65">{l.rotulo}</dt>
            <dd className="shrink-0 font-semibold tabular-nums text-white">
              {l.sinal && l.valor > 0 ? `${l.sinal} ` : ""}
              {brl(l.valor)}
            </dd>
          </div>
        ))}
      </dl>
      {p.faturasDetalhe.length > 0 && (
        <p className="mt-2 text-2xs text-white/55">
          {p.faturasDetalhe.map((f) => `${f.cartao}: ${brl(f.restante)} em ${dataCurta(f.vence)}`).join(" · ")}
        </p>
      )}
      {p.contasSemSaldo > 0 && (
        <p className="mt-2 text-2xs text-warning-claro">
          {p.contasSemSaldo} {p.contasSemSaldo === 1 ? "conta está" : "contas estão"} sem saldo informado e ficaram de fora.
        </p>
      )}
      <p className="mt-2 text-2xs text-white/50">Investimentos não entram. Pagar a fatura não conta como gasto.</p>
    </Cartao>
  );
}
