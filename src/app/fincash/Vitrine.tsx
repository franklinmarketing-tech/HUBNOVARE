import { Foto } from "./Molduras";
import "./vitrine.css";

/**
 * A VITRINE: três telas do FINCASH em leque, para a página provar que existe
 * produto antes de pedir que se acredite nela.
 *
 * ── POR QUE TRÊS, E NÃO UMA ───────────────────────────────────────────────
 * Uma captura sozinha prova que existe UMA tela. A objeção real de quem chega
 * numa landing de finanças não é "isto é bonito?", é "isto é um app inteiro ou
 * um formulário com nome?". Três telas diferentes — painel, cartões e metas —
 * respondem isso sem uma frase a mais, e são as três que a pessoa abre em dias
 * diferentes do mês (fecho, fatura, objetivo).
 *
 * ── POR QUE REUSA A `Foto`, E O QUE ELA NÃO RESOLVIA ──────────────────────
 * A moldura de celular já existe em `Molduras.tsx` (`Foto aparelho="telefone"`),
 * com o entalhe, o anel escuro e o catálogo de `alt` escrito. Desenhar uma
 * segunda aqui criaria duas molduras que envelhecem separadas — o clássico
 * "por que o celular do herói tem borda diferente do celular da seção 10".
 * O que a `Foto` NÃO faz é o leque, e é só isso que este arquivo acrescenta:
 * a rotação e o escalonamento vivem no contêiner, nunca dentro da moldura.
 *
 * ⚠️ OS LATERAIS NÃO USAM `inclinar`. A `.moldura-produto` aplica uma
 * perspectiva própria; somada à rotação do leque, o aparelho entorta em dois
 * eixos e lê como defeito de renderização. O do centro usa, porque nele a
 * inclinação é o único relevo que existe.
 *
 * ── OS `alt` SÃO DE VERDADE, E NÃO VAZIOS ─────────────────────────────────
 * A tentação é marcar as três como decorativas (`alt=""`) porque há texto ao
 * redor. Mas o texto ao redor vende o MÉTODO; as capturas vendem os NÚMEROS
 * (86% da renda comprometida, R$ 770 de fatura em aberto, 21% da renda em
 * metas), e esses números não estão escritos em lugar nenhum da página. Quem
 * navega por leitor de tela receberia uma vitrine muda. Os textos vêm prontos
 * do catálogo `TELAS`, que é a fonte única deles.
 *
 * ── CELULAR ESTREITO: UM APARELHO SÓ ──────────────────────────────────────
 * Abaixo de 640px o leque de três não cabe sem encolher cada aparelho a um
 * tamanho em que a captura vira mancha. Os laterais somem (`hidden sm:block`)
 * e fica o painel, que é a tela que carrega o argumento principal. Não é perda
 * de informação: os `alt` dos que somem descreviam telas que a página mostra
 * de novo, inteiras, mais abaixo.
 */
export default function Vitrine({ className }: { className?: string }) {
  return (
    // `overflow-x-clip` (e não `overflow-hidden`) porque o halo e a rotação dos
    // laterais passam da caixa: no celular isso rendia 8px de rolagem lateral
    // na página inteira, o defeito que mais denuncia landing mal terminada.
    // `clip` só no eixo X preserva a sombra funda que os aparelhos jogam para
    // baixo, que `overflow-hidden` decapitaria.
    <div className={`relative isolate overflow-x-clip ${className ?? ""}`}>
      {/* O halo. `-z-10` só funciona porque o contêiner é `isolate`: a luz cai
          atrás dos aparelhos sem cair atrás do fundo da seção que hospeda a
          vitrine. `aria-hidden` porque é luz, não conteúdo. */}
      <span
        aria-hidden
        className="fin-halo pointer-events-none absolute -inset-x-10 -inset-y-8 -z-10 sm:-inset-x-16 sm:-inset-y-12"
      />

      {/* `items-end` alinha os três pelo PÉ: os laterais são menores, e alinhar
          pelo topo deixaria um degrau no rodapé dos aparelhos. Eles ainda
          descem 1,25rem (a classe do leque), que é o que cria a profundidade.

          As margens negativas são o que faz o leque SOBREPOR em vez de ficarem
          três telefones enfileirados. */}
      <div className="fin-leque flex items-end justify-center">
        <div className="fin-leque-peca fin-leque-esq hidden w-[8.5rem] shrink-0 opacity-80 sm:block md:w-[10rem] lg:w-[11rem]">
          <Foto
            tela="cartoesCelular"
            aparelho="telefone"
            sizes="(max-width: 640px) 0px, (max-width: 1024px) 160px, 176px"
          />
        </div>

        {/* O do centro é o único `prioridade`. A página já marca esta MESMA
            captura como prioritária no herói; sendo o mesmo arquivo, o Next
            reaproveita a requisição e não há segunda prioridade de verdade.
            ⚠️ Se um dia o herói deixar de existir e esta vitrine não estiver na
            primeira dobra, tire o `prioridade` daqui: prioridade fora da
            primeira tela rouba banda do que a pessoa está lendo. */}
        <div className="fin-leque-peca relative z-10 -mx-6 w-[13rem] shrink-0 sm:-mx-8 sm:w-[14rem] md:w-[16rem] lg:w-[17rem]">
          <Foto
            tela="painelCelular"
            aparelho="telefone"
            prioridade
            inclinar
            sizes="(max-width: 640px) 208px, (max-width: 1024px) 256px, 272px"
          />
        </div>

        <div className="fin-leque-peca fin-leque-dir hidden w-[8.5rem] shrink-0 opacity-80 sm:block md:w-[10rem] lg:w-[11rem]">
          <Foto
            tela="metasCelular"
            aparelho="telefone"
            sizes="(max-width: 640px) 0px, (max-width: 1024px) 160px, 176px"
          />
        </div>
      </div>
    </div>
  );
}
