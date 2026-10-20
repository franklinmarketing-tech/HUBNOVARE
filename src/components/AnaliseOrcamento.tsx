"use client";

import Link from "next/link";
import { ArrowRight, CircleAlert, CircleCheck, TriangleAlert } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { brl } from "@/lib/calculos";

/**
 * A ANÁLISE DO ORÇAMENTO, como um consultor leria os números.
 *
 * Pedido do dono em 20/10/2026, com o print do "Plano contra a renda": as
 * três barras mostravam o número, mas não diziam o que ele significa nem o
 * que fazer. Aqui entram o veredito, dois gráficos, três indicadores, as
 * recomendações em ordem de prioridade e as maiores despesas.
 *
 * ⚠️ TUDO SAI DOS NÚMEROS QUE A PESSOA DIGITOU, pela regra 50/30/20 que a
 * própria ferramenta já usa. Nenhuma taxa de rendimento é inventada: a
 * projeção de 12 meses é soma simples, e diz isso. Não recomenda produto.
 */

type Grupo = "necessidades" | "estilo" | "futuro";

const ALVO: Record<Grupo, number> = { necessidades: 50, estilo: 30, futuro: 20 };
const ROTULO: Record<Grupo, string> = {
  necessidades: "Necessidades",
  estilo: "Estilo de vida",
  futuro: "Futuro",
};
const COR: Record<Grupo | "sobra" | "excesso", string> = {
  necessidades: "hsl(215 50% 30%)",
  estilo: "hsl(24 85% 55%)",
  futuro: "hsl(152 55% 41%)",
  sobra: "hsl(214 20% 86%)",
  excesso: "hsl(0 70% 52%)",
};
const FERRAMENTA: Record<Grupo, { href: string; nome: string }> = {
  necessidades: { href: "/ferramentas/financiamento", nome: "Revisar parcelas e financiamentos" },
  estilo: { href: "", nome: "" }, // o ajuste é nas categorias desta mesma página
  futuro: { href: "/ferramentas/juros-compostos", nome: "Ver quanto isso vira com o tempo" },
};

const pctTxt = (v: number) => `${Math.round(v)}%`;

