import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Briefcase, Flame, Mail, MapPin, Phone, ShieldCheck, UserCheck, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getPerfil } from "@/lib/perfil";
import { FaltaRodarSql, Hero, Numero } from "../pecas";
import { AcoesCliente, type Cliente } from "./AcoesCliente";

export const metadata = { title: "Clientes" };
export const dynamic = "force-dynamic";

/**
 * AS PESSOAS QUE TÊM CONTA — com e-mail, editáveis.
 *
 * ⚠️ ESTA TELA ERA DUAS, E NENHUMA FAZIA O SERVIÇO. "Clientes" mostrava o
 * cadastro sem e-mail (e mandava procurar na outra aba); "Assinantes"
 * mostrava o e-mail mas falava de "pagante", "teste vencido" e "+1 mês" —
 * vocabulário de uma assinatura que deixou de existir quando o Hub virou
 * gratuito. Nenhuma das duas deixava EDITAR coisa alguma.
 *
 * Agora é uma lista só, que lê de `hub_clientes()` (security definer, com
 * join em `auth.users` para o e-mail) e já vem sem as contas de
 * demonstração.
 *
 * ⚠️ OS SINAIS DE CADA CARTÃO são os que mudam a conversa: usa o FINCASH
 * de verdade? deixou lead em alguma isca? já recebeu mensagem nossa? quando
 * entrou pela última vez? Cadastro bonito sem esses quatro é agenda
 * telefônica.
 */

const FILTROS = [
  { valor: "", rotulo: "Todos" },
  { valor: "fincash", rotulo: "Usam o FINCASH" },
  /* "Sumidos" é quem usou e PAROU — o grupo que mais vale um contato, e o
     destino do cartão vermelho da tela de Saúde. */
  { valor: "sumidos", rotulo: "Sumidos há 30 dias" },
  { valor: "parados", rotulo: "Nunca usaram" },
  { valor: "equipe", rotulo: "Equipe e admin" },
] as const;

function haQuanto(iso: string | null) {
  if (!iso) return null;
  const dias = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (dias <= 0) return "hoje";
  if (dias === 1) return "ontem";
  if (dias < 30) return `há ${dias} dias`;
  const meses = Math.floor(dias / 30);
  return meses === 1 ? "há 1 mês" : `há ${meses} meses`;
}

