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

      setEstado({
        fase: "pronto",
        nome,
        pilarFraco: fraco ? `${fraco.nome} (${Math.round(fraco.score)}/100)` : "—",
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
