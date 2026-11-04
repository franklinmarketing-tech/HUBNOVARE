import Link from "next/link";
import { ArrowRight, Bell } from "lucide-react";

import type { ResultadoAlertas } from "@/lib/novarecash/insights";
import { ICONE_ALERTA, textoEconomia } from "../_insights/pecas-insights";
import { ANEL, Cartao, brl } from "../pecas";

/**
 * CARTÃO DE ALERTAS DO INÍCIO: o contador "R$ X/mês saindo sem você perceber"
 * e os 3 alertas principais. Sem hooks e sem estado: serve à página de
 * servidor do Início.
 *
 * COMO USAR (no `(area)/page.tsx`, com a sessão da pessoa):
 *   const uid = await usuarioDaSessao(supabase);
 *   const alertas = await carregarAlertas(supabase, uid);   // nunca lança
 *   <CartaoAlertas resultado={alertas} />
 * Ou, sem consulta a mais, `retrato.alertas` de `carregarRetrato`.
 */
export function CartaoAlertas({ resultado }: { resultado: ResultadoAlertas }) {
  return (
    <Cartao className="p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-base font-semibold text-white">
          <Bell className="h-4 w-4 text-ouro" aria-hidden />
          Alertas
        </h2>
        <Link
          href="/novarecash/app/alertas"
          className={`inline-flex min-h-11 items-center gap-1 rounded-lg px-1 text-xs font-semibold text-ouro hover:underline ${ANEL}`}
        >
          Ver todos <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>
      <Miolo resultado={resultado} />
    </Cartao>
  );
}

function Miolo({ resultado }: { resultado: ResultadoAlertas }) {
  if (resultado.estado === "sem-tabela") {
    return <p className="mt-2 text-xs leading-relaxed text-white/70">Os alertas aparecem quando o extrato estiver instalado.</p>;
  }
  if (resultado.estado === "erro") {
    return <p className="mt-2 text-xs leading-relaxed text-white/70">Não consegui analisar o extrato agora. Recarregue em instantes.</p>;
  }
  if (resultado.semDados) {
    return (
      <p className="mt-2 text-xs leading-relaxed text-white/70">
        Assim que houver lançamentos, o NovareCash procura assinaturas esquecidas, cobranças repetidas e tarifas.
      </p>
    );
  }
  if (resultado.alertas.length === 0) {
    return <p className="mt-2 text-xs leading-relaxed text-white/70">Nenhum alerta agora. Tudo em ordem por aqui.</p>;
  }

  return (
    <>
      {resultado.contador > 0 && (
        <p className="mt-2 text-sm text-white/80">
          Encontramos{" "}
          <strong className="font-display text-lg font-semibold tabular-nums text-ouro">{brl(resultado.contador)}/mês</strong>{" "}
          que podem estar saindo sem você perceber.
        </p>
      )}
      <ul className="mt-3 divide-y divide-white/[0.07]">
        {resultado.alertas.slice(0, 3).map((a) => {
          const Icone = ICONE_ALERTA[a.tipo];
          const economia = textoEconomia(a);
          return (
            <li key={a.chave}>
              <Link
                href="/novarecash/app/alertas"
                className={`flex min-h-11 items-start gap-3 rounded-lg py-2.5 hover:bg-white/[0.03] ${ANEL}`}
              >
                <Icone className="mt-0.5 h-4 w-4 shrink-0 text-ciano-claro" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block break-words text-sm font-medium text-white">{a.titulo}</span>
                  {economia && <span className="block text-2xs font-semibold text-ouro">{economia}</span>}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      {resultado.alertas.length > 3 && (
        <p className="mt-1 text-2xs text-white/55">E mais {resultado.alertas.length - 3} na tela de Alertas.</p>
      )}
    </>
  );
}
