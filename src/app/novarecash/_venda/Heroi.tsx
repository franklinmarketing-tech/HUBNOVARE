import { ArrowRight, Bell, CalendarClock, Check, ChevronDown, Clock, CreditCard, HandCoins, MessageCircle, RotateCcw, ShieldCheck, Sparkles, Target } from "lucide-react";
import { MarcaNovareCash } from "@/components/novarecash/MarcaNovareCash";
import { GARANTIA_DIAS, NOVARECASH_NOME, RECURSOS } from "@/lib/novarecash/config";
import { brl, dataBlack, seloCurto } from "@/lib/novarecash/oferta";
import { medirClique } from "@/lib/medir";
import { LegendaExemplo, TelaInicio } from "./TelasExemplo";

/**
 * O HERÓI DA PÁGINA DE VENDA (04/11/2026, "o herói precisa melhorar muito").
 *
 * Tela cheia escura e cinematográfica: luz dourada difusa, grão e camadas. O
 * produto é o protagonista: o celular com a tela Início, em perspectiva, e em
 * volta cartões da interface flutuando, como o app vivo. Tudo é ilustração em
 * HTML com dados de EXEMPLO, e a legenda diz isso.
 *
 * ⚠️ NENHUM NÚMERO DE VENDA NASCE AQUI: preço, riscado, % OFF e prazo chegam
 * por props, vindos de `ofertas()`/`dataBlack()` na página.
 *
 * ⚠️ HONESTIDADE (CDC): o cartão do WhatsApp mostra o selo "Libera em dez/2026"
 * enquanto o recurso não estiver no ar (`seloCurto`, que lê `RECURSOS`). Ligou
 * o WhatsApp em `config.ts`? O selo some sozinho.
 *
 * MOVIMENTO só em CSS (`venda.css`): entrada em sequência (texto, celular,
 * cartões) e os cartões flutuando devagar. Nada de JavaScript no caminho do
 * herói, então ele anima antes mesmo de a página hidratar. Só `transform` e
 * `opacity`, com tamanho reservado (sem salto de layout), e tudo desligado em
 * `prefers-reduced-motion`.
 */

const ZAP = RECURSOS.find((r) => r.chave === "whatsapp");
/** "Libera em dez/2026" enquanto o WhatsApp não estiver no ar; `null` quando estiver. */
const SELO_ZAP = ZAP ? seloCurto(ZAP) : null;

type Props = {
  /** O preço cheio do MENOR plano, para riscar (só com a Black aberta). */
  cheio: number | null;
  /** O preço de agora do MENOR plano, por mês ("a partir de"). `null` = nada à venda: o bloco de preço não aparece. */
  desde: number | null;
  desconto: number | null;
  black: boolean;
  /** O texto do botão, o mesmo da página inteira (`textoCompra`). */
  textoCta: string;
  /** O chapéu: a campanha, quando aberta, ou "Novo app da Novare". */
  chapeu: string;
  /** A ressalva do que ainda não está no ar (banco e WhatsApp), já com o "até lá". */
  aviso: string | null;
  totalRecursos: number;
  /** Há a faixa da campanha acima do cabeçalho? Ela entra na conta da altura. */
  comFaixa: boolean;
};

const atraso = (ms: number) => ({ "--d": `${ms}ms` }) as React.CSSProperties;

