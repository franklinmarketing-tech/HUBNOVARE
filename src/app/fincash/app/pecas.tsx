"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Sparkles, type LucideIcon } from "lucide-react";

/**
 * As peças do FINCASH.
 *
 * POR QUE UM ARQUIVO PRÓPRIO, E NÃO AS PEÇAS DO PLANEJAMENTO
 * As duas casas partilham a marca, não o problema. A trilha do Planejamento é
 * percorrida uma vez e pode se dar ao luxo do emblema 3D e do halo; o
 * FINCASH é aberto todo dia, muitas vezes em pé, no celular, para resolver
 * uma pergunta só ("posso gastar?"). Aqui o que vale é DENSIDADE: caber mais
 * informação verdadeira na mesma tela sem ela virar planilha.
 *
 * O que serve lá é reaproveitado direto — `brl` é reexportado logo abaixo em
 * vez de reescrito. O que nasce aqui é o que a trilha não tem: anel, medidor,
 * faixa de grupo, barras mês a mês e pastilha de status.
 *
 * REGRA DE COR DESTE APP (a que os concorrentes não têm)
 * — ciano  = informação, o estado das coisas;
 * — laranja = ação e saída de dinheiro;
 * — navy   = síntese, o número que resume;
 * — verde/amarelo/vermelho só aparecem como JULGAMENTO (dentro, perto, passou).
 * Sem essa separação todo painel financeiro vira semáforo, e aí nada chama
 * atenção porque tudo chama.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * O QUE MUDOU NA REVISÃO VISUAL (leia antes de aplicar nas suas telas)
 * ══════════════════════════════════════════════════════════════════════════
 * Nenhum nome saiu e nenhuma prop obrigatória nasceu — o que já estava escrito
 * continua compilando e desenhando igual, tirando os ajustes de acabamento
 * listados abaixo. O resto é adição opcional.
 *
 * MUDANÇAS DE COMPORTAMENTO PADRÃO (as que aparecem sem você pedir):
 * 1. `Bloco`, `CartaoNumero` e afins passaram a usar a sombra da casa via
 *    `var(--fin-sombra-card)` (definida em `fincash.css`, importado pelo
 *    layout do app). Se você escrevia a sombra à mão na sua tela, APAGUE —
 *    duas receitas de sombra na mesma página é o que faz parecer montada por
 *    duas pessoas.
 * 2. `BotaoAcao` agora tem `min-h-11` (44px). Botão de 42px passa em teste e
 *    erra no dedo.
 * 3. `Pastilha` ficou com `min-h-6` e um pouco mais de respiro. Quando ela
 *    for CLICÁVEL, passe `tamanho="toque"` — aí ela vira alvo de 44px.
 * 4. `NavegadorMes` ganhou alvos de 44px nas setas e o nome do mês virou
 *    botão? não: continua texto. Só cresceu a área de toque das setas.
 * 5. `Esqueleto` continua com a mesma assinatura, mas o desenho padrão agora
 *    imita o painel novo (herói + trio + dois blocos). Se a sua tela é uma
 *    lista, passe `forma="lista"`.
 *
 * PEÇAS NOVAS (todas opcionais, use quando servirem):
 * • `NumeroHeroi`   — o número grande com contexto, variação e área lateral.
 * • `CartaoTransacao` — a linha de lançamento (disco colorido + valor + estado).
 * • `CartaoPainel`  — o tijolo da home: cabeçalho leve, ação e corpo livre.
 * • `CartaoAssistente` + `type Dica` — o Fin, a leitura em linguagem humana.
 * • `DiscoIcone`    — o disco colorido de ícone, sozinho.
 * • `BarraCategoria` — a linha nome + valor + barra proporcional.
 * • `BarraComMarca` — barra com um marcador de referência ("o mês está em X%").
 *
 * PROPS NOVAS EM PEÇAS ANTIGAS:
 * • `AnelProgresso`: `sobre`, tons "aviso" e "perigo".
 * • `Medidor`: `sobre`, `compacto`.
 * • `CabecalhoGrupo`: `acao`, tom "info".
 * • `CartaoNumero`: `tamanho`, `barra`, `rodape`.
 * • `Pastilha`: `sobre`, `tamanho`, tom "aviso".
 * • `Bloco`: `tom`, `elevacao`, `interativo`.
 * • `CabecalhoTela`: `Icone`.
 * • `BotaoAcao`: `variante`, `tamanho`, `className`, `rotuloAcessivel`,
 *   `larguraTotal`.
 * • `Esqueleto`: `forma`.
 * • `BarrasMes`: `destaque` (o mês que fica aceso).
 * • `Vazio`: `passos` (o vazio que ENSINA, em vez de só lamentar).
 *
 * `sobre="escuro"` é o modo para uso DENTRO do cartão navy do herói. Não é
 * dark mode: o app é claro, ponto. É só o contraste invertido de uma peça que
 * caiu num fundo escuro.
 */

/* `brl` nasceu no Planejamento e continua morando lá: dinheiro se formata do
   mesmo jeito nos dois produtos, e duas cópias da mesma função é como uma
   delas ganha centavo e a outra não. Reexportado para as telas daqui
   importarem tudo de um endereço só. */
export { brl } from "@/app/planejamento/app/pecas";

/**
 * Dinheiro COM centavos.
 *
 * O `brl` da casa corta os centavos de propósito — em plano de vida, centavo é
 * ruído. No FINCASH não é: o mercado custou R$ 43,90, e ver "R$ 44" na
 * linha que a pessoa acabou de digitar é o tipo de detalhe que faz duvidar do
 * resto dos números.
 *
 * A divisão de trabalho: ITEM leva centavo (é o dado), SÍNTESE não (é a
 * ordem de grandeza — e "R$ 4.312" lê mais rápido que "R$ 4.312,47").
 */
export const brlExato = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** "2026-03" → "mar" — o rótulo curto das colunas do gráfico. */
export const mesCurto = (ref: string) => {
  const [ano, mes] = ref.split("-").map(Number);
  return new Date(ano, mes - 1, 1)
    .toLocaleDateString("pt-BR", { month: "short" })
    .replace(".", "");
};

/** A sombra da casa, num lugar só. Vem de `fincash.css`. */
const SOMBRA = "shadow-[var(--fin-sombra-card)]";

/**
 * O valor sobe de zero quando o desenho entra na tela.
 *
 * Mesmo motivo da `BarraQueEnche`: gráfico já cheio é um fato, que o olho
 * atravessa; gráfico que enche é um acontecimento, que a pessoa acompanha.
 * Num painel de dinheiro, fazer alguém olhar para o próprio número é metade do
 * trabalho.
 *
 * Duas guardas: quem pediu menos movimento recebe o valor final de cara, e o
 * `aria-valuenow` de quem usa as peças aponta sempre para o alvo — leitor de
 * tela não deve ouvir a fração do meio da animação.
 */
function useValorQueEntra<T extends Element>(alvo: number) {
  const [valor, setValor] = useState(0);
  /* Devolvido junto com o valor para quem desenha poder TIRAR a transição —
     não basta pular a animação de entrada se o CSS continua interpolando o
     salto de 0 até o alvo. */
  const [animar, setAnimar] = useState(true);
  const caixa = useRef<T | null>(null);

  useEffect(() => {
    const el = caixa.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setAnimar(false);
      setValor(alvo);
      return;
    }

    const obs = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        obs.disconnect();
        // Um quadro de atraso, senão o navegador já pinta no valor final e a
        // transição não chega a existir.
        requestAnimationFrame(() => setValor(alvo));
      },
      { threshold: 0.35 },
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [alvo]);

  return { valor, caixa, animar };
}

const limitar = (v: number, min = 0, max = 100) =>
  Math.max(min, Math.min(max, Number.isFinite(v) ? v : 0));

/**
 * Fundo suave a partir de uma cor arbitrária.
 *
 * As categorias e as contas guardam a PRÓPRIA cor no banco (o roxo que a
 * pessoa escolheu para "Lazer"), então nenhum token da marca serve. Antes
 * isso virava `background: c.cor` chapado, e um disco 100% saturado ao lado de
 * outro rouba a leitura do texto.
 *
 * `color-mix` resolve sem calcular nada em JS e sem exigir hexadecimal — a cor
 * pode chegar como `#7c3aed`, `rgb()` ou nome, e continua funcionando.
 */
const tintar = (cor: string, pct = 14) =>
  `color-mix(in oklab, ${cor} ${pct}%, white)`;

// ───────────────────────────────────────────────────────────── Anel ─────────

/**
 * Anel de progresso com o número grande no meio.
 *
 * POR QUE ANEL E NÃO BARRA numa meta: barra é régua, mede distância; anel é
 * recipiente, mede QUANTO JÁ ESTÁ DENTRO. Guardar dinheiro é encher um pote —
 * e o pote pela metade convence mais que a régua na metade.
 *
 * O número vive dentro do furo porque ali ele não disputa espaço com nada:
 * é a única coisa que a pessoa lê de longe, e o resto do card pode ser
 * pequeno em paz.
 */
