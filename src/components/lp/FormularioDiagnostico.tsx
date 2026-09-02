"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Lock, MessageCircle } from "lucide-react";
import { falarNoWhatsApp } from "@/lib/contato";
import { salvarLead } from "@/lib/leads";
import { mensagemDiagnostico } from "@/lib/diagnostico-lp";
import {
  emailValido,
  formatarTelefone,
  nomeValido,
  telefoneValido,
} from "@/components/CamposLead";

/**
 * O formulário do diagnóstico, em três passos.
 *
 * POR QUE EM ETAPAS
 * A referência (print 120721) põe o formulário dentro do cartão da oferta, e
 * o pedido é de baixo compromisso. Um bloco único com nome + telefone +
 * e-mail logo de cara transforma "quero entender minha carteira" em "vou dar
 * meus dados para um vendedor" — que é exatamente a fricção a evitar.
 *
 * Então a ordem é invertida de propósito: os dois primeiros passos são sobre
 * O PATRIMÔNIO DA PESSOA, não sobre ela. Quem clicou em duas fichas já
 * investiu esforço e chega ao passo dos dados com o compromisso pago. É o
 * efeito de progresso, e é também o que dá contexto real ao consultor antes
 * da primeira conversa.
 *
 * O QUE ELE NÃO PEDE
 * Valor exato do patrimônio, CPF, número de conta. Nada disso é necessário
 * para marcar uma conversa, e pedir cedo demais é o que faz a pessoa fechar
 * a aba numa página sobre dinheiro.
 */

const ONDE = [
  "No banco onde tenho conta",
  "Em corretora",
  "Fundos e previdência",
  "Parado na poupança ou em conta",
  "Imóveis e outros ativos",
  "Prefiro falar sobre isso na conversa",
];

const INCOMODO = [
  "Não sei quanto pago de taxa",
  "Acho que estou concentrado demais",
  "Rende menos do que deveria",
  "Ninguém nunca olhou o conjunto",
  "Quero uma segunda opinião antes de decidir",
  "Tenho um valor parado e não sei por onde começar",
];

type Dados = { nome: string; telefone: string; email: string };

