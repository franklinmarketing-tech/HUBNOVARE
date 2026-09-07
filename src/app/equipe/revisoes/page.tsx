import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, CircleAlert, CircleCheck } from "lucide-react";
import { Cabecalho } from "@/components/Cabecalho";
import { getPerfil } from "@/lib/perfil";
import { createClient } from "@/lib/supabase/server";
import { trimestreDe, rotuloTrimestre } from "@/lib/planejamento/trimestre";

export const metadata: Metadata = {
  title: "Revisões — fila da equipe",
  robots: { index: false, follow: false },
};

/**
 * A fila do consultor.
 *
 * A assinatura promete uma revisão trimestral escrita por gente. Esta é a
 * tela onde essa promessa é cumprida: quem está vencido, quem já recebeu, e
 * a porta para escrever.
 *
 * Ela existe porque prometer na página de venda sem ter onde entregar é a
 * forma mais cara de perder um assinante — ele paga o primeiro mês, não
 * recebe o que foi anunciado e não volta.
 */
export default async function AcompanhamentoPage() {
  const perfil = await getPerfil();
  if (!perfil) redirect("/login?proximo=/equipe/revisoes");

  /* 404, não "acesso restrito" — mesmo critério do /admin: responder 200 com
     um aviso confirma que a rota existe e que há algo atrás dela. */
  if (perfil.role !== "admin" && perfil.role !== "equipe") notFound();

  const supabase = await createClient();
  const trimestre = trimestreDe();

  /* Os clientes com plano montado. Quem nunca preencheu o retrato não entra
     na fila: não há o que revisar, e encher a lista de casos vazios faz o
     consultor perder tempo abrindo um por um para descobrir isso. */
  const { data: clientes } = await supabase
    .from("clients")
    .select("id, full_name, status, created_at")
    .order("created_at", { ascending: true });

  const { data: revisoes } = await supabase
    .from("revisoes")
    .select("client_id, periodo_ref, status, enviada_em")
    .eq("periodo_ref", trimestre);

  const porCliente = new Map(
    (revisoes ?? []).map((r) => [r.client_id as string, r]),
  );

  const fila = (clientes ?? []).map((c) => {
    const r = porCliente.get(c.id as string);
    return {
      id: c.id as string,
      nome: (c.full_name as string) || "Cliente sem nome",
      estado: !r ? "pendente" : r.status === "enviada" ? "enviada" : "rascunho",
    };
  });

  const pendentes = fila.filter((f) => f.estado !== "enviada");
  const prontas = fila.filter((f) => f.estado === "enviada");

  return (
    <div className="aurora-clara min-h-dvh">
      <Cabecalho
        direita={
          <Link
            href="/"
            className="text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Voltar ao Hub
          </Link>
        }
      />

      <main className="mx-auto w-full max-w-4xl px-5 pb-16 pt-8">
        <p className="text-xs text-muted-foreground">Equipe · acompanhamento</p>
        <h1 className="titulo-secao mt-1 text-2xl sm:text-3xl">
          Revisões de {rotuloTrimestre(trimestre)}
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Uma revisão por cliente por trimestre. Abra o caso, leia os números
          que o app já calculou e escreva o que mudou, o que está travando e o
          próximo passo. É consultoria financeira — não indicação de ativo.
        </p>

        <section className="mt-10">
          <div className="flex items-center gap-2">
            <CircleAlert className="h-4 w-4 text-accent-strong" strokeWidth={2} />
            <h2 className="font-display text-base font-semibold text-primary">
              A escrever ({pendentes.length})
            </h2>
          </div>

          {pendentes.length === 0 ? (
            <p className="mt-4 rounded-2xl border border-dashed border-primary/20 bg-white/60 px-5 py-8 text-center text-sm text-muted-foreground">
              Nenhuma revisão pendente neste trimestre.
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {pendentes.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/equipe/revisoes/${c.id}`}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white px-5 py-4 transition-all hover:-translate-y-0.5 hover:shadow-card"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-display text-sm font-semibold text-primary">
                        {c.nome}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {c.estado === "rascunho"
                          ? "Rascunho salvo — falta enviar"
                          : "Ainda não começou"}
                      </span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-accent-strong" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {prontas.length > 0 && (
          <section className="mt-10">
            <div className="flex items-center gap-2">
              <CircleCheck className="h-4 w-4 text-success" strokeWidth={2} />
              <h2 className="font-display text-base font-semibold text-primary">
                Enviadas ({prontas.length})
              </h2>
            </div>
            <ul className="mt-4 space-y-2">
              {prontas.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/equipe/revisoes/${c.id}`}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white/70 px-5 py-3.5 text-sm transition-colors hover:bg-white"
                  >
                    <span className="truncate text-primary">{c.nome}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      ver
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
