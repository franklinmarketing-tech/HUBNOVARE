"use client";

import { useId, useState } from "react";

/**
 * O formulário de contato — nome e e-mail obrigatórios, WhatsApp opcional.
 *
 * ═══ A REGRA JÁ MUDOU DUAS VEZES, E O MOTIVO IMPORTA ══════════════════════
 *
 * Começou com os três obrigatórios. Virou "só WhatsApp" para encurtar o
 * formulário — mas `/api/lead` sempre rejeitou lead sem e-mail, então quem
 * não abrisse os campos opcionais tinha o cadastro **descartado em silêncio**
 * enquanto a tela dizia "Recebemos!". Foi assim que um sócio preencheu a
 * ferramenta de orçamento e nunca recebeu nada.
 *
 * Hoje (17/10/2026) a regra é a do dono: **nome e e-mail obrigatórios,
 * WhatsApp opcional**. O e-mail é o canal que a casa controla — é ele que
 * permite cumprir o que a tela promete, e o aviso à equipe sai por ele. O
 * WhatsApp depende de a pessoa apertar enviar numa aba que o navegador pode
 * até bloquear, então não serve de barreira para ninguém.
 *
 * ⚠️ NÃO EXIGIR NOME EM `/api/lead`. A rota é a porta de várias telas, e a
 * inscrição do Novare News e a lista de espera do `/assinar` mandam **só
 * e-mail**. Endurecer lá derrubaria as duas em silêncio — o mesmo defeito,
 * com outro nome. A exigência do nome é desta tela.
 */

/** Máscara de telefone brasileiro: (19) 98861-0799 */
export function formatarTelefone(bruto: string): string {
  const d = bruto.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export const telefoneValido = (v: string) => v.replace(/\D/g, "").length >= 10;
export const emailValido = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
export const nomeValido = (v: string) => v.trim().length >= 2;

export type DadosLead = { nome: string; telefone: string; email: string };

/**
 * O que ainda falta para poder enviar — ou `null` quando está tudo certo.
 *
 * ⚠️ EXISTE PORQUE BOTÃO APAGADO NÃO EXPLICA NADA. As cinco telas que usam
 * este formulário apenas fazem `disabled={!leadCompleto(dados)}`, e o
 * resultado é alguém olhando um botão morto sem saber o que fazer — que foi
 * exatamente o que aconteceu quando o e-mail virou obrigatório mas o rótulo
 * ainda dizia "(opcional)".
 */
export function faltaNoLead(d: DadosLead): string | null {
  if (!nomeValido(d.nome)) return "Falta o seu nome.";
  if (!emailValido(d.email)) return "Falta um e-mail válido.";
  /* O WhatsApp é opcional, mas meio número preenchido é engano, não escolha. */
  if (d.telefone.trim() !== "" && !telefoneValido(d.telefone))
    return "O WhatsApp está incompleto — apague o campo ou termine o número.";
  return null;
}

/** Dá para enviar? Nome e e-mail certos; telefone só se foi preenchido. */
export const leadCompleto = (d: DadosLead) => faltaNoLead(d) === null;

/** A saudação da mensagem de WhatsApp, com ou sem nome. */
export const saudacaoLead = (nome: string) =>
  nomeValido(nome) ? `Olá! Aqui é ${nome.trim()}.` : "Olá!";

/** O primeiro nome para a tela de confirmação, ou vazio se não deram. */
export const primeiroNomeLead = (nome: string) =>
  nomeValido(nome) ? nome.trim().split(/\s+/)[0] : "";

/** A linha de e-mail da mensagem — some quando não foi preenchido. */
export const linhaEmailLead = (email: string) =>
  emailValido(email) ? `\nE-mail: ${email}` : "";

export function CamposLead({
  dados,
  aoMudar,
  compacto = false,
}: {
  dados: DadosLead;
  aoMudar: (d: DadosLead) => void;
  /** Empilha os campos em vez de usar duas colunas. */
  compacto?: boolean;
}) {
  const id = useId();
  /* O aviso do que falta só aparece depois que a pessoa saiu de algum campo:
     dizer "falta o seu nome" num formulário que ela ainda nem tocou é
     repreender quem não fez nada. */
  const [tocado, setTocado] = useState(false);
  const falta = faltaNoLead(dados);

  const campo =
    "h-11 w-full rounded-xl border border-border bg-white px-3.5 text-[0.9375rem] outline-none transition-colors focus:border-accent focus:ring-4 focus:ring-accent/12";
  const rotulo = "mb-1 block text-2xs font-semibold text-muted-foreground";

  return (
    <div className="space-y-3" onBlur={() => setTocado(true)}>
      {/* Os obrigatórios vêm primeiro: é o caminho mínimo até o botão. */}
      <div className={compacto ? "space-y-3" : "grid gap-3 sm:grid-cols-2"}>
        <div>
          <label htmlFor={`${id}-nome`} className={rotulo}>
            Seu nome <span className="text-accent-strong">*</span>
          </label>
          <input
            id={`${id}-nome`}
            type="text"
            autoComplete="name"
            required
            value={dados.nome}
            onChange={(e) => aoMudar({ ...dados, nome: e.target.value })}
            placeholder="Como podemos te chamar"
            className={campo}
          />
        </div>

        <div>
          <label htmlFor={`${id}-email`} className={rotulo}>
            E-mail <span className="text-accent-strong">*</span>
          </label>
          <input
            id={`${id}-email`}
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            value={dados.email}
            onChange={(e) => aoMudar({ ...dados, email: e.target.value })}
            placeholder="seu@email.com"
            className={campo}
          />
        </div>
      </div>

      <div>
        <label htmlFor={`${id}-tel`} className={rotulo}>
          WhatsApp <span className="font-normal">(opcional)</span>
        </label>
        <input
          id={`${id}-tel`}
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          value={dados.telefone}
          onChange={(e) =>
            aoMudar({ ...dados, telefone: formatarTelefone(e.target.value) })
          }
          placeholder="(00) 00000-0000"
          className={campo}
        />
      </div>

      {tocado && falta && (
        <p className="text-2xs font-medium text-accent-strong" role="status">
          {falta}
        </p>
      )}
    </div>
  );
}
