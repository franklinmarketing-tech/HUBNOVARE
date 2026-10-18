import Image from "next/image";

import { FIN_CASH } from "@/lib/hub-lp";

/**
 * AS TELAS DE VERDADE.
 *
 * ═══ POR QUE ESTE ARQUIVO EXISTE, SE JÁ HÁ `maquetes.tsx` ═════════════════
 *
 * `maquetes.tsx` desenha pedaços de interface em HTML e CSS, e o cabeçalho
 * dele defende bem a escolha: nas referências da página (Visor, Shotbase,
 * Calendly) o painel ao lado do texto nunca é uma FOTO. Isso continua valendo
 * — e nenhuma maquete foi removida.
 *
 * O que faltava era outra coisa: a landing inteira não mostrava o produto
 * REAL em lugar nenhum. Todas as imagens eram de pessoas, logos e ilustração.
 * Quem chegava na página via o argumento desenhado, nunca o app.
 *
 * ⚠️ CAPTURA DE TELA NÃO É "FOTO" NO SENTIDO QUE AS REFERÊNCIAS EVITAM. O que
 * elas evitam é foto de ambiente — mesa, notebook, mão segurando celular, que
 * fala do cenário e não do produto. Uma captura é interface, igual à maquete;
 * a diferença é que esta não foi desenhada para a página, foi tirada do app
 * rodando. É por isso que ela entra sem contradizer o desenho.
 *
 * ═══ A ETIQUETA NÃO É ENFEITE ════════════════════════════════════════════
 *
 * `maquetes.tsx` carrega a regra de que todo número ilustrativo aparece com a
 * palavra "exemplo" ao lado. Aqui os números são REAIS — vêm da conta de
 * demonstração, a mesma que `/fincash/testar` abre — mas são os números de um
 * mês fictício, não uma promessa de resultado. Por isso cada tela leva a
 * legenda dizendo de onde veio. Tirar a legenda transforma ilustração em
 * promessa, que é exatamente a linha que esta página não cruza.
 *
 * ⚠️ AS CAPTURAS ENVELHECEM. Elas mostram a interface do dia em que foram
 * tiradas: a do Workspace já traz o card unificado FINCASH e o preço
 * do anual. Mudou a home ou mudou o preço em tela? Estas imagens passam a
 * mentir caladas — nenhum teste pega isso, porque para o site são só arquivos.
 * Refazer é abrir `/fincash/testar` e recapturar.
 */

/** A legenda que separa "tela do produto" de "promessa de resultado". */
function Legenda({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-4 text-center text-[0.8125rem] font-medium tracking-[-0.01em] text-[#5b6d81]">
      {children}
    </p>
  );
}

/**
 * O Workspace inteiro, na moldura de janela que a página já usa nas maquetes
 * (`.nv-janela`, definida em `lp.css` — existe como classe justamente para ser
 * a MESMA janela em todos os lugares).
 */
export function TelaWorkspace({ legenda = true }: { legenda?: boolean }) {
  return (
    <div>
      {/* ⚠️ NO CELULAR ELA ROLA NA HORIZONTAL, E ISSO NÃO É PREGUIÇA DE
          LAYOUT. A captura é uma tela de 1600px de largura: encolhida para
          os ~330px que sobram num telefone, nada dentro dela é legível —
          vira uma mancha colorida com formato de site, que prova MENOS que
          a maquete desenhada que ela veio substituir.

          Com a largura mínima preservada, a pessoa arrasta e lê os cards de
          verdade. `nv-rolagem-x` esconde a barra e é a mesma classe que o
          Comparativo usa; o `tabIndex` vai junto porque região que rola
          precisa ser alcançável pelo teclado, senão quem não usa mouse não
          chega no que ficou fora da tela. */}
      <div
        className="nv-rolagem-x -mx-5 px-5 sm:mx-0 sm:overflow-visible sm:px-0"
        tabIndex={0}
        role="group"
        aria-label="A home do Novare Workspace (role para os lados para ver a tela inteira)"
      >
        <div className="nv-janela w-[44rem] max-w-none sm:w-full">
        <div className="nv-janela-barra">
          <span className="nv-janela-ponto" />
          <span className="nv-janela-ponto" />
          <span className="nv-janela-ponto" />
        </div>
        <Image
          src="/produtos/workspace.webp"
          alt="A home do Novare Workspace: o card FINCASH com o preço da assinatura, ao lado dos portais de Consultoria, Vida Financeira e Investimentos, mais a Íris, o Novare News e os eBooks."
          width={1600}
          height={800}
          sizes="(max-width: 1024px) 100vw, 1100px"
          className="block h-auto w-full"
        />
        </div>
      </div>
      {legenda && (
        <Legenda>
          <span className="sm:hidden">
            A home do Workspace · arraste para ver a tela inteira
          </span>
          <span className="hidden sm:inline">
            A home do Workspace, como ela abre hoje.
          </span>
        </Legenda>
      )}
    </div>
  );
}

/**
 * O FINCASH no celular, dentro de uma moldura de aparelho.
 *
 * ⚠️ É A CAPTURA DE CELULAR, E NÃO A DE DESKTOP, DE PROPÓSITO. O painel do
 * módulo é uma coluna estreita (`max-w-[25rem]`): a captura de desktop, que é
 * 1,6:1, entraria com menos de 400px de largura e o texto dela ficaria
 * ilegível — viraria uma mancha colorida com cara de tela. A de celular é
 * vertical, então cabe na coluna com o "R$ 1.066" ainda grande, que é o
 * número que a seção inteira está tentando explicar.
 */
export function TelaFinCashCelular({ legenda = true }: { legenda?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className="relative w-full max-w-[17rem] overflow-hidden rounded-[2rem] border-[6px] border-[#0b1626] bg-[#0b1626]"
        style={{
          boxShadow:
            "0 2px 4px rgba(10,21,33,0.06), 0 34px 70px -30px rgba(10,21,33,0.55)",
        }}
      >
        <Image
          src="/fincash/telas/painel-celular.webp"
          alt="O painel do FINCASH no celular: 'Se nada mudar, você fecha o mês com R$ 1.066', com R$ 1.926 a pagar, R$ 600 a receber, duas contas atrasadas e um velocímetro marcando 86% da renda já comprometida."
          width={780}
          height={1688}
          sizes="272px"
          className="block h-auto w-full rounded-[1.6rem]"
        />
      </div>
      {legenda && (
        <Legenda>
          Tela real do {FIN_CASH} · conta de demonstração
        </Legenda>
      )}
    </div>
  );
}
