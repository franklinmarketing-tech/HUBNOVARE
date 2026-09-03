"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ArrowDownToLine, Check, Lock } from "lucide-react";
import { CamposLead, leadCompleto, type DadosLead } from "@/components/CamposLead";
import { salvarLead } from "@/lib/leads";
import type { Ebook } from "@/lib/ebooks";

/**
 * O portão do guia: deixa o contato, leva o PDF.
 *
 * A estante era download livre — e download livre não deixa rastro nenhum.
 * Guia prático é a isca clássica justamente porque o assunto revela a
 * intenção: quem baixa o de previdência tem plano e dúvida sobre taxa; quem
 * baixa o de dívida está apertado. É informação de qualidade diferente de um
 * e-mail solto numa lista.
 *
 * TRÊS CUIDADOS que fazem a diferença entre isca e pedágio:
 *
 * 1. **Pede uma vez só.** Quem já deixou o contato em qualquer isca da casa
 *    (a chave `novare:lead` é a mesma de CapturaLead) baixa direto, sem
 *    reencontrar o formulário. Pedir de novo a quem já se identificou é
 *    desrespeito com quem já disse sim.
 * 2. **O PDF abre de qualquer jeito.** Se a gravação do lead falhar, o
 *    download acontece igual. A pessoa cumpriu a parte dela; problema nosso
 *    de banco não é problema dela.
 * 3. **Diz o que vai acontecer.** Sem letra miúda: o contato serve para a
 *    Novare falar com ela, e está escrito na tela.
 */
export function PortaoGuia({ ebook }: { ebook: Ebook }) {
  const [aberto, setAberto] = useState(false);
  const [jaIdentificado, setJaIdentificado] = useState(false);
  const [dados, setDados] = useState<DadosLead>({ nome: "", telefone: "", email: "" });
  const ok = leadCompleto(dados);

  useEffect(() => {
    try {
      const guardado = localStorage.getItem("novare:lead");
      if (guardado) {
        const l = JSON.parse(guardado);
        if (l?.email) {
          setJaIdentificado(true);
          setDados({ nome: l.nome ?? "", telefone: l.telefone ?? "", email: l.email });
        }
      }
    } catch {
      // Sem storage, pede o contato. É o comportamento seguro.
    }
  }, []);

  function baixar() {
    window.open(ebook.href, "_blank", "noopener,noreferrer");
  }

  function liberar() {
    if (!ok) return;

    // Grava e segue: o `void` é proposital, não esperamos o banco para abrir
    // o PDF. Ver o cuidado 2 no topo.
    void salvarLead({
      email: dados.email,
      nome: dados.nome.trim(),
      telefone: dados.telefone,
      origem: "/ebooks",
      tipo: "guia",
      payload: { guia: ebook.titulo },
    });

    try {
      localStorage.setItem(
        "novare:lead",
        JSON.stringify({ ...dados, origem: "/ebooks", ts: Date.now() }),
      );
    } catch {}

    setJaIdentificado(true);
    setAberto(false);
    baixar();
  }

  return (
    <div className="flex h-full flex-col rounded-2xl bg-card p-5 shadow-card ring-1 ring-primary/5 transition-all hover:-translate-y-0.5 hover:shadow-card-hover">
      <div className="flex items-start gap-4">
        <Image
          src={ebook.capa}
          alt=""
          width={72}
          height={96}
          className="h-24 w-[72px] shrink-0 rounded-lg object-cover shadow-[0_10px_24px_-12px_hsl(215_50%_23%_/_0.6)]"
        />
        <div className="min-w-0 flex-1">
          <p className="font-display text-base font-bold text-primary">
            {ebook.titulo}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {ebook.tema}
          </p>
        </div>
      </div>

      {aberto ? (
        <div className="mt-4 rounded-xl bg-gelo p-4">
          <p className="text-xs font-semibold text-foreground">
            Para onde enviamos o guia?
          </p>
          <div className="mt-3">
            <CamposLead dados={dados} aoMudar={setDados} compacto />
          </div>
          <button
            type="button"
            onClick={liberar}
            disabled={!ok}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-accent-btn px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-95 disabled:opacity-50"
          >
            <ArrowDownToLine className="h-4 w-4" />
            Baixar o guia
          </button>
          <p className="mt-2.5 text-[11px] leading-snug text-muted-foreground">
            O PDF abre na hora. Usamos o seu contato para falar com você sobre
            o assunto do guia — nada de lista de spam.
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => (jaIdentificado ? baixar() : setAberto(true))}
          className="group mt-4 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-soft"
        >
          {jaIdentificado ? (
            <>
              <Check className="h-4 w-4" />
              Baixar em PDF
            </>
          ) : (
            <>
              <Lock className="h-3.5 w-3.5" />
              Receber o guia
            </>
          )}
        </button>
      )}
    </div>
  );
}
