"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Check, Loader2, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  ASSINATURA_PRECO_ROTULO,
  assinaturaReceitaMensal,
} from "@/lib/assinatura";

/**
 * O painel de acesso pago.
 *
 * DE ONDE VEM O ESTADO
 * Da função `hub_assinantes()` (supabase/assinantes.sql), e não de duas
 * consultas costuradas aqui. O estado de um assinante mora em duas tabelas —
 * `hub_profiles` para o plano pago, `vidaplan_subscriptions` para o teste — e
 * o e-mail em `auth.users`, que o PostgREST não expõe. Resolver isso no banco
 * garante que o painel leia a assinatura pela MESMA regra que `trial.ts` usa
 * para liberar o produto. Se as duas divergirem, a tela diz uma coisa e o app
 * faz outra, e o cliente que reclamar está certo.
 *
 * POR QUE A LISTA NÃO TEM BOTÃO DE "EDITAR PLANO"
 * Tem botão de LIBERAR POR N MESES e de CORTAR, que é o que a operação faz de
 * verdade. Um campo livre de data convida a digitar 2025 no lugar de 2026 —
 * e o erro só aparece quando um cliente pagante perde o acesso.
 */

type Assinante = {
  id: string;
  nome: string | null;
  email: string;
  papel: string;
  plano: string;
  plano_expira_em: string | null;
  trial_until: string | null;
  criado_em: string;
  estado: "pagante" | "equipe" | "teste" | "vencido" | "sem_acesso";
};

const ESTADO = {
  pagante: { rotulo: "Pagante", cls: "bg-success/12 text-success-strong" },
  equipe: { rotulo: "Equipe", cls: "bg-primary/10 text-primary" },
  teste: { rotulo: "Em teste", cls: "bg-ciano/15 text-primary" },
  vencido: { rotulo: "Teste vencido", cls: "bg-accent/12 text-accent-strong" },
  sem_acesso: { rotulo: "Nunca entrou", cls: "bg-slate-100 text-slate-600" },
} as const;

const data = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("pt-BR") : "—";

/** Dias que faltam, arredondado para cima. Negativo já venceu. */
const diasAte = (iso: string | null) =>
  iso ? Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000) : null;

