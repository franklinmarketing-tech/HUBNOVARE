import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  MessageCircle,
  PlayCircle,
  ShieldCheck,
} from "lucide-react";
import { Cabecalho } from "@/components/Cabecalho";
import { RodapeNovare } from "@/components/RodapeNovare";
import {
  ASSINATURA_ANUAL_ECONOMIA_ROTULO,
  ASSINATURA_CHECKOUT_COMPLETO,
  ASSINATURA_GARANTIA_FRASE,
  ASSINATURA_NOME,
  ASSINATURA_PLANOS,
} from "@/lib/assinatura";
import { falarNoWhatsApp } from "@/lib/contato";
import { AvisarQuandoAbrir } from "./AvisarQuandoAbrir";

/**
 * A tela de quem clicou em ASSINAR antes de a oferta existir.
 *
 * POR QUE ELA EXISTE, e por que não é um botão escondido: sumir com o botão
 * faz a página de venda inteira terminar em nada — a pessoa rola até o fim,
 * não acha onde comprar e conclui que o produto não existe. Botão morto é
 * pior ainda: ela clica, nada acontece, e o defeito passa a ser da casa. A
 * terceira saída é dizer a verdade numa tela que não parece erro.
 *
 * O QUE ELA NÃO PODE SER: uma página de erro. Quem chega aqui está DECIDIDO —
 * clicou no botão de comprar. Essa pessoa merece ver o preço que vai valer, a
 * garantia, e sair com alguma coisa na mão. Por isso a tela mostra os dois
 * planos (mesmas constantes da landing, sem número digitado), oferece a
 * demonstração do FINCASH e guarda o e-mail de quem quer ser avisado.
 *
 * A TRAVA: quando as duas ofertas da Hotmart estiverem cadastradas, esta rota
 * se recusa a existir e manda de volta para `/assinar`. A decisão acontece no
 * SERVIDOR, na renderização — não num `onClick` que só roda depois do
 * JavaScript. É o par da decisão que `assinaturaCheckout()` toma do outro
 * lado: lá o botão para de apontar para cá, aqui a porta se fecha. Se só uma
 * das ofertas existir, a tela continua de pé, porque o botão do outro plano
 * ainda precisa dela.
 */
export const metadata: Metadata = {
  title: `Assinatura em breve — ${ASSINATURA_NOME}`,
  description:
    "A assinatura do FINCASH está abrindo. Veja os planos, a garantia e o que dá para usar hoje mesmo.",
  alternates: { canonical: "/assinar/em-breve" },
  /* Fora do Google de propósito: é uma tela de passagem, com prazo de
     validade curto. Indexada, ela sobreviveria à própria utilidade e ainda
     roubaria o clique de quem procurava a página de venda de verdade. */
  robots: { index: false, follow: true },
};

