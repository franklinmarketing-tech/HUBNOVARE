"use client";

import Link from "next/link";
import { ArrowRight, Check, Lock } from "lucide-react";
import { useAssinatura } from "@/lib/planejamento/useAssinatura";
import { BotaoAssinarPlano } from "@/components/BotaoAssinarPlano";
import { ASSINATURA_PRECO_ROTULO, ASSINATURA_TRIAL_DIAS } from "@/lib/assinatura";

/**
 * A porta das ferramentas exclusivas de assinante.
 *
 * Irmã da `AcaoAssinante`, com uma diferença que importa: lá o dado da pessoa
 * já está na tela e só a AÇÃO é presa (ler nunca bloqueia, porque prender o
 * número do cliente é o jeito mais rápido de perdê-lo). Aqui a ferramenta
 * inteira é o produto pago — a pessoa ainda não tem nada dentro dela, então
 * não há dado a preservar.
 *
 * Por que precisou existir: `podeAbrir` em `lib/apps.ts` decide o que aparece
 * no CATÁLOGO e na busca. Uma página que sumiu do menu continua respondendo
 * 200 para quem tem a URL — e link de ferramenta circula por WhatsApp. Sem
 * esta porta, marcar `plano: "pago"` escondia a ferramenta de quem paga e
 * deixava aberta para quem não paga.
 *
 * ⚠️ Trava de PRODUTO, não de segurança, pelo mesmo motivo da `AcaoAssinante`:
 * o dado continua protegido pela RLS do banco. O objetivo é o fluxo honesto
 * cobrar o preço.
 */
export function FerramentaAssinante({
  nome,
  /** O que ela resolve, em uma linha. Aparece na tela de bloqueio. */
  resumo,
  /** Até 4 pontos concretos do que a ferramenta faz. */
  entrega,
  children,
}: {
  nome: string;
  resumo: string;
  entrega: string[];
  children: React.ReactNode;
}) {
  const estado = useAssinatura();

  // Enquanto carrega, libera: bloquear no escuro puniria a conexão lenta e
  // faria quem paga ver a própria ferramenta piscar em "assine". Mesma regra
  // da AcaoAssinante.
  if (estado.fase === "carregando") return <>{children}</>;

  // Logado e liberado (assinante ou em teste): a ferramenta inteira.
  //
  // O `logado` é o que impede a porta de escancarar: `liberado` sozinho é
  // `true` para visitante anônimo, porque `garantirTeste` devolve `null`
  // sem sessão e a regra da casa é tratar "não sei" como liberado. Correto
  // para as ações do Planejamento — quem está lá dentro já entrou —, errado
  // aqui, onde a página inteira é o produto pago.
  if (estado.logado && estado.liberado) return <>{children}</>;

  return (
    <main className="mx-auto max-w-2xl px-4 pb-16 pt-12">
      <div className="overflow-hidden rounded-3xl border border-accent/25 bg-white shadow-[0_1px_2px_hsl(215_40%_20%_/_0.04),0_16px_40px_-24px_hsl(215_40%_20%_/_0.3)]">
        <div className="bg-gradient-to-br from-primary to-[hsl(216_58%_13%)] px-7 py-8 text-white">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-2xs font-bold uppercase tracking-wider">
            <Lock className="h-3 w-3" />
            Exclusiva de assinante
          </span>
          <h1 className="mt-4 font-display text-2xl font-black leading-tight sm:text-3xl">
            {nome}
          </h1>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-white/80">
            {resumo}
          </p>
        </div>

        <div className="px-7 py-6">
          <ul className="space-y-2.5">
            {entrega.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-slate-700">
                <Check
                  className="mt-0.5 h-4 w-4 shrink-0 text-accent-strong"
                  strokeWidth={2.5}
                />
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <BotaoAssinarPlano
              contexto="workspace"
              objetivo="comecar"
              rotulo={`Testar ${ASSINATURA_TRIAL_DIAS} dias grátis`}
            />
            <p className="text-xs text-muted-foreground">
              Depois {ASSINATURA_PRECO_ROTULO}/mês. Sem cartão para começar.
            </p>
          </div>

          {/* A saída para as gratuitas. Quem não vai assinar agora não pode
              sair de mãos vazias — são 18 calculadoras abertas do lado. */}
          <Link
            href="/aplicativos"
            className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-accent-strong underline-offset-2 hover:underline"
          >
            Ver as ferramentas gratuitas
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </main>
  );
}
