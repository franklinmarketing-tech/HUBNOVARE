import { getJurosFuturos, getTesouroIpca, type ContratoDI } from "@/lib/juros-tesouro";

/**
 * JUROS FUTUROS E TESOURO IPCA+ na página de indicadores (pedido do Jefferson, 26/10/2026).
 * Só mostra o que a fonte devolveu; seção sem dado não aparece. Não recomenda título — mostra a
 * taxa do dia e o que ela significa.
 */
const pct = (v: number, casas = 2) => `${v.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas })}%`;
const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function quando(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso.includes("T") ? iso : iso.replace(" ", "T") + "-03:00");
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
}

/** A curva em SVG puro: pontos ligados, com a taxa em cima de cada vencimento. */
function Curva({ contratos }: { contratos: ContratoDI[] }) {
  const W = 640, H = 220, mx = 34, my = 30;
  const taxas = contratos.map((c) => c.taxa);
  const min = Math.floor(Math.min(...taxas) - 0.5), max = Math.ceil(Math.max(...taxas) + 0.5);
  const x = (i: number) => mx + (i * (W - 2 * mx)) / Math.max(1, contratos.length - 1);
  const y = (t: number) => H - my - ((t - min) / Math.max(0.01, max - min)) * (H - 2 * my);
  const linha = contratos.map((c, i) => `${x(i).toFixed(1)},${y(c.taxa).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`Curva de juros futuros: ${contratos.map((c) => `${c.rotulo} ${pct(c.taxa)}`).join(", ")}`}>
      <polyline points={linha} fill="none" stroke="var(--color-ciano)" strokeWidth={3} strokeLinejoin="round" />
      {contratos.map((c, i) => (
        <g key={c.codigo}>
          <circle cx={x(i)} cy={y(c.taxa)} r={4.5} fill="var(--color-primary)" />
          <text x={x(i)} y={y(c.taxa) - 11} textAnchor="middle" fontSize={11} fontWeight={600} fill="var(--color-primary)">
            {c.taxa.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </text>
          <text x={x(i)} y={H - 8} textAnchor="middle" fontSize={11} fill="currentColor" opacity={0.65}>
            {c.rotulo}
          </text>
        </g>
      ))}
    </svg>
  );
}

export async function JurosTesouro() {
  const [di, td] = await Promise.all([getJurosFuturos(), getTesouroIpca()]);
  if (!di.contratos.length && !td.titulos.length) return null;
  const curto = di.contratos[0];
  const longo = di.contratos[di.contratos.length - 1];

  return (
    <section id="juros-futuros" aria-labelledby="juros-futuros-t" className="mt-12 scroll-mt-24">
      <p className="chapeu chapeu-ciano">Indicadores</p>
      <h2 id="juros-futuros-t" className="titulo-cp mt-2 text-2xl sm:text-[2rem]">Juros futuros e Tesouro IPCA+</h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
        O que o mercado espera para os juros nos próximos anos, e quanto o Tesouro paga acima da inflação hoje.
        São taxas do dia, não recomendação de investimento.
      </p>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        {di.contratos.length > 0 && (
          <article className="cartao-cp p-5 sm:p-6">
            <h3 className="font-display text-lg font-semibold text-primary">Curva de juros futuros (DI)</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Cada ponto é a taxa que o mercado negocia hoje para o CDI até aquele vencimento, em % ao ano.
              {curto && longo && curto.codigo !== longo.codigo
                ? ` Curto prazo (${curto.rotulo}): ${pct(curto.taxa)}; longo (${longo.rotulo}): ${pct(longo.taxa)}.`
                : ""}
            </p>
            {/* No celular o gráfico ficaria com número miúdo: vira uma grade de vencimentos. */}
            <div className="mt-3 hidden text-primary sm:block">
              <Curva contratos={di.contratos} />
            </div>
            <ul className="mt-3 grid grid-cols-3 gap-2 sm:hidden">
              {di.contratos.map((c) => (
                <li key={c.codigo} className="rounded-xl bg-muted/60 px-2.5 py-2 text-center">
                  <span className="block text-[11px] text-muted-foreground">{c.rotulo}</span>
                  <span className="block text-sm font-semibold tabular-nums text-primary">{pct(c.taxa)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Fonte: B3 (contratos DI1 de janeiro){di.doPregaoAnterior ? ", ajuste do pregão anterior" : ", última negociação"}
              {quando(di.atualizado) ? ` · ${quando(di.atualizado)}` : ""} · atraso de cerca de 15 minutos.
            </p>
          </article>
        )}

        {td.titulos.length > 0 && (
          <article className="cartao-cp p-5 sm:p-6">
            <h3 className="font-display text-lg font-semibold text-primary">Tesouro IPCA+ hoje</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              A taxa é o ganho acima da inflação, por ano, para quem compra hoje e leva até o vencimento.
            </p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                    <th className="py-2 pr-3 font-semibold">Título</th>
                    <th className="py-2 pr-3 text-right font-semibold">Taxa</th>
                    <th className="py-2 text-right font-semibold">Preço</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {td.titulos.map((t) => (
                    <tr key={t.nome}>
                      <td className="py-2.5 pr-3">
                        <span className="block whitespace-nowrap font-semibold text-primary">IPCA+ {t.ano}</span>
                        {t.jurosSemestrais && <span className="block text-[11px] text-muted-foreground">juros semestrais</span>}
                      </td>
                      <td className="whitespace-nowrap py-2.5 pr-3 text-right font-semibold tabular-nums text-primary">IPCA + {pct(t.taxaReal)}</td>
                      <td className="whitespace-nowrap py-2.5 text-right text-xs tabular-nums text-muted-foreground sm:text-sm">{brl(t.preco)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Fonte: Tesouro Direto (taxas de compra){quando(td.atualizado) ? ` · ${quando(td.atualizado)}` : ""}. O preço é de um título
              inteiro; dá para comprar frações
              {td.titulos[0].minimo > 0 ? ` (no IPCA+ ${td.titulos[0].ano}, o mínimo hoje é ${brl(td.titulos[0].minimo)})` : ""}.
            </p>
          </article>
        )}
      </div>
    </section>
  );
}
