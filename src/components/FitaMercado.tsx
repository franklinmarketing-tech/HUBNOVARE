import Link from "next/link";

import { getCartoesIndicadores } from "@/lib/indicadores";
import { formatarPontos, getCotacoes, getIndicesBolsa } from "@/lib/indices-bolsa";
import { getJurosFuturos, getTesouroIpca } from "@/lib/juros-tesouro";

/**
 * A FITA DO MERCADO no topo do Workspace (pedido do dono, 21/10/2026, no
 * formato do TradeMap): uma linha fina e escura que corre sozinha, com
 * nome · valor · variação de cada indicador, separados por um traço.
 *
 * Ordem: IPCA, Selic, CDI e IGP-M (Banco Central), Ibovespa e IBrX 50,
 * dólar, euro, bitcoin, ouro e as bolsas de fora. Para quando o mouse passa
 * por cima; quem pediu menos movimento vê a linha parada, com rolagem.
 * Cada item leva para /indicadores. Fonte que não respondeu: o item some.
 */
type Item = { chave: string; nome: string; valor: string; unidade?: string; pct?: number };

const fmtPct = (v: number) => `${v >= 0 ? "+" : ""}${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;

export async function FitaMercado() {
  const [bcb, bolsas, cotacoes, di, td] = await Promise.all([getCartoesIndicadores(), getIndicesBolsa(), getCotacoes(), getJurosFuturos(), getTesouroIpca()]);

  const doBcb = (chave: string, nome: string): Item | null => {
    const c = bcb.find((x) => x.chave === chave);
    if (!c?.valor) return null;
    // "13,75% a.a." vira "13,75%": a fita é curta.
    return { chave, nome, valor: c.valor.replace(" a.a.", "") };
  };
  const daBolsa = (simbolo: string): Item | null => {
    const b = bolsas.find((x) => x.simbolo === simbolo) ?? cotacoes.find((x) => x.simbolo === simbolo);
    if (!b) return null;
    const casas = b.unidade && b.ultimo < 100 ? 4 : 2;
    const valor = b.unidade
      ? b.ultimo.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas })
      : formatarPontos(b.ultimo);
    return { chave: simbolo, nome: b.nome, valor, unidade: b.unidade, pct: b.variacaoPct };
  };

  // DI de janeiro do ano que vem e o IPCA+ mais curto à venda (pedido do Jefferson, 26/10/2026).
  const fmtTaxa = (v: number) => `${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
  const di1 = di.contratos[0];
  const ipcaMais = td.titulos.find((t) => !t.jurosSemestrais) ?? td.titulos[0];
  const itens = [
    doBcb("ipca", "IPCA"),
    doBcb("selic", "Selic"),
    doBcb("cdi", "CDI"),
    di1 ? { chave: "di", nome: `DI ${di1.rotulo}`, valor: fmtTaxa(di1.taxa) } : null,
    ipcaMais ? { chave: "ipca-mais", nome: `IPCA+ ${ipcaMais.ano}`, valor: `IPCA + ${fmtTaxa(ipcaMais.taxaReal)}` } : null,
    doBcb("igpm", "IGP-M"),
    daBolsa("^BVSP"),
    daBolsa("^IBX50"),
    daBolsa("BRL=X"),
    daBolsa("EURBRL=X"),
    daBolsa("BTC-USD"),
    daBolsa("GC=F"),
    daBolsa("^GSPC"),
    daBolsa("^DJI"),
    daBolsa("^IXIC"),
    daBolsa("^GDAXI"),
    daBolsa("^VIX"),
  ].filter((x): x is Item => x !== null);
  if (!itens.length) return null;

  return (
    <div className="fita-topo border-b border-white/10 bg-noite text-white" aria-label="Indicadores do mercado">
      <ul>
        {[...itens, ...itens].map((it, i) => (
          <li key={`${it.chave}-${i}`} aria-hidden={i >= itens.length || undefined} data-dup={i >= itens.length || undefined}>
            <Link
              href="/indicadores"
              tabIndex={i >= itens.length ? -1 : undefined}
              className="flex h-10 items-center gap-2.5 whitespace-nowrap border-r border-white/10 px-5 text-[13px] transition-colors hover:bg-white/[0.05]"
            >
              <span className="font-semibold uppercase tracking-[0.08em] text-white/70">{it.nome}</span>
              <span className="font-semibold tabular-nums text-white">
                {it.unidade && <span className="mr-0.5 text-[11px] font-medium text-white/60">{it.unidade}</span>}
                {it.valor}
              </span>
              {it.pct !== undefined && (
                <span className={`font-semibold tabular-nums ${it.pct >= 0 ? "text-[hsl(152_65%_58%)]" : "text-[hsl(0_85%_68%)]"}`}>
                  {fmtPct(it.pct)}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
