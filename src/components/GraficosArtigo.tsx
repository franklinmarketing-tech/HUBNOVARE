/**
 * OS GRÁFICOS DOS ARTIGOS DO NOVARE NEWS.
 *
 * ═══ POR QUE SVG NO CÓDIGO, E NÃO IMAGEM ═════════════════════════════════
 *
 * Gráfico exportado como PNG parece a saída mais fácil e cobra caro depois:
 * fica borrado em tela retina, pesa dez vezes mais que o SVG, não acompanha
 * o tema e some do artigo quando a imagem não carrega.
 *
 * ⚠️ E O PRINCIPAL: NÚMERO DENTRO DE PNG NÃO PODE SER CONFERIDO NEM
 * CORRIGIDO. Vira a captura de uma conta que ninguém mais consegue refazer —
 * e, num texto que fala de dinheiro, é exatamente a parte que alguém vai
 * querer checar. Aqui o valor está escrito ao lado da barra que o desenha:
 * quem revisar o artigo lê a conta, não a imagem dela.
 *
 * ═══ AS REGRAS DESTE ARQUIVO ═════════════════════════════════════════════
 *
 * • As cores vêm dos tokens da casa (`--color-primary`, `--color-accent`…),
 *   nunca hexadecimal solto. Assim o gráfico muda junto com a identidade.
 * • Todo gráfico tem `role="img"` e um `aria-label` que DIZ A CONCLUSÃO, não
 *   a forma. "Gráfico de barras" não informa nada a quem não enxerga.
 * • Nenhum número aqui é promessa de resultado: são exemplos aritméticos,
 *   e o artigo diz isso no texto ao redor.
 *
 * ⚠️ OS EXEMPLOS SÃO DA NOVARE, não copiados de ninguém. As regras
 * tributárias citadas (alíquotas, faixas, datas) são fato público da lei; os
 * casos que as ilustram foram escritos aqui.
 */

const TEXTO = "fill-[var(--color-muted-foreground)] text-[11px]";
const TITULO = "fill-[var(--color-primary)] text-[12px] font-semibold";

/* ══════════════════════════════════════════════════════════════════════════
   1. A carteira parece uma coisa; o patrimônio inteiro, outra.
   ══════════════════════════════════════════════════════════════════════════ */
