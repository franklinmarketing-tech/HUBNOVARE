"use client";

import { useEffect, useId, useState } from "react";
import Image from "next/image";
import { ArrowDownToLine, Check, Lock } from "lucide-react";
import {
  CamposLead,
  contatoParcial,
  contatoSalvo,
  leadCompleto,
  type DadosLead,
} from "@/components/CamposLead";
import { salvarLead } from "@/lib/leads";
import type { Ebook } from "@/lib/ebooks";

/** A pergunta opcional de renda (pedido do dono, 20/10/2026). */
const FAIXAS_RENDA = [
  "Até R$ 3 mil",
  "R$ 3 a 6 mil",
  "R$ 6 a 10 mil",
  "R$ 10 a 20 mil",
  "Acima de R$ 20 mil",
  "Prefiro não dizer",
];

const chaveGuia = (href: string) => `novare:guia:${href}`;
const EVENTO_CONTATO = "novare:contato-salvo";

/**
 * O portão do eBook: deixa o contato, leva o PDF.
 *
 * ⚠️ DESDE 20/10/2026 SÃO TRÊS CAMPOS OBRIGATÓRIOS — nome, e-mail e WhatsApp —
 * e VALE PARA TODO eBOOK, inclusive o material da casa, que era download
 * livre. Pedido do dono: o Jefferson liga para quem baixa. A faixa de renda é
 * opcional e vai no `payload.faixaRenda`.
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
  const idRenda = useId();
  const [aberto, setAberto] = useState(false);
  const [jaIdentificado, setJaIdentificado] = useState(false);
  const [dados, setDados] = useState<DadosLead>({ nome: "", telefone: "", email: "" });
  const [faixaRenda, setFaixaRenda] = useState("");
  const ok = leadCompleto(dados, true);

  useEffect(() => {
    const ler = () => {
      const salvo = contatoSalvo();
      if (salvo) {
        setJaIdentificado(true);
        setAberto(false);
        setDados({ nome: salvo.nome, email: salvo.email, telefone: salvo.telefone });
        setFaixaRenda(salvo.faixaRenda ?? "");
      } else {
        setDados(contatoParcial());
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
      payload: { guia: ebook.titulo, ...(renda ? { faixaRenda: renda } : {}) },
    });
    try {
      localStorage.setItem(chaveGuia(ebook.href), "1");
    } catch {}
  }

  /** Já identificado: abre o PDF e registra este guia, se for o primeiro. */
  function baixar() {
    window.open(ebook.href, "_blank", "noopener,noreferrer");
    try {
      if (!localStorage.getItem(chaveGuia(ebook.href))) registrar(dados, faixaRenda);
    } catch {}
  }

  function liberar() {
    if (!ok) return;
    window.open(ebook.href, "_blank", "noopener,noreferrer");
    registrar(dados, faixaRenda);
    try {
      localStorage.setItem(
        "novare:lead",
        JSON.stringify({ ...dados, ...(faixaRenda ? { faixaRenda } : {}), origem: "/ebooks", ts: Date.now() }),
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
            <label htmlFor={idRenda} className="mb-1 block text-2xs font-semibold text-muted-foreground">
              Faixa de renda mensal <span className="font-normal">(opcional)</span>
            </label>
            <select
              id={idRenda}
              value={faixaRenda}
              onChange={(e) => setFaixaRenda(e.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-white px-3 text-[0.9375rem] outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
            >
              <option value="">Escolha, se quiser</option>
              {FAIXAS_RENDA.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
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
