import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Mail, MessageSquareText, Phone, Star } from "lucide-react";
import { getPerfil } from "@/lib/perfil";
import { createClient } from "@/lib/supabase/server";
import { rotuloDoAssunto } from "@/lib/feedback";
import { FaltaRodarSql, Hero, Numero, SeletorDePeriodo } from "../pecas";
import { AcoesContato } from "./AcoesContato";

export const metadata = { title: "Feedback" };

/**
 * /admin/feedback — O QUE O CLIENTE DIZ (pedido do dono, 21/10/2026).
 *
 * Duas coisas, nesta ordem:
 *   1. As MENSAGENS do "Fale com a gente" (`hub_contatos`), pendentes
 *      primeiro — é o que pede ação.
 *   2. As NOTAS das ferramentas (`hub_avaliacoes`): média e quantidade por
 *      ferramenta, as piores no topo (é onde mexer), e os comentários.
 *
 * Teste e equipe ficam fora (`eh_teste`, mesma regra dos leads).
 */

type Contato = {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  assunto: string;
  mensagem: string;
  pagina: string | null;
  situacao: string;
  criado_em: string;
};

type Avaliacao = {
  rota: string;
  ferramenta: string | null;
  nota: number;
  comentario: string | null;
  nome: string | null;
  email: string | null;
  criado_em: string;
};

const quando = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });

