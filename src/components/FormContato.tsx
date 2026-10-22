"use client";

import { useEffect, useId, useState } from "react";
import { usePathname } from "next/navigation";
import { CheckCircle2, Loader2, MessageCircle, Send } from "lucide-react";
import { contatoParcial } from "@/components/CamposLead";
import { ASSUNTOS, ehEmail, LIMITE_MENSAGEM, type Assunto } from "@/lib/feedback";
import { falarNoWhatsApp } from "@/lib/contato";

/**
 * O FORMULÁRIO DO "FALE COM A GENTE" (21/10/2026). O mesmo na página
 * `/fale-conosco` e na janela do botão lateral (`BotaoMensagem`).
 *
 * Nome, e-mail, assunto e mensagem obrigatórios; WhatsApp opcional. Quem já
 * deixou o contato em outra tela encontra nome, e-mail e WhatsApp
 * preenchidos (`novare:lead`).
 *
 * O botão fica ativo sempre e, se faltar algo, diz O QUE falta — botão
 * apagado não explica nada (a mesma lição de `CamposLead`).
 */
export function FormContato({
  aoEnviar,
  compacto = false,
}: {
  aoEnviar?: () => void;
  /** Na janela do botão lateral: campos lado a lado e mensagem mais baixa, para caber sem rolar. */
  compacto?: boolean;
}) {
  const pagina = usePathname();
  const ids = { nome: useId(), email: useId(), tel: useId(), msg: useId() };
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [assunto, setAssunto] = useState<Assunto | "">("");
  const [mensagem, setMensagem] = useState("");
  const [estado, setEstado] = useState<"editando" | "enviando" | "enviado" | "erro">("editando");
  const [falta, setFalta] = useState<string | null>(null);

  useEffect(() => {
    const salvo = contatoParcial();
    setNome(salvo.nome);
    setEmail(salvo.email);
    setTelefone(salvo.telefone);
  }, []);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const faltando = !nome.trim()
      ? "o seu nome"
      : !ehEmail(email)
        ? "um e-mail válido"
        : !assunto
          ? "o assunto"
          : !mensagem.trim()
            ? "a mensagem"
            : null;
    setFalta(faltando);
    if (faltando || estado === "enviando") return;

    setEstado("enviando");
    try {
      const r = await fetch("/api/contato", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email, telefone, assunto, mensagem, pagina }),
      });
      if (!r.ok) throw new Error(String(r.status));
      setEstado("enviado");
      aoEnviar?.();
    } catch {
      setEstado("erro");
    }
  }

  if (estado === "enviado") {
    return (
      <div className="py-6 text-center" role="status">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-ciano-tint text-ciano-forte">
          <CheckCircle2 className="h-7 w-7" />
        </span>
        <p className="titulo-cp mt-4 text-xl">Mensagem enviada!</p>
        <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
          Uma pessoa da Novare vai ler e responder por e-mail{telefone ? " ou WhatsApp" : ""}. Mandamos uma
          confirmação para {email}.
        </p>
      </div>
    );
  }

  const campo =
    "h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/12";
  const rotulo = "mb-1 block text-xs font-semibold text-primary";

  return (
    <form onSubmit={enviar} noValidate className={compacto ? "space-y-3.5" : "space-y-4"}>
      <fieldset>
        <legend className={rotulo}>
          Sobre o que você quer falar? <span className="text-accent-strong">*</span>
        </legend>
        <div className={`mt-1 grid gap-2 ${compacto ? "grid-cols-2" : "sm:grid-cols-2"}`}>
          {ASSUNTOS.map((a) => {
            const ativo = assunto === a.valor;
            return (
              <label
                key={a.valor}
                className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 transition-colors ${
                  compacto ? "min-h-10 py-1.5 text-[13px]" : "min-h-11 py-2 text-sm"
                } ${ativo ? "border-primary bg-primary font-semibold text-white" : "border-slate-300 bg-white text-foreground hover:border-primary/50"}`}
              >
                <input
                  type="radio"
                  name="assunto"
                  value={a.valor}
                  checked={ativo}
                  onChange={() => setAssunto(a.valor)}
                  className="sr-only"
                />
                <span
                  aria-hidden
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${ativo ? "border-white" : "border-slate-300"}`}
                >
                  {ativo && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                </span>
                {compacto ? a.curto : a.rotulo}
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* Compacto (na janela): nome, e-mail e WhatsApp numa linha só no computador. */}
      <div className={`grid gap-3 sm:grid-cols-2 ${compacto ? "lg:grid-cols-3" : ""}`}>
        <div>
          <label htmlFor={ids.nome} className={rotulo}>
            Seu nome <span className="text-accent-strong">*</span>
          </label>
          <input id={ids.nome} value={nome} onChange={(e) => setNome(e.target.value)} maxLength={120} autoComplete="name" className={campo} />
        </div>
        <div>
          <label htmlFor={ids.email} className={rotulo}>
            E-mail <span className="text-accent-strong">*</span>
          </label>
          <input
            id={ids.email}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={200}
            autoComplete="email"
            className={campo}
          />
        </div>
        <div className={compacto ? "sm:col-span-2 lg:col-span-1" : "sm:col-span-2"}>
          <label htmlFor={ids.tel} className={rotulo}>
            WhatsApp <span className="font-normal text-muted-foreground">(opcional)</span>
          </label>
          <input
            id={ids.tel}
            type="tel"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            maxLength={40}
            autoComplete="tel"
            placeholder="(00) 00000-0000"
            className={campo}
          />
        </div>
      </div>

      <div>
        <label htmlFor={ids.msg} className={rotulo}>
          Mensagem <span className="text-accent-strong">*</span>
        </label>
        <textarea
          id={ids.msg}
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          maxLength={LIMITE_MENSAGEM}
          rows={compacto ? 3 : 5}
          placeholder="Conte em poucas linhas o que você precisa."
          className={`${campo} h-auto py-2.5`}
        />
      </div>

      {falta && (
        <p role="alert" className="text-sm font-medium text-destructive">
          Falta {falta}.
        </p>
      )}
      {estado === "erro" && (
        <p role="alert" className="text-sm font-medium text-destructive">
          Não conseguimos enviar agora. Tente de novo em instantes ou chame no WhatsApp.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={estado === "enviando"} className="btn-cp disabled:opacity-60">
          {estado === "enviando" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Enviar mensagem
        </button>
        <a
          href={falarNoWhatsApp("Olá! Vim pelo site da Novare e queria falar com vocês.")}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold text-primary transition-colors hover:bg-muted"
        >
          <MessageCircle className="h-4 w-4" />
          Prefiro o WhatsApp
        </a>
      </div>
    </form>
  );
}
