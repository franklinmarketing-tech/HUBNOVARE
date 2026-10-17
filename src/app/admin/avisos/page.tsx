import { createClient } from "@/lib/supabase/server";
import { FormAviso } from "./FormAviso";

/**
 * AVISOS PARA OS CLIENTES.
 *
 * ⚠️ O CANAL JÁ EXISTIA NO BANCO E NÃO TINHA TELA. `hub_notificacoes` está
 * criada desde sempre, com policy que deixa admin inserir e com suporte a
 * broadcast (`usuario_id = null` = aviso para todos). O sino aparece no Hub e
 * funciona. O que faltava era um lugar para escrever o aviso — hoje isso é
 * feito com INSERT na mão no SQL Editor, o que na prática significa que
 * ninguém faz.
 *
 * ⚠️ É MAIS BARATO QUE E-MAIL, e chega em quem está usando. Para "o servidor
 * vai ficar fora no sábado" ou "sua revisão saiu", a notificação no próprio
 * Hub é melhor que e-mail: não cai em spam, não depende de o endereço estar
 * certo e aparece exatamente onde a pessoa está trabalhando.
 *
 * A guarda de papel vive no `layout.tsx` desta pasta.
 */

export const dynamic = "force-dynamic";

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
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("hub_notificacoes")
    .select("id, titulo, texto, tipo, usuario_id, criado_em")
    .order("criado_em", { ascending: false })
    .limit(40);

  const faltaTabela = error?.code === "42P01";
  const avisos = (data as Aviso[] | null) ?? [];

  return (
    <div>
      <h1 className="titulo-secao font-display text-2xl font-bold text-primary">
        Avisar os clientes
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        O aviso aparece no sino, dentro do Workspace. Chega em quem está usando,
        não depende de e-mail e não cai em spam.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[22rem_1fr]">
        <FormAviso />

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Últimos enviados
          </h2>

          {faltaTabela ? (
            <p className="card-novare mt-3 p-5 text-sm text-muted-foreground">
              A tabela de notificações ainda não existe neste banco. Rode{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                supabase/hub_notificacoes.sql
              </code>
              .
            </p>
          ) : avisos.length === 0 ? (
            <p className="card-novare mt-3 p-5 text-sm text-muted-foreground">
              Nenhum aviso enviado ainda.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {avisos.map((a) => (
                <li key={a.id} className="card-novare p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-2xs font-semibold ${TOM[a.tipo] ?? TOM.aviso}`}
                    >
                      {a.tipo}
                    </span>
                    {/* Quem recebeu importa mais que o horário: broadcast
                        atinge a base inteira e é o que exige cuidado. */}
                    <span className="text-2xs font-semibold text-muted-foreground">
                      {a.usuario_id ? "1 pessoa" : "todos"}
                    </span>
                    <span className="text-2xs text-muted-foreground">
                      {new Date(a.criado_em).toLocaleString("pt-BR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm font-semibold text-foreground">
                    {a.titulo}
                  </p>
                  {a.texto && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {a.texto}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
