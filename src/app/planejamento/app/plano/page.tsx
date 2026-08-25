"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { usePlanejamento } from "../usePlanejamento";
import { gerarMetas, paraTabelaMetas, type Meta } from "@/lib/planejamento/metas";
import { PERFIS } from "@/lib/planejamento/perfil";
import { etapaPorSlug } from "../etapas";
import {
  Barra,
  BotaoPrincipal,
  Carregando,
  PrecisaPreencher,
  SemFicha,
  TituloTela,
  brl,
} from "../pecas";

const ROTULO_AREA: Record<string, { titulo: string; emoji: string }> = {
  investimentos: { titulo: "Fazer o dinheiro render", emoji: "📈" },
  dividas: { titulo: "Sair das dívidas", emoji: "💳" },
  despesas: { titulo: "Gastar melhor", emoji: "🧾" },
  protecao: { titulo: "Proteger o que importa", emoji: "🛡️" },
  renda: { titulo: "Ganhar mais", emoji: "💼" },
  impostos: { titulo: "Pagar menos imposto", emoji: "⚖️" },
};

export default function PlanoPage() {
  const r = usePlanejamento();
  const etapa = etapaPorSlug("plano")!;

  const [metas, setMetas] = useState<Meta[] | null>(null);
  const [polindo, setPolindo] = useState(false);
  const jaMontou = useRef(false);

  /**
   * Monta o plano e o grava.
   *
   * A sequência é deliberada: as metas de regra aparecem PRIMEIRO na tela, e só
   * depois a IA reescreve os textos. Quem abre a tela vê o plano na hora; se a
   * IA demorar ou falhar, ninguém fica olhando para um spinner.
   */
  const montar = useCallback(async () => {
    if (r.fase !== "pronto" || r.dados.vazio) return;
    const { retrato, entrada, plano, acoes, clientId, dependentes, perfil } = r.dados;

    const base = gerarMetas(retrato, entrada, plano, acoes, dependentes);
    setMetas(base);
    if (base.length === 0) return;

    setPolindo(true);
    let finais = base;
    try {
      const resposta = await fetch("/api/plano", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metas: base.map((m) => ({ id: m.sourceId, texto: m.texto })),
          contexto: {
            perfil: perfil ?? undefined,
            sobraMensal: r.dados.diagnostico.sobraMensal,
            reservaCompleta: r.dados.reserva.completa,
            viavel: plano.viavel,
          },
        }),
      });
      if (resposta.ok) {
        const dados = await resposta.json();
        const porId = new Map<string, string>(
          (dados?.metas ?? []).map((m: { id: string; texto: string }) => [m.id, m.texto]),
        );
        finais = base.map((m) => ({ ...m, texto: porId.get(m.sourceId) ?? m.texto }));
        setMetas(finais);
      }
    } catch {
      // Fica com o texto de regra. É publicável.
    }
    setPolindo(false);

    // Persistir é o que faz o consultor enxergar este plano, caso o cliente
    // contrate a consultoria depois. A tela não depende disso para funcionar.
    const supabase = createClient();
    await supabase.from("parecer_metas").delete().eq("client_id", clientId);
    await supabase.from("parecer_metas").insert(paraTabelaMetas(clientId, finais));
  }, [r]);

  useEffect(() => {
    if (r.fase !== "pronto" || jaMontou.current) return;
    jaMontou.current = true;
    void montar();
  }, [r, montar]);

  if (r.fase === "carregando") return <Carregando />;
  if (r.fase === "sem-ficha") return <SemFicha />;
  if (r.fase === "sem-sessao") return null;

  const { acoes, plano, reserva, entrada, vazio, perfil: perfilSalvo } = r.dados;
  if (vazio) return <PrecisaPreencher />;

  const porArea = new Map<string, Meta[]>();
  for (const m of metas ?? []) {
    porArea.set(m.area, [...(porArea.get(m.area) ?? []), m]);
  }

  return (
    <div className="surgir">
      <TituloTela numero={etapa.numero} titulo={etapa.titulo} resumo={etapa.resumo} />

      {/* As três alavancas: o que muda a conta quando ela não fecha. */}
      {!plano.viavel && (
        <section className="mb-5 rounded-2xl border border-accent/30 bg-accent-tint p-5">
          <h2 className="font-display text-base font-bold text-primary">
            Três caminhos para fechar a sua conta
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            No ritmo de hoje você chega a {Math.round(plano.pctAtingido)}% do seu
            Marco Horizonte. Qualquer um destes três resolve — e dá para combinar.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Alavanca
              titulo="Guardar mais"
              valor={plano.pouparMaisMes ? `${brl(plano.pouparMaisMes)}/mês` : "—"}
              detalhe="a mais do que você guarda hoje"
            />
            <Alavanca
              titulo="Esperar um pouco"
              valor={plano.esperarAnos ? `+${plano.esperarAnos} ano${plano.esperarAnos > 1 ? "s" : ""}` : "—"}
              detalhe={`parar aos ${entrada.idadeAposentadoria + (plano.esperarAnos ?? 0)} em vez de ${entrada.idadeAposentadoria}`}
            />
            <Alavanca
              titulo="Render mais"
              valor={
                plano.rentNecessariaPct
                  ? `${plano.rentNecessariaPct.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% a.a.`
                  : "—"
              }
              detalhe="acima da inflação, contra os 5% do plano"
            />
          </div>
        </section>
      )}

      <section className="mb-5 grid gap-3 sm:grid-cols-3">
        <Cartao
          rotulo="Aporte recomendado"
          valor={`${brl(acoes.aporteRecomendadoMes)}/mês`}
          detalhe={`Perfil ${acoes.horizonte.toLowerCase()} prazo · retorno real estimado de ${acoes.rentEsperadaPct.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% a.a.`}
        />
        <Cartao
          rotulo="Reserva de emergência"
          valor={brl(reserva.meta)}
          detalhe={
            reserva.completa
              ? "Completa. Piso firme."
              : `Você tem ${brl(reserva.atual)} — faltam ${brl(reserva.faltam)}`
          }
        />
        <Cartao
          rotulo="Proteção sugerida"
          valor={acoes.protecaoFamilia > 0 ? brl(acoes.protecaoFamilia) : "—"}
          detalhe={`Capital de seguro de vida · ${acoes.anosProtecaoFamilia} anos de custo`}
        />
      </section>

      {/* Carteira por CLASSE, nunca por produto — o produto autônomo não faz
          suitability, então não recomenda ativo específico. */}
      <section className="mb-5 rounded-2xl border border-border bg-white p-5">
        <h2 className="font-display text-base font-bold text-primary">
          Como dividir o que você guarda
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Proporção por classe de ativo para um horizonte de{" "}
          {acoes.anosAteIndependencia} ano(s). Não é indicação de produto,
          corretora ou fundo.
        </p>
        <ul className="mt-4 space-y-3">
          {acoes.carteira.map((fatia) => (
            <li key={fatia.classe}>
              <div className="mb-1 flex items-baseline justify-between gap-3">
                <span className="text-xs font-semibold text-foreground">{fatia.classe}</span>
                <span className="text-2xs font-bold tabular-nums text-muted-foreground">
                  {fatia.pct}%
                </span>
              </div>
              <Barra valor={fatia.pct} />
            </li>
          ))}
        </ul>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold text-primary">
            O que fazer, em ordem
          </h2>
          <button
            type="button"
            onClick={() => void montar()}
            disabled={polindo}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-2xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
          >
            {polindo ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Refazer o plano
          </button>
        </div>

        {metas === null ? (
          <Carregando />
        ) : metas.length === 0 ? (
          <p className="rounded-2xl border border-border bg-white p-5 text-sm text-slate-600">
            Não há nada urgente a corrigir com os dados de hoje. Continue
            lançando os meses — o plano se ajusta conforme sua vida muda.
          </p>
        ) : (
          <div className="space-y-4">
            {[...porArea.entries()].map(([area, lista]) => {
              const rotulo = ROTULO_AREA[area] ?? { titulo: area, emoji: "•" };
              return (
                <div key={area} className="rounded-2xl border border-border bg-white p-5">
                  <h3 className="text-sm font-bold text-foreground">
                    <span className="mr-1.5">{rotulo.emoji}</span>
                    {rotulo.titulo}
                  </h3>
                  <ol className="mt-3 space-y-3">
                    {lista.map((m) => (
                      <li
                        key={`${m.sourceTable}-${m.sourceId}`}
                        className="border-l-2 border-accent/40 pl-3.5"
                      >
                        <p className="text-sm leading-relaxed text-slate-700">{m.texto}</p>
                        {m.prazo && (
                          <p className="mt-1 text-[11px] font-semibold text-muted-foreground">
                            Até{" "}
                            {new Date(m.prazo).toLocaleDateString("pt-BR", {
                              month: "long",
                              year: "numeric",
                            })}
                          </p>
                        )}
                      </li>
                    ))}
                  </ol>
                </div>
              );
            })}
          </div>
        )}

        {polindo && (
          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Sparkles className="h-3 w-3" />
            Ajustando a redação… os valores já são os definitivos.
          </p>
        )}
      </section>

      {perfilSalvo && PERFIS[perfilSalvo] && (
        <section className="mt-5 rounded-2xl bg-primary/5 p-5">
          <p className="text-sm leading-relaxed text-slate-600">
            <span className="font-semibold text-foreground">
              {PERFIS[perfilSalvo].emoji} {perfilSalvo}:
            </span>{" "}
            {PERFIS[perfilSalvo].comoUsar}
          </p>
        </section>
      )}

      <div className="mt-6 text-center">
        <BotaoPrincipal href="/planejamento/app/mes">
          Lançar o meu mês
          <ArrowRight className="h-4 w-4" />
        </BotaoPrincipal>
      </div>
    </div>
  );
}

function Alavanca({
  titulo,
  valor,
  detalhe,
}: {
  titulo: string;
  valor: string;
  detalhe: string;
}) {
  return (
    <div className="rounded-xl bg-white p-4">
      <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
        {titulo}
      </p>
      <p className="mt-1 font-display text-lg font-extrabold tabular-nums text-primary">
        {valor}
      </p>
      <p className="mt-0.5 text-[11px] leading-snug text-slate-500">{detalhe}</p>
    </div>
  );
}

function Cartao({
  rotulo,
  valor,
  detalhe,
}: {
  rotulo: string;
  valor: string;
  detalhe: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-white p-4">
      <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
        {rotulo}
      </p>
      <p className="mt-1 font-display text-xl font-extrabold tabular-nums text-primary">
        {valor}
      </p>
      <p className="mt-1 text-[11px] leading-snug text-slate-500">{detalhe}</p>
    </div>
  );
}
