"use client";

import { useEffect, useId, useState } from "react";
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
 * Nota de 1 a 5 com um toque; depois, comentário, nome e e-mail — os três
 * OPCIONAIS (pedido do dono). Nome e e-mail vêm preenchidos se a pessoa já
 * deixou o contato em outra tela (`novare:lead`), para não pedir de novo.
 *
 * Uma nota por ferramenta neste aparelho (`novare:avaliou:<rota>`): quem já
 * avaliou vê o agradecimento, não o formulário outra vez.
 */
export function AvaliarFerramenta() {
  const rota = usePathname();
  const idComentario = useId();
  const [nota, setNota] = useState(0);
  const [sobre, setSobre] = useState(0);
  const [comentario, setComentario] = useState("");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
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
    if (!nota || estado === "enviando") return;
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
    "h-11 w-full rounded-xl border border-border bg-white px-3.5 text-sm outline-none transition-colors focus:border-accent focus:ring-4 focus:ring-accent/12";

  return (
    // `aria-label`, e não `aria-labelledby`: depois de enviar, o título some.
    <section className="mx-auto max-w-3xl px-4 pb-4 print:hidden" aria-label="Avaliação da ferramenta">
      <div className="cartao-cp p-6 sm:p-7">
        {estado === "enviado" ? (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="flex items-center gap-2.5 text-sm font-semibold text-primary">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ciano-tint text-ciano-forte">
                <Check className="h-4 w-4" strokeWidth={2.6} />
              </span>
              Obrigado pela avaliação! Ela ajuda a melhorar a ferramenta.
            </p>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event(ABRIR_MENSAGEM))}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold text-primary transition-colors hover:bg-muted"
            >
              <MessageSquareText className="h-4 w-4" />
              Mandar uma mensagem
            </button>
          </div>
        ) : (
          <form onSubmit={enviar}>
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
              <div>
                <p className="chapeu chapeu-ciano">Sua opinião</p>
                <h2 className="titulo-cp mt-1.5 text-xl">
                  Esta ferramenta te ajudou?
                </h2>
              </div>

              <div
                role="radiogroup"
                aria-label="Sua nota, de 1 a 5"
                className="flex items-center gap-1"
                onMouseLeave={() => setSobre(0)}
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={nota === n}
                    aria-label={`${n} de 5 — ${ROTULO_NOTA[n]}`}
                    title={ROTULO_NOTA[n]}
                    onClick={() => setNota(n)}
                    onMouseEnter={() => setSobre(n)}
                    onFocus={() => setSobre(n)}
                    onBlur={() => setSobre(0)}
                    className="flex h-11 w-11 items-center justify-center rounded-xl transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/20"
                  >
                    <Star
                      className={`h-7 w-7 transition-colors ${n <= mostrada ? "fill-accent text-accent" : "text-slate-300"}`}
                      strokeWidth={1.8}
                    />
                  </button>
                ))}
              </div>
            </div>

            {mostrada > 0 && (
              <p className="mt-1 text-right text-xs font-medium text-muted-foreground" aria-live="polite">
                {ROTULO_NOTA[mostrada]}
              </p>
            )}

            {nota > 0 && (
              <div className="mt-4 space-y-3">
                <div>
                  <label htmlFor={idComentario} className="mb-1 block text-2xs font-semibold text-muted-foreground">
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
                <div className="flex flex-wrap items-center gap-3">
                  <button type="submit" disabled={estado === "enviando"} className="btn-petroleo disabled:opacity-60">
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
            )}
          </form>
        )}
      </div>
    </section>
  );
}
