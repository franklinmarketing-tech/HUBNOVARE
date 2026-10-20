/**
 * Linha dos últimos ~12 pontos de um indicador, com o último em laranja para
 * o olho achar o "hoje". SVG puro, renderizado no servidor — sem biblioteca
 * de gráfico para uma linha de 96 px. Usado em /indicadores e na home.
 */
export function Minigrafico({
  pontos,
  largura = 96,
  altura = 36,
  cor = "hsl(197 68% 45%)",
}: {
  pontos: number[];
  largura?: number;
  altura?: number;
  cor?: string;
}) {
  if (pontos.length < 2) return null;
  const min = Math.min(...pontos);
  const max = Math.max(...pontos);
  const faixa = max - min || 1;
  const xy = pontos.map(
    (v, i) => [(i / (pontos.length - 1)) * largura, altura - 4 - ((v - min) / faixa) * (altura - 8)] as const,
  );
  const linha = xy.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const [ux, uy] = xy.at(-1)!;
  return (
    <svg viewBox={`0 0 ${largura} ${altura}`} width={largura} height={altura} aria-hidden className="shrink-0 overflow-visible">
      <polyline points={`0,${altura} ${linha} ${largura},${altura}`} fill={cor} fillOpacity={0.12} stroke="none" />
      <polyline points={linha} fill="none" stroke={cor} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={ux} cy={uy} r="3.5" fill="hsl(16 80% 55%)" />
    </svg>
  );
}
