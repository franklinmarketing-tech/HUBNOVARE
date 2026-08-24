"use client";

import Link from "next/link";
import { useState } from "react";
import { FileText } from "lucide-react";
import { brl, parseNumero } from "@/lib/calculos";
import { rescisao, type MotivoRescisao } from "@/lib/trabalhista";
import {
  Campo,
  CascaFerramenta,
  Linha,
  Resultado,
} from "@/components/CascaFerramenta";
import { PreenchimentoIA } from "@/components/PreenchimentoIA";

const MOTIVOS: Array<{ chave: MotivoRescisao; nome: string; nota: string }> = [
  {
    chave: "sem-justa-causa",
    nome: "Demitido sem justa causa",
    nota: "Recebe tudo: aviso prévio, multa de 40%, saque do FGTS e seguro-desemprego.",
  },
  {
    chave: "pedido-demissao",
    nome: "Pedi demissão",
    nota: "Sem aviso indenizado, sem multa, sem saque do FGTS e sem seguro-desemprego.",
  },
  {
    chave: "acordo",
    nome: "Acordo entre as partes",
    nota: "Aviso e multa pela metade, saque de 80% do FGTS, sem seguro-desemprego.",
  },
  {
    chave: "justa-causa",
    nome: "Demitido por justa causa",
    nota: "Só saldo de salário e férias vencidas, se houver.",
  },
];