export function Heroi({ cheio, desde, desconto, black, textoCta, chapeu, aviso, totalRecursos, comFaixa }: Props) {
  return (
    <section
      className={`ncv-heroi relative isolate overflow-hidden text-white ${
        comFaixa ? "lg:min-h-[calc(100dvh-6.75rem)]" : "lg:min-h-[calc(100dvh-4rem)]"
      } lg:flex lg:items-center`}
    >
      <Atmosfera />

      <div className="relative mx-auto grid w-full max-w-[80rem] items-center gap-6 px-4 pb-14 pt-5 sm:px-6 sm:pt-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-8 lg:py-10">
        {/* ── O texto e a oferta ── */}
        <div className="max-w-[40rem]">
          <div className="ncv-entra flex flex-wrap items-center gap-x-4 gap-y-3" style={atraso(0)}>
            <MarcaNovareCash tamanho="md" />
            <span className="hidden items-center gap-1.5 rounded-full bg-ouro/10 px-3 py-1 text-2xs font-semibold text-ouro ring-1 ring-ouro/25 sm:inline-flex">
              <Sparkles className="h-3.5 w-3.5" />
              {chapeu}
            </span>
          </div>

          <h1
            className="ncv-entra mt-4 font-display text-[2.15rem] font-semibold leading-[1.04] tracking-[-0.04em] sm:mt-5 sm:text-[2.75rem] xl:text-[3rem]"
            style={atraso(80)}
          >
            Seu dinheiro organizado por <span className="ncv-ouro-texto">quem não vende nada.</span>
          </h1>

          <p className="ncv-entra mt-3 max-w-[34rem] text-[0.95rem] leading-relaxed text-white/75 sm:mt-5 sm:text-[1.0625rem]" style={atraso(160)}>
            Extrato, cartões, contas a pagar, orçamento e metas num app só, com uma IA que responde olhando os seus
            números.
          </p>
          {aviso && (
            <p className="ncv-entra mt-2.5 flex max-w-[34rem] items-start gap-2 text-xs leading-relaxed text-white/70" style={atraso(200)}>
              <Clock className="mt-[0.2rem] h-3.5 w-3.5 shrink-0 text-ouro" />
              <span>{aviso}</span>
            </p>
          )}

          {desde != null && (
            <div className="ncv-entra ncv-vidro mt-5 rounded-[1.75rem] px-4 py-3.5 sm:px-5 sm:py-4" style={atraso(260)}>
              <div className="flex items-center justify-between gap-3">
                {/* 05/11/2026: três planos — o preço aqui é o do MENOR, então "a partir de". */}
                <p className="text-sm text-white/70">
                  {cheio != null ? (
                    <>
                      Planos a partir de <s className="decoration-accent-claro/80">{brl(cheio)}</s> por
                    </>
                  ) : (
                    "Planos mensais a partir de"
                  )}
                </p>
                {desconto != null && (
                  <span className="rounded-full bg-accent-btn px-2.5 py-0.5 text-xs font-bold text-white">{desconto}% OFF</span>
                )}
              </div>
              <p className="mt-0.5 flex items-baseline gap-1.5">
                <strong className="font-display text-[2.6rem] font-bold leading-[1.1] tracking-[-0.045em] text-white tabular-nums sm:text-5xl">
                  {brl(desde)}
                </strong>
                <span className="text-sm text-white/70">/mês</span>
              </p>
              {black && cheio != null && (
                <p className="mt-2 flex items-start gap-1.5 border-t border-white/10 pt-2 text-xs font-semibold text-ouro">
                  <CalendarClock className="mt-[0.2rem] h-3.5 w-3.5 shrink-0" />
                  O menor preço do {NOVARECASH_NOME}, só até {dataBlack("fim")}.
                </p>
              )}
            </div>
          )}

          <div className="ncv-entra mt-4 flex flex-col gap-3 sm:mt-5 sm:flex-row sm:items-center" style={atraso(340)}>
            <a href="#planos" {...medirClique("venda:heroi")} className="btn-cp cta-halo cta-varredura min-h-12 w-full px-7 text-[0.95rem] sm:w-auto">
              {textoCta}
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#recursos"
              className="hidden min-h-11 items-center justify-center gap-1.5 rounded-full px-3 text-sm font-semibold text-white/80 transition-colors hover:text-white sm:inline-flex"
            >
              Ver os {totalRecursos} recursos
              <ChevronDown className="h-4 w-4" />
            </a>
          </div>

          <ul className="ncv-entra mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/75" style={atraso(400)}>
            <li className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 shrink-0 text-ouro" />
              {GARANTIA_DIAS} dias de garantia
            </li>
            <li className="flex items-center gap-1.5">
              <RotateCcw className="h-4 w-4 shrink-0 text-ouro" />
              Cancela quando quiser
            </li>
            <li className="flex items-center gap-1.5">
              <HandCoins className="h-4 w-4 shrink-0 text-ouro" />
              Zero comissão
            </li>
          </ul>
        </div>

        {/* ── O produto ── */}
        <div className="pt-6 lg:pt-0">
          <Palco />
          <LegendaExemplo className="mt-3" />
        </div>
      </div>
    </section>
  );
}