export function AnelProgresso({
  valor,
  rotulo,
  centro,
  legenda,
  tamanho = 132,
  espessura = 11,
  cor,
  tom = "ciano",
  sobre = "claro",
  marca,
  rotuloMarca,
}: {
  /** 0 a 100. Valores fora da faixa são aparados, não desenhados torto. */
  valor: number;
  /** O que este anel mede. Vira o `aria-label` — sem ele o leitor de tela
      anuncia só "76 por cento", e a tela costuma ter mais de um anel. */
  rotulo: string;
  /** Substitui o "76%" do meio quando o número que importa é outro
      (o valor guardado, por exemplo). */
  centro?: string;
  /** A linha pequena embaixo do número, dentro do anel. */
  legenda?: string;
  tamanho?: number;
  espessura?: number;
  /** Cor livre — é o caso das categorias, que já têm cor própria no banco. */
  cor?: string;
  tom?: "ciano" | "accent" | "success" | "primary" | "aviso" | "perigo";
  /** Dentro do cartão navy do herói, o trilho e o texto invertem. */
  sobre?: "claro" | "escuro";
  /** 0 a 100 — onde a meta DEVERIA estar hoje (o ritmo). Um risco no trilho,
      igual ao da `BarraComMarca`: 60% guardados só vira notícia ao lado de "e
      o prazo já correu 80%". */
  marca?: number;
  /** O que o risco significa, para a leitura de tela. */
  rotuloMarca?: string;
}) {
  /* O DESENHO é aparado em 100 (arco não dá volta), o NÚMERO não: quem
     guardou 120% da meta tem de ler 120%, senão o app esconde a boa notícia. */
  const bruto = Math.max(0, Number.isFinite(valor) ? valor : 0);
  const alvo = limitar(bruto);
  const { valor: animado, caixa, animar } = useValorQueEntra<SVGSVGElement>(alvo);

  const r = (tamanho - espessura) / 2;
  const volta = 2 * Math.PI * r;
  const escuro = sobre === "escuro";
  const traco = {
    ciano: escuro ? "stroke-ciano-claro" : "stroke-ciano",
    accent: escuro ? "stroke-accent-claro" : "stroke-accent",
    success: escuro ? "stroke-[hsl(152_60%_60%)]" : "stroke-success",
    primary: escuro ? "stroke-white" : "stroke-primary",
    aviso: escuro ? "stroke-warning-claro" : "stroke-warning",
    perigo: escuro ? "stroke-[hsl(0_80%_68%)]" : "stroke-destructive",
  }[tom];

  return (
    <div className="flex flex-col items-center">
      <svg
        ref={caixa}
        width={tamanho}
        height={tamanho}
        viewBox={`0 0 ${tamanho} ${tamanho}`}
        role="img"
        aria-label={`${rotulo}: ${Math.round(bruto)}%${
          marca !== undefined
            ? `. ${rotuloMarca ?? "Referência"}: ${Math.round(marca)}%`
            : ""
        }`}
        className="shrink-0"
      >
        {/* O trilho começa às 12h (-90°) porque é de onde todo mundo espera
            que um progresso circular saia. */}
        <g transform={`rotate(-90 ${tamanho / 2} ${tamanho / 2})`}>
          <circle
            cx={tamanho / 2}
            cy={tamanho / 2}
            r={r}
            fill="none"
            strokeWidth={espessura}
            className={escuro ? "stroke-white/15" : "stroke-border"}
          />
          <circle
            cx={tamanho / 2}
            cy={tamanho / 2}
            r={r}
            fill="none"
            strokeWidth={espessura}
            strokeLinecap="round"
            stroke={cor}
            className={`${cor ? "" : traco} ${animar ? "transition-[stroke-dasharray] duration-1000 ease-out" : ""}`}
            strokeDasharray={`${(volta * animado) / 100} ${volta}`}
          />

          {/* O que passou de 100% ganha um fio POR DENTRO do anel, em vez de
              uma segunda volta por cima: volta sobreposta some (fica idêntica
              a um anel cheio) e é exatamente a boa notícia que não pode
              sumir. O número no meio continua contando o total. */}
          {bruto > 100 && (
            <circle
              cx={tamanho / 2}
              cy={tamanho / 2}
              r={r - espessura * 0.85}
              fill="none"
              strokeWidth={Math.max(2, espessura * 0.3)}
              strokeLinecap="round"
              stroke={cor}
              className={cor ? "" : traco}
              strokeDasharray={`${(2 * Math.PI * (r - espessura * 0.85) * limitar(bruto - 100)) / 100} ${2 * Math.PI * (r - espessura * 0.85)}`}
            />
          )}

          {/* O risco do ritmo. Atravessa a espessura inteira do trilho — ponto
              sumiria justamente quando cai sobre a ponta do arco, que é o caso
              interessante. */}
          {marca !== undefined && (
            <line
              x1={tamanho / 2 + (r - espessura / 2 - 2) * Math.cos((limitar(marca) / 100) * 2 * Math.PI)}
              y1={tamanho / 2 + (r - espessura / 2 - 2) * Math.sin((limitar(marca) / 100) * 2 * Math.PI)}
              x2={tamanho / 2 + (r + espessura / 2 + 2) * Math.cos((limitar(marca) / 100) * 2 * Math.PI)}
              y2={tamanho / 2 + (r + espessura / 2 + 2) * Math.sin((limitar(marca) / 100) * 2 * Math.PI)}
              strokeWidth={2}
              strokeLinecap="round"
              className={escuro ? "stroke-white" : "stroke-primary"}
            />
          )}
        </g>

        <text
          x="50%"
          y={legenda ? "47%" : "52%"}
          textAnchor="middle"
          dominantBaseline="middle"
          className={`font-display font-semibold tabular-nums ${escuro ? "fill-white" : "fill-primary"}`}
          style={{ fontSize: tamanho * (centro && centro.length > 4 ? 0.19 : 0.27) }}
        >
          {centro ?? `${Math.round(bruto)}%`}
        </text>
        {legenda && (
          <text
            x="50%"
            y="66%"
            textAnchor="middle"
            dominantBaseline="middle"
            className={escuro ? "fill-white/65" : "fill-muted-foreground"}
            style={{ fontSize: tamanho * 0.095 }}
          >
            {legenda}
          </text>
        )}
      </svg>
      <p
        className={`mt-1.5 max-w-[10rem] text-center text-2xs leading-snug ${escuro ? "text-white/70" : "text-muted-foreground"}`}
      >
        {rotulo}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────── Medidor ────────

/**
 * Onde o ponteiro cai muda o julgamento — e a cor do arco junto.
 *
 * O corte é 85% e não 90%: comprometer 85 da renda já é um mês sem folga
 * nenhuma para imprevisto, e avisar só aos 90 é avisar tarde.
 *
 * As duas famílias existem porque o mesmo verde que passa na WCAG sobre branco
 * some sobre o navy do herói. É o mesmo julgamento, dita em duas vozes.
 */
function faixaDo(valor: number, escuro: boolean) {
  if (valor >= 100)
    return escuro
      ? { arco: "stroke-[hsl(0_80%_68%)]", numero: "fill-[hsl(0_90%_82%)]" }
      : { arco: "stroke-destructive", numero: "fill-destructive" };
  if (valor >= 85)
    return escuro
      ? { arco: "stroke-warning", numero: "fill-warning-claro" }
      : { arco: "stroke-warning", numero: "fill-accent-strong" };
  return escuro
    ? { arco: "stroke-[hsl(152_60%_58%)]", numero: "fill-white" }
    : { arco: "stroke-success", numero: "fill-primary" };
}

/**
 * Medidor de arco — o "grau de comprometimento da renda".
 *
 * POR QUE VELOCÍMETRO E NÃO MAIS UMA BARRA
 * Barra responde "quanto"; velocímetro responde "quanto DE QUANTO PODE". A
 * pessoa não precisa saber que comprometeu 92% da renda — precisa sentir que
 * está no fim da escala. O ponteiro perto do vermelho faz isso sem uma linha
 * de texto.
 *
 * A escala é fixa em 0–100% de propósito. Medidor que se reescala conforme o
 * dado mente: o ponteiro fica sempre no meio e nunca assusta ninguém.
 */
export function Medidor({
  valor,
  rotulo,
  legenda,
  sobre = "claro",
  compacto = false,
}: {
  /** 0 a 100. Acima de 100 o ponteiro encosta no fim — e fica vermelho. */
  valor: number;
  rotulo: string;
  legenda?: string;
  /** Dentro do cartão navy do herói. */
  sobre?: "claro" | "escuro";
  /** Sem a legenda de baixo e com o rótulo miúdo — para caber ao lado do
      número-herói no celular sem empurrar nada. */
  compacto?: boolean;
}) {
  /* Igual ao anel: o ponteiro para no fim da escala, o número continua
     contando. Comprometer 130% da renda é a informação mais importante do
     painel — arredondar para 100% seria esconder justamente ela. */
  const bruto = Math.max(0, Number.isFinite(valor) ? valor : 0);
  const alvo = limitar(bruto);
  const { valor: animado, caixa, animar } = useValorQueEntra<SVGSVGElement>(alvo);
  const escuro = sobre === "escuro";
  const faixa = faixaDo(bruto, escuro);

  // Semicírculo de raio 78 centrado em (100, 100): o arco vai de 22 a 178.
  const R = 78;
  const arco = Math.PI * R;

  return (
    <div className="flex flex-col items-center">
      <svg
        ref={caixa}
        viewBox="0 0 200 118"
        className={`w-full ${compacto ? "max-w-[11.5rem]" : "max-w-[15rem]"}`}
        role="meter"
        aria-label={rotulo}
        aria-valuenow={Math.round(bruto)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={`${Math.round(bruto)}% — ${rotulo}`}
      >
        <path
          d={`M 22 100 A ${R} ${R} 0 0 1 178 100`}
          fill="none"
          strokeWidth={14}
          strokeLinecap="round"
          className={escuro ? "stroke-white/15" : "stroke-border"}
        />
        <path
          d={`M 22 100 A ${R} ${R} 0 0 1 178 100`}
          fill="none"
          strokeWidth={14}
          strokeLinecap="round"
          strokeDasharray={`${(arco * animado) / 100} ${arco}`}
          className={`${faixa.arco} ${animar ? "transition-[stroke-dasharray] duration-1000 ease-out" : ""}`}
        />

        {/* Entalhes em 85% e 100%: as duas fronteiras do julgamento viram
            MARCAS NA ESCALA, e não só uma troca de cor do arco. Quem não
            distingue o verde do amarelo passa a ver o ponteiro cruzar um
            traço — que é a mesma informação, dita por forma. */}
        {[85, 100].map((t) => {
          const ang = Math.PI * (1 - t / 100);
          return (
            <line
              key={t}
              x1={100 + (R - 9) * Math.cos(ang)}
              y1={100 - (R - 9) * Math.sin(ang)}
              x2={100 + (R + 9) * Math.cos(ang)}
              y2={100 - (R + 9) * Math.sin(ang)}
              strokeWidth={t === 100 ? 2 : 1.5}
              strokeLinecap="round"
              className={escuro ? "stroke-white/45" : "stroke-primary/40"}
            />
          );
        })}

        {/* O ponteiro é um pino, não uma agulha do centro: agulha comprida num
            arco de 200px de largura vira risco atravessando o número.

            Ele anda GIRANDO em torno do centro, e não mudando cx/cy: `cx` é
            atributo de SVG e o navegador não interpola atributo — o pino
            pularia para o fim enquanto o arco ainda enche. `transform` o CSS
            anima. */}
        <g
          style={{
            transform: `rotate(${(animado / 100) * 180}deg)`,
            transformOrigin: "100px 100px",
            transition: animar ? "transform 1s ease-out" : undefined,
          }}
        >
          <circle
            cx={22}
            cy={100}
            r={7}
            /* Branco com anel navy: lê como pino nos dois fundos — sobre o
               branco é o anel que aparece, sobre o navy é o miolo. */
            className="fill-white stroke-primary"
            strokeWidth={3}
          />
        </g>

        <text
          x="18"
          y="114"
          className={escuro ? "fill-white/50" : "fill-muted-foreground"}
          style={{ fontSize: 9 }}
        >
          0%
        </text>
        <text
          x="182"
          y="114"
          textAnchor="end"
          className={escuro ? "fill-white/50" : "fill-muted-foreground"}
          style={{ fontSize: 9 }}
        >
          100%
        </text>

        <text
          x="100"
          y="86"
          textAnchor="middle"
          className={`font-display font-semibold tabular-nums ${faixa.numero}`}
          style={{ fontSize: 34 }}
        >
          {Math.round(bruto)}%
        </text>
      </svg>

      <p
        className={`mt-1 text-center font-medium ${compacto ? "text-2xs" : "text-xs"} ${escuro ? "text-white/75" : "text-primary"}`}
      >
        {rotulo}
      </p>
      {legenda && !compacto && (
        <p
          className={`mt-0.5 max-w-xs text-center text-2xs leading-snug ${escuro ? "text-white/55" : "text-muted-foreground"}`}
        >
          {legenda}
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────── Cabeçalho de grupo ─────

const TOM_GRUPO = {
  /** Ciano escuro: dinheiro entrando é informação, não ação. */
  entrada: "bg-ciano-forte",
  /** O laranja que carrega texto branco (44%). O de 55% reprova na WCAG. */
  saida: "bg-accent-btn",
  reserva: "bg-primary",
  neutro: "bg-primary-soft",
  /** Mesmo ciano da entrada, com outro nome — nem toda faixa ciano é dinheiro
      entrando ("Seus cartões", "Os últimos seis meses"). Chamar de `entrada` o
      que não é entrada é como um dia alguém troca a cor e quebra as duas. */
  info: "bg-ciano-forte",
} as const;

export type TomGrupo = keyof typeof TOM_GRUPO;

/**
 * A faixa colorida que separa grupos dentro de uma tabela.
 *
 * É o truque de acabamento que a concorrência acertou: em vez de cards soltos
 * para Receitas, Despesas e Reservas, UMA tabela contínua com faixas coloridas
 * dividindo os blocos. Cabe muito mais linha na mesma altura de tela, e a cor
 * da faixa diz de relance em que bloco o olho está — que é o que se perde
 * quando a pessoa rola no celular.
 *
 * O total mora na própria faixa porque é a pergunta que se faz do grupo
 * inteiro ("quanto é o meu fixo?"), e ninguém quer somar de cabeça.
 *
 * QUANDO NÃO USAR: na home. Lá o cabeçalho é leve (`CartaoPainel`), porque
 * cinco faixas saturadas empilhadas numa tela só transformam o painel em
 * caixa de lápis de cor. A faixa é para tabela longa, onde ela orienta.
 */
export function CabecalhoGrupo({
  titulo,
  total,
  detalhe,
  tom = "neutro",
  Icone,
  acao,
}: {
  titulo: string;
  /** Já formatado — a peça não decide se leva centavo. */
  total?: string;
  detalhe?: string;
  tom?: TomGrupo;
  Icone?: LucideIcon;
  /** Um link ou botão pequeno na ponta direita ("ver tudo"). Vem DEPOIS do
      total: quem lê a faixa quer o número primeiro, o caminho depois. */
  acao?: React.ReactNode;
}) {
  return (
    <div
      className={`flex items-center gap-2.5 px-4 py-2.5 text-white sm:px-5 ${TOM_GRUPO[tom]}`}
    >
      {Icone && <Icone className="h-4 w-4 shrink-0 opacity-80" strokeWidth={2.25} />}
      <h2 className="min-w-0 flex-1 truncate text-xs font-semibold uppercase tracking-wider">
        {titulo}
      </h2>
      {detalhe && (
        <span className="hidden shrink-0 text-2xs text-white/70 sm:block">{detalhe}</span>
      )}
      {total && (
        <span className="shrink-0 font-display text-sm font-semibold tabular-nums">
          {total}
        </span>
      )}
      {acao}
    </div>
  );
}

// ────────────────────────────────────────────────────────── Disco de ícone ──

const TOM_DISCO = {
  neutro: "bg-primary/[0.07] text-primary",
  info: "bg-ciano-tint text-ciano-forte",
  bom: "bg-success/12 text-success-strong",
  atencao: "bg-accent-tint text-accent-strong",
  ruim: "bg-destructive/10 text-destructive",
} as const;

export type TomDisco = keyof typeof TOM_DISCO;

/**
 * O disco colorido com um ícone dentro.
 *
 * Estava copiado dentro do `CartaoNumero` e ia ser copiado de novo no cartão
 * de transação e no de painel. Três cópias do mesmo quadrado arredondado é
 * como uma delas nasce com 40px e as outras com 36 — e aí as linhas de uma
 * lista deixam de alinhar.
 *
 * `cor` livre ganha do `tom`: quando a categoria tem cor no banco, é ELA que
 * manda, senão a lista inteira fica com o mesmo cinza e o disco perde a única
 * função que tem, que é dar identidade à linha de relance.
 */
export function DiscoIcone({
  Icone,
  tom = "neutro",
  cor,
  tamanho = "md",
  className = "",
}: {
  Icone: LucideIcon;
  tom?: TomDisco;
  /** Cor arbitrária (a da categoria/conta). Vira fundo claro + ícone forte. */
  cor?: string;
  tamanho?: "sm" | "md" | "lg";
  className?: string;
}) {
  const caixa = { sm: "h-8 w-8 rounded-lg", md: "h-10 w-10 rounded-xl", lg: "h-12 w-12 rounded-2xl" }[
    tamanho
  ];
  const glifo = { sm: "h-4 w-4", md: "h-[1.125rem] w-[1.125rem]", lg: "h-5 w-5" }[tamanho];

  return (
    <span
      aria-hidden
      className={`tile-cine flex shrink-0 items-center justify-center ${caixa} ${cor ? "" : TOM_DISCO[tom]} ${className}`}
      style={cor ? { background: tintar(cor), color: cor } : undefined}
    >
      <Icone className={glifo} strokeWidth={2.25} />
    </span>
  );
}

// ──────────────────────────────────────────────────────── Cartão número ─────

const TOM_NUMERO = {
  neutro: { texto: "text-primary", disco: "neutro" },
  info: { texto: "text-primary", disco: "info" },
  bom: { texto: "text-success-strong", disco: "bom" },
  atencao: { texto: "text-accent-strong", disco: "atencao" },
  ruim: { texto: "text-destructive", disco: "ruim" },
} as const satisfies Record<string, { texto: string; disco: TomDisco }>;

/**
 * Cartão de número grande.
 *
 * A ORDEM É RÓTULO → NÚMERO → EXPLICAÇÃO, e não o contrário. Quem abre um
 * painel financeiro está procurando um número específico; o rótulo em cima é o
 * que deixa achar sem ler. A explicação embaixo é para a segunda leitura, a de
 * quem já achou e quer entender.
 *
 * A `variacao` é opcional e some quando não existe: seta de comparação sem
 * mês anterior é enfeite que mente.
 */
export function CartaoNumero({
  rotulo,
  valor,
  detalhe,
  tom = "neutro",
  Icone,
  variacao,
  href,
  tamanho = "md",
  barra,
  rodape,
}: {
  rotulo: string;
  /** Já formatado. */
  valor: string;
  detalhe?: string;
  tom?: keyof typeof TOM_NUMERO;
  Icone?: LucideIcon;
  /** Comparação com o período anterior. `sobeEBom` inverte a leitura de cor —
      renda subindo é bom, gasto subindo não. */
  variacao?: { pct: number; texto?: string; sobeEBom?: boolean };
  /** Quando o número leva a algum lugar, o card inteiro vira o alvo de
      toque — no celular, alvo pequeno é o que faz errar. */
  href?: string;
  /** "lg" sobe o número para 3xl. Para quando o cartão está sozinho e não em
      trio — três cartões `lg` lado a lado voltam a empatar entre si. */
  tamanho?: "md" | "lg";
  /** Um filete proporcional embaixo do número. Serve para "quanto disto é do
      total" sem gastar uma linha de texto explicando. */
  barra?: { pct: number; cor?: string };
  /** Espaço livre no pé do cartão (uma pastilha, um mini-gráfico). */
  rodape?: React.ReactNode;
}) {
  const t = TOM_NUMERO[tom];

  const corVariacao = variacao
    ? (variacao.pct >= 0) === (variacao.sobeEBom ?? true)
      ? "text-success-strong"
      : "text-destructive"
    : "";

  const conteudo = (
    <>
      <div className="flex items-start gap-3">
        {Icone && <DiscoIcone Icone={Icone} tom={t.disco} />}
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">{rotulo}</p>
          <p
            className={`mt-0.5 font-display font-semibold leading-tight tracking-tight tabular-nums ${
              tamanho === "lg" ? "text-3xl" : "text-2xl"
            } ${t.texto}`}
          >
            {valor}
          </p>
        </div>
      </div>

      {barra && (
        <div
          className="mt-3 h-1.5 overflow-hidden rounded-full bg-gelo"
          aria-hidden
        >
          <div
            className="h-full rounded-full transition-[width] duration-700 ease-out"
            style={{
              width: `${limitar(barra.pct)}%`,
              background: barra.cor ?? "var(--color-ciano)",
            }}
          />
        </div>
      )}

      {(detalhe || variacao) && (
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
          {variacao && (
            <span className={`text-2xs font-semibold tabular-nums ${corVariacao}`}>
              {variacao.pct >= 0 ? "▲" : "▼"} {Math.abs(Math.round(variacao.pct))}%
              {variacao.texto ? ` ${variacao.texto}` : ""}
            </span>
          )}
          {detalhe && (
            <span className="text-2xs leading-snug text-muted-foreground">{detalhe}</span>
          )}
        </div>
      )}

      {rodape && <div className="mt-3">{rodape}</div>}
    </>
  );

  const classe = `block rounded-2xl border border-border/70 bg-white p-4 ${SOMBRA} sm:p-5`;

  return href ? (
    <Link
      href={href}
      className={`${classe} glass-card fin-toque hover:border-accent-soft`}
    >
      {conteudo}
    </Link>
  ) : (
    <div className={classe}>{conteudo}</div>
  );
}

// ─────────────────────────────────────────────────────────── Número herói ───

/**
 * O número pelo qual o app foi aberto.
 *
 * O DIAGNÓSTICO ERA ESTE: o saldo do mês tinha o mesmo peso visual de um
 * rótulo. Um app financeiro é julgado em dois segundos, e nesses dois segundos
 * a pessoa só faz uma pergunta. O que responde a pergunta tem de ser a maior
 * coisa da tela — não "um pouco maior".
 *
 * POR QUE NAVY SÓLIDO NUM APP CLARO
 * Não é dark mode entrando pela janela. É hierarquia: no tema claro tudo é
 * branco sobre azulado, e a única forma de um bloco liderar sem gritar em
 * laranja é INVERTER. O olho vai no bloco escuro antes de qualquer outra
 * coisa, e o resto da página continua leve. Um por tela — dois blocos escuros
 * viram listra e a hierarquia morre.
 *
 * O tamanho é `clamp`: no celular em pé, 3rem já ocupa metade da largura, e
 * número que quebra em duas linhas deixa de ser um número.
 */
export function NumeroHeroi({
  rotulo,
  valor,
  sinal = "neutro",
  explicacao,
  variacao,
  lateral,
  rodape,
  children,
}: {
  /** A frase que arma o número ("Se nada mudar, você fecha o mês com"). */
  rotulo: string;
  /** Já formatado, e em módulo: o sinal quem diz é a palavra, não o menos. */
  valor: string;
  /** Muda a cor do número. "negativo" vira o vermelho claro — legível sobre o
      navy, ao contrário do `destructive`, que é para fundo branco. */
  sinal?: "positivo" | "negativo" | "neutro";
  explicacao?: string;
  variacao?: { pct: number; texto?: string; sobeEBom?: boolean };
  /** A coluna da direita — normalmente um `Medidor sobre="escuro"`. */
  lateral?: React.ReactNode;
  /** A faixa de baixo, atravessando o cartão inteiro (a barra do ritmo). */
  rodape?: React.ReactNode;
  /** As pastilhas embaixo do número. */
  children?: React.ReactNode;
}) {
  const cor = {
    positivo: "text-white",
    negativo: "text-[hsl(0_90%_82%)]",
    neutro: "text-white",
  }[sinal];

  const corVariacao = variacao
    ? (variacao.pct >= 0) === (variacao.sobeEBom ?? true)
      ? "text-[hsl(152_60%_66%)]"
      : "text-[hsl(0_90%_80%)]"
    : "";

  return (
    <section
      aria-label={rotulo}
      className="relative overflow-hidden rounded-3xl bg-primary text-white shadow-[var(--fin-sombra-heroi)]"
    >
      {/* Duas luzes muito fracas nas quinas: sem elas o navy chapado parece
          um retângulo do Word. Ficam em `absolute` e sem eventos — não é
          decoração clicável, é textura. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-[radial-gradient(circle,hsl(197_70%_55%/0.28),transparent_65%)]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-[radial-gradient(circle,hsl(16_85%_58%/0.22),transparent_65%)]"
      />

      <div className="relative grid items-center gap-5 p-6 sm:p-7 md:grid-cols-[1.2fr_auto] md:gap-8">
        <div className="min-w-0">
          <p className="text-xs font-medium text-white/70">{rotulo}</p>

          <p
            className={`fin-assenta mt-1.5 font-display font-semibold leading-none tracking-tight tabular-nums ${cor}`}
            style={{ fontSize: "clamp(2.5rem, 1.6rem + 4vw, 3.75rem)" }}
          >
            {valor}
          </p>

          {variacao && (
            <p className={`mt-2 text-2xs font-semibold tabular-nums ${corVariacao}`}>
              {variacao.pct >= 0 ? "▲" : "▼"} {Math.abs(Math.round(variacao.pct))}%
              {variacao.texto ? ` ${variacao.texto}` : ""}
            </p>
          )}

          {children && (
            <div className="mt-4 flex flex-wrap items-center gap-2">{children}</div>
          )}

          {explicacao && (
            <p className="mt-3.5 max-w-prose text-xs leading-relaxed text-white/65">
              {explicacao}
            </p>
          )}
        </div>

        {lateral && <div className="md:w-52">{lateral}</div>}
      </div>

      {rodape && (
        <div className="relative border-t border-white/10 px-6 py-4 sm:px-7">
          {rodape}
        </div>
      )}
    </section>
  );
}

// ───────────────────────────────────────────────────────── Barras mês ───────

export type PontoMes = {
  /** "2026-03". */
  ref: string;
  planejado: number;
  realizado: number;
};

/**
 * Barras empilhadas mês a mês: planejado × realizado.
 *
 * POR QUE EMPILHAR, E NÃO PÔR DUAS BARRAS LADO A LADO
 * Duas barras vizinhas obrigam a comparar alturas; empilhado, o realizado
 * PREENCHE o planejado e a pergunta vira uma só — encheu ou transbordou? O que
 * passou do plano sai por cima, em vermelho, e não tem como não ver.
 *
 * A escala é comum a todos os meses (o maior valor da série manda), senão cada
 * coluna teria a sua régua e a comparação, que é o motivo do gráfico, sumiria.
 */
export function BarrasMes({
  meses,
  formatar,
  rotuloRealizado = "Realizado",
  rotuloPlanejado = "Planejado",
  altura = 132,
  destaque,
}: {
  meses: PontoMes[];
  /** Como escrever o dinheiro na legenda de cada coluna. */
  formatar: (v: number) => string;
  rotuloRealizado?: string;
  rotuloPlanejado?: string;
  altura?: number;
  /** O ref do mês que a tela está mostrando. Ele ganha o rótulo em navy e um
      filete embaixo — sem isso, numa série de seis colunas iguais a pessoa
      perde de vista qual é "agora". */
  destaque?: string;
}) {
  const teto = Math.max(
    1,
    ...meses.map((m) => Math.max(m.planejado, m.realizado)),
  );

  /* Um fator só para a série inteira: as colunas sobem juntas, como uma
     cortina. Animar cada uma no seu tempo faria a comparação entre meses —
     que é o motivo do gráfico existir — mudar durante a animação. */
  const { valor: fator, caixa, animar } = useValorQueEntra<HTMLUListElement>(100);

  const sobe = animar ? "transition-[height] duration-700 ease-out" : "";

  return (
    <figure>
      <ul ref={caixa} className="flex gap-1.5 sm:gap-2.5">
        {meses.map((m) => {
          const dentro = Math.min(m.realizado, m.planejado || m.realizado);
          const excedeu = Math.max(0, m.realizado - (m.planejado || m.realizado));
          const folga = Math.max(0, (m.planejado || 0) - m.realizado);
          const h = (v: number) => `${(v / teto) * fator}%`;
          const aceso = destaque === m.ref;

          return (
            <li key={m.ref} className="min-w-0 flex-1">
              {/* A altura vive AQUI, e não no `ul`: se o rótulo do mês morasse
                  dentro da caixa que dá a escala, ele comeria uma fatia dela e
                  as barras mentiriam a proporção. */}
              <div
                className="flex flex-col justify-end"
                style={{ height: altura }}
                title={`${mesCurto(m.ref)}: ${formatar(m.realizado)}${m.planejado > 0 ? ` de ${formatar(m.planejado)}` : ""}`}
              >
                {/* A ordem no DOM é de cima para baixo: estouro, folga, dentro. */}
                {/* O estouro é vermelho E LISTRADO. Vermelho sozinho, empilhado
                    em cima de um ciano, é a distinção que some para quem tem
                    deuteranopia — e "passou do plano" é a única leitura que
                    este gráfico existe para dar. */}
                <span
                  className={`w-full rounded-t-md bg-destructive ${sobe}`}
                  style={{ height: h(excedeu), backgroundImage: HACHURA }}
                />
                <span
                  className={`w-full bg-ciano/15 ${sobe} ${excedeu === 0 ? "rounded-t-md" : ""}`}
                  style={{ height: h(folga) }}
                />
                <span
                  className={`w-full ${aceso ? "bg-ciano-forte" : "bg-ciano"} ${sobe} ${excedeu === 0 && folga === 0 ? "rounded-t-md" : ""}`}
                  style={{ height: h(dentro) }}
                />
              </div>

              {/* O rótulo é o único texto da coluna: no celular, valor em cima
                  de cada barra vira um amontoado ilegível. O número completo
                  fica no `title` e na leitura de tela. */}
              <span
                className={`mt-1.5 block truncate text-center text-2xs capitalize ${
                  aceso ? "font-semibold text-primary" : "text-muted-foreground"
                }`}
              >
                {mesCurto(m.ref)}
              </span>
              <span className="sr-only">
                {mesCurto(m.ref)}: {rotuloRealizado.toLowerCase()}{" "}
                {formatar(m.realizado)}
                {m.planejado > 0
                  ? `, ${rotuloPlanejado.toLowerCase()} ${formatar(m.planejado)}`
                  : ""}
                {aceso ? " (o mês que você está vendo)" : ""}.
              </span>
            </li>
          );
        })}
      </ul>

      <figcaption className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-2xs text-muted-foreground">
        <Legenda classe="bg-ciano" texto={rotuloRealizado} />
        <Legenda classe="bg-ciano/25" texto={rotuloPlanejado} />
        <span className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="h-2.5 w-2.5 rounded-sm bg-destructive"
            style={{ backgroundImage: HACHURA }}
          />
          Passou do plano (listrado)
        </span>
      </figcaption>
    </figure>
  );
}

function Legenda({ classe, texto }: { classe: string; texto: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span aria-hidden className={`h-2.5 w-2.5 rounded-sm ${classe}`} />
      {texto}
    </span>
  );
}

// ────────────────────────────────────────────────────────── Barra com marca ─

/**
 * Uma barra e um marcador de referência em cima dela.
 *
 * A PERGUNTA QUE ELA RESPONDE é de RITMO, não de total: "já gastei 70% do que
 * planejei para o mês" só vira notícia quando ao lado está "e o mês só correu
 * 30%". Nenhum dos dois números diz nada sozinho; juntos, dizem tudo.
 *
 * É a peça mais barata do arquivo e provavelmente a mais útil — e é justamente
 * o tipo de leitura que um extrato nunca dá.
 */
export function BarraComMarca({
  valor,
  marca,
  rotulo,
  rotuloMarca,
  legenda,
  sobre = "claro",
}: {
  /** 0 a 100 — o preenchimento. */
  valor: number;
  /** 0 a 100 — onde fica o risco de referência. */
  marca: number;
  rotulo: string;
  rotuloMarca: string;
  legenda?: string;
  sobre?: "claro" | "escuro";
}) {
  const v = limitar(valor);
  const m = limitar(marca);
  const escuro = sobre === "escuro";
  /* Adiantado no gasto = ruim. A folga de 5 pontos existe porque ninguém gasta
     em fatias diárias exatas, e um alarme que dispara no dia 3 por causa do
     mercado do mês inteiro é um alarme que se aprende a ignorar. */
  const adiantado = v > m + 5;

  const cor = adiantado
    ? escuro
      ? "bg-[hsl(0_80%_68%)]"
      : "bg-destructive"
    : escuro
      ? "bg-[hsl(152_60%_58%)]"
      : "bg-success";

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
        <p className={`text-2xs font-medium ${escuro ? "text-white/75" : "text-primary"}`}>
          {rotulo}
        </p>
        <p className={`text-2xs tabular-nums ${escuro ? "text-white/55" : "text-muted-foreground"}`}>
          {rotuloMarca}
        </p>
      </div>

      {/* O triângulo vive FORA da barra, que tem `overflow-hidden` e o cortaria
          pela metade. Ele existe porque um risco de 2px dentro de um trilho de
          10px pode passar por emenda de desenho; a ponta apontando para baixo
          diz que ali há uma referência. */}
      <div className="relative mt-2 h-1.5">
        <span
          aria-hidden
          className={`absolute bottom-0 h-0 w-0 -translate-x-1/2 border-x-[4px] border-t-[5px] border-x-transparent ${
            escuro ? "border-t-white" : "border-t-primary"
          }`}
          style={{ left: `${m}%` }}
        />
      </div>

      <div
        className={`relative h-2.5 overflow-hidden rounded-full ${escuro ? "bg-white/15" : "bg-gelo"}`}
        role="img"
        aria-label={`${rotulo}. ${rotuloMarca}. ${
          adiantado ? "Adiantado em relação à referência." : "Dentro do ritmo da referência."
        }`}
      >
        <div
          className={`h-full rounded-full transition-[width] duration-700 ease-out motion-reduce:transition-none ${cor}`}
          style={{ width: `${v}%`, backgroundImage: adiantado ? HACHURA : undefined }}
        />
        {/* O marcador é um risco de 2px atravessando a barra inteira, e não um
            ponto: ponto some quando cai exatamente sobre o fim do
            preenchimento, que é o caso mais interessante de todos. */}
        <span
          aria-hidden
          className={`absolute inset-y-0 w-0.5 ${escuro ? "bg-white" : "bg-primary"}`}
          style={{ left: `calc(${m}% - 1px)` }}
        />
      </div>

      {legenda && (
        <p
          className={`mt-2 text-2xs leading-snug ${escuro ? "text-white/60" : "text-muted-foreground"}`}
        >
          {legenda}
        </p>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────── Pastilha ────

const TOM_PASTILHA = {
  pago: "bg-success/12 text-success-strong",
  previsto: "bg-ciano-tint text-ciano-forte",
  /* Laranja é saída de dinheiro, não perigo. Marcar todo gasto de vermelho
     gasta o alarme em coisa normal — e aí o vermelho do atraso não assusta
     mais ninguém. */
  saida: "bg-accent-tint text-accent-strong",
  atrasado: "bg-destructive/10 text-destructive",
  fixa: "bg-primary/[0.07] text-primary",
  neutro: "bg-muted text-muted-foreground",
  aviso: "bg-warning/15 text-accent-strong",
} as const;

/* Sobre o navy do herói. Não é o mesmo mapa com opacidade trocada: os textos
   sobem para ~68% de luminosidade, que é onde o laranja e o ciano voltam a
   passar na WCAG contra fundo escuro (os de 36% e 31% somem lá). */
const TOM_PASTILHA_ESCURO = {
  pago: "bg-white/10 text-[hsl(152_60%_72%)]",
  previsto: "bg-white/10 text-ciano-claro",
  saida: "bg-white/10 text-accent-claro",
  atrasado: "bg-[hsl(0_72%_55%/0.3)] text-[hsl(0_90%_86%)]",
  fixa: "bg-white/10 text-white/85",
  neutro: "bg-white/10 text-white/75",
  aviso: "bg-white/10 text-warning-claro",
} as const;

/**
 * Etiqueta de status.
 *
 * COR NÃO É O RECADO, É O REFORÇO. A pastilha sempre carrega a palavra — "pago",
 * "previsto", "atrasado" — porque um ponto verde sozinho não diz nada a quem
 * não enxerga cor, e num app de dinheiro confundir previsto com pago é o erro
 * que faz a pessoa gastar o que não tem.
 */
export function Pastilha({
  tom = "neutro",
  children,
  Icone,
  sobre = "claro",
  tamanho = "md",
}: {
  tom?: keyof typeof TOM_PASTILHA;
  children: React.ReactNode;
  Icone?: LucideIcon;
  /** Dentro do cartão navy do herói. */
  sobre?: "claro" | "escuro";
  /** "toque" quando a pastilha for clicável (envolvida por um `Link`): ela
      cresce para 44px de altura. Pastilha-link de 24px é o alvo que erra. */
  tamanho?: "md" | "toque";
}) {
  const mapa = sobre === "escuro" ? TOM_PASTILHA_ESCURO : TOM_PASTILHA;
  const medida =
    tamanho === "toque" ? "min-h-11 px-3.5 text-xs" : "min-h-6 px-2.5 text-2xs";

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full py-0.5 font-semibold ${medida} ${mapa[tom]}`}
    >
      {Icone && <Icone className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />}
      {children}
    </span>
  );
}

// ──────────────────────────────────────────── Moldura comum das telas ───────

const TOM_BLOCO = {
  branco: "bg-white border-border/70",
  /** Afundado: o degrau de DENTRO do card (um resumo dentro de um bloco).
      Sem sombra de propósito — o que afunda não pode projetar. */
  gelo: "bg-gelo border-border/50",
  navy: "bg-primary border-transparent text-white",
} as const;

const ELEVACAO = {
  plano: "",
  card: SOMBRA,
  alto: "shadow-[var(--fin-sombra-alta)]",
} as const;

/**
 * O cartão branco do app.
 *
 * Existe para a borda, o raio e a sombra serem UM valor só. Antes cada tela
 * escrevia a sua combinação de `rounded-2xl border-border/80`, e bastava uma
 * divergir para a página parecer montada por duas pessoas diferentes.
 *
 * Os três `tom` são a escada de profundidade inteira: `branco` é o card,
 * `gelo` é o bloco afundado dentro dele, `navy` é o degrau de cima. Se você
 * precisou de um quarto, provavelmente o que falta é hierarquia, não cor.
 */
export function Bloco({
  children,
  className = "",
  tom = "branco",
  elevacao = "card",
  interativo = false,
  ...resto
}: React.HTMLAttributes<HTMLDivElement> & {
  tom?: keyof typeof TOM_BLOCO;
  elevacao?: keyof typeof ELEVACAO;
  /** Liga o afundamento no toque e o levantar no hover. Só para bloco que
      REALMENTE leva a algum lugar: card que se mexe e não faz nada é a
      promessa quebrada mais barata que existe. */
  interativo?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border ${TOM_BLOCO[tom]} ${ELEVACAO[elevacao]} ${interativo ? "fin-toque" : ""} ${className}`}
      {...resto}
    >
      {children}
    </div>
  );
}

// ──────────────────────────────────────────────────────── Cartão do painel ──

/**
 * O tijolo da home reordenável.
 *
 * POR QUE O CABEÇALHO É LEVE E NÃO A FAIXA COLORIDA
 * A faixa (`CabecalhoGrupo`) é ótima dentro de uma tabela longa, onde ela
 * marca onde um grupo começa. Na home haveria cinco delas empilhadas, cada uma
 * de uma cor, e o painel viraria caixa de lápis. Aqui a cor entra só no disco
 * do ícone — que é o suficiente para diferenciar os cards de relance.
 *
 * TRÊS SLOTS NA PONTA DIREITA, e uma precedência: `controles` ganha de `acao`,
 * que ganha do link de `href`. É o que permite uma tela em modo de edição
 * trocar o "Ver tudo" por botões próprios sem que os dois apareçam juntos —
 * duas coisas clicáveis na mesma esquina é o toque que faz a coisa errada.
 */
export function CartaoPainel({
  titulo,
  Icone,
  tom = "neutro",
  total,
  detalhe,
  href,
  rotuloAcao = "Ver tudo",
  acao,
  controles,
  children,
  className = "",
  corpoSemPadding = false,
}: {
  titulo: string;
  Icone?: LucideIcon;
  tom?: TomDisco;
  /** Já formatado. Aparece à direita do título, em tabular. */
  total?: string;
  detalhe?: string;
  /** Quando existe, nasce o link discreto no pé do cabeçalho. */
  href?: string;
  rotuloAcao?: string;
  /** Substitui o link por um controle seu (um botão, um seletor). */
  acao?: React.ReactNode;
  /** Substitui a ponta direita inteira (inclusive o `acao`). Para quando a
      tela entra num modo em que o cabeçalho deixa de navegar e passa a
      comandar. */
  controles?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** Para quando o corpo é uma lista com divisórias que precisam encostar nas
      bordas do card. */
  corpoSemPadding?: boolean;
}) {
  return (
    <Bloco className={`overflow-hidden ${className}`}>
      <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3 sm:px-5">
        {Icone && <DiscoIcone Icone={Icone} tom={tom} tamanho="sm" />}

        <div className="min-w-0 flex-1">
          <h2 className="truncate text-xs font-semibold uppercase tracking-wider text-primary">
            {titulo}
          </h2>
          {detalhe && (
            <p className="truncate text-2xs text-muted-foreground">{detalhe}</p>
          )}
        </div>

        {total && (
          <span className="shrink-0 font-display text-sm font-semibold tabular-nums text-primary">
            {total}
          </span>
        )}

        {controles}

        {!controles && acao}
        {!controles && !acao && href && (
          <Link
            href={href}
            className="inline-flex min-h-11 shrink-0 items-center gap-0.5 rounded-lg px-2 text-2xs font-semibold text-ciano-forte transition-colors hover:text-primary"
          >
            {rotuloAcao}
            <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.5} />
          </Link>
        )}
      </div>

      <div className={corpoSemPadding ? "" : "p-4 sm:p-5"}>{children}</div>
    </Bloco>
  );
}

// ─────────────────────────────────────────────────────── Cartão transação ───

/**
 * Uma linha de lançamento.
 *
 * O DISCO COLORIDO NÃO É ENFEITE. Numa lista de trinta linhas todas com o
 * mesmo cinza, achar "o mercado de terça" é uma leitura palavra por palavra.
 * Com a cor da categoria no disco, o olho filtra antes de ler — é o mesmo
 * truque do marcador de texto, e é o que faz uma lista longa parecer curta.
 *
 * O VALOR NÃO É VERMELHO quando é despesa. Despesa é o normal de um app de
 * gastos; se todo gasto for vermelho, o vermelho deixa de significar problema
 * e a conta ATRASADA — que é problema de verdade — não se destaca de nada. Saída
 * é navy com o sinal "−"; entrada é verde com "+". Quem não enxerga cor lê o
 * sinal, que é o que importa.
 */
export function CartaoTransacao({
  descricao,
  valor,
  sinal = "saida",
  quando,
  categoria,
  cor,
  Icone,
  estado,
  href,
  onClick,
  acao,
}: {
  descricao: string;
  /** Cru. A peça formata COM centavos: item é dado, e dado leva centavo. */
  valor: number;
  sinal?: "entrada" | "saida";
  /** Já legível: "hoje", "ontem", "12/03". A peça não sabe formatar data. */
  quando?: string;
  categoria?: string;
  /** A cor da categoria, do banco. */
  cor?: string;
  Icone?: LucideIcon;
  estado?: { tom: keyof typeof TOM_PASTILHA; texto: string; Icone?: LucideIcon };
  href?: string;
  onClick?: () => void;
  /** Botão na ponta direita (marcar como pago, apagar). Fica FORA do link:
      alvo dentro de alvo é o clique que faz a coisa errada. */
  acao?: React.ReactNode;
}) {
  const entrada = sinal === "entrada";

  const miolo = (
    <>
      {Icone && <DiscoIcone Icone={Icone} cor={cor} tom={entrada ? "bom" : "neutro"} />}

      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-foreground">
          {descricao}
        </span>
        {(quando || categoria) && (
          <span className="mt-0.5 block truncate text-2xs text-muted-foreground">
            {[quando, categoria].filter(Boolean).join(" · ")}
          </span>
        )}
      </span>

      <span className="flex shrink-0 flex-col items-end gap-1">
        <span
          className={`font-display text-sm font-semibold tabular-nums ${
            entrada ? "text-success-strong" : "text-primary"
          }`}
        >
          {entrada ? "+" : "−"} {brlExato(Math.abs(valor))}
        </span>
        {estado && (
          <Pastilha tom={estado.tom} Icone={estado.Icone}>
            {estado.texto}
          </Pastilha>
        )}
      </span>
    </>
  );

  /* 56px de altura mínima: é o alvo de toque com folga para as duas linhas de
     texto. Lista de lançamento é a tela mais tocada do app inteiro. */
  const classe =
    "flex min-h-14 w-full items-center gap-3 px-4 py-2.5 text-left transition-colors sm:px-5";

  const alvo = href ? (
    <Link href={href} className={`${classe} fin-toque hover:bg-gelo`}>
      {miolo}
    </Link>
  ) : onClick ? (
    <button type="button" onClick={onClick} className={`${classe} fin-toque hover:bg-gelo`}>
      {miolo}
    </button>
  ) : (
    <div className={classe}>{miolo}</div>
  );

  if (!acao) return alvo;

  return (
    <div className="flex items-center">
      <div className="min-w-0 flex-1">{alvo}</div>
      <div className="shrink-0 pr-3 sm:pr-4">{acao}</div>
    </div>
  );
}

// ──────────────────────────────────────────────────────── Barra categoria ───

/**
 * Nome, valor e a barra proporcional — a linha do "para onde foi".
 *
 * A barra é relativa à MAIOR da lista, e não ao total. Comparar cada categoria
 * com o total dá barrinhas de 8% que não dizem nada; comparar com a maior é o
 * que revela o exagero, que é a informação pela qual alguém abre esta lista.
 */
export function BarraCategoria({
  nome,
  valor,
  pct,
  cor,
  detalhe,
  pctMarca,
  excedeu,
}: {
  nome: string;
  /** Já formatado. */
  valor: string;
  /** 0 a 100, relativo à maior linha da lista. */
  pct: number;
  cor?: string;
  detalhe?: string;
  /** 0 a 100, na MESMA régua do `pct`: onde estava o combinado. Vira um risco
      navy sobre a barra. Sem ele, a linha diz "gastei muito" sem dizer
      "muito comparado a quê". */
  pctMarca?: number;
  /** Pinta de vermelho E listrado. É um julgamento, e por isso quem chama
      decide — a peça não sabe se estourar era o esperado. */
  excedeu?: boolean;
}) {
  return (
    <li>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="min-w-0 truncate text-foreground">{nome}</span>
        <span
          className={`shrink-0 tabular-nums ${excedeu ? "font-semibold text-destructive" : "text-muted-foreground"}`}
        >
          {excedeu ? "! " : ""}
          {valor}
        </span>
      </div>
      <div className="relative mt-1.5 h-2 overflow-hidden rounded-full bg-gelo">
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out motion-reduce:transition-none"
          style={{
            width: `${limitar(pct)}%`,
            background: excedeu ? "var(--color-destructive)" : (cor ?? "var(--color-ciano)"),
            backgroundImage: excedeu ? HACHURA : undefined,
          }}
        />
        {pctMarca !== undefined && (
          <span
            aria-hidden
            className="absolute inset-y-0 w-0.5 bg-primary"
            style={{ left: `calc(${limitar(pctMarca)}% - 1px)` }}
          />
        )}
      </div>
      {detalhe && (
        <p className="mt-1 text-2xs text-muted-foreground">{detalhe}</p>
      )}
    </li>
  );
}

// ──────────────────────────────────────────────────────────── Assistente ────

const TOM_DICA = {
  bom: { ponto: "bg-success", texto: "Boa notícia" },
  info: { ponto: "bg-ciano", texto: "Para saber" },
  atencao: { ponto: "bg-warning", texto: "De olho" },
  ruim: { ponto: "bg-destructive", texto: "Atenção" },
} as const;

export type Dica = {
  id: string;
  /** Uma frase. Se não couber em uma, são duas dicas. */
  texto: string;
  tom?: keyof typeof TOM_DICA;
  href?: string;
  rotuloAcao?: string;
};

/**
 * O Fin — a leitura dos números em português.
 *
 * POR QUE ISTO EXISTE, sem rodeio: o concorrente vende personalidade. Um app
 * que só empilha gráfico é uma planilha bonita; o que diz "seu cartão fecha em
 * 3 dias e a fatura já passou do mês passado" é alguém prestando atenção por
 * você. A diferença comercial é enorme e o custo técnico, aqui, é zero.
 *
 * O QUE ELE NÃO É: não é chat, não chama modelo nenhum, não inventa nada. As
 * dicas vêm PRONTAS de quem chamou a peça, calculadas dos números que já estão
 * na tela. Assistente que alucina saldo é o fim da confiança no app inteiro —
 * e num app de dinheiro a confiança é o produto.
 *
 * Cada dica leva um PONTO colorido E uma palavra ("Atenção", "Boa notícia"):
 * quem não enxerga cor recebe o mesmo julgamento que os outros.
 */
export function CartaoAssistente({
  nome = "Fin",
  saudacao,
  dicas,
  carregando = false,
}: {
  nome?: string;
  /** A linha de contexto ("Olhei o seu mês de março"). */
  saudacao?: string;
  dicas: Dica[];
  carregando?: boolean;
}) {
  if (!carregando && dicas.length === 0) return null;

  return (
    <Bloco className="overflow-hidden">
      <div className="flex items-start gap-3 p-4 sm:p-5">
        <span
          aria-hidden
          className="fin-orbe flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
        >
          <Sparkles className="h-[1.125rem] w-[1.125rem] text-white" strokeWidth={2.25} />
        </span>

        <div className="min-w-0 flex-1">
          <p className="font-display text-sm font-semibold text-primary">
            {nome}
            {saudacao && (
              <span className="ml-2 font-sans text-2xs font-normal text-muted-foreground">
                {saudacao}
              </span>
            )}
          </p>

          {carregando ? (
            <div className="mt-3 space-y-2" role="status" aria-label="Lendo os seus números">
              <div className="h-3 w-4/5 animate-pulse rounded bg-gelo" />
              <div className="h-3 w-3/5 animate-pulse rounded bg-gelo" />
            </div>
          ) : (
            <ul className="mt-2 space-y-2.5">
              {dicas.map((d) => {
                const t = TOM_DICA[d.tom ?? "info"];
                return (
                  <li key={d.id} className="flex gap-2.5">
                    <span
                      aria-hidden
                      className={`mt-[0.4rem] h-1.5 w-1.5 shrink-0 rounded-full ${t.ponto}`}
                    />
                    <p className="min-w-0 text-xs leading-relaxed text-foreground">
                      <span className="sr-only">{t.texto}: </span>
                      {d.texto}
                      {d.href && (
                        <Link
                          href={d.href}
                          className="ml-1.5 whitespace-nowrap font-semibold text-accent-strong underline underline-offset-2"
                        >
                          {d.rotuloAcao ?? "Ver"}
                        </Link>
                      )}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </Bloco>
  );
}

// ────────────────────────────────────────────────────────── Cabeçalhos ──────

/** Título de tela: chapéu ciano, título e a frase que explica para que serve. */
export function CabecalhoTela({
  chapeu,
  titulo,
  resumo,
  acao,
  Icone,
}: {
  chapeu?: string;
  titulo: string;
  resumo?: string;
  acao?: React.ReactNode;
  /** Um disco ciano à esquerda do título. Use nas telas que a pessoa alcança
      pelo menu "Mais" — lá ela chega sem contexto e o ícone é o que amarra a
      tela ao item que ela tocou. */
  Icone?: LucideIcon;
}) {
  return (
    <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        {Icone && <DiscoIcone Icone={Icone} tom="info" className="mt-0.5" />}
        <div className="min-w-0">
          {chapeu && (
            <p className="text-2xs font-semibold uppercase tracking-wider text-ciano-forte">
              {chapeu}
            </p>
          )}
          <h1 className="mt-0.5 font-display text-xl font-semibold tracking-tight text-primary first-letter:uppercase">
            {titulo}
          </h1>
          {resumo && (
            <p className="mt-1 max-w-prose text-xs leading-relaxed text-muted-foreground">
              {resumo}
            </p>
          )}
        </div>
      </div>
      {acao}
    </header>
  );
}

/**
 * O seletor de mês.
 *
 * Duas telas repetiam este bloco inteiro, e ele é a peça mais tocada do app
 * depois do botão de lançar. As setas têm 44px de área de toque: no
 * celular, seta de 28px ao lado do nome do mês é o clique que erra.
 *
 * O botão "hoje" só aparece quando a pessoa está fora do mês corrente — é o
 * caminho de volta que, sem ele, obriga a contar cliques na seta.
 *
 * As setas ficam sobre uma cápsula branca: solto sobre o fundo azulado, o
 * ícone cinza não lê como botão, e a pessoa toca no nome do mês esperando que
 * abra alguma coisa.
 */
export function NavegadorMes({
  mes,
  aoMudar,
  nome,
  hoje,
  acao,
}: {
  mes: string;
  aoMudar: (novo: string) => void;
  /** "março de 2026" — já formatado pelo modelo. */
  nome: string;
  /** O ref do mês corrente, para saber se cabe o botão de voltar. */
  hoje: string;
  acao?: React.ReactNode;
}) {
  const vizinho = (n: number) => {
    const [ano, m] = mes.split("-").map(Number);
    const d = new Date(ano, m - 1 + n, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  };

  const seta =
    "flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-gelo hover:text-primary";

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className={`flex items-center gap-0.5 rounded-2xl border border-border/70 bg-white p-1 ${SOMBRA}`}>
        <button
          type="button"
          onClick={() => aoMudar(vizinho(-1))}
          aria-label="Mês anterior"
          className={seta}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <h1 className="min-w-[8.5rem] text-center font-display text-base font-semibold tracking-tight text-primary first-letter:uppercase sm:min-w-[9.5rem] sm:text-lg">
          {nome}
        </h1>

        <button
          type="button"
          onClick={() => aoMudar(vizinho(1))}
          aria-label="Próximo mês"
          className={seta}
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        {mes !== hoje && (
          <button
            type="button"
            onClick={() => aoMudar(hoje)}
            className="ml-0.5 min-h-11 rounded-xl px-3 text-2xs font-semibold text-ciano-forte transition-colors hover:bg-gelo"
          >
            Hoje
          </button>
        )}
      </div>

      {acao}
    </div>
  );
}

const VARIANTE_BOTAO = {
  /* O laranja de 44% de luminosidade, o único que carrega texto branco sem
     reprovar. O de 55% (o `accent` decorativo) dá 3,40:1. */
  solido:
    "bg-accent-btn text-white shadow-[0_4px_14px_-6px_hsl(16_80%_45%_/_0.6)] hover:shadow-[0_8px_20px_-6px_hsl(16_80%_45%_/_0.7)]",
  contorno:
    "border border-border bg-white text-primary hover:border-accent-soft hover:bg-gelo",
  fantasma: "text-primary hover:bg-white",
} as const;

/** O botão laranja da casa — a mesma tinta em todas as telas do app. */
export function BotaoAcao({
  children,
  Icone,
  href,
  onClick,
  tipo = "button",
  desabilitado,
  variante = "solido",
  tamanho = "md",
  larguraTotal = false,
  rotuloAcessivel,
  className = "",
}: {
  children: React.ReactNode;
  Icone?: LucideIcon;
  href?: string;
  onClick?: () => void;
  tipo?: "button" | "submit";
  desabilitado?: boolean;
  /** Um sólido por tela. Dois laranjas competindo é o mesmo que nenhum. */
  variante?: keyof typeof VARIANTE_BOTAO;
  /** "sm" continua com 44px de altura — encolhe só o texto e o padding. Alvo
      de toque não é lugar de economizar pixel. */
  tamanho?: "md" | "sm";
  /** Botão de largura total: o padrão do rodapé de formulário no celular. */
  larguraTotal?: boolean;
  /** Quando o rótulo visível é curto demais para fazer sentido lido em voz
      alta ("Ver" numa lista de dez cards). */
  rotuloAcessivel?: string;
  className?: string;
}) {
  const medida = tamanho === "sm" ? "min-h-11 px-3 text-xs" : "min-h-11 px-4 text-sm";

  const classe = `inline-flex shrink-0 items-center justify-center gap-2 rounded-xl py-2 font-bold transition-all duration-150 fin-toque hover:-translate-y-0.5 active:translate-y-0 disabled:pointer-events-none disabled:opacity-50 ${medida} ${VARIANTE_BOTAO[variante]} ${larguraTotal ? "w-full" : ""} ${className}`;

  const miolo = (
    <>
      {Icone && <Icone className="h-4 w-4 shrink-0" strokeWidth={2.5} />}
      {children}
    </>
  );

  return href ? (
    <Link href={href} className={classe} aria-label={rotuloAcessivel}>
      {miolo}
    </Link>
  ) : (
    <button
      type={tipo}
      onClick={onClick}
      disabled={desabilitado}
      aria-label={rotuloAcessivel}
      className={classe}
    >
      {miolo}
    </button>
  );
}

// ─────────────────────────────────────────────────────── Estados da tela ────

/**
 * O esqueleto da tela enquanto os dados vêm.
 *
 * Era uma linha "Carregando…" com um spinner: a tela ficava vazia e depois
 * pulava inteira. O esqueleto mostra desde o primeiro quadro ONDE as coisas
 * vão nascer, e o conteúdo entra sem empurrar nada — que é a diferença entre
 * parecer rápido e ser rápido.
 *
 * O desenho padrão imita o PAINEL (herói alto + trio + dois blocos). Se a sua
 * tela é uma lista, passe `forma="lista"` — esqueleto com a forma errada é
 * pior que nenhum: promete um layout e entrega outro, e a tela pula do mesmo
 * jeito.
 */
export function Esqueleto({
  linhas = 3,
  forma = "painel",
}: {
  linhas?: number;
  forma?: "painel" | "lista" | "cartoes";
}) {
  const bloco = "rounded-2xl bg-white/70";

  return (
    <div className="animate-pulse space-y-3" role="status" aria-label="Carregando">
      {forma === "painel" && (
        <>
          {/* Mais alto e mais escuro que os outros: é o herói navy nascendo. */}
          <div className="h-44 rounded-3xl bg-primary/10" />
          <div className="grid gap-3 sm:grid-cols-3">
            <div className={`h-24 ${bloco}`} />
            <div className={`h-24 ${bloco}`} />
            <div className={`h-24 ${bloco}`} />
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            <div className={`h-56 ${bloco}`} />
            <div className={`h-56 ${bloco}`} />
          </div>
        </>
      )}

      {forma === "lista" && (
        <>
          <div className="h-12 w-56 rounded-2xl bg-white/70" />
          <div className={`h-[22rem] ${bloco}`} />
        </>
      )}

      {forma === "cartoes" && (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: linhas }).map((_, i) => (
            <div key={i} className={`h-28 ${bloco}`} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * O aviso de que falta rodar o SQL.
 *
 * Fica visualmente diferente de um erro do cliente porque não é um: é recado
 * de obra, para nós. Aparecia copiado em quatro telas com textos ligeiramente
 * diferentes — e recado de obra divergente é o que faz alguém rodar o arquivo
 * errado.
 */
export function AvisoSQL({
  arquivo,
  oQue = "O FINCASH",
}: {
  arquivo: string;
  oQue?: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-accent/40 bg-accent-tint p-5">
      <p className="font-display text-sm font-semibold text-primary">
        Falta rodar o SQL
      </p>
      <p className="mt-1.5 max-w-prose text-xs leading-relaxed text-muted-foreground">
        {oQue} depende de tabelas que ainda não existem no banco. Abra o SQL
        Editor do Supabase e rode{" "}
        <code className="rounded bg-white px-1.5 py-0.5 font-mono text-2xs text-accent-strong">
          {arquivo}
        </code>{" "}
        uma vez.
      </p>
    </div>
  );
}

/** Erro de verdade — e a promessa de que nada foi perdido. */
export function AvisoErro({ mensagem }: { mensagem: string }) {
  return (
    <div role="status" className="rounded-2xl border border-destructive/25 bg-white p-5">
      <p className="font-display text-sm font-semibold text-destructive">
        Não consegui carregar
      </p>
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
        O que você já lançou continua no lugar. {mensagem}
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-4 min-h-11 rounded-xl border border-border px-3.5 text-xs font-semibold text-primary transition-colors hover:bg-muted"
      >
        Tentar de novo
      </button>
    </div>
  );
}

/**
 * Tela sem conteúdo.
 *
 * Com ÍCONE DE TRAÇO, não emblema 3D — pela mesma razão que o menu do app não
 * usa emblema: aqui a pessoa entra todo dia, e ilustração grande que é
 * encantadora na primeira visita vira barulho na décima.
 *
 * `passos` é o que separa um vazio que LAMENTA de um que ENSINA. "Nenhuma meta
 * cadastrada" é uma constatação; "1. dê um nome, 2. diga quanto, 3. escolha
 * até quando" é a tela dizendo o que fazer agora. O segundo é o que faz a
 * pessoa continuar em vez de fechar.
 */
export function Vazio({
  Icone,
  titulo,
  texto,
  acao,
  passos,
}: {
  Icone: LucideIcon;
  titulo: string;
  texto: string;
  acao?: React.ReactNode;
  passos?: string[];
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-white/60 px-6 py-10 text-center">
      <span
        aria-hidden
        className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-ciano-tint text-ciano-forte"
      >
        <Icone className="h-5 w-5" strokeWidth={2} />
      </span>
      <p className="mt-3 font-display text-base font-semibold text-primary">{titulo}</p>
      <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-muted-foreground">
        {texto}
      </p>

      {passos && passos.length > 0 && (
        /* Numerada e alinhada à esquerda: lista de passos centralizada é
           bonita e ilegível — o olho perde o começo de cada linha. */
        <ol className="mx-auto mt-5 max-w-xs space-y-2 text-left">
          {passos.map((p, i) => (
            <li key={p} className="flex items-start gap-2.5">
              <span
                aria-hidden
                className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ciano-tint text-2xs font-bold text-ciano-forte"
              >
                {i + 1}
              </span>
              <span className="text-xs leading-relaxed text-muted-foreground">{p}</span>
            </li>
          ))}
        </ol>
      )}

      {acao && <div className="mt-5 flex justify-center">{acao}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════ Gráficos novos ═════
/**
 * A SEGUNDA LEVA DE PEÇAS — os desenhos que faltavam.
 *
 * POR QUE SVG NA MÃO, DE NOVO
 * Recharts custa ~180 KB comprimidos, D3 mais ainda, e este app é aberto no
 * 4G, em pé, para responder uma pergunta só. Uma biblioteca de gráfico aqui
 * pagaria em segundos de espera aquilo que quinze linhas de trigonometria
 * entregam de graça. O `GraficoSaldo` já provou o caminho; estas peças seguem
 * a mesma escola.
 *
 * AS TRÊS REGRAS QUE VALEM PARA TODAS ELAS
 * 1. Cor nunca é o único recado. Onde há vermelho há também hachura, sinal,
 *    ícone ou posição — um app de dinheiro que só fala por verde/vermelho é
 *    ilegível para 8% dos homens, que é justamente o público que mais mexe em
 *    planilha.
 * 2. Todo desenho tem uma versão em texto (`sr-only`, tabela de verdade quando
 *    a série tem mais de uma dimensão). Gráfico sem alternativa textual é um
 *    buraco na página para quem navega por áudio.
 * 3. Dado ralo se declara. Uma série com um ponto só NÃO vira linha: linha
 *    entre dois nadas sugere tendência onde não há nenhuma, e gráfico que
 *    finge precisão é pior que a tabela que ele substituiu.
 */

/* Hachura diagonal: é o que diferencia "passou do plano" de "dentro do plano"
   sem depender do vermelho. É desenho puro, some sob `forced-colors` sem
   prejuízo — lá a borda e o texto continuam de pé. */
const HACHURA =
  "repeating-linear-gradient(135deg, transparent 0 3px, rgba(255,255,255,0.45) 3px 6px)";

/** Dinheiro curto para eixo: "12 mil", "1,2 mi". Eixo não é lugar de centavo. */
export const brlCurto = (v: number) => {
  const a = Math.abs(v);
  const s = v < 0 ? "−" : "";
  if (a >= 1_000_000) return `${s}${(a / 1_000_000).toFixed(1).replace(".", ",")} mi`;
  if (a >= 1_000)
    return `${s}${(a / 1_000).toFixed(a >= 10_000 ? 0 : 1).replace(".", ",")} mil`;
  return `${s}${Math.round(a)}`;
};

/** O aviso honesto de que não há desenho a fazer. */
function SemDesenho({ texto }: { texto: string }) {
  return (
    <p className="rounded-xl border border-dashed border-border bg-gelo px-4 py-6 text-center text-2xs leading-relaxed text-muted-foreground">
      {texto}
    </p>
  );
}

// ───────────────────────────────────────────────────────── Gráfico de área ──

export type PontoArea = {
  /** "2026-03". */
  ref: string;
  entrada: number;
  saida: number;
};

/**
 * Receita × despesa ao longo do ano, em área.
 *
 * POR QUE ÁREA E NÃO DUAS LINHAS
 * O que interessa não é o valor de cada mês — é a DISTÂNCIA entre as duas
 * curvas, porque essa distância é a sobra. Área preenchida transforma essa
 * distância em uma superfície, e superfície o olho mede sem contar; duas
 * linhas finas obrigam a subtrair de cabeça, doze vezes.
 *
 * POR QUE A DESPESA É TRACEJADA
 * Porque a diferença entre as duas curvas não pode morar só na cor. Traço
 * cheio = entrou, traço cortado = saiu. Quem não distingue ciano de laranja lê
 * exatamente a mesma coisa que os outros.
 *
 * A escala parte SEMPRE do zero. Gráfico de dinheiro com a base cortada é a
 * mentira mais antiga da estatística: dois meses quase iguais viram um degrau
 * de montanha.
 */
export function GraficoArea({
  serie,
  formatar,
  rotuloEntrada = "Entrou",
  rotuloSaida = "Saiu",
  destaque,
}: {
  serie: PontoArea[];
  formatar: (v: number) => string;
  rotuloEntrada?: string;
  rotuloSaida?: string;
  /** O ref do mês que a tela está mostrando: ganha uma guia vertical. */
  destaque?: string;
}) {
  if (serie.length === 0)
    return (
      <SemDesenho texto="Ainda não há meses para desenhar. Lance o primeiro e a curva nasce sozinha." />
    );

  const L = 40; // margem esquerda: onde moram os valores do eixo.
  const W = 600;
  const H = 190;
  const B = 26; // margem de baixo: os nomes dos meses.
  const teto = Math.max(1, ...serie.map((p) => Math.max(p.entrada, p.saida)));

  const x = (i: number) =>
    serie.length === 1 ? (L + W) / 2 : L + (i / (serie.length - 1)) * (W - L);
  const y = (v: number) => H - B - (Math.max(0, v) / teto) * (H - B - 10);

  const linha = (campo: "entrada" | "saida") =>
    serie.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(p[campo])}`).join(" ");
  const area = (campo: "entrada" | "saida") =>
    `${linha(campo)} L ${x(serie.length - 1)} ${H - B} L ${x(0)} ${H - B} Z`;

  /* Um ponto só não é série: viram dois discos e uma frase. Desenhar a linha
     daria a impressão de tendência a partir de uma única medida. */
  const raso = serie.length === 1;
  const iDestaque = serie.findIndex((p) => p.ref === destaque);

  return (
    <figure>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label={`${rotuloEntrada} e ${rotuloSaida} mês a mês. Os valores estão na tabela ao lado, para leitores de tela.`}
      >
        {/* Três linhas de grade e mais nada: grade densa vira papel milimetrado
            e o dado desaparece dentro dela. */}
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line
              x1={L}
              x2={W}
              y1={y(teto * f)}
              y2={y(teto * f)}
              className="stroke-border"
              strokeWidth={1}
            />
            <text
              x={L - 6}
              y={y(teto * f) + 3.5}
              textAnchor="end"
              className="fill-muted-foreground tabular-nums"
              style={{ fontSize: 10 }}
            >
              {brlCurto(teto * f)}
            </text>
          </g>
        ))}

        {iDestaque >= 0 && (
          <line
            x1={x(iDestaque)}
            x2={x(iDestaque)}
            y1={10}
            y2={H - B}
            className="stroke-primary/35"
            strokeWidth={1}
            strokeDasharray="3 3"
          />
        )}

        {!raso && (
          <>
            <path d={area("entrada")} className="fill-ciano/[0.18]" />
            <path d={area("saida")} className="fill-accent/[0.16]" />
            <path
              d={linha("entrada")}
              fill="none"
              strokeWidth={2.5}
              strokeLinejoin="round"
              className="stroke-ciano-forte"
            />
            <path
              d={linha("saida")}
              fill="none"
              strokeWidth={2.5}
              strokeLinejoin="round"
              strokeDasharray="7 4"
              className="stroke-accent-btn"
            />
          </>
        )}

        {/* Os discos existem para o caso raso e para o mês em destaque; numa
            série longa eles viram sujeira, então só aparecem quando há poucos
            pontos ou quando o ponto é o que a tela está olhando. */}
        {serie.map((p, i) =>
          raso || serie.length <= 3 || p.ref === destaque ? (
            <g key={p.ref}>
              <circle cx={x(i)} cy={y(p.entrada)} r={3.5} className="fill-ciano-forte" />
              <circle
                cx={x(i)}
                cy={y(p.saida)}
                r={3.5}
                className="fill-white stroke-accent-btn"
                strokeWidth={2}
              />
            </g>
          ) : null,
        )}

        {serie.map((p, i) => (
          <text
            key={p.ref}
            x={x(i)}
            y={H - 8}
            textAnchor="middle"
            className={`capitalize ${
              p.ref === destaque ? "fill-primary font-semibold" : "fill-muted-foreground"
            }`}
            style={{ fontSize: 11 }}
          >
            {/* Em série longa só um rótulo a cada dois cabe sem colidir. O que
                se perde é o nome, não o dado — o dado está na tabela. */}
            {serie.length > 7 && i % 2 === 1 && p.ref !== destaque ? "" : mesCurto(p.ref)}
          </text>
        ))}
      </svg>

      <figcaption className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-2xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="h-0 w-4 border-t-2 border-ciano-forte" />
          {rotuloEntrada}
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="h-0 w-4 border-t-2 border-dashed border-accent-btn" />
          {rotuloSaida} (tracejado)
        </span>
        {raso && <span>Um mês só: sem histórico não há curva, só o ponto.</span>}
      </figcaption>

      <div className="tabela-so-leitor">
        <table>
          <caption>
            {rotuloEntrada} e {rotuloSaida} por mês
          </caption>
          <thead>
            <tr>
              <th scope="col">Mês</th>
              <th scope="col">{rotuloEntrada}</th>
              <th scope="col">{rotuloSaida}</th>
              <th scope="col">Sobra</th>
            </tr>
          </thead>
          <tbody>
            {serie.map((p) => (
              <tr key={p.ref}>
                <th scope="row">{mesCurto(p.ref)}</th>
                <td>{formatar(p.entrada)}</td>
                <td>{formatar(p.saida)}</td>
                <td>{formatar(p.entrada - p.saida)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}

// ─────────────────────────────────────────── Realizado × planejado (deitado)

export type LinhaOrcada = {
  id: string;
  nome: string;
  realizado: number;
  planejado: number;
  cor?: string;
};

/**
 * Barras horizontais de realizado × planejado, por categoria.
 *
 * POR QUE DEITADA, E NÃO EM PÉ
 * Porque o rótulo é um NOME ("Alimentação fora de casa"), e nome em coluna
 * vertical só cabe girado 45° — que é a decisão de design que obriga a pessoa
 * a inclinar a cabeça. Deitado, o nome ocupa a linha inteira e a barra corre
 * embaixo dele; e a lista cresce para baixo, que é a direção em que celular
 * rola.
 *
 * O EXCEDENTE SAI PARA FORA DA MARCA, HACHURADO. Enquanto o realizado cabe no
 * planejado ele é uma barra lisa; o que passa vira faixa listrada depois do
 * risco. A listra é o que diz "estourou" para quem não vê o vermelho, e o
 * risco é o que diz de quanto era o combinado.
 *
 * A escala é comum a todas as linhas (o maior valor da lista manda), senão duas
 * categorias de tamanhos diferentes desenhariam barras iguais e a lista
 * mentiria a proporção.
 */
export function BarrasRealizadoPlanejado({
  linhas,
  formatar,
  rotuloRealizado = "Realizado",
  rotuloPlanejado = "Planejado",
  maximo,
}: {
  linhas: LinhaOrcada[];
  formatar: (v: number) => string;
  rotuloRealizado?: string;
  rotuloPlanejado?: string;
  /** Força o teto da escala. Útil quando duas listas na mesma tela precisam
      compartilhar a régua — sem isso cada uma se normaliza e elas deixam de
      ser comparáveis entre si. */
  maximo?: number;
}) {
  if (linhas.length === 0)
    return <SemDesenho texto="Nenhuma categoria com valor neste período." />;

  const teto =
    maximo ?? Math.max(1, ...linhas.map((l) => Math.max(l.realizado, l.planejado)));

  return (
    <figure>
      <ul className="space-y-3.5">
        {linhas.map((l) => {
          const pctPlano = l.planejado > 0 ? (l.realizado / l.planejado) * 100 : null;
          const estourou = l.planejado > 0 && l.realizado > l.planejado;
          const dentro = Math.max(0, Math.min(l.realizado, l.planejado || l.realizado));
          const excesso = Math.max(0, l.realizado - (l.planejado || l.realizado));
          const larg = (v: number) => `${limitar((v / teto) * 100)}%`;

          return (
            <li key={l.id}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                  {l.nome}
                </span>
                <span className="shrink-0 text-sm tabular-nums text-primary">
                  {formatar(l.realizado)}
                </span>
                {pctPlano !== null && (
                  /* O percentual leva um sinal de exclamação quando passou: a
                     forma diz o que a cor diria. */
                  <span
                    className={`w-[3.75rem] shrink-0 text-right text-2xs font-semibold tabular-nums ${
                      estourou ? "text-destructive" : "text-muted-foreground"
                    }`}
                  >
                    {estourou ? "! " : ""}
                    {Math.round(pctPlano)}%
                  </span>
                )}
              </div>

              <div
                className="relative mt-1.5 h-3 overflow-hidden rounded-full bg-gelo"
                aria-hidden
              >
                <div className="flex h-full">
                  <span
                    className="h-full rounded-l-full transition-[width] duration-700 ease-out motion-reduce:transition-none"
                    style={{
                      width: larg(dentro),
                      background: l.cor ?? "var(--color-ciano)",
                    }}
                  />
                  {excesso > 0 && (
                    <span
                      className="h-full rounded-r-full bg-destructive transition-[width] duration-700 ease-out motion-reduce:transition-none"
                      style={{ width: larg(excesso), backgroundImage: HACHURA }}
                    />
                  )}
                </div>

                {l.planejado > 0 && l.planejado <= teto && (
                  <span
                    className="absolute inset-y-0 w-0.5 bg-primary"
                    style={{ left: `calc(${(l.planejado / teto) * 100}% - 1px)` }}
                  />
                )}
              </div>

              <p className="mt-1 text-2xs leading-snug text-muted-foreground">
                {l.planejado > 0
                  ? `${rotuloPlanejado} ${formatar(l.planejado)} — ${
                      estourou
                        ? `passou ${formatar(l.realizado - l.planejado)}`
                        : `faltam ${formatar(l.planejado - l.realizado)}`
                    }`
                  : "Sem plano definido para esta categoria."}
              </p>
            </li>
          );
        })}
      </ul>

      <figcaption className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-2xs text-muted-foreground">
        <Legenda classe="bg-ciano" texto={rotuloRealizado} />
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="h-3.5 w-0.5 bg-primary" />
          {rotuloPlanejado}
        </span>
        <span className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="h-2.5 w-2.5 rounded-sm bg-destructive"
            style={{ backgroundImage: HACHURA }}
          />
          Passou do plano (listrado)
        </span>
      </figcaption>
    </figure>
  );
}

// ────────────────────────────────────────────────────────────────── Rosca ───

export type Fatia = {
  id: string;
  nome: string;
  valor: number;
  cor?: string;
};

/* A ordem das cores da rosca. Ciano manda (é informação), o laranja entra em
   segundo, e o resto desce em tons que continuam distinguíveis em escala de
   cinza — o teste que importa, já que dois azuis vizinhos que passam no olho
   colorido somem no daltônico. */
const CORES_ROSCA = [
  "hsl(197 70% 38%)",
  "hsl(16 80% 52%)",
  "hsl(215 50% 33%)",
  "hsl(197 60% 62%)",
  "hsl(38 85% 55%)",
  "hsl(152 45% 42%)",
  "hsl(265 35% 58%)",
];

/**
 * Rosca de composição — "de onde vem" ou "onde está".
 *
 * ROSCA E NÃO PIZZA porque o furo carrega o total, que é a primeira coisa que
 * a pessoa procura. Pizza cheia obriga a somar as fatias de olho.
 *
 * A LEGENDA É NUMERADA, e as fatias saem das 12h no sentido do relógio, da
 * maior para a menor. Esse é o contrato que substitui a cor: "1" é a maior
 * fatia e está no primeiro pedaço depois do topo. Sem isso, uma rosca com seis
 * instituições é seis manchas e uma lista que ninguém consegue casar.
 *
 * O RESTO É AGRUPADO. Acima de sete fatias a rosca vira serrilha ilegível; da
 * sétima em diante tudo vira "Outros", e os números continuam na tabela.
 */
export function RoscaComposicao({
  fatias,
  formatar,
  centro,
  legendaCentro = "total",
  tamanho = 168,
  maxFatias = 7,
}: {
  fatias: Fatia[];
  formatar: (v: number) => string;
  /** Substitui o total do meio (já formatado). */
  centro?: string;
  legendaCentro?: string;
  tamanho?: number;
  maxFatias?: number;
}) {
  const positivas = fatias.filter((f) => Number.isFinite(f.valor) && f.valor > 0);
  const total = positivas.reduce((s, f) => s + f.valor, 0);

  if (total <= 0)
    return (
      <SemDesenho texto="Nada somado ainda: a composição aparece quando houver ao menos um valor." />
    );

  const ordenadas = [...positivas].sort((a, b) => b.valor - a.valor);
  const visiveis: Fatia[] =
    ordenadas.length > maxFatias
      ? [
          ...ordenadas.slice(0, maxFatias - 1),
          {
            id: "__outros",
            nome: `Outros (${ordenadas.length - maxFatias + 1})`,
            valor: ordenadas.slice(maxFatias - 1).reduce((s, f) => s + f.valor, 0),
          },
        ]
      : ordenadas;

  const espessura = Math.max(14, tamanho * 0.16);
  const r = (tamanho - espessura) / 2;
  const volta = 2 * Math.PI * r;

  let acumulado = 0;
  const arcos = visiveis.map((f, i) => {
    const frac = f.valor / total;
    const inicio = acumulado;
    acumulado += frac;
    return {
      f,
      i,
      frac,
      cor: f.cor ?? CORES_ROSCA[i % CORES_ROSCA.length],
      /* 1px de respiro entre fatias: sem o vão, duas cores vizinhas de
         luminosidade parecida lêem como uma fatia só. */
      dash: `${Math.max(0, volta * frac - 1)} ${volta}`,
      offset: -volta * inicio,
    };
  });

  return (
    <figure className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
      <svg
        width={tamanho}
        height={tamanho}
        viewBox={`0 0 ${tamanho} ${tamanho}`}
        className="shrink-0"
        role="img"
        aria-label={`Composição por fatia. Total ${formatar(total)}. Os valores estão na tabela para leitores de tela.`}
      >
        <g transform={`rotate(-90 ${tamanho / 2} ${tamanho / 2})`}>
          <circle
            cx={tamanho / 2}
            cy={tamanho / 2}
            r={r}
            fill="none"
            strokeWidth={espessura}
            className="stroke-border"
          />
          {arcos.map((a) => (
            <circle
              key={a.f.id}
              cx={tamanho / 2}
              cy={tamanho / 2}
              r={r}
              fill="none"
              strokeWidth={espessura}
              stroke={a.cor}
              strokeDasharray={a.dash}
              strokeDashoffset={a.offset}
            />
          ))}
        </g>
        <text
          x="50%"
          y="47%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-primary font-display font-semibold tabular-nums"
          style={{ fontSize: tamanho * ((centro ?? formatar(total)).length > 9 ? 0.11 : 0.15) }}
        >
          {centro ?? formatar(total)}
        </text>
        <text
          x="50%"
          y="62%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-muted-foreground"
          style={{ fontSize: tamanho * 0.085 }}
        >
          {legendaCentro}
        </text>
      </svg>

      <ol className="w-full min-w-0 flex-1 space-y-1.5">
        {arcos.map((a) => (
          <li key={a.f.id} className="flex items-center gap-2 text-2xs">
            <span
              aria-hidden
              className="flex h-4 w-4 shrink-0 items-center justify-center rounded text-[9px] font-bold text-white"
              style={{ background: a.cor }}
            >
              {a.i + 1}
            </span>
            <span className="min-w-0 flex-1 truncate text-foreground">{a.f.nome}</span>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              {formatar(a.f.valor)}
            </span>
            <span className="w-9 shrink-0 text-right font-semibold tabular-nums text-primary">
              {Math.round(a.frac * 100)}%
            </span>
          </li>
        ))}
      </ol>

      <div className="tabela-so-leitor">
        <table>
          <caption>Composição, do maior para o menor. Total {formatar(total)}.</caption>
          <thead>
            <tr>
              <th scope="col">Item</th>
              <th scope="col">Valor</th>
              <th scope="col">Participação</th>
            </tr>
          </thead>
          <tbody>
            {arcos.map((a) => (
              <tr key={a.f.id}>
                <th scope="row">{a.f.nome}</th>
                <td>{formatar(a.f.valor)}</td>
                <td>{Math.round(a.frac * 100)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}

// ──────────────────────────────────────────── Barras verticais de percentual

/**
 * Quanto cada categoria pesa SOBRE A RECEITA, em colunas de percentual.
 *
 * POR QUE ESTE GRÁFICO NÃO É O MESMO QUE O DE VALORES
 * "Gastei R$ 900 com moradia" não julga nada; "moradia come 34% do que entra"
 * julga tudo. A régua deste desenho é a renda, e por isso ele responde a única
 * pergunta que orçamento de verdade faz: sobra?
 *
 * A LINHA DE REFERÊNCIA é opcional e serve para a regra que a casa adotar
 * (30% de moradia, 20% de poupança). Ela é tracejada porque é combinado, não
 * medida — e a coluna que a ultrapassa ganha hachura, não só cor.
 */
export function BarrasPercentual({
  itens,
  referencia,
  rotuloReferencia = "referência",
  altura = 140,
}: {
  itens: { id: string; nome: string; pct: number; cor?: string }[];
  /** 0 a 100: o teto recomendado. */
  referencia?: number;
  rotuloReferencia?: string;
  altura?: number;
}) {
  if (itens.length === 0)
    return <SemDesenho texto="Sem categorias para comparar com a receita." />;

  /* A escala vai até 100% OU até a maior coluna, o que for maior. Aparar em
     100 esconderia justamente a categoria que engoliu a renda inteira. */
  const teto = Math.max(100, ...itens.map((i) => (Number.isFinite(i.pct) ? i.pct : 0)));

  return (
    <figure>
      <div className="relative" style={{ height: altura }}>
        {referencia !== undefined && (
          <span
            aria-hidden
            className="absolute inset-x-0 border-t border-dashed border-primary/50"
            style={{ bottom: `${(referencia / teto) * 100}%` }}
          />
        )}
        <ul className="flex h-full items-end gap-1.5 sm:gap-2.5">
          {itens.map((i) => {
            const pct = Math.max(0, Number.isFinite(i.pct) ? i.pct : 0);
            const passou = referencia !== undefined && pct > referencia;
            return (
              <li key={i.id} className="flex h-full min-w-0 flex-1 flex-col justify-end">
                <span className="mb-1 block truncate text-center text-2xs font-semibold tabular-nums text-primary">
                  {Math.round(pct)}%
                </span>
                <span
                  className="block w-full rounded-t-md transition-[height] duration-700 ease-out motion-reduce:transition-none"
                  style={{
                    height: `${(pct / teto) * 100}%`,
                    background: i.cor ?? "var(--color-ciano)",
                    backgroundImage: passou ? HACHURA : undefined,
                  }}
                />
              </li>
            );
          })}
        </ul>
      </div>

      <ul aria-hidden className="mt-1.5 flex gap-1.5 sm:gap-2.5">
        {itens.map((i) => (
          <li
            key={i.id}
            className="min-w-0 flex-1 truncate text-center text-2xs text-muted-foreground"
            title={i.nome}
          >
            {i.nome}
          </li>
        ))}
      </ul>

      {referencia !== undefined && (
        <figcaption className="mt-2 flex items-center gap-1.5 text-2xs text-muted-foreground">
          <span aria-hidden className="h-0 w-4 border-t border-dashed border-primary/60" />
          {rotuloReferencia}: {referencia}% da receita. Acima disso a coluna fica
          listrada.
        </figcaption>
      )}

      <div className="tabela-so-leitor">
        <table>
          <caption>Peso de cada categoria sobre a receita</caption>
          <thead>
            <tr>
              <th scope="col">Categoria</th>
              <th scope="col">Percentual da receita</th>
            </tr>
          </thead>
          <tbody>
            {itens.map((i) => (
              <tr key={i.id}>
                <th scope="row">{i.nome}</th>
                <td>{Math.round(Math.max(0, i.pct))}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}

// ────────────────────────────────────────────────────────── Barras + linha ──

export type PontoMisto = {
  ref: string;
  /** A coluna: o valor DO mês (sobra, aporte, saldo). Pode ser negativo. */
  barra: number;
  /** A curva: o acumulado, a meta, a renda passiva. Mesma unidade da barra. */
  linha: number;
};

/**
 * Barras e linha no mesmo eixo — o mês e o acumulado juntos.
 *
 * POR QUE OS DOIS NO MESMO DESENHO
 * Separados são duas perguntas ("quanto guardei em março?" e "quanto tenho?");
 * juntos são uma só, que é a que interessa: o quanto o mês empurra o total. A
 * curva que sobe devagar sobre barras altas é a imagem de quem guarda muito e
 * ainda está longe — e essa imagem não existe em dois gráficos separados.
 *
 * MESMO EIXO, SEMPRE. Duas escalas no mesmo quadro é o gráfico mais desonesto
 * que existe: quem desenha escolhe onde as curvas se cruzam. Se as grandezas
 * não couberem na mesma régua, o certo é dois gráficos, não dois eixos.
 *
 * No celular o desenho DEITA, como o `GraficoSaldo`: doze colunas em 390px dão
 * 24px cada, e 24px não é largura de rótulo nem alvo de toque. Deitado, a
 * curva vira uma coluna de losangos e a leitura de tendência passa para os
 * números da direita — que continuam alinhados em `tabular-nums`.
 */
export function BarrasComLinha({
  pontos,
  formatar,
  rotuloBarra = "No mês",
  rotuloLinha = "Acumulado",
  altura = 176,
}: {
  pontos: PontoMisto[];
  formatar: (v: number) => string;
  rotuloBarra?: string;
  rotuloLinha?: string;
  altura?: number;
}) {
  if (pontos.length === 0)
    return <SemDesenho texto="Sem meses suficientes para cruzar o mês com o acumulado." />;

  const valores = pontos.flatMap((p) => [p.barra, p.linha]);
  const teto = Math.max(0, ...valores);
  const piso = Math.min(0, ...valores);
  const amplitude = Math.max(1, teto - piso);
  /** Fração de 0 a 1 medida do fundo — a mesma régua do `GraficoSaldo`. */
  const fracao = (v: number) => (v - piso) / amplitude;
  const zero = fracao(0);

  const W = 600;
  const H = altura;
  const passo = W / pontos.length;
  const cx = (i: number) => passo * i + passo / 2;
  const cy = (v: number) => H - fracao(v) * H;

  const curva = pontos
    .map((p, i) => `${i === 0 ? "M" : "L"} ${cx(i)} ${cy(p.linha)}`)
    .join(" ");

  const descricao = (p: PontoMisto) =>
    `${mesCurto(p.ref)}: ${rotuloBarra} ${formatar(p.barra)}, ${rotuloLinha} ${formatar(p.linha)}.`;

  return (
    <figure>
      {/* ── Computador ──────────────────────────────────────────────────── */}
      <div className="hidden sm:block">
        <div className="mb-1 flex items-baseline justify-between text-2xs text-muted-foreground">
          <span className="tabular-nums">{formatar(teto)}</span>
          <span className="tabular-nums">{formatar(piso)}</span>
        </div>

        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="w-full"
          style={{ height: H }}
          role="img"
          aria-label={`${rotuloBarra} em colunas e ${rotuloLinha} em linha. Os valores estão na tabela para leitores de tela.`}
        >
          <line
            x1={0}
            x2={W}
            y1={cy(0)}
            y2={cy(0)}
            className="stroke-primary/30"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
          {pontos.map((p, i) => {
            const topo = Math.min(cy(p.barra), cy(0));
            const alt = Math.max(2, Math.abs(cy(p.barra) - cy(0)));
            return (
              <rect
                key={p.ref}
                x={cx(i) - passo * 0.3}
                width={passo * 0.6}
                y={topo}
                height={alt}
                className={p.barra < 0 ? "fill-destructive" : "fill-ciano/70"}
              />
            );
          })}
          <path
            d={curva}
            fill="none"
            strokeWidth={2.5}
            strokeLinejoin="round"
            className="stroke-accent-btn"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* Os losangos da curva ficam FORA do `preserveAspectRatio="none"`:
            dentro dele o esticão horizontal transformaria cada disco num ovo.
            Aqui eles são posicionados em percentual sobre a mesma altura. */}
        <div aria-hidden className="relative" style={{ height: 0 }}>
          {pontos.map((p, i) => (
            <span
              key={p.ref}
              className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border-2 border-accent-btn bg-white"
              style={{
                /* O SVG acima tem altura H, então o seu topo está em -H daqui;
                   o ponto da curva está a `cy` do topo dele. */
                left: `${((i + 0.5) / pontos.length) * 100}%`,
                top: -H + cy(p.linha),
              }}
            />
          ))}
        </div>

        <ul aria-hidden className="mt-1.5 flex">
          {pontos.map((p) => (
            <li
              key={p.ref}
              className="min-w-0 flex-1 truncate text-center text-2xs capitalize text-muted-foreground"
            >
              {mesCurto(p.ref)}
            </li>
          ))}
        </ul>
      </div>

      {/* ── Celular: o mesmo dado, deitado ──────────────────────────────── */}
      <ul className="divide-y divide-border/60 sm:hidden">
        {pontos.map((p) => {
          const x = fracao(p.barra) * 100;
          const zeroPct = zero * 100;
          return (
            <li key={p.ref} className="flex min-h-11 items-center gap-2 py-2">
              <span className="w-10 shrink-0 truncate text-2xs capitalize text-muted-foreground">
                {mesCurto(p.ref)}
              </span>
              <span aria-hidden className="relative h-3 min-w-0 flex-1 rounded bg-gelo">
                <span
                  className="absolute inset-y-0 w-px bg-primary/30"
                  style={{ left: `${zeroPct}%` }}
                />
                <span
                  className={`absolute inset-y-0.5 rounded-sm ${
                    p.barra < 0 ? "bg-destructive" : "bg-ciano"
                  }`}
                  style={{
                    left: `${Math.min(x, zeroPct)}%`,
                    width: `${Math.max(0.8, Math.abs(x - zeroPct))}%`,
                  }}
                />
                <span
                  className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border-2 border-accent-btn bg-white"
                  style={{ left: `${limitar(fracao(p.linha) * 100)}%` }}
                />
              </span>
              <span className="w-[4.5rem] shrink-0 text-right text-2xs tabular-nums text-primary">
                {formatar(p.linha)}
              </span>
              <span className="sr-only">{descricao(p)}</span>
            </li>
          );
        })}
      </ul>

      <figcaption className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-2xs text-muted-foreground">
        <Legenda classe="bg-ciano" texto={rotuloBarra} />
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="h-0 w-4 border-t-2 border-accent-btn" />
          {rotuloLinha} (linha com losango)
        </span>
        {piso < 0 && <Legenda classe="bg-destructive" texto="Mês negativo (barra para baixo)" />}
      </figcaption>

      <div className="tabela-so-leitor">
        <table>
          <caption>
            {rotuloBarra} e {rotuloLinha} por mês
          </caption>
          <thead>
            <tr>
              <th scope="col">Mês</th>
              <th scope="col">{rotuloBarra}</th>
              <th scope="col">{rotuloLinha}</th>
            </tr>
          </thead>
          <tbody>
            {pontos.map((p) => (
              <tr key={p.ref}>
                <th scope="row">{mesCurto(p.ref)}</th>
                <td>{formatar(p.barra)}</td>
                <td>{formatar(p.linha)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}

// ──────────────────────────────────────────────────────── Faixa de variação ─

/**
 * Mínimo, média e máximo de uma categoria — a peça do orçamento honesto.
 *
 * POR QUE ELA É A MAIS IMPORTANTE DESTE BLOCO
 * Orçamento errado não nasce de preguiça, nasce de MÉDIA. "Você gasta R$ 800
 * em mercado" é verdade e é inútil: em três meses foi 620, 780 e 1.010, e quem
 * orça 800 estoura um mês em cada três e culpa a si mesmo. A faixa mostra a
 * variação real, e aí a pessoa escolhe conscientemente entre orçar apertado (a
 * média) ou orçar com folga (o topo).
 *
 * O `amostras` NÃO É ENFEITE. Faixa calculada sobre dois meses tem a mesma
 * aparência de uma calculada sobre doze e não vale nada; a peça avisa quando
 * está falando com pouca base, em vez de deixar o desenho fingir autoridade.
 */
export function FaixaVariacao({
  rotulo,
  minimo,
  media,
  maximo,
  atual,
  amostras,
  formatar,
  minimoConfiavel = 3,
}: {
  rotulo: string;
  minimo: number;
  media: number;
  maximo: number;
  /** O valor do mês corrente, para saber onde ele cai dentro da faixa. */
  atual?: number;
  /** Quantos meses entraram na conta. */
  amostras?: number;
  formatar: (v: number) => string;
  /** Abaixo disto a peça diz em voz alta que a base é curta. */
  minimoConfiavel?: number;
}) {
  const lo = Math.min(minimo, maximo);
  const hi = Math.max(minimo, maximo);
  const span = Math.max(1e-9, hi - lo);
  /** Posição de 0 a 100 dentro da faixa desenhada. */
  const pos = (v: number) => limitar(((v - lo) / span) * 100);
  /* Faixa degenerada (todos os meses iguais, ou um mês só) desenha o trilho
     inteiro em vez de um risco de largura zero — largura zero lê como erro. */
  const chata = hi - lo < 0.01;
  const fraco = amostras !== undefined && amostras < minimoConfiavel;
  const foraDaFaixa = atual !== undefined && (atual < lo - 0.01 || atual > hi + 0.01);

  const descricao = `${rotulo}: variou de ${formatar(lo)} a ${formatar(hi)}, média ${formatar(
    media,
  )}${atual !== undefined ? `, neste mês ${formatar(atual)}` : ""}${
    amostras !== undefined ? `, sobre ${amostras} ${amostras === 1 ? "mês" : "meses"}` : ""
  }.`;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="min-w-0 truncate text-sm text-foreground">{rotulo}</p>
        <p className="shrink-0 text-2xs tabular-nums text-muted-foreground">
          média {formatar(media)}
        </p>
      </div>

      <div className="relative mt-3 h-6" role="img" aria-label={descricao}>
        <span
          aria-hidden
          className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-gelo"
        />
        {/* A faixa que de fato aconteceu. Quando ela é degenerada vira um pino,
            não um retângulo de largura zero. */}
        <span
          aria-hidden
          className={`absolute top-1/2 h-2 -translate-y-1/2 rounded-full bg-ciano/40 ${
            chata ? "w-1.5 -translate-x-1/2" : "inset-x-0"
          }`}
          style={chata ? { left: "50%" } : undefined}
        />
        {/* Média: pino cheio. Mês atual: losango. Formas diferentes porque são
            coisas diferentes, e não porque seriam cores diferentes. */}
        <span
          aria-hidden
          className="absolute top-1/2 h-4 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary"
          style={{ left: `${chata ? 50 : pos(media)}%` }}
        />
        {atual !== undefined && (
          <span
            aria-hidden
            className={`absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border-2 bg-white ${
              foraDaFaixa ? "border-destructive" : "border-accent-btn"
            }`}
            style={{ left: `${chata ? 50 : pos(atual)}%` }}
          />
        )}
      </div>

      <div className="mt-1 flex items-baseline justify-between gap-2 text-2xs tabular-nums text-muted-foreground">
        <span>mín {formatar(lo)}</span>
        {chata && <span className="text-center tabular-nums">sem variação</span>}
        <span>máx {formatar(hi)}</span>
      </div>

      {(fraco || atual !== undefined) && (
        <p className="mt-1.5 text-2xs leading-snug text-muted-foreground">
          {atual !== undefined && (
            <span className={foraDaFaixa ? "font-semibold text-destructive" : ""}>
              Este mês: {formatar(atual)}
              {foraDaFaixa ? " — fora da faixa dos meses anteriores. " : ". "}
            </span>
          )}
          {fraco && (
            <span>
              Base curta: {amostras} {amostras === 1 ? "mês" : "meses"}. Com menos de{" "}
              {minimoConfiavel} a faixa ainda não é um retrato do seu hábito.
            </span>
          )}
        </p>
      )}

      <span className="sr-only">{descricao}</span>
    </div>
  );
}
