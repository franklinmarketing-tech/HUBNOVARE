"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight, Check, ScrollText } from "lucide-react";
import { pct } from "@/lib/calculos";
import { useArmazenado } from "@/lib/useArmazenado";

/* -------------------------------------------------------------------------- */

interface Item {
  id: string;
  titulo: string;
  porque: string;
  /** Ferramenta que resolve o item, quando existe uma. */
  destino?: string;
}

const ITENS: Item[] = [
  {
    id: "testamento",
    titulo: "Testamento feito",
    porque:
      "Sem testamento, a lei decide a divisão, e nem sempre é a divisão que você faria.",
  },
  {
    id: "inventario-digital",
    titulo: "Inventário digital feito",
    porque:
      "Contas, saldos e milhas que a família não conhece simplesmente se perdem.",
    destino: "/ferramentas/inventario",
  },
  {
    id: "seguros",
    titulo: "Seguros de vida revisados",
    porque:
      "O seguro paga rápido e sem inventário, cobrindo as contas dos primeiros meses.",
    destino: "/ferramentas/seguros",
  },
  {
    id: "beneficiarios",
    titulo: "Beneficiários da previdência atualizados",
    porque:
      "A indicação vale mais que qualquer combinado verbal, e costuma estar desatualizada.",
    destino: "/ferramentas/previdencia",
  },
  {
    id: "procuracao",
    titulo: "Procuração assinada",
    porque:
      "Se você ficar incapacitado, alguém precisa poder movimentar contas legalmente.",
  },
  {
    id: "diretivas",
    titulo: "Diretivas de saúde registradas",
    porque:
      "Deixar seus desejos por escrito evita que a família tenha que adivinhar na pior hora.",
  },
  {
    id: "bens",
    titulo: "Lista de bens organizada",
    porque:
      "O inventário começa por uma lista. Se ela não existe, a família monta do zero.",
    destino: "/ferramentas/patrimonio",
  },
  {
    id: "senhas",
    titulo: "Senhas acessíveis à família",
    porque:
      "Um cofre de senhas com acesso de emergência resolve em minutos o que travaria meses.",
  },
  {
    id: "conversa",
    titulo: "Conversa feita com os herdeiros",
    porque:
      "Quase toda briga de herança nasce de expectativa que nunca foi dita em voz alta.",
  },
  {
    id: "doacoes",
    titulo: "Doações em vida avaliadas",
    porque:
      "Antecipar parte da herança pode reduzir custo e conflito, se for bem estruturado.",
  },
];

/* -------------------------------------------------------------------------- */

export default function SucessorioPage() {
  const [marcados, setMarcados, carregado] = useArmazenado<
    Record<string, boolean>
  >("sucessorio", {});

  const feitos = useMemo(
    () => ITENS.filter((i) => marcados?.[i.id]).length,
    [marcados]
  );
  const progresso = (feitos / ITENS.length) * 100;

  const alternar = (id: string) =>
    setMarcados((atual) => ({ ...(atual ?? {}), [id]: !atual?.[id] }));

  const nenhum = carregado && feitos === 0;

  return (
    <div className="min-h-dvh bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <header className="border-b border-slate-200/70 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image
              src="/marca/logo-novare.png"
              alt="Novare"
              width={112}
              height={28}
              className="h-7 w-auto"
              priority
            />
          </Link>
          <span className="text-xs font-medium text-slate-500 hidden sm:block">
            Planejamento sucessório
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-16">
        <section className="pt-12 pb-8">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold mb-4">
            <ScrollText className="h-3.5 w-3.5" />
            Grátis, fica só no seu navegador
          </div>
          <h1 className="text-3xl sm:text-[2.6rem] leading-tight font-display font-bold text-primary">
            Dez decisões que a sua família vai agradecer
          </h1>
          <p className="text-slate-500 mt-3 max-w-xl">
            Planejamento sucessório não é sobre morrer. É sobre poupar quem você
            ama de uma sequência de decisões difíceis num momento péssimo. Marque
            o que já está resolvido.
          </p>
        </section>

        {/* Número-herói */}
        <section className="rounded-3xl bg-primary text-white p-7 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
            Plano sucessório completo
          </p>
          <p className="text-4xl sm:text-5xl font-black tabular-nums mt-2">
            {pct(progresso, 0)}
          </p>
          <div className="mt-4 h-2.5 rounded-full bg-white/15 overflow-hidden">
            <div
              className="h-full rounded-full bg-white transition-all"
              style={{ width: `${progresso}%` }}
            />
          </div>
          <p className="text-sm text-white/70 mt-3 tabular-nums">
            {nenhum
              ? "Nada marcado ainda. Comece pelo item mais fácil da lista."
              : `${feitos} de ${ITENS.length} itens resolvidos.`}
          </p>
        </section>

        {/* Por que importa */}
        <section className="mt-6 rounded-xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500">
            No Brasil, um inventário judicial costuma levar anos e consumir de
            4% a 20% do espólio entre impostos, custas e honorários. Boa parte
            desse custo e desse tempo nasce de coisas que dariam para resolver
            hoje, em uma tarde.
          </p>
        </section>

        {/* Checklist */}
        <section className="mt-6 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <h2 className="text-sm font-semibold text-slate-700 mb-1">
            O checklist
          </h2>
          <p className="text-[11px] text-slate-500 mb-4">
            Dez itens fixos. Alguns você resolve aqui mesmo, nas ferramentas
            linkadas.
          </p>

          <ul className="space-y-3">
            {ITENS.map((item) => {
              const feito = Boolean(marcados?.[item.id]);
              return (
                <li
                  key={item.id}
                  className={`rounded-2xl border p-5 transition-colors ${
                    feito
                      ? "border-primary/25 bg-primary/5"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => alternar(item.id)}
                      aria-pressed={feito}
                      aria-label={`Marcar ${item.titulo}`}
                      className={`mt-0.5 h-6 w-6 shrink-0 inline-flex items-center justify-center rounded-lg border transition-colors ${
                        feito
                          ? "border-primary bg-primary text-white"
                          : "border-slate-300 bg-white text-transparent hover:border-slate-400"
                      }`}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm font-semibold ${
                          feito ? "text-primary" : "text-slate-800"
                        }`}
                      >
                        {item.titulo}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {item.porque}
                      </p>
                      {item.destino ? (
                        <Link
                          href={item.destino}
                          className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary underline underline-offset-2"
                        >
                          Resolver nesta ferramenta
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Próximo passo */}
        <section className="mt-6 rounded-xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500">
            Guarde os papéis desse plano na{" "}
            <Link
              href="/ferramentas/documentos"
              className="font-semibold text-primary underline underline-offset-2"
            >
              Central de Documentos
            </Link>
            .
          </p>
        </section>


        <p className="mt-6 text-[11px] text-slate-500">
          Seus dados ficam somente no seu navegador.
        </p>
      </main>
    </div>
  );
}
