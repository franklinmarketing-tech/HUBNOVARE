import Link from "next/link";
import { ArrowRight, Check, Minus } from "lucide-react";

/**
 * As peças estruturais da página de assinatura.
 *
 * Vivem fora da página porque ela ficou longa o bastante para que ler o
 * conteúdo e ler a marcação ao mesmo tempo atrapalhe. Aqui ficam as formas;
 * lá, o argumento de venda.
 */

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
        <p className="text-2xs font-bold uppercase tracking-[0.14em] text-accent-strong">
          {sobre}
        </p>
      )}
      <h2 className="mt-2 font-display text-3xl font-bold leading-tight tracking-tight text-primary sm:text-4xl">
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
 * Etapa numerada, no formato 01/04.
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
}: {
  numero: number;
  total: number;
  titulo: string;
  texto: string;
  icone: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}) {
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <li className="glass-card relative flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-subtle">
      <div className="flex items-center justify-between">
        <span className="tile-cine flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white">
          <Icone className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <span className="font-display text-xs font-bold tabular-nums text-muted-foreground">
          {pad(numero)}
          <span className="text-slate-300">/{pad(total)}</span>
        </span>
      </div>

      <h3 className="mt-5 font-display text-lg font-bold leading-snug text-primary">
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
}: {
  icone: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  titulo: string;
  texto: string;
}) {
  return (
    <article className="glass-card flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-subtle">
      <span className="tile-cine flex h-11 w-11 items-center justify-center rounded-xl bg-accent-tint text-accent-strong">
        <Icone className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <h3 className="mt-5 font-display text-base font-bold leading-snug text-primary">
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
