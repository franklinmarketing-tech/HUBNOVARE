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

/**
 * Tira o código do Brasil quando a pessoa digita o número completo.
 *
 * ⚠️ ISTO JÁ CORROMPEU LEAD DE VERDADE. Quem digitava "+55 19 98182-9686"
 * tinha os 13 dígitos cortados em 11 pelo `slice`, e o resultado era
 * "(55) 19981-8296": o 55 virava DDD, tudo andava uma casa e os dois
 * últimos dígitos sumiam. O comercial ligava para um número que não
 * existe — e o lead parecia perfeito na tabela, que é o pior tipo de erro.
 *
 * ⚠️ SÓ VALE PARA 12 OU 13 DÍGITOS. Número brasileiro com DDD tem 10
 * (fixo) ou 11 (celular), então 12 e 13 começando com 55 só podem ser
 * código do país + número. Com 11 dígitos o 55 é DDD de verdade — é o de
 * Santa Maria, no Rio Grande do Sul —, e mexer ali quebraria quem mora lá.
 */
function semCodigoDoPais(digitos: string): string {
  const temDDI =
    (digitos.length === 12 || digitos.length === 13) && digitos.startsWith("55");
  return temDDI ? digitos.slice(2) : digitos;
}
/** Máscara de telefone brasileiro: (19) 98861-0799 */
export function formatarTelefone(bruto: string): string {
  const d = semCodigoDoPais(bruto.replace(/\D/g, "")).slice(0, 11);
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
export function faltaNoLead(d: DadosLead, telefoneObrigatorio = false): string | null {
  if (!nomeValido(d.nome)) return "Falta o seu nome.";
  if (!emailValido(d.email)) return "Falta um e-mail válido.";
  /* Só no PDF das ferramentas (20/10/2026): o dono quer o telefone de
     todo mundo que baixa o relatório, para o Jefferson ligar. */
  if (telefoneObrigatorio && !telefoneValido(d.telefone)) return "Falta o seu WhatsApp com DDD.";
  /* O WhatsApp é opcional, mas meio número preenchido é engano, não escolha. */
  if (d.telefone.trim() !== "" && !telefoneValido(d.telefone))
    return "O WhatsApp está incompleto — apague o campo ou termine o número.";
  return null;
}

/** Dá para enviar? Nome e e-mail certos; telefone só se foi preenchido. */
export const leadCompleto = (d: DadosLead, telefoneObrigatorio = false) =>
  faltaNoLead(d, telefoneObrigatorio) === null;

/**
 * O contato já deixado neste aparelho (`novare:lead`), SÓ se estiver completo:
 * nome, e-mail e WhatsApp válidos. É a régua de "já identificado" do PDF das
 * ferramentas (`LiberarPdf`) e dos eBooks (`PortaoGuia`) — contato antigo
 * sem telefone não passa, e a pessoa revê o formulário já preenchido.
 */
/**
 * A PERGUNTA DO VALOR (pedido do dono, 21/10/2026): o PDF das ferramentas e os
 * eBooks só liberam com nome, e-mail, WhatsApp E quanto a pessoa pretende
 * investir ou já tem investido — é o que diz ao Jefferson o tamanho do caso.
 * Substituiu a "faixa de renda" opcional dos eBooks.
 */
export const FAIXAS_INVESTIMENTO = [
  "Até R$ 10 mil",
  "R$ 10 mil a R$ 50 mil",
  "R$ 50 mil a R$ 100 mil",
  "R$ 100 mil a R$ 300 mil",
  "R$ 300 mil a R$ 1 milhão",
  "Acima de R$ 1 milhão",
] as const;

export const investimentoValido = (v: string | undefined) =>
  !!v && (FAIXAS_INVESTIMENTO as readonly string[]).includes(v);

/** O campo obrigatório "quanto pretende investir ou já tem investido". */
export function CampoInvestimento({ valor, aoMudar }: { valor: string; aoMudar: (v: string) => void }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-2xs font-semibold text-muted-foreground">
        Quanto pretende investir ou já tem investido? <span className="text-accent-strong">*</span>
      </label>
      <select
        id={id}
        required
        value={valor}
        onChange={(e) => aoMudar(e.target.value)}
        className="h-11 w-full rounded-xl border border-border bg-white px-3 text-[0.9375rem] outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
      >
        <option value="">Escolha uma faixa</option>
        {FAIXAS_INVESTIMENTO.map((f) => (
          <option key={f} value={f}>
            {f}
          </option>
        ))}
      </select>
    </div>
  );
}

export function contatoSalvo(): (DadosLead & { investimento?: string }) | null {
  try {
    const bruto = localStorage.getItem("novare:lead");
    if (!bruto) return null;
    const d = JSON.parse(bruto) as Partial<DadosLead> & { investimento?: string };
    const contato = { nome: d.nome ?? "", email: d.email ?? "", telefone: d.telefone ?? "", investimento: d.investimento };
    return nomeValido(contato.nome) && emailValido(contato.email) && telefoneValido(contato.telefone)
      ? contato
      : null;
  } catch {
    return null;
  }
}

/** O que houver guardado, mesmo incompleto — para pré-preencher o formulário. */
export function contatoParcial(): DadosLead {
  try {
    const d = JSON.parse(localStorage.getItem("novare:lead") ?? "{}") as Partial<DadosLead>;
    return { nome: d.nome ?? "", email: d.email ?? "", telefone: d.telefone ?? "" };
  } catch {
    return { nome: "", email: "", telefone: "" };
  }
}

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
  telefoneObrigatorio = false,
}: {
  dados: DadosLead;
  aoMudar: (d: DadosLead) => void;
  /** Empilha os campos em vez de usar duas colunas. */
  compacto?: boolean;
  /** O WhatsApp passa a ser exigido (o PDF das ferramentas). */
  telefoneObrigatorio?: boolean;
}) {
  const id = useId();
  /* O aviso do que falta só aparece depois que a pessoa saiu de algum campo:
     dizer "falta o seu nome" num formulário que ela ainda nem tocou é
     repreender quem não fez nada. */
  const [tocado, setTocado] = useState(false);
  const falta = faltaNoLead(dados, telefoneObrigatorio);

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
          WhatsApp{" "}
          {telefoneObrigatorio ? (
            <span className="text-accent-strong">*</span>
          ) : (
            <span className="font-normal">(opcional)</span>
          )}
        </label>
        <input
          id={`${id}-tel`}
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          required={telefoneObrigatorio}
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
