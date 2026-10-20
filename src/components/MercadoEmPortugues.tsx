import { Banknote, DollarSign, Landmark, ShoppingCart, type LucideIcon } from "lucide-react";

import { getIndicadores, type Indicador } from "@/lib/mercado";

/**
 * OS NÚMEROS DO BANCO CENTRAL, EM PORTUGUÊS.
 *
 * Substitui, na home, a fita rolante que abria a página (`BarraMercado`, que
 * continua existindo para outras telas). Pedido do dono em 19/10/2026: a
 * home era fria, e a primeira coisa que se via eram siglas soltas — "SELIC
 * 13,75% a.a.", "IPCA 4,58%" — sem dizer o que aquilo muda para a pessoa.
 *
 * Aqui cada número vem numa frase. Só fato, nunca conselho: dizer o que a
 * inflação fez com R$ 100 é educação; dizer "tire da poupança" seria
 * recomendação, e isso a casa não faz numa página aberta.
 *
 * Os valores são os mesmos da fita (mesma `getIndicadores`, com o mesmo
 * cache por requisição e o mesmo valor de reserva quando o Banco Central não
 * responde).
 */
const pct = (v: number) =>
  `${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export async function MercadoEmPortugues() {
  const ind = await getIndicadores();
  const de = (chave: string) => ind.find((i) => i.chave === chave) as Indicador | undefined;
  const selic = de("selic");
  const ipca = de("ipca12");
  const poupanca = de("poupanca");
  const dolar = de("dolar");

  const frases: { icone: LucideIcon; titulo: string; texto: string }[] = [];
  if (ipca)
    frases.push({
      icone: ShoppingCart,
      titulo: `Inflação de ${pct(ipca.valor)} em 12 meses`,
      texto: `O que custava R$ 100 há um ano hoje custa ${brl(100 * (1 + ipca.valor / 100))}.`,
    });
  if (selic)
    frases.push({
      icone: Landmark,
      titulo: `Selic em ${pct(selic.valor)} ao ano`,
      texto: "É a taxa básica de juros. Ela puxa o rendimento da renda fixa e o custo dos empréstimos.",
    });
  if (poupanca)
    frases.push({
      icone: Banknote,
      titulo: `Poupança rendeu ${pct(poupanca.valor)} no mês`,
      texto: "É quanto cada R$ 100 parados na poupança ganharam no último mês.",
    });
  if (dolar)
    frases.push({
      icone: DollarSign,
      titulo: `Dólar a ${brl(dolar.valor)}`,
      texto: "Cotação oficial de compra. Mexe no preço de viagens, eletrônicos e importados.",
    });

  if (!frases.length) return null;

  return (
    <section aria-labelledby="mercado-titulo" className="cine" style={{ transitionDelay: "120ms" }}>
      <p className="chapeu chapeu-ciano">Dados do Banco Central</p>
      <h2 id="mercado-titulo" className="titulo-cp mt-2 text-2xl sm:text-[2rem]">
        O mercado hoje, <span className="text-ciano-forte">em português.</span>
      </h2>
      <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {frases.map(({ icone: Icone, titulo, texto }) => (
          <li key={titulo} className="cartao-cp p-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-ciano-tint">
              <Icone className="h-5 w-5 text-ciano-forte" strokeWidth={1.7} />
            </span>
            <p className="mt-3 text-sm font-semibold text-primary">{titulo}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{texto}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
