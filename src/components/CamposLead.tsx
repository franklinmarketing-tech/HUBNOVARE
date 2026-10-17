"use client";

import { useId, useState } from "react";

/**
 * O formulário de contato — WhatsApp obrigatório, o resto opcional.
 *
 * Antes eram três campos obrigatórios: nome, WhatsApp e e-mail. A lógica
 * fazia sentido do lado de dentro (com os três, o comercial abre a conversa
 * pelo nome e não depende de o e-mail ser lido), mas do lado de fora eram
 * três barreiras entre a pessoa e o botão — logo depois de ela ter
 * preenchido uma calculadora inteira. Formulário longo em troca de um
 * relatório gratuito é onde o lead desiste.
 *
 * Agora só o WhatsApp trava o envio, porque é o único dado sem o qual o
 * comercial não consegue trabalhar. Nome e e-mail continuam sendo pedidos —
 * numa segunda linha, marcados como opcionais — e quem quiser preencher
 * preenche. Quem não quiser, envia mesmo assim.
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
 * Dá para enviar?
 *
 * Só o WhatsApp. Nome e e-mail, quando preenchidos, precisam estar certos —
 * senão o comercial recebe "asdf" e um e-mail sem arroba —, mas em branco
 * não impedem nada.
 */
/**
 * ⚠️ O E-MAIL VIROU OBRIGATÓRIO EM 17/10/2026, e a razão é um defeito real.
 *
 * Até aqui só o telefone era exigido, e nome e e-mail ficavam escondidos
 * atrás de "Quer receber por e-mail também?". Só que `/api/lead` REJEITA com
 * 400 todo lead sem e-mail — ou seja, quem não abrisse os opcionais tinha o
 * cadastro descartado em silêncio, vendo "Recebemos!" na tela.
 *
 * Eram duas regras contraditórias no mesmo fluxo. Exigir o e-mail aqui
 * resolve a contradição do lado certo: é ele que permite cumprir o que a
 * tela promete ("enviamos o próximo passo"), e agora o e-mail de confirmação
 * existe de verdade.
 */
export const leadCompleto = (d: DadosLead) =>
  telefoneValido(d.telefone) &&
  emailValido(d.email) &&
  (d.nome.trim() === "" || nomeValido(d.nome));

/**
 * A saudação da mensagem de WhatsApp, com ou sem nome.
 *
 * Com nome vazio, `Olá! Aqui é ${nome}.` virava "Olá! Aqui é ." — e é
 * exatamente o que aconteceria agora que o nome é opcional.
 */
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
  /* ⚠️ NASCEM ABERTOS AGORA. Antes a tela mostrava só o telefone e escondia
     nome e e-mail atrás de um botão — mas o e-mail é obrigatório desde
     17/10 (ver `leadCompleto`), e campo obrigatório escondido atrás de um
     link é a receita de um formulário que não envia e ninguém entende por
     quê. O `useState` ficou para o caso de alguém querer recolher de novo. */
  const [abertos, setAbertos] = useState(true);

  const campo =
    "h-11 w-full rounded-xl border border-border bg-white px-3.5 text-[0.9375rem] outline-none transition-colors focus:border-accent focus:ring-4 focus:ring-accent/12";
  const rotulo = "mb-1 block text-2xs font-semibold text-muted-foreground";

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor={`${id}-tel`} className={rotulo}>
          WhatsApp
        </label>
        <input
          id={`${id}-tel`}
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          required
          value={dados.telefone}
          onChange={(e) =>
            aoMudar({ ...dados, telefone: formatarTelefone(e.target.value) })
          }
          placeholder="(00) 00000-0000"
          className={campo}
        />
      </div>

      {abertos ? (
        <div className={compacto ? "space-y-3" : "grid gap-3 sm:grid-cols-2"}>
          <div>
            <label htmlFor={`${id}-nome`} className={rotulo}>
              Seu nome <span className="font-normal">(opcional)</span>
            </label>
            <input
              id={`${id}-nome`}
              type="text"
              autoComplete="name"
              value={dados.nome}
              onChange={(e) => aoMudar({ ...dados, nome: e.target.value })}
              placeholder="Como podemos te chamar"
              className={campo}
            />
          </div>

          <div>
            <label htmlFor={`${id}-email`} className={rotulo}>
              E-mail <span className="font-normal">(opcional)</span>
            </label>
            <input
              id={`${id}-email`}
              type="email"
              inputMode="email"
              autoComplete="email"
              value={dados.email}
              onChange={(e) => aoMudar({ ...dados, email: e.target.value })}
              placeholder="seu@email.com"
              className={campo}
            />
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAbertos(true)}
          className="text-2xs font-semibold text-accent-strong underline-offset-2 hover:underline"
        >
          Quer receber por e-mail também? Adicionar nome e e-mail
        </button>
      )}
    </div>
  );
}
