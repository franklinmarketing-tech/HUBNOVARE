import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2, Download, Flame, Mail, Phone, Users } from "lucide-react";
import { AcoesLead } from "./AcoesLead";
import { createClient } from "@/lib/supabase/server";
import { getPerfil } from "@/lib/perfil";
import { oQueFez, temperaturaPorEmail, type Nivel } from "@/lib/lead-quente";
import { FaltaRodarSql, Hero, Numero, SeletorDePeriodo } from "../pecas";
import { MarcarSituacao } from "./MarcarSituacao";
/* ⚠️ De `./situacoes`, NUNCA de `./MarcarSituacao`: valor importado de
   arquivo "use client" chega aqui no servidor como referência, e o `.map`
   do filtro derrubava a tela. */
import { SITUACOES } from "./situacoes";

export const metadata = { title: "Leads captados" };

/**
 * OS LEADS, PARA TRABALHAR — não só para olhar.
 *
 * ⚠️ A TELA ANTERIOR ERA UMA VITRINE. Listava 500 e-mails em ordem de
 * chegada, com busca, e nada mais: nenhuma marca de quem já tinha sido
 * chamado, nenhum sinal de quem já virou conta no Hub. Na prática o
 * acompanhamento acontecia por fora, numa planilha, e o painel não era
 * usado.
 *
 * ⚠️ `virou_conta` É A COLUNA QUE MUDA A CONVERSA. Ela responde, antes de
 * ligar, se a pessoa só deixou o e-mail ou se de fato entrou no Hub — e são
 * dois telefonemas completamente diferentes. Sai de uma função
 * `security definer`, porque o e-mail de quem se cadastrou mora em
 * `auth.users`, fora do alcance do PostgREST.
 */

type Lead = {
  id: string;
  nome: string | null;
  email: string;
  telefone: string | null;
  origem: string | null;
  tipo: string | null;
  payload: Record<string, unknown> | null;
  criado_em: string;
  situacao: string;
  anotacao: string | null;
  tratado_em: string | null;
  virou_conta: boolean;
};

const TIPO = {
  "vida-plan": { rotulo: "FINPLAN", cls: "bg-sky-100 text-sky-700" },
  "saude-financeira": { rotulo: "Exame de Saúde", cls: "bg-emerald-100 text-emerald-700" },
  cupom: { rotulo: "Cupom", cls: "bg-amber-100 text-amber-700" },
  produto: { rotulo: "Produto", cls: "bg-indigo-100 text-indigo-700" },
  ferramenta: { rotulo: "Ferramenta", cls: "bg-slate-100 text-slate-600" },
  relatorio: { rotulo: "Baixou PDF", cls: "bg-orange-100 text-orange-700" },
  guia: { rotulo: "eBook", cls: "bg-cyan-100 text-cyan-800" },
} as const;

/* ⚠️ AQUI FICAVA `zapDe`, que punha "55" na frente de QUALQUER telefone.
   Quem digitou "5519988610799" no formulário virava "555519…", e o link
   abria conversa com ninguém. O link certo agora é `linkWhatsApp`, em
   `lib/lead-whatsapp.ts`, que só põe o DDI quando falta — e já leva a
   mensagem escrita, citando o que a pessoa usou (`oQueFez`). */

/* A temperatura (`lib/lead-quente.ts`). Laranja e azul da casa; vermelho
   fica para o que é problema, não para o lead bom. */
const NIVEL: Record<Nivel, { rotulo: string; cls: string }> = {
  quente: { rotulo: "Quente", cls: "bg-accent/15 text-accent-strong" },
  morno: { rotulo: "Morno", cls: "bg-ciano-tint text-ciano-forte" },
  frio: { rotulo: "Frio", cls: "bg-slate-100 text-slate-500" },
};

/* Quem já virou cliente ou disse não vai para o fim da lista "mais quentes":
   a ordem serve para decidir quem chamar agora. */
const EM_ABERTO = new Set(["novo", "falando"]);

