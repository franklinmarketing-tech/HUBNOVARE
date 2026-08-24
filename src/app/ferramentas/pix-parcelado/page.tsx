"use client";

import Link from "next/link";
import { useState } from "react";
import { Zap } from "lucide-react";
import { brl, parseNumero, pct, resolverTaxaMensal } from "@/lib/calculos";
import {
  Campo,
  CascaFerramenta,
  Linha,
  Resultado,
} from "@/components/CascaFerramenta";

export default function PixParceladoPage() {
  const [valor, setValor] = useState("1000");
  const [parcelas, setParcelas] = useState("12");
  const [valorParcela, setValorParcela] = useState("115");

  const compra = Math.max(0, parseNumero(valor));
  const n = Math.max(1, Math.round(parseNumero(parcelas)) || 1);
  const parcela = Math.max(0, parseNumero(valorParcela));

  const total = parcela * n;
  const jurosReais = total - compra;

  // A taxa nunca vem escrita no aplicativo do banco: ela é deduzida do
  // fluxo de pagamentos, pela mesma bisseção que resolve o CET.
  // Devolve null quando as parcelas não somam mais que a compra — aí não
  // há juro nenhum a descobrir.
  const taxaMes =
    compra > 0 && parcela > 0
      ? (resolverTaxaMensal({ principal: compra, parcela, meses: n }) ?? 0)
      : 0;
  const taxaAno = (Math.pow(1 + taxaMes, 12) - 1) * 100;
  const taxaMesPct = taxaMes * 100;

  const acrescimoPct = compra > 0 ? (jurosReais / compra) * 100 : 0;
  const caro = taxaMesPct > 3;

  // O mesmo dinheiro guardado enquanto se junta para pagar à vista.
  const rendendo = compra * Math.pow(1 + 0.0105, n) - compra;

  return (
    <CascaFerramenta
      nome="Pix parcelado"
      selo={
        <>
          <Zap className="h-3.5 w-3.5" />
          A taxa que o aplicativo não mostra
        </>
      }
      titulo="Quanto custa parcelar no Pix"
      abertura="O Pix parcelado virou o crédito mais usado do país — e é também um dos mais caros. O aplicativo mostra a parcela, nunca a taxa. Aqui a conta é feita ao contrário: das parcelas se descobre o juro real que você está pagando."
      fonte={
        <>
          A taxa é obtida por bisseção sobre o fluxo de pagamentos — o mesmo
          método do Custo Efetivo Total exigido pelo Banco Central. Bancos e
          carteiras digitais praticam taxas diferentes para o Pix parcelado, e
          o valor da parcela que você informa é o que manda no cálculo.
        </>
      }
    >
      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="grid sm:grid-cols-3 gap-x-5 gap-y-4">
          <Campo
            label="Valor da compra"
            prefixo="R$"
            value={valor}
            onChange={setValor}
            hint="O preço à vista."
          />
          <Campo
            label="Em quantas parcelas"
            value={parcelas}
            onChange={setParcelas}
            hint="Como o app ofereceu."
          />
          <Campo
            label="Valor de cada parcela"
            prefixo="R$"
            value={valorParcela}
            onChange={setValorParcela}
            hint="Está na tela da simulação."
          />
        </div>
      </section>

      <Resultado
        rotulo="Juro real dessa compra"
        valor={`${pct(taxaMesPct, 2)} ao mês`}
        tom={caro ? "alerta" : "normal"}
        nota={
          compra > 0 && parcela > 0 ? (
            <>
              {pct(taxaAno, 1)} ao ano. Você paga {brl(jurosReais)} a mais para
              levar {brl(compra)} hoje.
            </>
          ) : null
        }
      />

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-slate-700">A conta aberta</h2>
        <div className="divide-y divide-slate-100 mt-3">
          <Linha rotulo="Preço à vista" valor={brl(compra)} />
          <Linha
            rotulo={`${n} parcelas de ${brl(parcela)}`}
            valor={brl(total)}
            tom="desconto"
          />
          <Linha
            rotulo="Juros pagos"
            valor={brl(jurosReais)}
            tom="desconto"
            detalhe={`${pct(acrescimoPct, 1)} a mais do que o preço da etiqueta.`}
          />
          <Linha
            rotulo="Custo total"
            valor={brl(total)}
            tom="total"
          />
        </div>
      </section>

      {caro && compra > 0 && (
        <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <h3 className="text-sm font-semibold text-amber-900">
            Essa taxa está acima do crédito comum
          </h3>
          <p className="text-xs text-amber-800 mt-1.5">
            {pct(taxaMesPct, 2)} ao mês dá {pct(taxaAno, 1)} ao ano. Um
            consignado costuma ficar perto de 1,8% ao mês e um empréstimo
            pessoal entre 3% e 8%. Se a compra puder esperar, guardar as
            parcelas por {n} {n === 1 ? "mês" : "meses"} renderia cerca de{" "}
            {brl(rendendo)} em vez de custar {brl(jurosReais)} — uma diferença
            de {brl(rendendo + jurosReais)} no seu bolso.
          </p>
        </section>
      )}

      <section className="mt-6 grid sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-700">
            Por que parece barato
          </h3>
          <p className="text-xs text-slate-500 mt-1.5">
            O aplicativo mostra a parcela, não o juro. {brl(parcela)} por mês
            soa pequeno perto de {brl(compra)} — e é exatamente esse o efeito.
            A pergunta certa não é &quot;cabe no mês?&quot;, é &quot;quanto
            custa no fim?&quot;.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-700">
            Onde o Pix parcelado ainda vale
          </h3>
          <p className="text-xs text-slate-500 mt-1.5">
            Para quem não tem cartão nem acesso a crédito melhor, ele é mais
            barato que o rotativo. O problema é usá-lo por comodidade tendo
            alternativa mais barata na mão. Compare com o{" "}
            <Link
              href="/ferramentas/cet"
              className="text-accent-strong font-medium underline underline-offset-2"
            >
              custo efetivo total
            </Link>{" "}
            de outras opções.
          </p>
        </div>
      </section>
    </CascaFerramenta>
  );
}
