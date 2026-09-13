import { Check } from "lucide-react";
import { CONTAGEM } from "@/lib/apps";

/**
 * O QUADRO DA OFERTA — o que a pessoa leva, por produto.
 *
 * ── O QUE ESTAVA ERRADO NO ANTERIOR ───────────────────────────────────────
 * A oferta era UMA LISTA CORRIDA de onze linhas com o mesmo peso visual, e as
 * seis últimas moravam atrás de um "e mais 6 itens" fechado. Quem chega no
 * preço com o cartão na mão precisa entender em três segundos que a
 * mensalidade abre QUATRO produtos mais gente de verdade; numa lista plana ele
 * lê seis frases parecidas e conclui que comprou um aplicativo.
 *
 * Aqui cada produto é um bloco com emblema, nome e o que ele entrega. Mesmos
 * fatos, mesma fonte, hierarquia de oferta.
 *
 * ⚠️ AS FRASES SÃO AS DE `ASSINATURA_INCLUI`, redistribuídas por produto e
 * encurtadas onde a frase carregava a explicação que o agrupamento agora dá
 * sozinho. Nada foi acrescentado: nenhum benefício novo, nenhum número novo.
 * Quem for mexer confere item a item contra `lib/assinatura.ts`.
 *
 * ⚠️ O CONTADOR DE FERRAMENTAS VEM DE `CONTAGEM`, nunca à mão. Cravar "8"
 * aqui é o erro que a auditoria dos contadores já pegou uma vez: no dia em que
 * uma ferramenta exclusiva entrar no catálogo, a oferta passa a mentir para
 * menos, e quem confere é quem está pagando.
 *
 * ⚠️ FINPLAN É O NOME NOVO DO PLANEJAMENTO FINANCEIRO, e em 13/09/2026 ele
 * vale AQUI e só aqui. O resto do Hub — a rota `/planejamento`, o catálogo em
 * `lib/apps.ts`, a home, a `/assinar` e os textos da própria casa — continua
 * dizendo "Planejamento Financeiro". Por isso o nome antigo vem como subtítulo
 * do bloco: quem já conhece o produto precisa reconhecê-lo, e quem chega agora
 * aprende o nome novo. Trocar o nome no site inteiro mexe em rota, SEO e
 * catálogo, e isso é trabalho com pedido próprio.
 */

type Bloco = {
  emblema: "carteira" | "projecao" | "chat" | "escudo" | "cartao";
  nome: string;
  subtitulo: string;
  promessa: string;
  itens: string[];
  destaque?: boolean;
};

export default function QuadroOferta({
  Emblema,
}: {
  /** O `Icone3D` da página, injetado para não duplicar o mapa de tons. */
  Emblema: (p: { nome: Bloco["emblema"]; tamanho?: number }) => React.ReactNode;
}) {
  const BLOCOS: Bloco[] = [
    {
      emblema: "escudo",
      nome: "Um consultor de verdade",
      subtitulo: "Não é software",
      promessa: "Gente olhando o seu plano, de três em três meses.",
      itens: [
        "Revisão trimestral escrita por um consultor",
        "Condição especial na consultoria particular",
      ],
      destaque: true,
    },
    {
      emblema: "carteira",
      nome: "FINCASH",
      subtitulo: "O mês sob controle",
      promessa: "Quanto ainda dá para gastar até o dia 30.",
      itens: [
        "Contas, cartões, dívidas e metas",
        "Orçamento tirado do seu histórico",
      ],
    },
    {
      emblema: "projecao",
      nome: "FINPLAN",
      subtitulo: "Antes Planejamento Financeiro",
      promessa: "Onde você precisa chegar, e quando.",
      itens: ["Marco Horizonte com prazo", "Plano de ação e fechamento mensal"],
    },
    {
      emblema: "chat",
      nome: "Íris",
      subtitulo: "IA financeira",
      promessa: "Leia quantos extratos quiser, todo mês.",
      itens: ["Sem teto de leituras", "Sem comissão de ninguém"],
    },
    {
      emblema: "cartao",
      nome: "As ferramentas",
      subtitulo: "Da casa inteira",
      promessa: `${CONTAGEM.exclusivasAssinante} só abrem assinando.`,
      itens: ["Calculadoras com as tabelas de 2026"],
    },
  ];


  return (
    <div className="grid gap-4 lg:grid-cols-6">
      {BLOCOS.map((b, i) => (
        <div
          key={b.nome}
          className={`fin-carta fin-oferta relative flex flex-col overflow-hidden rounded-3xl p-6 ${
            b.destaque
              ? "fin-oferta-destaque bg-primary text-white lg:col-span-2 lg:row-span-2"
              : "bg-card ring-1 ring-primary/10"
          } ${
            /* Os dois primeiros produtos ficam lado a lado do destaque; os dois
               últimos dividem a linha de baixo. É o que dá ritmo à grade sem
               deixar célula vazia: 5 blocos, 6 colunas, nenhuma sobra. */
            i === 0 ? "" : i <= 2 ? "lg:col-span-2" : "lg:col-span-2"
          }`}
        >
          <Emblema nome={b.emblema} tamanho={b.destaque ? 56 : 44} />

          <p
            className={`mt-4 text-2xs font-semibold uppercase tracking-[0.14em] ${
              b.destaque ? "text-white/60" : "text-accent-strong"
            }`}
          >
            {b.subtitulo}
          </p>
          <h3
            className={`mt-1 font-display text-xl font-extrabold tracking-tight ${
              b.destaque ? "text-white" : "text-primary"
            }`}
          >
            {b.nome}
          </h3>
          <p
            className={`mt-2 text-sm font-medium leading-snug ${
              b.destaque ? "text-white/85" : "text-primary/80"
            }`}
          >
            {b.promessa}
          </p>

          <ul className="mt-4 grid gap-2">
            {b.itens.map((t) => (
              <li
                key={t}
                className={`flex items-start gap-2 text-xs leading-snug ${
                  b.destaque ? "text-white/75" : "text-muted-foreground"
                }`}
              >
                <Check
                  className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${
                    b.destaque ? "text-accent-claro" : "text-accent-strong"
                  }`}
                />
                {t}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
