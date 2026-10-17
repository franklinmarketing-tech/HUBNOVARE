import Image from "next/image";
import {
  AlertTriangle,
  ArrowUpRight,
  Bot,
  CalendarClock,
  Check,
  FileText,
  Repeat,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";

/**
 * AS MAQUETES DO PRODUTO.
 *
 * As três referências que guiam esta página (Visor, Shotbase e Calendly) têm
 * uma coisa em comum que é fácil de não perceber: em nenhuma delas o painel
 * ao lado do texto é uma FOTO. É sempre um pedacinho de interface,
 * recortado, aumentado, com uma bolha ou um cursor por cima. É isso que faz
 * a página parecer produto e não folheto.
 *
 * ┌── AS DUAS REGRAS DESTE ARQUIVO ───────────────────────────────────────┐
 * │ 1. Nenhum número aqui é promessa. Onde aparece um valor, aparece      │
 * │    junto a etiqueta "exemplo", porque a diferença entre ilustrar o   │
 * │    produto e prometer resultado é exatamente essa palavra.            │
 * │ 2. Tudo é `aria-hidden`. É ornamento ilustrativo: quem usa leitor de  │
 * │    tela recebe o argumento pelo texto ao lado, não por uma tabela de  │
 * │    números fictícios lida em voz alta.                                 │
 * └────────────────────────────────────────────────────────────────────────┘
 *
 * Mesmo `aria-hidden`, todo texto aqui respeita o contraste da WCAG: o axe
 * mede o que está pintado na tela, e um leitor humano com baixa visão
 * também vê isso.
 */

/** A etiqueta que separa ilustração de promessa. */
function Exemplo({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full bg-[#0a1521]/8 px-2 py-0.5 text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-[#46586e] ${className}`}
    >
      exemplo
    </span>
  );
}

/* ------------------------------------------------------------------ 1 --- */

/**
 * Planejamento: o medidor de saúde financeira e os objetivos com prazo.
 *
 * O arco é um `stroke-dasharray` sobre um semicírculo, sem biblioteca de
 * gráfico só para desenhar 180 graus.
 */
export function MaquetePlano() {
  const nota = 68;
  const raio = 78;
  const arco = Math.PI * raio;

  return (
    <div aria-hidden className="nv-janela w-full">
      <div className="nv-janela-barra">
        <span className="nv-janela-ponto" />
        <span className="nv-janela-ponto" />
        <span className="nv-janela-ponto" />
        <span className="ml-3 text-[0.75rem] font-medium text-[#5b6d81]">
          Planejamento Financeiro
        </span>
      </div>

      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[0.75rem] font-bold uppercase tracking-[0.12em] text-[#5b6d81]">
            Saúde financeira
          </p>
          <Exemplo />
        </div>

        {/* o arco */}
        <div className="relative mx-auto mt-3 w-[188px]">
          <svg viewBox="0 0 188 104" className="w-full">
            <path
              d="M16 96 A 78 78 0 0 1 172 96"
              fill="none"
              stroke="#e8eef5"
              strokeWidth="14"
              strokeLinecap="round"
            />
            <path
              d="M16 96 A 78 78 0 0 1 172 96"
              fill="none"
              stroke="url(#nv-arco)"
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={`${(arco * nota) / 100} ${arco}`}
            />
            <defs>
              <linearGradient id="nv-arco" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#2596be" />
                <stop offset="100%" stopColor="#6dc6e6" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-x-0 bottom-0 text-center">
            <p className="nv-numero whitespace-nowrap text-[2.75rem] text-[#0a1521]">{nota}</p>
            <p className="text-[0.75rem] font-semibold text-[#5b6d81]">de 100</p>
          </div>
        </div>

        <div className="mt-5 space-y-2.5 border-t border-[#eef2f7] pt-5">
          {[
            { objetivo: "Reserva de emergência", quando: "mar/2027", pct: 62 },
            { objetivo: "Entrada do apartamento", quando: "set/2029", pct: 28 },
          ].map((o) => (
            <div key={o.objetivo}>
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-[0.8125rem] font-semibold tracking-[-0.015em] text-[#0a1521]">
                  {o.objetivo}
                </p>
                <p className="shrink-0 text-[0.75rem] font-semibold text-[#17789c]">
                  {o.quando}
                </p>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#eef2f7]">
                <div
                  className="h-full rounded-full bg-[#2596be]"
                  style={{ width: `${o.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center gap-2.5 rounded-[14px] bg-[#f4f8fb] px-4 py-3">
          <FileText className="h-4 w-4 shrink-0 text-[#17789c]" strokeWidth={1.8} />
          <p className="text-[0.8125rem] font-medium tracking-[-0.015em] text-[#46586e]">
            Relatório em PDF pronto para baixar
          </p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ 2 --- */

/**
 * Íris: o extrato colado, com três linhas marcadas.
 *
 * A composição é a do Shotbase, a janela do produto e, escapando por cima
 * dela, a bolha com a resposta. É a sobreposição que dá a profundidade; sem
 * ela viram dois retângulos empilhados.
 */
export function MaqueteIris() {
  const linhas = [
    { t: "PAG*StreamPlus", v: "R$ 39,90", marca: "Assinatura esquecida", cor: "laranja" },
    { t: "TARIFA PACOTE SERVIÇOS", v: "R$ 34,00", marca: "Cobrada 2× no mês", cor: "laranja" },
    { t: "MERCADO SAO JOAO", v: "R$ 212,45", marca: null, cor: null },
    { t: "JUROS ROTATIVO CARTAO", v: "R$ 88,10", marca: "Juro embutido", cor: "laranja" },
    { t: "TRANSF PIX RECEBIDA", v: "+ R$ 1.200", marca: null, cor: null },
  ];

  return (
    <div aria-hidden className="relative w-full">
      <div className="nv-janela w-full">
        <div className="nv-janela-barra">
          <span className="nv-janela-ponto" />
          <span className="nv-janela-ponto" />
          <span className="nv-janela-ponto" />
          <span className="ml-3 truncate text-[0.75rem] font-medium text-[#5b6d81]">
            Íris · extrato colado
          </span>
          <span className="ml-auto shrink-0 pl-2">
            <Exemplo />
          </span>
        </div>

        <ul className="divide-y divide-[#f1f4f8] p-2">
          {linhas.map((l) => (
            <li key={l.t} className="flex items-center gap-3 px-3 py-2.5">
              <span
                className={`h-6 w-1 shrink-0 rounded-full ${
                  l.marca ? "bg-[#c9491a]" : "bg-[#e8eef5]"
                }`}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[0.8125rem] font-semibold tracking-[-0.015em] text-[#0a1521]">
                  {l.t}
                </p>
                {l.marca && (
                  <p className="mt-0.5 text-[0.75rem] font-semibold text-[#a53a12]">
                    {l.marca}
                  </p>
                )}
              </div>
              <p className="shrink-0 text-[0.8125rem] font-semibold tabular-nums text-[#46586e]">
                {l.v}
              </p>
            </li>
          ))}
        </ul>
      </div>

      {/* a bolha que escapa da janela */}
      <div className="absolute -bottom-6 -right-2 max-w-[19rem] rounded-[18px] border border-white/70 bg-white p-4 shadow-[0_24px_54px_-24px_rgba(10,21,33,0.55)] sm:-right-6">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#eaf6fb] text-[#17789c]">
            <Bot className="h-4 w-4" strokeWidth={1.9} />
          </span>
          <p className="text-[0.75rem] font-bold uppercase tracking-[0.1em] text-[#17789c]">
            Íris
          </p>
        </div>
        <p className="mt-2 text-[0.875rem] font-medium leading-snug tracking-[-0.015em] text-[#0a1521]">
          Encontrei 3 cobranças que merecem a sua atenção neste extrato, duas
          delas se repetem todo mês.
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ 3 --- */

/** Ferramentas: a grade de calculadoras, com uma delas em foco. */
export function MaqueteFerramentas() {
  const itens = [
    { n: "Salário líquido", ativo: true },
    { n: "Rescisão", ativo: false },
    { n: "Férias", ativo: false },
    { n: "Financiamento", ativo: false },
    { n: "Aposentadoria", ativo: false },
    { n: "Comparador", ativo: false },
  ];

  return (
    <div aria-hidden className="nv-janela w-full">
      <div className="nv-janela-barra">
        <span className="nv-janela-ponto" />
        <span className="nv-janela-ponto" />
        <span className="nv-janela-ponto" />
        <span className="ml-3 text-[0.75rem] font-medium text-[#5b6d81]">
          Ferramentas
        </span>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-2 gap-2 min-[400px]:grid-cols-3">
          {itens.map((i) => (
            <div
              key={i.n}
              className={`rounded-[14px] border px-2 py-3 text-center ${
                i.ativo
                  ? "border-[#2596be] bg-[#eaf6fb]"
                  : "border-[#eef2f7] bg-[#fafcfd]"
              }`}
            >
              <p
                className={`text-[0.75rem] font-semibold leading-tight tracking-[-0.01em] ${
                  i.ativo ? "text-[#17789c]" : "text-[#46586e]"
                }`}
              >
                {i.n}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-[16px] bg-[#f4f8fb] p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[0.75rem] font-bold uppercase tracking-[0.12em] text-[#5b6d81]">
              Salário líquido
            </p>
            <Exemplo />
          </div>
          <div className="mt-3 flex items-end justify-between gap-4">
            <div>
              <p className="text-[0.75rem] font-medium text-[#5b6d81]">Bruto</p>
              <p className="nv-numero whitespace-nowrap mt-0.5 text-[1.375rem] text-[#46586e]">
                R$ 7.500
              </p>
            </div>
            <ArrowUpRight className="mb-2 h-4 w-4 rotate-45 text-[#a9bccd]" />
            <div className="text-right">
              <p className="text-[0.75rem] font-medium text-[#5b6d81]">Líquido</p>
              <p className="nv-numero whitespace-nowrap mt-0.5 text-[1.375rem] text-[#0a1521]">
                R$ 5.918
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ 4 --- */

/** Consultoria: quem está do outro lado da mesa, e o desconto. */
export function MaqueteConsultoria({ desconto }: { desconto: string }) {
  return (
    <div aria-hidden className="nv-janela w-full">
      <div className="nv-janela-barra">
        <span className="nv-janela-ponto" />
        <span className="nv-janela-ponto" />
        <span className="nv-janela-ponto" />
        <span className="ml-3 text-[0.75rem] font-medium text-[#5b6d81]">
          Consultoria particular
        </span>
      </div>

      <div className="p-5 sm:p-6">
        <div className="flex items-center gap-3">
          {/* Um avatar, não mais o par sobreposto — ver a nota em
              `HeroVitrine`. */}
          <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border-2 border-white bg-[#e9eef4]">
            <Image
              src="/lp/socio-jefferson.webp"
              alt=""
              fill
              sizes="44px"
              className="object-cover object-[center_18%]"
            />
          </span>
          <div>
            <p className="text-[0.875rem] font-semibold tracking-[-0.02em] text-[#0a1521]">
              Jefferson Freitas
            </p>
            <p className="text-[0.8125rem] font-medium text-[#5b6d81]">
              Sócio · Novare
            </p>
          </div>
        </div>

        <ul className="mt-5 space-y-2.5 border-t border-[#eef2f7] pt-5">
          {[
            "Certificação CFP®",
            "Zero comissão de banco ou corretora",
            "Parceria com a Nord Research",
          ].map((t) => (
            <li key={t} className="flex items-center gap-2.5">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-[#e6f6ec] text-[#1f7a4d]">
                <Check className="h-3 w-3" strokeWidth={3.2} />
              </span>
              <p className="text-[0.8125rem] font-medium tracking-[-0.015em] text-[#46586e]">
                {t}
              </p>
            </li>
          ))}
        </ul>

        <div className="mt-5 flex items-center justify-between gap-3 rounded-[16px] bg-[#0b1626] px-4 py-3.5">
          <p className="text-[0.8125rem] font-medium tracking-[-0.015em] text-white/80">
            Para quem assina o Workspace
          </p>
          <p className="shrink-0 text-[0.9375rem] font-semibold tracking-[-0.015em] text-[#6dc6e6]">
            {desconto}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ 6 --- */

/**
 * Marco Horizonte: a projeção que transforma um desejo em uma data.
 *
 * A curva é um `path` desenhado à mão em SVG, dois pontos de controle e
 * pronto. Um gráfico de verdade aqui só acrescentaria uma dependência para
 * desenhar uma linha que sobe.
 */
export function MaqueteMarco() {
  return (
    <div aria-hidden className="nv-janela w-full">
      <div className="nv-janela-barra">
        <span className="nv-janela-ponto" />
        <span className="nv-janela-ponto" />
        <span className="nv-janela-ponto" />
        <span className="ml-3 text-[0.75rem] font-medium text-[#5b6d81]">
          Marco Horizonte
        </span>
        <span className="ml-auto shrink-0 pl-2">
          <Exemplo />
        </span>
      </div>

      <div className="p-5 sm:p-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[0.75rem] font-bold uppercase tracking-[0.12em] text-[#5b6d81]">
              Meta
            </p>
            <p className="nv-numero whitespace-nowrap mt-1 text-[1.75rem] text-[#0a1521]">
              R$ 1,2 mi
            </p>
          </div>
          <div className="text-right">
            <p className="text-[0.75rem] font-bold uppercase tracking-[0.12em] text-[#5b6d81]">
              Chega em
            </p>
            <p className="nv-numero whitespace-nowrap mt-1 text-[1.75rem] text-[#17789c]">2041</p>
          </div>
        </div>

        <div className="relative mt-5 overflow-hidden rounded-[16px] bg-[#f4f8fb] p-4">
          <svg viewBox="0 0 300 110" className="w-full">
            <defs>
              <linearGradient id="nv-curva" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2596be" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#2596be" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M6 100 C 90 96, 150 72, 200 46 S 272 12, 294 8 L 294 104 L 6 104 Z"
              fill="url(#nv-curva)"
            />
            <path
              d="M6 100 C 90 96, 150 72, 200 46 S 272 12, 294 8"
              fill="none"
              stroke="#2596be"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <circle cx="294" cy="8" r="5" fill="#0b1626" />
            <circle cx="294" cy="8" r="2" fill="#6dc6e6" />
          </svg>

          <div className="mt-1 flex justify-between text-[0.75rem] font-semibold text-[#5b6d81]">
            <span>hoje</span>
            <span>2041</span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 rounded-[14px] border border-[#e3eaf2] px-4 py-3">
          <p className="text-[0.8125rem] font-medium tracking-[-0.015em] text-[#46586e]">
            Para chegar lá, guardando por mês
          </p>
          <p className="nv-numero whitespace-nowrap shrink-0 text-[1.125rem] text-[#0a1521]">
            R$ 1.840
          </p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ 7 --- */

/**
 * O PAINEL DO FIN CASH: a maquete da promessa do herói.
 *
 * ┌── POR QUE ELA EXISTE, E POR QUE É ELA QUE ABRE A PÁGINA ──────────────┐
 * │ A headline promete UM número, "quanto você pode gastar hoje sem      │
 * │ estourar o mês". Se o cartão ao lado da headline mostrar outra coisa  │
 * │ — uma nota de saúde, um gráfico bonito — a promessa vira adjetivo na  │
 * │ primeira dobra, que é exatamente onde ela precisa ser verificável.    │
 * │                                                                        │
 * │ Os números são os da conta de demonstração, os mesmos de `CONTA` em   │
 * │ `hub-lp.ts`: 2.392 já na conta, +600 a entrar, −1.926 com dono,       │
 * │ 1.066 de sobra. A subtração fecha, e fecha de propósito: alguém vai   │
 * │ conferir.                                                              │
 * └────────────────────────────────────────────────────────────────────────┘
 */
export function MaqueteFinCash() {
  const comprometida = 86;

  return (
    <div className="relative w-full max-w-[27rem]">
      <div
        aria-hidden
        className="overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-[0_40px_90px_-38px_rgba(10,21,33,0.55)]"
      >
        {/* cabeçalho */}
        <div className="flex items-center gap-3 border-b border-[#eef2f7] px-6 py-4">
          <span className="grid h-10 w-10 place-items-center rounded-[13px] bg-[#0b1626] text-[#6dc6e6]">
            <Wallet className="h-[18px] w-[18px]" strokeWidth={1.9} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[0.9375rem] font-semibold tracking-[-0.018em] text-[#0a1521]">
              Setembro
            </p>
            <p className="text-[0.75rem] font-medium tracking-[-0.01em] text-[#5b6d81]">
              se nada mudar, o mês fecha assim
            </p>
          </div>
          {/* Abaixo de 400px o selo espremia o subtítulo numa coluna de uma
              palavra por linha; ali ele desce para a linha do número. */}
          <span className="hidden shrink-0 min-[400px]:block">
            <Exemplo />
          </span>
        </div>

        {/* O NÚMERO. Ele é o produto inteiro, e por isso ocupa o corpo que
            ocupa: reduzir aqui é enfraquecer a promessa da headline. */}
        <div className="px-6 pt-6">
          <div className="flex items-center justify-between gap-3">
            <p className="whitespace-nowrap text-[0.75rem] font-bold uppercase tracking-[0.1em] text-[#5b6d81]">
              Livre até o dia 30
            </p>
            <span className="shrink-0 min-[400px]:hidden">
              <Exemplo />
            </span>
          </div>
          <p className="nv-numero whitespace-nowrap mt-1.5 text-[3rem] leading-none text-[#0a1521]">
            R$ 1.066
          </p>
          <p className="mt-2 text-[0.875rem] font-medium leading-snug tracking-[-0.015em] text-[#46586e]">
            É o que sobra depois do que já saiu e do que ainda vai sair.
          </p>

          {/* a régua do comprometimento */}
          <div className="mt-5">
            <div className="flex items-baseline justify-between">
              <p className="text-[0.75rem] font-semibold tracking-[-0.01em] text-[#5b6d81]">
                Da renda já comprometida
              </p>
              <p className="text-[0.875rem] font-bold tabular-nums text-[#a53a12]">
                {comprometida}%
              </p>
            </div>
            <span className="mt-2 block h-2 w-full overflow-hidden rounded-full bg-[#eef2f7]">
              <span
                className="block h-full rounded-full bg-[#c9491a]"
                style={{ width: comprometida + "%" }}
              />
            </span>
          </div>
        </div>

        {/* a conta, em três linhas */}
        <ul className="mt-5 space-y-2 px-6">
          {[
            { t: "Já entrou e saiu", v: "R$ 2.392", tom: "text-[#46586e]" },
            { t: "Ainda entra", v: "+ R$ 600", tom: "text-[#1f7a4d]" },
            { t: "Ainda vai sair", v: "− R$ 1.926", tom: "text-[#a53a12]" },
          ].map((l) => (
            <li
              key={l.t}
              className="flex items-center gap-2.5 rounded-[12px] bg-[#f7f9fb] px-3.5 py-2.5"
            >
              <span className="min-w-0 flex-1 truncate text-[0.875rem] font-medium tracking-[-0.015em] text-[#46586e]">
                {l.t}
              </span>
              <span
                className={`shrink-0 text-[0.875rem] font-semibold tabular-nums ${l.tom}`}
              >
                {l.v}
              </span>
            </li>
          ))}
        </ul>

        {/* o aviso: o app fala antes, não depois */}
        <div className="mt-5 flex items-center gap-2.5 bg-[#0b1626] px-6 py-3.5">
          <AlertTriangle
            className="h-4 w-4 shrink-0 text-[#f0a35f]"
            strokeWidth={2.2}
          />
          <p className="text-[0.875rem] font-semibold tracking-[-0.015em] text-white">
            2 contas venceram sem pagamento · R$ 533
          </p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ 8 --- */

/**
 * O trabalho do primeiro dia: o que se repete, cadastrado uma vez.
 *
 * A maquete existe para provar a frase mais importante da seção de esforço,
 * "feito uma vez, vale para todos os meses". Por isso cada linha traz o DIA
 * do mês, e não só o valor: é o dia que faz a conta voltar sozinha.
 */
export function MaqueteContasFixas() {
  const contas = [
    { t: "Aluguel", d: "todo dia 5", v: "R$ 1.850" },
    { t: "Escola", d: "todo dia 10", v: "R$ 740" },
    { t: "Internet", d: "todo dia 15", v: "R$ 129" },
    { t: "Streaming", d: "todo dia 20", v: "R$ 39,90" },
  ];

  return (
    <div aria-hidden className="nv-janela w-full">
      <div className="nv-janela-barra">
        <span className="nv-janela-ponto" />
        <span className="nv-janela-ponto" />
        <span className="nv-janela-ponto" />
        <span className="ml-2 text-[0.75rem] font-semibold tracking-[-0.01em] text-[#5b6d81]">
          Contas que se repetem
        </span>
      </div>

      <div className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-[0.75rem] font-bold uppercase tracking-[0.1em] text-[#5b6d81]">
            Cadastradas uma vez
          </p>
          <Exemplo />
        </div>

        <ul className="mt-4 space-y-2">
          {contas.map((c) => (
            <li
              key={c.t}
              className="flex items-center gap-3 rounded-[12px] border border-[#eef2f7] px-3.5 py-2.5"
            >
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[9px] bg-[#dcecf8] text-[#17789c]">
                <Repeat className="h-3.5 w-3.5" strokeWidth={2.2} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[0.875rem] font-semibold tracking-[-0.015em] text-[#0a1521]">
                  {c.t}
                </span>
                <span className="block text-[0.75rem] font-medium tracking-[-0.01em] text-[#5b6d81]">
                  {c.d}
                </span>
              </span>
              <span className="shrink-0 text-[0.875rem] font-semibold tabular-nums text-[#46586e]">
                {c.v}
              </span>
            </li>
          ))}
        </ul>

        <p className="mt-5 flex items-center gap-2.5 rounded-[12px] bg-[#f2f6fa] px-3.5 py-3 text-[0.8125rem] font-semibold tracking-[-0.015em] text-[#46586e]">
          <CalendarClock className="h-4 w-4 shrink-0 text-[#17789c]" strokeWidth={2} />
          Outubro já abre com as quatro preenchidas
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ 9 --- */

/**
 * O lançamento do dia a dia, e a razão de ele caber em segundos: uma compra
 * em 12x entra INTEIRA. A maquete mostra a primeira parcela gravada e as
 * outras onze nascendo com ela, porque é aí que a planilha cobra doze
 * linhas digitadas à mão.
 */
export function MaqueteLancamento() {
  return (
    <div aria-hidden className="nv-janela w-full">
      <div className="nv-janela-barra">
        <span className="nv-janela-ponto" />
        <span className="nv-janela-ponto" />
        <span className="nv-janela-ponto" />
        <span className="ml-2 text-[0.75rem] font-semibold tracking-[-0.01em] text-[#5b6d81]">
          Novo lançamento
        </span>
      </div>

      <div className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-[0.75rem] font-bold uppercase tracking-[0.1em] text-[#5b6d81]">
            Compra no cartão
          </p>
          <Exemplo />
        </div>

        <p className="nv-numero whitespace-nowrap mt-3 text-[2rem] leading-none text-[#0a1521]">
          R$ 2.400
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {["Eletrodomésticos", "Cartão final 4417", "12x de R$ 200"].map((t) => (
            <span
              key={t}
              className="rounded-full bg-[#f2f6fa] px-3 py-1.5 text-[0.75rem] font-semibold tracking-[-0.01em] text-[#46586e]"
            >
              {t}
            </span>
          ))}
        </div>

        {/* as doze parcelas, nascendo de uma vez */}
        <div className="mt-5">
          <p className="text-[0.75rem] font-semibold tracking-[-0.01em] text-[#5b6d81]">
            Entram na linha do tempo
          </p>
          <div className="mt-2.5 flex items-end gap-1.5">
            {Array.from({ length: 12 }, (_, i) => (
              <span
                key={i}
                className={`block flex-1 rounded-t-[4px] ${
                  i === 0 ? "bg-[#2596be]" : "bg-[#cfe3f0]"
                }`}
                style={{ height: (i === 0 ? 34 : 26) + "px" }}
              />
            ))}
          </div>
          <div className="mt-1.5 flex justify-between text-[0.6875rem] font-semibold text-[#5b6d81]">
            <span>set</span>
            <span>ago</span>
          </div>
        </div>

        <p className="mt-5 flex items-center gap-2.5 rounded-[12px] bg-[#f2f6fa] px-3.5 py-3 text-[0.8125rem] font-semibold tracking-[-0.015em] text-[#46586e]">
          <Check className="h-4 w-4 shrink-0 text-[#1f7a4d]" strokeWidth={3} />
          Doze parcelas gravadas em um toque
        </p>
      </div>
    </div>
  );
}
