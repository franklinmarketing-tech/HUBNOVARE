"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Check,
  FileUp,
  Loader2,
  Lock,
  Repeat,
  Sparkles,
  TrendingDown,
  X,
} from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { brl } from "@/lib/calculos";
import { lerExtrato, lerExtratoSemIA, pareceOfx, resumirExtrato } from "@/lib/extrato";
import { EXTRATO_EXEMPLO } from "@/lib/iris-exemplo";
import { DIAGNOSTICO_GRATUITO_LP, buildTrackingUrl } from "@/lib/consultoria";
import { RoboIris } from "@/components/RoboIris";

type Achado = { titulo: string; texto: string; tipo: string };
type Leitura = { veredito: string; achados: Achado[]; acoes: string[] };

/** O botão do topo da página pede o exemplo por este evento. */
export const EVENTO_EXEMPLO_IRIS = "iris:exemplo";

/* As cores do gráfico, na paleta da casa: petróleo, ciano, laranja e
   vizinhos. A ordem segue o tamanho da fatia. */
const CORES = ["#0A3346", "#2596BE", "#E86130", "#1f9d6b", "#7fd0ec", "#f4a27f", "#94a3b8", "#5b6d81"];

/**
 * A Íris trabalhando: a pessoa cola o extrato, ela devolve a leitura — agora
 * num PAINEL (upgrade de 20/10/2026, pedido do dono: "mais bonita, chamativa,
 * profissional"). Números grandes, rosca dos gastos, cobranças que se
 * repetem e as tarifas que ela achou.
 *
 * O extrato é lido AQUI, no navegador, e nada sai dele: a leitura é
 * aritmética (`resumirExtrato`) com a redação montada por `lerExtratoSemIA`.
 * Nenhum modelo de IA é chamado e nenhum byte do extrato sobe.
 *
 * O botão "Ver um exemplo" cola um extrato FICTÍCIO (`lib/iris-exemplo.ts`)
 * e já pede a leitura — a tela avisa que é exemplo.
 */
