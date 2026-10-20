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
import { PonteResultado } from "@/components/PonteResultado";
import { AnaliseRaioXPrevidencia } from "@/components/analises/AnaliseRaioXPrevidencia";
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
        <h2 className="font-display text-lg font-semibold text-primary">
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

      {/* ⚠️ AQUI FICAVA O <IrisAjuda />, que preenchia estes campos a partir
          de um texto colado e explicava o jargão da seguradora. Dependia do
          gpt-4o-mini e saiu em 18/10/2026, quando a Íris deixou de consumir
          IA. Os campos continuam todos preenchíveis à mão, e a página
          explica cada um logo acima. */}

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
        <h2 className="font-display text-lg font-semibold text-primary">
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

      {/* A leitura de consultor dos mesmos números (20/10/2026). */}
      <AnaliseRaioXPrevidencia entrada={entrada} saida={saida} />

      {/* A ponte substituiu um convite próprio que dizia a mesma coisa sem
          mostrar o número. Com o valor na frente, a pergunta deixa de ser
          abstrata: "R$ 17.825 em taxas" cobra uma resposta. */}
      <PonteResultado
        valor={brl(Math.abs(saida.custoTotal))}
        rotulo="em taxas até o resgate"
        pergunta="Onde mais o seu dinheiro está vazando? Veja o conjunto."
      />
    </CascaFerramenta>
  );
}
