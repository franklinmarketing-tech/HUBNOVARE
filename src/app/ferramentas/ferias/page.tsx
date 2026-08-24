"use client";

import { useState } from "react";
import { Palmtree } from "lucide-react";
import { brl, parseNumero } from "@/lib/calculos";
import { ferias } from "@/lib/trabalhista";
import {
  Campo,
  CascaFerramenta,
  Linha,
  Resultado,
} from "@/components/CascaFerramenta";

const OPCOES = [
  { gozados: 30, vendidos: 0, nome: "30 dias de férias" },
  { gozados: 20, vendidos: 10, nome: "20 dias + vender 10" },
  { gozados: 15, vendidos: 0, nome: "15 dias (primeiro período)" },
];

export default function FeriasPage() {
  const [salario, setSalario] = useState("3000");
  const [dependentes, setDependentes] = useState("0");
  const [escolha, setEscolha] = useState(0);

  const valorSalario = Math.max(0, parseNumero(salario));
  const deps = Math.max(0, Math.round(parseNumero(dependentes)) || 0);
  const opcao = OPCOES[escolha];

  const r = ferias(valorSalario, opcao.gozados, opcao.vendidos, deps);

  // A comparação que ninguém faz: vender dias muda o líquido, porque o
  // abono não sofre INSS nem imposto de renda.
  const soGozar = ferias(valorSalario, 30, 0, deps);
  const vendendo = ferias(valorSalario, 20, 10, deps);
  const diferenca = vendendo.liquido - soGozar.liquido;

  return (
    <CascaFerramenta
      nome="Férias"
      selo={
        <>
          <Palmtree className="h-3.5 w-3.5" />
          Com o terço constitucional
        </>
      }
      titulo="Quanto você recebe de férias"
      abertura="Férias vêm com um terço a mais por lei. E existe uma escolha que quase ninguém faz com número na mão: vender dez dias muda o que cai na conta, porque essa parte não paga imposto."
      fonte={
        <>
          Cálculo conforme a CLT: remuneração das férias mais um terço
          constitucional, com INSS e IRRF de 2026 incidindo apenas sobre a
          parte gozada. O abono pecuniário — a venda de até dez dias — e o terço
          sobre ele são isentos dos dois descontos.
        </>
      }
    >
      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="grid sm:grid-cols-2 gap-x-5 gap-y-4">
          <Campo
            label="Salário bruto"
            prefixo="R$"
            value={salario}
            onChange={setSalario}
          />
          <Campo
            label="Dependentes"
            value={dependentes}
            onChange={setDependentes}
            hint="Abatem da base do imposto."
          />
        </div>

        <div className="mt-5">
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            Como vai tirar
          </label>
          <div className="flex flex-wrap gap-2">
            {OPCOES.map((o, i) => (
              <button
                key={o.nome}
                type="button"
                onClick={() => setEscolha(i)}
                className={`h-9 rounded-xl px-3.5 text-sm font-semibold transition-colors ${
                  escolha === i
                    ? "bg-primary text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {o.nome}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5">
            A lei permite vender no máximo um terço das férias, ou seja, dez
            dias.
          </p>
        </div>
      </section>

      <Resultado
        rotulo="Você recebe"
        valor={brl(r.liquido)}
        nota={
          valorSalario > 0 ? (
            <>
              {brl(r.bruto)} de bruto, menos {brl(r.inss + r.irrf)} de INSS e
              imposto de renda.
            </>
          ) : null
        }
      />

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-slate-700">A composição</h2>
        <div className="divide-y divide-slate-100 mt-3">
          <Linha
            rotulo={`Férias (${r.diasGozados} dias)`}
            valor={brl(r.valorFerias)}
            tom="ganho"
          />
          <Linha
            rotulo="Terço constitucional"
            valor={brl(r.tercoFerias)}
            tom="ganho"
            detalhe="Um terço a mais, garantido pela Constituição."
          />
          {r.abono > 0 && (
            <>
              <Linha
                rotulo={`Abono (${r.diasVendidos} dias vendidos)`}
                valor={brl(r.abono)}
                tom="ganho"
                detalhe="Isento de INSS e de imposto de renda."
              />
              <Linha
                rotulo="Terço sobre o abono"
                valor={brl(r.tercoAbono)}
                tom="ganho"
                detalhe="Também isento."
              />
            </>
          )}
          <Linha rotulo="INSS" valor={`− ${brl(r.inss)}`} tom="desconto" />
          <Linha
            rotulo="Imposto de renda"
            valor={`− ${brl(r.irrf)}`}
            tom="desconto"
          />
          <Linha rotulo="Líquido" valor={brl(r.liquido)} tom="total" />
        </div>
      </section>

      {valorSalario > 0 && (
        <section className="mt-6 rounded-2xl border border-accent/30 bg-accent/5 p-5">
          <h3 className="text-sm font-semibold text-slate-800">
            Tirar 30 dias ou vender 10?
          </h3>
          <p className="text-xs text-slate-600 mt-1.5 tabular-nums">
            Tirando os 30 dias você recebe {brl(soGozar.liquido)}. Tirando 20 e
            vendendo 10, recebe {brl(vendendo.liquido)} —{" "}
            <span className="font-semibold">
              {diferenca >= 0 ? `${brl(diferenca)} a mais` : `${brl(-diferenca)} a menos`}
            </span>
            . O bruto é o mesmo nos dois casos; o que muda é o imposto, porque o
            abono é isento. A conta é essa, mas dez dias de descanso também
            valem alguma coisa.
          </p>
        </section>
      )}

      <section className="mt-6 grid sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-700">
            Quando você tem direito
          </h3>
          <p className="text-xs text-slate-500 mt-1.5">
            A cada doze meses trabalhados nasce o direito a 30 dias. A empresa
            tem os doze meses seguintes para conceder — passou disso, paga em
            dobro. As férias podem ser divididas em até três períodos, sendo um
            deles de no mínimo catorze dias.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-700">
            O pagamento vem antes
          </h3>
          <p className="text-xs text-slate-500 mt-1.5">
            A empresa é obrigada a pagar as férias até dois dias antes do início
            do descanso. Se o dinheiro só cair junto com o salário do mês
            seguinte, a regra foi descumprida.
          </p>
        </div>
      </section>
    </CascaFerramenta>
  );
}
