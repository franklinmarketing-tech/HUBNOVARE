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
  /**
   * O selo da conquista.
   *
   * Emoji, não ícone de traço: oito medalhas cinzas iguais não se
   * distinguem de relance, e conquista que não se reconhece num piscar de
   * olhos não premia ninguém. Aqui cada uma tem cara própria.
   */
  selo: string;
  conquistada: boolean;
};

/**
 * Como a pessoa está, em uma frase que ela entende.
 *
 * A tela dizia "Plano cumprido 40%", "Patrimônio líquido", "Meses
 * acompanhados" — jargão de consultor, não resposta. O que alguém quer
 * saber ao abrir a evolução é uma coisa só: vou bem ou não vou?
 *
 * A leitura é por PROGRESSO no mês, não por saldo: quem está começando com
 * pouco dinheiro mas fez tudo certo merece ouvir que foi bem.
 */
function comoVoceEsta(d: DadosJornada) {
  const sobrou = d.sobraUltimoMes > 0;
  const dividaCaiu = d.dividaInicial > 0 && d.dividaHoje < d.dividaInicial;
  const cresceu = d.mesesFechados > 1 && d.patrimonioHoje > d.patrimonioInicial;
  const temReserva = d.mesesReserva >= 1;

  // Quantos sinais bons a pessoa juntou neste ciclo.
  const bons = [sobrou, dividaCaiu, cresceu, temReserva].filter(Boolean).length;

  if (d.mesesFechados === 0) {
    return {
      selo: "🌱",
      titulo: "Bora começar",
      frase: "Feche o seu primeiro mês para eu te dizer como você está.",
      tom: "neutro" as const,
    };
  }
  if (d.sobraUltimoMes < 0) {
    return {
      selo: "🚨",
      titulo: "Mês no vermelho",
      frase: "Você gastou mais do que ganhou. É o ponto para atacar primeiro.",
      tom: "ruim" as const,
    };
  }
  if (bons >= 3) {
    return {
      selo: "🔥",
      titulo: "Você está voando",
      frase: "Sobra no mês, dívida caindo e patrimônio subindo. Continue assim.",
      tom: "otimo" as const,
    };
  }
  if (bons === 2) {
    return {
      selo: "💪",
      titulo: "Está indo bem",
      frase: "Dois sinais bons no mês. Falta pouco para engrenar de vez.",
      tom: "bom" as const,
    };
  }
  if (sobrou) {
    return {
      selo: "🙂",
      titulo: "No caminho",
      frase: "Sobrou dinheiro este mês. Agora é transformar sobra em reserva.",
      tom: "bom" as const,
    };
  }
  return {
    selo: "🎯",
    titulo: "Dá para melhorar",
    frase: "O mês fechou empatado. Um corte pequeno já muda o resultado.",
    tom: "neutro" as const,
  };
}

/** Cores de cada veredito. Um tom por estado, sem inventar paleta nova. */
const TOM = {
  otimo: {
    fundo: "from-[hsl(152_50%_30%)] to-[hsl(160_55%_18%)]",
    chip: "bg-white/15 text-white",
  },
  bom: {
    fundo: "from-primary to-[hsl(216_58%_13%)]",
    chip: "bg-white/15 text-white",
  },
  neutro: {
    fundo: "from-[hsl(215_30%_38%)] to-[hsl(216_40%_20%)]",
    chip: "bg-white/15 text-white",
  },
  ruim: {
    fundo: "from-[hsl(14_65%_42%)] to-[hsl(8_60%_26%)]",
    chip: "bg-white/15 text-white",
  },
} as const;

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
      selo: "🌱",
      conquistada: d.mesesFechados >= 1,
    },
    {
      chave: "sobrou",
      titulo: "Mês no azul",
      descricao: "Você terminou o mês com dinheiro sobrando.",
      selo: "💰",
      conquistada: d.sobraUltimoMes > 0,
    },
    {
      chave: "constancia",
      titulo: "Três meses seguidos",
      descricao: "Constância é o que separa plano de desejo.",
      selo: "🔥",
      conquistada: d.mesesFechados >= 3,
    },
    {
      chave: "reserva-1",
      titulo: "Primeiro mês de reserva",
      descricao: "Você já tem um mês de despesas guardado.",
      selo: "🛡️",
      conquistada: d.mesesReserva >= 1,
    },
    {
      chave: "reserva-6",
      titulo: "Reserva completa",
      descricao: "Seis meses de despesas guardados. Você está protegido.",
      selo: "🎖️",
      conquistada: d.mesesReserva >= 6,
    },
    {
      chave: "divida-caiu",
      titulo: "Dívida em queda",
      descricao: "Você deve menos do que devia quando começou.",
      selo: "📉",
      conquistada: d.dividaInicial > 0 && d.dividaHoje < d.dividaInicial,
    },
    {
      chave: "patrimonio-cresceu",
      titulo: "Patrimônio crescendo",
      descricao: "Seu patrimônio líquido subiu desde o primeiro mês.",
      selo: "📈",
      conquistada:
        d.mesesFechados > 1 && d.patrimonioHoje > d.patrimonioInicial,
    },
    {
      chave: "meio-plano",
      titulo: "Metade do plano",
      descricao: "Você já cumpriu metade das metas do seu plano de ação.",
      selo: "🏆",
      conquistada: d.planoCumpridoPct >= 50,
    },
  ];
}

