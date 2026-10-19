import { notFound, redirect } from "next/navigation";
import { Megaphone, User, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getPerfil } from "@/lib/perfil";
import { Hero } from "../pecas";
import { FormAviso, type Destinatario } from "./FormAviso";

export const metadata = { title: "Avisos" };
export const dynamic = "force-dynamic";

/**
 * AVISOS PARA OS CLIENTES — o sino dentro do Hub.
 *
 * ⚠️ É MAIS BARATO QUE E-MAIL, e chega em quem está usando. Para "o servidor
 * vai ficar fora no sábado" ou "sua revisão saiu", a notificação no próprio
 * Hub é melhor que e-mail: não cai em spam, não depende de o endereço estar
 * certo e aparece exatamente onde a pessoa está trabalhando.
 *
 * ⚠️ A LISTA DE "ENVIADOS" MENTIA POR OMISSÃO até 19/10/2026: a policy de
 * leitura só mostrava ao admin os avisos para TODOS e os dele mesmo. Um aviso
 * para um cliente específico sumia da tela de quem mandou. A policy nova
 * (`painel_v2_INSTALAR.sql`) deixa admin e equipe lerem tudo.
 *
 * ⚠️ DIZ PARA QUEM FOI, PELO NOME. "1 pessoa" não responde a pergunta que se
 * faz olhando um aviso antigo — "quem recebeu isso?".
 */

type Aviso = {
  id: string;
  titulo: string;
  texto: string | null;
  tipo: string;
  usuario_id: string | null;
  criado_em: string;
};

const TOM: Record<string, string> = {
  aviso: "bg-primary-light text-primary",
  novidade: "bg-accent-tint text-accent-strong",
  conta: "bg-success/12 text-success-strong",
  alerta: "bg-destructive/10 text-destructive",
};

export default async function AdminAvisosPage() {
  const perfil = await getPerfil();
  if (!perfil) redirect("/login?proximo=/admin/avisos");
  if (perfil.role !== "admin" && perfil.role !== "equipe") notFound();

  const supabase = await createClient();
  const [{ data, error }, { data: gente }] = await Promise.all([
    supabase
      .from("hub_notificacoes")
      .select("id, titulo, texto, tipo, usuario_id, criado_em")
      .order("criado_em", { ascending: false })
      .limit(60),
    supabase.rpc("hub_clientes"),
  ]);

  const faltaTabela = error?.code === "42P01";
  const avisos = (data as Aviso[] | null) ?? [];
  const pessoas = ((gente as Destinatario[] | null) ?? []).map((p) => ({
    id: p.id,
    nome: p.nome,
    email: p.email,
  }));
  const nomeDe = new Map(pessoas.map((p) => [p.id, p.nome?.trim() || p.email]));

  const paraTodos = avisos.filter((a) => !a.usuario_id).length;

  return (
    <div className="space-y-6">
      <Hero
        etiqueta="Painel da Novare"
        titulo="Avisos"
        destaque={{ valor: avisos.length, rotulo: "avisos enviados" }}
        metricas={[
          { valor: paraTodos, rotulo: "para todos" },
          { valor: avisos.length - paraTodos, rotulo: "para uma pessoa" },
          { valor: pessoas.length, rotulo: "podem receber" },
        ]}
      >
        O aviso aparece no sino, dentro do Hub. Chega em quem está usando, não
        depende de e-mail e não cai em spam.
      </Hero>

      <div className="grid gap-6 lg:grid-cols-[24rem_1fr]">
        <FormAviso pessoas={pessoas} />

        <section>
          <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Megaphone className="h-3.5 w-3.5" /> Últimos enviados
          </h2>

          {faltaTabela ? (
            <p className="mt-3 rounded-2xl border border-border bg-white p-5 text-sm text-muted-foreground">
              A tabela de notificações ainda não existe neste banco.
            </p>
          ) : avisos.length === 0 ? (
            <div className="mt-3 rounded-2xl border border-dashed border-border bg-white p-8 text-center">
              <Megaphone className="mx-auto h-7 w-7 text-slate-300" />
              <p className="mt-2 text-sm font-semibold text-primary">Nenhum aviso enviado ainda</p>
              <p className="mt-1 text-xs text-muted-foreground">O primeiro aparece aqui assim que sair.</p>
            </div>
          ) : (
            <ul className="mt-3 space-y-2">
              {avisos.map((a) => (
                <li key={a.id} className="rounded-2xl border border-border bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-2xs font-semibold ${TOM[a.tipo] ?? TOM.aviso}`}>
                      {a.tipo}
                    </span>
                    <span className="inline-flex items-center gap-1 text-2xs font-semibold text-foreground">
                      {a.usuario_id ? <User className="h-3 w-3" /> : <Users className="h-3 w-3" />}
                      {a.usuario_id ? nomeDe.get(a.usuario_id) ?? "1 pessoa" : "todos"}
                    </span>
                    <span className="text-2xs text-muted-foreground">
                      {new Date(a.criado_em).toLocaleString("pt-BR", {
                        dateStyle: "short",
                        timeStyle: "short",
                        timeZone: "America/Sao_Paulo",
                      })}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm font-semibold text-foreground">{a.titulo}</p>
                  {a.texto && <p className="mt-0.5 text-xs text-muted-foreground">{a.texto}</p>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
