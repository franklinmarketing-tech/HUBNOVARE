import Link from "next/link";
import { ArrowRight, CalendarClock } from "lucide-react";
import { getCalendarioEconomico, type EventoEconomico } from "@/lib/calendario-economico";

const FUSO = "America/Sao_Paulo";

/**
 * "PRÓXIMOS EVENTOS" NA HOME (22/10/2026): os três eventos fortes mais
 * próximos do calendário econômico, com o atalho para ele.
 *
 * Prefere os de importância alta (Copom, IPCA, Fed, Payroll, CPI, PIB) e
 * completa com os médios só se faltar. Sem dados (fontes fora do ar), o
 * bloco some em vez de mostrar uma caixa vazia na home.
 *
 * ⚠️ A home o carrega dentro de um <Suspense>: as fontes são de fora, e a
 * primeira leitura sem cache não pode segurar o resto da página.
 */
export async function ProximosEventos() {
  const { eventos } = await getCalendarioEconomico();
  const agora = Date.now();
  const futuros = eventos.filter((e) => Date.parse(e.quando) >= agora - 60 * 60 * 1000);
  const escolhidos = [...futuros.filter((e) => e.importancia === 3), ...futuros.filter((e) => e.importancia === 2)]
    .slice(0, 3)
    .sort((a, b) => a.quando.localeCompare(b.quando));
  if (!escolhidos.length) return null;

  return (
    <section aria-labelledby="proximos-eventos-t" className="cartao-cp border-2 border-primary/85 p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="chapeu chapeu-ciano">Calendário econômico</p>
          <h2 id="proximos-eventos-t" className="titulo-cp mt-1.5 text-xl sm:text-2xl">
            O que vem por aí no mercado
          </h2>
        </div>
        <Link href="/calendario-economico" className="group inline-flex items-center gap-1.5 text-sm font-semibold text-accent-strong">
          Ver o calendário completo
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      <ul className="mt-4 grid gap-3 md:grid-cols-3">
        {escolhidos.map((e) => (
          <li key={e.id}>
            <Cartao e={e} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function Cartao({ e }: { e: EventoEconomico }) {
  const data = new Date(e.quando);
  const dia = new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO, day: "2-digit" }).format(data);
  const mes = new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO, month: "short" }).format(data).replace(".", "");
  const semana = new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO, weekday: "long" }).format(data);
  const hora = e.semHora
    ? e.horaTexto ?? "dia todo"
    : new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO, hour: "2-digit", minute: "2-digit" }).format(data).replace(":", "h");

  return (
    <Link
      href="/calendario-economico"
      className="flex h-full gap-3.5 rounded-2xl border border-border bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-ciano"
    >
      <span className="flex w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-primary py-2 text-white">
        <span className="font-display text-xl font-semibold leading-none">{dia}</span>
        <span className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-white/75">{mes}</span>
      </span>
      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-1.5 text-2xs font-semibold text-muted-foreground">
          <span className={`rounded-full px-1.5 py-px ${e.pais === "BR" ? "bg-ciano-tint text-ciano-forte" : "bg-slate-100 text-slate-600"}`}>
            {e.pais === "BR" ? "Brasil" : "EUA"}
          </span>
          <span className="first-letter:uppercase">{semana}</span>· {hora}
        </span>
        <span className="mt-1 block font-semibold leading-snug text-primary">{e.titulo}</span>
        {e.projecao && (
          <span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarClock className="h-3.5 w-3.5" />
            Projeção do mercado: <strong className="font-semibold text-foreground">{e.projecao}</strong>
          </span>
        )}
      </span>
    </Link>
  );
}
