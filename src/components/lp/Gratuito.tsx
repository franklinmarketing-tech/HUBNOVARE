import Link from "next/link";
import { ArrowRight, Check, Lock } from "lucide-react";
import { CONTAGEM } from "@/lib/apps";

/**
 * O BLOCO QUE SUBSTITUIU O PREÇO.
 *
 * ═══ POR QUE ELE EXISTE (18/10/2026) ═════════════════════════════════════
 *
 * O Hub deixou de ser vendido. Onde havia dois planos, garantia de 7 dias e
 * checkout, agora há uma porta aberta: as ferramentas são iscas da Novare, e
 * o que a casa cobra é consultoria humana, que acontece fora daqui.
 *
 * ⚠️ NÃO É UM CARD DE PREÇO COM "R$ 0" NO LUGAR DO VALOR. Essa foi a
 * primeira ideia e está errada: um preço riscado, uma tabela de planos ou um
 * "grátis" em destaque de oferta fazem a pessoa procurar a pegadinha — e
 * quanto mais a página insiste que é de graça, mais ela parece que não é.
 * O jeito de dizer que algo é grátis é parar de falar de dinheiro e mostrar
 * a porta.
 *
 * ⚠️ O CADASTRO PRECISA SER EXPLICADO, não escondido. O FINCASH pede conta,
 * e quem já foi enganado por "grátis" espera que o cadastro seja a cobrança
 * disfarçada. Dizer POR QUE ele existe — é onde os seus lançamentos ficam
 * salvos — custa uma linha e remove a desconfiança.
 */

const SEM_NADA = [
  "Nenhuma ferramenta pede cartão",
  "Você não precisa criar conta para usar",
  "Não vendemos nem indicamos produto de banco",
];

export function Gratuito() {
  return (
    <section
      id="gratuito"
      className="mx-auto mt-20 max-w-4xl scroll-mt-24 px-4 sm:px-6"
    >
      <div className="rounded-3xl border border-[#e8e4dc] bg-white p-7 shadow-[0_2px_24px_rgba(20,30,50,0.05)] sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-strong">
          Sem pegadinha
        </p>

        <h2 className="mt-3 font-display text-2xl font-bold leading-tight text-primary sm:text-3xl">
          É tudo de graça. Pode usar à vontade.
        </h2>

        <p className="mt-4 max-w-2xl text-[0.9375rem] leading-relaxed text-slate-600">
          As {CONTAGEM.ferramentas} ferramentas da Novare abrem direto, sem
          cadastro e sem pagar nada. A gente ganha quando você conhece o nosso
          trabalho e, um dia, quiser uma conversa de verdade sobre o seu
          dinheiro.
        </p>

        <ul className="mt-6 grid gap-2.5 sm:grid-cols-3">
          {SEM_NADA.map((item) => (
            <li
              key={item}
              className="flex items-start gap-2 text-sm text-foreground"
            >
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              {item}
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/aplicativos"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent-btn px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-accent-strong"
          >
            Ver as ferramentas
            <ArrowRight className="h-4 w-4" />
          </Link>

          <Link
            href="/login?modo=criar&proximo=/fincash/app"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary/20 px-6 py-3.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
          >
            Criar minha conta grátis
          </Link>
        </div>

        {/* O cadastro explicado, não escondido — ver o comentário do topo. */}
        <p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            Só o FINCASH pede cadastro, porque é nele que você lança o seu
            dinheiro — e esses lançamentos precisam ficar salvos em algum
            lugar. O cadastro também é grátis, e não pedimos cartão.
          </span>
        </p>
      </div>
    </section>
  );
}
