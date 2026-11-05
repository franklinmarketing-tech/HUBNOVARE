"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Compass, RotateCcw } from "lucide-react";
import { medir } from "@/lib/medir";
import {
  PERGUNTAS,
  recomendar,
  rotuloDe,
  type Destino,
  type OrigemQuiz,
  type Respostas,
} from "@/lib/quiz-comeco";

/**
 * "POR ONDE EU COMEÇO?" — três perguntas de um toque e a porta certa do Hub
 * (05/11/2026). A regra mora em `lib/quiz-comeco.ts`.
 *
 * O SELETOR FICA NO TOPO, a resposta embaixo (preferência do dono: filtro
 * sempre em cima, com bolinha de escolha). As três perguntas aparecem juntas
 * — é mais rápido do que um passo a passo —, e a resposta se refaz a cada
 * troca, sem botão de "enviar".
 *
 * As bolinhas são `<input type="radio">` de verdade, escondidos atrás do
 * desenho: o teclado (setas dentro do grupo), o leitor de tela e o foco vêm do
 * navegador, sem nada reinventado.
 *
 * `recolhido`: em /aplicativos o catálogo é o conteúdo da página, então o quiz
 * entra fechado numa faixa de uma linha e abre no lugar.
 */

/*
 * MEDIÇÃO ANÔNIMA pelo `medir` (`lib/medir.ts`): a combinação de respostas quando a sugestão
 * aparece ("abriu") e a porta clicada ("clicou"). Os nomes são fechados pelo tipo `ModuloQuiz`.
 * O `medir` só envia depois do aceite dos cookies, fora do localhost, e sem dado da pessoa.
 * ⚠️ "clicou" só grava depois de rodar `supabase/hub_eventos_acoes.sql` (ver `/api/uso`).
 */