export default function AssinarEmBrevePage() {
  if (ASSINATURA_CHECKOUT_COMPLETO) redirect("/assinar");

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Cabecalho
        direita={
          <Link
            href="/assinar"
            className="flex min-h-11 items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar para a assinatura
          </Link>
        }
      />

      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-12 sm:py-16">
        <span className="inline-flex items-center gap-2 rounded-full bg-accent-tint px-3 py-1.5 text-2xs font-semibold uppercase tracking-wider text-accent-strong">
          <PlayCircle className="h-3.5 w-3.5" />
          Estamos abrindo as vagas
        </span>

        <h1 className="mt-4 font-display text-3xl font-bold leading-tight tracking-tight text-primary sm:text-4xl">
          A assinatura abre em alguns dias
        </h1>

        {/* Sem "ops", sem "algo deu errado", sem ícone de alerta: nada aqui
            quebrou, e dar ao visitante a impressão de defeito custa a venda
            que ele já tinha decidido fazer. */}
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          O produto está pronto e você não fez nada de errado — o que ainda
          está sendo ligado é o pagamento. Assim que a Novare terminar o
          cadastro das ofertas, este mesmo botão leva direto para o checkout.
        </p>

        {/* ─────────────────────────────────── os preços que vão valer */}
        <section className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-subtle sm:p-7">
          <h2 className="font-display text-lg font-bold text-primary">
            Quanto vai custar
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Uma assinatura libera tudo: o FINCASH, o planejamento, a Íris e as
            ferramentas. Os valores abaixo são os definitivos.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {ASSINATURA_PLANOS.map((p) => (
              <div
                key={p.chave}
                className={`rounded-2xl border p-5 ${
                  p.destaque
                    ? "border-accent/40 bg-accent-tint"
                    : "border-border bg-background"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {p.nome}
                  </p>
                  {p.selo && (
                    <span className="rounded-md bg-accent-btn px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-wide text-white">
                      {p.selo}
                    </span>
                  )}
                </div>
                <p className="mt-2 flex items-end gap-1">
                  <span className="font-display text-3xl font-extrabold leading-none tabular-nums text-primary">
                    {p.valorRotulo}
                  </span>
                  <span className="text-sm font-semibold text-muted-foreground">
                    {p.periodo}
                  </span>
                </p>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {p.detalhe}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-4 flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            <span>
              {ASSINATURA_GARANTIA_FRASE} No plano anual você economiza{" "}
              <strong className="text-foreground">
                {ASSINATURA_ANUAL_ECONOMIA_ROTULO}
              </strong>{" "}
              em um ano.
            </span>
          </p>
        </section>

        {/* ────────────────────────────────── o que dá para fazer hoje */}
        <section className="mt-6 overflow-hidden rounded-3xl border border-border bg-card shadow-subtle">
          <div className="border-b border-border bg-gelo px-6 py-5 sm:px-7">
            <h2 className="font-display text-lg font-bold text-primary">
              O que dá para fazer agora
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Você não precisa esperar para ver o produto por dentro.
            </p>
          </div>

          <ul className="divide-y divide-border">
            {/* A demonstração é o melhor consolo possível para quem quis
                comprar: entra sozinha, já com sete meses de histórico, e a
                pessoa vê o app cheio em vez de uma tela vazia pedindo
                cadastro.

                ⚠️ Ela cria uma conta de verdade no Supabase a cada visita —
                era uma rota interna, sem link nenhum apontando para cá. Ao
                publicar o link nesta tela, ela vira porta pública: se o
                volume crescer, é o primeiro lugar a ganhar teto. */}
            <li className="flex flex-wrap items-center justify-between gap-4 px-6 py-5 sm:px-7">
              <div className="min-w-0">
                <p className="font-semibold text-foreground">
                  Entrar na demonstração do FINCASH
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Sete meses de histórico já lançados, sem cadastro nenhum.
                </p>
              </div>
              <Link
                href="/fincash/testar"
                className="group inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-accent-btn px-5 text-sm font-bold text-white transition-colors hover:bg-accent-strong"
              >
                Abrir a demonstração
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </li>

            <li className="flex flex-wrap items-center justify-between gap-4 px-6 py-5 sm:px-7">
              <div className="min-w-0">
                <p className="font-semibold text-foreground">
                  Usar as calculadoras da casa
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Abertas, sem login, com as tabelas oficiais de 2026.
                </p>
              </div>
              <Link
                href="/aplicativos"
                className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border border-accent-soft bg-card px-5 text-sm font-semibold text-primary transition-colors hover:bg-accent-tint"
              >
                Ver as ferramentas
                <ArrowRight className="h-4 w-4" />
              </Link>
            </li>
          </ul>
        </section>

        {/* ───────────────────────────────────────────── a lista de espera */}
        <section className="mt-6 rounded-3xl border border-border bg-card p-6 shadow-subtle sm:p-7">
          <h2 className="font-display text-lg font-bold text-primary">
            Quer ser avisado no dia?
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Deixe o e-mail e você recebe uma única mensagem quando a assinatura
            abrir. Nada de newsletter.
          </p>

          <div className="mt-4">
            <AvisarQuandoAbrir />
          </div>

          <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-success" />
              Seus dados seguem a LGPD
            </span>
            <a
              href={falarNoWhatsApp(
                `Olá! Quero assinar o ${ASSINATURA_NOME} e vi que a assinatura ainda está abrindo. Podem me avisar?`,
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-semibold text-success-strong underline-offset-4 hover:underline"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Prefiro falar no WhatsApp
            </a>
          </p>
        </section>

        <div className="mt-8">
          <Link
            href="/assinar"
            className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-accent-strong underline-offset-4 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para a página da assinatura
          </Link>
        </div>
      </main>

      <RodapeNovare convite={false} aviso="servico" />
    </div>
  );
}
