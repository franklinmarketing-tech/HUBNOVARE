"use client";

import Link from "next/link";
import { useState } from "react";
import { PiggyBank } from "lucide-react";
import { brl, parseNumero } from "@/lib/calculos";
import { ALIQUOTA_FGTS, fgts } from "@/lib/trabalhista";
import {
  Campo,
  CascaFerramenta,
  Linha,
  Resultado,
} from "@/components/CascaFerramenta";

export default function FgtsPage() {
  const [salario, setSalario] = useState("3000");
  const [meses, setMeses] = useState("24");
  const [saldoAnterior, setSaldoAnterior] = useState("0");

  const valorSalario = Math.max(0, parseNumero(salario));
  const qtdMeses = Math.max(0, Math.round(parseNumero(meses)) || 0);

  const r = fgts(valorSalario, qtdMeses, Math.max(0, parseNumero(saldoAnterior)));

  return (
    <CascaFerramenta
      nome="FGTS"
      selo={
        <>
          <PiggyBank className="h-3.5 w-3.5" />
          8% por mês, por fora do salário
        </>
      }
      titulo="Quanto tem no seu FGTS"
      abertura="O FGTS não sai do seu salário: a empresa deposita 8% por fora, todo mês, numa conta em seu nome. Na demissão sem justa causa ainda entra a multa de 40% — que é da empresa, não do seu saldo."
      fonte={
        <>
          Depósito mensal de {ALIQUOTA_FGTS * 100}% sobre a remuneração,
          conforme a Lei do FGTS. A projeção não inclui a correção do saldo (TR
          mais 3% ao ano), que costuma ficar abaixo da inflação — o saldo real
          na Caixa pode diferir. Consulte o valor exato no aplicativo do FGTS.
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
            label="Meses de trabalho"
            value={meses}
            onChange={setMeses}
            hint="Quantos meses de depósito."
          />
          <Campo
            label="Saldo que já existia"
            prefixo="R$"
            value={saldoAnterior}
            onChange={setSaldoAnterior}
            hint="De empregos anteriores, se houver."
          />
        </div>
      </section>

      <Resultado
        rotulo="Saldo estimado do FGTS"
        valor={brl(r.totalDepositado)}
        nota={
          valorSalario > 0 ? (
            <>
              {brl(r.depositoMensal)} por mês, durante {qtdMeses}{" "}
              {qtdMeses === 1 ? "mês" : "meses"}.
            </>
          ) : null
        }
      />

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-slate-700">
          E se você for demitido sem justa causa
        </h2>
        <div className="divide-y divide-slate-100 mt-3">
          <Linha
            rotulo="Depósito mensal"
            valor={brl(r.depositoMensal)}
            detalhe="8% do salário, pago pela empresa."
          />
          <Linha
            rotulo="Saldo acumulado"
            valor={brl(r.totalDepositado)}
            tom="ganho"
          />
          <Linha
            rotulo="Multa de 40%"
            valor={brl(r.multaRescisoria)}
            tom="ganho"
            detalhe="A empresa paga por cima do saldo. Não sai do seu dinheiro."
          />
          <Linha
            rotulo="Total a sacar"
            valor={brl(r.totalComMulta)}
            tom="total"
          />
        </div>
      </section>

      <section className="mt-6 grid sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-700">
            Quando dá para sacar
          </h3>
          <p className="text-xs text-slate-500 mt-1.5">
            Demissão sem justa causa, aposentadoria, compra da casa própria,
            doença grave e conta parada há três anos. Existe ainda o saque
            aniversário — que libera uma parte por ano, mas trava o saque
            integral se você for demitido.
          </p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <h3 className="text-sm font-semibold text-amber-900">
            Cuidado com o saque aniversário
          </h3>
          <p className="text-xs text-amber-800 mt-1.5">
            Ao aderir, você perde o direito de sacar o saldo inteiro numa
            demissão — recebe só a multa de 40%. Para quem tem emprego estável
            pode valer; para quem corre risco de ser desligado, costuma ser um
            mau negócio.
          </p>
        </div>
      </section>

      <section className="mt-6 rounded-2xl bg-slate-50 p-4">
        <p className="text-xs text-slate-500">
          <span className="font-semibold text-slate-700">
            O FGTS perde para a inflação.
          </span>{" "}
          O saldo é corrigido pela TR mais 3% ao ano, quase sempre menos do que
          o IPCA. Veja o tamanho do estrago em{" "}
          <Link
            href="/ferramentas/correcao"
            className="text-accent-strong font-medium underline underline-offset-2"
          >
            correção pela inflação
          </Link>{" "}
          — é por isso que ele não serve como reserva de longo prazo.
        </p>
      </section>
    </CascaFerramenta>
  );
}
