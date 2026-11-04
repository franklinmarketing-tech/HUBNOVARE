import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  BadgeCheck,
  BookOpenText,
  ChevronDown,
  Clock,
  Download,
  HandCoins,
  MessageCircle,
  Monitor,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Users,
  Wand2,
} from "lucide-react";
import { Cabecalho } from "@/components/Cabecalho";
import { RodapeNovare } from "@/components/RodapeNovare";
import { AssinaturaJefferson } from "@/components/AssinaturaJefferson";
import { MarcaNovareCash } from "@/components/novarecash/MarcaNovareCash";
import { getPerfil } from "@/lib/perfil";
import { sair } from "@/lib/acoes-sessao";
import { CONTATO } from "@/lib/contato";
import { temAcessoNovareCash } from "@/lib/novarecash/acesso";
import { BLACK, faseBlack, GARANTIA_DIAS, NOVARECASH_NOME, RECURSOS, type FaseBlack } from "@/lib/novarecash/config";
import {
  aPartirDe,
  avisoPendentes,
  brl,
  dataBlack,
  juntar,
  maiorDesconto,
  NOME_CURTO,
  ofertas,
} from "@/lib/novarecash/oferta";
import { Planos } from "./_venda/Planos";
import { Recursos } from "./_venda/Recursos";
import { BarraFixaCelular } from "./_venda/BarraFixaCelular";
import { LegendaExemplo, TelaInicio, TelasExemplo } from "./_venda/TelasExemplo";

/**
 * A PÁGINA DE VENDA DO NOVARECASH — a única do Hub que mostra preço.
 *
 * Decisão do dono (03/11/2026, noite): o NovareCash é OUTRO app, pago e
 * independente — extrato próprio (que enche pelo banco e pelo WhatsApp),
 * orçamento por categoria e IA com os dados da pessoa. Ele NÃO é "o app grátis
 * com extras": a página vende o NovareCash pelo que ele é. A única menção ao
 * app gratuito da casa é UMA pergunta do FAQ ("Já uso… Preciso trocar?").
 *
 * Esta rota é a exceção declarada no guardião
 * `scripts/testar-nada-a-venda.mjs`, e por isso ela NÃO está na lista dele.
 *
 * IDENTIDADE: escura e premium, com o OURO como assinatura (`ouro`,
 * `ouro-forte`, `ouro-tint`) sobre `noite`/`noite-2`. O CTA continua laranja.
 * Não há tela real do app para fotografar ainda: as telas são ilustrações em
 * HTML (`_venda/TelasExemplo.tsx`), sempre com a legenda "dados de exemplo".
 *
 * ═══ VENDA DIRETA (04/11/2026: "já vamos vender, valor mensal, nada de Lista VIP") ═══
 * O preço sai de `PRECOS` (`config.ts`): riscado e % OFF só com a Black aberta.
 * O botão vai ao checkout da Hotmart (`NEXT_PUBLIC_NOVARECASH_CHECKOUT_MENSAL`
 * na Vercel); enquanto o link não existe, vai ao WhatsApp da casa
 * (`linkDeCompra`). Ninguém troca preço editando esta página.
 *
 * ⚠️ DINÂMICA DE PROPÓSITO. A fase da Black depende da hora, e uma página
 * estática congelaria a fase do dia do build: a faixa diria "vem aí" com a
 * campanha já aberta. Ler `searchParams` (o aviso de `?sem-assinatura=1`) e
 * o login já a tornam dinâmica.
 *
 * ⚠️ NÃO HÁ `layout.tsx` EM /novarecash, e não deve haver: ele ficaria por
 * cima de `/novarecash/app` e desenharia dentro do app logado (a mesma
 * armadilha já anotada no layout do outro app do Hub). O metadata mora aqui.
 *
 * CVM: o NovareCash organiza e explica. Nenhum texto daqui indica produto,
 * ativo ou promete rendimento.
 */

