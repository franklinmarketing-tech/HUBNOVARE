"use client";

import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Check, Loader2, MessageSquareText, Star } from "lucide-react";
import { contatoParcial } from "@/components/CamposLead";
import { LIMITE_COMENTARIO, ROTULO_NOTA } from "@/lib/feedback";
import { ABRIR_MENSAGEM } from "@/components/BotaoMensagem";

const chave = (rota: string) => `novare:avaliou:${rota}`;

/**
 * "ESTA FERRAMENTA TE AJUDOU?" — no fim de toda ferramenta (pedido do dono,
 * 21/10/2026). Mora no `ferramentas/layout.tsx`: ferramenta nova já nasce
 * com avaliação, sem ninguém lembrar de colar.
 *
 * Nota de 1 a 5; comentário, nome e e-mail OPCIONAIS (pedido do dono). Nome
 * e e-mail vêm preenchidos se a pessoa já deixou o contato em outra tela
 * (`novare:lead`), para não pedir de novo.
 *
 * ⚠️ O FORMULÁRIO JÁ NASCE ABERTO (pedido do dono, mesmo dia): antes os
 * campos só apareciam depois da estrela, e a caixa passava por um rodapé.
 * Sem estrela, o envio avisa em vez de mandar uma nota vazia. A faixa escura
 * com o título é o que faz a caixa ser vista no fim de uma página longa.
 *
 * Uma nota por ferramenta neste aparelho (`novare:avaliou:<rota>`): quem já
 * avaliou vê o agradecimento, não o formulário outra vez.
 */
export function AvaliarFerramenta() {
  const rota = usePathname();
  const idComentario = useId();
  const primeiraEstrela = useRef<HTMLButtonElement>(null);
  const [nota, setNota] = useState(0);
  const [sobre, setSobre] = useState(0);
  const [comentario, setComentario] = useState("");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [semNota, setSemNota] = useState(false);
  const [estado, setEstado] = useState<"aberto" | "enviando" | "enviado" | "erro">("aberto");

  useEffect(() => {
    try {
      if (localStorage.getItem(chave(rota))) setEstado("enviado");
    } catch {}
    const salvo = contatoParcial();
    setNome(salvo.nome);
    setEmail(salvo.email);
  }, [rota]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!nota) {
      setSemNota(true);
      primeiraEstrela.current?.focus();
      return;
    }
    if (estado === "enviando") return;
    setEstado("enviando");
    try {
      const r = await fetch("/api/avaliacao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rota,
          ferramenta: document.title.split("·")[0].trim(),
          nota,
          comentario,
          nome,
          email,
        }),
      });
      if (!r.ok) throw new Error(String(r.status));
      try {
        localStorage.setItem(chave(rota), String(nota));
      } catch {}
      setEstado("enviado");
    } catch {
      setEstado("erro");
    }
  }

  const mostrada = sobre || nota;
  const ruim = nota > 0 && nota <= 2;
  const campo =
    "h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/12";

  return (
    // `aria-label`, e não `aria-labelledby`: depois de enviar, o título some.
    <section className="mx-auto max-w-3xl px-4 pb-6 print:hidden" aria-label="Avaliação da ferramenta">
      <div className="overflow-hidden rounded-[1.75rem] border-2 border-primary bg-white shadow-[0_28px_60px_-34px_hsl(199_75%_12%_/_0.7)]">
        {estado === "enviado" ? (
          <div className="flex flex-wrap items-center justify-between gap-4 p-6 sm:p-7">
            <p className="flex items-center gap-3 text-sm font-semibold text-primary sm:text-base">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                <Check className="h-5 w-5" strokeWidth={2.6} />
              </span>
              Obrigado pela avaliação! Ela ajuda a melhorar a ferramenta.
            </p>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event(ABRIR_MENSAGEM))}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-primary px-4 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
            >
              <MessageSquareText className="h-4 w-4" />
              Mandar uma mensagem
            </button>
          </div>
        ) : (
          <form onSubmit={enviar} noValidate>
            {/* A faixa escura: título e estrelas. */}
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 bg-primary px-6 py-5 text-white sm:px-7">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ciano-claro">Sua opinião</p>
                <h2 className="mt-1 font-display text-2xl font-semibold tracking-[-0.02em] sm:text-[1.7rem]">
                  Esta ferramenta te ajudou?
                </h2>
              </div>

              <div className="-ml-2 flex flex-col items-start sm:ml-0 sm:items-end">
                <div
                  role="radiogroup"
                  aria-label="Sua nota, de 1 a 5"
                  className="flex items-center gap-0.5"
                  onMouseLeave={() => setSobre(0)}
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      ref={n === 1 ? primeiraEstrela : undefined}
                      type="button"
                      role="radio"
                      aria-checked={nota === n}
                      aria-label={`${n} de 5 — ${ROTULO_NOTA[n]}`}
                      title={ROTULO_NOTA[n]}
                      onClick={() => {
                        setNota(n);
                        setSemNota(false);
                      }}
                      onMouseEnter={() => setSobre(n)}
                      onFocus={() => setSobre(n)}
                      onBlur={() => setSobre(0)}
                      className="flex h-11 w-11 items-center justify-center rounded-xl transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                    >
                      <Star
                        className={`h-7 w-7 transition-colors ${n <= mostrada ? "fill-accent text-accent" : "text-white/40"}`}
                        strokeWidth={1.8}
                      />
                    </button>
                  ))}
                </div>
                <p className="mt-0.5 min-h-4 pl-2 text-xs font-medium text-white/75 sm:pl-0" aria-live="polite">
                  {mostrada > 0 ? ROTULO_NOTA[mostrada] : "Toque numa estrela"}
                </p>
              </div>
            </div>

            <div className="space-y-3 p-6 sm:p-7">
              {semNota && (
                <p role="alert" className="text-sm font-semibold text-destructive">
                  Escolha de 1 a 5 estrelas antes de enviar.
                </p>
              )}
              <div>
                <label htmlFor={idComentario} className="mb-1 block text-xs font-semibold text-primary">
                  {ruim ? "O que não funcionou? Conte para a gente corrigir (opcional)" : "Quer contar mais? (opcional)"}
                </label>
                <textarea
                  id={idComentario}
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  maxLength={LIMITE_COMENTARIO}
                  rows={3}
                  placeholder={ruim ? "Ex.: o resultado não bateu com o do meu banco" : "Ex.: faltou um campo para…"}
                  className={`${campo} h-auto py-2.5`}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  maxLength={120}
                  autoComplete="name"
                  aria-label="Seu nome (opcional)"
                  placeholder="Seu nome (opcional)"
                  className={campo}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  maxLength={200}
                  autoComplete="email"
                  aria-label="Seu e-mail (opcional)"
                  placeholder="Seu e-mail (opcional, se quiser resposta)"
                  className={campo}
                />
              </div>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button type="submit" disabled={estado === "enviando"} className="btn-cp disabled:opacity-60">
                  {estado === "enviando" && <Loader2 className="h-4 w-4 animate-spin" />}
                  Enviar avaliação
                </button>
                {estado === "erro" && (
                  <p role="alert" className="text-sm font-medium text-destructive">
                    Não conseguimos enviar agora. Tente de novo em instantes.
                  </p>
                )}
              </div>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
