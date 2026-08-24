"use client";

import Link from "next/link";
import { useState } from "react";
import { Wallet } from "lucide-react";
import { brl, parseNumero, pct } from "@/lib/calculos";
import {
  DESCONTO_SIMPLIFICADO,
  FIM_DO_REDUTOR,
  TETO_ISENCAO,
  salarioLiquido,
} from "@/lib/trabalhista";
import {
  Campo,
  CascaFerramenta,
  Linha,
  Resultado,
} from "@/components/CascaFerramenta";
import { PreenchimentoIA } from "@/components/PreenchimentoIA";

export default function SalarioLiquidoPage() {
  const [bruto, setBruto] = useState("5000");
  const [dependentes, setDependentes] = useState("0");
  const [pensao, setPensao] = useState("0");
  const [outros, setOutros] = useState("0");

  const valorBruto = Math.max(0, parseNumero(bruto));
  const qtdDependentes = Math.max(0, Math.round(parseNumero(dependentes)) || 0);

  const r = salarioLiquido(
    valorBruto,
    qtdDependentes,
    Math.max(0, parseNumero(outros)),
    Math.max(0, parseNumero(pensao)),
  );

  const isentoPeloRedutor = r.detalheIrrf.economiaDoRedutor > 0;
  const naFaixaDaIsencao = valorBruto > 0 && valorBruto <= TETO_ISENCAO;

  return (
    <CascaFerramenta
      nome="Salário líquido"
      selo={
        <>
          <Wallet className="h-3.5 w-3.5" />
          Tabelas oficiais de 2026
        </>
      }
      titulo="Quanto do seu salário chega na conta"
      abertura="O valor combinado na carteira não é o que cai no banco. Entre um e outro passam o INSS e o imposto de renda — e 2026 mudou a regra: quem ganha até R$ 5.000 por mês ficou isento de IR."
      fonte={
        <>
          Tabela do INSS e do IRRF vigentes em 2026, incluindo o redutor que
          isenta rendimentos de até {brl(TETO_ISENCAO)} e vai diminuindo até{" "}
          {brl(FIM_DO_REDUTOR)}. Considera o desconto simplificado de{" "}
          {brl(DESCONTO_SIMPLIFICADO)} quando ele for mais vantajoso, como faz a
          folha de pagamento. Não inclui vale-transporte, plano de saúde nem
          acordos de categoria.
        </>
      }
    >
      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="grid sm:grid-cols-2 gap-x-5 gap-y-4">
          <Campo
            label="Salário bruto"
            prefixo="R$"
            value={bruto}
            onChange={setBruto}
            hint="O valor registrado na carteira, por mês."
          />
          <Campo
            label="Dependentes"
            value={dependentes}
            onChange={setDependentes}
            hint="Cada um abate R$ 189,59 da base do imposto."
          />
          <Campo
            label="Pensão alimentícia"
            prefixo="R$"
            value={pensao}
            onChange={setPensao}
            hint="Se houver decisão judicial. Abate do imposto."
          />
          <Campo
            label="Outros descontos"
            prefixo="R$"
            value={outros}
            onChange={setOutros}
            hint="Vale-transporte, plano de saúde, adiantamentos."
          />
        </div>

        <PreenchimentoIA
          contexto="Calculadora de salário líquido CLT: precisa do salário bruto mensal, número de dependentes, pensão alimentícia e outros descontos do holerite."
          exemplo="Ex.: ganho 4.200 de carteira, tenho 2 filhos e descontam 180 do plano de saúde"
          campos={[
            { nome: "bruto", descricao: "salário bruto", aplicar: setBruto },
            { nome: "dependentes", descricao: "dependentes", aplicar: setDependentes },
            { nome: "pensao", descricao: "pensão", aplicar: setPensao },
            { nome: "outros", descricao: "outros descontos", aplicar: setOutros },
          ]}
        />
      </section>

      <Resultado
        rotulo="Cai na sua conta"
        valor={brl(r.liquido)}
        nota={
          valorBruto > 0 ? (
            <>
              De {brl(r.bruto)} saem {brl(r.bruto - r.liquido)} em descontos —{" "}
              {pct(r.mordidaPct, 1)} do bruto.
            </>
          ) : null
        }
      />

      {naFaixaDaIsencao && (
        <section className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <h3 className="text-sm font-semibold text-emerald-900">
            Você está na faixa isenta de imposto de renda
          </h3>
          <p className="text-xs text-emerald-800 mt-1.5">
            Desde 2026, quem recebe até {brl(TETO_ISENCAO)} por mês não paga IR
            na fonte. Acima disso a isenção não some de uma vez: ela vai
            encolhendo até acabar em {brl(FIM_DO_REDUTOR)}.
          </p>
        </section>
      )}

      {isentoPeloRedutor && !naFaixaDaIsencao && (
        <section className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <h3 className="text-sm font-semibold text-emerald-900">
            A regra nova de 2026 te economizou{" "}
            {brl(r.detalheIrrf.economiaDoRedutor)} este mês
          </h3>
          <p className="text-xs text-emerald-800 mt-1.5">
            Pela tabela antiga o imposto seria{" "}
            {brl(r.irrf + r.detalheIrrf.economiaDoRedutor)}. O redutor derrubou
            para {brl(r.irrf)} — são{" "}
            {brl(r.detalheIrrf.economiaDoRedutor * 12)} no ano.
          </p>
        </section>
      )}

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-slate-700">
          O caminho do seu dinheiro
        </h2>
        <p className="text-[11px] text-slate-500 mt-0.5 mb-3">
          É o que estaria escrito no holerite, linha por linha.
        </p>

        <div className="divide-y divide-slate-100">
          <Linha rotulo="Salário bruto" valor={brl(r.bruto)} tom="ganho" />
          <Linha
            rotulo="INSS"
            valor={`− ${brl(r.inss)}`}
            tom="desconto"
            detalhe="Previdência. Garante aposentadoria, auxílio-doença e pensão."
          />
          <Linha
            rotulo="Imposto de renda"
            valor={`− ${brl(r.irrf)}`}
            tom="desconto"
            detalhe={
              r.irrf === 0
                ? "Isento pela regra de 2026."
                : r.detalheIrrf.deducaoUsada === "simplificado"
                  ? `Pelo desconto simplificado, que saiu mais barato. Base de ${brl(r.detalheIrrf.base)}.`
                  : `Pelas deduções legais. Base de ${brl(r.detalheIrrf.base)}.`
            }
          />
          {r.outrosDescontos > 0 && (
            <Linha
              rotulo="Pensão e outros descontos"
              valor={`− ${brl(r.outrosDescontos)}`}
              tom="desconto"
            />
          )}
          <Linha rotulo="Líquido" valor={brl(r.liquido)} tom="total" />
        </div>
      </section>

      <section className="mt-6 grid sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-700">
            O que o INSS não é
          </h3>
          <p className="text-xs text-slate-500 mt-1.5">
            Não é imposto perdido: é o que garante aposentadoria,
            auxílio-doença, salário-maternidade e pensão para a família. O teto
            de contribuição também limita o benefício lá na frente — quem ganha
            acima dele precisa de previdência própria.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-700">
            Ganhou aumento e o líquido subiu pouco?
          </h3>
          <p className="text-xs text-slate-500 mt-1.5">
            É a tabela progressiva: só a parte que passa de cada faixa paga a
            alíquota maior. Entre {brl(TETO_ISENCAO)} e {brl(FIM_DO_REDUTOR)} o
            efeito é mais forte, porque a isenção vai sendo retirada aos poucos
            conforme o salário cresce.
          </p>
        </div>
      </section>

      <section className="mt-6 rounded-2xl bg-slate-50 p-4">
        <p className="text-xs text-slate-500">
          Vai receber férias, 13º ou foi desligado? Cada um tem regra própria de
          desconto:{" "}
          <Link
            href="/ferramentas/ferias"
            className="text-accent-strong font-medium underline underline-offset-2"
          >
            férias
          </Link>
          ,{" "}
          <Link
            href="/ferramentas/decimo-terceiro"
            className="text-accent-strong font-medium underline underline-offset-2"
          >
            13º salário
          </Link>{" "}
          e{" "}
          <Link
            href="/ferramentas/rescisao"
            className="text-accent-strong font-medium underline underline-offset-2"
          >
            rescisão
          </Link>
          .
        </p>
      </section>
    </CascaFerramenta>
  );
}
