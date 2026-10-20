import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { useId } from "react";
import { InstagramLogo, LinkedinLogo, YoutubeLogo } from "@/components/LogosSociais";
import { formatarMoedaInput, digitosParaReais } from "@/lib/moeda";

/**
 * Moldura das ferramentas: topo com a marca e abertura.
 * O convite da consultoria não está aqui — ele é o rodapé comum a TODAS
 * as ferramentas, montado em `src/app/ferramentas/layout.tsx`. Nasceu com as calculadoras trabalhistas, que são seis
 * telas irmãs — repetir o mesmo cabeçalho seis vezes é como o arquivo de
 * uma some do lugar quando a outra muda.
 */
export function CascaFerramenta({
  nome,
  selo,
  titulo,
  abertura,
  children,
  fonte,
}: {
  /** Vai no canto do topo, à direita. */
  nome: string;
  selo: ReactNode;
  titulo: string;
  abertura: string;
  children: ReactNode;
  fonte?: ReactNode;
}) {
  return (
    <div className="min-h-dvh text-slate-900">
      <header className="border-b border-slate-200/70 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Duas saídas para a home: a marca (o hábito de todo site) e um
              botão escrito. Só a logo não basta — muita gente não sabe que
              ela é clicável e acaba usando o voltar do navegador. */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/marca/logo-novare.png"
                alt="Novare"
                width={112}
                height={28}
                className="h-7 w-auto"
                priority
              />
            </Link>
            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-full border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-600 transition-colors hover:border-ciano/50 hover:text-primary"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Voltar ao Workspace</span>
              <span className="sm:hidden">Início</span>
            </Link>
            {/* Redes sociais ao lado do logo — padrão aplicado em toda ferramenta. */}
            <div className="hidden shrink-0 items-center gap-2 border-l border-slate-200 pl-3 sm:flex">
              <a
                href="https://www.instagram.com/novare.invest"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Novare no Instagram"
                className="-m-1 p-1 opacity-80 transition-opacity hover:opacity-100"
              >
                <InstagramLogo className="h-4 w-4" />
              </a>
              <a
                href="https://www.youtube.com/channel/UCtfpNaHW_Jx7T7U91lXpJhQ"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Novare no YouTube"
                className="-m-1 p-1 opacity-80 transition-opacity hover:opacity-100"
              >
                <YoutubeLogo className="h-4 w-4" />
              </a>
              <a
                href="https://www.linkedin.com/in/jeffersonfreittas-sociofundadornovare/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn do Jefferson Freitas, fundador da Novare"
                className="-m-1 p-1 opacity-80 transition-opacity hover:opacity-100"
              >
                <LinkedinLogo className="h-4 w-4" />
              </a>
            </div>
          </div>
          <span className="text-xs font-medium text-slate-500 hidden sm:block">
            {nome}
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-16">
        {/* Abertura no desenho da Carteira Pontual (20/10/2026): selo em
            pílula ciano, título grande de PESO MÉDIO com a letra junta. */}
        <section className="topo-ferramenta secao-noite">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 text-ciano-claro ring-1 ring-white/15 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] mb-5">
            {selo}
          </div>
          <h1 className="text-[2rem] sm:text-[2.75rem] leading-[1.08] font-display font-medium tracking-[-0.03em] text-white">
            {titulo}
          </h1>
          {/* slate-600, não 500: sobre o fundo azulado o 500 cai para 4,42:1
              e reprova no axe (o mínimo é 4,5). Aqui dá 7,03:1. */}
          <p className="text-white/75 mt-4 max-w-xl">{abertura}</p>
        </section>

        {children}

  
        {fonte && <p className="mt-6 text-[11px] text-slate-600">{fonte}</p>}
      </main>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

/** Campo de valor, no mesmo desenho das outras ferramentas da casa. */
export function Campo({
  label,
  value,
  onChange,
  prefixo,
  sufixo,
  hint,
  moeda,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  prefixo?: string;
  sufixo?: string;
  hint?: string;
  /** Máscara de dinheiro. Se omitido, liga sozinho quando o prefixo é "R$". */
  moeda?: boolean;
}) {
  const idCampo = useId();
  const ehMoeda = moeda ?? prefixo === "R$";
  const exibido = ehMoeda ? formatarMoedaInput(value) : value;
  const aoDigitar = (raw: string) =>
    onChange(ehMoeda ? digitosParaReais(raw) : raw);

  return (
    <div>
      <label htmlFor={idCampo} className="block text-xs font-semibold text-slate-600 mb-1.5">
        {label}
      </label>
      <div className="relative">
        {prefixo && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
            {prefixo}
          </span>
        )}
        <input
          id={idCampo}
          inputMode={ehMoeda ? "numeric" : "decimal"}
          value={exibido}
          onChange={(e) => aoDigitar(e.target.value)}
          className={`h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[0.9375rem] tabular-nums outline-none focus:border-accent focus:ring-4 focus:ring-accent/12 ${
            prefixo ? "pl-9" : ""
          } ${sufixo ? "pr-20" : ""}`}
        />
        {sufixo && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
            {sufixo}
          </span>
        )}
      </div>
      {hint && <p className="text-[11px] text-slate-500 mt-1">{hint}</p>}
    </div>
  );
}

/** O número que a pessoa veio buscar, em destaque sobre o azul da marca. */
export function Resultado({
  rotulo,
  valor,
  nota,
  tom = "normal",
}: {
  rotulo: string;
  valor: string;
  nota?: ReactNode;
  tom?: "normal" | "alerta";
}) {
  return (
    // O painel noite da Carteira Pontual: quase preto, com a luz ciano e
    // laranja nas bordas (`.secao-noite.sem-ondas`) e o número em peso
    // médio, grande — é o número que a pessoa veio buscar.
    <section className="secao-noite sem-ondas mt-6 rounded-[1.75rem] p-7 text-center shadow-ciano sm:p-9">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-ciano-claro">
        {rotulo}
      </p>
      <p
        className={`text-4xl sm:text-[3.5rem] sm:leading-none font-medium tracking-[-0.04em] tabular-nums mt-3 ${
          tom === "alerta" ? "text-warning-claro" : ""
        }`}
      >
        {valor}
      </p>
      {nota && <p className="mx-auto max-w-lg text-sm text-white/75 mt-4">{nota}</p>}
    </section>
  );
}

/** Linha de uma composição (holerite, rescisão, férias). */
export function Linha({
  rotulo,
  valor,
  tom = "neutro",
  detalhe,
}: {
  rotulo: string;
  valor: string;
  tom?: "neutro" | "ganho" | "desconto" | "total";
  detalhe?: string;
}) {
  const cor =
    tom === "ganho"
      ? "text-emerald-700"
      : tom === "desconto"
        ? "text-red-600"
        : tom === "total"
          ? "text-slate-900 font-bold"
          : "text-slate-700";

  return (
    <div
      className={`flex items-baseline justify-between gap-3 py-2.5 ${
        tom === "total" ? "border-t-2 border-slate-200 mt-1 pt-3" : ""
      }`}
    >
      <div className="min-w-0">
        <span className={`text-sm ${tom === "total" ? "font-bold" : ""} text-slate-700`}>
          {rotulo}
        </span>
        {detalhe && (
          <p className="text-[11px] text-slate-500 leading-tight">{detalhe}</p>
        )}
      </div>
      <span className={`text-sm tabular-nums shrink-0 ${cor}`}>{valor}</span>
    </div>
  );
}
