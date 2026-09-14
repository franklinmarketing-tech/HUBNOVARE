import Image from "next/image";
import Link from "next/link";
import { Wallet, Target } from "lucide-react";
import { SetaRodape, doCatalogo } from "@/components/CardProdutoHome";
import {
  ASSINATURA_PRECO_ANUAL_MENSAL_ROTULO,
  ASSINATURA_PRECO_ROTULO,
} from "@/lib/assinatura";
import type { EstadoAssinatura } from "@/lib/assinatura-servidor";

/**
 * O CARD ÚNICO DE FINCASH + FINPLAN NA HOME — 14/09/2026.
 *
 * ═══ POR QUE UM CARD SÓ, DE NOVO ══════════════════════════════════════════
 *
 * Eram dois cards lado a lado (`CardFincashHome` + `CardFinplanHome`,
 * 12 e 13/09). O dono olhou a fileira de cinco e pediu para virar quatro:
 * "FINCASH e FINPLAN vira um só". Faz sentido além do visual — é uma
 * assinatura, um preço, dois produtos que se completam (o FINCASH mede o
 * mês, o FINPLAN planeja o ano), e hoje isso já é dito em texto no rodapé do
 * card do FINCASH ("Com o FINPLAN e a Íris inclusos"). Juntar as duas caixas
 * só torna visível o que a copy já afirmava.
 *
 * ⚠️ MAS NÃO É `CardFincashHome` DE VOLTA. Aquele card tinha UM destino
 * (`/fincash`) e mencionava o FINPLAN só de passagem, numa linha pequena —
 * foi exatamente esse desenho que, em 12/09, deixou a home com ZERO links
 * para o FINPLAN (ver o cabeçalho apagado de `CardFinplanHome`). Repetir o
 * mesmo desenho por causa de "poluição visual" trocaria um problema por
 * outro igual.
 *
 * A SAÍDA: um card, DOIS links. A capa laranja inteira leva ao FINCASH (é
 * o âncora, é onde o preço mora, é o clique óbvio). O rodapé branco tem duas
 * linhas: a de cima é a oferta do FINCASH — igual ao card antigo, preço ou
 * "abrir", conforme a assinatura —; a de baixo é uma segunda porta, menor e
 * mais quieta, só para o FINPLAN. Duas âncoras irmãs, nunca uma dentro da
 * outra (HTML aninhado quebra o clique e falha validação).
 *
 * ⚠️ SÓ A LINHA DO FINCASH FALA EM PREÇO — mesma regra dos dois cards
 * anteriores, e pelo mesmo motivo: a casa tem UMA assinatura, e
 * `scripts/testar-nada-a-venda.mjs` reprova um segundo valor na página. A
 * linha do FINPLAN diz "Incluso" ou "Abrir", nunca um número.
 *
 * `CardProdutoHome` (a casca dos dois cards antigos) NÃO foi reaproveitada
 * aqui: ela embrulha tudo num único `<Link>`, e este card precisa de dois.
 * Ficou órfã — nenhum outro card de produto existe hoje —, mas não foi
 * apagada: se um terceiro produto ganhar card próprio de destino único, a
 * casca serve de novo sem reescrever nada.
 */

const FINCASH = doCatalogo("fincash");
const FINPLAN = doCatalogo("planejamento");

