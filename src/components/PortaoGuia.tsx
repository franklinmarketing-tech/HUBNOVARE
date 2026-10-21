"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ArrowDownToLine, Check, Lock } from "lucide-react";
import {
  CampoInvestimento,
  CamposLead,
  contatoParcial,
  investimentoValido,
  contatoSalvo,
  leadCompleto,
  type DadosLead,
} from "@/components/CamposLead";
import { salvarLead } from "@/lib/leads";
import type { Ebook } from "@/lib/ebooks";

const chaveGuia = (href: string) => `novare:guia:${href}`;
const EVENTO_CONTATO = "novare:contato-salvo";

/**
 * O portão do eBook: deixa o contato, leva o PDF.
 *
 * ⚠️ DESDE 20/10/2026 SÃO TRÊS CAMPOS OBRIGATÓRIOS — nome, e-mail e WhatsApp —
 * e VALE PARA TODO eBOOK, inclusive o material da casa, que era download
 * livre. Pedido do dono: o Jefferson liga para quem baixa.
 * ⚠️ 21/10/2026: a "faixa de renda" opcional virou a pergunta OBRIGATÓRIA de
 * quanto a pessoa pretende investir ou já tem investido (`payload.investimento`).
 *
 * TRÊS CUIDADOS que fazem a diferença entre isca e pedágio:
 *
 * 1. **Pede uma vez só.** Quem já deixou o contato COMPLETO neste aparelho
 *    (`contatoSalvo`, a mesma régua do PDF das ferramentas) baixa direto.
 *    Contato antigo sem WhatsApp revê o formulário, já preenchido.
 * 2. **Um lead por eBook.** Mesmo baixando direto, o primeiro download de
 *    cada guia registra o lead daquele guia (`novare:guia:<href>`): o assunto
 *    revela a intenção, e é isso que o Jefferson usa para ligar.
 * 3. **O PDF abre no mesmo clique.** O `window.open` é síncrono de propósito:
 *    com um `await` antes, o navegador bloqueia a aba como pop-up. A gravação
 *    segue em paralelo — e lead de equipe/teste é barrado na rota.
 */
export function PortaoGuia({ ebook }: { ebook: Ebook }) {
  const [aberto, setAberto] = useState(false);
  const [jaIdentificado, setJaIdentificado] = useState(false);
  const [dados, setDados] = useState<DadosLead>({ nome: "", telefone: "", email: "" });
  const [investimento, setInvestimento] = useState("");
  const ok = leadCompleto(dados, true) && investimentoValido(investimento);

  useEffect(() => {
    const ler = () => {
      const salvo = contatoSalvo();
      if (salvo && investimentoValido(salvo.investimento)) {
        setJaIdentificado(true);
        setAberto(false);
        setDados({ nome: salvo.nome, email: salvo.email, telefone: salvo.telefone });
        setInvestimento(salvo.investimento ?? "");
      } else {
        setDados(contatoParcial());
        setInvestimento(salvo?.investimento ?? "");
      }
    };
    ler();
    // Deixou o contato num cartão, os outros da página liberam junto — sem
    // isto, cada cartão só lia o contato ao montar e pedia o formulário de novo.
    window.addEventListener(EVENTO_CONTATO, ler);
    return () => window.removeEventListener(EVENTO_CONTATO, ler);
  }, []);

  function registrar(contato: DadosLead, renda: string) {
    void salvarLead({
      email: contato.email,
      nome: contato.nome.trim(),
      telefone: contato.telefone,
      origem: "/ebooks",
      tipo: "guia",
      payload: { guia: ebook.titulo, investimento: renda },
    });
    try {
      localStorage.setItem(chaveGuia(ebook.href), "1");
    } catch {}
  }

  /** Já identificado: abre o PDF e registra este guia, se for o primeiro. */
  function baixar() {
    window.open(ebook.href, "_blank", "noopener,noreferrer");
    try {
      if (!localStorage.getItem(chaveGuia(ebook.href))) registrar(dados, investimento);
    } catch {}
  }

  function liberar() {
    if (!ok) return;
    window.open(ebook.href, "_blank", "noopener,noreferrer");
    registrar(dados, investimento);
    try {
      localStorage.setItem(
        "novare:lead",
        JSON.stringify({ ...dados, ...(investimento ? { investimento } : {}), origem: "/ebooks", ts: Date.now() }),
      );
    } catch {}
    setJaIdentificado(true);
    setAberto(false);
    window.dispatchEvent(new Event(EVENTO_CONTATO));
  }

  return (
    <div className="cartao-cp flex h-full flex-col p-5 transition-all hover:-translate-y-0.5 hover:shadow-ciano">
      <div className="flex items-start gap-4">
        <Image
          src={ebook.capa}
          alt=""
          width={72}
          height={96}
          className="h-24 w-[72px] shrink-0 rounded-lg object-cover shadow-[0_10px_24px_-12px_hsl(199_75%_16%_/_0.6)]"
        />
        <div className="min-w-0 flex-1">
          <p className="font-display text-base font-semibold text-primary">{ebook.titulo}</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{ebook.tema}</p>
        </div>
      </div>

      {aberto ? (
        <div className="painel-gelo mt-4 p-4">
          <p className="text-xs font-semibold text-foreground">Para quem é o guia?</p>
          <div className="mt-3">
            <CamposLead dados={dados} aoMudar={setDados} compacto telefoneObrigatorio />
          </div>
          <div className="mt-3">
            <CampoInvestimento valor={investimento} aoMudar={setInvestimento} />
          </div>
          <button type="button" onClick={liberar} disabled={!ok} className="btn-cp mt-4 w-full">
            <ArrowDownToLine className="h-4 w-4" />
            Baixar o guia
          </button>
          <p className="mt-2.5 text-[11px] leading-snug text-muted-foreground">
            Deixe o seu contato para baixar. Usamos para falar com você sobre o
            assunto do guia — nada de spam.
          </p>
        </div>
      ) : (
        // `mt-auto` no invólucro: com textos de tamanhos diferentes, os botões
        // dos cartões vizinhos ficam na mesma altura.
        <div className="mt-auto pt-4">
          <button
            type="button"
            onClick={() => (jaIdentificado ? baixar() : setAberto(true))}
            className="btn-petroleo w-full"
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
        </div>
      )}
    </div>
  );
}
