import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

/**
 * As peças visuais do painel da Novare.
 *
 * Moram num arquivo só porque o hero, os cartões de número e o seletor de
 * período aparecem em TODAS as telas do painel. Copiados em cada uma, a
 * terceira cópia já teria divergido — e painel com dois tons de azul e dois
 * tamanhos de número parece feito às pressas, que é o oposto do que uma tela
 * de "como vai a empresa" precisa transmitir.
 */

/* ═══ HERO ═══════════════════════════════════════════════════════════════
   Navy institucional com duas luzes muito fracas nas quinas. Sem elas o
   retângulo chapado parece caixa de aviso; com elas, parece superfície.

   ⚠️ `overflow-hidden` NÃO É ENFEITE: as luzes ficam em `-right-24` e
   `-left-20`, fora da caixa. Sem o recorte, elas empurram a página inteira
   para o lado no celular — foi assim que a tela de dívidas do FINCASH
   escorregou 64px. */
export function Hero({
  etiqueta,
  titulo,
  children,
  acao,
}: {
  etiqueta: string;
  titulo: string;
  children?: React.ReactNode;
  acao?: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-primary px-6 py-7 text-white shadow-lg sm:px-8 sm:py-9">
      <span
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-[radial-gradient(circle,hsl(197_70%_55%/0.3),transparent_65%)]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-[radial-gradient(circle,hsl(16_85%_58%/0.22),transparent_65%)]"
      />

      <div className="relative flex flex-wrap items-end justify-between gap-5">
        <div className="min-w-0">
          <p className="text-2xs font-semibold uppercase tracking-[0.18em] text-white/55">
            {etiqueta}
          </p>
          <h1 className="mt-1.5 font-display text-2xl font-bold leading-tight sm:text-3xl">
            {titulo}
          </h1>
          {children && (
            <div className="mt-2.5 max-w-prose text-sm leading-relaxed text-white/70">
              {children}
            </div>
          )}
        </div>
        {acao}
      </div>
    </section>
  );
}

/* ═══ SELETOR DE PERÍODO ══════════════════════════════════════════════════
   ⚠️ FICA NO TOPO, logo abaixo do hero — nunca no fim da página. E com a
   bolinha de escolha visível: um grupo de botões sem marca de seleção
   obriga a pessoa a deduzir qual está ativo pela cor, e isso falha para
   quem não distingue bem as duas tonalidades.

   É um `<Link>`, e não um `<select>`, para o período entrar na URL: assim o
   Jefferson manda "olha os últimos 7 dias" colando o endereço. */
export const PERIODOS = [
  { dias: 7, rotulo: "7 dias" },
  { dias: 30, rotulo: "30 dias" },
  { dias: 90, rotulo: "90 dias" },
  { dias: 365, rotulo: "1 ano" },
] as const;

