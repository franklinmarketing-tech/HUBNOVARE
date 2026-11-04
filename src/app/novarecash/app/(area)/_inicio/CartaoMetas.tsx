import Link from "next/link";
import { ArrowRight, Flag, Plus } from "lucide-react";

import { fraseDaMeta, progressoDaMeta, type ResultadoMetas } from "@/lib/novarecash/metas";
import { ICONE_DA_META } from "../_insights/pecas-insights";
import { ANEL, Barra, Cartao, brl } from "../pecas";

/**
 * CARTÃO DE METAS DO INÍCIO: até 3 metas em andamento, com a barra e o
 * "quanto guardar por mês". Sem hooks: serve à página de servidor do Início.
 *
 * COMO USAR (no `(area)/page.tsx`):
 *   const uid = await usuarioDaSessao(supabase);
 *   const metas = await carregarMetas(supabase, uid);   // nunca lança
 *   <CartaoMetas resultado={metas} />
 * Ou, sem consulta a mais, `retrato.metas` de `carregarRetrato`.
 */
export function CartaoMetas({ resultado }: { resultado: ResultadoMetas }) {
  const abertas = resultado.estado === "ok" ? resultado.metas.filter((m) => !m.concluida) : [];
  return (
    <Cartao className="p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-base font-semibold text-white">
          <Flag className="h-4 w-4 text-ouro" aria-hidden />
          Metas
        </h2>
        <Link
          href="/novarecash/app/metas"
          className={`inline-flex min-h-11 items-center gap-1 rounded-lg px-1 text-xs font-semibold text-ouro hover:underline ${ANEL}`}
        >
          {abertas.length ? "Ver todas" : "Abrir"} <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>

      {resultado.estado === "sem-tabela" ? (
        <p className="mt-2 text-xs leading-relaxed text-white/70">As metas aparecem aqui assim que a instalação terminar.</p>
      ) : resultado.estado === "erro" ? (
        <p className="mt-2 text-xs leading-relaxed text-white/70">Não consegui ler as metas agora. Recarregue em instantes.</p>
      ) : abertas.length === 0 ? (
        <div className="mt-2">
          <p className="text-xs leading-relaxed text-white/70">
            {resultado.metas.length
              ? "Todas as metas foram concluídas. Que tal a próxima?"
              : "Uma reserva, uma viagem, a entrada da casa: diga quanto quer juntar e até quando."}
          </p>
          <Link
            href="/novarecash/app/metas"
            className={`mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/20 px-4 text-sm font-semibold text-white hover:border-ouro/60 ${ANEL}`}
          >
            <Plus className="h-4 w-4 text-ouro" aria-hidden /> Criar meta
          </Link>
        </div>
      ) : (
        <ul className="mt-3 space-y-4">
          {abertas.slice(0, 3).map((m) => {
            const Icone = ICONE_DA_META[m.icone];
            const p = progressoDaMeta(m);
            return (
              <li key={m.id}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-white">
                    <Icone className="h-4 w-4 shrink-0 text-ciano-claro" aria-hidden />
                    <span className="truncate">{m.nome}</span>
                  </span>
                  <span className="shrink-0 text-xs tabular-nums text-white/70">
                    <strong className="font-semibold text-white">{brl(m.guardado)}</strong> de {brl(m.valorAlvo)}
                  </span>
                </div>
                <div className="mt-1.5">
                  <Barra fracao={p.fracao} tom="ouro" />
                </div>
                <p className="mt-1 text-2xs text-white/65">{fraseDaMeta(m)}</p>
              </li>
            );
          })}
        </ul>
      )}
    </Cartao>
  );
}
