import Image from "next/image";
import {
  Bot,
  Check,
  Minus,
  ShieldCheck,
  Target,
  Users,
  Wallet,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import { BotaoAssinarPlano } from "@/components/BotaoAssinarPlano";
import type { PlanoAssinatura } from "@/lib/assinatura";
import {
  ASSINATURA_ECONOMIA_ROTULO,
  ASSINATURA_GARANTIA_DIAS,
  ASSINATURA_PRECO,
  ASSINATURA_PRECO_ANUAL_CHEIO_ROTULO,
  ASSINATURA_PRECO_ANUAL_ROTULO,
  ASSINATURA_PRECO_MENSAL,
  ASSINATURA_PRECO_MENSAL_ROTULO,
  ASSINATURA_PRECO_ROTULO,
} from "@/lib/lp-precos";
import { ANCORA, ECONOMIA_FRASE, GARANTIA, INCLUI_GRUPOS } from "@/lib/hub-lp";

/**
 * A OFERTA.
 *
 * ┌── A FORMA, E DE ONDE ELA VEM ────────────────────────────────────────┐
 * │ A composição é a das páginas de preço de SaaS que servem de          │
 * │ referência: cartões brancos numa fila, preço em corpo grande com a   │
 * │ unidade miúda e sublinhada ao lado, botão DENTRO do cartão, e a      │
 * │ lista do que entra logo ABAIXO dos cartões, agrupada por produto com │
 * │ um cabeçalho colorido por grupo e fios finos separando os grupos.    │
 * │                                                                       │
 * │ O plano recomendado ganha moldura em degradê e uma fita no topo — o  │
 * │ "POPULAR PLAN" da referência —, e é o único com o botão preenchido.  │
 * └───────────────────────────────────────────────────────────────────────┘
 *
 * ┌── DOIS PRAZOS, UM PRODUTO ───────────────────────────────────────────┐
 * │ A escolha na tela NÃO é entre um plano pobre e um rico: é só entre   │
 * │ pagar por mês ou pagar o ano. Por isso a lista do que entra aparece  │
 * │ UMA vez, embaixo dos dois — repeti-la lado a lado faz a pessoa       │
 * │ procurar a diferença que não existe, e desconfiar quando não acha.   │
 * │                                                                       │
 * │ O "de R$ 358,80 por R$ 238,80" é a única coisa parecida com preço    │
 * │ de/por aqui, e é real: 358,80 é a soma de doze mensalidades, e a     │
 * │ conta é derivada em `assinatura.ts`, não digitada.                   │
 * └───────────────────────────────────────────────────────────────────────┘
 *
 * ┌── A ÂNCORA, QUE FECHA O BLOCO ───────────────────────────────────────┐
 * │ O cérebro não calcula valor absoluto, só compara. Sem régua na tela  │
 * │ a pessoa compara o preço com ZERO, e zero sempre ganha.              │
 * │                                                                       │
 * │ A saída de manual seria inventar um plano caro para o real parecer   │
 * │ barato. Aqui a régua é o que essas mesmas coisas custam POR FORA, e  │
 * │ ela não tem botão: não é uma terceira opção. Fica ao lado da         │
 * │ garantia, fechando o bloco, porque é a última dúvida antes do        │
 * │ clique: "isso vale o que custa, e o que acontece se eu errar?".      │
 * └───────────────────────────────────────────────────────────────────────┘
 *
 * Sem contador regressivo, sem preço atrás de formulário e sem "grátis": a
 * oferta é pagar e ter uma semana para desistir. Ver `GARANTIA`.
 */

const ICONES: Record<string, LucideIcon> = { Wallet, Target, Bot, Wrench, Users };

const centavos = (v: number) =>
  String(Math.round((v % 1) * 100)).padStart(2, "0");

/* -------------------------------------------------------------- o cartão */

function Plano({
  etiqueta,
  fita,
  valor,
  unidade,
  cobranca,
  nota,
  rotuloBotao,
  plano,
}: {
  etiqueta: string;
  /** Qual oferta o botão compra. Sem isto o `BotaoAssinarPlano` cai no
      mensal, e o "Assinar o anual" abriria o checkout errado. */
  plano: PlanoAssinatura;
  /** Só o recomendado tem fita e moldura. */
  fita?: string;
  valor: number;
  unidade: string;
  cobranca: string;
  nota: React.ReactNode;
  rotuloBotao: string;
}) {
  const destaque = Boolean(fita);

  return (
    <div
      className={
        destaque
          ? "relative flex h-full flex-col overflow-hidden rounded-[28px] p-[3px] shadow-[0_30px_70px_-40px_rgba(10,21,33,0.5)]"
          : "relative flex h-full flex-col overflow-hidden rounded-[28px] border border-[#e3e0d8] bg-white"
      }
      style={
        destaque
          ? {
              background:
                "linear-gradient(150deg,#2596be 0%,#17789c 38%,#0b1626 100%)",
            }
          : undefined
      }
    >
      {destaque && (
        <p className="py-2.5 text-center text-[0.8125rem] font-bold uppercase tracking-[0.14em] text-white">
          {fita}
        </p>
      )}

      <div
        className={`flex flex-1 flex-col bg-white p-7 sm:p-8 ${
          destaque ? "rounded-[26px]" : ""
        }`}
      >
        <p className="nv-h3 !text-[1.625rem]">{etiqueta}</p>

        {/* o preço: número grande, unidade miúda e sublinhada ao lado */}
        <p className="mt-6 flex items-end gap-2 text-[#0a1521]">
          <span className="nv-numero text-[1.5rem] leading-none">R$</span>
          <span className="nv-numero text-[3.75rem] leading-[0.85]">
            {Math.floor(valor)}
          </span>
          <span className="nv-numero text-[1.5rem] leading-none">
            ,{centavos(valor)}
          </span>
          <span className="mb-0.5 text-[0.9375rem] font-medium tracking-[-0.01em] text-[#5b6d81] underline decoration-[#cfd9e3] underline-offset-4">
            {unidade}
          </span>
        </p>

        <p className="mt-4 text-[1.1875rem] leading-snug tracking-[-0.012em] text-[#46586e]">
          {cobranca}
        </p>

        <div className="mt-7">
          <BotaoAssinarPlano
            contexto="workspace"
            tamanho="grande"
            destaque={destaque}
            direto
            plano={plano}
            rotulo={rotuloBotao}
          />
        </div>

        <p className="mt-4 text-[1.1875rem] leading-snug tracking-[-0.012em] text-[#5b6d81]">
          {nota}
        </p>
      </div>
    </div>
  );
}


/* ----------------------------------------------------------- a seção ---- */

export function Preco() {
  return (
    <div className="mx-auto max-w-[68rem]">
      {/* A marca em cima dos cartões de preço: é onde a pessoa decide
          pagar, e onde ela mais precisa lembrar para QUEM está pagando. */}
      <Image
        src="/lp/novare-logo.png"
        alt="Novare"
        width={700}
        height={200}
        className="mx-auto mb-8 h-6 w-auto opacity-80"
      />

      {/* ------------------------------------------------- a linha do topo */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-3 sm:justify-between">
        {/* Não repete o lead da seção (que já diz "sem taxa, sem fidelidade"):
            aqui entra a informação que decide entre os dois cartões. */}
        <p className="text-[1.1875rem] font-medium tracking-[-0.015em] text-[#46586e]">
          Os dois liberam a casa inteira, já no primeiro dia.
        </p>
        <span className="inline-flex items-center gap-2 rounded-full bg-[#e7f4ec] px-4 py-2 text-[0.9375rem] font-semibold tracking-[-0.01em] text-[#1f7a4d]">
          <Check className="h-4 w-4" strokeWidth={3} />
          Economize {ASSINATURA_ECONOMIA_ROTULO} no anual
        </span>
      </div>

      {/* ------------------------------------------------------- os planos */}
      {/* `items-stretch` (o padrão) e `h-full` nos dois: os cartões têm
          textos de tamanhos diferentes e, soltos, terminariam em alturas
          diferentes — o que faz o mais curto parecer o plano menor. */}
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Plano
          etiqueta="Mensal"
          plano="mensal"
          valor={ASSINATURA_PRECO_MENSAL}
          unidade="/mês"
          cobranca="Cobrado todo mês. Não pedimos cartão."
          rotuloBotao="Assinar o mensal"
          nota="Sem compromisso de prazo: o mês que você paga é o mês que você usa, e no mês seguinte a decisão volta a ser sua."
        />

        <Plano
          etiqueta="Anual"
          plano="anual"
          fita="Plano recomendado"
          valor={ASSINATURA_PRECO}
          unidade="/mês"
          cobranca={`${ASSINATURA_PRECO_ANUAL_ROTULO} cobrados uma vez por ano.`}
          rotuloBotao="Assinar o anual"
          nota={
            <>
              De{" "}
              <span className="line-through decoration-[#a53a12]/60">
                {ASSINATURA_PRECO_ANUAL_CHEIO_ROTULO}
              </span>{" "}
              por {ASSINATURA_PRECO_ANUAL_ROTULO}. {ECONOMIA_FRASE}
            </>
          }
        />
      </div>

      {/* ------------------------------------------- o que entra, agrupado */}
      <div className="mt-5 overflow-hidden rounded-[28px] border border-[#e3e0d8] bg-white">
        <p className="border-b border-[#eceff3] px-7 py-5 text-[0.8125rem] font-bold uppercase tracking-[0.14em] text-[#5b6d81] sm:px-9">
          Tudo isto, nos dois planos
        </p>

        <div className="grid divide-y divide-[#eceff3] lg:grid-cols-3 lg:divide-x lg:divide-y-0">
          {/* Os dois primeiros grupos ocupam a coluna inteira de cada lado;
              os três menores dividem a terceira. É o que mantém as colunas
              com alturas parecidas sem espremer o Fin Cash, que é o maior. */}
          {[
            INCLUI_GRUPOS.slice(0, 1),
            INCLUI_GRUPOS.slice(1, 3),
            INCLUI_GRUPOS.slice(3),
          ].map((coluna, i) => (
            <div key={i} className="divide-y divide-[#eceff3]">
              {coluna.map((g) => {
                const Icone = ICONES[g.icone] ?? Wallet;
                return (
                  <div key={g.nome} className="px-7 py-7 sm:px-9">
                    <p className="flex items-center gap-2.5">
                      <span
                        className={`grid h-8 w-8 shrink-0 place-items-center rounded-[10px] ${g.tom}`}
                      >
                        <Icone className="h-4 w-4" strokeWidth={2} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[1.1875rem] font-semibold leading-tight tracking-[-0.018em] text-[#0a1521]">
                          {g.nome}
                        </span>
                        <span className="block text-[0.9375rem] font-medium tracking-[-0.01em] text-[#5b6d81]">
                          {g.resumo}
                        </span>
                      </span>
                    </p>

                    <ul className="mt-4 space-y-2.5">
                      {g.itens.map((item) => (
                        <li key={item} className="flex items-start gap-2.5">
                          <Check
                            className="mt-1 h-4 w-4 shrink-0 text-[#1f7a4d]"
                            strokeWidth={3}
                          />
                          <span className="text-[1.1875rem] leading-snug tracking-[-0.012em] text-[#46586e]">
                            {item}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* ------------------------------------------- a garantia e a régua */}
      <div className="mt-5 grid items-start gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="flex flex-col items-start gap-4 rounded-[28px] bg-[#eaf6fb] px-6 py-7 sm:flex-row sm:px-9">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-white text-[#17789c]">
            <ShieldCheck className="h-5 w-5" strokeWidth={1.9} />
          </span>
          <div className="min-w-0">
            <p className="nv-h4 !text-[1.1875rem]">{GARANTIA.titulo}</p>
            <p className="mt-2 text-[1.1875rem] leading-snug tracking-[-0.012em] text-[#46586e]">
              {GARANTIA.texto}
            </p>
          </div>
        </div>

        <aside className="rounded-[28px] bg-[#0b1626] px-7 py-7 text-white sm:px-9">
          <p className="nv-chapeu text-[#6dc6e6]">A régua</p>
          <p className="nv-h4 mt-4 !text-white">{ANCORA.titulo}</p>

          <ul className="mt-5 space-y-3">
            {ANCORA.linhas.map((l) => (
              <li key={l.item} className="flex gap-3">
                <span className="mt-1.5 grid h-5 w-5 shrink-0 place-items-center rounded-md bg-white/10 text-[#f08a5f]">
                  <Minus className="h-3 w-3" strokeWidth={3} />
                </span>
                <p className="min-w-0 text-[1.1875rem] leading-snug tracking-[-0.012em] text-white/75">
                  <span className="font-medium text-white">{l.item}</span>:{" "}
                  {l.custo}
                </p>
              </li>
            ))}
          </ul>

          <p className="mt-6 border-t border-white/12 pt-5 text-[1.1875rem] leading-snug tracking-[-0.012em] text-white/85">
            {ANCORA.fecho}
          </p>
        </aside>
      </div>

      <p className="mt-6 text-center text-[1.1875rem] leading-snug tracking-[-0.012em] text-[#5b6d81]">
        {ASSINATURA_PRECO_MENSAL_ROTULO}/mês no mensal, ou{" "}
        {ASSINATURA_PRECO_ANUAL_ROTULO} no ano — o equivalente a{" "}
        {ASSINATURA_PRECO_ROTULO}/mês. Cancelar continua sendo um clique, e a
        cobrança para na hora, com ou sem os {ASSINATURA_GARANTIA_DIAS} dias.
      </p>
    </div>
  );
}
