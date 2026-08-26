import Link from "next/link";
import { ArrowRight, Check, Minus } from "lucide-react";

/**
 * As peças estruturais das páginas de venda.
 *
 * Vivem fora da página porque ela ficou longa o bastante para que ler o
 * conteúdo e ler a marcação ao mesmo tempo atrapalhe. Aqui ficam as formas;
 * lá, o argumento de venda.
 *
 * A LINGUAGEM VISUAL veio medida do site oficial da Novare
 * (diagnostico.novareapp.com.br): card branco com FITA COLORIDA no topo,
 * ícone em pastilha do tom da fita, rótulo em caixa alta com tracking largo na
 * cor da fita, e raio grande. A fita é o que dá profundidade sem sombra
 * pesada — o card parece uma ficha com marcador, não um retângulo.
 */

/**
 * O tom de cada peça. Alternar ciano e laranja pela lista é o que impede a
 * página de virar uma parede laranja: o laranja só tem força enquanto é
 * exceção.
 */
export type Tom = "ciano" | "laranja" | "navy";

const TONS: Record<Tom, { fita: string; pastilha: string; icone: string; rotulo: string }> = {
  ciano: {
    fita: "bg-ciano",
    pastilha: "bg-ciano-tint",
    icone: "text-ciano-forte",
    rotulo: "text-ciano-forte",
  },
  laranja: {
    fita: "bg-accent",
    pastilha: "bg-accent-tint",
    icone: "text-accent-strong",
    rotulo: "text-accent-strong",
  },
  navy: {
    fita: "bg-primary",
    pastilha: "bg-primary/8",
    icone: "text-primary",
    rotulo: "text-primary",
  },
};

/** Alterna ciano e laranja pela posição, para nenhuma fileira ficar monocor. */
export const tomPor = (i: number): Tom => (i % 2 === 0 ? "ciano" : "laranja");

/** Cabeçalho de seção: sobretítulo curto, título grande, uma linha de apoio. */
export function TituloSecao({
  sobre,
  titulo,
  apoio,
  centro = true,
}: {
  sobre?: string;
  titulo: React.ReactNode;
  apoio?: React.ReactNode;
  centro?: boolean;
}) {
  return (
    <div className={centro ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      {sobre && (
        <p className="text-2xs font-bold uppercase tracking-[0.18em] text-accent-strong">
          {sobre}
        </p>
      )}
      {/* Peso 600, não 800: o site oficial da casa usa títulos GRANDES e
          LEVES, e é o que dá o ar de publicação séria em vez de anúncio. */}
      <h2 className="mt-2 font-display text-3xl font-semibold leading-[1.12] tracking-tight text-primary sm:text-[2.6rem]">
        {titulo}
      </h2>
      {apoio && (
        <p className="mt-3.5 text-base leading-relaxed text-muted-foreground">
          {apoio}
        </p>
      )}
    </div>
  );
}

/**
 * Etapa numerada, no formato 01/04, com fita do tom no topo.
 *
 * O denominador é deliberado: dizer "01 de 04" desde o primeiro passo mostra
 * que o processo é curto e tem fim. Numeração solta ("01", "02") deixa a
 * pessoa sem saber quanto falta.
 */
export function Etapa({
  numero,
  total,
  titulo,
  texto,
  icone: Icone,
  tom,
}: {
  numero: number;
  total: number;
  titulo: string;
  texto: string;
  icone: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  tom?: Tom;
}) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const t = TONS[tom ?? tomPor(numero - 1)];

  return (
    <li className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-subtle transition-all hover:-translate-y-0.5 hover:shadow-card">
      <span aria-hidden className={`absolute inset-x-0 top-0 h-1 ${t.fita}`} />

      <span
        className={`flex h-12 w-12 items-center justify-center rounded-2xl ${t.pastilha} ${t.icone}`}
      >
        <Icone className="h-5 w-5" strokeWidth={1.75} />
      </span>

      <p
        className={`mt-5 text-2xs font-bold uppercase tracking-[0.14em] tabular-nums ${t.rotulo}`}
      >
        {pad(numero)} · de {pad(total)}
      </p>
      <h3 className="mt-1.5 font-display text-lg font-semibold leading-snug text-primary">
        {titulo}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{texto}</p>
    </li>
  );
}

export type LinhaComparativo = {
  criterio: string;
  sem: string | false;
  com: string | true;
};

/**
 * O comparativo em tabela.
 *
 * Duas colunas de cards escondem a comparação: a pessoa lê uma lista, depois a
 * outra, e tem de casar os itens de cabeça. Tabela põe critério a critério na
 * mesma linha — é o formato que deixa a diferença óbvia sem precisar afirmar
 * nada.
 *
 * `false` e `true` viram o traço e o certo; string vira o texto qualificado
 * (às vezes a diferença não é ter ou não ter, é o quanto).
 */
