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
   O cartão de abertura do painel.

   ⚠️ A PRIMEIRA VERSÃO ERA UM RETÂNGULO NAVY CHAPADO com duas luzes muito
   fracas. Funcionava e parecia caixa de aviso — e uma tela que abre com
   "como vai a sua empresa" precisa ter o peso daquilo que está dizendo.
   O que mudou, e cada coisa faz um trabalho:

     • GRADIENTE DIAGONAL em vez de cor sólida: dá direção à luz, e o olho
       lê superfície em vez de retângulo pintado.
     • MALHA DE PONTOS muito fraca: textura é o que separa "superfície" de
       "preenchimento". A 4% de opacidade ela não é vista — é sentida.
     • LUZES MAIORES E MAIS QUENTES nas quinas, com o laranja da marca de
       um lado e o azul-claro do outro: a paleta da casa aparecendo sem
       precisar de nenhum elemento decorativo a mais.
     • FILETE SUPERIOR em degradê, que é o detalhe que faz o bloco parecer
       recortado com cuidado em vez de colado.
     • DESTAQUE OPCIONAL à direita: o número que importa mora DENTRO do
       hero, e não num cartão a três rolagens de distância.

   ⚠️ `overflow-hidden` NÃO É ENFEITE: as luzes ficam fora da caixa, em
   `-right-32` e `-left-24`. Sem o recorte, elas empurram a página inteira
   para o lado no celular — foi assim que a tela de dívidas do FINCASH
   escorregou 64px.

   ⚠️ TODO MOVIMENTO PASSA POR `prefers-reduced-motion` (via `.surgir`, do
   `globals.css`). Painel de empresa é tela de trabalho diário: quem pediu
   menos movimento ao sistema operacional pediu de verdade. */