export function AnaliseOrcamento({
  renda,
  porGrupo,
  categorias,
}: {
  renda: number;
  porGrupo: Record<Grupo, number>;
  categorias: { nome: string; valor: number; grupo: Grupo }[];
}) {
  const total = porGrupo.necessidades + porGrupo.estilo + porGrupo.futuro;
  if (renda <= 0 || total <= 0) {
    return (
      <section data-analise className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-white/60 p-6 text-center print:break-inside-avoid">
        <p className="font-display text-base font-bold text-primary">A análise aparece aqui</p>
        <p className="mt-1 text-sm text-slate-500">
          Informe a renda e preencha pelo menos uma categoria para ver o diagnóstico completo,
          com gráficos e o que ajustar primeiro.
        </p>
      </section>
    );
  }

  const sobra = renda - total;
  const p = (g: Grupo) => (porGrupo[g] / renda) * 100;
  const comprometimento = (total / renda) * 100;
  const poupanca = p("futuro");

  /* ── O veredito: a primeira coisa que um consultor diria ─────────────── */
  const acimaEstilo = p("estilo") > ALVO.estilo;
  const acimaNec = p("necessidades") > ALVO.necessidades;
  const abaixoFuturo = poupanca < ALVO.futuro;
  const veredito =
    sobra < 0
      ? { tom: "ruim" as const, titulo: `O plano gasta ${brl(-sobra)} a mais do que entra`,
          texto: "Antes de qualquer outra coisa, o mês precisa fechar. Comece pelas recomendações abaixo, na ordem." }
      : acimaEstilo || acimaNec
        ? { tom: "atencao" as const,
            titulo: `O plano cabe, mas ${acimaEstilo ? "o estilo de vida" : "as necessidades"} pesa${acimaEstilo ? "" : "m"} demais`,
            texto: `${acimaEstilo ? "Estilo de vida" : "Necessidades"} está em ${pctTxt(acimaEstilo ? p("estilo") : p("necessidades"))} da renda, acima dos ${acimaEstilo ? 30 : 50}% recomendados. É daí que sai o dinheiro que falta para o futuro.` }
        : abaixoFuturo
          ? { tom: "atencao" as const, titulo: "O plano está equilibrado, mas guarda pouco",
              texto: `O futuro recebe ${pctTxt(poupanca)} da renda. A referência é 20% ou mais — é isso que constrói reserva e patrimônio.` }
          : { tom: "bom" as const, titulo: "Plano equilibrado — parabéns",
              texto: "As três partes estão dentro da regra 50/30/20. Agora o foco é manter o ritmo e dar destino à sobra." };

  /* ── O gráfico de rosca: para onde vai cada real ───────────────────── */
  const fatias = [
    ...(["necessidades", "estilo", "futuro"] as Grupo[])
      .filter((g) => porGrupo[g] > 0)
      .map((g) => ({ nome: ROTULO[g], valor: porGrupo[g], cor: COR[g] })),
    ...(sobra > 0 ? [{ nome: "Sobra livre", valor: sobra, cor: COR.sobra }] : []),
  ];

  /* ── As recomendações, em ordem de impacto ─────────────────────────── */
  const recs: { titulo: string; texto: string; href: string; link: string }[] = [];
  const maiores = (g: Grupo) =>
    categorias.filter((c) => c.grupo === g && c.valor > 0).sort((a, b) => b.valor - a.valor).slice(0, 2).map((c) => c.nome);
  if (acimaEstilo) {
    const corte = porGrupo.estilo - (renda * ALVO.estilo) / 100;
    const nomes = maiores("estilo");
    recs.push({ titulo: `Cortar ${brl(corte)} por mês em estilo de vida`,
      texto: `Isso traz o estilo de vida de volta aos 30% da renda.${nomes.length ? ` Comece por ${nomes.join(" e ")}, ${nomes.length > 1 ? "as maiores" : "a maior"} do grupo.` : ""}`,
      href: FERRAMENTA.estilo.href, link: FERRAMENTA.estilo.nome });
  }
  if (acimaNec) {
    const excesso = porGrupo.necessidades - (renda * ALVO.necessidades) / 100;
    const nomes = maiores("necessidades");
    recs.push({ titulo: `Rever ${brl(excesso)} em necessidades`,
      texto: `As despesas essenciais passam de 50% da renda.${nomes.length ? ` As que mais pesam: ${nomes.join(" e ")}.` : ""} Renegociar um contrato ou uma parcela costuma ser o caminho.`,
      href: FERRAMENTA.necessidades.href, link: FERRAMENTA.necessidades.nome });
  }
  if (abaixoFuturo) {
    const falta = (renda * ALVO.futuro) / 100 - porGrupo.futuro;
    recs.push({ titulo: `Mandar mais ${brl(falta)} por mês para o futuro`,
      texto: sobra > 0
        ? `A sobra livre de ${brl(sobra)} já cobre ${sobra >= falta ? "tudo" : "uma parte"} disso: separe esse valor no dia em que o salário cair, antes de gastar.`
        : "Esse valor sai dos cortes acima. Separe no dia em que o salário cair, antes de gastar.",
      href: FERRAMENTA.futuro.href, link: FERRAMENTA.futuro.nome });
  }
  if (sobra > 0 && !abaixoFuturo) {
    recs.push({ titulo: `Dar destino aos ${brl(sobra)} que sobram`,
      texto: "Sobra sem destino some no mês. Se a reserva de emergência ainda não está completa, ela vem primeiro.",
      href: "/ferramentas/reserva", link: "Planejar a reserva" });
  }
  const guardaMes = porGrupo.futuro + (abaixoFuturo ? Math.max(0, Math.min(sobra, (renda * ALVO.futuro) / 100 - porGrupo.futuro)) : 0);

  const top = [...categorias].filter((c) => c.valor > 0).sort((a, b) => b.valor - a.valor).slice(0, 5);
  const topMax = top[0]?.valor ?? 1;

  const CorTom = {
    bom: { caixa: "border-success/30 bg-success/5", icone: <CircleCheck className="h-5 w-5 text-success" /> },
    atencao: { caixa: "border-warning/40 bg-warning/5", icone: <TriangleAlert className="h-5 w-5 text-warning" /> },
    ruim: { caixa: "border-destructive/30 bg-destructive/5", icone: <CircleAlert className="h-5 w-5 text-destructive" /> },
  }[veredito.tom];

  return (
    <section data-analise className="mt-6 space-y-4 print:break-inside-avoid" aria-labelledby="analise-titulo">
      <div>
        <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-accent-strong">Análise completa</p>
        <h2 id="analise-titulo" className="mt-1 font-display text-xl font-bold text-primary sm:text-2xl">
          O que os seus números dizem
        </h2>
      </div>

      {/* 1. O veredito */}
      <div className={`flex gap-3 rounded-2xl border p-4 sm:p-5 ${CorTom.caixa}`}>
        <span className="mt-0.5 shrink-0">{CorTom.icone}</span>
        <div>
          <p className="font-display text-base font-bold text-slate-900">{veredito.titulo}</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">{veredito.texto}</p>
        </div>
      </div>

      {/* 2. Indicadores */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Indicador rotulo="Comprometimento da renda" valor={pctTxt(comprometimento)}
          nota={comprometimento > 100 ? "Acima do que entra" : "do que entra já tem destino"}
          ruim={comprometimento > 100} />
        <Indicador rotulo="Taxa de poupança" valor={pctTxt(poupanca)}
          nota="Referência: 20% ou mais" ruim={poupanca < 20} />
        <Indicador rotulo="Sobra livre no mês" valor={brl(Math.max(0, sobra))}
          nota={sobra < 0 ? `Faltam ${brl(-sobra)}` : "Ainda sem destino"} ruim={sobra < 0} />
      </div>

      {/* 3. Os dois gráficos */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-semibold text-slate-700">Para onde vai a sua renda</p>
          <div className="relative mx-auto mt-2 h-56 w-full max-w-[16rem]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={fatias} dataKey="valor" nameKey="nome" innerRadius="62%" outerRadius="92%"
                  paddingAngle={2} stroke="none" isAnimationActive>
                  {fatias.map((f) => <Cell key={f.nome} fill={f.cor} />)}
                </Pie>
                <Tooltip formatter={(v) => brl(Number(v ?? 0))} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-2xl font-bold tabular-nums text-primary">{pctTxt(comprometimento)}</span>
              <span className="text-2xs text-slate-500">da renda planejada</span>
            </div>
          </div>
          <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
            {fatias.map((f) => (
              <li key={f.nome} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: f.cor }} />
                <span className="min-w-0 truncate text-slate-600">{f.nome}</span>
                <span className="ml-auto whitespace-nowrap font-semibold tabular-nums text-slate-800">
                  {pctTxt((f.valor / renda) * 100)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-semibold text-slate-700">Seu plano × a regra 50/30/20</p>
          <p className="mt-0.5 text-2xs text-slate-500">A barra é o seu plano; o traço escuro é o alvo.</p>
          <div className="mt-5 space-y-5">
            {(["necessidades", "estilo", "futuro"] as Grupo[]).map((g) => {
              const seu = p(g);
              const escala = Math.max(60, seu + 5);
              const acima = g === "futuro" ? seu >= ALVO[g] : seu <= ALVO[g];
              return (
                <div key={g}>
                  <div className="flex items-baseline justify-between gap-3 text-xs">
                    <span className="font-semibold text-slate-700">{ROTULO[g]}</span>
                    <span className="whitespace-nowrap tabular-nums">
                      <b className={acima ? "text-slate-900" : "text-destructive"}>{pctTxt(seu)}</b>
                      <span className="text-slate-500"> · alvo {ALVO[g]}%</span>
                    </span>
                  </div>
                  <div className="relative mt-2 h-3 rounded-full bg-slate-100">
                    <div className="h-full rounded-full transition-[width] duration-700"
                      style={{ width: `${Math.min(100, (seu / escala) * 100)}%`, background: acima ? COR[g] : COR.excesso }} />
                    <span aria-hidden className="absolute -top-1 h-5 w-[3px] rounded-full bg-slate-800"
                      style={{ left: `${(ALVO[g] / escala) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. O que um consultor faria */}
      {recs.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-semibold text-slate-700">O que um consultor faria, na ordem</p>
          <ol className="mt-4 space-y-4">
            {recs.map((r, i) => (
              <li key={r.titulo} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">{i + 1}</span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900">{r.titulo}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-slate-600">{r.texto}</p>
                  {r.href && (
                    <Link href={r.href} className="mt-1 inline-flex min-h-8 items-center gap-1 text-xs font-semibold text-accent-strong hover:underline print:hidden">
                      {r.link} <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ol>
          {guardaMes > 0 && (
            <p className="mt-5 rounded-xl bg-primary/5 px-4 py-3 text-sm text-slate-700">
              Seguindo o plano, você guarda <b className="text-primary">{brl(guardaMes)}</b> por mês:{" "}
              <b className="text-primary">{brl(guardaMes * 12)}</b> em 12 meses, sem contar rendimento.
            </p>
          )}
        </div>
      )}

      {/* 5. As maiores despesas */}
      {top.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-semibold text-slate-700">Suas maiores despesas</p>
          <ul className="mt-4 space-y-3">
            {top.map((c) => (
              <li key={c.nome}>
                <div className="flex items-baseline justify-between gap-3 text-xs">
                  <span className="min-w-0 truncate font-medium text-slate-700">{c.nome}</span>
                  <span className="whitespace-nowrap tabular-nums text-slate-600">
                    <b className="text-slate-900">{brl(c.valor)}</b> · {pctTxt((c.valor / renda) * 100)} da renda
                  </span>
                </div>
                <div className="mt-1.5 h-2 rounded-full bg-slate-100">
                  <div className="h-full rounded-full" style={{ width: `${(c.valor / topMax) * 100}%`, background: COR[c.grupo] }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-2xs leading-relaxed text-slate-500">
        Análise automática a partir dos números que você informou, pela regra 50/30/20. É um ponto de
        partida para organizar o mês — não é recomendação de investimento.
      </p>
    </section>
  );
}

function Indicador({ rotulo, valor, nota, ruim }: { rotulo: string; valor: string; nota: string; ruim?: boolean }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-2xs font-semibold uppercase tracking-wider text-slate-500">{rotulo}</p>
      <p className={`mt-1 font-display text-2xl font-bold tabular-nums ${ruim ? "text-destructive" : "text-primary"}`}>{valor}</p>
      <p className="mt-0.5 text-2xs text-slate-500">{nota}</p>
    </div>
  );
}
