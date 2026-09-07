"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { rotuloTrimestre } from "@/lib/planejamento/trimestre";

type Revisao = { texto: string; periodo_ref: string; enviada_em: string | null };

/**
 * O parecer do consultor, na tela de quem assina.
 *
 * É a entrega do único item da assinatura que não é software — e por isso
 * fica no topo da trilha, antes dos números: quem pagou por "um consultor
 * olha o seu plano" precisa ver que alguém olhou.
 *
 * Só aparece quando existe parecer ENVIADO. Rascunho não vaza: a policy de
 * `revisoes` já filtra por `status = 'enviada'`, e este componente não tem
 * como contornar isso mesmo que quisesse — o banco não devolve a linha.
 *
 * Silêncio quando não há: um card dizendo "nenhuma revisão ainda" é ruído na
 * tela de quem acabou de assinar e ainda não completou o primeiro mês.
 */
export function RevisaoDoConsultor({ clientId }: { clientId: string }) {
  const [revisao, setRevisao] = useState<Revisao | null>(null);

  useEffect(() => {
    let ativo = true;

    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("revisoes")
        .select("texto, periodo_ref, enviada_em")
        .eq("client_id", clientId)
        .order("periodo_ref", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!ativo || !data) return;
      setRevisao(data as Revisao);
    })();

    return () => {
      ativo = false;
    };
  }, [clientId]);

  if (!revisao) return null;

  return (
    <section className="rounded-3xl border border-accent/25 bg-accent/[0.05] p-6 sm:p-7">
      <div className="flex items-start gap-4">
        <span className="relative hidden h-14 w-14 shrink-0 items-center justify-center sm:flex">
          <span
            aria-hidden
            className="absolute inset-0 rounded-full blur-lg"
            style={{
              background:
                "radial-gradient(circle, hsl(16 85% 60% / 0.28), transparent 70%)",
            }}
          />
          <Image
            src="/icones-3d/parecer-3d.png"
            alt=""
            width={56}
            height={56}
            className="relative object-contain"
          />
        </span>

        <div className="min-w-0">
          <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-accent-strong">
            Revisão do consultor · {rotuloTrimestre(revisao.periodo_ref)}
          </p>
          <h2 className="mt-1.5 font-display text-lg font-semibold text-primary">
            Um consultor da Novare leu o seu plano
          </h2>

          {/* `whitespace-pre-line`: o parecer é escrito em parágrafos num
              textarea, e sem isto tudo colapsaria numa linha só. */}
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-foreground">
            {revisao.texto}
          </p>

          <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
            Consultoria financeira da Novare — organizar, projetar e priorizar.
            Não é indicação de ativo, produto, fundo ou corretora.
          </p>
        </div>
      </div>
    </section>
  );
}
