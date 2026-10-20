import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { getCartoesIndicadores } from "@/lib/indicadores";
import { Minigrafico } from "@/components/Minigrafico";

/**
 * OS INDICADORES NA HOME, LOGO ABAIXO DAS VITRINES (pedido do dono, 20/10/2026: "trazer na home,
 * chamando a atenção" e "abaixo dos cards"). Seis cartões noite com o número de hoje e o
 * minigráfico, e a porta para /indicadores.
 *
 * ⚠️ SUBSTITUI O "O mercado hoje, em português" (`MercadoEmPortugues`), que
 * mostrava parte destes mesmos números em cartões claros no meio da página:
 * os dois juntos seriam a mesma informação duas vezes.
 *
 * Os dados são os de `lib/indicadores.ts` (mesma fonte, mesmo cache de 6 h).
 * Cartão cuja série não respondeu simplesmente não aparece aqui — na home,
 * um buraco "indisponível" chamaria mais atenção do que o número.
 */
const NA_HOME = ["selic", "cdi", "ipca", "igpm", "dolar", "euro"];

export async function IndicadoresHome() {
  const cartoes = (await getCartoesIndicadores()).filter(
    (c) => NA_HOME.includes(c.chave) && c.valor,
  );
  if (!cartoes.length) return null;

  return (
    <section aria-labelledby="indicadores-home" className="cine">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="chapeu chapeu-ciano">Dados do Banco Central · hoje</p>
          <h2 id="indicadores-home" className="titulo-cp mt-2 text-2xl sm:text-[2rem]">
            Os números da economia,{" "}
            <span className="text-ciano-forte">em português.</span>
          </h2>
        </div>
        <Link href="/indicadores" className="group inline-flex items-center gap-2">
          <span className="btn-petroleo">Ver todos os indicadores</span>
          <span className="btn-seta" aria-hidden>
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </Link>
      </div>

      <ul className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {cartoes.map((c) => (
          <li key={c.chave}>
            <Link
              href={`/indicadores#${c.grupo.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, "-")}`}
              className="group flex h-full flex-col rounded-[1.25rem] bg-noite p-4 shadow-ciano ring-1 ring-white/10 transition-transform hover:-translate-y-0.5"
            >
              <span className="flex items-start justify-between gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ciano-claro">{c.nome}</span>
                <Minigrafico pontos={c.historico} largura={56} altura={24} cor="hsl(197 75% 68%)" />
              </span>
              <span className="mt-3 font-display text-[1.5rem] font-medium leading-none tracking-[-0.04em] text-white tabular-nums sm:text-[1.75rem]">
                {c.valor}
              </span>
              <span className="mt-1.5 text-2xs leading-snug text-white/60">{c.extra ?? c.referencia}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
