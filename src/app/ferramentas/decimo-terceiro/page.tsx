"use client";

import { useState } from "react";
import { Gift } from "lucide-react";
import { brl, parseNumero } from "@/lib/calculos";
import { decimoTerceiro } from "@/lib/trabalhista";
import {
  Campo,
  CascaFerramenta,
  Linha,
  Resultado,
} from "@/components/CascaFerramenta";

export default function DecimoTerceiroPage() {
  const [salario, setSalario] = useState("3000");
  const [meses, setMeses] = useState("12");
  const [dependentes, setDependentes] = useState("0");

  const valorSalario = Math.max(0, parseNumero(salario));
  const mesesTrabalhados = Math.max(
    0,
    Math.min(12, Math.round(parseNumero(meses)) || 0),
  );
  const deps = Math.max(0, Math.round(parseNumero(dependentes)) || 0);

  const r = decimoTerceiro(valorSalario, mesesTrabalhados, deps);

  return (
    <CascaFerramenta
      nome="13º salário"
      selo={
        <>
          <Gift className="h-3.5 w-3.5" />
          Duas parcelas, um desconto só
        </>
      }
      titulo="Quanto vem de 13º salário"
      abertura="O 13º chega em duas parcelas, e é aí que mora a surpresa: a primeira vem cheia, sem desconto nenhum. Todo o INSS e o imposto de renda caem de uma vez na segunda — por isso ela parece sempre menor do que deveria."
      fonte={
        <>
          Cálculo conforme a lei do 13º salário, proporcional aos meses
          trabalhados no ano. Mês com quinze dias ou mais conta inteiro. INSS e
          IRRF de 2026 são calculados sobre o 13º cheio e em separado do
          salário do mês, e descontados integralmente na segunda parcela.
        </>
      }
    >
      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="grid sm:grid-cols-3 gap-x-5 gap-y-4">
          <Campo
            label="Salário bruto"
            prefixo="R$"
            value={salario}
            onChange={setSalario}
          />
          <Campo
            label="Meses trabalhados no ano"
            value={meses}
            onChange={setMeses}
            hint="Mês com 15 dias ou mais conta inteiro."
          />
          <Campo
            label="Dependentes"
            value={dependentes}
            onChange={setDependentes}
          />
        </div>
      </section>

      <Resultado
        rotulo="13º líquido no ano"
        valor={brl(r.liquido)}
        nota={
          valorSalario > 0 ? (
            <>
              {brl(r.bruto)} de bruto{" "}
              {mesesTrabalhados < 12 && `(${mesesTrabalhados}/12 do salário) `}
              menos {brl(r.inss + r.irrf)} de descontos.
            </>
          ) : null
        }
      />

      <section className="mt-6 grid sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            1ª parcela · até 30 de novembro
          </p>
          <p className="text-2xl font-bold tabular-nums text-emerald-700 mt-1.5">
            {brl(r.primeiraParcela)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Metade do 13º, sem nenhum desconto. É por isso que ela parece
            generosa.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            2ª parcela · até 20 de dezembro
          </p>
          <p className="text-2xl font-bold tabular-nums text-slate-900 mt-1.5">
            {brl(r.segundaParcela)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            A outra metade menos TODO o INSS e o imposto do 13º.
          </p>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-slate-700">A conta inteira</h2>
        <div className="divide-y divide-slate-100 mt-3">
          <Linha rotulo="13º bruto" valor={brl(r.bruto)} tom="ganho" />
          <Linha
            rotulo="1ª parcela (adiantamento)"
            valor={brl(r.primeiraParcela)}
            detalhe="Paga sem desconto, até 30 de novembro."
          />
          <Linha rotulo="INSS" valor={`− ${brl(r.inss)}`} tom="desconto" />
          <Linha
            rotulo="Imposto de renda"
            valor={`− ${brl(r.irrf)}`}
            tom="desconto"
            detalhe="Calculado em separado do salário do mês."
          />
          <Linha
            rotulo="2ª parcela"
            valor={brl(r.segundaParcela)}
            detalhe="O que sobra depois de todos os descontos."
          />
          <Linha rotulo="Total no ano" valor={brl(r.liquido)} tom="total" />
        </div>
      </section>

      <section className="mt-6 rounded-2xl bg-slate-50 p-4">
        <p className="text-xs text-slate-500">
          <span className="font-semibold text-slate-700">
            Por que a segunda parcela vem tão menor?
          </span>{" "}
          Porque os descontos do 13º inteiro saem todos dela. Se o seu 13º bruto
          é {brl(r.bruto)}, o desconto de {brl(r.inss + r.irrf)} não se divide
          entre as duas parcelas: cai inteiro na de dezembro. Contar com metade
          exata em dezembro é o erro clássico de orçamento de fim de ano.
        </p>
      </section>
    </CascaFerramenta>
  );
}
