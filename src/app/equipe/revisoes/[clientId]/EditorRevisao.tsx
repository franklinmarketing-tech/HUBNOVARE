"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Send, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { carregarRetrato } from "@/lib/planejamento/cliente";
import { montarEntrada } from "@/lib/planejamento/montarPlano";
import {
  computeLifePlan,
  computeHealthScore,
  reservaEmergencia,
} from "@/lib/planejamento/lifeplan";
import { calcularDiagnostico } from "@/lib/planejamento/diagnostico";
import { computeActionPlan } from "@/lib/planejamento/actionplan";
import { rotuloMes } from "@/lib/planejamento/catalogos";
import { brl, pct } from "@/app/planejamento/app/pecas";
import { rotuloTrimestre } from "@/lib/planejamento/trimestre";

type Estado =
  | { fase: "carregando" }
  | { fase: "erro"; motivo: string }
  | { fase: "vazio" }
  | {
      fase: "pronto";
      nome: string;
      numeros: { rotulo: string; valor: string; nota?: string }[];
      pilarFraco: string;
      /** O retrato por tras dos numeros — o que o consultor precisa para ter
          opiniao, e nao so para repetir o indicador. */
      perfil: string[];
      categorias: { categoria: string; valor: number; fatia: number }[];
      dividas: { o_que: string; saldo: number; parcela: number; juros: number | null }[];
      objetivos: { o_que: string; alvo: number | null; prazo: string | null }[];
      recomendado: { rotulo: string; valor: string }[];
      historico: { mes: string; patrimonio: number }[];
    };

/**
 * O caso do cliente e o campo do parecer, na mesma tela.
 *
 * Por que os números vêm prontos: é isto que faz a revisão caber em quinze
 * minutos. O motor já calculou Marco Horizonte, nota de saúde, sobra e
 * comprometimento — o consultor não recalcula nada, ele lê e dá o
 * julgamento, que é justamente o que o software não faz.
 *
 * O carregamento reusa `carregarRetrato` e `computeLifePlan`, os mesmos que a
 * trilha do cliente usa. Se a conta mudar lá, muda aqui — o consultor nunca
 * comenta um número diferente do que o cliente está vendo.
 */