/** A luz e a textura do fundo: tudo decorativo, parado (nada aqui anima). */
function Atmosfera() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      <div className="ncv-luz absolute inset-0" />
      <div className="ncv-feixe absolute inset-0" />
      <div className="ncv-grao absolute inset-0" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(to_bottom,transparent,hsl(203_100%_2%/0.55))]" />
    </div>
  );
}

/** Um cartão flutuante: a entrada (fora) e a flutuação (dentro) em elementos separados, para não brigarem pelo `transform`. */
function Flutuante({
  className,
  entrada,
  periodo,
  fase,
  amplitude = -8,
  children,
}: {
  className: string;
  entrada: number;
  periodo: number;
  fase: number;
  amplitude?: number;
  children: React.ReactNode;
}) {
  return (
    <div className={`ncv-cartao-entra absolute ${className}`} style={atraso(entrada)}>
      <div
        className="ncv-flutua"
        style={{ "--t": `${periodo}s`, "--fd": `${fase}s`, "--amp": `${amplitude}px` } as React.CSSProperties}
      >
        <div className="ncv-cartao rounded-2xl px-3.5 py-3 text-white">{children}</div>
      </div>
    </div>
  );
}

/**
 * O palco: o celular em perspectiva e os cartões em volta. Tamanho FIXO por
 * faixa de tela (nada depende de conteúdo carregar), então nada pula.
 * No celular entram só 3 cartões, para não esconder a tela nem estourar a largura.
 */