const media = (notas: number[]) => (notas.length ? notas.reduce((s, n) => s + n, 0) / notas.length : 0);
const umaCasa = (n: number) => n.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export default async function AdminFeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ dias?: string; msg?: string }>;
}) {
  const perfil = await getPerfil();
  if (!perfil) redirect("/login?proximo=/admin/feedback");
  if (perfil.role !== "admin" && perfil.role !== "equipe") notFound();

  const { dias: diasBruto, msg } = await searchParams;
  const dias = [7, 30, 90, 365].includes(Number(diasBruto)) ? Number(diasBruto) : 90;
  const filtroMsg = msg === "respondida" || msg === "todas" ? msg : "pendente";
  const desde = new Date(Date.now() - dias * 24 * 60 * 60 * 1000).toISOString();

  const supabase = await createClient();
  const [contatosR, avaliacoesR] = await Promise.all([
    supabase
      .from("hub_contatos")
      .select("id, nome, email, telefone, assunto, mensagem, pagina, situacao, criado_em")
      .eq("eh_teste", false)
      .gte("criado_em", desde)
      .order("criado_em", { ascending: false })
      .limit(300),
    supabase
      .from("hub_avaliacoes")
      .select("rota, ferramenta, nota, comentario, nome, email, criado_em")
      .eq("eh_teste", false)
      .gte("criado_em", desde)
      .order("criado_em", { ascending: false })
      .limit(2000),
  ]);

  const erro = contatosR.error ?? avaliacoesR.error;
  if (erro) {
    return (
      <div className="space-y-6">
        <Hero etiqueta="Painel da Novare" titulo="Feedback" />
        <FaltaRodarSql erro={erro.message} arquivo="feedback_e_mensagens.sql" />
      </div>
    );
  }

  const contatos = (contatosR.data ?? []) as Contato[];
  const avaliacoes = (avaliacoesR.data ?? []) as Avaliacao[];
  const pendentes = contatos.filter((c) => c.situacao === "pendente").length;
  const visiveis = filtroMsg === "todas" ? contatos : contatos.filter((c) => c.situacao === filtroMsg);
  const baixas = avaliacoes.filter((a) => a.nota <= 2).length;
  const comComentario = avaliacoes.filter((a) => a.comentario).slice(0, 40);

  // Por ferramenta: a pior média primeiro; empate, a mais avaliada.
  const porRota = new Map<string, Avaliacao[]>();
  for (const a of avaliacoes) {
    const grupo = porRota.get(a.rota);
    if (grupo) grupo.push(a);
    else porRota.set(a.rota, [a]);
  }
  const ferramentas = [...porRota.entries()]
    .map(([rota, ls]) => ({
      rota,
      nome: ls[0].ferramenta ?? rota,
      media: media(ls.map((l) => l.nota)),
      total: ls.length,
      baixas: ls.filter((l) => l.nota <= 2).length,
      ultimoComentario: ls.find((l) => l.comentario)?.comentario ?? null,
    }))
    .sort((a, b) => a.media - b.media || b.total - a.total);

  const urlMsg = (v: string) => `/admin/feedback?dias=${dias}${v === "pendente" ? "" : `&msg=${v}`}`;

  return (
    <div className="space-y-6">
      <Hero
        etiqueta="Painel da Novare"
        titulo="Feedback"
        destaque={{ valor: pendentes, rotulo: "mensagens sem resposta" }}
        metricas={[
          { valor: avaliacoes.length ? umaCasa(media(avaliacoes.map((a) => a.nota))) : "—", rotulo: "nota média das ferramentas" },
          { valor: avaliacoes.length, rotulo: "avaliações no período" },
          { valor: baixas, rotulo: "notas 1 ou 2" },
          { valor: contatos.length, rotulo: "mensagens no período" },
        ]}
      >
        O que os clientes escrevem no “Fale com a gente” e as notas que dão às ferramentas. Mensagem
        nova e nota baixa também chegam no e-mail da equipe.
      </Hero>

      {/* ⚠️ FILTROS NO TOPO. */}
      <div className="flex flex-wrap items-center gap-3">
        <SeletorDePeriodo base="/admin/feedback" dias={dias} extra={filtroMsg === "pendente" ? "" : `&msg=${filtroMsg}`} />
        <div
          role="group"
          aria-label="Mensagens"
          className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-border bg-white p-1.5 shadow-sm"
        >
          {[
            { v: "pendente", r: `Pendentes (${pendentes})` },
            { v: "respondida", r: `Respondidas (${contatos.length - pendentes})` },
            { v: "todas", r: "Todas" },
          ].map(({ v, r }) => (
            <Bolinha key={v} href={urlMsg(v)} ativo={filtroMsg === v} rotulo={r} />
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Numero rotulo="Sem resposta" valor={pendentes} Icone={MessageSquareText} tom="destaque" href={urlMsg("pendente")} />
        <Numero
          rotulo="Nota média"
          valor={avaliacoes.length ? umaCasa(media(avaliacoes.map((a) => a.nota))) : "—"}
          Icone={Star}
          detalhe={`${avaliacoes.length} avaliações no período`}
          tom="destaque"
        />
        <Numero rotulo="Notas 1 ou 2" valor={baixas} detalhe="o que vale olhar primeiro" tom={baixas > 0 ? "atencao" : "normal"} />
      </div>

      {/* 1. AS MENSAGENS */}
      <section aria-labelledby="titulo-mensagens" className="space-y-3">
        <h2 id="titulo-mensagens" className="titulo-cp text-xl">
          Mensagens
        </h2>
        {visiveis.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-white p-8 text-center text-sm text-muted-foreground">
            {contatos.length === 0
              ? "Ninguém escreveu pelo “Fale com a gente” neste período."
              : "Nenhuma mensagem com esse filtro."}
          </div>
        ) : (
          <ul className="space-y-3">
            {visiveis.map((c) => (
              <li key={c.id} className="rounded-2xl border border-border bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-2xs font-semibold ${
                          c.assunto === "consultor" ? "bg-accent/15 text-accent-strong" : "bg-ciano-tint text-ciano-forte"
                        }`}
                      >
                        {rotuloDoAssunto(c.assunto)}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-2xs font-semibold ${
                          c.situacao === "pendente" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {c.situacao === "pendente" ? "Pendente" : "Respondida"}
                      </span>
                      <span className="text-2xs text-muted-foreground">{quando(c.criado_em)}</span>
                    </div>
                    <p className="mt-2 font-semibold text-foreground">{c.nome}</p>
                    <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 text-primary">
                        <Mail className="h-3.5 w-3.5" />
                        <span className="select-all">{c.email}</span>
                      </span>
                      {c.telefone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5" />
                          <span className="select-all">{c.telefone}</span>
                        </span>
                      )}
                      {c.pagina && <span>de {c.pagina}</span>}
                    </p>
                  </div>
                  <AcoesContato id={c.id} nome={c.nome} email={c.email} telefone={c.telefone} situacao={c.situacao} />
                </div>
                <p className="mt-3 whitespace-pre-wrap rounded-xl bg-slate-50 px-4 py-3 text-sm leading-relaxed text-foreground [overflow-wrap:anywhere]">
                  {c.mensagem}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 2. AS NOTAS POR FERRAMENTA */}
      <section aria-labelledby="titulo-notas" className="space-y-3 pt-4">
        <div>
          <h2 id="titulo-notas" className="titulo-cp text-xl">
            Notas por ferramenta
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">As piores primeiro — é onde vale mexer.</p>
        </div>
        {ferramentas.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-white p-8 text-center text-sm text-muted-foreground">
            Nenhuma ferramenta avaliada neste período.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[44rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-slate-50/70 text-2xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3 font-semibold">Ferramenta</th>
                    <th className="px-4 py-3 font-semibold">Média</th>
                    <th className="px-4 py-3 font-semibold">Avaliações</th>
                    <th className="px-4 py-3 font-semibold">Notas 1 ou 2</th>
                    <th className="px-4 py-3 font-semibold">Último comentário</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {ferramentas.map((f) => (
                    <tr key={f.rota} className="align-top">
                      <td className="px-4 py-3">
                        <Link href={f.rota} target="_blank" className="font-semibold text-primary hover:underline">
                          {f.nome}
                        </Link>
                        <p className="text-2xs text-muted-foreground">{f.rota}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Estrelas nota={f.media} />
                        <p className="mt-0.5 text-xs font-semibold tabular-nums text-foreground">{umaCasa(f.media)}</p>
                      </td>
                      <td className="px-4 py-3 tabular-nums">{f.total}</td>
                      <td className={`px-4 py-3 tabular-nums ${f.baixas > 0 ? "font-semibold text-destructive" : "text-muted-foreground"}`}>
                        {f.baixas}
                      </td>
                      <td className="max-w-xs px-4 py-3 text-xs text-muted-foreground">{f.ultimoComentario ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* 3. OS COMENTÁRIOS */}
      {comComentario.length > 0 && (
        <section aria-labelledby="titulo-comentarios" className="space-y-3 pt-4">
          <h2 id="titulo-comentarios" className="titulo-cp text-xl">
            Comentários das avaliações
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {comComentario.map((a, i) => (
              <li key={`${a.criado_em}-${i}`} className="rounded-2xl border border-border bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <Estrelas nota={a.nota} />
                  <span className="text-2xs text-muted-foreground">{quando(a.criado_em)}</span>
                </div>
                <p className="mt-1 text-xs font-semibold text-primary">{a.ferramenta ?? a.rota}</p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-foreground [overflow-wrap:anywhere]">{a.comentario}</p>
                {(a.nome || a.email) && (
                  <p className="mt-2 text-2xs text-muted-foreground">
                    {[a.nome, a.email].filter(Boolean).join(" · ")}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Estrelas({ nota }: { nota: number }) {
  const cheias = Math.round(nota);
  return (
    <span className="flex items-center gap-0.5" role="img" aria-label={`${umaCasa(nota)} de 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`h-3.5 w-3.5 ${n <= cheias ? "fill-accent text-accent" : "text-slate-300"}`} strokeWidth={1.8} />
      ))}
    </span>
  );
}

function Bolinha({ href, ativo, rotulo }: { href: string; ativo: boolean; rotulo: string }) {
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
