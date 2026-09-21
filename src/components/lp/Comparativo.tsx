import Image from "next/image";
import { Check, Minus } from "lucide-react";

import {
  COMPARATIVO,
  COMPARATIVO_COLUNAS,
  COMPARATIVO_RODAPE,
} from "@/lib/hub-lp";

/**
 * A matriz de comparação.
 *
 * O Richard chama isto de "a sua tabela Brasil × Paraguai": se a página não
 * constrói a comparação, a pessoa compara o produto com NADA. As duas
 * alternativas são as reais, a planilha que ela já tentou e o app do banco.
 *
 * A coluna da marca é uma FAIXA CONTÍNUA que atravessa a tabela inteira e
 * transborda em cima e embaixo. As outras colunas têm um respiro de 3px
 * entre as linhas; a faixa não tem nenhum, e é esse detalhe que a faz ler
 * como um bloco sólido em vez de mais uma coluna colorida.
 *
 * ┌── AS LINHAS QUE A CASA PERDE ────────────────────────────────────────┐
 * │ `COMPARATIVO[].vence` marca quem ganha a linha, e as três últimas    │
 * │ não são nossas: a planilha é infinitamente flexível e é de graça, e  │
 * │ o app do banco vê o que saiu da conta sem ninguém digitar.           │
 * │                                                                       │
 * │ Elas ficam na tabela, e ficam MARCADAS: o visto verde vai para a     │
 * │ coluna vencedora e a faixa navy perde o peso naquela linha. Uma      │
 * │ tabela em que a marca ganha doze de doze não é comparação, é         │
 * │ folheto, e o leitor percebe isso antes da terceira linha.            │
 * └───────────────────────────────────────────────────────────────────────┘
 */

const COL_NOVARE = 2;
const FUNDO_A = ["#f4f2ed", "#faf9f6"];
const FUNDO_B = ["#f1f5fa", "#f8fbfd"];

