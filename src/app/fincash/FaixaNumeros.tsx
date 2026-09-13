import { CONTAGEM } from "@/lib/apps";
import { ASSINATURA_GARANTIA_DIAS } from "@/lib/assinatura";

/**
 * A FAIXA DE NÚMEROS DA CASA.
 *
 * Veio de uma referência que o dono trouxe (uma peça de agência com
 * "500+ projetos · 98% de satisfação · 24/7 de suporte"), e é o elemento que
 * mais falta nesta landing: um bloco onde a casa se mede.
 *
 * ⚠️ E É EXATAMENTE AQUI QUE ESSE TIPO DE FAIXA COSTUMA MENTIR. Os números da
 * referência são os quatro clichês do setor, e três deles a Novare não tem
 * como provar: não há base de usuários do app para contar, não há pesquisa de
 * satisfação, não há suporte 24 horas. A própria página diz, na seção da casa,
 * que não cita número de usuários porque seria "fácil de escrever e impossível
 * de conferir". Uma faixa com número inventado destruiria essa frase três
 * telas acima dela.
 *
 * Os quatro que ficaram são conferíveis dentro do próprio repositório:
 *   • 0 comissão      — a casa é consultoria independente; está em `apps.ts`,
 *                       na `/consultoria` e na seção "não é só um app".
 *   • telas do FINCASH — contadas em `src/app/fincash/app/` (as subpastas com
 *                       `page.tsx` mais o painel da raiz).
 *   • ferramentas      — `CONTAGEM.calculadoras`, derivado do catálogo.
 *   • dias de garantia — `ASSINATURA_GARANTIA_DIAS`, a fonte do preço.
 *
 * ⚠️ NENHUM É DIGITADO AQUI, menos o zero e o quinze. O zero é um fato da
 * casa, não uma medida. O quinze é contado à mão e tem prazo de validade: se
 * uma tela nova entrar no FINCASH, ele está errado — e a FAQ desta mesma
 * página também diz "quinze telas", então os dois mudam juntos. Quem
 * acrescentar tela conta as subpastas de `src/app/fincash/app/` e corrige os
 * dois lugares.
 */

const NUMEROS: { valor: string; rotulo: string; apoio: string }[] = [
  {
    valor: "0",
    rotulo: "comissão de banco",
    apoio: "A única receita é a sua assinatura",
  },
  {
    valor: "15",
    rotulo: "telas no FINCASH",
    apoio: "Todas no ar, fotografadas nesta página",
  },
  {
    valor: String(CONTAGEM.calculadoras),
    rotulo: "ferramentas da casa",
    apoio: "Calculadoras com as tabelas de 2026",
  },
  {
    valor: String(ASSINATURA_GARANTIA_DIAS),
    rotulo: "dias de garantia",
    apoio: "Não gostou, devolvemos o valor",
  },
];

export default function FaixaNumeros() {
  return (
    <div className="fin-numeros relative isolate overflow-hidden rounded-3xl bg-primary px-6 py-9 sm:px-10 sm:py-11">
      <dl className="relative grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {NUMEROS.map((n) => (
          <div key={n.rotulo} className="text-center lg:text-left">
            <dt className="sr-only">{n.rotulo}</dt>
            <dd>
              <span className="block font-display text-[2.75rem] font-extrabold leading-none tracking-tight text-white sm:text-[3.25rem]">
                {n.valor}
              </span>
              <span className="mt-2 block font-display text-sm font-semibold text-accent-claro">
                {n.rotulo}
              </span>
              <span className="mt-1 block text-xs leading-snug text-white/60">
                {n.apoio}
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
