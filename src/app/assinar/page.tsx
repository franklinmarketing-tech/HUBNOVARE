import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import {
  ArrowRight,
  BadgePercent,
  Bot,
  Check,
  ClipboardList,
  CreditCard,
  FileSearch,
  Lock,
  Receipt,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  MessageCircle,
  Wallet,
  Wrench,
  Users,
  X,
} from "lucide-react";
import { Cabecalho } from "@/components/Cabecalho";
import { RodapeNovare } from "@/components/RodapeNovare";
import { OQueSignifica } from "@/components/OQueSignifica";
import { BotaoAssinarPlano } from "@/components/BotaoAssinarPlano";
import { BarraAssinarFixa } from "@/components/BarraAssinarFixa";
import { TituloCine } from "@/components/TituloCine";
import { FundoCena } from "@/components/FundoCena";
import { CenaParallax } from "@/components/CenaParallax";
import { CenaFoto } from "@/components/CenaFoto";
import { RevelarAoRolar } from "@/components/RevelarAoRolar";
import { Chapeu, tomPor } from "@/components/SecoesVenda";
import {
  ASSINATURA_ANUAL_ECONOMIA_ROTULO,
  ASSINATURA_GARANTIA,
  ASSINATURA_GARANTIA_DIAS,
  ASSINATURA_GARANTIA_FRASE,
  ASSINATURA_NOME,
  ASSINATURA_OFERTA,
  ASSINATURA_PLANOS,
  ASSINATURA_PRECO_ANUAL_MENSAL_ROTULO,
  ASSINATURA_PRECO_DIA_ANUAL_ROTULO,
  ASSINATURA_PRECO_ROTULO,
} from "@/lib/assinatura";
import { CONTAGEM } from "@/lib/apps";
import { ROTULO_DESCONTO_ASSINANTE } from "@/lib/consultoria";
import { falarNoWhatsApp } from "@/lib/contato";

/* ⚠️ O TÍTULO CARREGA A BUSCA, O NOME CARREGA A MARCA — e é de propósito que
   eles não são a mesma frase. `ASSINATURA_NOME` virou "FINCASH" com a troca de
   âncora (ver `lib/assinatura.ts`), e ninguém digita "FINCASH" no Google: as
   palavras que se procuram ("organizar o dinheiro", "planejamento
   financeiro") migraram para cá, que é onde o buscador lê. Trocar o nome do
   produto sem fazer essa migração seria sumir do Google de graça. */
export const metadata: Metadata = {
  title: `Assine o ${ASSINATURA_NOME}: organize o mês e leve a casa inteira`,
  /* Sem "1º hub financeiro do Brasil": é superlativo que não temos como
     comprovar, e claim de pioneirismo sem prova é passivo — não vantagem. */
  description: `O app que mostra quanto ainda dá para gastar até o fim do mês — e junto vêm o planejamento financeiro, a IA que lê seu extrato e todas as ferramentas da casa. ${ASSINATURA_OFERTA}. ${ASSINATURA_GARANTIA}.`,
  alternates: { canonical: "/assinar" },
  openGraph: {
    title: `Assine o ${ASSINATURA_NOME}: organize o mês e leve a casa inteira`,
    description: `Tudo o que a Novare construiu, por ${ASSINATURA_PRECO_ANUAL_MENSAL_ROTULO}/mês no plano anual. ${ASSINATURA_GARANTIA}.`,
    url: "/assinar",
    type: "website",
    locale: "pt_BR",
    images: ["/og.png"],
  },
};

/* -------------------------------------------------------------------------- */

const PALCO: React.CSSProperties = {
  background: "linear-gradient(157deg, hsl(215 52% 21%) 0%, hsl(216 58% 11%) 100%)",
};

/** Fundo navy chapado das seções escuras intercaladas. */
const NAVY: React.CSSProperties = {
  background: "linear-gradient(140deg, hsl(216 54% 14%) 0%, hsl(219 58% 10%) 100%)",
};

/**
 * A landing de venda no formato de tráfego pago: uma coluna, leitura
 * vertical, blocos escuros e claros alternados, e um CTA em cada dobra.
 *
 * REGRA DESTA PÁGINA: nada aqui é fabricado para vender. Sem depoimento
 * (a casa não publicou nenhum) e sem contador regressivo (a assinatura é
 * recorrente e não tem vaga limitada).
 *
 * O "de/por" que apareceu no cartão do anual não é preço-âncora inventado: a
 * referência riscada é o que a pessoa pagaria de verdade assinando mês a mês
 * (12 × o mensal), e os dois valores existem no site. Preço cheio fictício
 * continua proibido.
 *
 * O que a página usa no lugar da urgência é a REVERSÃO DE RISCO — a garantia
 * de 7 dias, que tem processo real por trás: quem cancela no prazo é
 * devolvido pela própria Hotmart. Numa casa que vende confiança financeira, o
 * truque de conversão custa mais caro do que rende.
 */

/** A dor, dita como a pessoa diz para si mesma. */
const SINTOMAS = [
  {
    icone: Receipt,
    texto: "O mês acaba antes do dinheiro e você não sabe explicar onde foi.",
  },
  {
    icone: FileSearch,
    texto: "Você paga assinatura que esqueceu e tarifa que nem sabia que existia.",
  },
  {
    icone: ClipboardList,
    texto: "Já começou três planilhas. Nenhuma sobreviveu ao segundo mês.",
  },
  {
    icone: TrendingUp,
    texto: "Quer investir, mas ninguém te diz quanto dá para guardar sem apertar.",
  },
];