function resumo(l: Lead): string {
  const p = l.payload ?? {};
  if (l.tipo === "saude-financeira" && p.score != null) return `Nota ${p.score}/100`;
  if (l.tipo === "vida-plan" && p.pct != null) return `${p.pct}% do Marco Horizonte`;
  if (l.tipo === "cupom" && p.cupom != null)
    return p.desconto != null ? `${p.cupom} · ${p.desconto}% OFF` : String(p.cupom);
  if (l.tipo === "produto" && p.produto != null) return `Interesse: ${p.produto}`;
  if (l.tipo === "relatorio" && p.ferramenta != null)
    return p.investimento ? `PDF: ${p.ferramenta} · investe ${p.investimento}` : `PDF: ${p.ferramenta}`;
  if (l.tipo === "guia" && p.guia != null)
    return p.investimento ? `eBook: ${p.guia} · investe ${p.investimento}` : `eBook: ${p.guia}`;
  return l.origem ?? "—";
}

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tipo?: string; dias?: string; situacao?: string; ordem?: string }>;
}) {
  const perfil = await getPerfil();
  if (!perfil) redirect("/login?proximo=/admin/leads");
  if (perfil.role !== "admin" && perfil.role !== "equipe") notFound();

  const { q, tipo: tipoFiltro, dias: diasBruto, situacao: sitFiltro, ordem: ordemBruta } = await searchParams;
  // Abre nos mais quentes (pedido do dono, 21/10/2026); "recentes" é a ordem de chegada.
  const ordem = ordemBruta === "recentes" ? "recentes" : "quentes";
  const busca = (q ?? "").trim().toLowerCase();
  const dias = [7, 30, 90, 365].includes(Number(diasBruto)) ? Number(diasBruto) : 90;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("hub_leads_painel", {
    p_dias: dias,
    p_limite: 500,
  });

  if (error) {
    return (
      <div className="space-y-6">
        <Hero etiqueta="Painel da Novare" titulo="Leads captados" />
        <FaltaRodarSql erro={error.message} arquivo="painel_novare_INSTALAR.sql" />
      </div>
    );
  }

  const todos = (data as Lead[]) ?? [];

  /* ⚠️ O FILTRO É EM MEMÓRIA, sobre os 500 que vieram — não no banco. Com a
     base atual é instantâneo e evita uma consulta por tecla. Passando de
     alguns milhares, o lugar certo é o `ilike` dentro da função, e aí a
     paginação deixa de ser opcional. */
  const filtrados = todos.filter((l) => {
    if (tipoFiltro && l.tipo !== tipoFiltro) return false;
    if (sitFiltro && l.situacao !== sitFiltro) return false;
    if (!busca) return true;
    return [l.email, l.nome, l.telefone, l.origem]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(busca));
  });

  // A nota é da pessoa: calculada sobre TODOS do período, não só os filtrados.
  const notas = temperaturaPorEmail(todos);
  const notaDe = (l: Lead) => notas.get(l.email.trim().toLowerCase())!;

  const leads =
    ordem === "recentes"
      ? filtrados
      : [...filtrados].sort(
          (a, b) =>
            Number(EM_ABERTO.has(b.situacao)) - Number(EM_ABERTO.has(a.situacao)) ||
            notaDe(b).pontos - notaDe(a).pontos ||
            a.email.localeCompare(b.email) ||
            b.criado_em.localeCompare(a.criado_em),
        );

  const quantos = (s: string) => todos.filter((l) => l.situacao === s).length;
  const converteram = todos.filter((l) => l.virou_conta).length;
  const taxa = todos.length > 0 ? Math.round((converteram / todos.length) * 100) : 0;
  const quentesSemContato = new Set(
    todos
      .filter((l) => l.situacao === "novo" && notaDe(l).nivel === "quente")
      .map((l) => l.email.trim().toLowerCase()),
  ).size;

  const paraUrl = (extra: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    p.set("dias", String(dias));
    if (busca) p.set("q", busca);
    if (tipoFiltro) p.set("tipo", tipoFiltro);
    if (sitFiltro) p.set("situacao", sitFiltro);
    if (ordem === "recentes") p.set("ordem", "recentes");
    for (const [k, v] of Object.entries(extra)) {
      if (v) p.set(k, v);
      else p.delete(k);
    }
    return `/admin/leads?${p.toString()}`;
  };

  const exportar = `/api/leads/csv?q=${encodeURIComponent(busca)}&tipo=${encodeURIComponent(tipoFiltro ?? "")}`;

  return (
    <div className="space-y-6">
      <Hero
        etiqueta="Painel da Novare"
        titulo="Leads captados"
        destaque={{ valor: quantos("novo"), rotulo: "esperando contato" }}
        metricas={[
          { valor: todos.length, rotulo: "leads no período" },
          { valor: quantos("falando"), rotulo: "em conversa" },
          { valor: quantos("cliente"), rotulo: "viraram cliente" },
          { valor: converteram, rotulo: "já têm conta" },
        ]}
      >
        Quem deixou contato nas ferramentas, com os mais quentes primeiro — quem
        investe mais e usou mais. Marque em que pé está cada conversa: fica
        registrado para toda a equipe, não na sua memória.
      </Hero>

      {/* ⚠️ FILTROS NO TOPO, logo abaixo do hero. */}
      <div className="flex flex-wrap items-center gap-3">
        <SeletorDePeriodo
          base="/admin/leads"
          dias={dias}
          extra={`${busca ? `&q=${encodeURIComponent(busca)}` : ""}${sitFiltro ? `&situacao=${sitFiltro}` : ""}${ordem === "recentes" ? "&ordem=recentes" : ""}`}
        />

        <div
          role="group"
          aria-label="Ordem"
          className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-border bg-white p-1.5 shadow-sm"
        >
          <Bolinha href={paraUrl({ ordem: undefined })} ativo={ordem === "quentes"} rotulo="Mais quentes primeiro" />
          <Bolinha href={paraUrl({ ordem: "recentes" })} ativo={ordem === "recentes"} rotulo="Mais recentes primeiro" />
        </div>

        <div
          role="group"
          aria-label="Situação"
          className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-border bg-white p-1.5 shadow-sm"
        >
          <Bolinha href={paraUrl({ situacao: undefined })} ativo={!sitFiltro} rotulo="Todos" />
          {SITUACOES.map((s) => (
            <Bolinha
              key={s.valor}
              href={paraUrl({ situacao: s.valor })}
              ativo={sitFiltro === s.valor}
              rotulo={`${s.rotulo} (${quantos(s.valor)})`}
            />
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Numero
          rotulo="Quentes sem contato"
          valor={quentesSemContato}
          Icone={Flame}
          detalhe="pessoas que investem mais e usaram mais — chame primeiro"
          tom="destaque"
          href={paraUrl({ situacao: "novo", ordem: undefined })}
        />
        <Numero rotulo="Leads no período" valor={todos.length} Icone={Users} tom="destaque" />
        <Numero
          rotulo="Já criaram conta"
          valor={converteram}
          Icone={CheckCircle2}
          detalhe={`${taxa}% dos leads do período`}
          tom="destaque"
        />
        <Numero
          rotulo="Esperando contato"
          valor={quantos("novo")}
          detalhe="ainda marcados como novos"
          tom={quantos("novo") > 0 ? "atencao" : "normal"}
        />
      </div>

      {/* Form GET, sem JavaScript: o estado fica na URL e o link filtrado
          pode ser mandado pronto para a equipe. */}
      <form className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="dias" value={dias} />
        {sitFiltro && <input type="hidden" name="situacao" value={sitFiltro} />}
        {ordem === "recentes" && <input type="hidden" name="ordem" value="recentes" />}
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Buscar por e-mail, nome, telefone ou ferramenta"
          className="h-11 min-w-[16rem] flex-1 rounded-xl border border-border bg-white px-3.5 text-sm outline-none transition-colors focus:border-accent focus:ring-4 focus:ring-accent/12"
        />
        <button
          type="submit"
          className="btn-petroleo"
        >
          Buscar
        </button>
        {(busca || sitFiltro || tipoFiltro) && (
          <Link
            href="/admin/leads"
            className="flex h-11 items-center rounded-xl border border-border px-4 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted"
          >
            Limpar
          </Link>
        )}
        <a
          href={exportar}
          className="flex h-11 items-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold text-primary transition-colors hover:bg-muted"
        >
          <Download className="h-4 w-4" />
          CSV
        </a>
      </form>

      {leads.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-white p-10 text-center">
          <Users className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm font-semibold text-primary">
            {todos.length === 0
              ? "Ainda não há leads captados"
              : "Nenhum lead com esse filtro"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {todos.length === 0
              ? "Assim que alguém deixar o e-mail numa ferramenta, aparece aqui."
              : "Tente limpar a busca ou escolher outra situação."}
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            {leads.length === todos.length
              ? `${leads.length} leads`
              : `${leads.length} de ${todos.length} leads`}
          </p>

          <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[72rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-slate-50/70 text-2xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3 font-semibold">Quando</th>
                    <th className="px-4 py-3 font-semibold">Temperatura</th>
                    <th className="px-4 py-3 font-semibold">Contato</th>
                    <th className="px-4 py-3 font-semibold">De onde veio</th>
                    <th className="px-4 py-3 font-semibold">Em que pé está</th>
                    <th className="px-4 py-3 font-semibold">Fazer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {leads.map((l) => {
                    const t = TIPO[(l.tipo ?? "ferramenta") as keyof typeof TIPO] ?? TIPO.ferramenta;
                    const nota = notaDe(l);
                    const n = NIVEL[nota.nivel];
                    return (
                      <tr key={l.id} className="align-top hover:bg-slate-50/50">
                        <td className="whitespace-nowrap px-4 py-3 text-2xs text-muted-foreground">
                          {new Date(l.criado_em).toLocaleString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                            timeZone: "America/Sao_Paulo",
                          })}
                        </td>

                        {/* O porquê vem escrito, não só no `title`: no
                            celular e no tablet não existe "passar o mouse". */}
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-2xs font-semibold ${n.cls}`}>
                            {nota.nivel === "quente" && <Flame className="h-3 w-3" strokeWidth={2.4} />}
                            {n.rotulo} · {nota.pontos}
                          </span>
                          <p className="mt-1 max-w-[13rem] text-2xs leading-snug text-muted-foreground">
                            {nota.motivos.join(" · ")}
                          </p>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {l.nome && (
                              <span className="font-semibold text-foreground">{l.nome}</span>
                            )}
                            {l.virou_conta && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-2xs font-semibold text-emerald-700">
                                <CheckCircle2 className="h-3 w-3" strokeWidth={2.4} />
                                tem conta
                              </span>
                            )}
                          </div>
                          {/* Texto, e não `mailto:`: responder agora é o
                              botão "Responder", que registra. O `mailto:`
                              abria o programa de e-mail do computador e a
                              mensagem não deixava rastro no painel. */}
                          <p className="flex items-center gap-1.5 text-xs font-medium text-primary">
                            <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            <span className="select-all">{l.email}</span>
                          </p>
                          {l.telefone && (
                            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Phone className="h-3.5 w-3.5 shrink-0" />
                              <span className="select-all">{l.telefone}</span>
                            </p>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-2xs font-semibold ${t.cls}`}>
                            {t.rotulo}
                          </span>
                          <p className="mt-1 text-2xs text-muted-foreground">{resumo(l)}</p>
                        </td>

                        <td className="px-4 py-3">
                          <MarcarSituacao
                            id={l.id}
                            situacao={l.situacao}
                            anotacao={l.anotacao}
                          />
                        </td>

                        <td className="px-4 py-3">
                          <AcoesLead
                            id={l.id}
                            nome={l.nome}
                            email={l.email}
                            telefone={l.telefone}
                            oQueFez={oQueFez(l)}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Bolinha({
  href,
  ativo,
  rotulo,
}: {
  href: string;
  ativo: boolean;
  rotulo: string;
}) {
  return (
    <Link
      href={href}
      aria-current={ativo ? "true" : undefined}
      className={`flex min-h-9 items-center gap-2 rounded-xl px-3 text-xs font-semibold transition-colors ${
        ativo ? "bg-primary text-white" : "text-muted-foreground hover:bg-slate-100 hover:text-primary"
      }`}
    >
      <span
        aria-hidden
        className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border-2 ${
          ativo ? "border-white" : "border-slate-300"
        }`}
      >
        {ativo && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
      </span>
      {rotulo}
    </Link>
  );
}
