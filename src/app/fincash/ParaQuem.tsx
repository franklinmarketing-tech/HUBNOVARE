import {
  CalendarClock,
  CreditCard,
  Gauge,
  Layers,
  RefreshCw,
  TrendingDown,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Persona, TituloSecao, tomPor } from "@/components/SecoesVenda";
import "./vitrine.css";
import "./cinema.css";

/**
 * "Para quem é o FINCASH" — as sete linhas do Jefferson.
 *
 * ── O TEXTO NÃO É MEU, E É POR ISSO QUE ELE NÃO FOI REESCRITO ─────────────
 * As sete frases vieram prontas da revisão de 11/09/2026 e estão aqui
 * LITERAIS, vírgula por vírgula. Se alguém for "melhorar a copy", saiba que
 * está editando a voz da casa e não um rascunho: o que está aberto a mudança
 * é a FORMA (quantas colunas, qual ícone, o que vai em destaque) e o
 * complemento em cinza abaixo de cada frase. A frase, não.
 *
 * ── POR QUE 1 + 6, E NÃO SETE CARDS IGUAIS ────────────────────────────────
 * Sete cards do mesmo tamanho viram parede: o olho lê os dois primeiros,
 * reconhece o padrão e pula o resto — justamente numa seção cujo trabalho é a
 * pessoa se reconhecer em UMA das linhas. As sete frases já vinham divididas
 * em duas naturezas, e o agrupamento só torna isso visível: a primeira é um
 * DIAGNÓSTICO ("não sabe para onde ele vai"), as outras seis são DESEJOS
 * ("tem…", "quer…"). O diagnóstico ganha o card navy largo, que é a única
 * peça escura da seção; os seis desejos viram grade.
 *
 * ⚠️ SE UMA OITAVA FRASE CHEGAR, ela entra na grade, não no card navy. Dois
 * cards escuros na mesma seção e nenhum dos dois é o destaque.
 *
 * ── O ✓ DA COPY VIROU ÍCONE TEMÁTICO ──────────────────────────────────────
 * A lista do Jefferson vinha com "✓" em cada linha, que é notação de lista
 * escrita no Google Docs — não um veredito. Sete tiques verdes iguais aqui
 * diriam "o FINCASH faz as sete coisas", que é o argumento do COMPARATIVO e
 * não o desta seção. O ícone temático (cartão, calendário, medidor) é o
 * mesmo idioma dos cards do site oficial da casa, e diz de qual tela a frase
 * está falando antes de o cinza explicar.
 *
 * ── O COMPLEMENTO EM CINZA APONTA PARA UMA TELA QUE EXISTE ────────────────
 * Cada um cita a tela que resolve aquela frase, com um número ou um
 * comportamento real conferido no produto (Orçamento, Cartões, Contas fixas,
 * Dívidas, Projeção, Painel). Nenhum promete o que o app não faz — se um dia
 * uma tela mudar de nome ou de conta, é aqui que a seção envelhece.
 */

/** O diagnóstico que abre — a única frase da lista que não começa com um desejo. */
const ABERTURA = {
  icone: Wallet,
  frase: "Você ganha dinheiro, mas não sabe para onde ele vai.",
  complemento:
    "O Orçamento reparte o mês por categoria e, em cada uma, mostra o mínimo, a média e o máximo que você já gastou nos últimos seis meses. O limite deixa de ser chute.",
};

const DESEJOS: { icone: LucideIcon; frase: string; complemento: string }[] = [
  {
    icone: Layers,
    frase: "Tem várias parcelas e compromissos futuros.",
    complemento:
      "Uma compra em 12x nasce com as doze parcelas na linha do tempo, cada uma no mês em que cai — e não uma por vez, quando a fatura chega.",
  },
  {
    icone: RefreshCw,
    frase: "Quer organizar suas contas.",
    complemento:
      "Aluguel, escola, internet e salário são cadastrados uma vez em Contas fixas. O mês seguinte já abre preenchido, sempre como previsto.",
  },
  {
    icone: TrendingDown,
    frase: "Quer sair das dívidas.",
    complemento:
      "A tela de Dívidas compara avalanche e bola de neve em reais: quanto de juro cada ordem economiza e quantos meses ela adianta.",
  },
  {
    icone: CreditCard,
    frase: "Quer controlar melhor o cartão.",
    complemento:
      "Todos os cartões no mesmo lugar, cada um no ciclo dele — fecha dia 20, vence dia 28 — com quanto do mês que vem já está comprometido.",
  },
  {
    icone: CalendarClock,
    frase: "Quer planejar seus próximos meses.",
    complemento:
      "A Projeção mostra os doze meses seguintes com o que você já cadastrou, e aponta o primeiro mês que fecha no vermelho.",
  },
  {
    icone: Gauge,
    frase: "Quer saber quanto realmente pode gastar.",
    complemento:
      "Um número só, no Painel: o que sobra até o fim do mês já descontando as contas e as faturas que ainda vão sair.",
  },
];

export default function ParaQuem({ className }: { className?: string }) {
  const Icone = ABERTURA.icone;

  return (
    <section className={className}>
      {/* Os dois-pontos do título são do original e ficam: a frase ABRE a
          lista, e sem eles o h2 vira uma afirmação solta. */}
      <TituloSecao sobre="Para quem é" titulo="O FINCASH é para você se:" />

      {/* O DIAGNÓSTICO, EM NAVY.
          `fin-lustro` exige fundo opaco e recorta a lâmina — os dois já vêm do
          card. É a única peça com brilho na seção, e é uma passada só: brilho
          em laço aqui ensinaria o olho a ignorar a região inteira.

          Contraste medido sobre `bg-primary`: título branco 12,23:1, o
          complemento em `white/80` 8,43:1 e o ícone `accent-claro` 5,14:1. */}
      <div className="fin-lustro mt-9 rounded-3xl bg-primary p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-7">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-accent-claro">
            <Icone className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <p className="font-display text-xl font-semibold leading-snug text-white sm:text-2xl">
              {ABERTURA.frase}
            </p>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base">
              {ABERTURA.complemento}
            </p>
          </div>
        </div>
      </div>

      {/* OS SEIS DESEJOS.
          `Persona` é a peça de card da casa (fita colorida no topo, pastilha,
          ícone, título, parágrafo) e é reusada inteira: desenhar um card
          próprio aqui criaria uma segunda linhagem de card que envelhece
          separada da /planejamento e da /assinar.

          `tomPor` alterna ciano e laranja pela posição — o laranja só tem
          força enquanto é exceção, e seis cards laranja seguidos o gastam.

          `fin-escada` vai na LISTA, nunca no item: ela é a `.surgir` do
          globals com atraso crescente nos filhos, e para de escalonar no sexto
          justamente para uma grade deste tamanho não parecer lenta. */}
      <ul className="fin-escada mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DESEJOS.map((d, i) => (
          <li key={d.frase} className="h-full">
            <Persona
              icone={d.icone}
              titulo={d.frase}
              texto={d.complemento}
              tom={tomPor(i)}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