export function FormularioDiagnostico() {
  const [passo, setPasso] = useState(0);
  const [onde, setOnde] = useState<string[]>([]);
  const [incomodo, setIncomodo] = useState<string[]>([]);
  const [dados, setDados] = useState<Dados>({ nome: "", telefone: "", email: "" });
  const [enviado, setEnviado] = useState(false);

  const alterna = (
    valor: string,
    lista: string[],
    define: (l: string[]) => void,
  ) =>
    define(
      lista.includes(valor) ? lista.filter((v) => v !== valor) : [...lista, valor],
    );

  const dadosOk =
    nomeValido(dados.nome) && telefoneValido(dados.telefone) && emailValido(dados.email);

  const enviar = () => {
    if (!dadosOk) return;
    setEnviado(true);

    salvarLead({
      email: dados.email,
      nome: dados.nome.trim(),
      telefone: dados.telefone,
      origem: "/assinar",
      tipo: "produto",
      payload: {
        produto: "diagnostico-patrimonial",
        onde,
        incomodo,
      },
    });

    // O WhatsApp abre com a conversa já escrita: o próximo passo prometido
    // pelo botão acontece de fato, sem a pessoa ter que redigir nada.
    window.open(
      falarNoWhatsApp(mensagemDiagnostico({ ...dados, onde, incomodo })),
      "_blank",
      "noopener,noreferrer",
    );
  };

  /* ------------------------------------------------------------ sucesso -- */

  if (enviado) {
    return (
      <div className="flex min-h-[440px] flex-col justify-center px-7 py-10 text-center sm:px-10">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#e6f6ec] text-[#1f7a4d]">
          <Check className="h-8 w-8" strokeWidth={2.2} />
        </span>
        <h3 className="nv-h3 mt-6 text-[#0f1b2b]">
          Pedido registrado, {dados.nome.trim().split(" ")[0]}.
        </h3>
        <p className="nv-corpo mx-auto mt-3 max-w-sm">
          Abrimos o WhatsApp com a sua mensagem pronta — é só enviar. Um dos
          sócios responde para combinar o melhor horário e o que você precisa
          separar.
        </p>
        <a
          href={falarNoWhatsApp(mensagemDiagnostico({ ...dados, onde, incomodo }))}
          target="_blank"
          rel="noopener noreferrer"
          className="nv-btn nv-btn-navy mx-auto mt-7"
        >
          <MessageCircle className="h-4.5 w-4.5" />
          Abrir o WhatsApp de novo
        </a>
      </div>
    );
  }

  /* ------------------------------------------------------------- passos -- */

  const rotulos = ["Sua carteira", "O que incomoda", "Seus contatos"];

  return (
    <div className="flex min-h-[560px] flex-col px-6 py-7 sm:px-8 sm:py-9">
      {/* Indicador de progresso: três traços que se preenchem. Mostra que o
          formulário é curto ANTES de a pessoa começar a preencher. */}
      <div>
        <div className="flex items-center justify-between">
          <span className="nv-chapeu text-[#2596be]">
            Passo {passo + 1} de 3
          </span>
          <span className="text-[0.75rem] font-medium tracking-[-0.02em] text-[#5b6d81]">
            {rotulos[passo]}
          </span>
        </div>
        <div className="mt-3 flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors duration-500 ${
                i <= passo ? "bg-[#2596be]" : "bg-[#e4ebf2]"
              }`}
            />
          ))}
        </div>
      </div>

      {passo === 0 && (
        <div className="mt-7 flex flex-1 flex-col">
          <h3 className="text-[1.375rem] font-semibold leading-tight tracking-[-0.035em] text-[#0f1b2b]">
            Onde seu patrimônio está hoje?
          </h3>
          <p className="nv-corpo mt-2 text-[0.875rem]">
            Pode marcar mais de um. Serve só para o consultor chegar na conversa
            sabendo do que se trata.
          </p>

          <div className="mt-5 space-y-2.5">
            {ONDE.map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => alterna(o, onde, setOnde)}
                data-marcada={onde.includes(o) ? "sim" : "nao"}
                className="nv-ficha"
              >
                <span className="nv-caixa">
                  {onde.includes(o) && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                </span>
                {o}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setPasso(1)}
            className="nv-btn nv-btn-navy mt-7 w-full"
          >
            Continuar
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setPasso(1)}
            className="mx-auto mt-3 text-[0.8125rem] font-medium tracking-[-0.02em] text-[#5b6d81] underline underline-offset-4 transition-colors hover:text-[#152a44]"
          >
            Prefiro pular esta parte
          </button>
        </div>
      )}

      {passo === 1 && (
        <div className="mt-7 flex flex-1 flex-col">
          <h3 className="text-[1.375rem] font-semibold leading-tight tracking-[-0.035em] text-[#0f1b2b]">
            O que mais te incomoda hoje?
          </h3>
          <p className="nv-corpo mt-2 text-[0.875rem]">
            É por aqui que a análise começa. Marque o que estiver mais perto do
            seu caso.
          </p>

          <div className="mt-5 space-y-2.5">
            {INCOMODO.map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => alterna(o, incomodo, setIncomodo)}
                data-marcada={incomodo.includes(o) ? "sim" : "nao"}
                className="nv-ficha"
              >
                <span className="nv-caixa">
                  {incomodo.includes(o) && (
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  )}
                </span>
                {o}
              </button>
            ))}
          </div>

          <div className="mt-7 flex gap-3">
            <button
              type="button"
              onClick={() => setPasso(0)}
              aria-label="Voltar"
              className="nv-btn nv-btn-linha !px-5"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setPasso(2)}
              className="nv-btn nv-btn-navy flex-1"
            >
              Continuar
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {passo === 2 && (
        <div className="mt-7 flex flex-1 flex-col">
          <h3 className="text-[1.375rem] font-semibold leading-tight tracking-[-0.035em] text-[#0f1b2b]">
            Para onde enviamos a resposta?
          </h3>
          <p className="nv-corpo mt-2 text-[0.875rem]">
            Um dos sócios entra em contato para combinar o horário. Sem robô e
            sem fila de atendimento.
          </p>

          <div className="mt-5 space-y-3.5">
            <label className="block">
              <span className="mb-1.5 block text-[0.75rem] font-semibold tracking-[-0.01em] text-[#5b6d81]">
                Seu nome
              </span>
              <input
                type="text"
                autoComplete="name"
                value={dados.nome}
                onChange={(e) => setDados({ ...dados, nome: e.target.value })}
                placeholder="Como podemos te chamar"
                className="nv-campo"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[0.75rem] font-semibold tracking-[-0.01em] text-[#5b6d81]">
                WhatsApp
              </span>
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={dados.telefone}
                onChange={(e) =>
                  setDados({ ...dados, telefone: formatarTelefone(e.target.value) })
                }
                placeholder="(19) 98340-2827"
                className="nv-campo"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[0.75rem] font-semibold tracking-[-0.01em] text-[#5b6d81]">
                E-mail
              </span>
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                value={dados.email}
                onChange={(e) => setDados({ ...dados, email: e.target.value })}
                placeholder="voce@email.com"
                className="nv-campo"
              />
            </label>
          </div>

          <div className="mt-7 flex gap-3">
            <button
              type="button"
              onClick={() => setPasso(1)}
              aria-label="Voltar"
              className="nv-btn nv-btn-linha !px-5"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={enviar}
              disabled={!dadosOk}
              className="nv-btn nv-btn-navy flex-1 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
            >
              Solicitar meu diagnóstico
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <p className="mt-3.5 flex items-start gap-2 text-[0.75rem] leading-snug tracking-[-0.01em] text-[#5b6d81]">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Seus dados são tratados conforme a LGPD e usados só para este
            contato. Nada é compartilhado com bancos, corretoras ou terceiros.
          </p>
        </div>
      )}
    </div>
  );
}
