"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowRight, Check, ShieldCheck, Sparkles } from "lucide-react";
import { salvarLead } from "@/lib/leads";
import { Logo } from "@/components/Logo";
import { ConfirmacaoNews } from "@/components/ConfirmacaoNews";

/**
 * A INSCRIÇÃO NO NOVARE NEWS.
 *
 * ═══ POR QUE NÃO É POP-UP (PARA CAPTAR) ══════════════════════════════════
 *
 * O dono perguntou se isto precisava ser pop-up e mandou a Nord como
 * referência. Fui olhar: a Nord NÃO usa pop-up para captar. A captação dela
 * é uma seção inline, com UM campo, no corpo da página.
 *
 * Quem chega no News está lendo. Um modal que cobre o artigo compra o e-mail
 * de alguns e custa a visita de muitos, e o Chrome penaliza interstitial em
 * celular. O pop-up desta casa é outro: `ConfirmacaoNews`, que aparece
 * DEPOIS do sim — ver a nota longa lá.
 *
 * ═══ A TERCEIRA RODADA: "ARTE POLUÍDA, DUAS CORES, CADÊ A LOGO" ══════════
 *
 * A versão anterior era um retângulo NAVY CHAPADO com um botão laranja — o
 * dono mediu bem: duas cores brigando num bloco só, e a marca em lugar
 * nenhum. Três coisas mudaram:
 *
 * 1. O FUNDO FICOU CLARO. Um bloco escuro de largura inteira no meio de uma
 *    página clara grita mais alto que o conteúdo em volta; em cartão claro a
 *    seção convida em vez de interromper, e o navy pode voltar a ser o que
 *    ele é na identidade da casa: a cor do TEXTO, não do fundo.
 *
 * 2. A LOGO OFICIAL ENTROU no lugar do ícone de envelope genérico. Era um
 *    desenho do lucide que qualquer newsletter do mundo usa, ocupando o
 *    lugar mais nobre do bloco. Agora quem assina tem nome e rosto.
 *
 * 3. A PALETA APARECE INTEIRA, EM DOSE BAIXA: o fio superior passeia por
 *    `primary` → `accent` → `success`, os chips usam `primary-light`, o
 *    aviso usa `warning`, a confirmação usa `success`. ⚠️ O LARANJA CHEIO
 *    ficou só no botão — é o único lugar da seção onde se clica, e cor forte
 *    repetida deixa de indicar ação para virar papel de parede.
 *
 * ═══ A INTERAÇÃO, QUE É O QUE IMPORTA ════════════════════════════════════
 *
 * • OS ASSUNTOS SÃO ESCOLHÍVEIS e a escolha viaja no lead
 *   (`payload.assuntos`): a diferença entre uma lista de e-mails e uma lista
 *   segmentada. São as categorias REAIS dos artigos, vindas de `FAMILIAS`.
 *   Opcionais de propósito — quem não marca nada recebe tudo.
 * • A CONTAGEM E A AMOSTRA saem de `artigosOrdenados()`. Número de conteúdo
 *   escrito à mão é número que envelhece mentindo (ver `CONTAGEM`, em
 *   `apps.ts`).
 * • O BOTÃO SÓ GANHA COR quando o e-mail é válido: o formulário conversa
 *   enquanto a pessoa digita, em vez de deixá-la clicar para só então
 *   reprovar.
 *
 * ⚠️ TUDO O QUE SE MEXE ESTÁ SOB `motion-safe:`, e nenhuma informação
 * depende do movimento para existir.
 *
 * ⚠️ UM CAMPO OBRIGATÓRIO, E SÓ. O `CapturaLead` desta casa exige nome e
 * e-mail (e oferece o WhatsApp) — está certo para quem quer FALAR com um
 * consultor. Aqui a pessoa quer LER: pedir nome para mandar um texto semanal
 * é cobrar caro por algo barato.
 */

const SELOS = ["100% gratuita", "Não pedimos cartão", "Sem spam"];

/**
 * Validação frouxa de propósito: exige algo@algo.algo e nada mais. Regex
 * severa reprova endereço válido (subdomínio, `+tag`), e reprovar cliente de
 * verdade para pegar erro de digitação é mau negócio.
 */
function emailValido(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
}

export type AssuntoNews = { chave: string; rotulo: string };