export function CardFincashFinplanHome({
  assinatura = { fase: "sem" },
}: {
  assinatura?: EstadoAssinatura;
}) {
  const hrefFincash = assinatura.fase === "sem" ? "/fincash" : "/fincash/app";
  const hrefFinplan = assinatura.fase === "sem" ? "/finplan" : "/finplan/app";
  const jaTemFinplan = assinatura.fase !== "sem";

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-primary/5 transition-all hover:-translate-y-0.5 hover:shadow-card-hover">
      {/* A CAPA — um único Link, para o FINCASH. Mesmo desenho visual da
          `CardProdutoHome` (gradiente, painel 3D, selo PRO): reescrito aqui
          em vez de importado porque o título precisa somar as DUAS marcas,
          e a casca original só recebe um `app.nome`. */}
      <Link
        href={hrefFincash}
        className="relative flex min-h-[10.5rem] flex-1 flex-col items-center justify-center gap-2 px-4 text-center text-white transition-[filter] duration-300 hover:brightness-[1.12] [@media(min-height:860px)]:min-h-[13rem]"
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(160deg, hsl(18 76% 44%) 0%, hsl(15 74% 32%) 60%, hsl(13 70% 24%) 100%)",
            boxShadow: "inset 0 1px 0 hsl(35 90% 80% / 0.28)",
          }}
        />
        <Image
          aria-hidden
          alt=""
          src="/cenas/cena-painel-3d.webp"
          fill
          sizes="(max-width: 640px) 100vw, 25vw"
          className="pointer-events-none object-cover opacity-25 mix-blend-soft-light transition-transform duration-500 group-hover:scale-105"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(16rem 9rem at 50% -20%, hsl(38 95% 62% / 0.32), transparent 65%)",
          }}
        />
        <span className="absolute right-3 top-3 rounded-md bg-white px-1.5 py-0.5 text-2xs font-semibold uppercase tracking-wider text-accent-strong">
          PRO
        </span>

        {/* Dois ícones, um par — é a única peça do desenho que precisava
            dizer "dois produtos" sem precisar de duas frases. O FINCASH vem
            à frente (maior, opaco) por ser o âncora; o FINPLAN, atrás e
            menor, é o que se leva junto. */}
        <span className="relative flex h-10 items-center">
          <span className="relative z-10 flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.14] ring-1 ring-white/[0.18]">
            <Wallet className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <span className="-ml-3 flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.1] ring-1 ring-white/[0.14]">
            <Target className="h-4 w-4" strokeWidth={1.75} />
          </span>
        </span>

        <span className="relative font-display text-lg font-extrabold uppercase tracking-tight">
          {FINCASH.nome}
          <span className="mx-1 font-normal normal-case text-white/50">+</span>
          {FINPLAN.nome}
        </span>
        <span className="relative text-xs leading-snug text-white/80">
          {FINCASH.chamada}
        </span>
        <span className="relative text-2xs leading-snug text-white/65">
          E o plano do ano, incluso
        </span>
      </Link>

      {/* O RODAPÉ — duas linhas, dois destinos.

          ⚠️ `border-t` SÓ NA PRIMEIRA: ela separa a capa do rodapé, como nos
          cards antigos. A segunda linha não leva borda própria — um filete
          entre "abrir o FINCASH" e "abrir o FINPLAN" leria como dois cards
          empilhados, e a intenção aqui é o oposto: um card, duas portas do
          mesmo lugar. */}
      <Link
        href={hrefFincash}
        className="flex items-center justify-between gap-2 border-t border-primary/5 px-4 py-2.5 transition-colors hover:bg-accent-tint/40"
      >
        {assinatura.fase === "ativa" ? (
          <span className="text-sm font-bold text-accent-strong">
            Abrir meu FINCASH
          </span>
        ) : assinatura.fase === "teste" ? (
          <>
            <span className="text-sm font-bold text-accent-strong">
              Abrir meu FINCASH
            </span>
            <span className="flex items-center gap-1.5 text-2xs font-semibold text-muted-foreground">
              {assinatura.dias === 1
                ? "último dia de teste"
                : `faltam ${assinatura.dias} dias`}
            </span>
          </>
        ) : (
          <>
            <span className="text-sm font-bold text-accent-strong">
              {ASSINATURA_PRECO_ANUAL_MENSAL_ROTULO}/mês
            </span>
            <span className="text-2xs font-semibold text-muted-foreground">
              no anual, ou {ASSINATURA_PRECO_ROTULO}/mês
            </span>
          </>
        )}
        <span className="ml-auto">
          <SetaRodape />
        </span>
      </Link>

      <Link
        href={hrefFinplan}
        className="group/l2 flex items-center justify-between gap-2 px-4 py-2 transition-colors hover:bg-muted/60"
      >
        <span className="text-2xs font-semibold text-muted-foreground">
          {/* Sem preço, de propósito — mesma regra que já valia no card
              separado: um segundo valor na mesma dobra lê como um segundo
              plano, e a casa tem um preço só. */}
          {jaTemFinplan ? "Abrir meu FINPLAN" : "FINPLAN incluso na assinatura"}
        </span>
        <ArrowRightMini />
      </Link>
    </div>
  );
}

function ArrowRightMini() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className="h-3 w-3 shrink-0 fill-none stroke-muted-foreground transition-transform group-hover/l2:translate-x-0.5"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
}