function Palco() {
  const descricao = [
    "Ilustração com dados de exemplo: a tela Início do NovareCash num celular, com a sobra do mês e o orçamento por categoria.",
    "Em volta, avisos do app: uma assinatura que ficou mais cara, a fatura do cartão que fecha em 3 dias, uma meta de viagem em 63% e uma resposta curta da IA.",
    SELO_ZAP
      ? `Também aparece um gasto lançado pelo WhatsApp, recurso que ainda não funciona: ${SELO_ZAP.toLowerCase()}${ZAP?.liberaEm ? ` (${ZAP.liberaEm})` : ""}.`
      : "Também aparece um gasto lançado pelo WhatsApp.",
  ].join(" ");

  return (
    <div role="img" aria-label={descricao} className="relative mx-auto h-[604px] w-full max-w-[340px] sm:h-[628px] sm:max-w-[540px]">
      {/* O chão de luz debaixo do aparelho: dá peso e profundidade. */}
      <div aria-hidden className="ncv-chao absolute bottom-0 left-1/2 h-20 w-[78%] -translate-x-1/2" />
      <div aria-hidden className="ncv-aura absolute left-1/2 top-1/2 h-[118%] w-[118%] -translate-x-1/2 -translate-y-1/2" />

      {/* A meta fica ATRÁS do celular (camada do fundo), só no computador. */}
      <Flutuante className="bottom-[88px] left-[-1%] z-0 hidden w-[196px] opacity-90 sm:block" entrada={1100} periodo={11} fase={-3} amplitude={-6}>
        <p className="flex items-center gap-1.5 text-[11px] font-semibold text-white/80">
          <Target className="h-3.5 w-3.5 text-ouro" />
          Viagem de julho
        </p>
        <p className="mt-1.5 text-[12px] font-semibold tabular-nums">
          R$ 3.150 <span className="font-normal text-white/60">de R$ 5.000</span>
        </p>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-[63%] rounded-full bg-[linear-gradient(90deg,hsl(36_78%_48%),hsl(42_74%_62%))]" />
        </div>
        <p className="mt-1 text-right text-[10px] text-white/60">63% da meta</p>
      </Flutuante>

      {/* O celular. */}
      <div className="ncv-celular-entra absolute left-1/2 top-16 z-10 h-[492px] w-[232px] -translate-x-1/2 sm:top-9 sm:h-[572px] sm:w-[270px]">
        <div className="ncv-celular-3d h-full w-full">
          <TelaInicio />
        </div>
      </div>

      {/* WhatsApp: em cima, à esquerda. Com o selo da data enquanto não estiver no ar. */}
      <Flutuante className="left-0 top-0 z-20 w-[176px] sm:left-[-2%] sm:w-[200px]" entrada={650} periodo={9} fase={0}>
        <p className="flex items-center justify-between gap-2 text-[10px] font-semibold text-white/75">
          <span className="flex items-center gap-1">
            <MessageCircle className="h-3.5 w-3.5 text-emerald-300" />
            <span className={SELO_ZAP ? "hidden sm:inline" : ""}>WhatsApp</span>
          </span>
          {SELO_ZAP && (
            <span className="whitespace-nowrap rounded-full bg-ciano-claro/15 px-1.5 py-px text-[9.5px] font-bold text-ciano-claro ring-1 ring-ciano-claro/40">
              {SELO_ZAP}
            </span>
          )}
        </p>
        <p className="ml-auto mt-2 w-fit rounded-xl rounded-br-sm bg-emerald-400/20 px-2.5 py-1.5 text-[11.5px] text-white">
          gastei 45 no mercado
        </p>
        <p className="mt-1.5 flex w-fit items-center gap-1 rounded-xl rounded-bl-sm bg-white/[0.08] px-2.5 py-1.5 text-[11px] text-white/90">
          <Check className="h-3 w-3 shrink-0 text-emerald-300" />
          Mercado, R$ 45,00
        </p>
      </Flutuante>

      {/* Alerta: meio, à direita. */}
      <Flutuante className="right-0 top-[328px] z-20 w-[172px] sm:right-[-3%] sm:top-[112px] sm:w-[210px]" entrada={800} periodo={10} fase={-2.5}>
        <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-accent-claro">
          <Bell className="h-3.5 w-3.5" />
          Alerta
        </p>
        <p className="mt-1 text-[12.5px] font-semibold leading-snug">Assinatura ficou mais cara</p>
        <p className="mt-0.5 text-[11px] leading-snug text-white/70">
          Streaming: de R$ 39,90 para <span className="text-white">R$ 44,90</span>
        </p>
        <p className="mt-1.5 text-[10.5px] font-semibold text-ouro">+ R$ 60 por ano</p>
      </Flutuante>

      {/* Fatura: embaixo, à direita, só no computador. */}
      <Flutuante className="bottom-[132px] right-[-2%] z-20 hidden w-[190px] sm:block" entrada={950} periodo={12} fase={-6}>
        <p className="flex items-center gap-1.5 text-[11px] font-semibold text-white/80">
          <CreditCard className="h-3.5 w-3.5 text-ouro" />
          Fatura fecha em 3 dias
        </p>
        <p className="mt-1 text-[1.05rem] font-semibold tabular-nums tracking-[-0.02em]">R$ 1.284,30</p>
        <p className="text-[10.5px] text-white/65">até agora, vence dia 10</p>
      </Flutuante>

      {/* IA: embaixo, à esquerda. */}
      <Flutuante className="bottom-0 left-0 z-20 w-[196px] sm:left-[20%] sm:w-[236px]" entrada={1250} periodo={9.5} fase={-4.5}>
        <p className="ml-auto w-fit rounded-xl rounded-br-sm bg-white/10 px-2.5 py-1 text-[11px] text-white/90">
          Posso gastar R$ 300 no sábado?
        </p>
        <div className="mt-1.5 rounded-xl rounded-bl-sm bg-ouro/12 px-2.5 py-1.5 ring-1 ring-ouro/25">
          <p className="flex items-center gap-1 text-[9.5px] font-semibold text-ouro">
            <Sparkles className="h-3 w-3" />
            IA do {NOVARECASH_NOME}
          </p>
          <p className="mt-0.5 text-[11px] leading-snug text-white/90">Pode. Depois do passeio, ainda sobram R$ 920 no mês.</p>
        </div>
      </Flutuante>
    </div>
  );
}