export function PainelAssinantes() {
  const [linhas, setLinhas] = useState<Assinante[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [ocupado, setOcupado] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    const supabase = createClient();
    const { data: r, error } = await supabase.rpc("hub_assinantes");
    if (error) {
      // 42883 = função inexistente. É o caso de quem ainda não rodou o SQL,
      // e merece a instrução exata em vez de "algo deu errado".
      setErro(
        error.code === "42883"
          ? "FALTA_SQL"
          : error.message || "Não consegui carregar a lista.",
      );
      return;
    }
    setErro(null);
    setLinhas((r ?? []) as Assinante[]);
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function definir(alvo: Assinante, meses: number) {
    const acao =
      meses > 0
        ? `Liberar ${alvo.nome ?? alvo.email} por ${meses} ${meses === 1 ? "mês" : "meses"}?`
        : `Cortar o acesso de ${alvo.nome ?? alvo.email}?`;
    // O motivo vai para a trilha de auditoria. Perguntado na hora do clique
    // porque depois ninguém lembra por que aquela conta foi liberada.
    const motivo = window.prompt(`${acao}\n\nPor quê? (fica registrado)`, "");
    if (motivo === null) return;

    setOcupado(alvo.id);
    const supabase = createClient();
    const { error } = await supabase.rpc("hub_definir_acesso", {
      p_alvo: alvo.id,
      p_meses: meses,
      p_motivo: motivo,
    });
    setOcupado(null);
    if (error) {
      setErro(error.message);
      return;
    }
    await carregar();
  }

  const filtradas = useMemo(() => {
    if (!linhas) return null;
    const q = busca.trim().toLowerCase();
    if (!q) return linhas;
    return linhas.filter(
      (l) =>
        l.email.toLowerCase().includes(q) ||
        (l.nome ?? "").toLowerCase().includes(q),
    );
  }, [linhas, busca]);

  const contagem = useMemo(() => {
    const c = { pagante: 0, teste: 0, vencido: 0 };
    for (const l of linhas ?? []) {
      if (l.estado === "pagante") c.pagante++;
      else if (l.estado === "teste") c.teste++;
      else if (l.estado === "vencido") c.vencido++;
    }
    return c;
  }, [linhas]);

  return (
    <main className="mx-auto max-w-6xl px-5 pb-20 pt-8">
        <h1 className="titulo-secao text-2xl">Assinantes</h1>
        <p className="mt-4 max-w-prose text-sm leading-relaxed text-muted-foreground">
          Quem paga, quem está testando e quem venceu. Liberar aqui grava quem
          fez, quando e por quê — é dinheiro, então fica registrado.
        </p>

        {erro === "FALTA_SQL" ? (
          <div className="mt-6 rounded-2xl border border-accent/30 bg-accent-tint p-5">
            <p className="flex items-center gap-2 font-display text-base font-semibold text-primary">
              <AlertTriangle className="h-4 w-4 text-accent-strong" />
              Falta rodar o SQL
            </p>
            <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground">
              Esta tela depende da função <code className="font-mono text-xs">hub_assinantes()</code>,
              que ainda não existe no banco. Abra o SQL Editor do Supabase e
              rode <code className="font-mono text-xs">supabase/assinantes.sql</code> uma vez.
            </p>
          </div>
        ) : erro ? (
          <p role="status" className="mt-6 text-sm text-destructive">
            {erro}
          </p>
        ) : null}

        {filtradas && (
          <>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-success/12 px-3 py-1 text-xs font-semibold text-success-strong">
                {contagem.pagante} pagando
              </span>
              <span className="rounded-full bg-ciano/15 px-3 py-1 text-xs font-semibold text-primary">
                {contagem.teste} em teste
              </span>
              <span className="rounded-full bg-accent/12 px-3 py-1 text-xs font-semibold text-accent-strong">
                {contagem.vencido} venceram sem assinar
              </span>
              <span className="ml-auto text-xs text-muted-foreground">
                {ASSINATURA_PRECO_ROTULO}/mês ·{" "}
                {/* A conta mora em `assinatura.ts`, nunca aqui: preço em duas
                    verdades é como a landing passou a prometer um valor que o
                    checkout não cobrava.

                    "estimativa" é literal e não é modéstia. Desde que existem
                    dois planos, esta linha supõe todo mundo no mensal — quem
                    paga anual entra por menos. O número exato só aparece
                    quando `hub_assinantes()` devolver o prazo de cada
                    assinatura; até lá, este é o teto. */}
                {assinaturaReceitaMensal(contagem.pagante)} recorrente
                (estimativa)
              </span>
            </div>

            <label className="mt-4 flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-2">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por nome ou e-mail"
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </label>

            <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-white">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Pessoa</th>
                    <th className="px-4 py-3 font-medium">Situação</th>
                    <th className="px-4 py-3 font-medium">Vence</th>
                    <th className="px-4 py-3 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtradas.map((l) => {
                    const selo = ESTADO[l.estado] ?? ESTADO.sem_acesso;
                    const venceEm =
                      l.estado === "pagante"
                        ? l.plano_expira_em
                        : l.estado === "teste"
                          ? l.trial_until
                          : null;
                    const dias = diasAte(venceEm);

                    return (
                      <tr key={l.id} className="border-b border-border/60 last:border-0">
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">
                            {l.nome || "—"}
                          </p>
                          <p className="text-xs text-muted-foreground">{l.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${selo.cls}`}>
                            {selo.rotulo}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {venceEm ? (
                            <>
                              {data(venceEm)}
                              {dias != null && dias >= 0 && (
                                <span className="ml-1 tabular-nums">
                                  ({dias}d)
                                </span>
                              )}
                            </>
                          ) : l.plano === "pro" && !l.plano_expira_em ? (
                            "sem prazo"
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {l.papel === "admin" || l.papel === "equipe" ? (
                            // Equipe não passa por aqui: o acesso dela vem do
                            // papel, e mexer no plano não mudaria nada. Botão
                            // que não faz efeito é botão que ensina a duvidar
                            // da tela.
                            <span className="text-xs text-muted-foreground">
                              acesso pelo papel
                            </span>
                          ) : (
                            <div className="flex flex-wrap items-center gap-1.5">
                              {ocupado === l.id ? (
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => definir(l, 1)}
                                    className="rounded-lg bg-primary px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-soft"
                                  >
                                    +1 mês
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => definir(l, 12)}
                                    className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-muted"
                                  >
                                    +1 ano
                                  </button>
                                  {l.estado === "pagante" && (
                                    <button
                                      type="button"
                                      onClick={() => definir(l, 0)}
                                      className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/10"
                                    >
                                      Cortar
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filtradas.length === 0 && (
                <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                  Ninguém encontrado.
                </p>
              )}
            </div>

            <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Check className="h-3.5 w-3.5 text-success" />
              Liberar soma sobre o que a pessoa já tem: renovar quem ainda tem
              crédito não apaga os dias que faltavam.
            </p>
          </>
        )}

        {!filtradas && !erro && (
          <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando…
          </p>
        )}

        <p className="mt-8 text-xs text-muted-foreground">
          <Link href="/admin/leads" className="underline underline-offset-2">
            Ver os leads captados
          </Link>
        </p>
    </main>
  );
}
