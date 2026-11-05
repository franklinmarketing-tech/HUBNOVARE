import { Clock, FlaskConical } from "lucide-react";

/**
 * Os dois avisos de um recurso que ainda não está no ar para o cliente
 * (`RECURSOS[].noAr = false` em `src/lib/novarecash/config.ts`).
 *
 * Componentes de servidor, sem estado: a decisão de qual aparece já veio de
 * `estadoDoRecurso()`.
 */

/** O que o CLIENTE vê: a data prometida, e nada que pareça funcionar. */
export function EmAtivacao({
  titulo,
  liberaEm,
  children,
}: {
  titulo: string;
  liberaEm?: string;
  children?: React.ReactNode;
}) {
  return (
    <div data-guia="ativacao" className="rounded-2xl border border-dashed border-ouro/35 bg-ouro/[0.06] p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ouro/15 text-ouro ring-1 ring-ouro/25"
        >
          <Clock className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="font-display text-base font-semibold text-white">{titulo}: em ativação</p>
          <p className="mt-1 text-sm font-semibold text-ouro">
            {liberaEm ? `Libera em ${liberaEm}.` : "Libera em breve."}
          </p>
          {children && <div className="mt-2 max-w-prose text-xs leading-relaxed text-white/70">{children}</div>}
        </div>
      </div>
    </div>
  );
}

/** O que a EQUIPE vê acima da tela funcionando: lembrete de que o cliente ainda não vê isto. */
export function AvisoModoEquipe({ liberaEm }: { liberaEm?: string }) {
  return (
    <p className="mb-4 flex items-start gap-2 rounded-xl border border-ciano/30 bg-ciano/10 px-4 py-3 text-xs leading-relaxed text-ciano-claro">
      <FlaskConical className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>
        <strong className="font-semibold">Modo equipe.</strong> O cliente ainda vê &ldquo;em ativação&rdquo;
        {liberaEm ? ` (libera em ${liberaEm})` : ""}. Para ligar para todos, troque{" "}
        <code className="rounded bg-white/10 px-1 font-mono text-2xs">noAr</code> para{" "}
        <code className="rounded bg-white/10 px-1 font-mono text-2xs">true</code> em{" "}
        <code className="break-all rounded bg-white/10 px-1 font-mono text-2xs">src/lib/novarecash/config.ts</code>.
      </span>
    </p>
  );
}