export function SeletorDePeriodo({
  base,
  dias,
  extra = "",
}: {
  base: string;
  dias: number;
  extra?: string;
}) {
  return (
    <div
      role="group"
      aria-label="Período"
      className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-border bg-white p-1.5 shadow-sm"
    >
      {PERIODOS.map((p) => {
        const ativo = p.dias === dias;
        return (
          <Link
            key={p.dias}
            href={`${base}?dias=${p.dias}${extra}`}
            aria-current={ativo ? "true" : undefined}
            className={`flex min-h-9 items-center gap-2 rounded-xl px-3.5 text-xs font-semibold transition-colors ${
              ativo
                ? "bg-primary text-white"
                : "text-muted-foreground hover:bg-slate-100 hover:text-primary"
            }`}
          >
            <span
              aria-hidden
              className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                ativo ? "border-white" : "border-slate-300"
              }`}
            >
              {ativo && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
            </span>
            {p.rotulo}
          </Link>
        );
      })}
    </div>
  );
}

/* ═══ CARTÃO DE NÚMERO ════════════════════════════════════════════════════
   ⚠️ O DESTAQUE GRANDE É AZUL, não verde. Verde em todo número faz a tela
   inteira parecer um placar de vitória, e some com a diferença entre "está
   indo bem" e "está apenas acontecendo". Vermelho fica reservado para o que
   é de fato ruim. */
export function Numero({
  rotulo,
  valor,
  detalhe,
  variacao,
  Icone,
  tom = "normal",
  href,
}: {
  rotulo: string;
  valor: string | number;
  detalhe?: string;
  /** Diferença percentual contra o período anterior. */
  variacao?: number | null;
  Icone?: LucideIcon;
  tom?: "normal" | "destaque" | "atencao";
  href?: string;
}) {
  const corDoValor =
    tom === "destaque"
      ? "text-primary"
      : tom === "atencao"
        ? "text-destructive"
        : "text-foreground";

  const miolo = (
    <>
      <div className="flex items-center gap-2">
        {Icone && (
          <Icone className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.9} />
        )}
        <p className="min-w-0 truncate text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
          {rotulo}
        </p>
      </div>

      <p className={`mt-2 font-display text-3xl font-bold tabular-nums ${corDoValor}`}>
        {valor}
      </p>

      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
        {detalhe && <p className="text-2xs text-muted-foreground">{detalhe}</p>}
        {variacao != null && <Variacao pct={variacao} />}
      </div>
    </>
  );

  const classe =
    "block rounded-2xl border border-border bg-white p-4 shadow-sm transition-colors";

  return href ? (
    <Link href={href} className={`${classe} hover:border-primary/40`}>
      {miolo}
    </Link>
  ) : (
    <div className={classe}>{miolo}</div>
  );
}

/**
 * A variação contra o período anterior.
 *
 * ⚠️ NUNCA SÓ A COR. A seta acompanha o verde e o vermelho, porque quem não
 * distingue as duas cores veria só um número sem sinal — e "12%" sem saber
 * se subiu ou desceu é pior do que não mostrar nada.
 */
function Variacao({ pct }: { pct: number }) {
  if (!Number.isFinite(pct) || Math.abs(pct) < 1) {
    return (
      <span className="inline-flex items-center gap-0.5 text-2xs font-semibold text-muted-foreground">
        <Minus className="h-3 w-3" strokeWidth={2.4} /> estável
      </span>
    );
  }
  const subiu = pct > 0;
  const Seta = subiu ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-2xs font-semibold ${
        subiu ? "text-success" : "text-destructive"
      }`}
    >
      <Seta className="h-3 w-3" strokeWidth={2.4} />
      {Math.abs(Math.round(pct))}%
      <span className="font-medium text-muted-foreground">vs. antes</span>
    </span>
  );
}

/** A variação em porcentagem, protegida contra divisão por zero. */
export function variacaoPct(agora: number, antes: number): number | null {
  if (antes === 0) return agora === 0 ? 0 : null; // de 0 para 5 não é "500%"
  return ((agora - antes) / antes) * 100;
}

/* ═══ GRÁFICO DE BARRAS POR DIA ═══════════════════════════════════════════
   SVG à mão, e não uma biblioteca: são barras diárias com um valor cada. O
   `recharts` está instalado, mas traz 90 KB para desenhar retângulos.

   ⚠️ DIA VAZIO APARECE COMO ESPAÇO, e não some. Pular os dias sem nada
   desenharia uma linha subindo onde houve silêncio — a mentira mais fácil
   de um gráfico de série temporal. */
export function BarrasPorDia({
  dados,
  rotulo,
}: {
  dados: { dia: string; valor: number }[];
  rotulo: string;
}) {
  const maximo = Math.max(1, ...dados.map((d) => d.valor));
  const total = dados.reduce((s, d) => s + d.valor, 0);

  if (total === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-white p-6 text-center">
        <p className="text-sm font-semibold text-primary">Nenhum {rotulo} no período</p>
        <p className="mt-1 text-xs text-muted-foreground">
          O gráfico aparece assim que entrar o primeiro.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
          {rotulo} por dia
        </p>
        <p className="font-display text-sm font-bold tabular-nums text-primary">
          {total} no total
        </p>
      </div>

      {/* `items-end` para as barras crescerem de baixo para cima. A altura
          mínima de 2px mantém visível o dia com valor 1. */}
      <div className="mt-3 flex h-28 items-end gap-px" role="img" aria-label={`${rotulo} por dia: ${total} no período`}>
        {dados.map((d) => (
          <div
            key={d.dia}
            className="group relative flex-1"
            style={{ height: `${Math.max(2, (d.valor / maximo) * 100)}%` }}
          >
            <div
              className={`h-full w-full rounded-t transition-colors ${
                d.valor > 0 ? "bg-primary/75 group-hover:bg-accent" : "bg-slate-100"
              }`}
            />
            <span className="pointer-events-none absolute -top-7 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-primary px-2 py-1 text-2xs font-semibold text-white group-hover:block">
              {d.valor} · {formatarDia(d.dia)}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-1.5 flex justify-between text-2xs text-muted-foreground">
        <span>{formatarDia(dados[0]?.dia)}</span>
        <span>{formatarDia(dados[dados.length - 1]?.dia)}</span>
      </div>
    </div>
  );
}

function formatarDia(iso?: string) {
  if (!iso) return "";
  const [, m, d] = iso.split("T")[0].split("-");
  return `${d}/${m}`;
}

/* ═══ AVISO DE SQL QUE FALTA RODAR ════════════════════════════════════════
   ⚠️ ESTA PEÇA EXISTE POR UM CASO REAL: as telas de /admin foram escritas e
   publicadas, mas as funções de banco nunca rodaram. A tela mostrava
   "Could not find the function ... in the schema cache" — mensagem do
   PostgREST, em inglês, que parece defeito do app e não diz o que fazer.
   Agora ela diz qual arquivo rodar. */
export function FaltaRodarSql({ erro, arquivo }: { erro: string; arquivo: string }) {
  const funcaoAusente = /could not find the function|PGRST202|42883/i.test(erro);

  return (
    <div className="rounded-2xl border border-warning/40 bg-warning/8 p-5">
      <p className="font-display text-sm font-bold text-primary">
        {funcaoAusente ? "Falta rodar um SQL no Supabase" : "Não consegui carregar"}
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-foreground">
        {funcaoAusente ? (
          <>
            Esta tela depende de funções que ainda não existem no banco. Rode{" "}
            <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs">
              supabase/{arquivo}
            </code>{" "}
            no SQL Editor do Supabase e recarregue.
          </>
        ) : (
          "Tente recarregar. Se continuar, o detalhe abaixo ajuda a entender."
        )}
      </p>
      <p className="mt-2.5 font-mono text-2xs leading-relaxed text-muted-foreground">{erro}</p>
    </div>
  );
}