export function InscreverNews({
  titulo = "O Novare News no seu e-mail",
  subtitulo = "Dinheiro explicado sem letra miúda — e a ferramenta que resolve, no fim de cada texto.",
  assuntos = [],
  totalEdicoes,
  ultimaEdicao,
  ultimaEdicaoHref,
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
  /** O link dela, para o CTA do pop-up de confirmação. */
  ultimaEdicaoHref?: string;
  className?: string;
}) {
  const pathname = usePathname();
  const [email, setEmail] = useState("");
  const [escolhidos, setEscolhidos] = useState<string[]>([]);
  const [enviado, setEnviado] = useState(false);
  const [tocado, setTocado] = useState(false);
  const [focado, setFocado] = useState(false);
  /* ⚠️ SEPARADO DE `enviado` de propósito: o pop-up fecha, a confirmação na
     seção FICA. Com um estado só, fechar o modal devolveria o formulário
     vazio e a pessoa acharia que a inscrição não valeu. */
  const [modal, setModal] = useState(false);

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
    setModal(true);
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
      className={`relative overflow-hidden rounded-2xl border border-border bg-card shadow-card ${className}`}
    >
      {/* O fio da paleta. É a marca aparecendo sem ocupar área: as três cores
          da casa numa faixa de 3px, em vez de um fundo inteiro de uma só. */}
      <span
        aria-hidden
        className="block h-[3px] w-full"
        style={{
          background:
            "linear-gradient(90deg, var(--color-primary) 0%, var(--color-accent) 55%, var(--color-success) 100%)",
        }}
      />

      <div className="relative px-6 py-9 sm:px-10 sm:py-11">
        {/* Um respiro de cor atrás do conteúdo, quase imperceptível — o que
            separa "card branco" de "card sem graça". */}
        <span
          aria-hidden
          className="pointer-events-none absolute -top-28 left-1/2 h-56 w-[34rem] -translate-x-1/2 rounded-full opacity-[0.07] blur-3xl"
          style={{ background: "var(--color-accent)" }}
        />

        <div className="relative mx-auto flex max-w-2xl flex-col items-center text-center">
          {/* A MARCA no lugar onde antes havia um envelope genérico. */}
          <Logo altura={26} />

          <h2
            id="inscrever-news-titulo"
            className="mt-5 font-display text-xl font-bold tracking-tight text-primary sm:text-2xl"
          >
            {titulo}
          </h2>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
            {subtitulo}
          </p>

          {/* A amostra do que já existe: prova que a lista tem conteúdo, e
              não é a promessa de uma newsletter que nunca sai. */}
          {ultimaEdicao && !enviado && (
            <p className="mt-5 flex max-w-lg items-start gap-2 rounded-xl bg-primary-light px-4 py-2.5 text-left text-xs text-primary">
              <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-strong" />
              <span>
                <span className="font-semibold">A última que saiu:</span>{" "}
                <span className="text-muted-foreground">{ultimaEdicao}</span>
              </span>
            </p>
          )}

          {enviado ? (
            <div role="status" className="mt-7 w-full max-w-lg">
              <p className="flex items-center justify-center gap-2.5 rounded-xl bg-success/10 px-4 py-3.5 text-sm font-semibold text-success-strong">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-success text-white">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </span>
                Pronto! Vai para {email.trim()}.
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                {nomesEscolhidos.length
                  ? `Você vai receber ${nomesEscolhidos.join(", ")} — e pode mudar quando quiser, é só responder o e-mail.`
                  : "Você vai receber todos os assuntos. Para afinar, responda a primeira edição dizendo o que interessa."}
              </p>
            </div>
          ) : (
            <>
              {/* ─────────────────────────── a escolha dos assuntos ───── */}
              {assuntos.length > 0 && (
                <fieldset className="mt-6 w-full">
                  <legend className="mb-2.5 w-full text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                    O que você quer receber?
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
                          className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all motion-safe:active:scale-95 ${
                            ativo
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-muted/40 text-muted-foreground hover:border-primary/30 hover:text-primary"
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
                    className={`h-12 w-full rounded-xl border bg-white px-4 text-sm text-foreground transition-all placeholder:text-muted-foreground/70 focus:outline-none ${
                      erro
                        ? "border-warning"
                        : focado
                          ? "border-primary/50 ring-2 ring-primary/15"
                          : "border-border"
                    }`}
                  />
                </span>

                {/* ⚠️ O ÚNICO LARANJA CHEIO DA SEÇÃO, e só quando o e-mail
                    serve. Cor de ação repetida deixa de indicar ação. */}
                <button
                  type="submit"
                  className={`flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl px-6 text-sm font-bold transition-all motion-safe:active:scale-95 ${
                    ok
                      ? "bg-accent-btn text-accent-foreground hover:bg-accent-strong"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  Quero receber
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>

              {erro && (
                <p
                  id="inscrever-news-erro"
                  className="mt-2 text-xs font-medium text-accent-strong"
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
                className="flex items-center gap-1.5 text-2xs text-muted-foreground"
              >
                <ShieldCheck
                  className="h-3.5 w-3.5 shrink-0 text-success"
                  strokeWidth={2}
                />
                {s}
              </li>
            ))}
            {typeof totalEdicoes === "number" && totalEdicoes > 0 && (
              <li className="text-2xs text-muted-foreground/70">
                {totalEdicoes} edições publicadas
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* O pop-up DEPOIS do sim — ver a nota em `ConfirmacaoNews`. */}
      {modal && (
        <ConfirmacaoNews
          email={email.trim()}
          assuntos={nomesEscolhidos}
          ultimaEdicao={ultimaEdicao}
          ultimaEdicaoHref={ultimaEdicaoHref}
          aoFechar={() => setModal(false)}
        />
      )}
    </section>
  );
}
