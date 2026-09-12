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
import { BannerDemo } from "@/components/BannerDemo";
import { CenaFoto } from "@/components/CenaFoto";
import { Icone3D } from "@/components/Icone3D";
import { EcossistemaConectado } from "@/components/EcossistemaConectado";
import { RevelarAoRolar } from "@/components/RevelarAoRolar";
import { Chapeu, Etapa, Pilar, tomPor } from "@/components/SecoesVenda";
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
import { APPS, CONTAGEM } from "@/lib/apps";
import { iconeDe } from "@/lib/icones";
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

/** O antes e o depois, frase contra frase. */
const VIRADA = [
  {
    antes: "Você olha o extrato e não entende para onde foi.",
    depois: "A Íris lê o extrato e aponta cada tarifa, juro e assinatura.",
  },
  {
    antes: "Seus objetivos são um desejo vago, sem prazo.",
    depois: "Cada objetivo vira um valor por mês e uma data.",
  },
  {
    antes: "Fechar o mês é uma planilha que você abandona.",
    depois: "O app fecha o mês e mostra sua evolução sozinho.",
  },
  {
    antes: "Quem te orienta ganha comissão do que te vende.",
    depois: "Consultoria com condição de assinante e comissão zero.",
  },
];

/** O caminho, em quatro passos curtos: o medo real é o do trabalho.
 *
 * ⚠️ A ESCADA COMEÇA PELO FINCASH, e antes começava pelo Planejamento
 * ("Responda 8 perguntas" → "Receba seu plano"). Não é ordem estética: era a
 * escada da âncora velha, e ela pedia dez minutos de formulário antes de
 * devolver a primeira resposta. Com o FINCASH na frente, o primeiro retorno é
 * o número que a pessoa veio buscar — quanto ainda dá para gastar —, e o
 * plano de dez anos aparece depois, quando ela já tem motivo para voltar.
 *
 * O Planejamento não sumiu da venda: ele está no pacote, na lista da caixa de
 * oferta e na seção do ecossistema. O que ele perdeu foi o lugar de PRIMEIRO
 * ESFORÇO exigido de quem acabou de pagar.
 */
const PASSOS = [
  {
    icone: CreditCard,
    titulo: "Assine em 1 minuto",
    texto: `Pagamento pela Hotmart e ${ASSINATURA_GARANTIA_DIAS} dias para desistir e ser devolvido.`,
  },
  {
    icone: Wallet,
    titulo: "Lance o mês no FINCASH",
    texto:
      "Contas fixas e cartões entram uma vez só. O mês seguinte já abre preenchido.",
  },
  {
    icone: Target,
    titulo: "Veja quanto ainda sobra",
    texto:
      "O painel conta o que ainda vai sair até o dia 30, não só o que já saiu.",
  },
  {
    icone: Bot,
    titulo: "Cole seu extrato na Íris",
    texto: "Ela mostra as tarifas, juros e assinaturas que somem com seu dinheiro.",
  },
];

/** O pacote, item a item. Os emblemas 3D vinham do app e estavam parados em
    /public/icones-3d: arte já produzida, com acabamento que ícone de traço
    não dá. `wrench-3d` e `users-3d` nunca tinham sido usados. */
const PACOTE = [
  {
    /* Primeiro do pacote porque é o único item que não é software. Os três
       de baixo um chatbot imita; este exige uma consultoria registrada do
       outro lado. */
    emblema: "/icones-3d/parecer-3d.png",
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
    emblema: "/icones-3d/dashboard-3d.png",
    nome: "O FINCASH inteiro",
    texto:
      "Contas, lançamentos, cartões, dívidas e metas num lugar só — e no topo o número que muda comportamento: quanto ainda dá para gastar até o fim do mês.",
  },
  {
    emblema: "/icones-3d/icon-vault-3d.png",
    nome: "Planejamento Financeiro completo",
    texto:
      "Diagnóstico, nota de saúde financeira, plano de ação com valor e prazo, e relatório em PDF que é seu.",
  },
  {
    emblema: "/icones-3d/icon-perfil.png",
    nome: "Íris, a IA que lê seu extrato",
    texto:
      "Cole o extrato do banco e ela acha assinatura esquecida, tarifa repetida e juro escondido.",
  },
  {
    emblema: "/icones-3d/wrench-3d.png",
    nome: "Todas as ferramentas liberadas",
    texto:
      `As ${CONTAGEM.calculadoras} calculadoras e simuladores da casa, das trabalhistas às de investimento.`,
  },
  {
    emblema: "/icones-3d/users-3d.png",
    nome: ROTULO_DESCONTO_ASSINANTE + " na consultoria particular",
    texto:
      "Consultor de verdade do outro lado, sem comissão de banco. Válido enquanto a assinatura estiver ativa.",
  },
];

