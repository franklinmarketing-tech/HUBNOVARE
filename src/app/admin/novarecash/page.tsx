import { notFound, redirect } from "next/navigation";
import { Ban, CalendarClock, Gem, Users } from "lucide-react";
import { getPerfil } from "@/lib/perfil";
import { createClient } from "@/lib/supabase/server";
import { FaltaRodarSql, Hero, Numero } from "../pecas";

export const metadata = { title: "NovareCash · assinantes" };

/**
 * /admin/novarecash — QUEM ASSINOU (03/11/2026).
 *
 * Lê `ncash_assinantes` (o estado de hoje, uma linha por e-mail, gravado pela
 * rota da Hotmart) e os últimos avisos crus de `ncash_hotmart_eventos`. A RLS
 * só deixa a equipe ver tudo. Nada aqui ESCREVE: liberar ou cortar acesso é
 * pela Hotmart (reembolso, cancelamento), que avisa a rota sozinha.
 */
type Linha = {
  email: string;
  nome: string | null;
  status: string;
  plano: string | null;
  expira_em: string | null;
  comprou_em: string | null;
};
type Evento = { id: number; evento: string; email: string | null; recebido_em: string };

const data = (s: string | null) => (s ? new Date(s).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "—");
const vale = (l: Linha) => ["ativa", "cancelada", "atrasada"].includes(l.status) && (!l.expira_em || new Date(l.expira_em) > new Date());

const ROTULO: Record<string, string> = {
  ativa: "Ativa",
  cancelada: "Cancelou (usa até o fim)",
  atrasada: "Cobrança atrasada",
  reembolsada: "Reembolsada",
  chargeback: "Chargeback",
};

export default async function AdminNovareCashPage() {
  const perfil = await getPerfil();
  if (!perfil) redirect("/login?proximo=/admin/novarecash");
  if (perfil.role !== "admin" && perfil.role !== "equipe") notFound();

  const supabase = await createClient();
  const [{ data: linhas, error }, { data: eventos }] = await Promise.all([
    supabase.from("ncash_assinantes").select("email, nome, status, plano, expira_em, comprou_em").order("comprou_em", { ascending: false }),
    supabase.from("ncash_hotmart_eventos").select("id, evento, email, recebido_em").order("recebido_em", { ascending: false }).limit(20),
  ]);

  if (error) {
    return (
      <div className="space-y-6">
        <Hero etiqueta="Painel da Novare" titulo="NovareCash" />
        <FaltaRodarSql erro={error.message} arquivo="novarecash.sql" />
      </div>
    );
  }

  const todas = (linhas as Linha[]) ?? [];
  const comAcesso = todas.filter(vale);
  const mensal = comAcesso.filter((l) => l.plano !== "anual").length;
  const anual = comAcesso.filter((l) => l.plano === "anual").length;
  const perdidos = todas.filter((l) => l.status === "reembolsada" || l.status === "chargeback").length;
  const vencendo = comAcesso.filter((l) => l.status !== "ativa").length;

  return (
    <div className="space-y-6">
      <Hero etiqueta="Painel da Novare" titulo="NovareCash" destaque={{ valor: comAcesso.length, rotulo: "assinantes com acesso hoje" }}>
        Quem assinou pela Hotmart. O acesso abre e fecha sozinho com os avisos dela; nada aqui precisa ser mexido à mão.
      </Hero>

      <section className="grid gap-3 sm:grid-cols-4">
        <Numero rotulo="Com acesso" valor={comAcesso.length} detalhe={`${mensal} mensal · ${anual} anual`} Icone={Gem} tom="destaque" />
        <Numero rotulo="Vão sair" valor={vencendo} detalhe="cancelaram ou com cobrança atrasada" Icone={CalendarClock} tom={vencendo > 0 ? "atencao" : "normal"} />
        <Numero rotulo="Reembolso/chargeback" valor={perdidos} Icone={Ban} />
        <Numero rotulo="Já passaram por aqui" valor={todas.length} Icone={Users} />
      </section>

      <section className="cartao-cp p-5 sm:p-6">
        <h2 className="font-display text-lg font-semibold text-primary">Assinantes</h2>
        {todas.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">Ninguém assinou ainda. A primeira compra aprovada na Hotmart aparece aqui sozinha.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[40rem] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="py-2 pr-3 font-semibold">Pessoa</th>
                  <th className="py-2 pr-3 font-semibold">Situação</th>
                  <th className="py-2 pr-3 font-semibold">Plano</th>
                  <th className="py-2 pr-3 font-semibold">Comprou</th>
                  <th className="py-2 font-semibold">Vale até</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {todas.map((l) => (
                  <tr key={l.email}>
                    <td className="py-2 pr-3">
                      <span className="block font-medium text-primary">{l.nome || "—"}</span>
                      <span className="block text-xs text-slate-500">{l.email}</span>
                    </td>
                    <td className={`py-2 pr-3 ${vale(l) ? "text-slate-700" : "font-semibold text-accent-strong"}`}>{ROTULO[l.status] ?? l.status}</td>
                    <td className="py-2 pr-3 capitalize">{l.plano ?? "—"}</td>
                    <td className="py-2 pr-3 tabular-nums">{data(l.comprou_em)}</td>
                    <td className="py-2 tabular-nums">{data(l.expira_em)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="cartao-cp p-5 sm:p-6">
        <h2 className="font-display text-lg font-semibold text-primary">Últimos avisos da Hotmart</h2>
        <p className="text-sm text-slate-500">Se uma compra não liberou, confira aqui se o aviso chegou.</p>
        {(eventos as Evento[] | null)?.length ? (
          <ul className="mt-3 divide-y divide-border/60 text-sm">
            {(eventos as Evento[]).map((e) => (
              <li key={e.id} className="flex flex-wrap justify-between gap-2 py-2">
                <span className="font-medium text-primary">{e.evento}</span>
                <span className="text-slate-500">{e.email ?? "sem e-mail"}</span>
                <span className="tabular-nums text-slate-500">{new Date(e.recebido_em).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-slate-600">Nenhum aviso recebido ainda.</p>
        )}
      </section>
    </div>
  );
}