/**
 * O pacote, item a item.
 *
 * ⚠️ OS EMBLEMAS 3D SAÍRAM EM 14/09/2026. Eram PNGs de `/public/icones-3d`
 * (pergaminho, cérebro, chave inglesa, bonecos) no estilo dos emojis 3D da
 * Apple, e o dono resumiu o efeito ao ver a seção: "parece um pdf de apostila
 * com emojis, não tá profissional".
 *
 * Ele tinha razão, e o defeito não era o desenho isolado: era a soma de seis
 * emojis coloridos, cada um de uma família visual, empilhados em coluna num
 * fundo branco. Emoji como ícone de produto é justamente o que separa uma
 * página de venda de um material impresso — e a casa já tinha essa regra em
 * todo o resto do site, onde ícone é traço (`lucide`) dentro de uma pastilha
 * de cor.
 *
 * ⚠️ NÃO DEVOLVA OS PNGs. Os arquivos continuam em `/public/icones-3d` porque
 * outras telas do app os usam em contexto diferente (blocos da trilha do
 * FINPLAN, onde são ilustração e não ícone de lista).
 */
const PACOTE = [
  {
    /* Primeiro do pacote porque é o único item que não é software. Os três
       de baixo um chatbot imita; este exige uma consultoria registrada do
       outro lado. */
    Icone: ClipboardList,
    nome: "Revisão trimestral com um consultor",
    texto:
      "A cada três meses alguém da Novare lê o seu plano e escreve o que mudou, o que está travando e o próximo passo. A primeira vem no primeiro mês.",
  },
  {
    /* O PRODUTO-ÂNCORA, e o primeiro do bloco de software — a mesma ordem e o
       mesmo motivo de `ASSINATURA_INCLUI` (ver `lib/assinatura.ts`): o item
       humano fica no topo porque é o único que a concorrência não copia; o
       FINCASH lidera o que é tela. Ele faltava nesta lista inteira, o que
       deixava a página vendendo tudo menos o que a pessoa veio comprar. */
    Icone: Wallet,
    nome: "O FINCASH inteiro",
    texto:
      "Contas, lançamentos, cartões, dívidas e metas num lugar só — e no topo o número que muda comportamento: quanto ainda dá para gastar até o fim do mês.",
  },
  {
    Icone: Target,
    nome: "O FINPLAN inteiro",
    texto:
      "Diagnóstico, nota de saúde financeira, plano de ação com valor e prazo, e relatório em PDF que é seu.",
  },
  {
    Icone: Bot,
    nome: "Íris, a IA que lê seu extrato",
    texto:
      "Cole o extrato do banco e ela acha assinatura esquecida, tarifa repetida e juro escondido.",
  },
  {
    Icone: Wrench,
    nome: "Todas as ferramentas liberadas",
    texto:
      `As ${CONTAGEM.calculadoras} calculadoras e simuladores da casa, das trabalhistas às de investimento.`,
  },
  {
    Icone: Users,
    nome: ROTULO_DESCONTO_ASSINANTE + " na consultoria particular",
    texto:
      "Consultor de verdade do outro lado, sem comissão de banco. Válido enquanto a assinatura estiver ativa.",
  },
];


/** Os números que a casa pode provar. Nada aqui é estimativa de marketing. */
const NUMEROS = [
  { valor: String(CONTAGEM.calculadoras), rotulo: "ferramentas e calculadoras" },
  { valor: `${ASSINATURA_GARANTIA_DIAS} dias`, rotulo: "de garantia, dinheiro de volta" },
  { valor: "Condição", rotulo: "especial na consultoria particular" },
  { valor: "0%", rotulo: "de comissão de banco" },
];

const SELOS = [
  { icone: CreditCard, texto: ASSINATURA_GARANTIA },
  { icone: Lock, texto: "Cancele quando quiser" },
  { icone: ShieldCheck, texto: "Consultoria independente" },
  { icone: Wallet, texto: "Sem comissão de corretora" },
];

/**
 * ⚠️ Esta lista é local e diverge de `ASSINATURA_INCLUI` (`lib/assinatura.ts`),
 * que é a fonte única da oferta. Enquanto as duas existirem, mexer numa e
 * esquecer a outra é o defeito natural — foi o que aconteceu aqui.
 *
 * Saiu daqui "Novare News e indicadores ao vivo": `assinatura.ts:149-153`
 * documenta a retirada desse item da venda, com o motivo ("Selic e IPCA ao
 * vivo existem em qualquer app de banco — ocupava uma linha sem convencer
 * ninguém e diluía os itens fortes"). A página seguia prometendo.
 *
 * Unificar com a fonte é o passo certo, mas não é troca de uma linha: são 10
 * itens contra 7, e a caixa da oferta cresceria ~220px no celular, podendo
 * empurrar o botão para fora da dobra. Fica para quando der para medir.
 */
const INCLUI = [
  "Revisão trimestral com um consultor da Novare",
  ASSINATURA_GARANTIA,
  /* O FINCASH entrou aqui junto com a troca de âncora: a caixa de oferta é o
     último lugar onde a pessoa lê o que está levando antes de clicar, e ela
     não mencionava o produto do título da página. */
  "O FINCASH inteiro, o app do seu mês",
  /* O irmão do FINCASH, e a frase diz o papel de cada um: o FINCASH é o
     app do mês, o FINPLAN é o plano do ano. Sem essa metade a lista anuncia
     dois nomes parecidos sem explicar por que são dois. */
  "O FINPLAN inteiro, o plano do seu ano",
  /* ⚠️ "SEM LIMITE", e não "a IA que lê seu extrato": a Íris é ABERTA a
     qualquer um, com teto de leituras (ver `plano` dela em `apps.ts`). Numa
     lista do que a assinatura entrega, o nome sozinho vende o que a pessoa já
     tem de graça — e a conta chega no dia em que ela descobre. O que se compra
     aqui é o teto saindo, que é o que `ASSINATURA_INCLUI` também diz. */
  "Íris sem limite: leia quantos extratos quiser",
  /* ⚠️ SAIU "N ferramentas exclusivas de assinante": o N foi a zero quando as
     oito pagas deixaram o catálogo (duplicavam o FINCASH). Sobrou a linha das
     calculadoras, que é a verdadeira — elas são abertas e a assinatura não as
     tranca. Se voltar ferramenta paga, a linha volta com ela. */
  "Todas as calculadoras da casa",
  ROTULO_DESCONTO_ASSINANTE + " na consultoria particular",
  "Cancele quando quiser, sem multa",
];