export function Comparativo() {
  const linhas = COMPARATIVO.length;
  const celula =
    "flex items-center px-5 py-5 text-[1.1875rem] leading-snug tracking-[-0.012em] sm:px-7";

  return (
    <>
      {/* No celular a tabela de 940px virava um carrossel lateral onde a
          coluna da marca aparecia cortada ao meio. Aqui cada critério vira
          um cartão com as três respostas empilhadas: nada para arrastar, e
          a resposta da casa é sempre a primeira que o olho encontra. */}
      <ul className="mt-10 space-y-3 text-left lg:hidden">
        {COMPARATIVO.map((l) => {
          const perdemos = Boolean(l.vence);
          const venceu = (coluna: "planilha" | "banco") =>
            l.vence === coluna || l.vence === "ambos";
          return (
            <li
              key={l.criterio}
              className="overflow-hidden rounded-[22px] border border-[#e8e4dc] bg-[#fdfcfa]"
            >
              <p className="px-5 pb-3 pt-5 text-[1.0625rem] font-semibold leading-snug tracking-[-0.018em] text-[#0a1521]">
                {l.criterio}
              </p>
              <div
                className="mx-2 flex items-start gap-2.5 rounded-[16px] px-3.5 py-3"
                style={{ background: "linear-gradient(180deg,#1b3555 0%,#0b1626 100%)" }}
              >
                {perdemos ? (
                  <Minus className="mt-1 h-4 w-4 shrink-0 text-white/45" strokeWidth={3} aria-hidden />
                ) : (
                  <Check className="mt-1 h-4 w-4 shrink-0 text-[#6dc6e6]" strokeWidth={3} aria-hidden />
                )}
                <p className={`text-[0.9375rem] leading-snug tracking-[-0.012em] ${perdemos ? "text-white/70" : "font-semibold text-white"}`}>
                  <span className="mb-0.5 block text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-[#6dc6e6]">
                    {COMPARATIVO_COLUNAS.novare.titulo}
                  </span>
                  {l.novare}
                </p>
              </div>
              <dl className="grid grid-cols-2 gap-px px-2 pb-2 pt-2">
                {(["planilha", "banco"] as const).map((chave) => (
                  <div key={chave} className="rounded-[14px] px-3 py-2.5" style={{ background: chave === "planilha" ? FUNDO_A[0] : FUNDO_B[0] }}>
                    <dt className="text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-[#5b6d81]">
                      {chave === "planilha" ? "Planilha" : "App do banco"}
                    </dt>
                    <dd className={`mt-1 flex items-start gap-1.5 text-[0.875rem] leading-snug tracking-[-0.01em] ${venceu(chave) ? "font-semibold text-[#0a1521]" : "text-[#5b6d81]"}`}>
                      {venceu(chave) && (
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#1f7a4d]" strokeWidth={3} aria-hidden />
                      )}
                      <span>{l[chave]}</span>
                    </dd>
                  </div>
                ))}
              </dl>
            </li>
          );
        })}
      </ul>

      <div
        tabIndex={0}
        role="region"
        aria-label="Comparativo entre o Workspace Novare e as alternativas"
        className="nv-rolagem-x mt-10 hidden py-8 lg:block"
      >
        <div
          className="grid min-w-[940px]"
          style={{ gridTemplateColumns: "1fr 1.3fr 1.2fr 1.05fr", rowGap: 3 }}
        >
          <div
            aria-hidden
            className="relative -my-[26px] rounded-[22px]"
            style={{
              gridColumn: COL_NOVARE,
              gridRow: `1 / ${linhas + 2}`,
              background:
                "radial-gradient(32rem 20rem at 50% -18%, rgba(37,150,190,0.34), transparent 65%), linear-gradient(180deg,#1b3555 0%,#0b1626 100%)",
              boxShadow: "0 30px 70px -34px rgba(10,21,33,0.7)",
            }}
          />

          <div style={{ gridColumn: 1, gridRow: 1 }} />

          <div
            className="relative flex flex-col items-center justify-end px-5 pb-7 pt-9"
            style={{ gridColumn: COL_NOVARE, gridRow: 1 }}
          >
            <Image
              src="/lp/novare-logo-branca.png"
              alt="Novare"
              width={700}
              height={200}
              className="h-7 w-auto"
            />
            <span className="nv-chapeu mt-3 text-[#6dc6e6]">
              {COMPARATIVO_COLUNAS.novare.titulo}
            </span>
          </div>

          {(["planilha", "banco"] as const).map((chave, i) => (
            <div
              key={chave}
              className="flex items-end justify-center px-5 pb-7 pt-9 text-center"
              style={{ gridColumn: 3 + i, gridRow: 1 }}
            >
              <p className="nv-h4 !text-[1.1875rem]">
                {COMPARATIVO_COLUNAS[chave].titulo}
                <br />
                <span className="text-[1.1875rem] font-normal text-[#5b6d81]">
                  {COMPARATIVO_COLUNAS[chave].legenda}
                </span>
              </p>
            </div>
          ))}

          {COMPARATIVO.map((l, i) => {
            const linha = i + 2;
            const par = i % 2;
            const primeira = i === 0;
            const ultima = i === linhas - 1;

            /* `vence` ausente = a linha é nossa. */
            const perdemos = Boolean(l.vence);
            const venceu = (coluna: "planilha" | "banco") =>
              l.vence === coluna || l.vence === "ambos";

            return (
              <div key={l.criterio} className="contents">
                <div
                  className={`${celula} font-semibold text-[#0a1521]`}
                  style={{
                    gridColumn: 1,
                    gridRow: linha,
                    background: par ? "#ece8e0" : "#f2efe9",
                    borderTopLeftRadius: primeira ? 20 : undefined,
                    borderBottomLeftRadius: ultima ? 20 : undefined,
                  }}
                >
                  {l.criterio}
                </div>

                <div
                  className={`${celula} relative gap-2.5 ${
                    perdemos
                      ? "font-medium text-white/60"
                      : "font-semibold text-white"
                  }`}
                  style={{ gridColumn: COL_NOVARE, gridRow: linha }}
                >
                  {perdemos ? (
                    <Minus
                      className="h-4 w-4 shrink-0 text-white/45"
                      strokeWidth={3}
                      aria-hidden
                    />
                  ) : (
                    <Check
                      className="h-4 w-4 shrink-0 text-[#6dc6e6]"
                      strokeWidth={3}
                      aria-hidden
                    />
                  )}
                  {l.novare}
                </div>

                <div
                  className={`${celula} gap-2.5 ${
                    venceu("planilha")
                      ? "font-semibold text-[#0a1521]"
                      : "text-[#5b6d81]"
                  }`}
                  style={{ gridColumn: 3, gridRow: linha, background: FUNDO_A[par] }}
                >
                  {venceu("planilha") && (
                    <Check
                      className="h-4 w-4 shrink-0 text-[#1f7a4d]"
                      strokeWidth={3}
                      aria-hidden
                    />
                  )}
                  {l.planilha}
                </div>

                <div
                  className={`${celula} gap-2.5 ${
                    venceu("banco")
                      ? "font-semibold text-[#0a1521]"
                      : "text-[#5b6d81]"
                  }`}
                  style={{
                    gridColumn: 4,
                    gridRow: linha,
                    background: FUNDO_B[par],
                    borderTopRightRadius: primeira ? 20 : undefined,
                    borderBottomRightRadius: ultima ? 20 : undefined,
                  }}
                >
                  {venceu("banco") && (
                    <Check
                      className="h-4 w-4 shrink-0 text-[#1f7a4d]"
                      strokeWidth={3}
                      aria-hidden
                    />
                  )}
                  {l.banco}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="mx-auto mt-8 max-w-3xl text-[1.1875rem] leading-relaxed tracking-[-0.008em] text-[#5b6d81]">
        {COMPARATIVO_RODAPE}
      </p>
    </>
  );
}
