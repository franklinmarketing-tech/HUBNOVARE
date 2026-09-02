import { getIndicadores, formatarIndicador, juroReal } from "@/lib/mercado";

/**
 * Os números do mercado numa faixa escura que desliza sem parar, como o
 * letreiro de uma mesa de operações.
 *
 * É o único bloco escuro da home de propósito: contra o fundo claro, ele
 * puxa o olho para os dados que mudam todo dia e dá o ar de sala de
 * mercado que a marca quer passar.
 */
export async function BarraMercado() {
  const indicadores = await getIndicadores();

  const selic = indicadores.find((i) => i.chave === "selic");
  const ipca = indicadores.find((i) => i.chave === "ipca12");
  const real = selic && ipca ? juroReal(selic.valor, ipca.valor) : null;

  const celulas = [
    ...indicadores.map((ind) => ({
      chave: ind.chave,
      rotulo: ind.rotulo,
      valor: formatarIndicador(ind),
      nota: ind.nota,
    })),
    ...(real !== null
      ? [
          {
            chave: "real",
            rotulo: "Juro real",
            valor: `${real.toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}%`,
            nota: "acima da inflação",
          },
        ]
      : []),
  ];

  // A fita é a mesma lista DUAS vezes. Quando a primeira cópia termina de
  // passar, a segunda já está no lugar exato dela — o corte fica invisível
  // e o movimento nunca tem começo nem fim.
  const fita = [...celulas, ...celulas];

  return (
    <div className="fita-mercado flex items-stretch overflow-hidden rounded-2xl">
      {/* A pista rolante fica contida: `min-w-0` é o que a impede de
          empurrar o selo para fora da faixa. */}
      <div className="relative min-w-0 flex-1 overflow-hidden">
        <div className="flex w-max animate-[correr-fita_44s_linear_infinite] items-center gap-8 py-3 pl-5 motion-reduce:animate-none [@media(max-height:800px)]:py-2">
        {fita.map((c, i) => (
          <span
            key={`${c.chave}-${i}`}
            className="flex items-baseline gap-1.5 whitespace-nowrap"
            // A segunda volta é decorativa: quem usa leitor de tela ouve
            // a lista uma vez só.
            aria-hidden={i >= celulas.length}
          >
            <span className="text-[11px] font-bold uppercase tracking-wider text-[hsl(205_95%_72%)]">
              {c.rotulo}
            </span>
            <strong className="text-sm font-bold tabular-nums text-white">
              {c.valor}
            </strong>
            <span className="text-[11px] text-white/35">{c.nota}</span>
          </span>
          ))}
        </div>

        {/* Véus nas pontas: os números nascem e somem em vez de bater na
            borda. É o que dá o acabamento de letreiro. */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[hsl(215_50%_13%)] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[hsl(215_50%_13%)] to-transparent" />
      </div>

      {/* Fonte dos dados, fora da pista: assim nunca cobre um número. */}
      <span className="flex shrink-0 items-center gap-1.5 border-l border-white/10 bg-[hsl(215_55%_10%)] px-3.5 text-[10px] font-medium uppercase tracking-wider text-white/45">
        <span className="h-1.5 w-1.5 rounded-full bg-success" />
        <span className="hidden sm:inline">Banco Central</span>
        <span className="sm:hidden">BC</span>
      </span>
    </div>
  );
}