export function QuizComeco({ origem, recolhido = false }: { origem: OrigemQuiz; recolhido?: boolean }) {
  const id = useId();
  const [aberto, setAberto] = useState(!recolhido);
  const [respostas, setRespostas] = useState<Partial<Respostas>>({});
  const resultadoRef = useRef<HTMLDivElement>(null);
  const ultimoRegistro = useRef("");
  const estavaCompleto = useRef(false);

  const completo = respostas.dor && respostas.tempo && respostas.situacao ? (respostas as Respostas) : null;
  const rec = completo ? recomendar(completo) : null;
  const respondidas = PERGUNTAS.filter((p) => respostas[p.chave]).length;
  const faltam = PERGUNTAS.length - respondidas;
  // A combinação vira texto para o efeito rodar só quando ELA muda, e não a cada render.
  const combinacao = completo ? `${completo.dor}|${completo.tempo}|${completo.situacao}` : "";

  useEffect(() => {
    if (!combinacao) {
      estavaCompleto.current = false;
      ultimoRegistro.current = "";
      return;
    }
    if (combinacao !== ultimoRegistro.current) {
      ultimoRegistro.current = combinacao;
      const [dor, tempo, situacao] = combinacao.split("|") as [Respostas["dor"], Respostas["tempo"], Respostas["situacao"]];
      // A porta sugerida não vai junto: a regra é determinística, sai da combinação.
      medir(`quiz-comeco:${origem}:${dor}-${tempo}-${situacao}`, "abriu");
    }
    // Só na PRIMEIRA vez que fecha as três: no celular a resposta nasce abaixo da dobra.
    if (!estavaCompleto.current) {
      estavaCompleto.current = true;
      const semMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      resultadoRef.current?.scrollIntoView({ block: "nearest", behavior: semMovimento ? "auto" : "smooth" });
    }
  }, [combinacao, origem]);

  const escolher = (chave: keyof Respostas, valor: string) =>
    setRespostas((r) => ({ ...r, [chave]: valor }) as Partial<Respostas>);

  const clicou = (destino: Destino, papel: "principal" | "alternativa") =>
    medir(`quiz-comeco:${papel}:${destino.id}`, "clicou");

  const tituloId = `${id}-titulo`;
  const corpoId = `${id}-corpo`;

  return (
    <section aria-labelledby={tituloId} className="cine cartao-cp p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="flex min-w-0 items-start gap-3">
          <span aria-hidden className="mt-0.5 hidden h-11 w-11 shrink-0 place-items-center rounded-2xl bg-ciano-tint text-ciano-forte sm:grid">
            <Compass className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="chapeu chapeu-ciano">Por onde eu começo?</p>
            <h2 id={tituloId} className="titulo-cp mt-1.5 text-xl sm:text-2xl">
              Três toques e a gente mostra a porta certa
            </h2>
            {aberto && (
              <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
                Sem cadastro, e as respostas não identificam você: é só por onde começar aqui no Hub.
              </p>
            )}
          </div>
        </div>
        {recolhido && (
          <button
            type="button"
            onClick={() => setAberto((a) => !a)}
            aria-expanded={aberto}
            aria-controls={corpoId}
            className={aberto ? "btn-claro" : "btn-petroleo"}
          >
            {aberto ? "Fechar" : "Responder 3 perguntas"}
          </button>
        )}
      </div>

      {aberto && (
        <div id={corpoId}>
          {/* O SELETOR, NO TOPO. */}
          <div className="mt-5 grid gap-4 lg:grid-cols-3 lg:gap-5">
            {PERGUNTAS.map((p, i) => (
              <fieldset key={p.chave} className="min-w-0">
                <legend className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <span aria-hidden className="grid h-6 w-6 place-items-center rounded-full bg-primary text-2xs font-semibold text-white">
                    {i + 1}
                  </span>
                  {p.titulo}
                </legend>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {p.opcoes.map((o) => (
                    <label
                      key={o.valor}
                      className="group flex min-h-11 cursor-pointer items-center gap-2.5 rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-primary transition-colors hover:border-ciano/60 has-[:checked]:border-primary has-[:checked]:bg-primary has-[:checked]:text-white has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ciano has-[:focus-visible]:ring-offset-2"
                    >
                      <input
                        type="radio"
                        name={`${id}-${p.chave}`}
                        value={o.valor}
                        checked={respostas[p.chave] === o.valor}
                        onChange={() => escolher(p.chave, o.valor)}
                        className="sr-only"
                      />
                      {/* A bolinha: anel sempre, miolo só quando marcada. */}
                      <span aria-hidden className="grid h-4 w-4 shrink-0 place-items-center rounded-full border-2 border-current">
                        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-0 transition-opacity group-has-[:checked]:opacity-100" />
                      </span>
                      {o.rotulo}
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>

          {/* Quem usa leitor de tela ouve a sugestão assim que ela muda — numa frase, não o bloco inteiro. */}
          <p className="sr-only" aria-live="polite">
            {rec ? `Sugestão: comece por ${rec.principal.nome}. Alternativa: ${rec.alternativa.nome}.` : ""}
          </p>

          {/* A RESPOSTA. */}
          <div ref={resultadoRef} className="mt-6 scroll-mt-24">
            {rec && completo ? (
              <div className="grid gap-3 lg:grid-cols-[1.35fr_1fr]">
                <div className="secao-noite sem-ondas rounded-[1.5rem] p-5 sm:p-6">
                  <p className="text-2xs font-medium text-white/75">
                    {rotuloDe("dor", completo.dor)} · {rotuloDe("tempo", completo.tempo)} · {rotuloDe("situacao", completo.situacao)}
                  </p>
                  <p className="chapeu chapeu-claro mt-3">Comece por aqui</p>
                  <h3 className="mt-1.5 font-display text-2xl font-medium tracking-[-0.03em] text-white sm:text-[1.75rem]">
                    {rec.principal.nome}
                  </h3>
                  <p className="mt-1 text-2xs font-semibold uppercase tracking-[0.14em] text-ciano-claro">{rec.principal.selo}</p>
                  <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/85">{rec.principal.porque}</p>

                  <div className="mt-4 rounded-2xl bg-white/[0.07] p-4 ring-1 ring-white/10">
                    <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-accent-claro">Próximo passo</p>
                    <p className="mt-1 text-sm leading-relaxed text-white">{rec.passo}</p>
                  </div>

                  <div className="mt-5">
                    {/* Texto curto de propósito: "Abrir Simulador de Aposentadoria" não cabe numa
                        pílula em 360 px. O nome está no título logo acima e no nome acessível. */}
                    <LinkDestino
                      destino={rec.principal}
                      onClick={() => clicou(rec.principal, "principal")}
                      className="group inline-flex items-center gap-2"
                      rotulo={`Começar agora: ${rec.principal.nome}`}
                    >
                      <span className="btn-cp">Começar agora</span>
                      <span className="btn-seta" aria-hidden>
                        {rec.principal.externo ? <ArrowUpRight className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                      </span>
                    </LinkDestino>
                  </div>
                </div>

                <div className="flex flex-col rounded-[1.5rem] border border-border bg-gelo p-5 sm:p-6">
                  <p className="chapeu">Ou, se preferir</p>
                  <h3 className="titulo-cp mt-1.5 text-xl">{rec.alternativa.nome}</h3>
                  <p className="mt-1 text-2xs font-semibold uppercase tracking-[0.14em] text-ciano-forte">{rec.alternativa.selo}</p>
                  <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{rec.alternativa.porque}</p>
                  <LinkDestino
                    destino={rec.alternativa}
                    onClick={() => clicou(rec.alternativa, "alternativa")}
                    className="mt-4 inline-flex min-h-11 w-fit items-center gap-1.5 text-sm font-semibold text-accent-strong underline-offset-4 hover:underline"
                  >
                    Ver {rec.alternativa.nome}
                    {rec.alternativa.externo ? <ArrowUpRight className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                  </LinkDestino>

                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                    <p className="max-w-xs text-2xs leading-relaxed text-muted-foreground">
                      Não é recomendação de investimento nem perfil de investidor: é só por onde começar no Hub.
                    </p>
                    <button
                      type="button"
                      onClick={() => setRespostas({})}
                      className="inline-flex min-h-11 items-center gap-1.5 text-2xs font-semibold text-primary hover:text-ciano-forte"
                    >
                      <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                      Recomeçar
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-[1.25rem] border border-dashed border-primary/20 bg-gelo px-4 py-3.5">
                <span className="flex gap-1" aria-hidden>
                  {PERGUNTAS.map((p) => (
                    <span key={p.chave} className={`h-2 w-2 rounded-full ${respostas[p.chave] ? "bg-accent" : "bg-primary/20"}`} />
                  ))}
                </span>
                <p className="text-sm text-primary/80">
                  {respondidas === 0
                    ? "Escolha uma opção em cada pergunta: a sugestão aparece aqui."
                    : `${faltam === 1 ? "Falta 1 resposta" : `Faltam ${faltam} respostas`} — a sugestão aparece aqui.`}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

/** Link interno pelo Next; o externo (Carteira Pontual) abre noutra aba, como no resto do Hub. */
function LinkDestino({
  destino,
  className,
  onClick,
  rotulo,
  children,
}: {
  destino: Destino;
  className: string;
  onClick: () => void;
  /** Nome acessível, quando o texto visível sozinho não diz para onde vai. Começa pelo texto visível. */
  rotulo?: string;
  children: React.ReactNode;
}) {
  if (destino.externo) {
    return (
      <a
        href={destino.href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClick}
        className={className}
        aria-label={rotulo ? `${rotulo} (abre em outra aba)` : undefined}
      >
        {children}
        {!rotulo && <span className="sr-only"> (abre em outra aba)</span>}
      </a>
    );
  }
  return (
    <Link href={destino.href} onClick={onClick} className={className} aria-label={rotulo}>
      {children}
    </Link>
  );
}