export function IrisExtrato() {
  const [texto, setTexto] = useState("");
  const [leitura, setLeitura] = useState<Leitura | null>(null);
  const [estado, setEstado] = useState<"parado" | "lendo" | "pronto">("parado");
  const [erro, setErro] = useState<string | null>(null);
  const [arrastando, setArrastando] = useState(false);
  const [arquivo, setArquivo] = useState<string | null>(null);
  const [exemplo, setExemplo] = useState(false);
  const painel = useRef<HTMLDivElement>(null);

  const itens = useMemo(() => (texto.trim() ? lerExtrato(texto) : []), [texto]);
  const resumo = useMemo(() => (itens.length ? resumirExtrato(itens) : null), [itens]);

  async function receberArquivo(f: File | null | undefined) {
    if (!f) return;
    setErro(null);
    const nome = f.name.toLowerCase();
    if (nome.endsWith(".pdf")) {
      setErro(
        "Extrato em PDF: abra o arquivo, selecione tudo (Ctrl+A), copie e cole no campo abaixo. Em CSV ou OFX o arquivo entra direto.",
      );
      return;
    }
    if (f.size > 4 * 1024 * 1024) {
      setErro("Arquivo muito grande. Envie um período menor.");
      return;
    }
    const conteudo = await f.text();
    const achou = lerExtrato(conteudo);
    if (achou.length === 0) {
      setErro(
        "Não reconheci lançamentos nesse arquivo. Ele precisa ter data e valor em cada linha — CSV, OFX ou texto do extrato.",
      );
      return;
    }
    setExemplo(false);
    setLeitura(null);
    setEstado("parado");
    setTexto(conteudo);
    setArquivo(`${f.name} · ${achou.length} lançamentos${pareceOfx(conteudo) ? " · OFX" : ""}`);
  }

  /** A leitura é instantânea; os 700 ms são o tempo de a pessoa ver a Íris "lendo". */
  const analisar = useCallback((fonte: string) => {
    const r = fonte.trim() ? resumirExtrato(lerExtrato(fonte)) : null;
    if (!r) return;
    setEstado("lendo");
    setErro(null);
    setLeitura(null);
    window.setTimeout(() => {
      try {
        setLeitura(lerExtratoSemIA(r, brl));
        setEstado("pronto");
        window.setTimeout(() => painel.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
      } catch {
        setErro("Não consegui ler esse extrato. Confira se os lançamentos vieram completos.");
        setEstado("parado");
      }
    }, 700);
  }, []);

  const verExemplo = useCallback(() => {
    setExemplo(true);
    setArquivo("Extrato de exemplo · 3 meses · fictício");
    setTexto(EXTRATO_EXEMPLO);
    analisar(EXTRATO_EXEMPLO);
  }, [analisar]);

  useEffect(() => {
    window.addEventListener(EVENTO_EXEMPLO_IRIS, verExemplo);
    return () => window.removeEventListener(EVENTO_EXEMPLO_IRIS, verExemplo);
  }, [verExemplo]);

  function limpar() {
    setTexto("");
    setArquivo(null);
    setLeitura(null);
    setEstado("parado");
    setExemplo(false);
  }

  return (
    <section id="analisar" className="scroll-mt-20">
      <RoboIris lancamentos={itens.length} analisando={estado === "lendo"} />

      {/* PASSO 1 — o extrato */}
      <div className="cartao-cp mt-5 p-5 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="chapeu chapeu-ciano">Passo 1</p>
            <h2 className="titulo-cp mt-2 text-2xl">Seu extrato</h2>
            <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-muted-foreground">
              Arraste o arquivo do banco ou cole os lançamentos. Nada sai do seu
              navegador: a conta é feita aqui.
            </p>
          </div>
          {!exemplo && (
            <button type="button" onClick={verExemplo} className="btn-claro shrink-0">
              <Sparkles className="h-4 w-4 text-accent-strong" aria-hidden="true" />
              Ver um exemplo
            </button>
          )}
        </div>

        <label
          onDragOver={(e) => {
            e.preventDefault();
            setArrastando(true);
          }}
          onDragLeave={() => setArrastando(false)}
          onDrop={(e) => {
            e.preventDefault();
            setArrastando(false);
            void receberArquivo(e.dataTransfer.files?.[0]);
          }}
          className={`mt-5 flex cursor-pointer flex-col items-center justify-center rounded-[1.25rem] border-2 border-dashed px-4 py-8 text-center transition-colors focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/12 ${
            arrastando
              ? "border-accent bg-accent/10"
              : arquivo
                ? "border-success/40 bg-success/[0.06]"
                : "border-ciano/30 bg-ciano-tint/50 hover:border-ciano/60"
          }`}
        >
          <input
            type="file"
            accept=".csv,.ofx,.txt,.qfx,text/plain,text/csv"
            className="sr-only"
            onChange={(e) => void receberArquivo(e.target.files?.[0])}
          />
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-suave">
            <FileUp className={`h-6 w-6 ${arquivo ? "text-success" : "text-ciano-forte"}`} strokeWidth={1.75} aria-hidden="true" />
          </span>
          <p className="mt-3 max-w-full break-words text-sm font-semibold text-foreground">
            {arquivo ?? "Arraste o extrato do seu banco ou clique para escolher"}
          </p>
          <p className="mt-1 text-2xs leading-relaxed text-muted-foreground">
            CSV ou OFX — o que Itaú, Bradesco, Nubank, Banco do Brasil, Caixa e Santander exportam.
          </p>
        </label>

        <label
          htmlFor="iris-extrato-texto"
          className="mt-6 block text-2xs font-semibold uppercase tracking-[0.14em] text-muted-foreground"
        >
          Ou cole os lançamentos aqui
        </label>
        <textarea
          id="iris-extrato-texto"
          value={texto}
          onChange={(e) => {
            setTexto(e.target.value);
            setArquivo(null);
            setExemplo(false);
          }}
          rows={6}
          aria-describedby="iris-extrato-privacidade"
          placeholder={`01/06/2026;SALARIO;5000,00\n02/06/2026;ALUGUEL;-1800,00\n03/06/2026;NETFLIX.COM;-44,90`}
          className="mt-2 w-full resize-y rounded-[1.25rem] border border-border bg-muted/40 p-4 font-mono text-xs leading-relaxed outline-none focus:border-accent focus:bg-card focus:ring-4 focus:ring-accent/12"
        />

        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <p id="iris-extrato-privacidade" className="flex items-start gap-1.5 text-2xs leading-relaxed text-muted-foreground">
            <Lock className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
            O extrato é lido no seu navegador. Nada é enviado.
          </p>
          {itens.length > 0 && (
            <p className="text-2xs font-semibold text-success-strong">{itens.length} lançamentos reconhecidos</p>
          )}
        </div>

        {resumo && (
          <button
            type="button"
            onClick={() => analisar(texto)}
            disabled={estado === "lendo"}
            aria-busy={estado === "lendo"}
            className="btn-cp mt-5 w-full"
          >
            {estado === "lendo" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                A Íris está lendo o seu extrato…
              </>
            ) : (
              <>
                {leitura ? "Ler de novo" : "Pedir a leitura da Íris"}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </>
            )}
          </button>
        )}

        {erro && (
          <p role="alert" className="mt-4 text-xs text-destructive">
            {erro}
          </p>
        )}
      </div>

      {/* PASSO 2 — o painel */}
      {leitura && resumo && (
        <div ref={painel} className="mt-8 scroll-mt-20 space-y-4">
          {exemplo && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.25rem] border border-accent-soft bg-accent-tint px-4 py-3">
              <p className="text-sm font-medium text-foreground">
                <b className="font-semibold">Este é um exemplo fictício.</b> Cole o seu extrato para ver o seu painel.
              </p>
              <button type="button" onClick={limpar} className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-strong">
                <X className="h-4 w-4" aria-hidden="true" />
                Limpar e usar o meu
              </button>
            </div>
          )}

          <p className="chapeu">Passo 2 · O painel da Íris</p>

          {/* O veredito, grande, no painel noite */}
          <div className="secao-noite relative overflow-hidden rounded-[1.75rem] p-6 shadow-ciano sm:p-9">
            <div className="grid items-center gap-6 lg:grid-cols-[1fr_auto]">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-ciano-claro">A leitura da Íris</p>
                <p className="surgir mt-3 font-display text-xl font-medium leading-snug tracking-[-0.02em] text-white sm:text-[1.65rem]">
                  {leitura.veredito}
                </p>
              </div>
              {resumo.totalVazado > 0 && (
                <div className="rounded-[1.25rem] bg-white/[0.06] p-5 text-center ring-1 ring-white/10 lg:min-w-[15rem]">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent-claro">Vazando por ano</p>
                  <p className="numero-vivo mt-2 font-display text-4xl font-medium tracking-[-0.04em] text-white tabular-nums">
                    {brl((resumo.totalVazado / resumo.meses) * 12)}
                  </p>
                  <p className="mt-1 text-2xs text-white/60">em tarifa, juro e IOF</p>
                </div>
              )}
            </div>
          </div>

          {/* Os números */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi rotulo="Entrou" valor={brl(resumo.entradas)} nota={`em ${resumo.meses} ${resumo.meses === 1 ? "mês" : "meses"}`} />
            <Kpi rotulo="Saiu" valor={brl(resumo.saidas)} nota={`${itens.filter((i) => i.valor < 0).length} lançamentos`} />
            <Kpi
              rotulo="Sobrou"
              valor={brl(resumo.saldo)}
              nota={resumo.entradas > 0 ? `${Math.round((resumo.saldo / resumo.entradas) * 100)}% do que entrou` : "no período"}
              ruim={resumo.saldo < 0}
            />
            <Kpi rotulo="Tarifa e juro" valor={brl(resumo.totalVazado / resumo.meses)} nota="por mês, sem comprar nada" ruim={resumo.totalVazado > 0} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <PainelGastos resumo={resumo} />
            <PainelRecorrentes resumo={resumo} />
          </div>

          {resumo.vazamentos.length > 0 && <PainelTarifas resumo={resumo} />}

          {/* O que ela achou */}
          <div className="grid gap-3 sm:grid-cols-2">
            {leitura.achados.map((a, i) => (
              <div
                key={i}
                className={`rounded-[1.25rem] border p-5 ${
                  a.tipo === "vazamento"
                    ? "border-destructive/25 bg-destructive/[0.04]"
                    : a.tipo === "bom"
                      ? "border-success/30 bg-success/[0.06]"
                      : "border-border bg-card shadow-suave"
                }`}
              >
                <div className="flex items-start gap-2">
                  {a.tipo === "vazamento" ? (
                    <TrendingDown className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
                  ) : a.tipo === "bom" ? (
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success-strong" aria-hidden="true" />
                  ) : (
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-accent-strong" aria-hidden="true" />
                  )}
                  <h3 className="text-sm font-semibold text-foreground">{a.titulo}</h3>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{a.texto}</p>
              </div>
            ))}
          </div>

          {/* Por onde começar — o fecho, no escuro */}
          {leitura.acoes.length > 0 && (
            <div className="secao-noite sem-ondas rounded-[1.75rem] p-6 shadow-ciano sm:p-8">
              <p className="chapeu chapeu-claro">Por onde começar</p>
              <ol className="mt-5 space-y-4">
                {leitura.acoes.map((acao, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="w-8 shrink-0 font-display text-xl font-normal leading-7 tracking-[-0.04em] text-ciano-claro tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-sm leading-relaxed text-white/80">{acao}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <a
                  href={buildTrackingUrl(DIAGNOSTICO_GRATUITO_LP, "iris-painel")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2"
                >
                  <span className="btn-cp">Quero um diagnóstico gratuito</span>
                  <span className="btn-seta" aria-hidden="true">
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </a>
                <Link
                  href="/fincash"
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/25 px-5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  Controlar o mês no FINCASH
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          )}

          <p className="text-2xs leading-relaxed text-muted-foreground">
            Os valores são somados aqui no navegador, a partir do extrato — não
            são estimativa. Conteúdo educativo, não é recomendação de investimento.
          </p>
        </div>
      )}
    </section>
  );
}

type Resumo = ReturnType<typeof resumirExtrato>;

const curto = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", notation: "compact", maximumFractionDigits: 1 });

function Kpi({ rotulo, valor, nota, ruim }: { rotulo: string; valor: string; nota: string; ruim?: boolean }) {
  return (
    <div className="rounded-[1.25rem] bg-noite p-4 shadow-ciano ring-1 ring-white/10 sm:p-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ciano-claro">{rotulo}</p>
      <p
        className={`mt-1.5 break-words font-display text-xl font-medium tracking-[-0.03em] tabular-nums sm:text-[1.6rem] ${
          ruim ? "text-[hsl(16_90%_70%)]" : "text-white"
        }`}
      >
        {valor}
      </p>
      <p className="mt-0.5 text-2xs text-white/60">{nota}</p>
    </div>
  );
}

/** A rosca: para onde foi o dinheiro que saiu. */
function PainelGastos({ resumo }: { resumo: Resumo }) {
  const total = resumo.saidas || 1;
  const fatias = resumo.porCategoria.map((c, i) => ({ nome: c.categoria, valor: c.total, cor: CORES[i % CORES.length] }));
  return (
    <div className="cartao-cp min-w-0 p-5 sm:p-6">
      <p className="text-sm font-semibold text-slate-700">Para onde foi o dinheiro</p>
      <p className="mt-0.5 text-2xs text-slate-500">Saídas do período, por categoria.</p>
      <div className="mt-3 grid items-center gap-4 sm:grid-cols-[11rem_1fr]">
        <div className="relative mx-auto h-44 w-44">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={fatias} dataKey="valor" nameKey="nome" innerRadius="62%" outerRadius="96%" paddingAngle={2} stroke="none">
                {fatias.map((f) => (
                  <Cell key={f.nome} fill={f.cor} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => brl(Number(v ?? 0))} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            {/* Formato curto ("R$ 13,2 mil"): o valor cheio estourava o anel. */}
            <span className="font-display text-lg font-medium tracking-[-0.03em] text-primary tabular-nums">{curto(resumo.saidas)}</span>
            <span className="text-2xs text-slate-500">saíram</span>
          </div>
        </div>
        <ul className="space-y-2">
          {fatias.slice(0, 6).map((f) => (
            <li key={f.nome}>
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: f.cor }} />
                  <span className="truncate text-slate-700">{f.nome}</span>
                </span>
                <span className="whitespace-nowrap font-semibold tabular-nums text-slate-800">{Math.round((f.valor / total) * 100)}%</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-slate-100">
                <div className="h-full rounded-full" style={{ width: `${(f.valor / total) * 100}%`, background: f.cor }} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** O que se repete todo mês — onde mora a assinatura esquecida. */
function PainelRecorrentes({ resumo }: { resumo: Resumo }) {
  const lista = resumo.recorrentes.slice(0, 6);
  const porMes = lista.reduce((a, r) => a + r.valor, 0);
  return (
    <div className="cartao-cp min-w-0 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-700">Cobranças que se repetem</p>
          <p className="mt-0.5 text-2xs text-slate-500">Aparecem em meses diferentes com valor parecido.</p>
        </div>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ciano-tint">
          <Repeat className="h-4 w-4 text-ciano-forte" aria-hidden="true" />
        </span>
      </div>
      {lista.length ? (
        <>
          <ul className="mt-4 divide-y divide-slate-100">
            {lista.map((r) => (
              <li key={r.descricao} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span className="min-w-0 truncate text-slate-700">{r.descricao}</span>
                <span className="shrink-0 text-right">
                  <b className="font-semibold tabular-nums text-slate-900">{brl(r.valor)}</b>
                  <span className="block text-2xs text-slate-500">em {r.vezes} meses</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="painel-gelo mt-4 px-4 py-3 text-xs text-slate-700">
            Juntas, somam <b className="text-primary">{brl(porMes)}</b> por mês. Nas que são assinatura, vale conferir se você ainda usa.
          </p>
        </>
      ) : (
        <p className="mt-4 text-sm text-slate-500">Cole mais de um mês de extrato para a Íris achar o que se repete.</p>
      )}
    </div>
  );
}

/** As tarifas e os juros, um a um, agrupados pelo nome. */
function PainelTarifas({ resumo }: { resumo: Resumo }) {
  const grupos = new Map<string, number>();
  for (const v of resumo.vazamentos) grupos.set(v.descricao, (grupos.get(v.descricao) ?? 0) + v.valor);
  const lista = [...grupos.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const max = lista[0]?.[1] || 1;
  return (
    <div className="cartao-cp cartao-fita-laranja p-5 sm:p-6">
      <p className="text-sm font-semibold text-slate-700">O dinheiro que sai sem você comprar nada</p>
      <p className="mt-0.5 text-2xs text-slate-500">Tarifas, juros e IOF que a Íris achou no extrato.</p>
      <ul className="mt-4 space-y-3">
        {lista.map(([desc, valor]) => (
          <li key={desc}>
            <div className="flex items-baseline justify-between gap-3 text-xs">
              <span className="min-w-0 truncate font-semibold text-slate-700">{desc}</span>
              <b className="whitespace-nowrap tabular-nums text-destructive">{brl(valor)}</b>
            </div>
            <div className="mt-1.5 h-2 rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-gradient-to-r from-accent to-destructive" style={{ width: `${(valor / max) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** O botão do topo da página: dispara o exemplo e desce até o painel. */
export function BotaoExemploIris({ className = "" }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        document.getElementById("analisar")?.scrollIntoView({ behavior: "smooth", block: "start" });
        window.dispatchEvent(new Event(EVENTO_EXEMPLO_IRIS));
      }}
      className={className}
    >
      <Sparkles className="h-4 w-4" aria-hidden="true" />
      Ver a Íris com um exemplo
    </button>
  );
}
