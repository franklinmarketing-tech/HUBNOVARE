import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Wallet } from "lucide-react";
import { APPS, type NovareApp } from "@/lib/apps";
import {
  ASSINATURA_PRECO_ANUAL_MENSAL_ROTULO,
  ASSINATURA_PRECO_ROTULO,
} from "@/lib/assinatura";
import type { EstadoAssinatura } from "@/lib/assinatura-servidor";

/**
 * O PRIMEIRO CARD DA HOME — o produto-âncora da casa.
 *
 * ═══ POR QUE O FINCASH, E NÃO O PLANEJAMENTO (12/09/2026) ══════════════════
 *
 * Decisão do dono, registrada por extenso em `lib/assinatura.ts`: o que se
 * assina passou a ser o FINCASH. Até esta data quem abria a home encontrava
 * o Planejamento Financeiro neste lugar — e o Planejamento cobra uma trilha
 * de oito blocos antes de devolver qualquer coisa. Porta de entrada que exige
 * esforço antes de entregar valor é porta estreita; o FINCASH responde "posso
 * gastar?" no primeiro dia de uso.
 *
 * ⚠️ ESTE CARD NÃO SAI DA ORDEM DO `lib/apps.ts`. A home monta o âncora à
 * parte e os cards de área em seguida — reordenar o catálogo não muda nada
 * aqui, e mexer aqui não muda o catálogo. Quem receber "põe o FINCASH na
 * frente" tem de olhar os dois lugares (o array e `src/app/page.tsx`).
 *
 * ⚠️ E POR QUE O PLANEJAMENTO NÃO GANHOU UM SEGUNDO CARD AO LADO: dois cards
 * com preço na mesma dobra leem como dois planos, e a regra da casa é que
 * existe UMA assinatura e UM preço (é o que `scripts/testar-nada-a-venda.mjs`
 * guarda). O Planejamento continua inteiro — landing própria, prateleira
 * "Incluso na assinatura" no catálogo, menu de áreas e busca —, e aparece
 * aqui onde passou a ser verdade: na linha do que vem junto.
 */

/**
 * Nome e chamada saem do CATÁLOGO, como na landing (`fincash/Pacote.tsx`).
 *
 * O `throw` é de propósito e é o mesmo remédio de lá: se o slug sumir, o
 * build para com o culpado escrito, em vez de a home publicar um card sem
 * nome. Duas frases para o mesmo produto em dois arquivos é como a home e a
 * landing começam a discordar.
 */
function doCatalogo(slug: string): NovareApp {
  const achado = APPS.find((a) => a.slug === slug);
  if (!achado) {
    throw new Error(
      `CardFincashHome: não existe app com slug "${slug}" em lib/apps.ts. ` +
        "O primeiro card da home é montado a partir dele — corrija o slug " +
        "aqui ou devolva a entrada ao catálogo.",
    );
  }
  return achado;
}

const FINCASH = doCatalogo("fincash");

