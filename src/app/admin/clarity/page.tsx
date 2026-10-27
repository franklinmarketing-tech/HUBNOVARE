import { notFound, redirect } from "next/navigation";
import { MousePointerClick, Timer, Undo2, Users } from "lucide-react";
import { getPerfil } from "@/lib/perfil";
import { getResumoClarity, type LinhaClarity } from "@/lib/clarity";
import { Hero, Numero } from "../pecas";

export const metadata = { title: "Mapa de cliques" };

/**
 * /admin/clarity — ONDE AS PESSOAS TRAVAM (27/10/2026). Os números do Microsoft Clarity por página:
 * cliques de raiva (vários cliques seguidos no mesmo lugar), cliques mortos (clique que não faz
 * nada), volta rápida (abriu e voltou na hora) e quanto rolam. As piores páginas no topo.
 * Os vídeos e mapas de calor continuam no próprio Clarity — o link fica aqui.
 */
const PAINEL_CLARITY = "https://clarity.microsoft.com/projects/view/z3aldxjmm0/dashboard";

const segundos = (s: number | null) => (s == null ? "—" : s >= 60 ? `${Math.floor(s / 60)} min ${Math.round(s % 60)} s` : `${Math.round(s)} s`);
const atrito = (l: LinhaClarity) => l.cliquesRaiva * 3 + l.cliquesMortos * 2 + l.voltaRapida + l.errosScript * 2;

export default async function AdminClarityPage() {
  const perfil = await getPerfil();
  if (!perfil) redirect("/login?proximo=/admin/clarity");
  if (perfil.role !== "admin" && perfil.role !== "equipe") notFound();

  const r = await getResumoClarity(3);

  if (r.estado !== "ok") {
    return (
      <div className="space-y-6">
        <Hero etiqueta="Painel da Novare" titulo="Mapa de cliques" />
        <section className="cartao-cp space-y-3 p-6 text-sm leading-relaxed text-slate-700">
          {r.estado === "sem-chave" ? (
            <>
              <p className="font-semibold text-primary">Falta ligar a chave do Clarity (uma vez só).</p>
              <ol className="list-decimal space-y-1.5 pl-5">
                <li>
                  No Clarity, abra <b>Configurações → Exportação de dados</b> e clique em <b>Gerar novo token de API</b>. Copie o token.
                </li>
                <li>
                  Na Vercel, projeto <b>novare-workspace</b> → <b>Settings → Environment Variables</b>: crie <code>CLARITY_API_TOKEN</code> com o token, ambiente <b>Production</b>.
                </li>
                <li>Faça um novo deploy (ou me peça). A partir daí os números aparecem aqui, atualizados a cada 3 horas.</li>
              </ol>
              <p className="text-xs text-slate-500">O token é secreto: fica só na Vercel, nunca no código.</p>
            </>
          ) : (
            <p>{r.mensagem}</p>
          )}
          <a href={PAINEL_CLARITY} target="_blank" rel="noopener noreferrer" className="inline-flex font-semibold text-accent-strong hover:underline">
            Abrir o Clarity →
          </a>
        </section>
      </div>
    );
  }

  const linhas = [...r.linhas].sort((a, b) => atrito(b) - atrito(a) || b.sessoes - a.sessoes);
  const raiva = linhas.reduce((s, l) => s + l.cliquesRaiva, 0);
  const mortos = linhas.reduce((s, l) => s + l.cliquesMortos, 0);
  const volta = linhas.reduce((s, l) => s + l.voltaRapida, 0);

  return (
    <div className="space-y-6">
      <Hero etiqueta="Painel da Novare" titulo="Mapa de cliques" destaque={{ valor: r.totalSessoes, rotulo: `visitas nos últimos ${r.dias} dias` }}>
        Onde as pessoas travam, página por página. Só conta quem aceitou os cookies; o FINCASH sai mascarado e o login fica de fora.
      </Hero>

      <section className="grid gap-3 sm:grid-cols-4">
        <Numero rotulo="Visitas" valor={r.totalSessoes} Icone={Users} />
        <Numero rotulo="Cliques de raiva" valor={raiva} detalhe="vários cliques seguidos no mesmo lugar" Icone={MousePointerClick} tom={raiva > 0 ? "atencao" : "normal"} />
        <Numero rotulo="Cliques mortos" valor={mortos} detalhe="clique em algo que não faz nada" Icone={Timer} tom={mortos > 0 ? "atencao" : "normal"} />
        <Numero rotulo="Volta rápida" valor={volta} detalhe="abriu a página e voltou na hora" Icone={Undo2} />
      </section>

      <section className="cartao-cp p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-primary">Páginas com mais atrito primeiro</h2>
            <p className="text-sm text-slate-500">Atualiza a cada 3 horas (o Clarity libera 10 consultas por dia).</p>
          </div>
          <a href={PAINEL_CLARITY} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-accent-strong hover:underline">
            Ver gravações e mapas de calor no Clarity →
          </a>
        </div>
        {linhas.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">Ainda não há visitas gravadas. Elas aparecem depois que alguém aceita os cookies e navega.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[40rem] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="py-2 pr-3 font-semibold">Página</th>
                  <th className="py-2 pr-3 text-right font-semibold">Visitas</th>
                  <th className="py-2 pr-3 text-right font-semibold">Raiva</th>
                  <th className="py-2 pr-3 text-right font-semibold">Mortos</th>
                  <th className="py-2 pr-3 text-right font-semibold">Volta rápida</th>
                  <th className="py-2 pr-3 text-right font-semibold">Rolagem</th>
                  <th className="py-2 text-right font-semibold">Tempo ativo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {linhas.slice(0, 60).map((l) => (
                  <tr key={l.url}>
                    <td className="max-w-[18rem] truncate py-2 pr-3 font-medium text-primary" title={l.url}>{l.url}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{l.sessoes}</td>
                    <td className={`py-2 pr-3 text-right tabular-nums ${l.cliquesRaiva ? "font-semibold text-accent-strong" : "text-slate-400"}`}>{l.cliquesRaiva}</td>
                    <td className={`py-2 pr-3 text-right tabular-nums ${l.cliquesMortos ? "font-semibold text-accent-strong" : "text-slate-400"}`}>{l.cliquesMortos}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{l.voltaRapida}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{l.rolagemMedia == null ? "—" : `${Math.round(l.rolagemMedia)}%`}</td>
                    <td className="py-2 text-right tabular-nums">{segundos(l.tempoAtivoSeg)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
