"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUp, Loader2, Lock, RotateCcw, Sparkles } from "lucide-react";

/**
 * A conversa com a Íris.
 *
 * DUAS DECISÕES QUE MOLDAM A TELA:
 *
 * 1. **Precisa de conta.** Cada mensagem custa dinheiro na conta da OpenAI, e
 *    um chat aberto na internet é cota queimada por robô num fim de semana.
 *    Mas em vez de mostrar um cadeado seco, a caixa fica visível e convidativa
 *    — a pessoa lê as sugestões, entende o que a Íris faz, e o convite para
 *    criar conta aparece no lugar do botão de enviar. O teste grátis começa
 *    junto, então o custo do cadastro é zero para ela.
 *
 * 2. **A conversa não é salva.** Ela vive na memória da aba. Extrato e vida
 *    financeira são dados sensíveis; guardar histórico de chat exigiria uma
 *    conversa de LGPD que o produto ainda não teve. Recarregar a página limpa,
 *    e a tela diz isso.
 */

type Mensagem = { papel: "voce" | "iris"; texto: string };

const SUGESTOES = [
  "Por onde eu começo a organizar minha vida financeira?",
  "Quanto devo ter de reserva de emergência?",
  "Vale mais a pena quitar dívida ou investir?",
  "O que é CDI e por que ele aparece em tudo?",
];

const ABERTURA: Mensagem = {
  papel: "iris",
  texto:
    "Oi. Sou a Íris, a assistente da Novare. Pode perguntar sobre a sua vida financeira — de conceito solto a conta na ponta do lápis. Não indico produto nem corretora: isso é trabalho de consultor, com o seu caso na mesa.",
};

