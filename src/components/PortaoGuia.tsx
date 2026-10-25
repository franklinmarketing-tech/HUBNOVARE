"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowDownToLine, Check, Link2, Lock } from "lucide-react";
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
import { rotaDoPdf, type Ebook } from "@/lib/ebooks";

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
 * 3. **O PDF abre no mesmo clique.** A aba é aberta (vazia) de forma
 *    síncrona, de propósito: com um `await` antes, o navegador a bloqueia
 *    como pop-up. Ela só recebe o endereço depois que `/api/ebooks/liberar`
 *    devolve o cookie que a rota do PDF confere (21/10/2026 — os PDFs saíram
 *    de /public, ver `lib/ebooks.ts`). O lead segue em paralelo.
 *
 * Quem chega por link direto do PDF (`?liberar=<arquivo>`) cai aqui com a
 * trava deste guia já aberta, rolada até a vista e com um aviso.
 */
export function PortaoGuia({ ebook }: { ebook: Ebook }) {
  const [aberto, setAberto] = useState(false);
  const [jaIdentificado, setJaIdentificado] = useState(false);
  const [veioPorLink, setVeioPorLink] = useState(false);
  const [dados, setDados] = useState<DadosLead>({ nome: "", telefone: "", email: "" });
  const [investimento, setInvestimento] = useState("");
  const cartao = useRef<HTMLDivElement>(null);
  const ok = leadCompleto(dados, true) && investimentoValido(investimento);

  useEffect(() => {
    const ler = () => {
      const salvo = contatoSalvo();
      if (salvo && investimentoValido(salvo.investimento)) {
        setJaIdentificado(true);
        setAberto(false);
        setDados({ nome: salvo.nome, email: salvo.email, telefone: salvo.telefone });
        setInvestimento(salvo.investimento ?? "");
        return true;
      }
      setDados(contatoParcial());
      setInvestimento(salvo?.investimento ?? "");
      return false;
    };
    const identificado = ler();

    if (`/${new URLSearchParams(window.location.search).get("liberar")}` === ebook.href) {
      setVeioPorLink(true);
      if (!identificado) setAberto(true);
      cartao.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    // Deixou o contato num cartão, os outros da página liberam junto — sem
    // isto, cada cartão só lia o contato ao montar e pedia o formulário de novo.
    const aoSalvar = () => void ler();
    window.addEventListener(EVENTO_CONTATO, aoSalvar);
    return () => window.removeEventListener(EVENTO_CONTATO, aoSalvar);
  }, [ebook.href]);

  /** Abre a aba no clique e só manda o PDF depois que o servidor liberou. */
  async function abrirPdf(contato: DadosLead, renda: string) {
    const janela = window.open("", "_blank");
    if (janela) {
      janela.opener = null;
      janela.document.title = "Abrindo o guia…";
      janela.document.body.innerHTML =
        '<p style="font:15px system-ui,sans-serif;color:#334;padding:32px">Abrindo o guia…</p>';
    }
    try {
      await fetch("/api/ebooks/liberar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: contato.nome, email: contato.email, telefone: contato.telefone, investimento: renda }),
      });
    } catch {
      // Sem rede: a rota do PDF devolve para a trava, que é o certo.
    }
    if (janela) janela.location.href = rotaDoPdf(ebook);
    else window.location.href = rotaDoPdf(ebook);
  }

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
    void abrirPdf(dados, investimento);
    try {
      if (!localStorage.getItem(chaveGuia(ebook.href))) registrar(dados, investimento);
    } catch {}
  }

  function liberar() {
    if (!ok) return;
    void abrirPdf(dados, investimento);
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
    <div
      ref={cartao}
      className={`cartao-cp flex h-full scroll-mt-24 flex-col p-5 transition-all hover:-translate-y-0.5 hover:shadow-ciano ${
        veioPorLink ? "ring-2 ring-accent/60" : ""
      }`}
    >
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
          {veioPorLink && (
            <p className="mb-3 flex items-start gap-1.5 text-xs font-medium leading-snug text-accent-strong">
              <Link2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Você recebeu o link deste guia. Deixe o seu contato para abrir — leva 10 segundos.
            </p>
          )}
          <p className="text-xs font-semibold text-foreground">Para quem é o guia?</p>
          <div className="mt-3">
            <CamposLead dados={dados} aoMudar={setDados} compacto telefoneObrigatorio />
          </div>
          <div className="mt-3">
            <CampoInvestimento valor={investimento} aoMudar={setInvestimento} faltando={leadCompleto(dados, true) && !investimentoValido(investimento)} />
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