const PENDENTES = RECURSOS.filter((r) => !r.noAr);
const recurso = (chave: (typeof RECURSOS)[number]["chave"]) => RECURSOS.find((r) => r.chave === chave);
const BANCO = recurso("banco");
const BANCO_NO_AR = Boolean(BANCO?.noAr);
const WHATSAPP_NO_AR = Boolean(recurso("whatsapp")?.noAr);
const EXTRATO_NO_AR = Boolean(recurso("extrato")?.noAr);
const NO_AR = RECURSOS.filter((r) => r.noAr).map((r) => NOME_CURTO[r.chave]);
/** "IA e extrato com orçamento já funcionam." — derivado de `noAr`, nunca escrito à mão. */
/* 04/11: com 10 recursos a lista ficaria enorme — acima de 3 no ar, diz "todo o resto". */
const JA_FUNCIONA = !NO_AR.length
  ? ""
  : PENDENTES.length && NO_AR.length > 3
    ? "Todo o resto já funciona."
    : `${juntar(NO_AR).replace(/^./, (c) => c.toUpperCase())} já ${NO_AR.length > 1 ? "funcionam" : "funciona"}.`;
/** "Conexão com o banco e WhatsApp liberam em dezembro de 2026." — vai ao lado de toda promessa de "sozinho". */
const AVISO_PENDENTES = avisoPendentes();

export const metadata: Metadata = {
  title: `${NOVARECASH_NOME}: o seu dinheiro organizado sozinho`,
  description: `O app pago da Novare: o banco e o WhatsApp lançam, a IA explica. Extrato próprio, orçamento por categoria e uma IA que responde com os seus números.${
    AVISO_PENDENTES ? ` ${AVISO_PENDENTES}` : ""
  } Garantia de ${GARANTIA_DIAS} dias.`,
  alternates: { canonical: "/novarecash" },
  openGraph: {
    title: `${NOVARECASH_NOME}, da Novare`,
    description: "O seu dinheiro organizado sozinho e explicado por IA, por uma consultoria que não vende produto financeiro.",
    url: "/novarecash",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Novare" }],
  },
};

/** A noite com a luz DOURADA: a assinatura visual do NovareCash (o laranja fica só no botão). */
const PALCO_OURO: React.CSSProperties = {
  background: [
    "radial-gradient(42rem 24rem at 84% -14%, hsl(42 74% 62% / 0.20), transparent 62%)",
    "radial-gradient(34rem 22rem at 2% 106%, hsl(36 78% 40% / 0.16), transparent 60%)",
    "linear-gradient(155deg, hsl(200 55% 7%) 0%, hsl(203 100% 2%) 100%)",
  ].join(","),
};

/* O suporte por WhatsApp: SÓ o número da casa (`CONTATO.whatsapp`). ⚠️ 03/11: `NEXT_PUBLIC_WHATSAPP_NUMERO`
   é o do ROBÔ do assistente; a dúvida de quem vai comprar cairia numa máquina que só entende lançamento. */
const NUMERO_SUPORTE = CONTATO.whatsapp.replace(/\D/g, "");
const ZAP_SUPORTE = `https://wa.me/${NUMERO_SUPORTE}?text=${encodeURIComponent(
  "Olá! Estou na página do NovareCash e tenho uma dúvida.",
)}`;

/** O texto da faixa do topo, depois de "Black Novare:". `null` = nada fora da campanha. */
function textoFaixa(fase: FaseBlack, desconto: number | null): string | null {
  if (fase === "aviso") return `vem aí, de ${dataBlack("inicio")} a ${dataBlack("fim")}`;
  if (fase === "aberta") return desconto ? `${desconto}% OFF até ${dataBlack("fim")}` : `aberta até ${dataBlack("fim")}`;
  return null;
}

