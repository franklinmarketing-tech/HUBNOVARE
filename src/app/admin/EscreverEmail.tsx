"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, History, Loader2, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { CAMPO, Campo, Janela } from "./Janela";

/**
 * ESCREVER PARA ALGUÉM, DE DENTRO DO PAINEL.
 *
 * ⚠️ ANTES, "RESPONDER" ERA SAIR DO PAINEL. O lead aparecia com um link
 * `mailto:` que abria o programa de e-mail do computador — quando havia
 * um. No celular abria nada, e no computador de outra pessoa abria a conta
 * errada. E a mensagem não deixava rastro: o outro sócio não tinha como
 * saber que o lead já tinha sido respondido.
 *
 * Agora o e-mail sai pelo servidor (`/api/admin/mensagem`), com a resposta
 * do cliente indo para a caixa da equipe, e fica registrado.
 *
 * ⚠️ O HISTÓRICO APARECE ANTES DE ESCREVER, em cima do formulário. É a
 * pergunta que se faz antes de mandar qualquer coisa: "alguém já falou com
 * essa pessoa? o que foi dito?" — e respondê-la depois de mandar não serve
 * para nada.
 */

type Mensagem = {
  id: string;
  canal: string;
  assunto: string | null;
  corpo: string;
  criado_em: string;
  erro: string | null;
  enviado_por: string | null;
};

/** Os começos de conversa mais comuns. Só preenchem — tudo é editável.
    O nome não entra aqui: o e-mail já abre com "Fulano," pela moldura. */
const MODELOS = [
    {
      rotulo: "Primeiro contato",
      assunto: "Sobre o seu planejamento financeiro",
      texto: `Vi que você usou uma das ferramentas da Novare e queria me apresentar.\n\nSe fizer sentido, posso olhar o seu caso com calma e te dizer, sem compromisso, o que eu faria no seu lugar.\n\nQual o melhor horário para conversarmos?`,
    },
    {
      rotulo: "Agendar conversa",
      assunto: "Vamos marcar uma conversa?",
      texto: `Que bom falar com você.\n\nTenho estes horários livres esta semana: [dia e hora], [dia e hora].\n\nAlgum funciona? A conversa leva uns 30 minutos e pode ser por vídeo ou telefone.`,
    },
    {
      rotulo: "Retomar contato",
      assunto: "Ainda faz sentido conversarmos?",
      texto: `Passando para saber se ainda faz sentido conversarmos sobre o seu planejamento.\n\nSe agora não for o momento, tudo bem — é só me dizer, e eu não insisto.`,
    },
];