export function Hero({
  etiqueta,
  titulo,
  children,
  acao,
  destaque,
}: {
  etiqueta: string;
  titulo: string;
  children?: React.ReactNode;
  acao?: React.ReactNode;
  /** O número que resume a tela. Fica grande, à direita. */
  destaque?: { valor: string | number; rotulo: string };
}) {
  return (
    <section
      className="surgir relative overflow-hidden rounded-3xl px-6 py-8 text-white shadow-[0_18px_40px_-18px_hsl(215_50%_18%/0.55)] sm:px-9 sm:py-10"
      style={{
        background:
          "linear-gradient(135deg, hsl(215 52% 26%) 0%, hsl(215 54% 20%) 48%, hsl(215 58% 15%) 100%)",
      }}
    >
      {/* O filete de luz no topo — o detalhe que dá acabamento à borda. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,hsl(210_75%_72%/0.55),hsl(16_85%_65%/0.4),transparent)]"
      />

      {/* Textura: pontos a 4%. Não se vê, se sente. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.045]"
        style={{
          backgroundImage: "radial-gradient(hsl(0 0% 100%) 1px, transparent 1px)",
          backgroundSize: "18px 18px",
        }}
      />

      {/* As duas luzes da marca. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-32 -top-36 h-[22rem] w-[22rem] rounded-full bg-[radial-gradient(circle,hsl(203_80%_60%/0.34),transparent_62%)] blur-[2px]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -left-24 h-[22rem] w-[22rem] rounded-full bg-[radial-gradient(circle,hsl(16_88%_58%/0.26),transparent_62%)] blur-[2px]"
      />

      <div className="relative flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-2xs font-semibold uppercase tracking-[0.2em] text-white/55">
            {/* Um ponto de luz antes da etiqueta: âncora o olho no começo
                da linha, que é onde a leitura de uma tela densa começa. */}
            <span
              aria-hidden
              className="h-1.5 w-1.5 rounded-full bg-[hsl(16_88%_62%)] shadow-[0_0_10px_hsl(16_88%_62%)]"
            />
            {etiqueta}
          </p>

          <h1 className="mt-2 font-display text-[1.7rem] font-bold leading-[1.15] tracking-tight sm:text-4xl">
            {titulo}
          </h1>

          {children && (
            <div className="mt-3 max-w-prose text-sm leading-relaxed text-white/65">
              {children}
            </div>
          )}
        </div>

        {destaque && (
          <div className="shrink-0 text-right">
            <p className="font-display text-4xl font-bold leading-none tabular-nums sm:text-5xl">
              {destaque.valor}
            </p>
            <p className="mt-1.5 text-2xs font-semibold uppercase tracking-wider text-white/50">
              {destaque.rotulo}
            </p>
          </div>
        )}

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

  /* A listra de cor na borda esquerda: um sinal que se lê sem ler. */
  const listra =
    tom === "atencao"
      ? "before:bg-destructive"
      : tom === "destaque"
        ? "before:bg-[linear-gradient(180deg,hsl(210_75%_62%),hsl(215_50%_23%))]"
        : "before:bg-border";

  const miolo = (
    <>
      <div className="flex items-center gap-2">
        {Icone && (
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/[0.07] text-primary transition-colors group-hover:bg-primary/[0.12]">
            <Icone className="h-3.5 w-3.5" strokeWidth={2} />
          </span>
        )}
        <p className="min-w-0 truncate text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
          {rotulo}
        </p>
      </div>

      {/* `tracking-tight` e `tabular-nums`: número grande com espaçamento
          solto parece frouxo, e sem cifra tabular as colunas dançam quando
          o valor muda de 9 para 10. */}
      <p
        className={`mt-2.5 font-display text-[2rem] font-bold leading-none tracking-tight tabular-nums ${corDoValor}`}
      >
        {valor}
      </p>

      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
        {detalhe && <p className="text-2xs text-muted-foreground">{detalhe}</p>}
        {variacao != null && <Variacao pct={variacao} />}
      </div>
    </>
  );

  /* ⚠️ A LISTRA É UM `::before`, e não uma borda: borda colorida de um lado
     só obriga a compensar o padding do outro para o conteúdo não dançar
     entre um cartão com listra e outro sem. */
  const classe =
    "group relative block overflow-hidden rounded-2xl border border-border bg-white p-4 pl-5 shadow-sm transition-all duration-200 " +
    "before:absolute before:inset-y-0 before:left-0 before:w-1 before:content-[''] " +
    listra;

  return href ? (
    <Link
      href={href}
      className={`${classe} hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md motion-reduce:hover:translate-y-0`}
    >
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
          mínima de 2px mantém visível o dia com valor 1.

          ⚠️ A ALTURA É ANIMADA NA ENTRADA, com atraso escalonado por barra:
          o gráfico se desenha da esquerda para a direita, que é o sentido
          em que o tempo é lido. O atraso tem teto de 600ms — sem ele, um
          período de 365 dias levaria meio minuto para terminar de aparecer. */}
      <div
        className="mt-3 flex h-28 items-end gap-px"
        role="img"
        aria-label={`${rotulo} por dia: ${total} no período`}
      >
        {dados.map((d, i) => (
          <div
            key={d.dia}
            className="group relative flex-1 origin-bottom"
            style={{
              height: `${Math.max(2, (d.valor / maximo) * 100)}%`,
              animation: "surgir 420ms cubic-bezier(0.2,0.7,0.3,1) both",
              animationDelay: `${Math.min(600, i * (600 / Math.max(dados.length, 1)))}ms`,
            }}
          >
            <div
              className={`h-full w-full rounded-t transition-colors duration-150 ${
                d.valor > 0
                  ? "bg-[linear-gradient(180deg,hsl(215_50%_34%),hsl(215_52%_24%))] group-hover:bg-[linear-gradient(180deg,hsl(16_84%_58%),hsl(16_82%_46%))]"
                  : "bg-slate-100"
              }`}
            />
            {/* A etiqueta sobe junto com um triangulinho apontando a barra:
                sem ele, o balão parece solto sobre o gráfico. */}
            <span className="pointer-events-none absolute -top-8 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-primary px-2 py-1 text-2xs font-semibold text-white shadow-md group-hover:block">
              {d.valor} · {formatarDia(d.dia)}
              <span
                aria-hidden
                className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-primary"
              />
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
