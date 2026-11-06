import Image from "next/image";
import { textoAgentes } from "@/lib/novarecash/agentes";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  BadgeCheck,
  BookOpenText,
  CalendarClock,
  Check,
  ChevronDown,
  CreditCard,
  Download,
  HandCoins,
  Headset,
  Landmark,
  LayoutGrid,
  MessageCircle,
  Monitor,
  ShieldCheck,
  Smartphone,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Cabecalho } from "@/components/Cabecalho";
import { RodapeNovare } from "@/components/RodapeNovare";
import { AssinaturaJefferson } from "@/components/AssinaturaJefferson";
import { getPerfil } from "@/lib/perfil";
import { sair } from "@/lib/acoes-sessao";
import { CONTATO } from "@/lib/contato";
import { temAcessoNovareCash } from "@/lib/novarecash/acesso";
import { MAX_PARCELAS } from "@/lib/novarecash/cartoes";
import {
  BLACK,
  dataSimulada,
  faseBlack,
  GARANTIA_DIAS,
  NOVARECASH_NOME,
  RECURSOS,
  urgenciaBlack,
  type FaseBlack,
  type Recurso,
  type UrgenciaBlack,
} from "@/lib/novarecash/config";
import { medirClique } from "@/lib/medir";
import { MedirCliques } from "@/components/MedirCliques";
import {
  avisoBancos,
  maisBarata,
  avisoPendentes,
  brl,
  dataBlack,
  juntar,
  maiorDesconto,
  NOME_CURTO,
  ofertasPorPrazo,
  rotuloPrazo,
  statusRecurso,
  brlCurto,
  textoCompra,
} from "@/lib/novarecash/oferta";
import { Heroi } from "./_venda/Heroi";
import { Planos } from "./_venda/Planos";
import { Recursos } from "./_venda/Recursos";
import { BarraFixaCelular } from "./_venda/BarraFixaCelular";
import { TelasExemplo } from "./_venda/TelasExemplo";
import { CartaFundador } from "./_venda/CartaFundador";
import "./_venda/venda.css";

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
 * 04/11/2026 ("o herói precisa melhorar muito"): o herói mora em
 * `_venda/Heroi.tsx` (celular em cena com cartões vivos em volta) e os recursos
 * viraram um bento escuro (`_venda/Recursos.tsx`). O movimento e as luzes estão
 * em `_venda/venda.css`, tudo desligado em `prefers-reduced-motion`.
 *
 * ═══ VENDA DIRETA (04/11/2026: "já vamos vender, valor mensal, nada de Lista VIP") ═══
 * O preço sai de `PLANOS` (`config.ts`; 05/11/2026: Essencial, Plus e Premium,
 * que só mudam no limite de bancos): riscado e % OFF só com a Black aberta.
 * Cada botão vai ao checkout (Kiwify) do plano E PRAZO (mensal em
 * `NEXT_PUBLIC_NOVARECASH_CHECKOUT_ESSENCIAL`, `_PLUS`, `_PREMIUM`; anual nas
 * mesmas com `_ANUAL` no fim, na Vercel); enquanto o link não existe, vai ao
 * WhatsApp da casa (`linkDeCompra`). Ninguém troca preço editando esta página.
 *
 * ═══ PLANO ANUAL (05/11/2026, decisão do dono) ═══
 * Cada plano tem MENSAL e ANUAL (os 12 meses pagos de uma vez, mais barato por
 * mês). Os planos abrem no ANUAL, com a chave "Mensal | Anual" no topo. Herói,
 * pop-up, barra fixa, missão e fecho dizem "a partir de" o MENOR preço por mês —
 * o do anual do Essencial — com "no anual" ao lado. O riscado do anual é o
 * MENSAL cheio (preço real), e o % OFF é contra ele.
 *
 * ═══ COPY NO MODELO "BLACK NOVEMBER" (04/11/2026) ═══
 * Ancoragem (cheio riscado), garantia repetida, objeções em blocos próprios
 * (preço, onde funciona, risco, confiança), números concretos, prazo real da
 * campanha, missão ("por que só R$ X"), o MESMO texto de botão (`textoCompra`)
 * e autoridade. ⚠️ PROVA SOCIAL: ainda não há clientes. Nada de depoimento,
 * nota, "milhares de usuários" ou estatística sem fonte. A prova aqui é a casa.
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
 * ═══ 05/11/2026 (benchmark com a Nord) ═══
 * • URGÊNCIA COM DATA REAL: a faixa do topo ganha o rótulo de `urgenciaBlack()`
 *   ("Última semana", "Hoje é Black Friday", "Últimos dias" e, no dia 30, em
 *   destaque, "Últimas horas: acaba hoje às 23h59"). Tudo sai de `BLACK`.
 * • MODO PRÉVIA: `?simular=AAAA-MM-DD`, SÓ para admin/equipe (`getPerfil`),
 *   calcula fase, preço e rótulos com aquela data. Para o público o parâmetro
 *   não faz nada. Na prévia, os cliques não são medidos.
 * • MEDIÇÃO: cada botão de venda leva `medirClique("venda:…")` e o
 *   `MedirCliques` conta o clique (`lib/medir.ts`, só depois dos cookies).
 * • A CARTA DO FUNDADOR (`_venda/CartaFundador.tsx`) e o preço por dia no plano.
 *
 * CVM: o NovareCash organiza e explica. Nenhum texto daqui indica produto,
 * ativo ou promete rendimento.
 */

