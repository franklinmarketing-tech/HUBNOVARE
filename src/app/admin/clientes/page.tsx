import { Info, Mail, Phone, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

/**
 * OS CLIENTES, COM O QUE A CASA SABE DE CADA UM.
 *
 * ⚠️ O E-MAIL NÃO ESTÁ EM `hub_profiles`. Ele vive em `auth.users`, que o
 * PostgREST não expõe — é por isso que `hub_assinantes()` existe como
 * `security definer` com join em `auth.users`. Esta tela usa o cadastro
 * (`hub_profiles`), que tem nome, telefone, cidade, profissão e objetivo, e
 * deixa o e-mail para a tela de assinantes, que já resolve isso pelo RPC.
 *
 * Juntar os dois numa consulta só exigiria uma função nova no banco. Não vale
 * ainda: a pergunta que esta tela responde — "quem são, e o que cada um
 * quer?" — não precisa de e-mail.
 *
 * A guarda de papel vive no `layout.tsx` desta pasta.
 */

export const dynamic = "force-dynamic";

type Perfil = {
  id: string;
  nome: string | null;
  telefone: string | null;
  cidade: string | null;
  uf: string | null;
  profissao: string | null;
  objetivo: string | null;
  role: string;
  plano: string;
  plano_expira_em: string | null;
  aceita_email: boolean | null;
  criado_em: string;
};

const PLANO: Record<string, { r: string; c: string }> = {
  pro: { r: "PRO", c: "bg-success/12 text-success-strong" },
  free: { r: "Free", c: "bg-muted text-muted-foreground" },
};

export default async function AdminClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const busca = (q ?? "").trim().toLowerCase();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("hub_profiles")
    .select(
      "id, nome, telefone, cidade, uf, profissao, objetivo, role, plano, plano_expira_em, aceita_email, criado_em",
    )
    .order("criado_em", { ascending: false })
    .limit(500);

  const todos = (data as Perfil[] | null) ?? [];
  const pessoas = busca
    ? todos.filter((p) =>
        [p.nome, p.telefone, p.cidade, p.profissao, p.objetivo]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(busca)),
      )
    : todos;

  const clientes = todos.filter((p) => p.role === "cliente").length;
  const pro = todos.filter((p) => p.plano === "pro").length;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="titulo-secao font-display text-2xl font-bold text-primary">
            Clientes
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {todos.length} cadastros · {clientes} clientes · {pro} no PRO
          </p>
        </div>
      </div>

      <form className="mt-6 flex flex-wrap items-center gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Buscar por nome, telefone, cidade, profissão ou objetivo"
          className="h-10 min-w-[18rem] flex-1 rounded-xl border border-border bg-white px-3.5 text-sm outline-none transition-colors focus:border-accent focus:ring-4 focus:ring-accent/12"
        />
        <button
          type="submit"
          className="h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-soft"
        >
          Buscar
        </button>
      </form>

      {error ? (
        <p className="card-novare mt-6 p-5 text-sm text-muted-foreground">
          Não consegui ler os cadastros: {error.message}
        </p>
      ) : pessoas.length === 0 ? (
        <p className="card-novare mt-6 p-5 text-sm text-muted-foreground">
          {busca ? "Ninguém com esse termo." : "Nenhum cadastro ainda."}
        </p>
      ) : (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {pessoas.map((p) => {
            const plano = PLANO[p.plano] ?? PLANO.free;
            return (
              <li key={p.id} className="card-novare p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-foreground">
                    {p.nome?.trim() || "Sem nome"}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-2xs font-semibold ${plano.c}`}
                  >
                    {plano.r}
                  </span>
                  {p.role !== "cliente" && (
                    <span className="rounded-full bg-primary-light px-2 py-0.5 text-2xs font-semibold text-primary">
                      {p.role}
                    </span>
                  )}
                  {/* Quem não aceita e-mail precisa ficar visível ANTES de
                      alguém montar uma régua de disparo. */}
                  {p.aceita_email === false && (
                    <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-2xs font-semibold text-destructive">
                      não aceita e-mail
                    </span>
                  )}
                </div>

                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {p.telefone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3 shrink-0" />
                      {p.telefone}
                    </span>
                  )}
                  {(p.cidade || p.uf) && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {[p.cidade, p.uf].filter(Boolean).join(" · ")}
                    </span>
                  )}
                  {p.profissao && <span>{p.profissao}</span>}
                </div>

                {p.objetivo && (
                  <p className="mt-2 line-clamp-2 rounded-lg bg-muted/60 px-3 py-2 text-xs text-foreground">
                    <span className="font-semibold">Quer: </span>
                    {p.objetivo}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-5 flex items-start gap-2 text-2xs text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>
          O e-mail de cada pessoa não aparece aqui: ele vive em{" "}
          <code className="rounded bg-muted px-1 py-0.5">auth.users</code>, que o
          PostgREST não expõe. Para e-mail e cobrança, use a aba{" "}
          <Mail className="inline h-3 w-3" /> Assinantes, que lê por função
          própria do banco.
        </span>
      </p>
    </div>
  );
}
