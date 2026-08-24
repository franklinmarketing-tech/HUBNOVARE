"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, ShieldAlert } from "lucide-react";
import { brl, parseNumero, pct } from "@/lib/calculos";
import {
  Campo,
  CascaFerramenta,
  Linha,
  Resultado,
} from "@/components/CascaFerramenta";
import { IrisAjuda } from "@/components/IrisAjuda";
import {
  auditarPrevidencia,
  classificarTaxa,
  REFERENCIA,
} from "@/lib/previdencia";

/**
 * O Raio-X da previdência privada.
 *
 * Esta é a ferramenta que só uma casa sem comissão pode publicar: ela
 * mostra o que as taxas de um plano custam, em reais, até o resgate.
 *
 * Ela NÃO diz "troque de plano" nem indica produto — isso seria
 * recomendação, e recomendação tem regra própria. Ela mostra o número e
 * abre a conversa.
 */
export default function RaioXPrevidencia() {
  const [saldo, setSaldo] = useState("50.000");
  const [aporte, setAporte] = useState("1.000");
  const [anos, setAnos] = useState("25");
  const [rendimento, setRendimento] = useState("9");
  const [taxaAdm, setTaxaAdm] = useState("2,3");
  const [carregamento, setCarregamento] = useState("3");

  const r = useMemo(() => {
    const entrada = {
      saldo: parseNumero(saldo),
      aporteMensal: parseNumero(aporte),
      anos: Math.min(parseNumero(anos) || 0, 60),
      rentabilidadeAnualPct: parseNumero(rendimento),
      taxaAdmPct: parseNumero(taxaAdm),
      carregamentoPct: parseNumero(carregamento),
    };
    return { entrada, saida: auditarPrevidencia(entrada) };
  }, [saldo, aporte, anos, rendimento, taxaAdm, carregamento]);

  const { entrada, saida } = r;
  const veredito = classificarTaxa(entrada.taxaAdmPct);
  const caro = saida.custoTotal > 0;
  const anosPerdidos = saida.mesesDeAposentadoriaPerdidos / 12;

  return (
    <CascaFerramenta
      nome="Raio-X da Previdência"
      selo={
        <>
          <ShieldAlert className="h-3.5 w-3.5" />
          Auditoria sem comissão
        </>
      }
      titulo="Quanto a taxa da sua previdência vai custar"
      abertura="Ninguém que ganha comissão vai te mostrar esta conta. Preencha os dados do seu plano — estão no extrato que a seguradora manda — e veja o que as taxas levam até o resgate."
      fonte={
        <>
          A régua de comparação é um plano de custo baixo:{" "}
          {pct(REFERENCIA.taxaAdmPct)} ao ano de administração e sem
          carregamento. A taxa de administração incide sobre o patrimônio; o
          carregamento, sobre cada aporte. Projeção, não promessa de
          rentabilidade — e sem considerar imposto de renda no resgate.
        </>
      }
    >
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_2px_12px_-8px_hsl(215_50%_23%_/_0.4)]">
        <h2 className="font-display text-lg font-bold text-primary">
          Os dados do seu plano
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          As duas taxas estão no extrato, geralmente na primeira página. Se
          não achar, ligue na seguradora e pergunte: “qual a taxa de
          administração e a de carregamento do meu plano?”
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Campo
            label="Saldo acumulado hoje"
            value={saldo}
            onChange={setSaldo}
            prefixo="R$"
          />
          <Campo
            label="Aporte mensal"
            value={aporte}
            onChange={setAporte}
            prefixo="R$"
            hint="Zero se o plano está parado"
          />
          <Campo
            label="Anos até usar o dinheiro"
            value={anos}
            onChange={setAnos}
            sufixo="anos"
          />
          <Campo
            label="Rendimento esperado"
            value={rendimento}
            onChange={setRendimento}
            sufixo="% a.a."
            hint="Antes das taxas"
          />
          <Campo
            label="Taxa de administração"
            value={taxaAdm}
            onChange={setTaxaAdm}
            sufixo="% a.a."
          />
          <Campo
            label="Taxa de carregamento"
            value={carregamento}
            onChange={setCarregamento}
            sufixo="% do aporte"
          />
        </div>
      </section>

      {/* A Íris preenche a partir do texto do extrato e explica os campos.
          "Taxa de carregamento" é jargão de seguradora — sem alguém para
          explicar, a pessoa fecha a aba. */}
      <IrisAjuda
        contexto="Raio-X da previdência privada: calcula quanto as taxas do plano (administração e carregamento) custam, em reais, até o resgate."
        exemplo="Cole aqui o que diz o seu extrato, ou escreva do seu jeito: 'tenho 80 mil na previdência do banco, ponho 1500 por mês, taxa de administração 2,1% e carregamento 2%, quero resgatar em 20 anos'"
        duvidasFrequentes={[
          "Onde acho a taxa de carregamento?",
          "O que é taxa de administração?",
          "Qual rendimento devo colocar?",
          "PGBL e VGBL são a mesma coisa?",
        ]}
        campos={[
          { nome: "saldo", descricao: "saldo acumulado hoje no plano, em reais", aplicar: setSaldo },
          { nome: "aporte", descricao: "aporte mensal, em reais", aplicar: setAporte },
          { nome: "anos", descricao: "quantidade de ANOS (não meses) até começar a usar o dinheiro", aplicar: setAnos },
          { nome: "rendimento", descricao: "rendimento anual esperado em %, antes das taxas", aplicar: setRendimento },
          { nome: "taxaAdm", descricao: "taxa de administração anual em %", aplicar: setTaxaAdm },
          { nome: "carregamento", descricao: "taxa de carregamento em % sobre cada aporte", aplicar: setCarregamento },
        ]}
      />

      <Resultado
        rotulo={caro ? "As taxas vão levar" : "Seu plano está abaixo da régua"}
        valor={brl(Math.abs(saida.custoTotal))}
        tom={caro ? "alerta" : "normal"}
        nota={
          caro ? (
            <>
              É o que sobra a mais no plano de referência depois de{" "}
              {entrada.anos} anos, com os mesmos aportes. Equivale a{" "}
              <strong className="text-white">
                {anosPerdidos >= 1
                  ? `${anosPerdidos.toFixed(1).replace(".", ",")} anos`
                  : `${Math.round(saida.mesesDeAposentadoriaPerdidos)} meses`}
              </strong>{" "}
              de aposentadoria.
            </>
          ) : (
            <>
              Seu plano custa menos que a régua de {pct(REFERENCIA.taxaAdmPct)}{" "}
              ao ano. Aqui a taxa não é o problema.
            </>
          )
        }
      />

      <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6">
        <h2 className="font-display text-lg font-bold text-primary">
          De onde sai esse número
        </h2>
        <div className="mt-4">
          <Linha
            rotulo={`Com o seu plano (${pct(entrada.taxaAdmPct)} a.a.)`}
            valor={brl(saida.patrimonioReal)}
            detalhe={`Rende ${pct(saida.rentabilidadeLiquidaPct)} ao ano depois da taxa`}
          />
          <Linha
            rotulo={`No plano de referência (${pct(REFERENCIA.taxaAdmPct)} a.a.)`}
            valor={brl(saida.patrimonioReferencia)}
            tom="ganho"
            detalhe={`Rende ${pct(saida.rentabilidadeLiquidaReferenciaPct)} ao ano depois da taxa`}
          />
          <Linha
            rotulo="Diferença — o custo das taxas"
            valor={brl(saida.custoTotal)}
            tom="total"
          />
        </div>

        {saida.custoCarregamento > 0 && (
          <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <strong>{brl(saida.custoCarregamento)}</strong> desse total é
            carregamento: dinheiro retido na entrada de cada aporte, que nunca
            chegou a render. Você aporta {brl(entrada.aporteMensal)} e só{" "}
            {brl(entrada.aporteMensal * (1 - entrada.carregamentoPct / 100))}{" "}
            entram no plano.
          </p>
        )}

        <div
          className={`mt-4 rounded-xl px-4 py-3 text-sm ${
            veredito.veredito === "baixa"
              ? "bg-emerald-50 text-emerald-900"
              : veredito.veredito === "media"
                ? "bg-slate-100 text-slate-700"
                : "bg-red-50 text-red-900"
          }`}
        >
          <strong>{veredito.rotulo}.</strong> {veredito.explicacao}
        </div>
      </section>

      {/* O convite. Não indicamos produto — abrimos conversa. */}
      <section className="mt-6 rounded-3xl bg-gradient-to-br from-primary to-[hsl(215_55%_16%)] p-7 text-white">
        <h2 className="font-display text-xl font-bold">
          Achou um número que te incomodou?
        </h2>
        <p className="mt-2.5 text-sm leading-relaxed text-white/75">
          Esta conta olha uma peça só. Numa análise completa a gente vê o
          conjunto — previdência, consórcio, consignado, seguros — e mostra
          quanto você paga de taxa por ano, somando tudo.{" "}
          <strong className="text-white">A primeira análise é gratuita</strong>{" "}
          e a Novare não ganha comissão de produto nenhum, então não temos o
          que te vender no lugar.
        </p>
        <Link
          href="/consultoria"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-accent-btn px-5 py-3 text-sm font-bold text-accent-foreground transition-opacity hover:opacity-90"
        >
          Quero a análise gratuita
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </CascaFerramenta>
  );
}
