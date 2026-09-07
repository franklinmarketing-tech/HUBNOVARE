"use client";

import { useEffect, useState } from "react";
import { LifeBuoy, Check, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { brl } from "@/app/planejamento/app/pecas";

/**
 * "Chama alguém para olhar isso."
 *
 * A revisão trimestral vai do consultor para o cliente, no ritmo do
 * calendário. Este é o caminho inverso: quem estourou o orçamento em março
 * não pode esperar até junho para alguém olhar.
 *
 * O BOTÃO MUDA DE PESO CONFORME O PLANO. Quando algum limite estourou, ele
 * vem aceso e já diz o motivo; quando está tudo no lugar, fica discreto e sem
 * alarde. Botão que grita sempre vira botão que ninguém lê — e um pedido de
 * socorro disparado sem motivo gasta o tempo do consultor, que é justamente o
 * recurso escasso do modelo.
 */
export function PedirAnalise({
  clientId,
  sobraMensal,
  comprometimentoDividas,
  reserva,
}: {
  clientId: string;
  sobraMensal: number;
  comprometimentoDividas: number;
  reserva: { completa: boolean; faltam: number };
}) {
  const [estado, setEstado] = useState<
    "carregando" | "pode" | "enviando" | "pedido" | "erro"
  >("carregando");

  /* O que está fora do lugar AGORA. Vai gravado junto com o pedido: em duas
     semanas o número já não seria o mesmo, e o consultor precisa saber o que
     a pessoa estava vendo quando apertou o botão. */
  const alerta = (() => {
    if (sobraMensal <= 0)
      return "O mês está fechando no vermelho.";
    if (comprometimentoDividas > 30)
      return `As parcelas estão em ${Math.round(comprometimentoDividas)}% da renda.`;
    if (!reserva.completa && reserva.faltam > 0)
      return `Faltam ${brl(reserva.faltam)} para completar a reserva.`;
    return null;
  })();

  useEffect(() => {
    let ativo = true;
    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("pedidos_revisao")
        .select("id")
        .eq("client_id", clientId)
        .is("atendido_em", null)
        .limit(1)
        .maybeSingle();
      if (!ativo) return;
      setEstado(data ? "pedido" : "pode");
    })();
    return () => {
      ativo = false;
    };
  }, [clientId]);

  async function pedir() {
    setEstado("enviando");
    const supabase = createClient();
    const { error } = await supabase.from("pedidos_revisao").insert({
      client_id: clientId,
      motivo: alerta ?? "Pedido sem alerta no plano.",
    });
    setEstado(error ? "erro" : "pedido");
  }

  if (estado === "carregando") return null;

  if (estado === "pedido") {
    return (
      <p className="flex items-center gap-2 rounded-2xl border border-success/25 bg-success/[0.05] px-5 py-4 text-sm text-success-strong">
        <Check className="h-4 w-4 shrink-0" strokeWidth={2.5} />
        Pedido enviado. Um consultor da Novare vai olhar o seu plano.
      </p>
    );
  }

  const aceso = alerta !== null;

  return (
    <div
      className={`rounded-2xl border px-5 py-4 ${
        aceso
          ? "border-accent/30 bg-accent/[0.06]"
          : "border-slate-200/80 bg-white"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-semibold text-primary">
            <LifeBuoy
              className={`h-4 w-4 shrink-0 ${aceso ? "text-accent-strong" : "text-muted-foreground"}`}
              strokeWidth={2}
            />
            {aceso ? "Quer que a gente olhe isso?" : "Precisa de uma segunda opinião?"}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {alerta
              ? `${alerta} Um consultor pode olhar o seu caso antes da revisão do trimestre.`
              : "Você pode chamar um consultor a qualquer momento, sem esperar a revisão do trimestre."}
          </p>
        </div>

        <button
          type="button"
          onClick={pedir}
          disabled={estado === "enviando"}
          className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all disabled:opacity-60 ${
            aceso
              ? "bg-accent-btn text-white shadow-[0_4px_14px_-6px_hsl(16_80%_45%_/_0.6)] hover:-translate-y-0.5"
              : "border border-slate-200 text-primary hover:bg-slate-50"
          }`}
        >
          {estado === "enviando" && <Loader2 className="h-4 w-4 animate-spin" />}
          Pedir análise
        </button>
      </div>

      {estado === "erro" && (
        <p role="status" className="mt-3 text-xs text-destructive">
          Não consegui enviar o pedido. Tente de novo.
        </p>
      )}
    </div>
  );
}
