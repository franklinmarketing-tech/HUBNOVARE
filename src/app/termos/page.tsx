import Link from "next/link";
import type { Metadata } from "next";
import { FileText, ShieldCheck } from "lucide-react";
import { Cabecalho } from "@/components/Cabecalho";
import { CONTATO } from "@/lib/contato";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description:
    "As regras de uso do Novare Workspace: o que as ferramentas fazem, o que elas não são, e as responsabilidades de cada lado.",
  alternates: { canonical: "/termos" },
};

const ATUALIZADO = "agosto de 2026";

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <h2 className="font-display text-base font-bold text-primary">{titulo}</h2>
      <div className="mt-2.5 space-y-2.5 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

export default function TermosPage() {
  return (
    <div className="min-h-dvh bg-gradient-to-b from-slate-50 to-white">
      <Cabecalho
        direita={
          <Link
            href="/"
            className="text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Voltar ao início
          </Link>
        }
      />

      <main className="mx-auto max-w-3xl px-4 pb-16 pt-10 sm:px-6">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
          <FileText className="h-3.5 w-3.5" />
          Termos de Uso
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-primary">
          As regras deste espaço
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          Em linguagem direta: o que o Novare Workspace faz, o que ele não é, e o que
          esperamos de cada lado. Atualizado em {ATUALIZADO}.
        </p>

        <div className="mt-8 space-y-4">
          <Secao titulo="1. Quem oferece este serviço">
            <p>
              O Novare Workspace é mantido pela <strong>Novare Consultoria de Investimentos</strong>.
              Dúvidas sobre estes termos: <a className="text-primary hover:underline" href={`mailto:${CONTATO.email}`}>{CONTATO.email}</a>.
            </p>
          </Secao>

          <Secao titulo="2. O que as ferramentas são">
            <p>
              As calculadoras e simuladores são de uso livre e gratuito, e servem para
              <strong> organizar e projetar cenários</strong>. Os resultados são estimativas
              construídas a partir dos dados que você digita e de premissas declaradas em cada tela.
            </p>
          </Secao>

          <Secao titulo="3. O que elas NÃO são">
            <p>
              Nenhum resultado apresentado aqui constitui <strong>recomendação personalizada de
              investimento</strong>, oferta, promessa de rentabilidade ou consultoria jurídica,
              contábil ou tributária. Rentabilidade passada não garante resultados futuros, e
              projeções não são garantia de nada.
            </p>
            <p>
              Recomendação personalizada só existe dentro de um contrato de consultoria, com análise
              do seu caso concreto por um profissional credenciado.
            </p>
          </Secao>

          <Secao titulo="4. Precisão e responsabilidade">
            <p>
              Trabalhamos para manter tabelas e índices corretos e atualizados, mas o resultado
              depende do que você informa. Confira os números antes de tomar qualquer decisão
              financeira. As decisões, e as consequências delas, são suas.
            </p>
            <p>
              O serviço é oferecido &quot;como está&quot;. Não garantimos disponibilidade
              ininterrupta nem ausência de falhas.
            </p>
          </Secao>

          <Secao titulo="5. Conta de acesso">
            <p>
              Algumas áreas exigem cadastro. Você é responsável por manter a senha em sigilo e pelo
              que acontece na sua conta. Podemos suspender contas em caso de uso abusivo, tentativa
              de burlar limites técnicos ou uso que prejudique outras pessoas.
            </p>
          </Secao>

          <Secao titulo="6. Seus dados">
            <p>
              O tratamento de dados pessoais está descrito na{" "}
              <Link href="/privacidade" className="font-medium text-primary hover:underline">
                Política de Privacidade
              </Link>
              , que é parte destes termos — inclusive quanto ao uso de inteligência artificial e à
              transferência internacional de dados.
            </p>
          </Secao>

          <Secao titulo="7. Conteúdo e marca">
            <p>
              Textos, cálculos, marca e identidade visual da Novare são protegidos. Você pode usar as
              ferramentas e compartilhar links à vontade; copiar o conteúdo para republicar como seu,
              não.
            </p>
          </Secao>

          <Secao titulo="8. Mudanças nestes termos">
            <p>
              Podemos ajustar estes termos conforme o serviço evolui. Mudanças relevantes são
              sinalizadas nesta página, com a data de atualização no topo.
            </p>
          </Secao>
        </div>

        <p className="mt-8 flex items-start gap-2 rounded-2xl border border-border bg-muted/40 p-4 text-xs leading-relaxed text-muted-foreground">
          <ShieldCheck className="mt-px h-4 w-4 shrink-0 text-primary" />
          <span>
            Conteúdo educacional. Não constitui recomendação nem oferta de investimento.
            Rentabilidade passada não garante resultados futuros.
          </span>
        </p>
      </main>
    </div>
  );
}
