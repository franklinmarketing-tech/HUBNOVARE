"use client";

import { useEffect, useState } from "react";
import { BellRing, Check, Loader2 } from "lucide-react";
import {
  CamposLead,
  contatoParcial,
  leadCompleto,
  primeiroNomeLead,
  type DadosLead,
} from "@/components/CamposLead";
import { salvarLead, type ResultadoLead } from "@/lib/leads";
import { faseBlack } from "@/lib/novarecash/config";

/**
 * A LISTA VIP — o que a página oferece enquanto o NovareCash não tem preço.
 *
 * Nome, e-mail e WhatsApp obrigatórios (o mesmo `CamposLead` dos eBooks e do
 * PDF das ferramentas), gravados por `/api/lead` com `tipo: "novarecash"`.
 *
 * ⚠️ A FRASE DE SUCESSO DEPENDE DO QUE O SERVIDOR DISSE (`gravado`): comemorar
 * um lead que não entrou no banco foi o defeito que fez a rota passar a
 * devolver o resultado, em 17/10/2026.
 */
export function ListaVip() {
  const [dados, setDados] = useState<DadosLead>({ nome: "", telefone: "", email: "" });
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoLead | null>(null);
  const ok = leadCompleto(dados, true);

  // Pré-preenche com o contato já deixado neste aparelho, se houver.
  useEffect(() => setDados(contatoParcial()), []);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    if (!ok || enviando) return;
    setEnviando(true);
    const r = await salvarLead({
      email: dados.email,
      nome: dados.nome.trim(),
      telefone: dados.telefone,
      origem: "/novarecash",
      tipo: "novarecash",
      payload: { produto: "NovareCash", fase: faseBlack() },
    });
    if (r.gravado) {
      try {
        localStorage.setItem("novare:lead", JSON.stringify({ ...dados, origem: "/novarecash", ts: Date.now() }));
      } catch {}
    }
    setResultado(r);
    setEnviando(false);
  }

  if (resultado?.gravado) {
    const nome = primeiroNomeLead(dados.nome);
    return (
      <div className="rounded-[1.75rem] bg-white p-6 text-center text-foreground sm:p-8" role="status">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-ouro-tint text-ouro-forte">
          <Check className="h-6 w-6" />
        </span>
        <p className="mt-4 font-display text-xl font-semibold text-primary">
          {nome ? `${nome}, você está na Lista VIP.` : "Você está na Lista VIP."}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Quando as condições da Black Novare saírem, você fica sabendo antes, pelo e-mail e
          pelo WhatsApp que deixou.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={entrar}
      noValidate
      className="rounded-[1.75rem] bg-white p-5 text-foreground sm:p-7"
      aria-labelledby="titulo-lista-vip"
    >
      <p id="titulo-lista-vip" className="flex items-center gap-2 font-display text-lg font-semibold text-primary">
        <BellRing className="h-5 w-5 text-ouro-forte" />
        Entrar na Lista VIP
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
        Os valores ainda não saíram. Deixe o contato e seja avisado primeiro quando abrir.
      </p>
      <div className="mt-4">
        <CamposLead dados={dados} aoMudar={setDados} telefoneObrigatorio />
      </div>
      <button type="submit" disabled={!ok || enviando} className="btn-cp cta-varredura mt-5 w-full">
        {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <BellRing className="h-4 w-4" />}
        {enviando ? "Enviando…" : "Entrar na Lista VIP"}
      </button>
      {resultado && !resultado.gravado && (
        <p className="mt-3 text-2xs font-medium text-accent-strong" role="alert">
          Não conseguimos gravar agora. Tente de novo em instantes ou chame a gente no WhatsApp.
        </p>
      )}
      <p className="mt-3 text-[11px] leading-snug text-muted-foreground">
        Usamos o contato só para falar do NovareCash. Nada de spam; para sair da lista, é só pedir.
      </p>
    </form>
  );
}