export function Comparativo({
  linhas,
  rotuloSem,
  rotuloCom,
}: {
  linhas: LinhaComparativo[];
  rotuloSem: string;
  rotuloCom: string;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-subtle">
      <table className="w-full min-w-[34rem] border-collapse text-left">
        <thead>
          <tr className="border-b border-border">
            <th className="px-5 py-4 text-2xs font-bold uppercase tracking-wider text-muted-foreground">
              O que você tem
            </th>
            <th className="w-[22%] px-4 py-4 text-center text-2xs font-bold uppercase tracking-wider text-muted-foreground">
              {rotuloSem}
            </th>
            <th className="w-[26%] bg-primary/[0.04] px-4 py-4 text-center text-2xs font-extrabold uppercase tracking-wider text-accent-strong">
              {rotuloCom}
            </th>
          </tr>
        </thead>
        <tbody>
          {linhas.map(({ criterio, sem, com }) => (
            <tr key={criterio} className="border-b border-border/60 last:border-0">
              <td className="px-5 py-3.5 text-sm font-medium text-foreground">
                {criterio}
              </td>
              <td className="px-4 py-3.5 text-center">
                {sem === false ? (
                  <Minus className="mx-auto h-4 w-4 text-slate-300" aria-label="não incluído" />
                ) : (
                  <span className="text-xs text-muted-foreground">{sem}</span>
                )}
              </td>
              <td className="bg-primary/[0.04] px-4 py-3.5 text-center">
                {com === true ? (
                  <Check className="mx-auto h-4 w-4 text-success" aria-label="incluído" />
                ) : (
                  <span className="text-xs font-semibold text-primary">{com}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Card de persona: para quem a assinatura foi feita. */
export function Persona({
  icone: Icone,
  titulo,
  texto,
  rotulo,
  tom = "ciano",
}: {
  icone: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  titulo: string;
  texto: string;
  /** Caixa alta acima do título, na cor da fita. */
  rotulo?: string;
  tom?: Tom;
}) {
  const t = TONS[tom];

  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-subtle transition-all hover:-translate-y-0.5 hover:shadow-card">
      <span aria-hidden className={`absolute inset-x-0 top-0 h-1 ${t.fita}`} />

      <span
        className={`flex h-12 w-12 items-center justify-center rounded-2xl ${t.pastilha} ${t.icone}`}
      >
        <Icone className="h-5 w-5" strokeWidth={1.75} />
      </span>

      {rotulo && (
        <p className={`mt-5 text-2xs font-bold uppercase tracking-[0.14em] ${t.rotulo}`}>
          {rotulo}
        </p>
      )}
      <h3
        className={`font-display text-lg font-semibold leading-snug text-primary ${rotulo ? "mt-1.5" : "mt-5"}`}
      >
        {titulo}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{texto}</p>
    </article>
  );
}

/** Link discreto com seta, usado no fim das seções. */
export function LinkSecao({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-1.5 text-sm font-bold text-accent-strong"
    >
      {children}
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

/**
 * Pilar de credibilidade: um número/afirmação grande com a explicação embaixo.
 *
 * Diferente do card de persona — ali o objetivo é a pessoa se reconhecer; aqui
 * é provar uma coisa sobre a casa. Por isso o destaque é a afirmação, e a
 * fita fica na lateral em vez do topo: sinaliza sem competir com o número.
 */
export function Pilar({
  destaque,
  titulo,
  texto,
  tom = "ciano",
}: {
  destaque: string;
  titulo: string;
  texto: string;
  tom?: Tom;
}) {
  const t = TONS[tom];

  return (
    <article className="relative h-full overflow-hidden rounded-3xl border border-border bg-card p-6 pl-7 shadow-subtle">
      <span aria-hidden className={`absolute inset-y-0 left-0 w-1 ${t.fita}`} />
      <p className={`font-display text-3xl font-bold leading-none tracking-tight ${t.rotulo}`}>
        {destaque}
      </p>
      <h3 className="mt-3.5 font-display text-base font-semibold leading-snug text-primary">
        {titulo}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{texto}</p>
    </article>
  );
}

/**
 * Bloco de conta aberta: a matemática do argumento, passo a passo.
 *
 * Existe porque afirmar "se paga sozinho" é fácil e vale nada. Mostrar as
 * três linhas da conta deixa o leitor conferir — e quem confere e vê que bate
 * confia no resto da página.
 */
export function ContaAberta({
  linhas,
  resultado,
}: {
  linhas: { rotulo: string; valor: string; obs?: string }[];
  resultado: { rotulo: string; valor: string };
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-subtle">
      {linhas.map((l) => (
        <div
          key={l.rotulo}
          className="flex items-baseline justify-between gap-4 border-b border-border/60 px-5 py-3.5"
        >
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">{l.rotulo}</p>
            {l.obs && (
              <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                {l.obs}
              </p>
            )}
          </div>
          <span className="shrink-0 text-sm font-bold tabular-nums text-slate-600">
            {l.valor}
          </span>
        </div>
      ))}
      <div className="flex items-baseline justify-between gap-4 bg-primary/[0.04] px-5 py-4">
        <p className="text-sm font-bold text-primary">{resultado.rotulo}</p>
        <span className="font-display text-lg font-extrabold tabular-nums text-accent-strong">
          {resultado.valor}
        </span>
      </div>
    </div>
  );
}
