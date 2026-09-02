"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarCheck, Check, Loader2, TriangleAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AcaoAssinante } from "@/components/AcaoAssinante";
import { usePlanejamento } from "../usePlanejamento";
import { liberarLancamento } from "@/lib/planejamento/cliente";
import { mesAtual } from "@/lib/planejamento/catalogos";
import { computeMonthlyTotals } from "@/lib/planejamento/finance";
import { cloneToNextMonth } from "@/lib/planejamento/mesSeguinte";
import { planCompletion } from "@/lib/planejamento/actionPlanProgresso";
import { etapaPorSlug } from "../etapas";
import {
  Barra,
  Carregando,
  PrecisaPreencher,
  SemFicha,
  TituloTela,
  brl,
  SessaoExpirada,
} from "../pecas";
import { formatarMoedaInput, digitosParaReais } from "@/lib/moeda";

type MetaSalva = {
  id: string;
  source_table: string;
  source_id: string;
  source_label: string;
  meta_text: string | null;
  meta_valor: number | null;
  current_value: number | null;
  prazo: string | null;
};

const nomeDoMes = (ref: string) =>
  new Date(ref).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

export default function MesPage() {
  const mes = mesAtual();
  const r = usePlanejamento(mes);
  const router = useRouter();
  const etapa = etapaPorSlug("mes")!;

  const [metas, setMetas] = useState<MetaSalva[] | null>(null);
  const [valores, setValores] = useState<Record<string, string>>({});
  const [notas, setNotas] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [fechando, setFechando] = useState(false);
  const [jaFechado, setJaFechado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const clientId = r.fase === "pronto" ? r.dados.clientId : null;

  useEffect(() => {
    if (!clientId) return;

    (async () => {
      const supabase = createClient();

      /**
       * Liga o lançamento para si mesmo.
       *
       * No app do consultor esta flag nascia `false` e só um admin a virava — o
       * cliente ficava preso num aviso de "modo visualização" esperando alguém.
       * Aqui não há alguém.
       */
      await liberarLancamento(clientId);

      const [metasRes, entradasRes, fechamentoRes] = await Promise.all([
        supabase
          .from("parecer_metas")
          .select("id, source_table, source_id, source_label, meta_text, meta_valor, current_value, prazo")
          .eq("client_id", clientId),
        supabase
          .from("acompanhamento_entradas")
          .select("source_id, valor_atual, estado_atual")
          .eq("client_id", clientId)
          .eq("is_closing_snapshot", false),
        supabase
          .from("monthly_closings")
          .select("id")
          .eq("client_id", clientId)
          .eq("month_ref", mes)
          .maybeSingle(),
      ]);

      setMetas(metasRes.data ?? []);
      setJaFechado(!!fechamentoRes.data);

      const v: Record<string, string> = {};
      const n: Record<string, string> = {};
      for (const e of entradasRes.data ?? []) {
        if (e.valor_atual != null) v[e.source_id] = String(e.valor_atual);
        if (e.estado_atual) n[e.source_id] = e.estado_atual;
      }
      setValores(v);
      setNotas(n);
    })();
  }, [clientId, mes]);

  async function salvarLancamento() {
    if (!clientId || !metas) return;
    setSalvando(true);
    setErro(null);
    const supabase = createClient();

    // Substitui o lançamento em aberto do mês. Os snapshots de fechamento
    // (is_closing_snapshot = true) ficam intactos: são o histórico.
    await supabase
      .from("acompanhamento_entradas")
      .delete()
      .eq("client_id", clientId)
      .eq("is_closing_snapshot", false);

    const linhas = metas
      .filter((m) => valores[m.source_id] != null || notas[m.source_id])
      .map((m) => {
        const atual = Number(valores[m.source_id] ?? m.current_value ?? 0);
        const alvo = m.meta_valor;
        const partida = m.current_value ?? 0;
        // Progresso direcional: quando a meta é REDUZIR (dívida, despesa), o
        // avanço é a queda; quando é aumentar (patrimônio), é a subida.
        const reduzindo = alvo != null && alvo < partida;
        const caminho = alvo != null ? (reduzindo ? partida - alvo : alvo - partida) : 0;
        const andado = reduzindo ? partida - atual : atual - partida;
        const pct = caminho !== 0 ? Math.round((andado / caminho) * 100) : 0;

        return {
          client_id: clientId,
          meta_id: m.id,
          source_table: m.source_table,
          source_id: m.source_id,
          source_label: m.source_label,
          valor_meta: alvo,
          valor_atual: atual,
          progresso_pct: Math.max(0, Math.min(100, pct)),
          prazo: m.prazo,
          estado_atual: notas[m.source_id] ?? null,
          is_closing_snapshot: false,
        };
      });

    if (linhas.length > 0) {
      const { error } = await supabase.from("acompanhamento_entradas").insert(linhas);
      if (error) setErro(error.message);
    }

    setSalvando(false);
    setSalvo(true);
    setTimeout(() => setSalvo(false), 2500);
  }

  /**
   * Fecha o mês: tira uma foto do momento e abre o mês seguinte.
   *
   * Era o gargalo do produto original — `cloneToNextMonth` só rodava no botão do
   * consultor, e sem ele o mês seguinte nunca nascia, travando a trilha inteira.
   */
  const fecharMes = useCallback(async () => {
    if (r.fase !== "pronto" || !clientId) return;
    // Dois cliques rápidos tentariam dois inserts em monthly_closings; o
    // estado `fechando` só desabilita o botão no re-render seguinte.
    if (fechando || jaFechado) return;
    setFechando(true);
    setErro(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setFechando(false);
      return;
    }

    const { retrato } = r.dados;
    const totais = computeMonthlyTotals(mes, {
      income: retrato.rendas,
      expenses: retrato.despesas,
      debts: retrato.dividas,
      assets: retrato.patrimonio,
    });

    const { error } = await supabase.from("monthly_closings").insert({
      client_id: clientId,
      month_ref: mes,
      status: "fechado",
      ...totais,
      plan_completion_pct: planCompletion(metas ?? [], valores),
      income_snapshot: retrato.rendas,
      expenses_snapshot: retrato.despesas,
      debts_snapshot: retrato.dividas,
      assets_snapshot: retrato.patrimonio,
      insurance_snapshot: retrato.seguros,
      goals_snapshot: retrato.objetivos,
      action_plan_snapshot: metas ?? [],
      closed_by: user.id,
    });

    if (error) {
      setErro(error.message);
      setFechando(false);
      return;
    }

    // O CLONE vem ANTES de marcar as entradas como histórico: ele lê
    // exatamente `is_closing_snapshot = false` para saber o que a pessoa
    // lançou. Na ordem invertida (como era), o clone nunca via lançamento
    // nenhum e o mês seguinte abria ignorando tudo que foi registrado.
    try {
      await cloneToNextMonth(clientId, mes);
    } catch {
      // O fechamento em si já está gravado. Sem o clone, o mês seguinte
      // abre com os valores antigos — ruim, mas recuperável; avisa e segue.
      setErro(
        "O mês foi fechado, mas não consegui preparar o mês seguinte. Abra esta tela de novo mais tarde.",
      );
    }

    const { error: eSnapshot } = await supabase
      .from("acompanhamento_entradas")
      .update({ is_closing_snapshot: true })
      .eq("client_id", clientId)
      .eq("is_closing_snapshot", false);
    const { error: eStatus } = await supabase
      .from("clients")
      .update({ status: "em_acompanhamento" })
      .eq("id", clientId);
    if (eSnapshot || eStatus) {
      setErro("O mês foi fechado, mas uma parte do registro falhou. Recarregue a página para conferir.");
      setFechando(false);
      return;
    }

    setFechando(false);
    router.push("/planejamento/app/evolucao");
  }, [r, clientId, mes, metas, valores, router, fechando, jaFechado]);

  if (r.fase === "carregando") return <Carregando />;
  if (r.fase === "sem-ficha") return <SemFicha />;
  if (r.fase === "sem-sessao") return <SessaoExpirada />;
  if (r.dados.vazio) return <PrecisaPreencher />;

  return (
    <div className="surgir">
      <TituloTela
        numero={etapa.numero}
        titulo={`${etapa.titulo} · ${nomeDoMes(mes)}`}
        resumo={etapa.resumo}
      />

      {jaFechado && (
        <div className="mb-5 flex items-start gap-2 rounded-2xl border border-success/30 bg-success/5 p-4 text-xs text-slate-600">
          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
          Este mês já está fechado. Os números dele entraram na sua evolução.
        </div>
      )}

      {metas === null ? (
        <Carregando />
      ) : metas.length === 0 ? (
        <PrecisaPreencher
          titulo="Seu plano ainda não foi montado"
          texto="O lançamento do mês acompanha as metas do seu plano. Abra o plano uma vez e ele se monta sozinho."
        />
      ) : (
        <>
          <p className="mb-4 text-sm text-muted-foreground">
            Onde cada meta está hoje. Não precisa ser exato — o que importa é a
            direção.
          </p>

          <div className="space-y-3">
            {metas.map((m) => {
              const atual = valores[m.source_id] ?? String(m.current_value ?? "");
              const alvo = m.meta_valor;
              const partida = m.current_value ?? 0;
              const reduzindo = alvo != null && alvo < partida;
              const caminho = alvo != null ? Math.abs(partida - alvo) : 0;
              const andado = reduzindo ? partida - Number(atual || 0) : Number(atual || 0) - partida;
              const pct = caminho !== 0 ? (andado / caminho) * 100 : 0;

              return (
                <div key={m.id} className="rounded-2xl border border-border bg-white p-4">
                  <p className="text-sm font-semibold text-foreground">{m.source_label}</p>
                  {m.meta_text && (
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                      {m.meta_text}
                    </p>
                  )}

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor={`v-${m.id}`}
                        className="mb-1.5 block text-xs font-semibold text-slate-600"
                      >
                        Onde está hoje
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                          R$
                        </span>
                        <input
                          id={`v-${m.id}`}
                          inputMode="numeric"
                          value={formatarMoedaInput(atual)}
                          onChange={(e) =>
                            setValores({
                              ...valores,
                              [m.source_id]: digitosParaReais(e.target.value),
                            })
                          }
                          className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-[0.9375rem] tabular-nums outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
                        />
                      </div>
                      {alvo != null && (
                        <p className="mt-1 text-[11px] text-slate-500">
                          Meta: {brl(alvo)}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor={`n-${m.id}`}
                        className="mb-1.5 block text-xs font-semibold text-slate-600"
                      >
                        Como foi o mês (opcional)
                      </label>
                      <input
                        id={`n-${m.id}`}
                        value={notas[m.source_id] ?? ""}
                        onChange={(e) => setNotas({ ...notas, [m.source_id]: e.target.value })}
                        placeholder="Consegui guardar, mas veio o IPVA"
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[0.9375rem] outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
                      />
                    </div>
                  </div>

                  {caminho > 0 && (
                    <div className="mt-3">
                      <div className="mb-1 flex items-baseline justify-between text-2xs font-semibold text-muted-foreground">
                        <span>{reduzindo ? "Já reduziu" : "Já acumulou"}</span>
                        <span
                          className={`tabular-nums ${
                            pct < 0
                              ? "text-destructive"
                              : pct >= 100
                                ? "text-success-strong"
                                : "text-warning"
                          }`}
                        >
                          {Math.round(pct)}%
                        </span>
                      </div>
                      <Barra
                        valor={pct}
                        tom={pct >= 100 ? "success" : pct < 0 ? "warning" : "accent"}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {erro && (
            <p className="mt-4 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
              <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {erro}
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border/70 pt-5">
            <button
              type="button"
              onClick={salvarLancamento}
              disabled={salvando}
              className="flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-bold text-primary transition-colors hover:bg-muted disabled:opacity-60"
            >
              {salvando && <Loader2 className="h-4 w-4 animate-spin" />}
              {salvo ? "Salvo" : "Salvar o lançamento"}
            </button>

            {!jaFechado && (
              <AcaoAssinante acao="fechar o mês">
                <button
                  type="button"
                  onClick={() => void fecharMes()}
                  disabled={fechando}
                  className="flex items-center gap-2 rounded-xl bg-accent-btn px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-95 disabled:opacity-60"
                >
                  {fechando ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CalendarCheck className="h-4 w-4" />
                  )}
                  Fechar {nomeDoMes(mes)}
                </button>
              </AcaoAssinante>
            )}
          </div>

          <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
            Fechar o mês guarda uma foto de como as coisas estão e abre o mês
            seguinte com os mesmos números, para você só ajustar o que mudou.
          </p>
        </>
      )}
    </div>
  );
}
