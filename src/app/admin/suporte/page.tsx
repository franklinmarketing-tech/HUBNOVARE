import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { FlaskConical, Lock, LogOut, Mail, Phone } from "lucide-react";
import { getPerfil } from "@/lib/perfil";
import { createClient } from "@/lib/supabase/server";
import { COOKIE_SUPORTE, fichaValida, suporteConfigurado } from "@/lib/suporte-acesso";
import { entrarNoSuporte, sairDoSuporte } from "./acoes";

export const metadata: Metadata = { title: "Suporte", robots: { index: false, follow: false } };

/**
 * /admin/suporte — OS LEADS DE TESTE (pedido do dono, 21/10/2026).
 *
 * Tudo o que a regra de teste pega (e-mails com "franklin", "novareadm",
 * equipe, domínios falsos, o que veio do localhost) é gravado com
 * `eh_teste = true` e fica FORA do painel de leads e de toda contagem. Só
 * aparece aqui, para o papel `admin` e depois da senha extra
 * (`lib/suporte-acesso.ts`). Equipe não vê esta aba.
 */
type LeadTeste = {
  id: string;
  nome: string | null;
  email: string;
  telefone: string | null;
  origem: string | null;
  tipo: string | null;
  payload: Record<string, unknown> | null;
  criado_em: string;
};

type ContaInterna = {
  id: string;
  nome: string | null;
  email: string;
  papel: string;
  criado_em: string;
  ultimo_acesso: string | null;
};

export default async function SuportePage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const perfil = await getPerfil();
  if (!perfil || perfil.role !== "admin") notFound();
  const { erro } = await searchParams;

  const liberado = fichaValida((await cookies()).get(COOKIE_SUPORTE)?.value, perfil.id);

  if (!liberado) {
    return (
      <main className="mx-auto max-w-md px-5 py-16">
        <div className="cartao-cp p-7">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ciano-tint text-ciano-forte">
            <Lock className="h-5 w-5" />
          </span>
          <h1 className="titulo-cp mt-4 text-2xl">Suporte</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Área restrita. Digite a senha do suporte.</p>
          {suporteConfigurado() ? (
            <form action={entrarNoSuporte} className="mt-5 space-y-3">
              <input
                type="password"
                name="senha"
                required
                autoFocus
                autoComplete="current-password"
                aria-label="Senha do suporte"
                className="h-11 w-full rounded-xl border border-border bg-white px-3.5 outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
              />
              {erro && <p className="text-sm font-medium text-destructive">Senha incorreta.</p>}
              <button type="submit" className="btn-petroleo w-full">
                Entrar
              </button>
            </form>
          ) : (
            <p className="mt-5 rounded-xl bg-warning/10 px-4 py-3 text-sm text-foreground">
              A senha ainda não foi configurada no servidor (variável SUPORTE_SENHA_HASH).
            </p>
          )}
        </div>
      </main>
    );
  }

  const supabase = await createClient();
  const [{ data, error }, { data: contasBrutas }] = await Promise.all([
    supabase.rpc("hub_leads_suporte", { p_limite: 500 }),
    supabase.rpc("hub_contas_suporte"),
  ]);
  const leads = (data ?? []) as LeadTeste[];
  // As contas internas que saíram da aba Clientes (contas_suporte.sql).
  const contas = (contasBrutas ?? []) as ContaInterna[];

  return (
    <main className="mx-auto max-w-6xl px-5 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="chapeu chapeu-ciano">Área restrita</p>
          <h1 className="titulo-cp mt-2 text-3xl">Suporte · testes e contas internas</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
            O que a regra de teste separou: e-mails com “franklin”, “novareadm”, da equipe, domínios
            falsos e o que veio do localhost. Nada daqui entra no painel de leads, na Saúde, nas Iscas
            nem no CSV.
          </p>
        </div>
        <form action={sairDoSuporte}>
          <button type="submit" className="btn-claro">
            <LogOut className="h-4 w-4" />
            Sair do suporte
          </button>
        </form>
      </div>

      {error ? (
        <p className="mt-6 rounded-xl bg-warning/10 px-4 py-3 text-sm">
          Rode o SQL <code>supabase/leads_suporte.sql</code> para esta lista funcionar.
        </p>
      ) : leads.length === 0 ? (
        <div className="cartao-cp mt-6 p-8 text-center text-sm text-muted-foreground">Nenhum lead de teste.</div>
      ) : (
        <div className="cartao-cp mt-6 overflow-x-auto">
          <table className="w-full min-w-[44rem] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-2xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                <th className="px-4 py-3">Quando</th>
                <th className="px-4 py-3">Contato</th>
                <th className="px-4 py-3">De onde veio</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id} className="border-b border-border/60 last:border-0 align-top">
                  <td className="whitespace-nowrap px-4 py-3 text-2xs text-muted-foreground">
                    {new Date(l.criado_em).toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZone: "America/Sao_Paulo",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <p className="flex items-center gap-1.5 font-semibold text-foreground">
                      <FlaskConical className="h-3.5 w-3.5 text-accent-strong" />
                      {l.nome ?? "—"}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-primary">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      {l.email}
                    </p>
                    {l.telefone && (
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" />
                        {l.telefone}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-2xs font-semibold text-foreground">{l.tipo ?? "—"}</span>
                    <p className="mt-1">{l.origem ?? "—"}</p>
                    {l.payload && typeof l.payload === "object" && (
                      <p className="mt-0.5 text-2xs">
                        {Object.entries(l.payload)
                          .filter(([, v]) => typeof v === "string" || typeof v === "number")
                          .slice(0, 3)
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(" · ")}
                      </p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="titulo-cp mt-12 text-2xl">Contas internas</h2>
      <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
        Equipe, admin, testes e as contas do domínio do app antigo. Ficam fora da aba Clientes e de
        toda contagem.
      </p>
      {contas.length === 0 ? (
        <div className="cartao-cp mt-5 p-8 text-center text-sm text-muted-foreground">
          Nenhuma conta interna — ou o SQL <code>supabase/contas_suporte.sql</code> ainda não rodou.
        </div>
      ) : (
        <div className="cartao-cp mt-5 overflow-x-auto">
          <table className="w-full min-w-[40rem] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-2xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                <th className="px-4 py-3">Conta</th>
                <th className="px-4 py-3">Papel</th>
                <th className="px-4 py-3">Criada</th>
                <th className="px-4 py-3">Último acesso</th>
              </tr>
            </thead>
            <tbody>
              {contas.map((c) => (
                <tr key={c.id} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-foreground">{c.nome?.trim() || "—"}</p>
                    <p className="text-xs text-primary">{c.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-2xs font-semibold text-foreground">{c.papel}</span>
                  </td>
                  <td className="px-4 py-3 text-2xs text-muted-foreground">{new Date(c.criado_em).toLocaleDateString("pt-BR")}</td>
                  <td className="px-4 py-3 text-2xs text-muted-foreground">
                    {c.ultimo_acesso ? new Date(c.ultimo_acesso).toLocaleDateString("pt-BR") : "nunca"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