export function EditorRevisao({
  clientId,
  trimestre,
}: {
  clientId: string;
  trimestre: string;
}) {
  const [estado, setEstado] = useState<Estado>({ fase: "carregando" });
  const [texto, setTexto] = useState("");
  const [statusRevisao, setStatusRevisao] = useState<"rascunho" | "enviada">(
    "rascunho",
  );
  const [salvando, setSalvando] = useState<
    "nao" | "salvando" | "ok" | "erro" | "curto"
  >("nao");
  /** Preenchido quando o parecer foi salvo mas o aviso ao cliente falhou. */
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;

    (async () => {
      const supabase = createClient();

      const [retrato, cliente, revisao] = await Promise.all([
        carregarRetrato(clientId),
        supabase
          .from("clients")
          .select("user_id, date_of_birth, dependents_count")
          .eq("id", clientId)
          .maybeSingle(),
        supabase
          .from("revisoes")
          .select("texto, status")
          .eq("client_id", clientId)
          .eq("periodo_ref", trimestre)
          .maybeSingle(),
      ]);
      if (!ativo) return;

      if (retrato.falhou) {
        return setEstado({
          fase: "erro",
          motivo:
            "Não consegui ler o retrato deste cliente. Verifique se o SQL de permissões da equipe já foi rodado.",
        });
      }

      if (revisao.data) {
        setTexto((revisao.data.texto as string) ?? "");
        setStatusRevisao(
          (revisao.data.status as "rascunho" | "enviada") ?? "rascunho",
        );
      }

      /* O nome vem de `hub_profiles`: `clients` nao tem coluna de nome. */
      let nome = `Cliente ${clientId.slice(0, 8)}`;
      if (cliente.data?.user_id) {
        const { data: perfil } = await supabase
          .from("hub_profiles")
          .select("nome")
          .eq("id", cliente.data.user_id as string)
          .maybeSingle();
        if (perfil?.nome) nome = perfil.nome as string;
      }

      if (retrato.rendas.length === 0 && retrato.despesas.length === 0) {
        return setEstado({ fase: "vazio" });
      }

      const entrada = montarEntrada(retrato, {
        nascimento: (cliente.data?.date_of_birth as string) ?? null,
      });
      const plano = computeLifePlan(entrada);
      const saude = computeHealthScore(entrada, plano);
      const reserva = reservaEmergencia(entrada);
      const diag = calcularDiagnostico({
        rendas: retrato.rendas,
        despesas: retrato.despesas,
        dividas: retrato.dividas,
        patrimonio: retrato.patrimonio,
      });

      /* O pilar mais fraco é o atalho do parecer: é quase sempre por ali que
         começa "o que está travando". */
      const fraco = [...saude.pilares].sort((a, b) => a.score - b.score)[0];

      const acoes = computeActionPlan(entrada, plano);

      /* Os ultimos fechamentos, para o consultor ver TRAJETORIA e nao so a
         foto de hoje. "Melhorou ou piorou" e metade de qualquer parecer. */
      const { data: fechamentos } = await supabase
        .from("monthly_closings")
        .select("month_ref, net_worth")
        .eq("client_id", clientId)
        .order("month_ref", { ascending: false })
        .limit(6);

      setEstado({
        fase: "pronto",
        nome,
        pilarFraco: fraco ? `${fraco.nome} (${Math.round(fraco.score)}/100)` : "—",

        perfil: [
          `${entrada.idadeAtual} anos`,
          `pretende parar aos ${entrada.idadeAposentadoria}`,
          `${(cliente.data?.dependents_count as number) ?? 0} dependente(s)`,
          `horizonte ${acoes.horizonte.toLowerCase()} (${acoes.anosAteIndependencia} anos)`,
          `renda ${brl(diag.rendaMensal)}/mês`,
        ],

        categorias: diag.despesasPorCategoria.slice(0, 6),

        dividas: retrato.dividas.map((d) => ({
          o_que: d.creditor ? `${d.type} · ${d.creditor}` : d.type,
          saldo: d.total_amount ?? 0,
          parcela: d.monthly_payment ?? 0,
          juros: d.interest_rate ?? null,
        })),

        objetivos: retrato.objetivos
          .filter((o) => !o.completed_at)
          .map((o) => ({
            o_que: o.description,
            alvo: o.target_amount,
            prazo: o.deadline,
          })),

        /* O que o motor RECOMENDA, ao lado do que a pessoa faz. A diferenca
           entre as duas colunas e, na pratica, a pauta do parecer. */
        recomendado: [
          { rotulo: "Aporte recomendado", valor: brl(acoes.aporteRecomendadoMes) },
          { rotulo: "Reserva alvo", valor: brl(acoes.reservaEmergencia) },
          { rotulo: "Seguro de vida sugerido", valor: brl(acoes.protecaoFamilia) },
          { rotulo: "Retorno real esperado", valor: `${acoes.rentEsperadaPct.toFixed(1).replace(".", ",")}% a.a.` },
        ],

        historico: (fechamentos ?? [])
          .slice()
          .reverse()
          .map((f) => ({
            mes: rotuloMes(f.month_ref as string, "curto"),
            patrimonio: (f.net_worth as number) ?? 0,
          })),
        numeros: [
          { rotulo: "Nota de saúde", valor: `${Math.round(saude.total)}/100`, nota: saude.nota },
          { rotulo: "Sobra por mês", valor: brl(diag.sobraMensal), nota: `${pct(diag.taxaPoupanca)} da renda` },
          { rotulo: "Marco Horizonte", valor: brl(plano.alvoAposentadoria), nota: `${pct(plano.pctAtingido)} atingido no ritmo atual` },
          { rotulo: "Dívidas", valor: pct(diag.comprometimentoDividas), nota: "da renda comprometida" },
          /* `reserva.meses` é a META (6), não o que a pessoa tem — mostrar
             aquilo dizia "6,0 meses" ao lado de "faltam R$ 43.700", que se
             contradizem. Os meses acumulados são `atual / custo`, a mesma
             conta que a tela do cliente faz. */
          {
            rotulo: "Reserva",
            valor: `${(reserva.atual / Math.max(1, reserva.custo)).toFixed(1).replace(".", ",")} meses`,
            nota: reserva.completa
              ? `completa (meta: ${reserva.meses} meses)`
              : `faltam ${brl(reserva.faltam)} para ${reserva.meses} meses`,
          },
          { rotulo: "Aporte que fecha a conta", valor: plano.pouparMaisMes ? brl(plano.pouparMaisMes) : "no ritmo", nota: plano.viavel ? "plano viável" : "acima do que sobra hoje" },
        ],
      });
    })();

    return () => {
      ativo = false;
    };
  }, [clientId, trimestre]);

  /**
   * Grava pelo servidor, não direto no banco.
   *
   * O rascunho até poderia ir direto, mas o envio não: precisa da chave do
   * Resend e do e-mail do cliente, que só o servidor alcança. Passar os dois
   * pelo mesmo caminho deixa o papel conferido no servidor nos dois casos.
   */
  async function gravar(novoStatus: "rascunho" | "enviada") {
    if (novoStatus === "enviada" && texto.trim().length < 40) {
      setSalvando("curto");
      return;
    }
    setSalvando("salvando");

    try {
      const r = await fetch("/api/revisao", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          clientId,
          trimestre,
          texto,
          enviar: novoStatus === "enviada",
        }),
      });
      const dados = await r.json();
      if (!r.ok) return setSalvando("erro");

      setStatusRevisao(novoStatus);
      /* O parecer está salvo mesmo quando o aviso falha — e a tela diz isso
         em vez de fingir que deu tudo certo. */
      setAviso(
        novoStatus === "enviada" && !dados.avisado
          ? (dados.porQueNao as string) || "o aviso não saiu"
          : null,
      );
      setSalvando("ok");
    } catch {
      setSalvando("erro");
    }
  }

  if (estado.fase === "carregando") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-accent" />
        <span className="sr-only">Carregando o caso</span>
      </div>
    );
  }

  if (estado.fase === "erro") {
    return (
      <p className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-sm text-foreground">
        {estado.motivo}
      </p>
    );
  }

  if (estado.fase === "vazio") {
    return (
      <p className="rounded-2xl border border-dashed border-primary/20 bg-white/60 p-6 text-sm text-muted-foreground">
        Este cliente ainda não preencheu o retrato financeiro. Não há o que
        revisar — a revisão dele começa quando os dados existirem.
      </p>
    );
  }

  return (
    <>
      <p className="text-xs text-muted-foreground">
        {rotuloTrimestre(trimestre)}
        {statusRevisao === "enviada" && " · já enviada"}
      </p>
      <h1 className="titulo-secao mt-1 text-2xl sm:text-3xl">{estado.nome}</h1>

      {/* Os números que o motor já produziu. O consultor lê, não recalcula. */}
      <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {estado.numeros.map((n) => (
          <li
            key={n.rotulo}
            className="rounded-2xl border border-slate-200/80 bg-white p-4"
          >
            <p className="text-xs text-muted-foreground">{n.rotulo}</p>
            <p className="mt-1 font-display text-xl font-semibold tabular-nums text-primary">
              {n.valor}
            </p>
            {n.nota && (
              <p className="mt-0.5 text-[11px] leading-snug text-slate-500">
                {n.nota}
              </p>
            )}
          </li>
        ))}
      </ul>

      <p className="mt-4 rounded-xl bg-accent-tint px-4 py-3 text-xs leading-relaxed text-accent-strong">
        <b className="font-semibold">Provável ponto de partida:</b>{" "}
        {estado.pilarFraco} é o pilar mais baixo da nota.
      </p>

      {/* ================= O RETRATO POR TRAS DOS NUMEROS =================
          Seis indicadores dizem COMO o cliente esta. Nao dizem POR QUE — e
          sem o porque o parecer vira leitura de painel, que o proprio app ja
          faz sozinho. O que segue e o material de julgamento: para onde vai o
          dinheiro, o que ele deve, o que ele quer, e o que o motor
          recomenda. */}

      <div className="mt-6 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        {estado.perfil.map((p) => (
          <span key={p}>{p}</span>
        ))}
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        {/* Para onde vai o dinheiro */}
        {estado.categorias.length > 0 && (
          <section className="rounded-2xl border border-slate-200/80 bg-white p-5">
            <h2 className="font-display text-sm font-semibold text-primary">
              Para onde vai o dinheiro
            </h2>
            <ul className="mt-3 space-y-2.5">
              {estado.categorias.map((c) => (
                <li key={c.categoria}>
                  <div className="flex items-baseline justify-between gap-3 text-xs">
                    <span className="truncate text-foreground">{c.categoria}</span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {brl(c.valor)} · {c.fatia}%
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-primary/[0.07]">
                    <div
                      className="h-full rounded-full bg-ciano"
                      style={{ width: `${Math.min(100, c.fatia)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* O que o motor recomenda — a pauta do parecer mora na diferenca
            entre isto e o que a pessoa faz hoje. */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5">
          <h2 className="font-display text-sm font-semibold text-primary">
            O que o plano recomenda
          </h2>
          <dl className="mt-3 space-y-2.5">
            {estado.recomendado.map((r) => (
              <div key={r.rotulo} className="flex items-baseline justify-between gap-3">
                <dt className="text-xs text-muted-foreground">{r.rotulo}</dt>
                <dd className="shrink-0 font-display text-sm font-semibold tabular-nums text-primary">
                  {r.valor}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Dividas: o juro e o que decide a ordem de ataque. */}
        {estado.dividas.length > 0 && (
          <section className="rounded-2xl border border-slate-200/80 bg-white p-5">
            <h2 className="font-display text-sm font-semibold text-primary">
              Dívidas ({estado.dividas.length})
            </h2>
            <ul className="mt-3 space-y-2.5">
              {estado.dividas.map((d, i) => (
                <li key={`${d.o_que}-${i}`} className="text-xs">
                  <p className="truncate text-foreground">{d.o_que}</p>
                  <p className="mt-0.5 tabular-nums text-muted-foreground">
                    {brl(d.saldo)} · parcela {brl(d.parcela)}
                    {d.juros != null && ` · ${d.juros}% a.a.`}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Objetivos: e o que a pessoa QUER, e o parecer sem isso vira
            aritmetica sem destino. */}
        {estado.objetivos.length > 0 && (
          <section className="rounded-2xl border border-slate-200/80 bg-white p-5">
            <h2 className="font-display text-sm font-semibold text-primary">
              Objetivos ({estado.objetivos.length})
            </h2>
            <ul className="mt-3 space-y-2.5">
              {estado.objetivos.map((o, i) => (
                <li key={`${o.o_que}-${i}`} className="text-xs">
                  <p className="truncate text-foreground">{o.o_que}</p>
                  <p className="mt-0.5 tabular-nums text-muted-foreground">
                    {o.alvo ? brl(o.alvo) : "sem valor"}
                    {o.prazo && ` · até ${o.prazo.slice(0, 7).split("-").reverse().join("/")}`}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {/* Trajetoria: "melhorou ou piorou" e metade de qualquer parecer. */}
      {estado.historico.length > 1 && (
        <section className="mt-5 rounded-2xl border border-slate-200/80 bg-white p-5">
          <h2 className="font-display text-sm font-semibold text-primary">
            Patrimônio nos últimos fechamentos
          </h2>
          <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
            {estado.historico.map((h) => (
              <li key={h.mes}>
                <p className="text-[11px] text-muted-foreground">{h.mes}</p>
                <p className="font-display text-sm font-semibold tabular-nums text-primary">
                  {brl(h.patrimonio)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-10">
        <label
          htmlFor="parecer"
          className="font-display text-base font-semibold text-primary"
        >
          O seu parecer
        </label>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          O que mudou, o que está travando e qual é o próximo movimento.
          Consultoria financeira: comente o plano, sem indicar ativo, produto,
          fundo ou corretora.
        </p>

        <textarea
          id="parecer"
          value={texto}
          onChange={(e) => {
            setTexto(e.target.value);
            setSalvando("nao");
            setAviso(null);
          }}
          rows={12}
          className="mt-4 w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-relaxed outline-none transition-colors focus:border-accent focus:ring-4 focus:ring-accent/12"
          placeholder="Desde a última revisão, a sua sobra subiu de…"
        />

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => gravar("rascunho")}
            disabled={salvando === "salvando"}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-slate-50 disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            Salvar rascunho
          </button>

          <button
            type="button"
            onClick={() => gravar("enviada")}
            disabled={salvando === "salvando"}
            className="inline-flex items-center gap-2 rounded-xl bg-accent-btn px-5 py-2.5 text-sm font-bold text-white shadow-[0_4px_14px_-6px_hsl(16_80%_45%_/_0.6)] transition-all hover:-translate-y-0.5 disabled:opacity-60"
          >
            <Send className="h-4 w-4" />
            {statusRevisao === "enviada" ? "Reenviar ao cliente" : "Enviar ao cliente"}
          </button>

          <span
            role="status"
            className="text-xs text-muted-foreground"
          >
            {salvando === "salvando" && "Salvando…"}
            {salvando === "ok" &&
              (statusRevisao !== "enviada"
                ? "Rascunho salvo."
                : aviso
                  ? `Enviado e visível no app do cliente — mas o aviso não saiu (${aviso}).`
                  : "Enviado. O cliente foi avisado no sino e por e-mail.")}
            {salvando === "curto" && "Escreva o parecer antes de enviar."}
            {salvando === "erro" && "Não consegui salvar. Tente de novo."}
          </span>
        </div>
      </section>

      <Link
        href="/equipe/revisoes"
        className="mt-10 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar à fila
      </Link>
    </>
  );
}