export function ConversaIris({
  /** Pergunta trazida de fora (a barra da home manda pela URL).
   *
   *  Ela NÃO é enviada na hora: espera a checagem de disponibilidade
   *  terminar, senão a mensagem entra numa conversa que ainda não sabe se
   *  pode responder — e a pessoa vê a própria pergunta cair no vazio. */
  perguntaInicial,
}: {
  perguntaInicial?: string;
} = {}) {
  const [mensagens, setMensagens] = useState<Mensagem[]>([ABERTURA]);
  const [rascunho, setRascunho] = useState("");
  const [pensando, setPensando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [estado, setEstado] = useState<"checando" | "pronta" | "login" | "off">(
    "checando",
  );

  const fimRef = useRef<HTMLDivElement>(null);
  const campoRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch("/api/iris-chat")
      .then((r) => r.json())
      .then((d) => {
        if (d?.disponivel) setEstado("pronta");
        else if (d?.precisaLogin) setEstado("login");
        else setEstado("off");
      })
      .catch(() => setEstado("off"));
  }, []);

  // A pergunta que veio da home entra sozinha, uma vez só, quando a Íris
  // fica pronta. O ref é o que garante o "uma vez": sem ele, qualquer
  // re-render que passasse por "pronta" reenviaria a mesma pergunta.
  const jaMandou = useRef(false);
  useEffect(() => {
    if (estado !== "pronta" || jaMandou.current) return;
    const texto = perguntaInicial?.trim();
    if (!texto) return;
    jaMandou.current = true;
    enviar(texto);
    // `enviar` é recriada a cada render e não pode entrar nas dependências:
    // ela dispararia o efeito de novo a cada mensagem que chega.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado, perguntaInicial]);

  // Rola para a última mensagem, mas só dentro da caixa — rolar a página
  // inteira arrancaria o leitor de onde ele estava.
  useEffect(() => {
    fimRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [mensagens, pensando]);

  /** O campo cresce com o texto, até um teto. */
  function ajustarAltura(el: HTMLTextAreaElement) {
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 132)}px`;
  }

  async function enviar(texto: string) {
    const pergunta = texto.trim();
    if (!pergunta || pensando || estado !== "pronta") return;

    setErro(null);
    setRascunho("");
    if (campoRef.current) campoRef.current.style.height = "auto";

    const historico = mensagens.filter((m) => m !== ABERTURA);
    setMensagens((atual) => [...atual, { papel: "voce", texto: pergunta }]);
    setPensando(true);

    try {
      const r = await fetch("/api/iris-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensagem: pergunta, historico }),
      });
      const d = await r.json();

      if (!r.ok || !d?.resposta) {
        setErro(d?.erro ?? "A Íris não conseguiu responder agora.");
      } else {
        setMensagens((atual) => [...atual, { papel: "iris", texto: d.resposta }]);
      }
    } catch {
      setErro("Não consegui falar com a Íris. Tente de novo em instantes.");
    } finally {
      setPensando(false);
    }
  }

  const podeEnviar = estado === "pronta" && !pensando && rascunho.trim().length > 1;

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-card">
      {/* ------------------------------------------------------- cabeçalho */}
      <div className="relative overflow-hidden bg-primary px-5 py-4 text-white sm:px-6">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(16rem 9rem at 90% -30%, hsl(190 90% 60% / 0.35), transparent 65%)",
          }}
        />
        <div className="relative flex items-center gap-3">
          <span className="palco-iris flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.14]">
            <Sparkles className="h-4.5 w-4.5 text-accent-claro" />
          </span>
          <div className="min-w-0">
            <p className="font-display text-sm font-bold">Conversar com a Íris</p>
            <p className="truncate text-2xs text-white/60">
              {pensando ? "escrevendo…" : "IA da Novare · sem comissão de ninguém"}
            </p>
          </div>

          {mensagens.length > 1 && (
            <button
              type="button"
              onClick={() => {
                setMensagens([ABERTURA]);
                setErro(null);
              }}
              className="ml-auto flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-2xs font-semibold text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            >
              <RotateCcw className="h-3 w-3" />
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* --------------------------------------------------------- conversa */}
      <div
        className="max-h-[26rem] min-h-[15rem] space-y-3.5 overflow-y-auto bg-muted/20 px-4 py-5 sm:px-6"
        role="log"
        aria-live="polite"
        aria-label="Conversa com a Íris"
      >
        {mensagens.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.papel === "voce" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                m.papel === "voce"
                  ? "rounded-br-sm bg-primary text-white"
                  : "rounded-bl-sm border border-border bg-card text-foreground"
              }`}
            >
              {m.texto}
            </div>
          </div>
        ))}

        {pensando && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm border border-border bg-card px-4 py-3">
              <span className="sr-only">A Íris está escrevendo</span>
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  aria-hidden
                  className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent"
                  style={{ animationDelay: `${i * 160}ms` }}
                />
              ))}
            </div>
          </div>
        )}

        {erro && (
          <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-3.5 py-2.5 text-xs text-destructive">
            {erro}
          </p>
        )}

        <div ref={fimRef} />
      </div>

      {/* ------------------------------------------------------- sugestões */}
      {mensagens.length === 1 && (
        <div className="flex flex-wrap gap-2 border-t border-border bg-card px-4 pt-4 sm:px-6">
          {SUGESTOES.map((s) => (
            <button
              key={s}
              type="button"
              disabled={estado !== "pronta"}
              onClick={() => void enviar(s)}
              className="rounded-full border border-border px-3 py-1.5 text-2xs font-semibold text-slate-600 transition-colors hover:border-accent hover:text-accent-strong disabled:cursor-not-allowed disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* --------------------------------------------------------- redação */}
      <div className="border-t border-border bg-card px-4 py-4 sm:px-6">
        {estado === "checando" ? (
          /* Enquanto o servidor não diz se a IA está disponível, a caixa fica
             neutra. Mostrar o campo de digitação aqui e trocá-lo pelo convite
             de conta um instante depois é um pisca-pisca que faz a tela
             parecer quebrada — e engana quem já começou a digitar. */
          <div className="h-11 animate-pulse rounded-xl bg-muted" aria-hidden />
        ) : estado === "login" ? (
          <div className="rounded-xl bg-accent-tint px-4 py-3">
            {/* Quem chegou pela barra da home tem de VER a própria pergunta
                aqui. Sem isto ela some no caminho, e a pessoa é recebida por
                um pedido de cadastro sem entender o que houve com o que
                acabou de escrever. O `proximo` leva a pergunta junto: depois
                de criar a conta, a Íris responde sozinha. */}
            {perguntaInicial?.trim() && (
              <p className="mb-3 border-b border-accent-soft/50 pb-3 text-xs text-slate-600">
                Sua pergunta está guardada:{" "}
                <span className="font-semibold text-primary">
                  “{perguntaInicial.trim()}”
                </span>
              </p>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="flex min-w-0 items-center gap-2 text-xs text-slate-600">
                <Lock className="h-3.5 w-3.5 shrink-0 text-accent-strong" />
                Crie sua conta grátis para a Íris responder.
              </p>
              <Link
                href={`/login?modo=criar&proximo=${encodeURIComponent(
                  perguntaInicial?.trim()
                    ? `/iris?p=${encodeURIComponent(perguntaInicial.trim())}`
                    : "/iris",
                )}`}
                className="shrink-0 rounded-lg bg-accent-btn px-4 py-2 text-2xs font-bold text-white transition-colors hover:bg-accent-strong"
              >
                Criar conta grátis
              </Link>
            </div>
          </div>
        ) : estado === "off" ? (
          <p className="text-center text-xs text-muted-foreground">
            A conversa com a Íris está temporariamente indisponível. A leitura
            de extrato aqui embaixo continua funcionando.
          </p>
        ) : (
          <>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void enviar(rascunho);
              }}
              className="flex items-end gap-2"
            >
              <label htmlFor="campo-iris" className="sr-only">
                Escreva sua pergunta para a Íris
              </label>
              <textarea
                id="campo-iris"
                ref={campoRef}
                rows={1}
                value={rascunho}
                disabled={estado !== "pronta"}
                placeholder="Pergunte alguma coisa sobre o seu dinheiro…"
                onChange={(e) => {
                  setRascunho(e.target.value);
                  ajustarAltura(e.target);
                }}
                onKeyDown={(e) => {
                  // Enter envia; Shift+Enter quebra linha. É o que o dedo espera
                  // de um chat, e o contrário trava quem escreve rápido.
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void enviar(rascunho);
                  }
                }}
                className="max-h-[8.25rem] min-h-[2.75rem] flex-1 resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm leading-snug outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
              />
              <button
                type="submit"
                disabled={!podeEnviar}
                aria-label="Enviar pergunta"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-btn text-white transition-all hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-40"
              >
                {pensando ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowUp className="h-4 w-4" />
                )}
              </button>
            </form>

            <p className="mt-2.5 text-2xs leading-relaxed text-muted-foreground">
              A Íris explica e organiza, mas não indica produto nem corretora —
              recomendação exige um consultor olhando o seu caso. A conversa não
              fica salva: ao recarregar a página, ela recomeça.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