const PENDENTES = RECURSOS.filter((r) => !r.noAr);
const recurso = (chave: Recurso["chave"]) => RECURSOS.find((r) => r.chave === chave);
const BANCO = recurso("banco");
const BANCO_NO_AR = Boolean(BANCO?.noAr);
const WHATSAPP_NO_AR = Boolean(recurso("whatsapp")?.noAr);
const EXTRATO_NO_AR = Boolean(recurso("extrato")?.noAr);
const CONSULTOR_NO_AR = Boolean(recurso("consultor")?.noAr);
const COMPARTILHADA_NO_AR = Boolean(recurso("compartilhada")?.noAr);
const NO_AR = RECURSOS.filter((r) => r.noAr).map((r) => NOME_CURTO[r.chave]);
const TOTAL_RECURSOS = RECURSOS.length;
/** "8 já funcionam hoje." / "Todos já funcionam." — contado, nunca escrito à mão. */
const QUANTOS_FUNCIONAM =
  NO_AR.length === TOTAL_RECURSOS ? "Todos já funcionam." : `${NO_AR.length} já ${NO_AR.length > 1 ? "funcionam" : "funciona"} hoje.`;
/** "IA e extrato com orçamento já funcionam." — derivado de `noAr`, nunca escrito à mão. */
/* 04/11: com 10 recursos a lista ficaria enorme — acima de 3 no ar, diz "todo o resto". */
const JA_FUNCIONA = !NO_AR.length
  ? ""
  : PENDENTES.length && NO_AR.length > 3
    ? "Todo o resto já funciona."
    : `${juntar(NO_AR).replace(/^./, (c) => c.toUpperCase())} já ${NO_AR.length > 1 ? "funcionam" : "funciona"}.`;
/** "Conexão com o banco e WhatsApp liberam em dezembro de 2026." — vai ao lado de toda promessa de "sozinho". */
const AVISO_PENDENTES = avisoPendentes();
/** "A conexão com bancos libera em …; até lá, todos os recursos que já funcionam vêm em qualquer plano." */
const AVISO_BANCOS = avisoBancos();
/** A data do "Vem aí", quando todos os pendentes ligam juntos ("dezembro de 2026"). */
const DATAS_PENDENTES = [...new Set(PENDENTES.map((r) => r.liberaEm ?? ""))];
const DATA_UNICA = DATAS_PENDENTES.length === 1 && DATAS_PENDENTES[0] ? DATAS_PENDENTES[0] : null;

const ICONE_PENDENTE: Partial<Record<Recurso["chave"], LucideIcon>> = { banco: Landmark, whatsapp: MessageCircle };

