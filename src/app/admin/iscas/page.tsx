import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ExternalLink, Magnet, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getPerfil } from "@/lib/perfil";
import { APPS } from "@/lib/apps";
import { SITE_URL } from "@/lib/site";
import { FaltaRodarSql, Hero, Numero, SeletorDePeriodo } from "../pecas";
import { CopiarLink } from "./CopiarLink";

export const metadata = { title: "As iscas da Novare" };

/**
 * AS ISCAS: o que cada ferramenta está trazendo, e o link para divulgar.
 *
 * ⚠️ A LISTA VEM DE `APPS`, E NÃO DO BANCO. O catálogo é o código — é ele
 * que decide o que existe, o nome e o endereço. Se esta tela mantivesse a
 * própria lista, ferramenta nova nasceria invisível aqui, e ninguém
 * descobriria até alguém perguntar "por que a calculadora X não aparece no
 * painel?". O banco entra só com os NÚMEROS, casados pelo caminho.
 *
 * ⚠️ FERRAMENTA SEM NENHUMA VISITA APARECE IGUAL, com zero. Esconder o que
 * tem zero deixaria de fora justamente o que precisa de atenção: a isca que
 * ninguém abre é informação, não ausência de informação.
 */

type LinhaIsca = {
  caminho: string;
  visitas: number;
  visitantes: number;
  leads: number;
  ultimo: string | null;
};

export default async function PainelIscas({
  searchParams,
}: {
  searchParams: Promise<{ dias?: string }>;
}) {
  const perfil = await getPerfil();
  if (!perfil) redirect("/login?proximo=/admin/iscas");
  if (perfil.role !== "admin" && perfil.role !== "equipe") notFound();

  const { dias: diasBruto } = await searchParams;
  const dias = [7, 30, 90, 365].includes(Number(diasBruto)) ? Number(diasBruto) : 30;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("hub_iscas", { p_dias: dias });

  if (error) {
    return (
      <div className="space-y-6">
        <Hero etiqueta="Painel da Novare" titulo="As iscas" />
        <FaltaRodarSql erro={error.message} arquivo="painel_novare_INSTALAR.sql" />
      </div>
    );
  }

  const medidas = new Map<string, LinhaIsca>();
  for (const l of (data as LinhaIsca[]) ?? []) medidas.set(l.caminho, l);

  /* Só o que é isca de verdade: aberto a qualquer um, no ar. O que é
     interno ou ainda não existe não é material de divulgação. */
  const iscas = APPS.filter((a) => a.plano === "livre" && a.status === "ativo")
    .map((a) => {
      const m = medidas.get(a.href);
      return {
        ...a,
        visitas: m?.visitas ?? 0,
        visitantes: m?.visitantes ?? 0,
        leads: m?.leads ?? 0,
        url: `${SITE_URL}${a.href}`,
      };
    })
    .sort((a, b) => b.leads - a.leads || b.visitas - a.visitas || a.nome.localeCompare(b.nome));

  const totalVisitas = iscas.reduce((s, i) => s + i.visitas, 0);
  const totalLeads = iscas.reduce((s, i) => s + i.leads, 0);
  const comLead = iscas.filter((i) => i.leads > 0).length;

  /* ⚠️ Caminhos que o banco mediu e não estão no catálogo: landing pages,
     artigos do News, a Íris. Não são erro — são páginas que captam e não
     são "ferramentas". Mostrar separado evita a conclusão errada de que o
     número da tela não bate com o total do banco. */
  const foraDoCatalogo = [...medidas.values()]
    .filter((m) => !APPS.some((a) => a.href === m.caminho))
    .sort((a, b) => b.leads - a.leads || b.visitas - a.visitas)
    .slice(0, 12);

  return (
    <div className="space-y-6">
      <Hero
        etiqueta="Painel da Novare"
        titulo="As iscas"
        destaque={{ valor: totalLeads, rotulo: "leads no período" }}
        metricas={[
          { valor: iscas.length, rotulo: "iscas no ar" },
          { valor: totalVisitas, rotulo: "aberturas" },
          { valor: comLead, rotulo: "captaram alguém" },
        ]}
      >
        As {iscas.length} ferramentas gratuitas que trazem gente para a Novare.
        O link de cada uma está pronto para copiar e divulgar.
      </Hero>

      <SeletorDePeriodo base="/admin/iscas" dias={dias} />

      <div className="grid gap-3 sm:grid-cols-3">
        <Numero rotulo="Iscas no ar" valor={iscas.length} Icone={Magnet} tom="destaque" />
        <Numero
          rotulo="Aberturas no período"
          valor={totalVisitas}
          Icone={TrendingUp}
          detalhe={totalVisitas === 0 ? "a medição começou em 18/10/2026" : "visitas contadas"}
          tom="destaque"
        />
        <Numero
          rotulo="Leads que trouxeram"
          valor={totalLeads}
          detalhe={`${comLead} de ${iscas.length} captaram alguém`}
          tom="destaque"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[42rem] text-sm">
            <thead>
              <tr className="border-b border-border bg-slate-50/70 text-2xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 text-left font-semibold">Isca</th>
                <th className="px-3 py-3 text-right font-semibold">Aberturas</th>
                <th className="px-3 py-3 text-right font-semibold">Leads</th>
                <th className="px-4 py-3 text-right font-semibold">Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {iscas.map((i) => (
                <tr key={i.slug} className="transition-colors hover:bg-slate-50/60">
                  <td className="px-4 py-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <Link
                        href={i.href}
                        target="_blank"
                        className="min-w-0 truncate font-semibold text-primary hover:underline"
                      >
                        {i.nome}
                      </Link>
                      <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
                    </div>
                    <p className="mt-0.5 truncate text-2xs text-muted-foreground">
                      {i.chamada} · {i.href}
                    </p>
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    {i.visitas > 0 ? (
                      <>
                        <span className="font-semibold text-foreground">{i.visitas}</span>
                        <span className="block text-2xs text-muted-foreground">
                          {i.visitantes} logados
                        </span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    {i.leads > 0 ? (
                      <Link
                        href={`/admin/leads?q=${encodeURIComponent(i.href)}`}
                        className="font-display text-base font-bold text-primary hover:underline"
                      >
                        {i.leads}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <CopiarLink url={i.url} nome={i.nome} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {foraDoCatalogo.length > 0 && (
        <section>
          <h2 className="font-display text-sm font-semibold text-primary">
            Outras páginas que captaram
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Landing pages, artigos e a Íris — captam, mas não são ferramentas do catálogo.
          </p>
          <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
            <ul className="divide-y divide-border/60">
              {foraDoCatalogo.map((m) => (
                <li key={m.caminho} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="min-w-0 flex-1 truncate font-mono text-xs text-foreground">
                    {m.caminho}
                  </span>
                  <span className="shrink-0 text-2xs tabular-nums text-muted-foreground">
                    {m.visitas} aberturas · <b className="text-primary">{m.leads}</b> leads
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {totalVisitas === 0 && (
        <p className="rounded-2xl border border-dashed border-border bg-white px-5 py-4 text-xs leading-relaxed text-muted-foreground">
          <b className="text-primary">As aberturas ainda estão em zero</b> — a medição
          de uso entrou no ar em 18/10/2026 e não é retroativa. Os leads abaixo são
          reais; as visitas vão aparecer conforme as pessoas usarem as ferramentas.
        </p>
      )}
    </div>
  );
}