/** Por que confiar. SÓ o que a casa comprova. */
const CONFIANCA = [
  {
    destaque: "Nord",
    titulo: "Parceria com a Nord Research",
    texto:
      "A consultoria de investimentos une o método da Novare à análise independente da Nord.",
  },
  {
    // Aqui havia "CFP®, consultores certificados" — e a casa ainda não tem a
    // certificação. Num bloco cujo próprio título é "só o que a casa
    // comprova", alegar credencial que não se tem é o tipo de detalhe que
    // derruba a confiança inteira quando alguém confere.
    destaque: "Consultor",
    titulo: "Gente estuda o seu caso",
    texto:
      "Do outro lado da mesa tem uma pessoa lendo os seus números, não um robô devolvendo média de mercado.",
  },
  {
    destaque: "0%",
    titulo: "Nenhuma comissão",
    texto:
      "A Novare não recebe de banco, corretora ou seguradora. É você quem paga, então é para você que a gente trabalha.",
  },
  {
    destaque: "LGPD",
    titulo: "Seu extrato não sai do navegador",
    texto:
      "Nada aqui se conecta à sua conta. Você cola o extrato e a leitura acontece no seu dispositivo.",
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
  "Planejamento Financeiro completo",
  /* ⚠️ "SEM LIMITE", e não "a IA que lê seu extrato": a Íris é ABERTA a
     qualquer um, com teto de leituras (ver `plano` dela em `apps.ts`). Numa
     lista do que a assinatura entrega, o nome sozinho vende o que a pessoa já
     tem de graça — e a conta chega no dia em que ela descobre. O que se compra
     aqui é o teto saindo, que é o que `ASSINATURA_INCLUI` também diz. */
  "Íris sem limite: leia quantos extratos quiser",
  `${CONTAGEM.exclusivasAssinante} ferramentas exclusivas de assinante`,
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
const EXCLUSIVAS = APPS.filter(
  (a) =>
    a.familia &&
    a.status !== "em-breve" &&
    a.plano === "pago" &&
    a.href.includes("/ferramentas/"),
);

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
              Planejamento, IA e ferramentas vêm junto
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
              junto: a Íris sem limite de leituras, o Planejamento Financeiro,{" "}
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
                  {/* A home oficial de verdade, não um mockup — captura real
                      da tela em produção, tratada em upscale (Magnific) para
                      ficar nítida na moldura grande. */}
                  <Image
                    src="/demo/poster-home-oficial.jpg"
                    alt="A home do Novare Workspace, com o ecossistema de ferramentas, IA e consultoria"
                    width={2280}
                    height={1283}
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

        {/* ========================================================= 2. A DOR */}
        <section className="bg-background">
          <div className="mx-auto max-w-4xl px-5 py-16 text-center sm:py-20">
            <p className="cine text-2xs font-semibold uppercase tracking-[0.18em] text-accent-strong">
              Se você se reconhecer aqui
            </p>
            <h2 className="cine mx-auto mt-3 max-w-3xl font-display text-3xl font-semibold leading-[1.1] tracking-tight text-primary sm:text-[2.8rem]">
              O problema quase nunca é o quanto você ganha.{" "}
              <span className="text-accent-strong">É não enxergar.</span>
            </h2>
            <p className="cine mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
              <span className="font-semibold text-foreground">
                Ninguém organiza o que não consegue ver.
              </span>{" "}
              É por isso que a planilha morre no segundo mês: ela cobra trabalho
              e não devolve resposta.
            </p>

            <ul className="revelar-escada mt-10 grid gap-3 text-left sm:grid-cols-2">
              {SINTOMAS.map(({ icone: Icone, texto }) => (
                <li
                  key={texto}
                  className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-subtle"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-tint text-accent-strong">
                    <Icone className="h-4 w-4" strokeWidth={1.75} />
                  </span>
                  <p className="text-sm leading-relaxed text-foreground">{texto}</p>
                </li>
              ))}
            </ul>

            {/* Fecha o último vão acima de duas telas. Quem se reconheceu na
                lista acima é exatamente quem quer sair dela. */}
            <div className="cine mt-9 flex justify-center">
              <BotaoAssinarPlano
                contexto="workspace"
                direto
                rotulo={`Assinar o ${ASSINATURA_NOME}`}
              />
            </div>
          </div>
        </section>

        {/* ===================================================== 3. A VIRADA */}
        <section className="relative overflow-hidden text-white" style={NAVY}>
          <FundoCena src="/cenas/cena-luz.webp" opacidade={0.6} />

          <div className="relative mx-auto max-w-4xl px-5 py-16 sm:py-20">
            <div className="cine text-center">
              <h2 className="font-display text-3xl font-semibold leading-[1.1] tracking-tight sm:text-[2.6rem]">
                De onde você está para onde dá para chegar
              </h2>
            </div>

            <ul className="revelar-escada mt-10 space-y-3">
              {VIRADA.map(({ antes, depois }) => (
                <li
                  key={antes}
                  className="grid items-stretch gap-3 sm:grid-cols-2"
                >
                  <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <X className="mt-0.5 h-4 w-4 shrink-0 text-white/35" />
                    <p className="text-sm leading-relaxed text-white/55 line-through decoration-white/25">
                      {antes}
                    </p>
                  </div>
                  <div className="flex items-start gap-3 rounded-2xl border border-ciano/25 bg-ciano/10 p-4">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-ciano-claro" />
                    <p className="text-sm font-medium leading-relaxed text-white">
                      {depois}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="revelar mt-10 flex justify-center">
              <BotaoAssinarPlano
                contexto="workspace"
                variante="clara"
                direto
                rotulo={`Assinar o ${ASSINATURA_NOME}`}
              />
            </div>
          </div>
        </section>

        {/* =============================================== 4. COMO FUNCIONA */}
        <section id="como-funciona" className="scroll-mt-16 bg-gelo">
          <div className="mx-auto max-w-5xl px-5 py-16 sm:py-20">
            <div className="cine text-center">
              <p className="text-2xs font-semibold uppercase tracking-[0.18em] text-accent-strong">
                Do zero ao mês sob controle
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold leading-[1.1] tracking-tight text-primary sm:text-[2.6rem]">
                Quatro passos, menos de 15 minutos
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
                Sem instalar nada, sem conectar seu banco e sem precisar
                entender de investimento.
              </p>
            </div>

            <ol className="revelar-escada mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {PASSOS.map(({ icone, titulo, texto }, i) => (
                <Etapa
                  key={titulo}
                  numero={i + 1}
                  total={PASSOS.length}
                  titulo={titulo}
                  texto={texto}
                  icone={icone}
                />
              ))}
            </ol>
          </div>
        </section>

        {/* ======================================== 4B. O ECOSSISTEMA, DESENHADO

            A página afirmava "hub" o tempo todo sem nunca mostrar o que isso
            quer dizer. Layout dividido: o argumento à esquerda, o desenho à
            direita, como o diagrama de produto que serviu de referência. */}
        <section className="relative overflow-hidden text-white" style={NAVY}>
          <FundoCena src="/cenas/cena-luz.webp" opacidade={0.55} espelhada />

          <div className="relative mx-auto grid max-w-5xl items-center gap-10 px-5 py-16 sm:py-20 lg:grid-cols-2">
            <div className="cine">
              <h2 className="font-display text-3xl font-semibold leading-[1.1] tracking-tight sm:text-[2.6rem]">
                Uma só superfície para
                <br />
                <span className="text-accent-claro">a sua vida financeira.</span>
              </h2>
              <p className="mt-5 max-w-md text-base leading-relaxed text-white/70">
                Plano, IA, calculadoras, consultoria e conteúdo deixam de ser
                cinco lugares diferentes.{" "}
                <span className="font-semibold text-white">
                  Tudo lê os mesmos números
                </span>
                , então o que você responde uma vez vale em todos.
              </p>

              {/* Lista numerada com o trilho ligando os itens. */}
              <ol className="mt-8 space-y-4">
                {[
                  "Você preenche uma vez",
                  "Todo o Workspace entende",
                  "As decisões saem prontas",
                ].map((item, i) => (
                  <li key={item} className="relative flex items-center gap-4 pl-1">
                    <span className="font-display text-xl font-extrabold tabular-nums text-ciano-claro">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="h-2 w-2 rounded-full bg-ciano" />
                      {i < 2 && (
                        <span
                          aria-hidden
                          className="absolute left-1/2 top-2 h-8 w-px -translate-x-1/2 bg-ciano/25"
                        />
                      )}
                    </span>
                    <span className="text-sm font-medium text-white/85">{item}</span>
                  </li>
                ))}
              </ol>

              <div className="cine mt-9">
                <BotaoAssinarPlano
                  contexto="workspace"
                  variante="clara"
                  direto
                  rotulo={`Assinar o ${ASSINATURA_NOME}`}
                />
              </div>
            </div>

            <div className="cine" style={{ transitionDelay: "140ms" }}>
              <EcossistemaConectado />
            </div>
          </div>
        </section>

        {/* ============================================ 5. O QUE VOCÊ RECEBE */}
        <section className="bg-background">
          <div className="mx-auto max-w-4xl px-5 py-16 sm:py-20">
            <div className="cine text-center">
              <h2 className="font-display text-3xl font-semibold leading-[1.1] tracking-tight text-primary sm:text-[2.6rem]">
                O que você recebe hoje
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
                Tudo numa assinatura só. Nenhum recurso fica de fora, nada é
                vendido à parte.
              </p>
            </div>

            <ul className="revelar-escada mt-10 space-y-3">
              {PACOTE.map(({ emblema, nome, texto }, i) => {
                const ciano = tomPor(i) === "ciano";
                return (
                  <li
                    key={nome}
                    className="glass-card flex items-start gap-4 rounded-2xl border border-border bg-card p-5 shadow-subtle transition-all hover:-translate-y-0.5 hover:shadow-card"
                  >
                    <Icone3D
                      src={emblema}
                      tamanho={64}
                      tom={ciano ? "ciano" : "accent"}
                    />
                    <div className="min-w-0">
                      <h3 className="font-display text-lg font-bold leading-snug text-primary">
                        {nome}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {texto}
                      </p>
                    </div>
                    <Check className="ml-auto mt-1 hidden h-5 w-5 shrink-0 text-success sm:block" />
                  </li>
                );
              })}
            </ul>

            {/* O app rodando, em vídeo. O arquivo foi recortado: os 2,2s de
                tela de login que abriam a gravação saíram, e a faixa do
                aviso de cookies foi cortada do quadro. */}
            <div className="cortina mt-10 overflow-hidden rounded-3xl">
              <BannerDemo legenda="O app de verdade, sem retoque. Os números do exemplo são fictícios; os seus entram quando você criar sua conta." />
            </div>

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
            <p className="cine mt-8 text-center text-sm text-muted-foreground">
              Quer ver o FINCASH por dentro antes?{" "}
              <Link
                href="/fincash"
                className="font-semibold text-accent-strong underline-offset-4 hover:underline"
              >
                Conheça o app do seu mês
                <ArrowRight className="ml-1 inline h-3.5 w-3.5 align-[-0.15em]" />
              </Link>
            </p>
          </div>
        </section>

        {/* ===================== 5C. AS EXCLUSIVAS DE QUEM ASSINA ==== */}
        {/* Vinha logo depois do "o que você recebe", que fala do pacote em
            quatro blocos grandes. Aqui é o detalhe: o que exatamente entra
            junto, com nome. */}
        <section className="bg-gelo">
          <div className="mx-auto max-w-5xl px-5 py-16 sm:py-20">
            <div className="mx-auto max-w-2xl text-center">
              <Chapeu>Exclusivas de quem assina</Chapeu>
              <h2 className="mt-3 font-display text-3xl font-semibold leading-[1.1] tracking-tight text-primary sm:text-[2.6rem]">
                {EXCLUSIVAS.length} ferramentas que só abrem com a assinatura
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                As {CONTAGEM.ferramentas} calculadoras gratuitas resolvem uma
                conta de cada vez. Estas guardam os seus dados e conversam
                entre si: o que você lança numa aparece na outra.
              </p>
            </div>

            <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {EXCLUSIVAS.map((f, i) => {
                const Icone = iconeDe(f.slug);
                const t = tomPor(i);
                return (
                  <li
                    key={f.slug}
                    className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_hsl(215_40%_20%_/_0.03),0_8px_24px_-16px_hsl(215_40%_20%_/_0.18)]"
                  >
                    <span
                      aria-hidden
                      className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                        t === "ciano"
                          ? "bg-ciano-tint text-ciano-forte"
                          : "bg-accent-tint text-accent-strong"
                      }`}
                    >
                      <Icone className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <h3 className="mt-4 font-display text-base font-semibold text-primary">
                      {f.nome}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {f.chamada}
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* Faixa de CTA no meio do maior vão da página. Medido: eram 2853px
          (3,2 telas) entre um botão e o próximo, e quem se convence aqui não
          deveria ter de rolar duas telas para achar onde clicar. */}
      <section className="bg-background">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-x-6 gap-y-4 px-5 pb-4">
          <p className="cine text-sm text-muted-foreground">
            Tudo isso por{" "}
            <span className="font-bold text-primary">
              {ASSINATURA_PRECO_ANUAL_MENSAL_ROTULO}/mês
            </span>{" "}
            no plano anual, com {ASSINATURA_GARANTIA}.
          </p>
          <div className="cine">
            <BotaoAssinarPlano
              contexto="workspace"
              direto
              rotulo={`Assinar o ${ASSINATURA_NOME}`}
            />
          </div>
        </div>
      </section>

      {/* ================================================ 6. A AUTORIDADE */}
        <section className="bg-gelo">
          <div className="mx-auto max-w-5xl px-5 py-16 sm:py-20">
            <div className="cine text-center">
              <p className="text-2xs font-semibold uppercase tracking-[0.18em] text-accent-strong">
                Por que confiar
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold leading-[1.1] tracking-tight text-primary sm:text-[2.6rem]">
                Com quem você está falando
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
                {/* Dizia "O Workspace é a ferramenta que ela abriu": era a
                    frase que apresentava o Workspace como O produto. Ele
                    continua na frase — mas como o LUGAR onde o app mora, que é
                    o papel que ele passou a ter. */}
                A Novare é consultoria de investimentos. O FINCASH é a
                ferramenta que ela abriu para todo mundo, dentro do Workspace
                onde os apps da casa conversam entre si.
              </p>
            </div>

            <div className="revelar-escada mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {CONFIANCA.map(({ destaque, titulo, texto }, i) => (
                <Pilar
                  key={titulo}
                  destaque={destaque}
                  titulo={titulo}
                  texto={texto}
                  tom={tomPor(i)}
                />
              ))}
            </div>

            {/* A foto dos sócios finalmente cabe aqui.
            
                O arquivo era uma miniatura de vídeo de 236x235 px com o botão
                de play gravado em cima — e por isso esta seção vinha sem foto
                nenhuma: borrada, ela tirava a credibilidade que deveria dar.
                Agora está em 944 px, ampliada por upscaler de PRECISÃO (o
                modo criativo inventa feições, e são rostos de pessoas reais)
                e com o play retocado fora.
            
                O arquivo tem NOME NOVO de propósito: o otimizador de imagem
                do Next indexa o cache pelo caminho, então sobrescrever o
                original continuaria servindo a miniatura antiga por dias. */}
            <div className="cine mt-10 flex flex-col items-center gap-7 sm:flex-row sm:items-center sm:gap-9">
              <div className="relative aspect-square w-40 shrink-0 overflow-hidden rounded-3xl shadow-card ring-1 ring-primary/10 sm:w-48">
                <Image
                  src="/marca/novare-site/socios-novare-alta.jpg"
                  alt="Os sócios da Novare Consultoria de Investimentos"
                  fill
                  sizes="(max-width: 640px) 160px, 192px"
                  className="object-cover"
                />
              </div>

              <div className="text-center sm:text-left">
                <h3 className="font-display text-xl font-bold leading-snug text-primary sm:text-2xl">
                  Tem gente de verdade atrás disso.
                </h3>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
                  A Novare não é um app que apareceu do nada. É uma consultoria
                  de investimentos que resolveu abrir as próprias ferramentas
                  para quem não tem patrimônio para contratar uma.
                </p>
              </div>
            </div>

            {/* O modelo de negócio como argumento: é o que separa a Novare
                de quem ganha comissão pelo que indica. */}
            <div className="revelar mt-10 grid overflow-hidden rounded-3xl border border-border sm:grid-cols-2">
              <div className="bg-card p-6 sm:p-7">
                <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                  O banco
                </p>
                <p className="mt-2 font-display text-lg font-semibold leading-snug text-foreground">
                  Ganha quando você paga tarifa e compra o que ele indica.
                </p>
              </div>
              <div className="bg-primary p-6 text-white sm:p-7">
                <p className="text-2xs font-semibold uppercase tracking-wider text-ciano-claro">
                  A Novare
                </p>
                <p className="mt-2 font-display text-lg font-semibold leading-snug">
                  Ganha quando você se organiza. Comissão de banco ou corretora:
                  zero.
                </p>
              </div>
            </div>
          </div>
        </section>

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