export const metadata: Metadata = {
  title: `${NOVARECASH_NOME}: seu dinheiro organizado por quem não vende nada`,
  description: `${TOTAL_RECURSOS} recursos num app só: extrato, cartões com fatura, contas a pagar, orçamento, metas e uma IA que responde com os seus números. Feito por uma consultoria que não ganha comissão de banco.${
    AVISO_PENDENTES ? ` ${AVISO_PENDENTES}` : ""
  } Garantia de ${GARANTIA_DIAS} dias.`,
  alternates: { canonical: "/novarecash" },
  openGraph: {
    title: `${NOVARECASH_NOME}, da Novare`,
    description: `Seu dinheiro organizado por quem não vende nada: ${TOTAL_RECURSOS} recursos num app só e garantia de ${GARANTIA_DIAS} dias.`,
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
function textoFaixa(fase: FaseBlack, desconto: string | null, urgencia: UrgenciaBlack | null): string | null {
  if (fase === "aviso") return `vem aí, de ${dataBlack("inicio")} a ${dataBlack("fim")}`;
  if (fase !== "aberta") return null;
  // No último dia o rótulo já diz "acaba hoje às 23h59": repetir a data só alongaria a faixa no celular.
  if (urgencia?.destaque) return desconto ?? "preço da campanha";
  return desconto ? `${desconto}, só até ${dataBlack("fim")}` : `aberta até ${dataBlack("fim")}`;
}

/**
 * "Planos a partir de" + "de R$ 59,90 por" + "R$ 29,90/mês" + selo de % OFF —
 * o MENOR plano (05/11/2026: são três). O riscado só existe com a Black aberta.
 */
function Preco({
  cheio,
  valor,
  desconto,
  rotulo,
  centro = false,
}: {
  cheio: number | null;
  valor: number;
  desconto: number | null;
  /** "no anual", quando o menor preço é o do anual. */
  rotulo: string | null;
  centro?: boolean;
}) {
  return (
    <div className={centro ? "text-center" : ""}>
      <p className="text-sm text-white/65">
        Planos a partir de{cheio != null && (
          <>
            {" "}
            <s>{brl(cheio)}</s> por
          </>
        )}
      </p>
      <p className={`mt-0.5 flex flex-wrap items-baseline gap-x-1.5 gap-y-1 ${centro ? "justify-center" : ""}`}>
        <strong className="font-display text-4xl font-bold tracking-[-0.03em] text-white">{brl(valor)}</strong>
        <span className="text-sm text-white/70">/mês</span>
        {rotulo && <span className="text-sm font-semibold text-ouro">{rotulo}</span>}
        {desconto && (
          <span className="ml-1 self-center rounded-full bg-accent px-2 py-0.5 text-2xs font-bold text-white">{desconto}% OFF</span>
        )}
      </p>
    </div>
  );
}

export default async function NovareCashVendaPage({
  searchParams,
}: {
  searchParams: Promise<{ "sem-assinatura"?: string; simular?: string }>;
}) {
  const { "sem-assinatura": semAssinatura, simular } = await searchParams;
  const perfil = await getPerfil();
  const jaTem = perfil ? await temAcessoNovareCash() : false;

  /* O MODO PRÉVIA: só a equipe. Para qualquer outra pessoa `?simular=` não existe. */
  const podeSimular = perfil?.role === "admin" || perfil?.role === "equipe";
  const simulada = podeSimular ? dataSimulada(simular) : null;
  const agora = simulada ?? new Date();
  const fase = faseBlack(agora);
  const black = fase === "aberta";
  /** Os 3 planos em cada prazo (a chave "Mensal | Anual" troca entre eles). */
  const porPrazo = ofertasPorPrazo(agora);
  /** Os 3 planos no mensal: a pergunta "qual a diferença entre os planos?". */
  const lista = porPrazo.mensal;
  const todas = [...porPrazo.mensal, ...porPrazo.anual];
  const emVenda = todas.length > 0;
  /** O "a partir de": o MENOR preço por mês entre os seis (hoje, o Essencial no anual). */
  const menor = maisBarata(todas);
  const desde = menor?.porMes ?? null;
  /** "no anual" ao lado do "a partir de", quando é o anual (pago de uma vez). */
  const noPrazo = rotuloPrazo(menor?.prazo);
  const desconto = maiorDesconto(todas);
  /** "58% OFF" ou, se os planos tiverem % diferentes, "até 58% OFF". */
  const descontos = new Set(todas.map((o) => o.desconto).filter((d): d is number => d != null && d > 0));
  const textoDesconto = desconto ? `${descontos.size > 1 ? "até " : ""}${desconto}% OFF` : null;
  /** O valor riscado do MENOR preço (o mensal cheio do plano, `ancoraPorMes`). */
  const cheio = menor?.cheioPorMes ?? null;
  const peloWhatsApp = todas.some((o) => o.peloWhatsApp);
  /** O anual e o mensal do Essencial (o menor plano), para a pergunta "mensal ou anual?". */
  const essencialMensal = porPrazo.mensal[0];
  const essencialAnual = porPrazo.anual[0];

  /** "Última semana", "Hoje é Black Friday"... — só com a Black aberta, pela data (`config.ts`). */
  const urgencia = urgenciaBlack(agora);
  const faixa = textoFaixa(fase, textoDesconto, urgencia);
  /** O MESMO texto em todo botão de compra: "Assinar a partir de R$ X/mês no anual". */
  const textoCta = textoCompra(desde, menor?.prazo);
  const chapeuCampanha = black ? `${BLACK.nome} · só até ${dataBlack("fim")}` : null;

  return (
    <div className="min-h-dvh overflow-x-clip bg-white text-foreground">
      {/* Conta os cliques dos botões marcados com `medirClique` (nunca na prévia). */}
      <MedirCliques desligado={Boolean(simulada)} />

      {/* 0 · O aviso da prévia, para a equipe não confundir com o site de verdade. */}
      {simulada && simular && (
        <div role="status" className="border-b border-ouro/40 bg-ouro-tint">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2 text-xs text-foreground">
            <p>
              <strong>Prévia da equipe:</strong> a página está calculando a campanha como se hoje fosse{" "}
              {simular.split("-").reverse().join("/")}. Só a equipe vê, e os cliques não contam.
            </p>
            <Link href="/novarecash" className="inline-flex min-h-11 items-center font-semibold text-ouro-forte underline underline-offset-4">
              Sair da prévia
            </Link>
          </div>
        </div>
      )}

      {/* 1 · A faixa da campanha, com a urgência do calendário. Fora da janela da Black, nada. */}
      {faixa && (
        <a
          href="#planos"
          {...medirClique("venda:faixa")}
          className={`flex min-h-11 flex-wrap items-center justify-center gap-x-2 gap-y-1 px-4 py-2 text-center text-xs font-semibold ${
            urgencia?.destaque ? "bg-ouro text-noite" : "bg-black text-white"
          }`}
        >
          {urgencia ? (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-2xs font-black uppercase tracking-[0.06em] ${
                urgencia.destaque ? "bg-noite text-ouro" : "bg-ouro text-noite"
              }`}
            >
              <span
                aria-hidden
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${urgencia.destaque ? "bg-ouro motion-safe:animate-pulse" : "bg-noite"}`}
              />
              {urgencia.rotulo}
            </span>
          ) : (
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-ouro" aria-hidden />
          )}
          <span>
            <span className={urgencia?.destaque ? "font-black" : "text-ouro"}>{BLACK.nome}:</span> {faixa}
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
        {/* 2 · O herói: o produto em cena (celular + cartões vivos), o preço ancorado e a garantia. */}
        <Heroi
          cheio={emVenda ? cheio : null}
          desde={emVenda ? desde : null}
          desconto={desconto}
          rotuloPrazo={noPrazo}
          totalPlanos={lista.length}
          black={black}
          textoCta={textoCta}
          chapeu={chapeuCampanha ?? "Novo app da Novare"}
          aviso={
            AVISO_PENDENTES
              ? `${AVISO_PENDENTES} ${JA_FUNCIONA}${EXTRATO_NO_AR ? " Até lá, você lança à mão." : ""}`
              : null
          }
          totalRecursos={TOTAL_RECURSOS}
          comFaixa={Boolean(faixa)}
        />

        {/* 3 · Três benefícios, cada um com um número. */}
        <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
          <ul className="grid gap-4 sm:grid-cols-3">
            {[
              {
                Icone: LayoutGrid,
                titulo: `${TOTAL_RECURSOS} recursos num app só`,
                texto: `Extrato, cartões, contas, orçamento, metas, alertas, IA e mais. ${QUANTOS_FUNCIONAM}`,
              },
              {
                Icone: CreditCard,
                titulo: `Até ${MAX_PARCELAS} parcelas na fatura certa`,
                texto: "Comprou parcelado? Cada parcela cai no mês certo, e você vê quanto vem na próxima fatura.",
              },
              {
                Icone: HandCoins,
                titulo: "Zero comissão de banco",
                texto: "A Novare não ganha de banco, corretora nem seguradora. O app organiza e explica: não vende investimento.",
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

        {/* 3b · A carta do fundador: por que o app existe, antes do preço. */}
        <CartaFundador comPlanos={emVenda} />

        {/* 4 · Os três planos (só muda o limite de bancos), com o riscado e o prazo da campanha. */}
        {/* `scroll-mt-20`: o cabeçalho fixo (64px) não cobre o título quando se chega por #planos. */}
        <section id="planos" className="scroll-mt-20 text-white" style={PALCO_OURO}>
          <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <p className="chapeu text-ouro">{fase === "aviso" || black ? BLACK.nome : NOVARECASH_NOME}</p>
              <h2 className="mt-3 font-display text-3xl font-semibold leading-[1.12] tracking-[-0.03em] sm:text-[2.6rem]">
                {black && textoDesconto
                  ? `${textoDesconto.replace(/^./, (c) => c.toUpperCase())} na ${BLACK.nome}`
                  : lista.length > 1
                    ? "Escolha o seu plano"
                    : `Assine o ${NOVARECASH_NOME}`}
              </h2>
              <p className="mt-3 text-base leading-relaxed text-white/70">
                Muda quantos bancos você conecta e quantos agentes de IA trabalham para você; o resto vem em todos.{" "}
                No mensal, cobrado todo mês; no anual, os 12 meses de uma vez e mais barato por mês.{" "}
                {black
                  ? `Preços da ${BLACK.nome} só até ${dataBlack("fim")}; depois, cada plano volta ao preço cheio. ${GARANTIA_DIAS} dias de garantia.`
                  : `${GARANTIA_DIAS} dias de garantia nos dois.`}
              </p>
            </div>
            <div className="mt-8">
              <Planos porPrazo={porPrazo} fimBlack={black ? dataBlack("fim") : null} />
            </div>
          </div>
        </section>

        {/* 5 · Os recursos, com o status honesto de cada um. */}
        <section id="recursos" className="scroll-mt-16 bg-gelo">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <div className="mb-8 max-w-2xl sm:mb-10">
              <h2 className="titulo-cp text-[2.1rem] sm:text-5xl">
                {TOTAL_RECURSOS} recursos. <span className="text-ouro-forte">{QUANTOS_FUNCIONAM}</span>
              </h2>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                Cada bloco diz o status de verdade. O que tem data, a data está ao lado.
              </p>
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
                Você abre o app e o mês está lá
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-white/70">
                Ilustração com dados de exemplo: as telas do app podem mudar nos detalhes.
                {AVISO_PENDENTES && ` ${AVISO_PENDENTES}`}
              </p>
            </div>
            <TelasExemplo />
          </div>
        </section>

        {/* 7 · Autoridade: quem está por trás (a única prova que existe hoje: a casa). */}
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
              <p className="chapeu text-ouro-forte">Quem está por trás</p>
              <h2 className="titulo-cp mt-3 text-3xl sm:text-[2.4rem]">
                Feito por uma consultoria. <span className="block text-ouro-forte">Não por um banco.</span>
              </h2>
              <ul className="mt-6 space-y-4">
                {[
                  {
                    Icone: BadgeCheck,
                    titulo: "Consultoria independente",
                    texto: "A Novare é uma consultoria de investimentos independente. O NovareCash é feito por ela, não por um banco.",
                  },
                  {
                    Icone: HandCoins,
                    titulo: "Zero comissão",
                    texto: "Ninguém aqui recebe de banco, corretora ou seguradora. Quem paga é você, e por isso a resposta é sua.",
                  },
                  ...(CONSULTOR_NO_AR
                    ? [
                        {
                          Icone: Headset,
                          titulo: "Um consultor dentro do app",
                          texto: "Ficou em dúvida? Fale com um consultor da Novare pelo WhatsApp, direto do app. Gente, não robô.",
                        },
                      ]
                    : []),
                  {
                    Icone: Users,
                    titulo: "Um fundador certificado",
                    texto: "Jefferson Freitas fundou a Novare e responde por ela. As certificações dele estão logo abaixo.",
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

        {/* 8 · Vem aí: o que tem data. Curiosidade honesta, nunca "incluso" (CDC). */}
        {PENDENTES.length > 0 && (
          <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
            <div className="mx-auto mb-10 max-w-2xl text-center">
              <p className="chapeu text-ouro-forte">Vem aí</p>
              <h2 className="titulo-cp mt-3 text-3xl sm:text-[2.4rem]">
                {DATA_UNICA ? `O que estreia em ${DATA_UNICA}` : "O que estreia em seguida"}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {EXTRATO_NO_AR && "Até lá, você lança à mão, e o orçamento e a IA já trabalham com isso. "}
                {PENDENTES.length > 1 ? "Quando ligarem, entram" : "Quando ligar, entra"} na mesma assinatura.
              </p>
            </div>
            <ul className={`mx-auto grid max-w-3xl gap-4 ${PENDENTES.length > 1 ? "sm:grid-cols-2" : ""}`}>
              {PENDENTES.map((r) => {
                const Icone = ICONE_PENDENTE[r.chave] ?? CalendarClock;
                return (
                  <li key={r.chave} className="cartao-cp flex flex-col p-6">
                    <span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-ciano" />
                    <div className="flex items-start justify-between gap-3">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-ciano-tint text-ciano-forte">
                        <Icone className="h-5 w-5" strokeWidth={1.75} />
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-ciano-tint px-3 py-1 text-2xs font-semibold text-ciano-forte">
                        <CalendarClock className="h-3.5 w-3.5" />
                        {statusRecurso(r).rotulo}
                      </span>
                    </div>
                    <h3 className="mt-4 font-display text-lg font-semibold leading-snug text-primary">{r.titulo}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{r.texto}</p>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* 9 · A objeção do preço, respondida com a missão. */}
        {emVenda && desde != null && (
          <section className="text-white" style={PALCO_OURO}>
            <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
              <p className="chapeu text-ouro">A nossa missão</p>
              <h2 className="mt-3 font-display text-3xl font-semibold leading-[1.12] tracking-[-0.03em] sm:text-[2.6rem]">
                Por que a partir de só {brl(desde)} por mês{noPrazo ? ` ${noPrazo}` : ""}?
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/80">
                Porque a gente não ganha com o seu dinheiro. A Novare não vende produto financeiro e
                não recebe comissão de banco.
              </p>
              <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-white/80">
                O que nós queremos é ver você sair do aperto e saber para onde vai cada real. Um app
                caro atrapalharia justamente isso.
              </p>
              <p className="mx-auto mt-3 max-w-xl text-sm font-semibold leading-relaxed text-ouro">
                Assinar é entrar para esse jeito de cuidar do dinheiro: com clareza e sem ninguém
                empurrando nada.
              </p>
              <a href="#planos" {...medirClique("venda:fazer-parte")} className="btn-cp cta-halo mt-8 px-7">
                Quero fazer parte
                <ArrowRight className="h-4 w-4" />
              </a>
              <p className="mt-4 flex items-center justify-center gap-2 text-xs text-white/65">
                <ShieldCheck className="h-4 w-4 shrink-0 text-ouro" />
                {GARANTIA_DIAS} dias de garantia. Cancela quando quiser.
              </p>
            </div>
          </section>
        )}

        {/* 10 · Onde funciona (a objeção da compatibilidade). */}
        <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <p className="chapeu text-ouro-forte">Onde funciona</p>
            <h2 className="titulo-cp mt-3 text-3xl sm:text-[2.4rem]">Uma conta, no celular e no computador</h2>
          </div>
          <ul className={`grid gap-4 sm:grid-cols-2 ${COMPARTILHADA_NO_AR ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
            {[
              { Icone: Smartphone, titulo: "No celular", texto: "Feito primeiro para a tela pequena: lançar um gasto leva segundos." },
              { Icone: Monitor, titulo: "No computador", texto: "A mesma conta, com espaço para ver o mês inteiro de uma vez." },
              {
                Icone: Download,
                titulo: "Instala como app",
                texto: "No navegador do celular, toque em \"Adicionar à tela inicial\". Abre como app, sem loja.",
              },
              ...(COMPARTILHADA_NO_AR
                ? [
                    {
                      Icone: Users,
                      titulo: "Para o casal ou a família",
                      texto: "Quem divide as contas vê e lança no mesmo NovareCash, com uma assinatura só.",
                    },
                  ]
                : []),
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

        {/* 11 · A garantia (a objeção do risco). */}
        <section className="px-4 pb-16 sm:px-6">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 rounded-[1.75rem] border-2 border-ouro/40 bg-ouro-tint/60 p-6 text-center sm:flex-row sm:p-8 sm:text-left">
            <span className="flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-full bg-white text-ouro-forte shadow-[0_8px_30px_-10px_hsl(42_74%_45%/0.45)]">
              <ShieldCheck className="h-7 w-7" />
              <span className="mt-0.5 font-display text-lg font-bold leading-none">{GARANTIA_DIAS} dias</span>
            </span>
            <div>
              <h2 className="font-display text-2xl font-semibold text-primary">Você tem {GARANTIA_DIAS} dias para decidir</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Assine e use à vontade. Não era para você? Peça o reembolso em até {GARANTIA_DIAS} dias
                {peloWhatsApp ? " falando com a equipe no WhatsApp" : " pela Kiwify, onde a compra é feita"}, e o
                valor volta inteiro. Sem precisar explicar o motivo.
              </p>
            </div>
          </div>
        </section>

        {/* 12 · Perguntas frequentes. */}
        <section className="bg-gelo">
          <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
            <div className="mb-8 text-center">
              <p className="chapeu text-ouro-forte">Dúvidas</p>
              <h2 className="titulo-cp mt-3 text-3xl sm:text-[2.4rem]">Perguntas frequentes</h2>
            </div>
            <div className="space-y-3">
              {[
                {
                  p: "E se eu não gostar? Como cancelo?",
                  r: `Nos primeiros ${GARANTIA_DIAS} dias, peça o reembolso e o valor volta inteiro, no mensal e no anual. Depois disso, cancela quando quiser, sem multa: no mensal, para de cobrar no mês seguinte; no anual, a renovação desliga e o acesso vai até o fim do ano já pago.`,
                },
                {
                  p: "Preciso começar do zero?",
                  r: BANCO_NO_AR
                    ? "Não. Conecte o seu banco pelo Open Finance e o extrato já vem preenchido, com cada gasto na sua categoria. O que faltar, você manda pelo WhatsApp ou lança à mão."
                    : `Não. Quando a conexão com o banco liberar (${BANCO?.liberaEm ?? "data a definir"}), você conecta e o extrato já vem preenchido, com cada gasto na sua categoria. Até lá, você lança à mão${
                        WHATSAPP_NO_AR ? " ou pelo WhatsApp" : ""
                      }, e o orçamento e a IA já trabalham com isso.`,
                },
                {
                  p: "Funciona no meu celular?",
                  r: "Funciona no navegador do celular e do computador, com a mesma conta. No celular, dá para pôr na tela inicial e abrir como app, sem loja.",
                },
                ...(COMPARTILHADA_NO_AR
                  ? [
                      {
                        p: "Dá para dividir com quem mora comigo?",
                        r: "Dá. Convide quem divide as contas com você: os dois veem e lançam no mesmo NovareCash, com uma assinatura só.",
                      },
                    ]
                  : []),
                {
                  // 05/11/2026: três planos. A resposta sai de `PLANOS` e de `avisoBancos()`.
                  p: "Qual a diferença entre os planos?",
                  r: `Quantos bancos você conecta e quantos agentes de IA você tem: ${juntar(
                    lista.map((o) => `${o.nome}, ${o.bancos} ${o.bancos === 1 ? "banco" : "bancos"} e ${textoAgentes(o.plano).toLowerCase()}`),
                  )}. Extrato, cartões, contas a pagar, metas, alertas e relatórios vêm em todos os planos.${
                    AVISO_BANCOS ? ` ${AVISO_BANCOS}` : ""
                  }`,
                },
                ...(essencialMensal && essencialAnual?.totalAno != null
                  ? [
                      {
                        // 05/11/2026: o anual. Tudo calculado de `PLANOS` (o exemplo é o Essencial, o menor plano).
                        p: "Qual a diferença entre mensal e anual?",
                        r: `Os recursos são os mesmos. No mensal, você paga todo mês. No anual, paga os 12 meses de uma vez e cada mês sai mais barato: o Essencial fica ${brl(
                          essencialAnual.porMes,
                        )} por mês no anual (${brl(essencialAnual.totalAno)} cobrados de uma vez), contra ${brl(essencialMensal.porMes)} no mensal${
                          essencialAnual.economiaAno ? `: ${brlCurto(essencialAnual.economiaAno)} a menos por ano` : ""
                        }. A garantia de ${GARANTIA_DIAS} dias vale para os dois.`,
                      },
                    ]
                  : []),
                {
                  // A ÚNICA menção ao app gratuito da casa na página (decisão de 03/11, noite).
                  p: "Já uso o FINCASH. Preciso trocar?",
                  r: "Não. São apps separados: o FINCASH continua grátis, sem cartão e sem prazo, e segue funcionando como está. O NovareCash é outro app, com cartões, contas a pagar, alertas e uma IA que responde com os seus números.",
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
                  p: "Quem está por trás do NovareCash?",
                  r: "A Novare, consultoria de investimentos independente fundada pelo Jefferson Freitas. Ninguém aqui recebe comissão de banco, corretora ou seguradora.",
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

        {/* 13 · Dúvidas pelo WhatsApp (gente, não robô). */}
        <section className="px-4 py-16 sm:px-6">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 rounded-[1.75rem] bg-noite p-6 text-center text-white sm:flex-row sm:p-8 sm:text-left">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-ouro/12 text-ouro">
              <MessageCircle className="h-7 w-7" />
            </span>
            <div className="flex-1">
              <h2 className="font-display text-xl font-semibold">Ainda em dúvida? Fale com gente.</h2>
              <p className="mt-1 text-sm leading-relaxed text-white/70">
                Quem responde no WhatsApp é a equipe da Novare, não um robô.
              </p>
            </div>
            <a href={ZAP_SUPORTE} target="_blank" rel="noopener noreferrer" {...medirClique("venda:whatsapp")} className="btn-claro shrink-0">
              <MessageCircle className="h-4 w-4" />
              Quero falar com a equipe
            </a>
          </div>
        </section>

        {/* 14 · O fecho: o resumo da oferta e o risco zero. */}
        <section className="text-white" style={PALCO_OURO}>
          <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
            <div className="text-center">
              <p className="chapeu text-ouro">{chapeuCampanha ?? "Resumo"}</p>
              <h2 className="mt-3 font-display text-3xl font-semibold leading-[1.12] tracking-[-0.03em] sm:text-[2.6rem]">
                O que você leva ao assinar
              </h2>
            </div>
            <ul className="mx-auto mt-8 max-w-xl space-y-3">
              {[
                `${TOTAL_RECURSOS} recursos num app só. ${QUANTOS_FUNCIONAM}`,
                ...(AVISO_PENDENTES ? [`${AVISO_PENDENTES} ${PENDENTES.length > 1 ? "Entram" : "Entra"} na mesma assinatura.`] : []),
                "Uma IA que responde com os seus números, não com média da internet.",
                ...(CONSULTOR_NO_AR ? ["Um consultor da Novare pelo WhatsApp, direto do app."] : []),
                "Zero comissão: ninguém aqui vende nada para você.",
                `${GARANTIA_DIAS} dias de garantia e cancelamento quando quiser.`,
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-white/85">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-ouro" />
                  {item}
                </li>
              ))}
            </ul>
            {emVenda && desde != null && (
              <div className="mt-10 flex flex-col items-center">
                <Preco cheio={cheio} valor={desde} desconto={desconto} rotulo={noPrazo} centro />
                {black && (
                  <p className="mt-1.5 text-xs font-semibold text-ouro">Preço da {BLACK.nome} só até {dataBlack("fim")}.</p>
                )}
                <a href="#planos" {...medirClique("venda:fecho")} className="btn-cp cta-halo cta-varredura mt-6 w-full px-7 sm:w-auto">
                  {textoCta}
                  <ArrowRight className="h-4 w-4" />
                </a>
                <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-white/65">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-ouro" />
                  Risco zero: em {GARANTIA_DIAS} dias, não gostou, o dinheiro volta inteiro.
                </p>
              </div>
            )}
          </div>
        </section>

        <p className="mx-auto flex max-w-3xl items-start gap-2 px-4 py-8 text-2xs leading-relaxed text-muted-foreground sm:px-6">
          <BookOpenText className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          O {NOVARECASH_NOME} é uma ferramenta de organização financeira. Não constitui recomendação de
          investimento nem promessa de rentabilidade.
        </p>
      </main>

      <RodapeNovare convite={false} aviso="servico" />
      {/* Respiro para a barra fixa não cobrir o fim do rodapé no celular. */}
      <div aria-hidden className="h-20 sm:hidden" />

      {/* 15 · A barra fixa do celular: a oferta numa linha e "Assinar agora". */}
      <BarraFixaCelular
        href="#planos"
        texto={emVenda ? "Assinar agora" : textoCta}
        apoio={
          emVenda && desde != null
            ? `a partir de ${brl(desde)}/mês${noPrazo ? ` ${noPrazo}` : ""}${desconto ? ` (${desconto}% OFF)` : ""} · ${GARANTIA_DIAS} dias de garantia`
            : fase === "aviso" || black
              ? `${BLACK.nome}: avisamos você primeiro`
              : `Garantia de ${GARANTIA_DIAS} dias`
        }
      />
    </div>
  );
}
