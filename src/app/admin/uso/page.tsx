import { BarChart3, Info } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

/**
 * O QUE OS CLIENTES ESTÃO ACESSANDO.
 *
 * ⚠️ ESTA TELA SÓ TEM DADO A PARTIR DE 17/10/2026. Antes dessa data a casa
 * não media nada — não havia tabela de evento nem biblioteca de analytics —,
 * então o histórico começa no dia em que `hub_eventos` foi criada. Não é bug
 * a lista aparecer curta nas primeiras semanas.
 *
 * ⚠️ E SÓ MEDE O QUE FOI INSTRUMENTADO. Cada tela precisa do
 * `<RegistrarUso modulo="..." />`; o que não tiver, não aparece aqui — e vai
 * parecer "não usado" em vez de "não medido". A lista do rodapé desta página
 * existe para que essa diferença fique explícita para quem lê.
 *
 * A guarda de papel vive no `layout.tsx` desta pasta.
 */

export const dynamic = "force-dynamic";

type Linha = {
  modulo: string;
  eventos: number;
  pessoas: number;
  ultimo: string;
};

function quando(iso: string) {
  const d = new Date(iso);
  const h = Math.round((Date.now() - d.getTime()) / 36e5);
  if (h < 1) return "agora há pouco";
  if (h < 24) return `há ${h} h`;
  const dias = Math.round(h / 24);
  return dias === 1 ? "ontem" : `há ${dias} dias`;
}

export default async function AdminUsoPage({
  searchParams,
}: {
  searchParams: Promise<{ dias?: string }>;
}) {
  const { dias: diasParam } = await searchParams;
  const dias = Math.min(Math.max(Number(diasParam) || 30, 1), 365);

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("hub_uso_por_modulo", {
    p_dias: dias,
  });

  /* 42P883/42P01: a função ou a tabela ainda não existem. É o estado normal
     antes de rodar o SQL, e merece instrução em vez de tela de erro. */
  const faltaSql =
    error && (error.code === "42883" || error.code === "42P01");
  const linhas = (data as Linha[] | null) ?? [];
  const totalEventos = linhas.reduce((s, l) => s + Number(l.eventos), 0);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="titulo-secao font-display text-2xl font-bold text-primary">
            O que está sendo usado
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Últimos {dias} dias · {totalEventos.toLocaleString("pt-BR")} aberturas
            registradas
          </p>
        </div>

        <div className="flex gap-1">
          {[7, 30, 90].map((d) => (
            <a
              key={d}
              href={`/admin/uso?dias=${d}`}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                d === dias
                  ? "bg-primary text-white"
                  : "border border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {d} dias
            </a>
          ))}
        </div>
      </div>

      {faltaSql ? (
        <div className="card-novare mt-6 p-6">
          <p className="flex items-start gap-2 text-sm text-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent-strong" />
            <span>
              A medição ainda não foi criada no banco. Rode{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                supabase/hub_eventos.sql
              </code>{" "}
              no SQL Editor do Supabase — é idempotente, pode rodar sem medo. A
              partir daí esta tela começa a encher sozinha.
            </span>
          </p>
        </div>
      ) : linhas.length === 0 ? (
        <div className="card-novare mt-6 p-6">
          <p className="text-sm text-muted-foreground">
            Nenhuma abertura registrada nesse período. Se o SQL já rodou, pode
            ser só o histórico ainda curto — a medição começou em 17/10/2026.
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-white">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-semibold">Módulo</th>
                <th className="px-4 py-3 font-semibold">Aberturas</th>
                <th className="px-4 py-3 font-semibold">Pessoas</th>
                <th className="px-4 py-3 font-semibold">Último acesso</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((l) => {
                /* A barra é proporcional ao mais usado, não ao total: com 20
                   módulos, proporção sobre o total vira 20 barras invisíveis. */
                const maior = Number(linhas[0].eventos) || 1;
                const pct = Math.round((Number(l.eventos) / maior) * 100);
                return (
                  <tr key={l.modulo} className="border-b border-border/70 last:border-0">
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2 font-semibold text-foreground">
                        <BarChart3 className="h-3.5 w-3.5 shrink-0 text-accent-strong" />
                        {l.modulo}
                      </span>
                      <span
                        aria-hidden
                        className="mt-1.5 block h-1.5 rounded-full bg-accent/70"
                        style={{ width: `${Math.max(pct, 4)}%` }}
                      />
                    </td>
                    <td className="px-4 py-3 font-semibold tabular-nums text-foreground">
                      {Number(l.eventos).toLocaleString("pt-BR")}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">
                      {Number(l.pessoas).toLocaleString("pt-BR")}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {quando(l.ultimo)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 flex items-start gap-2 text-2xs text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Só aparece aqui a tela que tem o registro ligado. Uma ferramenta sem
        instrumentação some da lista e parece &ldquo;não usada&rdquo;, quando na
        verdade é &ldquo;não medida&rdquo;.
      </p>
    </div>
  );
}
