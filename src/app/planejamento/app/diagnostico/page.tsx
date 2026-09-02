"use client";

import { useEffect, useRef } from "react";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { usePlanejamento } from "../usePlanejamento";
import { NOTA_RISCO, paraTabelaDiagnosis } from "@/lib/planejamento/diagnostico";
import { CATEGORIAS_DESPESA, mesAtual } from "@/lib/planejamento/catalogos";
import { conferir } from "@/lib/planejamento/plausibilidade";
import { etapaPorSlug } from "../etapas";
import {
  Barra,
  BotaoPrincipal,
  Carregando,
  Indicador,
  PrecisaPreencher,
  SemFicha,
  TituloTela,
  brl,
  pct,
  FalhouAoCarregar,
  SessaoExpirada,
} from "../pecas";

export default function DiagnosticoPage() {
  const r = usePlanejamento();
  const jaGravou = useRef(false);
  const etapa = etapaPorSlug("diagnostico")!;

  /**
   * Persiste o diagnóstico para o consultor conseguir ler, se um dia o cliente
   * contratar a consultoria.
   *
   * No app do consultor essa gravação era efeito colateral de um admin abrir a
   * aba — o cliente podia existir há meses sem nunca ter uma linha em
   * `diagnosis`. Aqui ela nasce do próprio dono, e a tela não depende dela para
   * nada: tudo que aparece foi calculado no navegador.
   */
  useEffect(() => {
    if (r.fase !== "pronto" || r.dados.vazio || jaGravou.current) return;
    jaGravou.current = true;

    (async () => {
      const supabase = createClient();
      const mes = mesAtual();
      const payload = paraTabelaDiagnosis(r.dados.clientId, mes, r.dados.diagnostico);

      const { data: existente } = await supabase
        .from("diagnosis")
        .select("id")
        .eq("client_id", r.dados.clientId)
        .eq("month_ref", mes)
        .maybeSingle();

      if (existente) {
        await supabase.from("diagnosis").update(payload).eq("id", existente.id);
      } else {
        await supabase.from("diagnosis").insert(payload);
      }
    })();
  }, [r]);

  if (r.fase === "carregando") return <Carregando />;
  if (r.fase === "sem-ficha") return <SemFicha />;
  if (r.fase === "sem-sessao") return <SessaoExpirada />;
  if (r.fase === "erro") return <FalhouAoCarregar />;

  const { diagnostico: d, vazio } = r.dados;
  if (vazio) return <PrecisaPreencher />;

  const nota = NOTA_RISCO[d.risco];
  const avisos = conferir({
    rendaMensal: d.rendaMensal,
    despesaMensal: d.despesaMensal,
    parcelasMensais: d.parcelasMensais,
    patrimonioTotal: d.patrimonioTotal,
    dividaTotal: d.dividaTotal,
  });

  return (
    <div className="surgir">
      <TituloTela numero={etapa.numero} titulo={etapa.titulo} resumo={etapa.resumo} />

      {avisos.length > 0 && (
        <div className="mb-5 rounded-2xl border border-warning/40 bg-warning/5 p-4 text-xs text-slate-600">
          {avisos.map((a) => (
            <p key={a.texto}>{a.texto}</p>
          ))}
        </div>
      )}

      <section
        className={`rounded-3xl border p-6 ${
          nota.tom === "bom"
            ? "border-success/30 bg-success/5"
            : nota.tom === "atencao"
              ? "border-warning/40 bg-warning/5"
              : "border-destructive/30 bg-destructive/5"
        }`}
      >
        <div className="flex flex-wrap items-baseline gap-3">
          <p className="font-display text-2xl font-extrabold text-primary">
            Situação {nota.rotulo.toLowerCase()}
          </p>
          <span className="rounded-md bg-primary px-2 py-0.5 text-2xs font-extrabold text-white">
            NOTA {d.risco}
          </span>
        </div>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
          {nota.recado}
        </p>
      </section>

      <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Indicador rotulo="Entra por mês" valor={brl(d.rendaMensal)} tom="bom" />
        <Indicador
          rotulo="Sai por mês"
          valor={brl(d.despesaMensal)}
          detalhe={`${pct(d.comprometimentoDespesas)} da renda`}
        />
        <Indicador
          rotulo="Parcelas de dívida"
          valor={brl(d.parcelasMensais)}
          detalhe={`${pct(d.comprometimentoDividas)} da renda`}
          tom={d.comprometimentoDividas > 30 ? "ruim" : "neutro"}
        />
        <Indicador
          rotulo="Sobra"
          valor={brl(d.sobraMensal)}
          detalhe={`${pct(d.taxaPoupanca)} do que você ganha`}
          tom={d.sobraMensal > 0 ? "bom" : "ruim"}
        />
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="rounded-2xl border border-border bg-white p-5">
          <h2 className="font-display text-base font-bold text-primary">
            Para onde vai o seu dinheiro
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            As maiores primeiro. É aqui que mora quase toda economia possível.
          </p>
          {d.despesasPorCategoria.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">Nenhuma despesa lançada.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {d.despesasPorCategoria.map((c) => {
                const conhecida = CATEGORIAS_DESPESA.find((x) => x.valor === c.categoria);
                return (
                <li key={c.categoria}>
                  <div className="mb-1 flex items-baseline justify-between gap-3">
                    <span className="text-xs font-semibold text-foreground">
                      <span className="mr-1.5">{conhecida?.emoji ?? "•"}</span>
                      {conhecida?.rotulo ?? c.categoria}
                    </span>
                    <span className="text-2xs font-bold tabular-nums text-muted-foreground">
                      {brl(c.valor)} · {c.fatia}%
                    </span>
                  </div>
                  <Barra
                    valor={c.fatia}
                    tom={c.fatia > 40 ? "warning" : "accent"}
                    rotulo={`${conhecida?.rotulo ?? c.categoria}, fatia das suas despesas`}
                  />
                </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl border border-border bg-white p-5">
            <h2 className="font-display text-base font-bold text-primary">
              O que você tem e o que deve
            </h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-slate-600">Patrimônio</dt>
                <dd className="font-bold tabular-nums text-foreground">
                  {brl(d.patrimonioTotal)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-600">Dívidas</dt>
                <dd className="font-bold tabular-nums text-destructive">
                  − {brl(d.dividaTotal)}
                </dd>
              </div>
              <div className="flex justify-between gap-3 border-t border-border pt-2">
                <dt className="font-semibold text-foreground">Patrimônio líquido</dt>
                <dd className="font-display text-lg font-extrabold tabular-nums text-primary">
                  {brl(d.patrimonioLiquido)}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl bg-primary/5 p-5">
            <p className="text-sm leading-relaxed text-slate-600">
              Estes números saem direto do que você preencheu, e são recalculados
              toda vez que você abre esta tela. Nada aqui espera aprovação de
              ninguém.
            </p>
            <div className="mt-4">
              <BotaoPrincipal href="/planejamento/app/plano">
                Ver o que fazer agora
                <ArrowRight className="h-4 w-4" />
              </BotaoPrincipal>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