/* -------------------------------------------------------------------------- */

export default function AssinarPage() {
  /**
 * As ferramentas que só existem para quem assina, lidas do catálogo.
 *
 * A página inteira falava delas por um número ("28 ferramentas") e não
 * nomeava nenhuma — quem chega aqui não faz ideia do que está comprando.
 * Cada uma já tem a chamada de uma linha escrita em `apps.ts`; a seção se
 * monta sozinha e passa a crescer junto com o catálogo, em vez de virar mais
 * uma lista à mão que diverge (foi o que aconteceu com a lista de inclusos).
 */
/* O "por dia" vem pronto de `assinatura.ts`. Era `brl(ASSINATURA_PRECO / 30)`
   aqui: uma tela de venda fazendo conta de preço, que é o começo de duas
   verdades sobre a mesma cobrança. */
const porDia = ASSINATURA_PRECO_DIA_ANUAL_ROTULO;

  return (
    <div className="min-h-dvh bg-background">
      <RevelarAoRolar />
      <BarraAssinarFixa />

      <Cabecalho
        direita={
          <Link
            href="/"
            className="inline-flex min-h-11 items-center text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            Voltar ao início
          </Link>
        }
      />

      <main>
        {/* ============================================= 1. HERO DE IMPACTO */}
        <section
          className="palco-vivo cine-grade relative overflow-hidden text-white"
          style={PALCO}
        >
          {/* A cena holográfica atrás da promessa. Opacidade baixa: ela dá
              profundidade à dobra sem disputar leitura com a headline. */}
          <FundoCena
            src="/cenas/cena-holo.webp"
            opacidade={0.75}
            posicao="center 32%"
            prioridade
            fundir
          />

          <div className="relative mx-auto max-w-5xl px-5 py-16 text-center sm:py-20 lg:py-24">
            {/* Selo de autoridade — é a primeira frase que qualquer pessoa lê
                na página, e precisa pesar tanto quanto a headline. Duas
                rodadas de ajuste até chegar aqui: primeiro só a borda ganhou
                destaque (ainda sumia no fundo escuro), agora o preenchimento
                é sólido em degradê — a mesma cor do botão principal — com o
                anel pulsando por fora (`.selo-pulsa`, já usado no selo de
                oferta) para puxar o olho sem piscar nem mudar de cor. */}
            <span className="selo-pulsa cine relative inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-accent-btn via-accent to-accent-claro px-6 py-3.5 text-base font-semibold uppercase tracking-wider text-white shadow-[0_10px_50px_-6px_rgba(255,140,80,0.75)] sm:px-8 sm:py-4 sm:text-lg">
              <Sparkles className="h-5 w-5 shrink-0 text-white drop-shadow sm:h-6 sm:w-6" />
              {/* Dizia "O 1º hub financeiro do Brasil": pioneirismo que não
                  temos como provar, e claim sem prova é passivo. O que
                  está abaixo é verificável — e é o que a pessoa compra. */}
              {/* ⚠️ NÃO REPETIR A HEADLINE. Esta pílula chegou a dizer "O
                  FINCASH e a casa inteira, numa assinatura só" e ficava colada
                  em "Leve a casa inteira." logo abaixo — no celular, duas
                  linhas seguidas com a mesma frase. O selo existe para ADIANTAR
                  o que a headline não cabe dizer: quais são as outras coisas. */}
              FINPLAN, IA e ferramentas vêm junto
            </span>

            {/* A headline ocupa a dobra inteira: em tráfego pago, quem chega
                decide em três segundos se continua lendo. Entra palavra por
                palavra — ver TituloCine. */}
            {/* ⚠️ O SUJEITO DA HEADLINE É O FINCASH, e essa é a mudança
                inteira desta página. Dizia "Seu plano. Sua IA. Seu consultor. /
                Num Workspace só." — três entregáveis e, no destaque, o nome da
                ARQUITETURA. Ninguém acorda querendo comprar um workspace;
                quem chega aqui quer saber se pode gastar até o dia 30.

                O verbo no imperativo ("Assine o FINCASH") é o que a casa
                decidiu vender; o destaque é o que vem junto, e ele é a segunda
                metade da mesma frase de propósito — separar as duas em dois
                parágrafos faria o pacote parecer upsell, que é justamente o
                que esta casa não vende (existe uma assinatura só).

                A frase é a mesma de `fincash/Pacote.tsx` ("Quem assina o
                FINCASH leva a casa inteira"), e a repetição é intencional: as
                duas páginas precisam soar como a mesma oferta para quem vier
                de uma para a outra. */}
            <TituloCine
              texto="Assine o FINCASH."
              destaque="Leve a casa inteira."
              className="mx-auto mt-6 max-w-4xl font-display text-4xl font-bold leading-[1.06] tracking-tight sm:text-5xl"
            />

            <p className="cine mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-white/80 sm:text-xl">
              O app que mostra quanto ainda dá para gastar até o fim do mês. E
              junto: a Íris sem limite de leituras, o FINPLAN,{" "}
              {CONTAGEM.calculadoras} calculadoras e condição de assinante na
              consultoria. Por {ASSINATURA_PRECO_ANUAL_MENSAL_ROTULO} por
              mês no plano anual — ou {ASSINATURA_PRECO_ROTULO}/mês, sem
              compromisso.
            </p>

            <div className="cine mt-9 flex flex-col items-center gap-4">
              <BotaoAssinarPlano
                contexto="workspace"
                tamanho="grande"
                destaque
                direto
                rotulo={`Assinar o ${ASSINATURA_NOME}`}
              />
              <p className="text-sm text-white/60">
                {ASSINATURA_GARANTIA} · cancele quando quiser
              </p>
            </div>

            {/* O app de verdade na moldura de navegador. Sangra para baixo:
                sugere que tem mais produto além da dobra. */}
            <CenaParallax intensidade={-34} className="mx-auto mt-14 max-w-3xl">
              <div className="cine moldura-produto cine-reflexo relative overflow-hidden rounded-t-2xl border border-white/15 border-b-0 bg-white/[0.06] shadow-[0_40px_90px_-30px_rgba(0,0,0,0.8)] backdrop-blur-sm">
                <div className="flex h-8 items-center gap-1.5 bg-white/10 pl-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-white/25" />
                  <span className="h-2.5 w-2.5 rounded-full bg-white/25" />
                  <span className="h-2.5 w-2.5 rounded-full bg-white/25" />
                </div>
                {/* O print é um recorte e corta um botão ao meio na borda
                    direita. O fade transforma o corte seco em "continua além
                    da moldura", que é o que a janela já sugere. */}
                <div className="relative">
                  {/* ⚠️ ERA A HOME DO WORKSPACE (`/demo/poster-home-oficial.jpg`),
                      e o dono apontou o problema em 14/09/2026: "a página
                      assinar falta o FINCASH". A headline dizia "Assine o
                      FINCASH" e a única imagem grande da dobra mostrava um
                      catálogo de aplicativos — a promessa e a prova falavam de
                      coisas diferentes.

                      Agora é o painel do FINCASH, captura real da conta de
                      demonstração: o número da sobra, o medidor de renda
                      comprometida e as contas em atraso. É o que a headline
                      promete, na mesma dobra. */}
                  <Image
                    src="/fincash/telas/painel-desktop.webp"
                    alt="O painel do FINCASH: a sobra do mês em destaque, o medidor de quanto da renda já está comprometida e o aviso de contas em atraso"
                    width={2880}
                    height={1800}
                    priority
                    className="block w-full"
                  />
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 right-0 w-16"
                    style={{
                      background:
                        "linear-gradient(90deg, transparent, hsl(216 58% 11% / 0.55))",
                    }}
                  />
                </div>
              </div>
            </CenaParallax>
          </div>

          {/* Os números da casa, grandes, fechando a dobra. Ficam FORA do
              herói de propósito: faixa de prova dentro do herói disputa
              atenção com a promessa e o botão. */}
          <div className="relative border-t border-white/10 bg-black/20">
            <ul className="mx-auto grid max-w-5xl grid-cols-2 gap-px overflow-hidden px-5 py-8 sm:grid-cols-4">
              {NUMEROS.map(({ valor, rotulo }, i) => (
                <li
                  key={rotulo}
                  className="cine px-3 text-center"
                  style={{ transitionDelay: `${i * 70}ms` }}
                >
                  <p className="font-display text-3xl font-extrabold leading-none tracking-tight text-accent-claro sm:text-4xl">
                    {valor}
                  </p>
                  <p className="mt-2 text-2xs leading-snug text-white/55">
                    {rotulo}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          {/* Selos e a parceria, numa linha fina abaixo dos números. */}
          <div className="relative border-t border-white/10 bg-black/15">
            <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-5 py-4">
              <span className="flex items-center gap-2 text-2xs font-semibold uppercase tracking-wider text-white/45">
                Parceria oficial
                <Image
                  src="/marca/novare-site/logo-nord.png"
                  alt="Nord Investimentos"
                  width={72}
                  height={23}
                  style={{ height: 16, width: "auto" }}
                />
              </span>
              {SELOS.map(({ icone: Icone, texto }) => (
                <span
                  key={texto}
                  className="flex items-center gap-1.5 text-2xs font-semibold text-white/55"
                >
                  <Icone className="h-3.5 w-3.5 text-white/40" />
                  {texto}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ⚠️ QUATRO SEÇÕES SAÍRAM DAQUI EM 14/09/2026 — a dor, a virada, o
            "como funciona" em 4 passos e o ecossistema desenhado.

            NÃO foi corte de texto: foi corte de DUPLICATA. Esta página e a
            /fincash tinham virado duas landings completas vendendo a MESMA
            assinatura, com as mesmas seções em palavras diferentes. Duas
            páginas para uma oferta é onde a divergência nasce, e ela já tinha
            nascido duas vezes: a caixa de oferta sumiu só da /fincash, e o
            "0 ferramentas" existiu só aqui.

            A DIVISÃO DE TRABALHO, agora explícita:
              /fincash — a VENDA. Conta a história inteira, é onde caem
                         anúncio e busca orgânica.
              /assinar — o CAIXA. Para quem já decidiu: o que vem, quanto
                         custa, a garantia e o botão.

            ⚠️ ELA NÃO PODE VIRAR LANDING DE NOVO. Quem for acrescentar aqui
            uma seção de dor, de método ou de autoridade está reconstruindo a
            /fincash — o lugar dessa seção é lá. Esta página existe para quem
            chegou pelo cadeado de um app, pelo perfil ou pela barra lateral
            (24 links internos apontam para cá) e só quer pagar. */}

        {/* ============================================ 5. O QUE VOCÊ RECEBE */}
        {/* ⚠️ ESTA SEÇÃO ERA UMA LISTA VERTICAL EM FUNDO BRANCO, e foi
            refeita em 14/09/2026 com o veredito do dono na mão: "parece um pdf
            de apostila com emojis, não tá profissional".

            Eram seis cards brancos empilhados, cada um com um emoji 3D de 64px
            à esquerda — seis blocos iguais em coluna, que é o desenho de um
            MATERIAL IMPRESSO, não o de uma página de venda. Numa lista assim o
            olho lê linha a linha e cansa no terceiro item; numa grade ele
            varre o conjunto e entende o tamanho do pacote de uma vez, que é
            justamente o argumento aqui ("tudo isto por um preço só").

            O QUE MUDOU, e cada item tem motivo:
              • grade de 3 colunas no lugar da pilha — o pacote se lê como
                conjunto, e a seção encurtou de seis alturas de card para duas;
              • fundo NAVY — a referência que o dono trouxe é escura, e há um
                ganho concreto: as três capturas do FINCASH logo abaixo são
                telas claras, e sobre o escuro elas saltam como o notebook
                salta na referência. Em fundo branco, print branco some;
              • ícone de TRAÇO em pastilha de vidro, no lugar do emoji 3D —
                é o que o resto do site já fazia.

            ⚠️ O `border-t` NÃO É ENFEITE: a dobra do herói também é escura, e
            sem uma aresta acesa as duas viravam um bloco só de 3.000px. */}
        <section
          className="relative overflow-hidden border-t border-white/10 text-white"
          style={NAVY}
        >
          <FundoCena src="/cenas/cena-luz.webp" opacidade={0.4} espelhada />

          <div className="relative mx-auto max-w-6xl px-5 py-16 sm:py-20">
            <div className="cine mx-auto max-w-2xl text-center">
              <Chapeu>Tudo numa assinatura só</Chapeu>
              <h2 className="mt-3 font-display text-3xl font-semibold leading-[1.1] tracking-tight sm:text-[2.6rem]">
                O que você recebe hoje
              </h2>
              <p className="mt-4 text-base leading-relaxed text-white/70">
                Nenhum recurso fica de fora, nada é vendido à parte.
              </p>
            </div>

            {/* ⚠️ A CENA DA MESA — 14/09/2026, a pedido do dono, que mandou
                uma referência de landing e disse: "deixe parecido com essa
                imagem, mas formatado para FINCASH".

                A imagem é MONTADA, e a montagem importa: o ambiente (mesa,
                notebook, xícara, luz de escritório à noite) foi gerado por IA
                na paleta da casa — navy com luz laranja, nunca o azul da
                referência, que é a marca de outra empresa. Já a TELA dentro do
                notebook é captura REAL do FINCASH, composta por cima em cima
                do pixel, não desenhada.

                ⚠️ É A PROJEÇÃO, E NÃO O PAINEL, de propósito: o painel já é a
                imagem grande do herói, três dobras acima. A mesma captura duas
                vezes na mesma página é o tipo de coisa que quem está decidindo
                pagar repara — e a projeção conta a outra metade da história
                (o ano, não o mês).

                Se um dia a tela do app mudar de cara, esta imagem envelhece
                sozinha e em silêncio: o arquivo é `public/cenas/cena-mesa-fincash.webp`
                e a receita está no `git log` desta linha. */}
            <figure className="cine mt-12">
              <Image
                src="/cenas/cena-mesa-fincash.webp"
                alt="Um notebook sobre a mesa com a tela de Projeção do FINCASH aberta: o saldo dos próximos doze meses e o gráfico de saldo mês a mês"
                width={1920}
                height={1080}
                sizes="(max-width: 1024px) 100vw, 72rem"
                className="block w-full rounded-2xl"
              />
            </figure>

            <ul className="revelar-escada mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {PACOTE.map(({ Icone, nome, texto }, i) => {
                const ciano = tomPor(i) === "ciano";
                return (
                  <li
                    key={nome}
                    className="group/card flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.045] p-6 transition-all hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.07]"
                  >
                    {/* A pastilha alterna entre o laranja da casa e o ciano
                        pelo `tomPor` — o mesmo alternador que os outros blocos
                        da página usam, para a grade não virar seis pastilhas
                        idênticas. Sobre navy, os dois tons claros são os que
                        têm contraste: os fortes somem no fundo. */}
                    <span
                      aria-hidden
                      className={`flex h-12 w-12 items-center justify-center rounded-xl ring-1 ring-inset ${
                        ciano
                          ? "bg-ciano/15 text-ciano-claro ring-ciano-claro/25"
                          : "bg-accent/15 text-accent-claro ring-accent-claro/25"
                      }`}
                    >
                      <Icone className="h-6 w-6" strokeWidth={1.75} />
                    </span>
                    <h3 className="mt-5 font-display text-base font-bold leading-snug">
                      {nome}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/65">
                      {texto}
                    </p>
                  </li>
                );
              })}
            </ul>

            {/* ⚠️ AS TRÊS TELAS DE CELULAR SAÍRAM DAQUI no mesmo dia em que
                entraram (14/09/2026), e não por arrependimento: a cena da mesa
                logo acima passou a fazer o trabalho delas, melhor. Elas
                mostravam Painel, Cartões e Projeção em três prints pequenos;
                a cena mostra a Projeção em tamanho de leitura, dentro de um
                contexto que diz "isto é um produto de verdade" sem precisar de
                legenda.

                Duas fileiras de captura na mesma seção, uma embaixo da outra,
                é o acúmulo que a página acabou de perder ao encolher de 11
                seções para 5. As telas continuam inteiras na /fincash, que é
                onde alguém vai para ver o app por dentro. */}

            {/* ⚠️ O VÍDEO `BannerDemo` SAIU DAQUI EM 14/09/2026, e não por
                enxugamento: o arquivo está DESATUALIZADO em dois níveis.

                `public/demo/app-em-uso.mp4` é de 02/09 — onze dias antes da
                renomeação. Nos quadros gravados o cabeçalho do app ainda diz
                "Planejamento Financeiro", o nome que deixou de existir em
                13/09. E ele grava o FINPLAN, não o FINCASH: numa página cuja
                headline é "Assine o FINCASH", o único vídeo mostrava o outro
                produto, com o nome velho.

                ⚠️ NÃO BASTA TROCAR A LEGENDA — o nome errado está DENTRO dos
                pixels. Devolver o vídeo exige regravar com a conta de
                demonstração (há molde em `scripts/gravar-demo.mjs`). Enquanto
                isso, o produto aparece aqui em captura: o painel no herói e as
                três telas logo acima, todas do FINCASH e todas atuais. */}

            {/* ⚠️ A PONTE PARA A /fincash, E ELA SÓ EXISTE NUM SENTIDO DE
                PROPÓSITO.

                Antes desta troca de âncora não havia ligação nenhuma daqui
                para lá: a /fincash apontava para cá ("Ver tudo o que vem
                junto") e esta página não citava o FINCASH uma única vez — o
                produto que passou a dar nome à assinatura era o único que não
                aparecia na página que a vende.

                A ponte é um LINK DE TEXTO, e não um segundo botão, porque a
                divisão de trabalho entre as duas páginas é o que impede a
                venda de existir duplicada em dois lugares que depois divergem:
                a /fincash aprofunda o APP (telas, funções, o mês por dentro);
                a /assinar vende o PACOTE. Quem já está aqui não precisa voltar
                um passo para comprar — precisa poder conferir o app antes, se
                quiser. Um botão de peso igual ao de assinar mandaria a pessoa
                para fora da página de venda no meio da dobra que mais
                converte. */}
            {/* ⚠️ Cores de fundo claro trocadas pelas do escuro junto com a
                seção: `text-muted-foreground` e `accent-strong` são do tema
                claro e ficam ilegíveis sobre navy. O `accent-claro` é o par
                correto — é o que o resto da página usa nos blocos escuros. */}
            <p className="cine mt-10 text-center text-sm text-white/60">
              Quer ver o FINCASH por dentro antes?{" "}
              <Link
                href="/fincash"
                className="font-semibold text-accent-claro underline-offset-4 hover:underline"
              >
                Conheça o app do seu mês
                <ArrowRight className="ml-1 inline h-3.5 w-3.5 align-[-0.15em]" />
              </Link>
            </p>

            {/* A BARRA QUE FECHA O BLOCO — preço à esquerda, botão à direita,
                como na referência. Ela absorveu a faixa de CTA que era uma
                seção solta logo abaixo: o argumento ("tudo isso por X") e a
                ação pertencem ao mesmo bloco que acabou de listar o "tudo
                isso".

                ⚠️ O PREÇO SAI DE `assinatura.ts`, nunca digitado — é a regra
                da casa inteira, e aqui ela vale duas vezes: esta é a página do
                caixa, e um valor diferente do cartão de preço logo abaixo
                seria a casa cobrando dois preços na mesma rolagem. */}
            <div className="cine mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-5 rounded-2xl border border-white/10 bg-white/[0.05] px-6 py-6 sm:justify-between sm:px-8">
              <p className="text-sm leading-relaxed text-white/70">
                Tudo isso por{" "}
                <span className="font-bold text-white">
                  {ASSINATURA_PRECO_ANUAL_MENSAL_ROTULO}/mês
                </span>{" "}
                no plano anual, com {ASSINATURA_GARANTIA}.
              </p>
              <BotaoAssinarPlano
                contexto="workspace"
                direto
                rotulo={`Assinar o ${ASSINATURA_NOME}`}
              />
            </div>
          </div>
        </section>

        {/* ⚠️ A SEÇÃO "EXCLUSIVAS DE QUEM ASSINA" FOI REMOVIDA EM 14/09/2026,
            e não por escolha de layout: ela tinha ficado VAZIA.

            Ela listava `APPS.filter(plano === "pago" && href inclui
            /ferramentas/)` — as oito ferramentas pagas que saíram do catálogo
            em 13/09 por duplicarem o FINCASH. Com o filtro devolvendo zero, a
            página publicou um título dizendo "0 ferramentas que só abrem com
            a assinatura" sobre uma grade sem nenhum card.

            ⚠️ E ISSO PASSOU POR QUATRO CONFERÊNCIAS, inclusive uma minha que
            varreu a produção atrás do literal "0 ferramentas". O motivo é uma
            armadilha que vale guardar: `{EXCLUSIVAS.length} ferramentas` sai
            no HTML do servidor como `0<!-- --> ferramentas` — o React separa
            valor interpolado de texto adjacente com um comentário. Buscar a
            frase inteira no HTML NUNCA acha. Só apareceu lendo o
            `textContent` do DOM com Playwright.

            Se um dia voltar ferramenta que só assinante abre, a seção volta
            com ela — o `git log` deste arquivo tem o desenho pronto. */}

        {/* ⚠️ A FAIXA DE CTA QUE MORAVA AQUI VIROU A BARRA DENTRO DA SEÇÃO
            ACIMA. Ela era uma `<section>` solta entre dois blocos, e o motivo
            de existir (encurtar os 2.853px que separavam um botão do próximo)
            continua valendo — só que agora ela fecha o bloco do pacote em vez
            de flutuar entre dois, que é o desenho da referência que o dono
            trouxe: cena, cards e, no pé, a barra com o preço e o botão. */}

        {/* ⚠️ A SEÇÃO "COM QUEM VOCÊ ESTÁ FALANDO" (4 pilares de confiança)
            saiu na mesma passagem, e pelo mesmo motivo: a prova de quem é a
            casa mora na /fincash, na seção dos sócios, com foto e a parceria
            atribuída. Aqui a confiança continua presente onde ela pesa numa
            página de pagamento — a faixa do herói, com a Nord e os selos. */}

        {/* ===================================================== 7. A OFERTA */}
        <section className="relative overflow-hidden text-white" style={PALCO}>
          {/* A mesma cena holográfica do topo fecha a página: quem rolou até
              aqui volta ao ambiente da promessa na hora de decidir. */}
          <FundoCena
            src="/cenas/cena-holo.webp"
            opacidade={0.6}
            posicao="center 40%"
            espelhada
          />

          <div className="relative mx-auto max-w-3xl px-5 py-16 sm:py-20">
            <div className="cine text-center">
              <p className="text-2xs font-semibold uppercase tracking-[0.18em] text-accent-claro">
                Dois prazos, um produto só, sem letra miúda
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold leading-[1.1] tracking-tight sm:text-[2.6rem]">
                Escolha como prefere pagar
              </h2>
            </div>

            {/* A caixa da oferta: tudo o que entra, o preço e o botão no mesmo
                retângulo. Quem rolou até aqui não deve precisar procurar. */}
            <div className="cine borda-viva mt-10 rounded-3xl border border-white/15 bg-white/[0.07] p-6 backdrop-blur-sm sm:p-9">
              <p className="text-center text-2xs font-semibold uppercase tracking-wider text-white/55">
                {ASSINATURA_NOME}
              </p>

              {/* Os dois planos lado a lado, com o anual em destaque.

                  O número grande dos DOIS é um "por mês" — é a única
                  comparação que a pessoa faz sozinha. Mostrar R$ 238,80 no
                  lugar do número grande do anual faria o plano mais barato
                  parecer sete vezes o outro, e é assim que uma página honesta
                  vende menos por acidente. O total anual está logo abaixo,
                  inteiro: esconder a cobrança de uma vez seria a pegadinha
                  que esta casa não pratica. */}
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {ASSINATURA_PLANOS.map((p) => (
                  <div
                    key={p.chave}
                    className={`rounded-2xl border p-5 text-center ${
                      p.destaque
                        ? "border-accent-claro/60 bg-white/[0.12]"
                        : "border-white/15 bg-white/[0.04]"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <p className="text-2xs font-semibold uppercase tracking-wider text-white/60">
                        {p.nome}
                      </p>
                      {p.selo && (
                        <span className="rounded-md bg-accent-btn px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-wide text-white">
                          {p.selo}
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex items-end justify-center gap-1.5">
                      {/* Sem `.preco-lustro` aqui, e é correção de bug, não
                          gosto: o gradiente daquela classe pinta o texto com
                          `--color-primary` (o navy da marca) e só passa o
                          laranja por cima durante a varredura. Sobre o palco
                          escuro, o preço ficava navy sobre navy na maior
                          parte do ciclo — invisível justamente no número que
                          a página inteira existe para mostrar. Branco sólido
                          resolve sem tocar no CSS global. */}
                      <span className="font-display text-[2.75rem] font-extrabold leading-none tabular-nums text-white sm:text-5xl">
                        {p.valorRotulo}
                      </span>
                      <span className="pb-1.5 text-base font-semibold text-white/60">
                        {p.periodo}
                      </span>
                    </div>

                    <p className="mt-2 text-xs leading-relaxed text-white/60">
                      {p.detalhe}
                    </p>

                    <div className="mt-4">
                      <BotaoAssinarPlano
                        contexto="workspace"
                        direto
                        plano={p.chave}
                        variante={p.destaque ? "principal" : "clara"}
                        rotulo={`Assinar ${p.nome.toLowerCase()}`}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <p className="mt-4 text-center text-sm text-white/60">
                No anual sai por {porDia} por dia — menos que um café.
              </p>

              <ul className="mx-auto mt-8 grid max-w-xl gap-2.5 border-t border-white/15 pt-7 sm:grid-cols-2">
                {INCLUI.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-sm text-white/85"
                  >
                    {/* Ciano, não laranja: o laranja é reservado à ação. */}
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-ciano-claro" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <p className="mt-8 text-center text-xs text-white/55">
                {ASSINATURA_GARANTIA} · cancele quando quiser · pagamento pela
                Hotmart
              </p>
            </div>

            {/* ======================================== 8. A GARANTIA (selo) */}
            <div className="revelar mt-8 flex flex-col items-center gap-4 rounded-3xl border border-ciano/25 bg-ciano/10 p-6 text-center sm:flex-row sm:text-left">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-ciano-claro/50 bg-ciano/15">
                <ShieldCheck className="h-7 w-7 text-ciano-claro" strokeWidth={1.75} />
              </span>
              <div>
                <p className="font-display text-lg font-bold text-white">
                  Risco zero: {ASSINATURA_GARANTIA}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-white/70">
                  {ASSINATURA_GARANTIA_FRASE} Quem devolve é a própria Hotmart,
                  automaticamente, sem passar por ninguém da Novare. Depois dos{" "}
                  {ASSINATURA_GARANTIA_DIAS} dias você continua podendo
                  cancelar quando quiser: a cobrança para na hora, sem multa.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= 9. FAQ

            Layout dividido: as perguntas de um lado, a saída para quem ainda
            tem dúvida do outro. Quem chegou até aqui e não clicou geralmente
            não quer ler mais uma resposta, quer falar com alguém. */}
        <section className="bg-background">
          <div className="mx-auto grid max-w-6xl items-start gap-10 px-5 py-16 sm:py-20 lg:grid-cols-[1.25fr_0.75fr]">
            <div className="min-w-0">
            <OQueSignifica
              titulo="O que você deve estar se perguntando"
              itens={[
                {
                  pergunta: "E se eu não gostar? Qual a pegadinha?",
                  resposta: `Não tem. Você tem ${ASSINATURA_GARANTIA_DIAS} dias para usar tudo e pedir o dinheiro de volta — a devolução é automática, feita pela Hotmart, e não perguntamos o motivo. No mensal são ${ASSINATURA_PRECO_ROTULO} por mês; no anual, ${ASSINATURA_PRECO_ANUAL_MENSAL_ROTULO} por mês (cobrados de uma vez), o que economiza ${ASSINATURA_ANUAL_ECONOMIA_ROTULO} no ano.`,
                },
                {
                  pergunta: "A Íris vê a senha do meu banco?",
                  resposta:
                    "Não. Nada aqui se conecta ao seu banco: você copia o extrato e cola no app, e ele é lido no seu próprio navegador. Sem senha, sem acesso à sua conta.",
                },
                {
                  pergunta: "Preciso entender de investimento?",
                  resposta:
                    "Não. O app pergunta em português simples quanto entra e quanto sai, e faz as contas por você. Foi feito justamente para quem odeia planilha.",
                },
                {
                  pergunta: "Vocês vão tentar me vender produto de banco?",
                  resposta:
                    "Nunca. A Novare não recebe comissão de banco, corretora ou seguradora. É você quem paga, então é para você que a gente trabalha. É o que nos permite dizer “não compre” quando é o caso.",
                },
                {
                  pergunta: "E se eu cancelar? Perco tudo?",
                  resposta:
                    "A cobrança para na hora, sem multa. As calculadoras continuam abertas para você, e os dados do seu planejamento ficam guardados na sua conta. Se voltar, está tudo lá.",
                },
              ]}
            />
            </div>

            {/* A coluna da dúvida. O "FAQ" gigante atrás é marca d'água:
                aria-hidden porque a seção já se nomeia no título ao lado. */}
            <aside className="cine relative lg:sticky lg:top-8">
              <span
                aria-hidden
                className="pointer-events-none absolute -top-8 left-0 select-none font-display text-[7rem] font-extrabold leading-none tracking-tighter text-primary/[0.06] lg:text-[9rem]"
              >
                FAQ
              </span>

              <div className="relative pt-10">
                <h2 className="font-display text-2xl font-bold leading-tight tracking-tight text-primary sm:text-3xl">
                  Ainda ficou com
                  <br />
                  alguma dúvida?
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  Chame no WhatsApp. Do outro lado tem gente da Novare, não
                  robô de atendimento.
                </p>

                <a
                  href={falarNoWhatsApp(
                    `Olá! Tenho dúvidas sobre o ${ASSINATURA_NOME} antes de assinar.`,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group mt-6 inline-flex items-center gap-2 rounded-xl bg-success-strong px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-success"
                >
                  <MessageCircle className="h-4 w-4" />
                  Chamar no WhatsApp
                </a>
              </div>
            </aside>
          </div>
        </section>

        {/* =================================================== 10. O FECHO

            Fecho em cena: a arte do "caminho até o pôr do sol" entra como
            fundo em parallax, com vinheta e camada escura fixa por cima. O
            texto não depende da foto para ter contraste. */}
        {/* A arte que estava aqui (`cards/card-projeto-vida.webp`) tem
            placas com texto inventado por IA — "Urisdoams planoking" e
            companhia. Legível a olho nu, e nada custa
            mais caro numa página de venda do que parecer falsa. Trocada por
            uma cena limpa, sem nenhuma letra. */}
        <CenaFoto
          src="/cenas/cena-fecho.webp"
          intensidade={70}
          className="border-t border-primary/20"
        >
          <div className="mx-auto max-w-2xl px-5 py-20 text-center sm:py-28">
            <h2 className="cine font-display text-3xl font-semibold leading-[1.1] tracking-tight text-white sm:text-[2.6rem]">
              Seu dinheiro já está indo embora.
              <br />
              <span className="text-accent-claro">
                Descobrir para onde leva 10 minutos.
              </span>
            </h2>

            <div className="revelar mt-9 flex flex-col items-center gap-4">
              <BotaoAssinarPlano
                contexto="workspace"
                tamanho="grande"
                destaque
                direto
                rotulo={`Assinar o ${ASSINATURA_NOME}`}
              />
              <p className="text-2xs text-white/60">
                {ASSINATURA_GARANTIA} · cancele quando quiser
              </p>
              <a
                href={falarNoWhatsApp(
                  `Olá! Tenho dúvidas sobre o ${ASSINATURA_NOME} antes de assinar.`,
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-white/70 underline-offset-4 hover:text-white hover:underline"
              >
                Prefiro tirar uma dúvida no WhatsApp
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </CenaFoto>
      </main>

      {/* Espaço para a barra fixa não tapar o rodapé no celular. */}
      <div aria-hidden className="h-20 lg:hidden" />

      <RodapeNovare convite={false} aviso="servico" />
    </div>
  );
}
