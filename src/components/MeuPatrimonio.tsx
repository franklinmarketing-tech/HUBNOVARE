"use client";

import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { TIPOS_PATRIMONIO } from "@/lib/planejamento/catalogos";
import { NumeroContado } from "@/components/NumeroContado";
import type { DadosPlanejamento } from "@/app/planejamento/app/usePlanejamento";

/**
 * "O que é meu" — o bloco que faz o Workspace parecer da pessoa.
 *
 * Um painel de saúde financeira mostra COMO ela está; este mostra O QUE ela
 * tem. É a diferença entre consultar um relatório e abrir a própria casa:
 * os bens aparecem com nome e valor, o líquido é a conta que ela faria de
 * cabeça, e o botão de somar mais um item está sempre à mão.
 *
 * Nada aqui é inventado nem estimado: só o que a pessoa cadastrou. Um bem
 * que ela não informou não aparece — inflar patrimônio com "estimativa de
 * mercado" seria mentir sobre o dinheiro dos outros.
 */

const brl = (v: number) =>
  v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });

const EMOJI = new Map(TIPOS_PATRIMONIO.map((t) => [t.valor, t.emoji]));

export function MeuPatrimonio({ dados }: { dados: DadosPlanejamento }) {
  const { diagnostico, retrato } = dados;

  const bens = [...retrato.patrimonio]
    .map((b) => ({
      id: b.id,
      tipo: b.type,
      nome: b.description?.trim() || b.type,
      valor: b.estimated_value ?? 0,
    }))
    .filter((b) => b.valor > 0)
    .sort((a, b) => b.valor - a.valor);

  const total = diagnostico.patrimonioTotal;
  const dividas = diagnostico.dividaTotal;
  const liquido = diagnostico.patrimonioLiquido;

  // A barra compara bens e dívidas na MESMA régua. Sem isso, duas barras de
  // 100% lado a lado sugeririam que a dívida iguala o patrimônio.
  const regua = Math.max(total, dividas, 1);

  return (
    <section
      className="glass-card cine rounded-3xl bg-white p-6 shadow-card ring-1 ring-primary/10 lg:col-span-2"
      style={{ transitionDelay: "320ms" }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          {/* O título da seção já diz "O que é meu" — repetir aqui só
              gastava uma linha. Este rótulo nomeia o NÚMERO. */}
          <p className="text-2xs font-bold uppercase tracking-[0.14em] text-ciano-forte">
            Patrimônio líquido
          </p>
          <NumeroContado
            valor={liquido}
            formatar={brl}
            className="mt-3 block font-display text-4xl font-black leading-none tabular-nums text-primary"
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            O que você tem, menos o que deve
          </p>
        </div>

        <Link
          href="/planejamento/app/meus-dados"
          className="group inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-primary-soft"
        >
          <Plus className="h-3.5 w-3.5" />
          Adicionar um bem
        </Link>
      </div>

      {/* As duas réguas, na mesma escala. */}
      <div className="mt-6 space-y-3">
        <Régua
          rotulo="Bens e investimentos"
          valor={total}
          pct={(total / regua) * 100}
          tom="bg-ciano"
        />
        <Régua
          rotulo="Dívidas"
          valor={dividas}
          pct={(dividas / regua) * 100}
          tom="bg-accent"
        />
      </div>

      {bens.length > 0 ? (
        <ul className="mt-6 grid gap-1.5 sm:grid-cols-2">
          {bens.slice(0, 6).map((b) => (
            <li
              key={b.id}
              className="flex items-center gap-2.5 rounded-xl bg-gelo px-3 py-2"
            >
              <span className="text-base" aria-hidden>
                {EMOJI.get(b.tipo) ?? "✨"}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold text-foreground">
                  {b.nome}
                </span>
                <span className="block truncate text-[10px] uppercase tracking-wide text-muted-foreground">
                  {b.tipo}
                </span>
              </span>
              <span className="shrink-0 text-xs font-bold tabular-nums text-primary">
                {brl(b.valor)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-6 rounded-xl bg-gelo px-4 py-3 text-xs text-muted-foreground">
          Você ainda não cadastrou nenhum bem. Conta, investimento, imóvel,
          carro — o que entrar aqui passa a contar no seu plano.
        </p>
      )}

      {bens.length > 6 && (
        <Link
          href="/planejamento/app/meus-dados"
          className="group mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-accent-strong"
        >
          Ver os {bens.length} itens
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </section>
  );
}

function Régua({
  rotulo,
  valor,
  pct,
  tom,
}: {
  rotulo: string;
  valor: number;
  pct: number;
  tom: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs font-semibold text-foreground">{rotulo}</span>
        <span className="text-xs font-bold tabular-nums text-muted-foreground">
          {brl(valor)}
        </span>
      </div>
      <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-primary/8">
        <div
          className={`h-full rounded-full ${tom} transition-[width] duration-1000`}
          style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------ */

/**
 * "Seu retrato" — o quanto do Workspace já está alimentado.
 *
 * É o bloco que transforma o painel em algo que se CONSTRÓI. Cada linha
 * preenchida melhora o cálculo do plano, e a barra diz isso sem cobrar:
 * quem vê 3 de 5 entende sozinho o que falta.
 */
export function MeuRetrato({ dados }: { dados: DadosPlanejamento }) {
  const { retrato } = dados;

  const linhas = [
    { rotulo: "Rendas", n: retrato.rendas.length, href: "/planejamento/app/meus-dados" },
    { rotulo: "Despesas", n: retrato.despesas.length, href: "/planejamento/app/meus-dados" },
    { rotulo: "Bens", n: retrato.patrimonio.length, href: "/planejamento/app/meus-dados" },
    { rotulo: "Dívidas", n: retrato.dividas.length, href: "/planejamento/app/meus-dados" },
    { rotulo: "Seguros", n: retrato.seguros.length, href: "/planejamento/app/meus-dados" },
  ];

  // Dívida e seguro zerados são uma resposta legítima ("não tenho"), então
  // completude aqui é "quantos blocos você já visitou", não "quantos itens".
  const preenchidos = linhas.filter((l) => l.n > 0).length;
  const pct = Math.round((preenchidos / linhas.length) * 100);

  return (
    <section
      className="glass-card cine rounded-3xl bg-white p-5 shadow-card ring-1 ring-primary/10"
      style={{ transitionDelay: "380ms" }}
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-2xs font-bold uppercase tracking-[0.14em] text-ciano-forte">
          Seu retrato
        </p>
        <span className="text-xs font-bold tabular-nums text-primary">
          {preenchidos}/{linhas.length}
        </span>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-primary/10">
        <div
          className="h-full rounded-full bg-success transition-[width] duration-1000"
          style={{ width: `${pct}%` }}
        />
      </div>

      <ul className="mt-4 space-y-1.5">
        {linhas.map((l) => (
          <li key={l.rotulo} className="flex items-center justify-between gap-3">
            <span className="text-xs text-foreground">{l.rotulo}</span>
            {l.n > 0 ? (
              <span className="text-xs font-bold tabular-nums text-primary">
                {l.n}
              </span>
            ) : (
              <Link
                href={l.href}
                className="text-[11px] font-bold text-accent-strong hover:underline"
              >
                adicionar
              </Link>
            )}
          </li>
        ))}
      </ul>

      <p className="mt-4 text-[11px] leading-snug text-muted-foreground">
        Quanto mais completo, mais preciso fica o seu plano.
      </p>
    </section>
  );
}
