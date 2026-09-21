"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowRight, Check, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { salvarLead } from "@/lib/leads";

/**
 * A INSCRIÇÃO NO NOVARE NEWS.
 *
 * ═══ POR QUE NÃO É POP-UP ═════════════════════════════════════════════════
 *
 * O dono perguntou se isto precisava ser um pop-up e mandou a Nord como
 * referência ("a Nord faz isso muito bem"). Fui olhar: a Nord NÃO usa
 * pop-up. A captação dela é uma seção inline, com UM campo, repetida no
 * corpo da página em vez de interromper a leitura.
 *
 * Faz sentido além do gosto: quem chega no News está lendo. Um modal que
 * cobre o artigo no terceiro parágrafo compra o e-mail de alguns e custa a
 * visita de muitos, e o Chrome penaliza interstitial em celular.
 *
 * ═══ A SEGUNDA RODADA: "PRECISA TER MAIS VIDA E INTERAÇÃO" ═══════════════
 *
 * A primeira versão era um campo e um botão: correta e morta. O dono pediu
 * vida e interação com o cliente. O que entrou NÃO é animação de enfeite —
 * é interação com consequência:
 *
 * 1. OS ASSUNTOS SÃO ESCOLHÍVEIS, e a escolha viaja no lead
 *    (`payload.assuntos`). Quem marca "Investimentos" está dizendo o que
 *    quer ler, e isso é a diferença entre uma lista de e-mails e uma lista
 *    segmentada. São as categorias REAIS dos artigos, vindas de `FAMILIAS` —
 *    não uma lista inventada que depois não corresponde ao que se publica.
 *
 * 2. A PROVA VEM DE DADO REAL: a contagem de edições e o título da última
 *    saem de `artigosOrdenados()`, passados por quem renderiza. Dizer "já
 *    são N edições" com N escrito à mão é número que envelhece mentindo — a
 *    casa inteira evita isso (ver `CONTAGEM` em `apps.ts`).
 *
 * 3. O RESTO É RESPOSTA AO TOQUE: o campo acende ao receber foco, o botão só
 *    ganha cor quando o e-mail está válido (o formulário conversa enquanto a
 *    pessoa digita, em vez de reprovar depois do clique) e a confirmação
 *    devolve o que ela escolheu.
 *
 * ⚠️ TUDO O QUE SE MEXE ESTÁ SOB `motion-safe:`. Quem pediu menos movimento
 * no sistema recebe a mesma seção, parada — e ela continua inteira, porque
 * nenhuma informação depende do movimento para existir.
 *
 * ═══ UM CAMPO OBRIGATÓRIO, E SÓ ══════════════════════════════════════════
 *
 * ⚠️ O `CapturaLead` desta casa pede NOME, TELEFONE e E-MAIL e abre o
 * WhatsApp no fim. Está certo para quem quer FALAR com um consultor. Aqui a
 * pessoa quer LER: pedir telefone para mandar um texto semanal é cobrar caro
 * por algo barato. Os assuntos são opcionais de propósito — quem não marcar
 * nada se inscreve igual e recebe tudo.
 *
 * ⚠️ E O BOTÃO "INSCREVA-SE" DO CABEÇALHO NÃO INSCREVIA NINGUÉM: era um link
 * que abria o WhatsApp com uma frase pronta. Quem clicasse saía do site para
 * um aplicativo de mensagem sem nunca ter deixado um e-mail.
 */

const SELOS = ["100% gratuita", "Cancele quando quiser", "Sem spam"];

/**
 * Validação frouxa de propósito: exige algo@algo.algo e nada mais. Regex
 * severa reprova endereço válido (subdomínio, `+tag`), e reprovar cliente de
 * verdade para pegar erro de digitação é mau negócio — quem erra o e-mail
 * simplesmente não recebe, e isso o banco já mostra.
 */
function emailValido(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
}

export type AssuntoNews = { chave: string; rotulo: string };

