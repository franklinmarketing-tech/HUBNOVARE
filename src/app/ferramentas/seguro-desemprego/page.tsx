"use client";

import { useState } from "react";
import { LifeBuoy } from "lucide-react";
import { brl, parseNumero } from "@/lib/calculos";
import { SALARIO_MINIMO, TETO_SEGURO, seguroDesemprego } from "@/lib/trabalhista";
import {
  Campo,
  CascaFerramenta,
  Linha,
  Resultado,
} from "@/components/CascaFerramenta";

const SOLICITACOES = [
  { n: 1 as const, nome: "1ª vez", regra: "Precisa de 12 meses trabalhados nos últimos 18." },
  { n: 2 as const, nome: "2ª vez", regra: "Precisa de 9 meses trabalhados nos últimos 12." },
  { n: 3 as const, nome: "3ª vez ou mais", regra: "Precisa de 6 meses trabalhados." },
];

export default function SeguroDesempregoPage() {
  const [s1, setS1] = useState("2500");
  const [s2, setS2] = useState("2500");
  const [s3, setS3] = useState("2500");
  const [meses, setMeses] = useState("24");
  const [vez, setVez] = useState<1 | 2 | 3>(1);

  const r = seguroDesemprego(
    [parseNumero(s1), parseNumero(s2), parseNumero(s3)],
    Math.max(0, Math.round(parseNumero(meses)) || 0),
    vez,
  );

  const escolhida = SOLICITACOES.find((s) => s.n === vez)!;

  return (
    <CascaFerramenta
      nome="Seguro-desemprego"
      selo={
        <>
          <LifeBuoy className="h-3.5 w-3.5" />
          Tabela de 2026
        </>
      }
      titulo="Quanto e por quantos meses você recebe"
      abertura="O seguro-desemprego não paga o seu salário: paga uma parte dele, por faixas, e trava num teto. Saber o valor antes ajuda a dimensionar quanto tempo o dinheiro da rescisão precisa durar."
      fonte={
        <>
          Tabela vigente desde janeiro de 2026: 80% da média até R$ 2.222,17,
          mais 50% do que exceder, com teto de {brl(TETO_SEGURO)} e piso de um
          salário mínimo ({brl(SALARIO_MINIMO)}). O direito depende ainda de não
          ter renda própria e de não receber benefício continuado do INSS.
        </>
      }
    >
      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <p className="text-xs font-semibold text-slate-600 mb-1.5">
          Seus três últimos salários
        </p>
        <div className="grid sm:grid-cols-3 gap-x-5 gap-y-4">
          <Campo label="Último mês" prefixo="R$" value={s1} onChange={setS1} />
          <Campo label="Penúltimo" prefixo="R$" value={s2} onChange={setS2} />
          <Campo label="Antepenúltimo" prefixo="R$" value={s3} onChange={setS3} />
        </div>

        <div className="grid sm:grid-cols-2 gap-x-5 gap-y-4 mt-5">
          <Campo
            label="Meses trabalhados"
            value={meses}
            onChange={setMeses}
            hint="No emprego que acabou de terminar."
          />
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              É a sua qual solicitação?
            </label>
            <div className="flex flex-wrap gap-2">
              {SOLICITACOES.map((s) => (
                <button
                  key={s.n}
                  type="button"
                  onClick={() => setVez(s.n)}
                  className={`h-9 rounded-xl px-3 text-sm font-semibold transition-colors ${
                    vez === s.n
                      ? "bg-primary text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {s.nome}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">{escolhida.regra}</p>
          </div>
        </div>
      </section>

      {r.temDireito ? (
        <>
          <Resultado
            rotulo="Você recebe por parcela"
            valor={brl(r.valorParcela)}
            nota={
              <>
                {r.parcelas} parcelas, somando {brl(r.total)} ao longo do
                benefício.
              </>
            }
          />

          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <h2 className="text-sm font-semibold text-slate-700">Como se chega nesse valor</h2>
            <div className="divide-y divide-slate-100 mt-3">
              <Linha
                rotulo="Média dos três últimos salários"
                valor={brl(r.media)}
              />
              <Linha
                rotulo="Valor da parcela"
                valor={brl(r.valorParcela)}
                detalhe={
                  r.valorParcela >= TETO_SEGURO
                    ? "Travou no teto do benefício."
                    : r.valorParcela <= SALARIO_MINIMO
                      ? "Elevado ao piso: nunca é menos que um salário mínimo."
                      : "80% da média até a primeira faixa, mais 50% do que passa dela."
                }
              />
              <Linha rotulo="Número de parcelas" valor={String(r.parcelas)} />
              <Linha rotulo="Total do benefício" valor={brl(r.total)} tom="total" />
            </div>
          </section>

          {r.valorParcela < r.media && (
            <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <h3 className="text-sm font-semibold text-amber-900">
                Sua renda vai cair {brl(r.media - r.valorParcela)} por mês
              </h3>
              <p className="text-xs text-amber-800 mt-1.5">
                O benefício cobre{" "}
                {Math.round((r.valorParcela / r.media) * 100)}% do que você
                ganhava. Some o que recebeu de rescisão e do FGTS e divida pelos
                meses até o próximo emprego — é essa conta que evita a dívida
                cara no meio do caminho.
              </p>
            </section>
          )}
        </>
      ) : (
        <section className="mt-6 rounded-3xl border-2 border-amber-200 bg-amber-50 p-7 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">
            Ainda sem direito
          </p>
          <p className="text-lg font-bold text-amber-900 mt-2">{r.motivo}</p>
          <p className="text-xs text-amber-800 mt-2">
            Você informou {meses} meses trabalhados. O tempo mínimo muda
            conforme quantas vezes você já pediu o benefício.
          </p>
        </section>
      )}

      <section className="mt-6 grid sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-700">
            Quem tem direito
          </h3>
          <p className="text-xs text-slate-500 mt-1.5">
            Trabalhador CLT demitido sem justa causa, que não tenha renda
            própria para se sustentar nem receba benefício continuado do INSS
            (aposentadoria, por exemplo). Pedido de demissão, acordo e justa
            causa ficam de fora.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-700">
            O prazo é curto
          </h3>
          <p className="text-xs text-slate-500 mt-1.5">
            O pedido vai de 7 a 120 dias depois da demissão. Perdeu o prazo,
            perdeu o benefício. Dá para solicitar pelo aplicativo ou site da
            Carteira de Trabalho Digital, sem ir a lugar nenhum.
          </p>
        </div>
      </section>
    </CascaFerramenta>
  );
}
