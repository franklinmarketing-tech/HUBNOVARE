import Image from "next/image";
import { MoveHorizontal } from "lucide-react";
import { COMPARATIVO, COMPARATIVO_COLUNAS } from "@/lib/hub-lp";

/**
 * A matriz de comparação, reconstruída a partir da referência de matriz em
 * quatro colunas.
 *
 * O QUE FAZ A COMPOSIÇÃO FUNCIONAR — e por isso não foi simplificado:
 *
 * 1. **A coluna da marca é uma FAIXA CONTÍNUA, não uma coluna de células.**
 *    As outras colunas têm um respiro branco de 3px entre as linhas; a faixa
 *    navy não tem nenhum. É esse detalhe que faz a coluna da Novare ler como
 *    um bloco sólido atravessando a tabela em vez de mais uma coluna. Ele é
 *    obtido com `row-gap` no grid e um elemento de fundo que ocupa a coluna
 *    inteira (`grid-row: 1 / -1`), passando por baixo dos vãos.
 *
 * 2. **A faixa TRANSBORDA a tabela em cima e embaixo.** Ela começa acima da
 *    linha de cabeçalho e termina abaixo da última linha. É o que dá a
 *    sensação de camada — sem isso, vira uma célula colorida.
 *
 * 3. **A coluna dos critérios não tem cabeçalho.** O canto superior esquerdo
 *    fica vazio de propósito: é o que deixa o olho começar a leitura pela
 *    faixa da marca.
 *
 * Como todas as células têm posição EXPLÍCITA no grid, a faixa pode ocupar a
 * coluna inteira sem empurrar o posicionamento automático dos vizinhos.
 */

const COL_NOVARE = 2;

/* As duas colunas de alternativa dividem a mesma família de cinza, com a
   segunda um tom mais fria: elas são o pano de fundo contra o qual a faixa
   navy tem de brilhar, e não mais duas opções concorrendo em pé de igualdade. */
const FUNDO_A = ["#f4f7fa", "#fafcfd"];
const FUNDO_B = ["#f1f5fa", "#f8fbfd"];

export function Comparativo() {
  const linhas = COMPARATIVO.length;

  const celula =
    "flex items-center px-5 py-5 text-[0.8125rem] leading-snug tracking-[-0.022em] sm:px-6 sm:text-[0.875rem]";

  return (
    <>
    {/* No celular a matriz não cabe e rola de lado. Sem este aviso, quem abre
        no telefone vê duas colunas e conclui que a comparação é só aquilo. */}
    <p className="mt-10 flex items-center gap-2 text-[0.75rem] font-medium tracking-[-0.01em] text-[#5b6d81] sm:hidden">
      <MoveHorizontal className="h-4 w-4 shrink-0 text-[#2596be]" />
      Arraste a tabela para o lado para ver as três colunas
    </p>

    <div
      tabIndex={0}
      role="region"
      aria-label="Comparativo entre o Workspace Novare e as alternativas"
      className="nv-rolagem-x -mx-5 mt-4 px-5 sm:mx-0 sm:mt-14 sm:px-0"
    >
      <div
        className="grid min-w-[760px]"
        style={{
          gridTemplateColumns: "1.02fr 1.24fr 1.16fr 1.02fr",
          rowGap: 3,
        }}
      >
        {/* A faixa navy, por baixo de tudo, cobrindo os vãos entre as linhas
            e escapando 22px para cima e para baixo. */}
        <div
          aria-hidden
          className="relative -my-[22px] rounded-[18px]"
          style={{
            gridColumn: COL_NOVARE,
            gridRow: `1 / ${linhas + 2}`,
            background:
              "radial-gradient(30rem 18rem at 50% -20%, rgba(37,150,190,0.32), transparent 65%), linear-gradient(180deg, #1b3555 0%, #101f34 100%)",
            boxShadow: "0 26px 60px -30px rgba(15,27,43,0.7)",
          }}
        />

        {/* ------------------------------------------------- cabeçalhos --- */}

        {/* O canto vazio: a leitura começa na faixa. */}
        <div style={{ gridColumn: 1, gridRow: 1 }} />

        <div
          className="relative flex flex-col items-center justify-end px-5 pb-6 pt-7"
          style={{ gridColumn: COL_NOVARE, gridRow: 1 }}
        >
          <Image
            src="/lp/novare-logo-branca.png"
            alt="Novare"
            width={700}
            height={200}
            className="h-6 w-auto"
          />
          <span className="mt-2.5 text-[0.6875rem] font-semibold uppercase tracking-[0.13em] text-[#6dc6e6]">
            {COMPARATIVO_COLUNAS.novare.legenda}
          </span>
        </div>

        {(["planilha", "banco"] as const).map((chave, i) => (
          <div
            key={chave}
            className="flex items-end justify-center px-5 pb-6 pt-7 text-center"
            style={{ gridColumn: 3 + i, gridRow: 1 }}
          >
            <p className="text-[0.9375rem] font-semibold leading-tight tracking-[-0.03em] text-[#0f1b2b] sm:text-[1.0625rem]">
              {COMPARATIVO_COLUNAS[chave].titulo}
              <br />
              {COMPARATIVO_COLUNAS[chave].legenda}
            </p>
          </div>
        ))}

        {/* ------------------------------------------------------ linhas -- */}

        {COMPARATIVO.map((l, i) => {
          const linha = i + 2;
          const par = i % 2;
          const primeira = i === 0;
          const ultima = i === linhas - 1;

          return (
            <div key={l.criterio} className="contents">
              <div
                className={`${celula} font-medium text-[#0f1b2b]`}
                style={{
                  gridColumn: 1,
                  gridRow: linha,
                  background: par ? "#e6ecf3" : "#edf1f6",
                  borderTopLeftRadius: primeira ? 16 : undefined,
                  borderBottomLeftRadius: ultima ? 16 : undefined,
                }}
              >
                {l.criterio}
              </div>

              {/* Célula transparente: quem pinta é a faixa que passa por trás. */}
              <div
                className={`${celula} relative font-semibold text-white`}
                style={{ gridColumn: COL_NOVARE, gridRow: linha }}
              >
                {l.novare}
              </div>

              <div
                className={`${celula} text-[#5b6d81]`}
                style={{
                  gridColumn: 3,
                  gridRow: linha,
                  background: FUNDO_A[par],
                }}
              >
                {l.planilha}
              </div>

              <div
                className={`${celula} text-[#5b6d81]`}
                style={{
                  gridColumn: 4,
                  gridRow: linha,
                  background: FUNDO_B[par],
                  borderTopRightRadius: primeira ? 16 : undefined,
                  borderBottomRightRadius: ultima ? 16 : undefined,
                }}
              >
                {l.banco}
              </div>
            </div>
          );
        })}
      </div>
    </div>
    </>
  );
}