export default function RescisaoPage() {
  const [salario, setSalario] = useState("3000");
  const [meses, setMeses] = useState("24");
  const [dias, setDias] = useState("15");
  const [saldoFgts, setSaldoFgts] = useState("5760");
  const [motivo, setMotivo] = useState<MotivoRescisao>("sem-justa-causa");
  const [vencidas, setVencidas] = useState(false);

  const r = rescisao(
    Math.max(0, parseNumero(salario)),
    Math.max(0, Math.round(parseNumero(meses)) || 0),
    Math.max(0, Math.round(parseNumero(dias)) || 0),
    motivo,
    vencidas,
    Math.max(0, parseNumero(saldoFgts)),
  );

  const escolhido = MOTIVOS.find((m) => m.chave === motivo)!;
  const totalNaMao = r.totalLiquido + r.saqueFgts;

  return (
    <CascaFerramenta
      nome="Rescisão"
      selo={
        <>
          <FileText className="h-3.5 w-3.5" />
          Regras da CLT, tabelas de 2026
        </>
      }
      titulo="Quanto você tem a receber na saída"
      abertura="Demissão vem com uma conta cheia de parcelas — e nem todas aparecem no papel que a empresa entrega. Aqui cada verba é separada, para você conferir se está tudo lá antes de assinar."
      fonte={
        <>
          Cálculo conforme a CLT, com INSS e IRRF de 2026 incidindo sobre saldo
          de salário e 13º. Aviso prévio indenizado, férias indenizadas, multa e
          saque do FGTS não sofrem esses descontos. Verbas de acordo coletivo da
          sua categoria não entram aqui.
        </>
      }
    >
      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            Como foi o desligamento
          </label>
          <div className="grid sm:grid-cols-2 gap-2">
            {MOTIVOS.map((m) => (
              <button
                key={m.chave}
                type="button"
                onClick={() => setMotivo(m.chave)}
                className={`rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold transition-colors ${
                  motivo === m.chave
                    ? "bg-primary text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {m.nome}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5">{escolhido.nota}</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-x-5 gap-y-4 mt-5">
          <Campo
            label="Último salário"
            prefixo="R$"
            value={salario}
            onChange={setSalario}
          />
          <Campo
            label="Tempo de empresa"
            sufixo="meses"
            value={meses}
            onChange={setMeses}
            hint="Conta o aviso prévio: 30 dias mais 3 por ano."
          />
          <Campo
            label="Dias trabalhados no mês da saída"
            value={dias}
            onChange={setDias}
            hint="Vira o saldo de salário."
          />
          <Campo
            label="Saldo do FGTS"
            prefixo="R$"
            value={saldoFgts}
            onChange={setSaldoFgts}
            hint="Veja no app FGTS. É a base da multa."
          />
        </div>

        <PreenchimentoIA
          contexto="Calculadora de rescisão CLT: precisa do último salário, tempo de empresa em meses, dias trabalhados no mês da saída e o saldo do FGTS."
          exemplo="Ex.: fui demitido dia 15, ganhava 3.200 e trabalhei 3 anos lá. FGTS tem uns 9 mil"
          campos={[
            { nome: "salario", descricao: "salário", aplicar: setSalario },
            { nome: "meses", descricao: "tempo de empresa", aplicar: setMeses },
            { nome: "dias", descricao: "dias trabalhados", aplicar: setDias },
            { nome: "saldoFgts", descricao: "saldo do FGTS", aplicar: setSaldoFgts },
          ]}
        />

        <label className="mt-4 flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={vencidas}
            onChange={(e) => setVencidas(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 accent-[var(--color-accent)]"
          />
          <span className="text-sm text-slate-600">
            Tenho férias vencidas não tiradas
          </span>
        </label>
      </section>

      <Resultado
        rotulo="Total a receber"
        valor={brl(totalNaMao)}
        nota={
          r.saqueFgts > 0 ? (
            <>
              {brl(r.totalLiquido)} na rescisão mais {brl(r.saqueFgts)} de FGTS
              liberado para saque.
            </>
          ) : (
            "Já com INSS e imposto de renda descontados."
          )
        }
      />

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-slate-700">
          Verba por verba
        </h2>
        <p className="text-[11px] text-slate-500 mt-0.5 mb-3">
          Confira contra o termo de rescisão que a empresa entregar.
        </p>

        <div className="divide-y divide-slate-100">
          <Linha
            rotulo="Saldo de salário"
            valor={brl(r.saldoSalario)}
            tom="ganho"
            detalhe="Os dias que você trabalhou no mês da saída."
          />
          {r.avisoPrevio > 0 && (
            <Linha
              rotulo="Aviso prévio indenizado"
              valor={brl(r.avisoPrevio)}
              tom="ganho"
              detalhe={`${r.diasAviso} dias: 30 mais 3 por ano de casa.`}
            />
          )}
          {r.decimoProporcional > 0 && (
            <Linha
              rotulo="13º proporcional"
              valor={brl(r.decimoProporcional)}
              tom="ganho"
            />
          )}
          {r.feriasVencidas > 0 && (
            <Linha
              rotulo="Férias vencidas + 1/3"
              valor={brl(r.feriasVencidas)}
              tom="ganho"
            />
          )}
          {r.feriasProporcionais > 0 && (
            <Linha
              rotulo="Férias proporcionais + 1/3"
              valor={brl(r.feriasProporcionais + r.tercoFerias)}
              tom="ganho"
            />
          )}
          {r.multaFgts > 0 && (
            <Linha
              rotulo="Multa do FGTS"
              valor={brl(r.multaFgts)}
              tom="ganho"
              detalhe={
                motivo === "acordo"
                  ? "20% no acordo, metade da multa cheia."
                  : "40% sobre tudo o que foi depositado."
              }
            />
          )}
          <Linha rotulo="INSS" valor={`− ${brl(r.inss)}`} tom="desconto" />
          <Linha
            rotulo="Imposto de renda"
            valor={`− ${brl(r.irrf)}`}
            tom="desconto"
          />
          <Linha
            rotulo="Líquido da rescisão"
            valor={brl(r.totalLiquido)}
            tom="total"
          />
          {r.saqueFgts > 0 && (
            <Linha
              rotulo="FGTS liberado para saque"
              valor={brl(r.saqueFgts)}
              tom="ganho"
              detalhe="Sai direto da Caixa, não da empresa."
            />
          )}
        </div>
      </section>

      {r.temSeguroDesemprego ? (
        <section className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <h3 className="text-sm font-semibold text-emerald-900">
            Você tem direito ao seguro-desemprego
          </h3>
          <p className="text-xs text-emerald-800 mt-1.5">
            Demissão sem justa causa dá direito ao benefício, se você cumprir o
            tempo mínimo de trabalho.{" "}
            <Link
              href="/ferramentas/seguro-desemprego"
              className="font-medium underline underline-offset-2"
            >
              Calcule o valor e quantas parcelas
            </Link>
            .
          </p>
        </section>
      ) : (
        <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <h3 className="text-sm font-semibold text-amber-900">
            Sem seguro-desemprego nesse caso
          </h3>
          <p className="text-xs text-amber-800 mt-1.5">
            O benefício só existe na demissão sem justa causa. Pedido de
            demissão, acordo e justa causa não dão direito.
          </p>
        </section>
      )}
    </CascaFerramenta>
  );
}
