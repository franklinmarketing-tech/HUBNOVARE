"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BotaoHome } from "@/components/BotaoHome";
import {
  ArrowRight,
  Bot,
  LogIn,
  MessageSquareText,
  Send,
  Trash2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useArmazenado } from "@/lib/useArmazenado";

/**
 * Consultor Financeiro IA.
 *
 * Chat REAL: chama a edge function `vidaplan-assist` do Supabase da Novare
 * (a mesma que atende o Planejamento Financeiro em produção, com a chave de IA no
 * servidor). Exige login porque a função valida o token do usuário — e é
 * isso que protege o custo de IA de uso anônimo.
 */

interface Mensagem {
  papel: "usuario" | "iris";
  texto: string;
}

const SUGESTOES = [
  "Por onde eu começo a organizar minha vida financeira?",
  "Reserva de emergência: quanto e onde deixar?",
  "Vale a pena amortizar meu financiamento?",
  "Como sair das dívidas do cartão?",
];

export default function ConsultorPage() {
  const supabase = useMemo(() => createClient(), []);
  const [logado, setLogado] = useState<boolean | null>(null);
  const [mensagens, setMensagens, carregado] = useArmazenado<Mensagem[]>(
    "consultor",
    [],
  );
  const [texto, setTexto] = useState("");
  const [pensando, setPensando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const fimRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setLogado(!!data.session));
  }, [supabase]);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [mensagens, pensando]);

  async function enviar(pergunta: string) {
    const limpa = pergunta.trim();
    if (!limpa || pensando) return;

    setErro(null);
    setTexto("");
    setPensando(true);
    const historicoAtual = [...mensagens, { papel: "usuario" as const, texto: limpa }];
    setMensagens(historicoAtual.slice(-40));

    try {
      const { data, error } = await supabase.functions.invoke(
        "vidaplan-assist",
        {
          body: {
            pergunta: limpa,
            resumo:
              "Cliente conversando pelo Novare Workspace (hub de ferramentas). Sem dados bancários conectados nesta tela.",
            historico: historicoAtual.slice(-8).map((m) => ({
              role: m.papel === "usuario" ? "user" : "assistant",
              content: m.texto,
            })),
          },
        },
      );

      if (error) throw error;

      // A função pode responder em campos diferentes conforme a versão.
      const resposta =
        (data?.resposta ?? data?.answer ?? data?.text ?? data?.message) ||
        (typeof data === "string" ? data : null);

      if (!resposta) throw new Error("resposta vazia");

      setMensagens((atual) =>
        [...atual, { papel: "iris" as const, texto: String(resposta) }].slice(-40),
      );
    } catch {
      setErro(
        "Não consegui falar com a Íris agora. Confira sua conexão e tente de novo em instantes.",
      );
      // Devolve a pergunta para o campo: o usuário não perde o que digitou.
      setTexto(limpa);
      setMensagens((atual) => atual.slice(0, -1));
    } finally {
      setPensando(false);
    }
  }

  return (
    <div className="min-h-dvh bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
          <Link href="/" aria-label="Novare, início">
            <Image
              src="/marca/logo-novare.png"
              alt="Novare"
              width={112}
              height={30}
              priority
              style={{ height: 26, width: "auto" }}
            />
          </Link>
          <div className="flex items-center gap-2.5">
          <span className="hidden text-xs font-medium text-slate-500 sm:block">
            Consultor Financeiro IA
          </span>
            <BotaoHome />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-16">
        <section className="pb-6 pt-10">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Bot className="h-3.5 w-3.5" />
            Consultor Financeiro IA
            <span className="rounded bg-warning/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-warning">
              beta
            </span>
          </div>
          <h1 className="font-display text-3xl font-bold leading-tight text-primary sm:text-[2.6rem]">
            Pergunte como se fosse para um consultor.
          </h1>
          <p className="mt-3 max-w-xl text-slate-500">
            A mesma IA que atende o Planejamento Financeiro, treinada com o jeito Novare de
            orientar: educativa, sem vender produto e sem comissão.
          </p>
        </section>

        {logado === false && (
          <section className="rounded-3xl bg-primary p-7 text-center text-white">
            <LogIn className="mx-auto h-6 w-6 text-white/80" />
            <h2 className="mt-3 font-display text-xl font-bold">
              Entre para conversar
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-white/75">
              O consultor usa a sua conta Novare para proteger o uso da IA. É o
              mesmo login do app.
            </p>
            <Link
              href="/login?proximo=/ferramentas/consultor"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-accent-btn px-6 py-2.5 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-strong"
            >
              Entrar na minha conta
              <ArrowRight className="h-4 w-4" />
            </Link>
          </section>
        )}

        {logado && (
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
              <p className="text-sm font-semibold text-slate-700">
                Conversa com a Íris
              </p>
              {carregado && mensagens.length > 0 && (
                <button
                  type="button"
                  onClick={() => setMensagens([])}
                  aria-label="Limpar conversa"
                  className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Limpar
                </button>
              )}
            </div>

            <div className="max-h-[46vh] min-h-56 space-y-3 overflow-y-auto p-5">
              {carregado && mensagens.length === 0 && (
                <div className="py-4 text-center">
                  <MessageSquareText className="mx-auto h-6 w-6 text-slate-300" />
                  <p className="mt-2 text-sm text-slate-500">
                    Comece por uma destas perguntas:
                  </p>
                  <div className="mt-3 flex flex-wrap justify-center gap-2">
                    {SUGESTOES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => enviar(s)}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 transition-colors hover:border-primary/40 hover:text-primary"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {mensagens.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.papel === "usuario" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      m.papel === "usuario"
                        ? "rounded-br-md bg-primary text-white"
                        : "rounded-bl-md bg-slate-100 text-slate-800"
                    }`}
                  >
                    {m.texto}
                  </div>
                </div>
              ))}

              {pensando && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-md bg-slate-100 px-4 py-2.5 text-sm text-slate-500">
                    Íris está pensando...
                  </div>
                </div>
              )}
              <div ref={fimRef} />
            </div>

            {erro && (
              <p className="border-t border-slate-200 bg-red-50 px-5 py-2.5 text-xs text-destructive">
                {erro}
              </p>
            )}

            <form
              className="flex items-center gap-2 border-t border-slate-200 p-3"
              onSubmit={(e) => {
                e.preventDefault();
                enviar(texto);
              }}
            >
              <input
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Escreva sua pergunta"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[0.9375rem] outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
              />
              <button
                type="submit"
                disabled={pensando || !texto.trim()}
                aria-label="Enviar pergunta"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white transition-colors hover:bg-primary-soft disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </section>
        )}

        <p className="mt-6 text-[11px] leading-relaxed text-slate-500">
          Orientação educativa, não é recomendação personalizada de
          investimento. A conversa fica somente no seu navegador.
        </p>

        <section className="mt-8 rounded-2xl bg-primary p-6 text-white">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-lg font-bold">
                Quer a Íris com seus dados de verdade?
              </h2>
              <p className="mt-1 text-sm text-white/75">
                No Workspace ela conecta seu banco e acha o dinheiro que some.
              </p>
            </div>
            <Link
              href="/assinar/workspace"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-accent-btn px-5 py-2.5 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-strong"
            >
              Ver o Workspace da Novare
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