export default async function AdminClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filtro?: string }>;
}) {
  const perfil = await getPerfil();
  if (!perfil) redirect("/login?proximo=/admin/clientes");
  if (perfil.role !== "admin" && perfil.role !== "equipe") notFound();

  const { q, filtro = "" } = await searchParams;
  const busca = (q ?? "").trim().toLowerCase();

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("hub_clientes");

  if (error) {
    return (
      <div className="space-y-6">
        <Hero etiqueta="Painel da Novare" titulo="Clientes" />
        <FaltaRodarSql erro={error.message} arquivo="painel_v2_INSTALAR.sql" />
      </div>
    );
  }

  /* ⚠️ `email` PODE VIR NULO de `auth.users`: conta criada por telefone
     ou como anônima não tem e-mail. Sem o `?? ""`, a primeira letra do
     avatar (`c.email[0]`) estourava e derrubava a tela INTEIRA por causa
     de uma pessoa — o mesmo tipo de defeito que tirou Leads do ar: o
     compilador não vê, e só quebra com a tela aberta. */
  const todos = ((data as Cliente[]) ?? []).map((c) => ({
    ...c,
    email: c.email ?? "",
    leads: Number(c.leads),
    mensagens: Number(c.mensagens),
  }));

  const usaFincash = (c: Cliente) => Boolean(c.ultimo_lancamento);
  const daCasa = (c: Cliente) => c.papel === "admin" || c.papel === "equipe";
  /* A mesma régua de `hub_saude`: usou o FINCASH, mas o último lançamento
     tem mais de 30 dias. Duas réguas diferentes fariam o cartão dizer "3"
     e a lista mostrar 5. */
  const sumiu = (c: Cliente) =>
    Boolean(c.ultimo_lancamento) &&
    Date.now() - new Date(c.ultimo_lancamento as string).getTime() > 30 * 86_400_000;

  const pessoas = todos.filter((c) => {
    if (filtro === "fincash" && !usaFincash(c)) return false;
    if (filtro === "sumidos" && !sumiu(c)) return false;
    if (filtro === "parados" && (usaFincash(c) || daCasa(c))) return false;
    if (filtro === "equipe" && !daCasa(c)) return false;
    if (!busca) return true;
    return [c.nome, c.email, c.telefone, c.cidade, c.profissao, c.objetivo]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(busca));
  });

  const clientes = todos.filter((c) => !daCasa(c));
  const ativos = todos.filter(
    (c) => c.ultimo_lancamento && Date.now() - new Date(c.ultimo_lancamento).getTime() < 7 * 86_400_000,
  ).length;

  const url = (f: string) => {
    const p = new URLSearchParams();
    if (f) p.set("filtro", f);
    if (busca) p.set("q", busca);
    const s = p.toString();
    return `/admin/clientes${s ? `?${s}` : ""}`;
  };

  return (
    <div className="space-y-6">
      <Hero
        etiqueta="Painel da Novare"
        titulo="Clientes"
        destaque={{ valor: clientes.length, rotulo: "pessoas com conta" }}
        metricas={[
          { valor: todos.filter(usaFincash).length, rotulo: "usam o FINCASH" },
          { valor: ativos, rotulo: "ativos na semana" },
          { valor: todos.filter(daCasa).length, rotulo: "da equipe" },
        ]}
      >
        Quem tem conta no Hub. Edite o cadastro, mude o acesso, escreva por
        e-mail ou avise no sino — tudo fica registrado no histórico da pessoa.
      </Hero>

      {/* ⚠️ FILTROS NO TOPO, com bolinha de escolha. */}
      <div className="flex flex-wrap items-center gap-3">
        <div
          role="group"
          aria-label="Filtrar"
          className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-border bg-white p-1.5 shadow-sm"
        >
          {FILTROS.map((f) => {
            const ativo = filtro === f.valor;
            return (
              <Link
                key={f.valor || "todos"}
                href={url(f.valor)}
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
                {f.rotulo}
              </Link>
            );
          })}
        </div>

        <form className="flex min-w-[16rem] flex-1 items-center gap-2">
          {filtro && <input type="hidden" name="filtro" value={filtro} />}
          <input
            type="search"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Buscar por nome, e-mail, telefone, cidade…"
            className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-white px-3.5 text-sm outline-none transition-colors focus:border-accent focus:ring-4 focus:ring-accent/12"
          />
          <button type="submit" className="btn-petroleo">
            Buscar
          </button>
        </form>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Numero rotulo="Com conta" valor={clientes.length} Icone={Users} tom="destaque" />
        <Numero rotulo="Usam o FINCASH" valor={todos.filter(usaFincash).length} Icone={UserCheck} tom="destaque" />
        <Numero rotulo="Ativos na semana" valor={ativos} Icone={Flame} detalhe="lançaram algo nos últimos 7 dias" />
      </div>

      {pessoas.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-white p-10 text-center">
          <Users className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm font-semibold text-primary">
            {todos.length === 0 ? "Ninguém com conta ainda" : "Ninguém com esse filtro"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {todos.length === 0 ? "Quando alguém criar conta no Hub, aparece aqui." : "Tente limpar a busca ou trocar o filtro."}
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            {pessoas.length === todos.length ? `${todos.length} pessoas` : `${pessoas.length} de ${todos.length} pessoas`}
          </p>

          <ul className="grid gap-3 lg:grid-cols-2">
            {pessoas.map((c) => {
              const acesso = haQuanto(c.ultimo_acesso);
              const lancou = haQuanto(c.ultimo_lancamento);
              return (
                <li
                  key={c.id}
                  className="flex min-w-0 flex-col gap-3 rounded-2xl border border-border bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(135deg,hsl(215_50%_30%),hsl(215_52%_20%))] text-sm font-bold text-white">
                      {(c.nome?.trim()?.[0] ?? c.email[0] ?? "?").toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="truncate font-semibold text-foreground">
                          {c.nome?.trim() || "Sem nome"}
                        </span>
                        {daCasa(c) && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-2xs font-semibold text-primary">
                            <ShieldCheck className="h-3 w-3" strokeWidth={2.4} />
                            {c.papel}
                          </span>
                        )}
                        {!c.aceita_email && (
                          <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-2xs font-semibold text-destructive">
                            não aceita e-mail
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-primary">
                        <Mail className="h-3 w-3 shrink-0 text-muted-foreground" />
                        <span className="select-all truncate">{c.email}</span>
                      </p>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-2xs text-muted-foreground">
                        {c.telefone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {c.telefone}
                          </span>
                        )}
                        {(c.cidade || c.uf) && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {[c.cidade, c.uf].filter(Boolean).join(" · ")}
                          </span>
                        )}
                        {c.profissao && (
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-3 w-3" />
                            {c.profissao}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {c.objetivo && (
                    <p className="line-clamp-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-foreground">
                      <span className="font-semibold">Quer: </span>
                      {c.objetivo}
                    </p>
                  )}

                  {/* Os quatro sinais que mudam a conversa. */}
                  <div className="flex flex-wrap gap-1.5 text-2xs">
                    <span className={`rounded-full px-2 py-0.5 font-semibold ${lancou ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {lancou ? `FINCASH ${lancou}` : "nunca usou o FINCASH"}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-600">
                      {acesso ? `entrou ${acesso}` : "nunca entrou"}
                    </span>
                    {c.leads > 0 && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-700">
                        {c.leads} {c.leads === 1 ? "lead" : "leads"}
                      </span>
                    )}
                    {c.mensagens > 0 && (
                      <span className="rounded-full bg-sky-100 px-2 py-0.5 font-semibold text-sky-700">
                        {c.mensagens} {c.mensagens === 1 ? "mensagem nossa" : "mensagens nossas"}
                      </span>
                    )}
                  </div>

                  <div className="mt-auto border-t border-border/70 pt-3">
                    <AcoesCliente cliente={c} souAdmin={perfil.role === "admin"} meuId={perfil.id} />
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