/**
 * Um sinal do mês: sim ou não, sem número.
 *
 * "Sobrou no mês" responde o que "Taxa de poupança: 12%" não responde para
 * quem não é do ramo. O número continua abaixo, para quem quiser.
 */
function Sinal({ ok, texto }: { ok: boolean; texto: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
        ok ? "bg-white/20 text-white" : "bg-black/15 text-white/45"
      }`}
    >
      <span aria-hidden>{ok ? "✅" : "⬜"}</span>
      {texto}
    </span>
  );
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

  const estado = comoVoceEsta(dados);
  const tom = TOM[estado.tom];

  return (
    <div className="space-y-4">
      {/* ------------------------------------------------ COMO VOCÊ ESTÁ

          O veredito, em português. A tela abria com "Caminho até o Marco
          Horizonte · 4,2%" — que é a métrica certa e a mensagem errada para
          quem está começando: 4% lido sozinho parece fracasso. Aqui a
          primeira coisa é uma frase que a pessoa entende sobre o MÊS que
          ela acabou de fechar, e a cor do bloco já diz o resultado antes de
          qualquer leitura. */}
      <section
        className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${tom.fundo} p-6 text-white shadow-[0_10px_30px_-12px_hsl(215_50%_15%_/_0.45)]`}
      >
        {/* Luz de topo: dá volume ao bloco sem pesar. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/25"
        />
        <div className="flex items-start gap-4">
          <span
            aria-hidden
            className="shrink-0 text-[2.75rem] leading-none drop-shadow-[0_4px_10px_rgba(0,0,0,0.25)]"
          >
            {estado.selo}
          </span>
          <div className="min-w-0">
            <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-white/60">
              Como você está
            </p>
            <h2 className="mt-1 font-display text-2xl font-extrabold leading-tight sm:text-[1.75rem]">
              {estado.titulo}
            </h2>
            <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-white/80">
              {estado.frase}
            </p>
          </div>
        </div>

        {/* Os sinais do mês, em chips. Substituem quatro indicadores em
            jargão por quatro respostas de sim ou não. */}
        <div className="mt-5 flex flex-wrap gap-2">
          <Sinal ok={dados.sobraUltimoMes > 0} texto="Sobrou no mês" />
          <Sinal
            ok={dados.dividaInicial > 0 && dados.dividaHoje < dados.dividaInicial}
            texto="Dívida caindo"
          />
          <Sinal ok={dados.mesesReserva >= 1} texto="Reserva começada" />
          <Sinal
            ok={dados.mesesFechados > 1 && dados.patrimonioHoje > dados.patrimonioInicial}
            texto="Patrimônio subindo"
          />
        </div>
      </section>

      {/* --------------------------------------------- caminho até o alvo */}
      <section className="overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary to-[hsl(216_58%_13%)] p-6 text-white">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <p className="text-2xs font-semibold uppercase tracking-wider text-white/60">
              Caminho até o Marco Horizonte
            </p>
            <h2 className="mt-1 font-display text-xl font-bold">{fase.nome}</h2>
          </div>
          <p className="font-display text-3xl font-extrabold tabular-nums">
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
          <span aria-hidden className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-2xl">
            🔥
          </span>
          <div>
            <p className="font-display text-2xl font-bold tabular-nums text-primary">
              {dados.mesesFechados}
            </p>
            <p className="text-xs text-muted-foreground">
              {dados.mesesFechados === 1 ? "mês fechado" : "meses seguidos fechados"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-border bg-white p-5">
          <span aria-hidden className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-success/10 text-2xl">
            🏆
          </span>
          <div>
            <p className="font-display text-2xl font-bold tabular-nums text-primary">
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
            return (
              <div
                key={c.chave}
                /* Conquistada sobe e ganha sombra; bloqueada fica rente e
                   sem cor. A diferença tem de dar para ver de longe, senão
                   a grade vira oito retângulos iguais. */
                className={`group flex items-start gap-3 rounded-xl border p-3.5 transition-all duration-200 ${
                  c.conquistada
                    ? "border-accent/30 bg-gradient-to-br from-accent/[0.10] to-accent/[0.03] shadow-[0_2px_8px_-4px_hsl(16_80%_45%_/_0.3)] hover:-translate-y-0.5 hover:shadow-[0_6px_16px_-6px_hsl(16_80%_45%_/_0.4)]"
                    : "border-slate-200 bg-slate-50/60"
                }`}
              >
                <span
                  aria-hidden
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl transition-transform duration-200 ${
                    c.conquistada
                      ? "bg-white shadow-sm group-hover:scale-110"
                      : "bg-slate-200/60 grayscale"
                  }`}
                >
                  {/* Bloqueada mostra o MESMO selo, apagado: ver o que se
                      vai ganhar motiva mais do que um cadeado genérico. */}
                  <span className={c.conquistada ? "" : "opacity-40"}>
                    {c.selo}
                  </span>
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