export default async function NovareCashVendaPage({
  searchParams,
}: {
  searchParams: Promise<{ "sem-assinatura"?: string }>;
}) {
  const { "sem-assinatura": semAssinatura } = await searchParams;
  const perfil = await getPerfil();
  const jaTem = perfil ? await temAcessoNovareCash() : false;

  const agora = new Date();
  const fase = faseBlack(agora);
  const lista = ofertas(agora);
  const emVenda = lista.length > 0;
  const desde = aPartirDe(lista);
  const desconto = maiorDesconto(lista);
  const faixa = textoFaixa(fase, desconto);
  const textoCta = "Assinar o NovareCash";

  return (
    <div className="min-h-dvh overflow-x-clip bg-white text-foreground">
      {/* 1 · A faixa da campanha. Fora da janela da Black, nada. */}
      {faixa && (
        <a
          href="#planos"
          className="flex min-h-11 items-center justify-center gap-2 bg-black px-4 py-2 text-center text-xs font-semibold text-white"
        >
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-ouro" aria-hidden />
          <span>
            <span className="text-ouro">{BLACK.nome}:</span> {faixa}
          </span>
          <ArrowRight className="h-3.5 w-3.5 shrink-0" />
        </a>
      )}

      <Cabecalho
        direita={
          jaTem ? (
            <Link href="/novarecash/app" className="btn-cp px-4 text-xs">
              Abrir o NovareCash
            </Link>
          ) : perfil ? undefined : (
            <Link
              href="/login?proximo=%2Fnovarecash%2Fapp"
              className="inline-flex min-h-11 items-center text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Já assinei: entrar
            </Link>
          )
        }
      />

      {/* Quem a trava de /novarecash/app mandou de volta. */}
      {semAssinatura === "1" && !jaTem && (
        <div className="border-b border-border bg-gelo" role="status">
          <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-3 text-sm text-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>
              Sua conta ainda não tem o {NOVARECASH_NOME}. Já assinou? Entre com o mesmo e-mail da compra.
            </p>
            {perfil ? (
              <form action={sair}>
                <button type="submit" className="inline-flex min-h-11 items-center text-xs font-semibold text-accent-strong underline underline-offset-4">
                  Sair e entrar com outro e-mail
                </button>
              </form>
            ) : (
              <Link
                href="/login?proximo=%2Fnovarecash%2Fapp"
                className="inline-flex min-h-11 items-center text-xs font-semibold text-accent-strong underline underline-offset-4"
              >
                Entrar
              </Link>
            )}
          </div>
        </div>
      )}

      <main>
        {/* 2 · O herói. */}
        <section className="relative isolate overflow-hidden text-white" style={PALCO_OURO}>
          <div className="relative mx-auto grid max-w-5xl items-center gap-10 px-4 pb-14 pt-10 sm:px-6 sm:pt-14 lg:grid-cols-[1.15fr_0.85fr] lg:pb-20">
            <div>
              <MarcaNovareCash tamanho="lg" />
              <p className="mt-4">
                <span className="inline-flex items-center gap-2 rounded-full bg-ouro/12 px-3 py-1 text-2xs font-semibold uppercase tracking-[0.16em] text-ouro ring-1 ring-ouro/30">
                  <Sparkles className="h-3.5 w-3.5" />
                  Novo app da Novare
                </span>
              </p>
              <h1 className="mt-5 font-display text-[2.1rem] font-semibold leading-[1.08] tracking-[-0.035em] sm:text-5xl">
                O seu dinheiro organizado sozinho:{" "}
                <span className="text-ouro">o banco e o WhatsApp lançam, a IA explica.</span>
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-white/75">
                Um extrato que se preenche, um orçamento por categoria que avisa antes de estourar e
                uma IA que responde com os seus números, no celular e no computador.
              </p>
              {AVISO_PENDENTES && (
                <p className="mt-3 flex max-w-xl items-start gap-2 text-xs leading-relaxed text-white/70">
                  <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ouro" />
                  <span>
                    {AVISO_PENDENTES} {JA_FUNCIONA}
                    {EXTRATO_NO_AR && " Até lá, você lança à mão."}
                  </span>
                </p>
              )}

              {emVenda && desde != null && (
                <p className="mt-6 text-sm text-white/70">
                  a partir de{" "}
                  <strong className="font-display text-2xl font-bold text-white">{brl(desde)}</strong>
                  <span className="text-white/70">/mês</span>
                  {desconto && (
                    <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-2xs font-bold text-white">
                      até {desconto}% OFF
                    </span>
                  )}
                </p>
              )}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <a href="#planos" className="btn-cp cta-halo cta-varredura px-7">
                  {textoCta}
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a href="#recursos" className="inline-flex min-h-11 items-center justify-center gap-1.5 text-sm font-semibold text-white/80 hover:text-white">
                  O que vem dentro
                  <ChevronDown className="h-4 w-4" />
                </a>
              </div>

              <p className="mt-5 flex items-center gap-2 text-xs text-white/65">
                <ShieldCheck className="h-4 w-4 shrink-0 text-ouro" />
                Garantia de {GARANTIA_DIAS} dias: não era o que esperava, o dinheiro volta inteiro.
              </p>
            </div>

            <div className="mx-auto w-full max-w-[17rem] lg:max-w-[18rem]">
              <TelaInicio />
              <LegendaExemplo className="mt-4" />
            </div>
          </div>
        </section>

        {/* 3 · O resumo em três pontos. */}
        <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
          <ul className="grid gap-4 sm:grid-cols-3">
            {[
              {
                Icone: Wand2,
                titulo: "Organiza sozinho",
                texto: "O banco e o WhatsApp lançam, cada gasto cai na sua categoria e o orçamento do mês avisa antes de estourar.",
              },
              {
                Icone: Sparkles,
                titulo: "Explica",
                texto: "Pergunte em português e a IA responde olhando os seus lançamentos, não uma média da internet.",
              },
              {
                Icone: HandCoins,
                titulo: "Não vende nada",
                texto: "A Novare não ganha comissão de banco. O NovareCash não indica investimento: organiza e explica.",
              },
            ].map(({ Icone, titulo, texto }) => (
              <li key={titulo} className="cartao-cp p-6">
                <span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-ouro" />
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ouro-tint text-ouro-forte">
                  <Icone className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <h2 className="mt-4 font-display text-lg font-semibold text-primary">{titulo}</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{texto}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* 4 · O plano (hoje só o mensal). */}
        <section id="planos" className="scroll-mt-16 text-white" style={PALCO_OURO}>
          <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <p className="chapeu text-ouro">{fase === "aviso" || fase === "aberta" ? BLACK.nome : NOVARECASH_NOME}</p>
              <h2 className="mt-3 font-display text-3xl font-semibold leading-[1.12] tracking-[-0.03em] sm:text-[2.6rem]">
                {lista.length > 1 ? "Escolha como quer assinar" : `Assine o ${NOVARECASH_NOME}`}
              </h2>
              <p className="mt-3 text-base leading-relaxed text-white/70">
                {fase === "aberta"
                  ? `Condição da ${BLACK.nome} até ${dataBlack("fim")}. Depois, volta o preço cheio.`
                  : `Garantia de ${GARANTIA_DIAS} dias.`}
              </p>
            </div>
            <div className="mt-10">
              <Planos lista={lista} />
            </div>
          </div>
        </section>

        {/* 5 · Os recursos, com o status honesto de cada um. */}
        <section id="recursos" className="scroll-mt-16 bg-gelo">
          <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
            <div className="mx-auto mb-10 max-w-2xl text-center">
              <p className="chapeu text-ouro-forte">O que vem dentro</p>
              <h2 className="titulo-cp mt-3 text-3xl sm:text-[2.4rem]">{`Tudo o que vem dentro, e o que cada recurso já faz`}</h2>
            </div>
            <Recursos />
          </div>
        </section>

        {/* 6 · Por dentro do app: ilustração com dados de exemplo (ainda não há tela real para fotografar). */}
        <section className="text-white" style={PALCO_OURO}>
          <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <p className="chapeu text-ouro">Por dentro do {NOVARECASH_NOME}</p>
              <h2 className="mt-3 font-display text-3xl font-medium leading-[1.08] tracking-[-0.03em] sm:text-[2.4rem]">
                Você abre o app e o mês já está lá
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-white/70">
                Ilustração com dados de exemplo: as telas do app podem mudar nos detalhes.
                {AVISO_PENDENTES && ` ${AVISO_PENDENTES}`}
              </p>
            </div>
            <TelasExemplo />
          </div>
        </section>

        {/* 7 · Por que a Novare. */}
        <section className="bg-gelo">
          <div className="mx-auto grid max-w-5xl items-center gap-8 px-4 py-16 sm:px-6 md:grid-cols-[0.9fr_1.1fr]">
            <div className="relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-[1.75rem]">
              <Image
                src="/marca/jefferson/sorrindo.webp"
                alt="Jefferson Freitas, fundador da Novare"
                fill
                sizes="(max-width: 768px) 90vw, 384px"
                className="object-cover object-[50%_20%]"
              />
            </div>
            <div>
              <p className="chapeu text-ouro-forte">Por que a Novare</p>
              <h2 className="titulo-cp mt-3 text-3xl sm:text-[2.4rem]">Quem fez não ganha com o seu dinheiro</h2>
              <ul className="mt-6 space-y-4">
                {[
                  {
                    Icone: BadgeCheck,
                    titulo: "Consultoria independente",
                    texto: "A Novare é uma consultoria financeira, e o NovareCash é feito por ela, não por um banco.",
                  },
                  {
                    Icone: HandCoins,
                    titulo: "Sem comissão de banco",
                    texto: "Ninguém aqui recebe de banco, corretora ou seguradora. Quem paga é você, e por isso a resposta é sua.",
                  },
                  {
                    Icone: Users,
                    titulo: "Gente de verdade",
                    texto: "Do outro lado tem uma equipe, liderada pelo Jefferson, fundador da casa, e não só um robô.",
                  },
                ].map(({ Icone, titulo, texto }) => (
                  <li key={titulo} className="flex gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-ouro-forte shadow-subtle">
                      <Icone className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <span>
                      <span className="block font-semibold text-primary">{titulo}</span>
                      <span className="mt-0.5 block text-sm leading-relaxed text-muted-foreground">{texto}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <AssinaturaJefferson tom="claro" className="pt-6" />
            </div>
          </div>
        </section>

        {/* 8 · Celular, computador e app instalado. */}
        <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <p className="chapeu text-ouro-forte">Onde funciona</p>
            <h2 className="titulo-cp mt-3 text-3xl sm:text-[2.4rem]">No celular, no computador, e vira app</h2>
          </div>
          <ul className="grid gap-4 sm:grid-cols-3">
            {[
              { Icone: Smartphone, titulo: "No celular", texto: "Feito primeiro para a tela pequena: lançar um gasto leva segundos." },
              { Icone: Monitor, titulo: "No computador", texto: "A mesma conta, com espaço para ver o mês inteiro de uma vez." },
              {
                Icone: Download,
                titulo: "Instala como app",
                texto: "No navegador do celular, toque em \"Adicionar à tela inicial\". Abre como app, sem loja.",
              },
            ].map(({ Icone, titulo, texto }) => (
              <li key={titulo} className="rounded-3xl border border-border bg-card p-6 text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-ouro-tint text-ouro-forte">
                  <Icone className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold text-primary">{titulo}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{texto}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* 9 · A garantia. */}
        <section className="px-4 pb-16 sm:px-6">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 rounded-[1.75rem] border-2 border-ouro/40 bg-ouro-tint/60 p-6 text-center sm:flex-row sm:p-8 sm:text-left">
            <span className="flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-full bg-white text-ouro-forte shadow-[0_8px_30px_-10px_hsl(42_74%_45%/0.45)]">
              <ShieldCheck className="h-7 w-7" />
              <span className="mt-0.5 font-display text-lg font-bold leading-none">{GARANTIA_DIAS} dias</span>
            </span>
            <div>
              <h2 className="font-display text-2xl font-semibold text-primary">Garantia de {GARANTIA_DIAS} dias</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Assinou e não era o que esperava? Peça o reembolso em até {GARANTIA_DIAS} dias pela
                própria Hotmart, onde a compra é feita, e o valor volta inteiro. Sem precisar explicar o motivo.
              </p>
            </div>
          </div>
        </section>

        {/* 10 · Perguntas frequentes. */}
        <section className="bg-gelo">
          <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
            <div className="mb-8 text-center">
              <p className="chapeu text-ouro-forte">Dúvidas</p>
              <h2 className="titulo-cp mt-3 text-3xl sm:text-[2.4rem]">Perguntas frequentes</h2>
            </div>
            <div className="space-y-3">
              {[
                {
                  p: "Preciso começar do zero?",
                  r: BANCO_NO_AR
                    ? "Não. Conecte o seu banco pelo Open Finance e o extrato já vem preenchido, com cada gasto na sua categoria. O que faltar, você manda pelo WhatsApp ou lança à mão."
                    : `Não. Quando a conexão com o banco liberar (${BANCO?.liberaEm ?? "data a definir"}), você conecta e o extrato já vem preenchido, com cada gasto na sua categoria. Até lá, você lança à mão${
                        WHATSAPP_NO_AR ? " ou pelo WhatsApp" : ""
                      }, e o orçamento e a IA já trabalham com isso.`,
                },
                {
                  // A ÚNICA menção ao app gratuito da casa na página (decisão de 03/11, noite).
                  p: "Já uso o FINCASH. Preciso trocar?",
                  r: "Não. São apps separados: o FINCASH continua grátis, sem cartão e sem prazo, e segue funcionando como está. O NovareCash é outro app, para quem quer o extrato automático, pelo banco e pelo WhatsApp, e uma IA que responde com os seus números.",
                },
                {
                  p: "O NovareCash diz em que investir?",
                  r: "Não. Ele organiza e explica o seu dinheiro: para onde foi, quanto sobra, o que pesa. Não indica produto, ativo, fundo nem corretora, e não promete rendimento.",
                },
                {
                  p: "O que ainda não está funcionando?",
                  r: PENDENTES.length
                    ? `Ainda não: ${PENDENTES.map((r) => `${NOME_CURTO[r.chave]} (libera em ${r.liberaEm ?? "data a definir"})`).join(" e ")}. O resto já funciona, e o status de cada recurso está em "O que vem dentro".`
                    : "Tudo o que está nesta página já funciona.",
                },
                {
                  p: "Os meus dados ficam seguros?",
                  r: `Os dados ficam na sua conta da Novare, protegidos por login e tratados conforme a LGPD. ${
                    BANCO_NO_AR ? "A conexão com o banco é" : "A conexão com o banco, quando liberar, será"
                  } pelo Open Finance oficial do Banco Central: você autoriza no app do seu banco e pode cancelar quando quiser.`,
                },
                {
                  p: "Como cancelo?",
                  r: `Quando quiser, sem multa. Nos primeiros ${GARANTIA_DIAS} dias, o valor volta inteiro.`,
                },
                {
                  p: "Já assinei. Como entro?",
                  r: "Entre no Hub com o mesmo e-mail que usou na compra. A assinatura é reconhecida pelo e-mail.",
                },
              ].map(({ p, r }) => (
                <details key={p} className="group rounded-2xl border border-border bg-white px-5 open:shadow-subtle">
                  <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 py-3 font-semibold text-primary [&::-webkit-details-marker]:hidden">
                    {p}
                    <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="pb-4 text-sm leading-relaxed text-muted-foreground">{r}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* 11 · Suporte por WhatsApp. */}
        <section className="px-4 py-16 sm:px-6">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 rounded-[1.75rem] bg-noite p-6 text-center text-white sm:flex-row sm:p-8 sm:text-left">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-ouro/12 text-ouro">
              <MessageCircle className="h-7 w-7" />
            </span>
            <div className="flex-1">
              <h2 className="font-display text-xl font-semibold">Ficou alguma dúvida?</h2>
              <p className="mt-1 text-sm leading-relaxed text-white/70">
                Fale com a gente no WhatsApp. Quem responde é a equipe da Novare.
              </p>
            </div>
            <a href={ZAP_SUPORTE} target="_blank" rel="noopener noreferrer" className="btn-claro shrink-0">
              <MessageCircle className="h-4 w-4" />
              Chamar no WhatsApp
            </a>
          </div>
          <p className="mx-auto mt-8 flex max-w-3xl items-start gap-2 text-2xs leading-relaxed text-muted-foreground">
            <BookOpenText className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            O {NOVARECASH_NOME} é uma ferramenta de organização financeira. Não constitui recomendação de
            investimento nem promessa de rentabilidade.
          </p>
        </section>
      </main>

      <RodapeNovare convite={false} aviso="servico" />
      {/* Respiro para a barra fixa não cobrir o fim do rodapé no celular. */}
      <div aria-hidden className="h-20 sm:hidden" />

      {/* 12 · A barra fixa do celular. */}
      <BarraFixaCelular
        href="#planos"
        texto={textoCta}
        apoio={
          emVenda && desde != null
            ? `a partir de ${brl(desde)}/mês`
            : fase === "aviso" || fase === "aberta"
              ? `${BLACK.nome}: avisamos você primeiro`
              : `Garantia de ${GARANTIA_DIAS} dias`
        }
      />
    </div>
  );
}