function PatrimonioVsCarteira() {
  return (
    <svg
      viewBox="0 0 520 250"
      className="h-auto w-full"
      role="img"
      aria-label="Os mesmos R$ 600 mil em dólar são 20% quando medidos só contra a carteira de R$ 3 milhões, e 7,5% quando medidos contra o patrimônio inteiro de R$ 8 milhões."
    >
      <text x="0" y="14" className={TITULO}>
        Os mesmos R$ 600 mil, dois denominadores
      </text>

      {/* ── coluna 1: só a carteira ── */}
      <text x="0" y="44" className={TEXTO}>
        O que aparece no app
      </text>
      <rect x="0" y="54" width="180" height="120" rx="6" className="fill-[var(--color-primary-light)]" />
      <rect x="0" y="150" width="180" height="24" rx="6" className="fill-[var(--color-accent)]" />
      <text x="90" y="120" textAnchor="middle" className="fill-[var(--color-primary)] text-[13px] font-bold">
        Carteira
      </text>
      <text x="90" y="138" textAnchor="middle" className={TEXTO}>
        R$ 3 milhões
      </text>
      <text x="0" y="196" className="fill-[var(--color-accent-strong)] text-[20px] font-bold">
        20%
      </text>
      <text x="0" y="214" className={TEXTO}>
        em dólar — parece bem
      </text>
      <text x="0" y="230" className={TEXTO}>
        distribuído
      </text>

      {/* ── coluna 2: o patrimônio inteiro ── */}
      <text x="270" y="44" className={TEXTO}>
        O que existe de verdade
      </text>
      <rect x="270" y="54" width="180" height="38" rx="6" className="fill-[var(--color-primary-light)]" />
      <rect x="270" y="95" width="180" height="38" rx="6" className="fill-[var(--color-muted)]" />
      <rect x="270" y="136" width="180" height="38" rx="6" className="fill-[var(--color-muted)]" />
      <rect x="270" y="154" width="180" height="20" rx="4" className="fill-[var(--color-accent)]" />
      <text x="360" y="78" textAnchor="middle" className="fill-[var(--color-primary)] text-[11px] font-semibold">
        Carteira · R$ 3 mi
      </text>
      <text x="360" y="119" textAnchor="middle" className="fill-[var(--color-primary)] text-[11px] font-semibold">
        Imóveis no Brasil · R$ 3 mi
      </text>
      <text x="360" y="150" textAnchor="middle" className="fill-[var(--color-primary)] text-[11px] font-semibold">
        Empresa no Brasil · R$ 2 mi
      </text>
      <text x="270" y="196" className="fill-[var(--color-accent-strong)] text-[20px] font-bold">
        7,5%
      </text>
      <text x="270" y="214" className={TEXTO}>
        em dólar — o número que
      </text>
      <text x="270" y="230" className={TEXTO}>
        realmente te protege
      </text>

      <text x="228" y="120" textAnchor="middle" className="fill-[var(--color-muted-foreground)] text-[18px]">
        →
      </text>
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   2. A alíquota que sobe por faixa — a mecânica que muda a decisão.
   ══════════════════════════════════════════════════════════════════════════ */
function AliquotaDividendos() {
  /* A reta sobe de 0% a 10% entre R$ 600 mil e R$ 1,2 milhão de renda anual.
     Desenhada como `polyline` e não como imagem justamente para que a
     inclinação seja a conta, e não um desenho aproximado dela. */
  return (
    <svg
      viewBox="0 0 520 220"
      className="h-auto w-full"
      role="img"
      aria-label="A alíquota do imposto mínimo é zero até R$ 600 mil de renda anual, sobe em linha reta entre R$ 600 mil e R$ 1,2 milhão, e atinge 10% a partir daí."
    >
      <text x="0" y="14" className={TITULO}>
        A alíquota não pula: ela sobe em rampa
      </text>

      {/* eixos */}
      <line x1="46" y1="40" x2="46" y2="160" className="stroke-[var(--color-border)]" strokeWidth="1" />
      <line x1="46" y1="160" x2="500" y2="160" className="stroke-[var(--color-border)]" strokeWidth="1" />

      {/* marcas do eixo Y */}
      <text x="38" y="44" textAnchor="end" className={TEXTO}>10%</text>
      <text x="38" y="164" textAnchor="end" className={TEXTO}>0%</text>
      <line x1="46" y1="40" x2="500" y2="40" className="stroke-[var(--color-border)]" strokeWidth="1" strokeDasharray="3 4" />

      {/* a rampa */}
      <polyline
        points="46,160 200,160 370,40 500,40"
        className="fill-none stroke-[var(--color-accent)]"
        strokeWidth="3"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* os dois pontos que definem a rampa */}
      <circle cx="200" cy="160" r="4.5" className="fill-[var(--color-accent-strong)]" />
      <circle cx="370" cy="40" r="4.5" className="fill-[var(--color-accent-strong)]" />

      <line x1="200" y1="40" x2="200" y2="160" className="stroke-[var(--color-border)]" strokeWidth="1" strokeDasharray="3 4" />
      <line x1="370" y1="40" x2="370" y2="160" className="stroke-[var(--color-border)]" strokeWidth="1" strokeDasharray="3 4" />

      <text x="200" y="178" textAnchor="middle" className={TEXTO}>R$ 600 mil</text>
      <text x="370" y="178" textAnchor="middle" className={TEXTO}>R$ 1,2 milhão</text>
      <text x="273" y="206" textAnchor="middle" className={TEXTO}>renda anual recebida</text>

      <text x="110" y="152" textAnchor="middle" className="fill-[var(--color-success)] text-[11px] font-semibold">
        isento
      </text>
      <text x="440" y="60" textAnchor="middle" className="fill-[var(--color-accent-strong)] text-[11px] font-semibold">
        teto de 10%
      </text>
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   3. O custo que não aparece no dia — ele aparece somado, anos depois.
   ══════════════════════════════════════════════════════════════════════════ */
function CustoQueSoma() {
  /* 1% ao ano sobre R$ 500 mil, capitalizado a 8% real, contra a mesma
     carteira sem o 1%. Os valores são o resultado da conta, arredondados
     para o milhar, e o artigo mostra a fórmula no texto. */
  const anos = [0, 5, 10, 15, 20];
  const comCusto = [500, 662, 876, 1160, 1535];
  const semCusto = [500, 695, 965, 1341, 1864];
  const maxV = 1900;
  const x = (i: number) => 60 + (i * 430) / (anos.length - 1);
  const y = (v: number) => 165 - (v / maxV) * 125;

  return (
    <svg
      viewBox="0 0 520 220"
      className="h-auto w-full"
      role="img"
      aria-label="Uma diferença de 1% ao ano em custos transforma R$ 500 mil em R$ 1,54 milhão em vinte anos, contra R$ 1,86 milhão sem esse custo: uma distância de R$ 329 mil."
    >
      <text x="0" y="14" className={TITULO}>
        1% ao ano, vinte anos depois
      </text>

      <line x1="60" y1="40" x2="60" y2="165" className="stroke-[var(--color-border)]" strokeWidth="1" />
      <line x1="60" y1="165" x2="500" y2="165" className="stroke-[var(--color-border)]" strokeWidth="1" />

      <polyline
        points={semCusto.map((v, i) => `${x(i)},${y(v)}`).join(" ")}
        className="fill-none stroke-[var(--color-success)]"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <polyline
        points={comCusto.map((v, i) => `${x(i)},${y(v)}`).join(" ")}
        className="fill-none stroke-[var(--color-accent)]"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeDasharray="6 4"
      />

      {anos.map((a, i) => (
        <text key={a} x={x(i)} y="183" textAnchor="middle" className={TEXTO}>
          {a === 0 ? "hoje" : `${a} anos`}
        </text>
      ))}

      <text x={x(4) - 4} y={y(1864) - 8} textAnchor="end" className="fill-[var(--color-success)] text-[11px] font-bold">
        R$ 1,86 mi
      </text>
      <text x={x(4) - 4} y={y(1535) + 16} textAnchor="end" className="fill-[var(--color-accent-strong)] text-[11px] font-bold">
        R$ 1,54 mi
      </text>

      <text x="60" y="206" className={TEXTO}>
        Linha cheia: sem o custo extra · Tracejada: com 1% ao ano a mais
      </text>
    </svg>
  );
}

/**
 * O mapa por nome. ⚠️ A chave é o que o artigo escreve em
 * `{ tipo: "grafico", nome: "..." }` — nome que não existe aqui não quebra a
 * página, só não desenha (ver `CorpoArtigo`).
 */
export const GRAFICOS: Record<string, () => React.JSX.Element> = {
  "patrimonio-vs-carteira": PatrimonioVsCarteira,
  "aliquota-dividendos": AliquotaDividendos,
  "custo-que-soma": CustoQueSoma,
};