export function InscreverNews({
  titulo = "O Novare News no seu e-mail",
  subtitulo = "Dinheiro explicado sem letra miúda: salário, dívida, imposto e investimento, com a ferramenta que resolve no fim de cada texto.",
  assuntos = [],
  totalEdicoes,
  ultimaEdicao,
  className = "",
}: {
  titulo?: string;
  subtitulo?: string;
  /** As categorias reais dos artigos. Vazio = a seção não mostra escolha. */
  assuntos?: AssuntoNews[];
  /** Quantas edições já saíram. Derivado, nunca escrito à mão. */
  totalEdicoes?: number;
  /** O título da última publicada, como amostra do que vem. */
  ultimaEdicao?: string;
  className?: string;
}) {
  const pathname = usePathname();
  const [email, setEmail] = useState("");
  const [escolhidos, setEscolhidos] = useState<string[]>([]);
  const [enviado, setEnviado] = useState(false);
  const [tocado, setTocado] = useState(false);
  const [focado, setFocado] = useState(false);

  const ok = emailValido(email);
  const erro = tocado && email.length > 0 && !ok;

  function alternar(chave: string) {
    setEscolhidos((atual) =>
      atual.includes(chave)
        ? atual.filter((c) => c !== chave)
        : [...atual, chave],
    );
  }

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!ok) {
      setTocado(true);
      return;
    }
    /* Otimista de propósito: `salvarLead` é best-effort e não lança. Travar a
       confirmação até o banco responder faria a pessoa esperar por uma
       gravação que, se falhar, ela não pode resolver de jeito nenhum. */
    setEnviado(true);
    salvarLead({
      email: email.trim(),
      origem: pathname,
      tipo: "newsletter",
      payload: escolhidos.length ? { assuntos: escolhidos } : undefined,
    });
  }

  const nomesEscolhidos = assuntos
    .filter((a) => escolhidos.includes(a.chave))
    .map((a) => a.rotulo);

  return (
    <section
      id="inscrever"
      aria-labelledby="inscrever-news-titulo"
      className={`relative overflow-hidden rounded-2xl bg-primary px-6 py-10 text-white sm:px-10 sm:py-12 ${className}`}
    >
      {/* O brilho que respira. É a única coisa puramente decorativa aqui, e
          por isso a primeira a sumir em prefers-reduced-motion. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full opacity-60 blur-3xl motion-safe:animate-pulse"
        style={{
          background:
            "radial-gradient(closest-side, hsl(16 80% 55% / 0.45), transparent)",
        }}
      />

      <div className="relative mx-auto flex max-w-3xl flex-col items-center text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
          <Mail className="h-5 w-5" strokeWidth={1.75} />
        </span>

        <h2
          id="inscrever-news-titulo"
          className="mt-4 font-display text-xl font-bold tracking-tight sm:text-2xl"
        >
          {titulo}
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/70">
          {subtitulo}
        </p>

        {/* A amostra do que já existe: prova que a lista tem conteúdo, e não é
            a promessa de uma newsletter que nunca sai. */}
        {ultimaEdicao && !enviado && (
          <p className="mt-5 flex max-w-xl items-start gap-2 rounded-xl bg-white/[0.07] px-4 py-3 text-left text-xs text-white/75">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning-claro" />
            <span>
              <span className="font-semibold text-white/90">
                A última que saiu:
              </span>{" "}
              {ultimaEdicao}
            </span>
          </p>
        )}

        {enviado ? (
          <div role="status" className="mt-7 w-full max-w-lg">
            <p className="flex items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-3.5 text-sm font-semibold">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-success">
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              </span>
              Pronto! Vai para {email.trim()}.
            </p>
            <p className="mt-3 text-xs text-white/65">
              {nomesEscolhidos.length
                ? `Você vai receber ${nomesEscolhidos.join(", ")} — e pode mudar quando quiser, é só responder o e-mail.`
                : "Você vai receber todos os assuntos. Para afinar, responda a primeira edição dizendo o que interessa."}
            </p>
          </div>
        ) : (
          <>
            {/* ─────────────────────────── a escolha dos assuntos ───── */}
            {assuntos.length > 0 && (
              <fieldset className="mt-7 w-full">
                <legend className="mb-3 w-full text-xs text-white/55">
                  O que você quer receber?{" "}
                  <span className="text-white/35">(opcional)</span>
                </legend>
                <div className="flex flex-wrap justify-center gap-2">
                  {assuntos.map((a) => {
                    const ativo = escolhidos.includes(a.chave);
                    return (
                      <button
                        key={a.chave}
                        type="button"
                        onClick={() => alternar(a.chave)}
                        aria-pressed={ativo}
                        className={`flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition-all motion-safe:active:scale-95 ${
                          ativo
                            ? "border-white/70 bg-white text-primary"
                            : "border-white/20 bg-white/[0.06] text-white/75 hover:border-white/40 hover:bg-white/10"
                        }`}
                      >
                        {ativo && <Check className="h-3 w-3" strokeWidth={3} />}
                        {a.rotulo}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            )}

            <form
              onSubmit={enviar}
              noValidate
              className="mt-5 flex w-full max-w-lg flex-col gap-2 sm:flex-row"
            >
              <span className="flex-1">
                <label htmlFor="inscrever-news-email" className="sr-only">
                  Seu melhor e-mail
                </label>
                <input
                  id="inscrever-news-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="Seu melhor e-mail"
                  value={email}
                  onChange={(ev) => setEmail(ev.target.value)}
                  onFocus={() => setFocado(true)}
                  onBlur={() => {
                    setFocado(false);
                    setTocado(true);
                  }}
                  aria-invalid={erro || undefined}
                  aria-describedby={erro ? "inscrever-news-erro" : undefined}
                  className={`h-12 w-full rounded-xl border bg-white/[0.07] px-4 text-sm text-white transition-all placeholder:text-white/40 focus:outline-none ${
                    erro
                      ? "border-warning-claro"
                      : focado
                        ? "border-white/50 bg-white/[0.12] ring-2 ring-white/20"
                        : "border-white/15"
                  }`}
                />
              </span>

              {/* O botão só ganha cor quando o e-mail serve: o formulário
                  conversa enquanto a pessoa digita, em vez de deixá-la clicar
                  para só então reprovar. */}
              <button
                type="submit"
                className={`flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl px-6 text-sm font-bold transition-all motion-safe:active:scale-95 ${
                  ok
                    ? "bg-accent-btn text-accent-foreground hover:bg-accent-strong"
                    : "bg-white/15 text-white/60"
                }`}
              >
                Quero receber
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            {erro && (
              <p
                id="inscrever-news-erro"
                className="mt-2 text-xs font-medium text-warning-claro"
              >
                Confira o e-mail: falta o @ ou o final (.com, .com.br).
              </p>
            )}
          </>
        )}

        <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          {SELOS.map((s) => (
            <li
              key={s}
              className="flex items-center gap-1.5 text-2xs text-white/60"
            >
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
              {s}
            </li>
          ))}
          {typeof totalEdicoes === "number" && totalEdicoes > 0 && (
            <li className="text-2xs text-white/45">
              {totalEdicoes} edições publicadas
            </li>
          )}
        </ul>
      </div>
    </section>
  );
}