export function EscreverEmail({
  aberta,
  aoFechar,
  para,
  nome,
  leadId,
  usuarioId,
}: {
  aberta: boolean;
  aoFechar: () => void;
  para: string;
  nome?: string | null;
  leadId?: string | null;
  usuarioId?: string | null;
}) {
  const router = useRouter();
  const primeiro = (nome ?? "").trim().split(" ")[0] ?? "";

  const [assunto, setAssunto] = useState("");
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);
  const [historico, setHistorico] = useState<Mensagem[] | null>(null);

  const carregarHistorico = useCallback(async () => {
    const { data, error } = await createClient().rpc("hub_mensagens_de", { p_email: para });
    /* Sem o SQL rodado o histórico só não aparece — escrever continua
       funcionando. Não é motivo para travar a janela. */
    setHistorico(error ? [] : ((data as Mensagem[]) ?? []));
  }, [para]);

  useEffect(() => {
    if (!aberta) return;
    setAssunto("");
    setTexto("");
    setErro(null);
    setAviso(null);
    setEnviado(false);
    setHistorico(null);
    carregarHistorico();
  }, [aberta, carregarHistorico]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (enviando) return;
    setEnviando(true);
    setErro(null);

    try {
      const r = await fetch("/api/admin/mensagem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ para, nome, assunto, texto, leadId, usuarioId }),
      });
      const resposta = (await r.json().catch(() => ({}))) as {
        ok?: boolean;
        erro?: string;
        avisoDeRegistro?: string | null;
      };

      if (!r.ok || !resposta.ok) {
        setErro(resposta.erro ?? `Não consegui enviar (erro ${r.status}).`);
        return;
      }

      setEnviado(true);
      setAviso(resposta.avisoDeRegistro ?? null);
      carregarHistorico();
      /* A lista de trás muda: o lead passa de "novo" para "falando". */
      router.refresh();
    } catch {
      setErro("Sem conexão com o servidor. Confira a internet e tente de novo.");
    } finally {
      setEnviando(false);
    }
  }

  const pronto = assunto.trim().length >= 3 && texto.trim().length >= 5;

  return (
    <Janela
      aberta={aberta}
      aoFechar={aoFechar}
      titulo={`Escrever para ${primeiro || para}`}
      subtitulo={para}
      largura="lg"
    >
      {/* O HISTÓRICO, antes do formulário — ver o comentário do topo. */}
      <section className="mb-5">
        <p className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
          <History className="h-3.5 w-3.5" /> Já falamos com essa pessoa?
        </p>
        {historico === null ? (
          <p className="mt-2 text-xs text-muted-foreground">Conferindo…</p>
        ) : historico.length === 0 ? (
          <p className="mt-2 rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs text-muted-foreground">
            Nenhuma mensagem enviada pelo painel até agora.
          </p>
        ) : (
          <ul className="mt-2 max-h-44 space-y-2 overflow-y-auto pr-1">
            {historico.map((m) => (
              <li key={m.id} className="rounded-xl border border-border bg-slate-50/70 px-3.5 py-2.5">
                <div className="flex flex-wrap items-center gap-x-2 text-2xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{m.assunto ?? m.canal}</span>
                  <span>·</span>
                  <span>
                    {new Date(m.criado_em).toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZone: "America/Sao_Paulo",
                    })}
                  </span>
                  {m.enviado_por && (
                    <>
                      <span>·</span>
                      <span>por {m.enviado_por}</span>
                    </>
                  )}
                  {m.erro && (
                    <span className="rounded-full bg-destructive/10 px-1.5 font-semibold text-destructive">
                      não chegou
                    </span>
                  )}
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-foreground">{m.corpo}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {enviado ? (
        <div className="rounded-2xl border border-success/30 bg-success/8 p-5 text-center">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-success/15 text-success">
            <Check className="h-5 w-5" strokeWidth={2.6} />
          </span>
          <p className="mt-3 font-display text-base font-bold text-primary">E-mail enviado</p>
          <p className="mt-1 text-xs text-muted-foreground">
            A resposta de {primeiro || "da pessoa"} chega na caixa da equipe.
          </p>
          {aviso && (
            <p role="alert" className="mt-3 text-xs font-semibold text-destructive">
              {aviso}
            </p>
          )}
          <button
            type="button"
            onClick={aoFechar}
            className="mt-4 min-h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-primary-soft"
          >
            Fechar
          </button>
        </div>
      ) : (
        <form onSubmit={enviar} className="space-y-4">
          <div>
            <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
              Começar de um modelo
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {MODELOS.map((m) => (
                <button
                  key={m.rotulo}
                  type="button"
                  onClick={() => {
                    setAssunto(m.assunto);
                    setTexto(m.texto);
                  }}
                  className="min-h-9 rounded-xl border border-border bg-white px-3 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  {m.rotulo}
                </button>
              ))}
            </div>
          </div>

          <Campo rotulo="Assunto">
            <input
              value={assunto}
              onChange={(e) => setAssunto(e.target.value)}
              maxLength={200}
              className={CAMPO}
              placeholder="Sobre o seu planejamento"
            />
          </Campo>

          <Campo
            rotulo="Mensagem"
            dica={`O e-mail começa com "${primeiro || "Olá"}," e termina com a sua assinatura — não precisa escrever.`}
          >
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              rows={8}
              maxLength={8000}
              className={`${CAMPO} resize-y leading-relaxed`}
              placeholder="Escreva como escreveria no seu e-mail."
            />
          </Campo>

          {erro && (
            <p role="alert" className="flex items-start gap-2 rounded-xl bg-destructive/8 px-3.5 py-2.5 text-xs font-medium text-destructive">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {erro}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={aoFechar}
              className="min-h-11 rounded-xl border border-border px-4 text-sm font-semibold text-muted-foreground transition-colors hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!pronto || enviando}
              className="flex min-h-11 items-center gap-2 rounded-xl bg-accent-btn px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {enviando ? "Enviando…" : "Enviar e-mail"}
            </button>
          </div>
        </form>
      )}
    </Janela>
  );
}

/**
 * O link do WhatsApp com a mensagem já escrita.
 *
 * ⚠️ DDI 55 SÓ QUANDO FALTA. O telefone vem de formulário público: às
 * vezes "(19) 98861-0799", às vezes "5519988610799". Pôr 55 na frente dos
 * dois daria "555519…" no segundo, e o link abriria uma conversa com
 * ninguém.
 */
export function linkWhatsApp(telefone: string | null | undefined, nome?: string | null) {
  const d = (telefone ?? "").replace(/\D/g, "");
  if (d.length < 10) return null;
  const numero = d.length >= 12 && d.startsWith("55") ? d : `55${d}`;
  const primeiro = (nome ?? "").trim().split(" ")[0];
  const texto = `Olá${primeiro ? `, ${primeiro}` : ""}! Aqui é da Novare. Vi que você usou uma das nossas ferramentas e queria saber como posso te ajudar.`;
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
}