export function CardFincashHome({
  /**
   * Em que ponto da assinatura a pessoa está.
   *
   * Decide as duas coisas do rodapé: o texto e o destino. Quem já paga não
   * pode ver preço — ler a oferta do que se acabou de comprar faz duvidar se
   * a compra entrou —, e quem já paga também não quer passar pela landing
   * para chegar ao app.
   *
   * O padrão é "sem" porque é o caso do visitante deslogado, que é quem vê
   * esta home sem nenhum dado de conta.
   */
  assinatura = { fase: "sem" },
}: {
  assinatura?: EstadoAssinatura;
}) {
  /* Quem tem acesso entra no APP; quem não tem vê a VENDA.
     Não é atalho de conveniência: `/fincash/app` exige sessão e redireciona
     para o login, então mandar um visitante para lá seria trocar a oferta por
     um formulário — e ninguém cria conta para um produto que ainda não
     entendeu. O teste corrente conta como acesso: são dias que a casa já
     prometeu. */
  const href = assinatura.fase === "sem" ? "/fincash" : "/fincash/app";

  return (
    <Link
      href={href}
      className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-primary/5 transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
    >
      <span
        // A MESMA altura do CardPortal, incluindo o degrau em tela alta: este
        // card fica lado a lado com os outros três e é um componente separado
        // — mexer só lá deixa o âncora mais baixo que os vizinhos.
        className="relative flex min-h-[10.5rem] flex-1 flex-col items-center justify-center gap-2 px-4 text-center text-white transition-[filter] duration-300 group-hover:brightness-[1.12] [@media(min-height:860px)]:min-h-[13rem]"
        style={{
          background:
            "linear-gradient(160deg, hsl(18 76% 44%) 0%, hsl(15 74% 32%) 60%, hsl(13 70% 24%) 100%)",
          boxShadow: "inset 0 1px 0 hsl(35 90% 80% / 0.28)",
        }}
      >
        {/* O render dos painéis de vidro por trás do laranja. Entra em
            `soft-light` e com opacidade baixa: vira textura e brilho, não
            uma segunda imagem competindo com o título do card. */}
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
        {/* A carteira — o mesmo ícone que marca o FINCASH dentro do próprio
            app (ver o lockup em `fincash/app/layout.tsx`). Lá ele é navy sobre
            branco porque laranja ali significa AÇÃO; aqui o card inteiro é o
            laranja da marca, que é o que diz "isto é o que se compra". */}
        <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.14] ring-1 ring-white/[0.18]">
          <Wallet className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <span className="relative font-display text-lg font-extrabold uppercase tracking-tight">
          {FINCASH.nome}
        </span>
        <span className="relative text-xs leading-snug text-white/80">
          {FINCASH.chamada}
        </span>
        {/* O QUE VEM JUNTO, na própria capa.
            Sem esta linha o card vende um app de gastos por R$ 29,90, que é
            mais caro que o concorrente mais direto pelo mesmo tipo de
            produto. O argumento da casa não é o app: é que a mesma cobrança
            abre também o plano e a IA. Só nomes que existem e estão no ar —
            o assistente de WhatsApp fica de fora enquanto não estiver ligado. */}
        <span className="relative text-2xs leading-snug text-white/65">
          Com o Planejamento e a Íris inclusos
        </span>
      </span>

      {/* `gap-2` e não só `justify-between`: com a fonte mais estreita da
          marca o preço e a letra miúda passaram a caber na mesma linha, e
          `justify-between` sozinho não reserva folga quando o conteúdo enche
          a largura — os dois encostavam e viravam uma palavra só. */}
      <span className="flex items-center justify-between gap-2 border-t border-primary/5 px-4 py-3">
        {assinatura.fase === "ativa" ? (
          /* Nenhum preço, nenhuma oferta: só a porta de entrada. */
          <>
            <span className="text-sm font-bold text-accent-strong">
              Abrir meu FINCASH
            </span>
            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-accent-strong transition-transform group-hover:translate-x-0.5" />
          </>
        ) : assinatura.fase === "teste" ? (
          <>
            <span className="text-sm font-bold text-accent-strong">
              Abrir meu FINCASH
            </span>
            <span className="flex items-center gap-1.5 text-2xs font-semibold text-muted-foreground">
              {assinatura.dias === 1
                ? "último dia de teste"
                : `faltam ${assinatura.dias} dias`}
              <ArrowRight className="h-3.5 w-3.5 text-accent-strong transition-transform group-hover:translate-x-0.5" />
            </span>
          </>
        ) : (
          <>
            <span className="text-sm font-bold text-accent-strong">
              {ASSINATURA_PRECO_ANUAL_MENSAL_ROTULO}/mês
            </span>
            <span className="flex items-center gap-1.5 text-2xs font-semibold text-muted-foreground">
              no anual, ou {ASSINATURA_PRECO_ROTULO}/mês
              <ArrowRight className="h-3.5 w-3.5 text-accent-strong transition-transform group-hover:translate-x-0.5" />
            </span>
          </>
        )}
      </span>
    </Link>
  );
}
