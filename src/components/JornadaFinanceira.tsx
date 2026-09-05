import {
  Flame,
  Lock,
  Medal,
  ShieldCheck,
  Sprout,
  Target,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { brlCurto } from "@/app/planejamento/app/pecas";

/**
 * A camada de jogo da Evolução.
 *
 * A tela já mostrava gráfico e tabela — o que faltava era responder "estou
 * indo bem?" sem a pessoa ter que interpretar uma curva. Aqui isso vira
 * três coisas que se lê de relance: a distância até o Marco Horizonte, a
 * sequência de meses fechados e as conquistas que já caíram.
 *
 * Nenhuma conquista é decorativa: cada uma marca um degrau real de saúde
 * financeira (primeiro fechamento, reserva formada, dívida quitada,
 * patrimônio crescendo). Medalha por participação não muda comportamento —
 * e num app que cobra mensalidade, soa a enfeite.
 */

export type DadosJornada = {
  /** Patrimônio líquido no último fechamento. */
  patrimonioHoje: number;
  /** O alvo total: aposentadoria + objetivos. */
  marcoHorizonte: number;
  /** Quantos meses a pessoa já fechou. */
  mesesFechados: number;
  /** Meses de reserva de emergência no último fechamento. */
  mesesReserva: number;
  /** Dívida total no último fechamento. */
  dividaHoje: number;
  /** Dívida no primeiro fechamento — para saber se caiu. */
  dividaInicial: number;
  /** Patrimônio no primeiro fechamento — para saber se cresceu. */
  patrimonioInicial: number;
  /** % do plano de ação cumprido. */
  planoCumpridoPct: number;
  /** Quanto sobrou no último mês. */
  sobraUltimoMes: number;
};

type Conquista = {
  chave: string;
  titulo: string;
  descricao: string;
  icone: typeof Trophy;
  conquistada: boolean;
};

/**
 * As conquistas, na ordem em que costumam cair na vida real: primeiro
 * aparecer, depois sobrar dinheiro, depois formar reserva, e só então
 * derrubar dívida e ver patrimônio subir.
 */
function montarConquistas(d: DadosJornada): Conquista[] {
  return [
    {
      chave: "primeiro-mes",
      titulo: "Primeiro fechamento",
      descricao: "Você fechou o seu primeiro mês.",
      icone: Sprout,
      conquistada: d.mesesFechados >= 1,
    },
    {
      chave: "sobrou",
      titulo: "Mês no azul",
      descricao: "Você terminou o mês com dinheiro sobrando.",
      icone: TrendingUp,
      conquistada: d.sobraUltimoMes > 0,
    },
    {
      chave: "constancia",
      titulo: "Três meses seguidos",
      descricao: "Constância é o que separa plano de desejo.",
      icone: Flame,
      conquistada: d.mesesFechados >= 3,
    },
    {
      chave: "reserva-1",
      titulo: "Primeiro mês de reserva",
      descricao: "Você já tem um mês de despesas guardado.",
      icone: ShieldCheck,
      conquistada: d.mesesReserva >= 1,
    },
    {
      chave: "reserva-6",
      titulo: "Reserva completa",
      descricao: "Seis meses de despesas guardados. Você está protegido.",
      icone: Medal,
      conquistada: d.mesesReserva >= 6,
    },
    {
      chave: "divida-caiu",
      titulo: "Dívida em queda",
      descricao: "Você deve menos do que devia quando começou.",
      icone: Target,
      conquistada: d.dividaInicial > 0 && d.dividaHoje < d.dividaInicial,
    },
    {
      chave: "patrimonio-cresceu",
      titulo: "Patrimônio crescendo",
      descricao: "Seu patrimônio líquido subiu desde o primeiro mês.",
      icone: TrendingUp,
      conquistada:
        d.mesesFechados > 1 && d.patrimonioHoje > d.patrimonioInicial,
    },
    {
      chave: "meio-plano",
      titulo: "Metade do plano",
      descricao: "Você já cumpriu metade das metas do seu plano de ação.",
      icone: Trophy,
      conquistada: d.planoCumpridoPct >= 50,
    },
  ];
}

/** Etapas do caminho até o Marco Horizonte, para a barra não ser só um %. */
function faseDoCaminho(pct: number) {
  if (pct >= 100) return { nome: "Independência conquistada", cor: "text-success-strong" };
  if (pct >= 75) return { nome: "Reta final", cor: "text-success-strong" };
  if (pct >= 50) return { nome: "Mais da metade", cor: "text-accent-strong" };
  if (pct >= 25) return { nome: "Ganhando tração", cor: "text-accent-strong" };
  if (pct >= 5) return { nome: "Construindo base", cor: "text-primary" };
  return { nome: "Começando agora", cor: "text-primary" };
}

export function JornadaFinanceira({ dados }: { dados: DadosJornada }) {
  const conquistas = montarConquistas(dados);
  const ganhas = conquistas.filter((c) => c.conquistada);

  /* A barra nunca passa de 100% nem fica negativa: patrimônio negativo
     (mais dívida que bem) mostraria uma barra invertida sem sentido. */
  const pctBruto =
    dados.marcoHorizonte > 0
      ? (dados.patrimonioHoje / dados.marcoHorizonte) * 100
      : 0;
  const pct = Math.max(0, Math.min(100, pctBruto));
  const fase = faseDoCaminho(pct);
  const falta = Math.max(0, dados.marcoHorizonte - dados.patrimonioHoje);

  return (
    <div className="space-y-4">
      {/* --------------------------------------------- caminho até o alvo */}
      <section className="overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary to-[hsl(216_58%_13%)] p-6 text-white">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <p className="text-2xs font-bold uppercase tracking-wider text-white/60">
              Caminho até o Marco Horizonte
            </p>
            <h2 className="mt-1 font-display text-xl font-bold">{fase.nome}</h2>
          </div>
          <p className="font-display text-3xl font-black tabular-nums">
            {pct.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%
          </p>
        </div>

        <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-white/15">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent-btn to-accent-claro transition-[width] duration-700"
            style={{ width: `${Math.max(pct, 1.5)}%` }}
          />
        </div>

        <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs text-white/70">
          <span>
            Hoje: <strong className="text-white">{brlCurto(dados.patrimonioHoje)}</strong>
          </span>
          <span>
            Falta: <strong className="text-white">{brlCurto(falta)}</strong>
          </span>
          <span>
            Alvo: <strong className="text-white">{brlCurto(dados.marcoHorizonte)}</strong>
          </span>
        </div>
      </section>

      {/* ------------------------------------------------- sequência e placar */}
      <section className="grid gap-3 sm:grid-cols-2">
        <div className="flex items-center gap-4 rounded-2xl border border-border bg-white p-5">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10">
            <Flame className="h-6 w-6 text-accent-strong" />
          </span>
          <div>
            <p className="font-display text-2xl font-black tabular-nums text-primary">
              {dados.mesesFechados}
            </p>
            <p className="text-xs text-muted-foreground">
              {dados.mesesFechados === 1 ? "mês fechado" : "meses seguidos fechados"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-border bg-white p-5">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-success/10">
            <Trophy className="h-6 w-6 text-success-strong" />
          </span>
          <div>
            <p className="font-display text-2xl font-black tabular-nums text-primary">
              {ganhas.length}
              <span className="text-base font-bold text-muted-foreground">
                /{conquistas.length}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">conquistas desbloqueadas</p>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- as conquistas */}
      <section className="rounded-2xl border border-border bg-white p-5">
        <h2 className="font-display text-base font-bold text-primary">
          Suas conquistas
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Cada uma marca um degrau real da sua vida financeira — não é medalha
          de participação.
        </p>

        <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
          {conquistas.map((c) => {
            const Icone = c.conquistada ? c.icone : Lock;
            return (
              <div
                key={c.chave}
                className={`flex items-start gap-3 rounded-xl border p-3.5 transition-colors ${
                  c.conquistada
                    ? "border-accent/30 bg-accent/[0.06]"
                    : "border-border bg-muted/30"
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                    c.conquistada ? "bg-accent/15" : "bg-slate-200/70"
                  }`}
                >
                  <Icone
                    className={`h-[18px] w-[18px] ${
                      c.conquistada ? "text-accent-strong" : "text-slate-400"
                    }`}
                  />
                </span>
                <div className="min-w-0">
                  <p
                    className={`text-sm font-bold ${
                      c.conquistada ? "text-primary" : "text-slate-500"
                    }`}
                  >
                    {c.titulo}
                  </p>
                  <p
                    className={`text-xs leading-snug ${
                      c.conquistada ? "text-slate-600" : "text-slate-400"
                    }`}
                  >
                    {c.descricao}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
