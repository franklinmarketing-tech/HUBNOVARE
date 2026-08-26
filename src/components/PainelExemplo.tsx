import { CalendarCheck, FileText, Target, TrendingUp } from "lucide-react";

/**
 * Uma miniatura do painel real do app, para a página de venda.
 *
 * POR QUE NÃO É UM PRINT
 * Print de tela envelhece calado: muda um rótulo no produto e a imagem da
 * landing passa a mentir, sem ninguém perceber. Isto é a interface de verdade,
 * com os mesmos tokens e a mesma tipografia — se o design mudar, a peça muda
 * junto. E fica nítida em qualquer densidade de tela, o que print não fica.
 *
 * OS NÚMEROS SÃO DE EXEMPLO, e a peça diz isso na cara — mas não são
 * inventados: veja o bloco abaixo.
 */

/**
 * Os números são os que o motor REALMENTE devolve para o caso de demonstração
 * — o mesmo caso que roda no vídeo desta página (ver
 * `scripts/preparar-conta-demo.mjs`). Foram lidos da tela do app, não
 * inventados: peça estática e vídeo contam a mesma história, com os mesmos
 * valores, porque um visitante atento compara os dois.
 *
 * O caso: renda de R$ 12.800, custo de R$ 9.700, parcela de R$ 900 → sobra de
 * R$ 2.200 (17%). É de propósito alguém no meio do caminho: uma landing que
 * mostra quem já chegou não vende nada.
 */
const INDICADORES = [
  { rotulo: "Sobra por mês", valor: "R$ 2.200", detalhe: "17% do que entra", tom: "bom" },
  { rotulo: "Reserva", valor: "1,5 meses", detalhe: "faltam R$ 43.700", tom: "atencao" },
  { rotulo: "Patrimônio líquido", valor: "R$ 458 mil", detalhe: "já sem as dívidas", tom: "neutro" },
  { rotulo: "Saúde financeira", valor: "59/100", detalhe: "Atenção", tom: "atencao" },
];

const PILARES = [
  { nome: "Reserva de emergência", pct: 25 },
  { nome: "Endividamento", pct: 77 },
  { nome: "Capacidade de poupança", pct: 85 },
  { nome: "Proteção", pct: 80 },
];

const ABAS = [
  { icone: Target, nome: "Painel", ativa: true },
  { icone: TrendingUp, nome: "Meu plano" },
  { icone: CalendarCheck, nome: "Meu mês" },
  { icone: FileText, nome: "Relatório" },
];

const COR = {
  bom: "text-success-strong",
  atencao: "text-warning",
  neutro: "text-primary",
} as const;

export function PainelExemplo() {
  return (
    <figure className="overflow-hidden rounded-3xl border border-border bg-card shadow-elevated">
      {/* Barra de janela: dá o enquadramento de "isto é um app", que um bloco
          solto de cards não dá. */}
      <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-2.5">
        <span className="flex gap-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
        </span>
        <span className="ml-2 truncate rounded-md bg-card px-2.5 py-1 text-[10px] text-muted-foreground">
          novare-workspace.vercel.app/planejamento/app
        </span>
      </div>

      {/* Abas da trilha */}
      <div className="flex gap-1 overflow-hidden border-b border-border bg-card px-3 py-2">
        {ABAS.map(({ icone: Icone, nome, ativa }) => (
          <span
            key={nome}
            className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold ${
              ativa ? "bg-primary text-white" : "text-muted-foreground"
            }`}
          >
            <Icone className="h-3 w-3" strokeWidth={2} />
            {nome}
          </span>
        ))}
      </div>

      <div className="space-y-4 bg-gelo p-4 sm:p-5">
        {/* Marco Horizonte: o herói do painel real, no mesmo palco navy. */}
        <div
          className="relative overflow-hidden rounded-2xl p-5 text-white"
          style={{
            background:
              "linear-gradient(155deg, hsl(215 50% 23%) 0%, hsl(215 55% 15%) 100%)",
          }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(14rem 8rem at 88% -20%, hsl(16 88% 60% / 0.4), transparent 65%)",
            }}
          />
          <div className="relative">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">
              Seu Marco Horizonte
            </p>
            <p className="mt-1.5 font-display text-3xl font-bold tabular-nums sm:text-4xl">
              R$ 2,1 milhões
            </p>

            <div className="mt-4 max-w-sm">
              <div className="mb-1.5 flex items-baseline justify-between text-[10px] font-semibold">
                <span className="text-white/65">No caminho atual você chega a</span>
                <span className="tabular-nums">48%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/20">
                <div className="h-full w-[48%] rounded-full bg-accent-claro" />
              </div>
            </div>
          </div>
        </div>

        {/* Os quatro indicadores */}
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          {INDICADORES.map((i) => (
            <div key={i.rotulo} className="rounded-xl border border-border bg-card p-3">
              <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                {i.rotulo}
              </p>
              <p
                className={`mt-1 font-display text-base font-extrabold tabular-nums ${COR[i.tom as keyof typeof COR]}`}
              >
                {i.valor}
              </p>
              <p className="mt-0.5 text-[9px] leading-tight text-slate-500">{i.detalhe}</p>
            </div>
          ))}
        </div>

        {/* Os cinco pilares, em barra */}
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            De onde vem a sua nota
          </p>
          <ul className="mt-3 space-y-2.5">
            {PILARES.map((p) => (
              <li key={p.nome}>
                <div className="mb-1 flex items-baseline justify-between">
                  <span className="text-[11px] font-semibold text-foreground">{p.nome}</span>
                  <span className="text-[10px] font-bold tabular-nums text-muted-foreground">
                    {p.pct}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-full rounded-full ${
                      p.pct >= 70 ? "bg-success" : p.pct >= 45 ? "bg-accent" : "bg-warning"
                    }`}
                    style={{ width: `${p.pct}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <figcaption className="border-t border-border bg-card px-4 py-2.5 text-center text-[10px] text-muted-foreground">
        Exemplo ilustrativo. Os números do seu painel saem do que{" "}
        <strong className="font-semibold text-foreground">você</strong> preencher.
      </figcaption>
    </figure>
  );
}
