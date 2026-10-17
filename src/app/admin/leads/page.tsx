import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Mail, Phone, Users, Download } from "lucide-react";
import { Cabecalho } from "@/components/Cabecalho";
import { createClient } from "@/lib/supabase/server";
import { getPerfil } from "@/lib/perfil";

export const metadata = { title: "Leads captados" };

type Lead = {
  id: string;
  email: string;
  nome: string | null;
  telefone: string | null;
  origem: string | null;
  tipo: string | null;
  payload: Record<string, unknown> | null;
  criado_em: string;
};

/** Só os dígitos, para montar o link do WhatsApp. */
const zapDe = (tel: string) => {
  const d = tel.replace(/\D/g, "");
  return d.length >= 10 ? `https://wa.me/55${d}` : null;
};

const TIPO = {
  "vida-plan": { rotulo: "FINPLAN", cls: "bg-sky-100 text-sky-700" },
  "saude-financeira": { rotulo: "Exame de Saúde", cls: "bg-emerald-100 text-emerald-700" },
  cupom: { rotulo: "Cupom", cls: "bg-amber-100 text-amber-700" },
  produto: { rotulo: "Produto", cls: "bg-indigo-100 text-indigo-700" },
  ferramenta: { rotulo: "Ferramenta", cls: "bg-slate-100 text-slate-600" },
} as const;

function resumo(l: Lead): string {
  const p = l.payload ?? {};
  if (l.tipo === "saude-financeira" && p.score != null) return `Nota ${p.score}/100`;
  if (l.tipo === "vida-plan" && p.pct != null) return `${p.pct}% do Marco Horizonte`;
  if (l.tipo === "cupom" && p.cupom != null)
    return p.desconto != null ? `${p.cupom} · ${p.desconto}% OFF` : String(p.cupom);
  if (l.tipo === "produto" && p.produto != null) return `Interesse: ${p.produto}`;
  return l.origem ?? "—";
}

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tipo?: string }>;
}) {
  const { q, tipo: tipoFiltro } = await searchParams;
  const busca = (q ?? "").trim().toLowerCase();
  /* ⚠️ A GUARDA DE PAPEL SAIU DAQUI em 17/10/2026 — passou para o
     `layout.tsx` desta pasta, que protege TODA tela sob /admin, inclusive
     as que ainda não existem. Estava copiada em três arquivos, e três
     cópias da mesma regra é a receita de uma tela nova nascer sem ela. */

  const supabase = await createClient();
  const { data } = await supabase
    .from("hub_leads")
    .select("id, email, nome, telefone, origem, tipo, payload, criado_em")
    .order("criado_em", { ascending: false })
    .limit(500);
  const todos = (data as Lead[]) ?? [];

  /* ⚠️ O FILTRO É EM MEMÓRIA, sobre os 500 que vieram — não no banco. Com
     a base atual é instantâneo e evita uma consulta por tecla. Se passar
     de alguns milhares, o lugar certo é o `.ilike()` do PostgREST, e aí a
     paginação deixa de ser opcional. */
  const leads = todos.filter((l) => {
    if (tipoFiltro && l.tipo !== tipoFiltro) return false;
    if (!busca) return true;
    return [l.email, l.nome, l.telefone, l.origem]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(busca));
  });

  const contagem =
    leads.length === todos.length
      ? `${leads.length} leads`
      : `${leads.length} de ${todos.length} leads`;
  const exportar = `/api/leads/csv?q=${encodeURIComponent(busca)}&tipo=${encodeURIComponent(tipoFiltro ?? '')}`;

  const porTipo = (t: string) => leads.filter((l) => l.tipo === t).length;

  return (
    <>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="font-display text-2xl font-bold text-primary">Leads captados</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  E-mails deixados nas calculadoras e landing pages do Hub.
                </p>
              </div>
              <div className="flex gap-2.5 text-center">
                {[
                  { n: leads.length, r: "Total" },
                  { n: porTipo("saude-financeira"), r: "Exame" },
                  { n: porTipo("vida-plan"), r: "FINPLAN" },
                ].map((c) => (
                  <div key={c.r} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 shadow-sm">
                    <p className="font-display text-xl font-extrabold tabular-nums text-primary">{c.n}</p>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{c.r}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* BUSCA E EXPORT — a tela despejava 500 leads crus, sem jeito
                de achar um. Form GET, sem JavaScript: o estado fica na URL
                e o link pode ser mandado para a equipe já filtrado. */}
            <form className="mt-6 flex flex-wrap items-center gap-2">
              <input
                type="search"
                name="q"
                defaultValue={q ?? ""}
                placeholder="Buscar por e-mail, nome, telefone ou origem"
                className="h-10 min-w-[16rem] flex-1 rounded-xl border border-border bg-white px-3.5 text-sm outline-none transition-colors focus:border-accent focus:ring-4 focus:ring-accent/12"
              />
              {tipoFiltro && <input type="hidden" name="tipo" value={tipoFiltro} />}
              <button
                type="submit"
                className="h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-soft"
              >
                Buscar
              </button>
              {(busca || tipoFiltro) && (
                <Link
                  href="/admin/leads"
                  className="h-10 rounded-xl border border-border px-4 text-sm font-semibold leading-10 text-muted-foreground transition-colors hover:bg-muted"
                >
                  Limpar
                </Link>
              )}
              <a
                href={exportar}
                className="flex h-10 items-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold text-primary transition-colors hover:bg-muted"
              >
                <Download className="h-4 w-4" />
                Baixar CSV
              </a>
            </form>

            <p className="mt-3 text-xs text-muted-foreground">{contagem}</p>

            {leads.length === 0 ? (
              <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
                <Users className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-3 text-sm font-medium text-slate-500">Ainda não há leads captados.</p>
                <p className="mt-1 text-xs text-slate-400">
                  Assim que alguém deixar o e-mail numa calculadora, aparece aqui.
                </p>
              </div>
            ) : (
              <div className="mt-6 overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wider text-muted-foreground">
                      <th className="px-4 py-3 font-semibold">Quando</th>
                      <th className="px-4 py-3 font-semibold">Contato</th>
                      <th className="px-4 py-3 font-semibold">Origem</th>
                      <th className="px-4 py-3 font-semibold">Resumo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((l) => {
                      const t = TIPO[(l.tipo ?? "ferramenta") as keyof typeof TIPO] ?? TIPO.ferramenta;
                      return (
                        <tr key={l.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                          <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                            {new Date(l.criado_em).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" })}
                          </td>
                          <td className="px-4 py-3">
                            {l.nome && (
                              <p className="font-semibold text-foreground">{l.nome}</p>
                            )}
                            <a
                              href={`mailto:${l.email}`}
                              className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                            >
                              <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                              {l.email}
                            </a>
                            {l.telefone &&
                              (zapDe(l.telefone) ? (
                                <a
                                  href={zapDe(l.telefone)!}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-success-strong hover:underline"
                                >
                                  <Phone className="h-3.5 w-3.5 shrink-0" />
                                  {l.telefone}
                                </a>
                              ) : (
                                <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <Phone className="h-3.5 w-3.5 shrink-0" />
                                  {l.telefone}
                                </span>
                              ))}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${t.cls}`}>{t.rotulo}</span>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-600">{resumo(l)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
    </>
  );
}
