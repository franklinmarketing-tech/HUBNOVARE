import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  CalendarClock,
  Camera,
  Check,
  ChevronDown,
  FileUp,
  Gauge,
  Gift,
  Layers,
  ListPlus,
  Lock,
  MapPin,
  MessageCircle,
  Mic,
  PenLine,
  PiggyBank,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Tags,
  TrendingDown,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Foto } from "./Molduras";
import { Pessoa } from "./Pessoas";
import Vitrine from "./Vitrine";
/**
 * ⚠️ ESTE `Comparativo` NÃO É O DE `@/components/SecoesVenda`, e os dois não
 * podem conviver no mesmo arquivo — mesmo nome, erro de compilação. A troca
 * foi por SUBSTITUIÇÃO: o daqui compara TRÊS colunas (app do banco, planilha,
 * FINCASH) e o de lá compara duas, juntando banco e planilha numa coluna só.
 * Juntos eles se anulam, porque cada linha da tabela só podia dizer a verdade
 * sobre um dos dois.
 *
 * O de `SecoesVenda` continua exportado e não foi tocado: ele é a peça
 * compartilhada das outras landings da casa, e reescrevê-lo para três colunas
 * mudaria a /planejamento e a /assinar sem ninguém pedir.
 */
import Calculo from "./Calculo";
import Comparativo from "./Comparativo";
import ParaQuem from "./ParaQuem";
import AntesDepois from "./AntesDepois";
import Pacote from "./Pacote";
/**
 * ⚠️ `ParaOndeFoiOMes` ENTROU NO LUGAR DE `OrcamentoPorCategoria`, e as duas
 * NÃO podem conviver: leem a mesma `SETEMBRO` e desenham o mesmo dinheiro.
 * Dois anéis iguais a uma rolagem de distância não somam informação — mandam
 * o leitor procurar a diferença entre eles, e não há nenhuma. A que ficou é a
 * que nomeia a fatia dominante DENTRO do desenho ("Moradia, R$ 2.883, 43%"),
 * em vez de mandar o olho ir e voltar dez vezes entre o anel e a legenda.
 * O porquê por extenso está no comentário dela, em `Graficos.tsx`.
 */
import {
  DividaAteZerar,
  MedidorRenda,
  ParaOndeFoiOMes,
  ProjecaoDozeMeses,
} from "./Graficos";
import { Cabecalho } from "@/components/Cabecalho";
import { RodapeNovare } from "@/components/RodapeNovare";
import { OQueSignifica } from "@/components/OQueSignifica";
import { Chapeu, Etapa, TituloSecao } from "@/components/SecoesVenda";
import {
  ASSINATURA_ANUAL_DESCONTO_ROTULO,
  ASSINATURA_ANUAL_ECONOMIA_MESES_ROTULO,
  ASSINATURA_ANUAL_ECONOMIA_ROTULO,
  ASSINATURA_ANUAL_REFERENCIA_ROTULO,
  ASSINATURA_GARANTIA,
  ASSINATURA_GARANTIA_DIAS,
  ASSINATURA_GARANTIA_FRASE,
  ASSINATURA_INCLUI,
  ASSINATURA_OFERTA_CURTA,
  ASSINATURA_PLANOS,
  ASSINATURA_PRECO_ANUAL_MENSAL_ROTULO,
  ASSINATURA_PRECO_ANUAL_ROTULO,
  ASSINATURA_PRECO_ROTULO,
} from "@/lib/assinatura";
import { CONTAGEM } from "@/lib/apps";
import { falarNoWhatsApp } from "@/lib/contato";

/**
 * A landing do FINCASH.
 *
 * MESMA CASCA DA /planejamento, de propósito: são dois produtos da mesma
 * assinatura, e trocar de linguagem visual entre as duas páginas faria o
 * visitante achar que saiu da Novare no meio da compra.
 *
 * ⚠️ O QUE ESTA PÁGINA É OBRIGADA A DIZER: assinar o FINCASH É assinar o
 * Workspace. A casa tem uma mensalidade só, e ela libera este app, o
 * Planejamento, a Íris e as ferramentas. Se esta página vendesse "o FINCASH"
 * como produto isolado, duas páginas vizinhas prometeriam coisas diferentes
 * pelo mesmo preço, e a primeira pessoa que comparasse as duas deixaria de
 * confiar em ambas.
 *
 * O que ela NÃO promete, e a lista é curta de propósito: Open Finance (o app
 * não conecta banco nenhum, e dizer "em breve" é prometer roadmap alheio),
 * número de usuários (a Novare não tem base para citar) e depoimento DE
 * USUÁRIO DO APP (não há nenhum coletado). Onde o concorrente põe prova
 * social, aqui vai o que é verdade sobre a casa: independência e nenhuma
 * comissão.
 *
 * ⚠️ OS DEPOIMENTOS DA SEÇÃO 9 NÃO SÃO EXCEÇÃO A ISSO. São clientes da
 * CONSULTORIA, copiados do site oficial da casa, e a seção diz isso em corpo
 * de texto antes da primeira aspa. Eles provam que existe consultor de
 * verdade do outro lado, não que o app é bom. Quem for mexer ali: sem essa
 * frase, viram prova social enganosa e a página perde o argumento inteiro.
 *
 * ── O QUE MUDOU NESTA VERSÃO, e por quê ────────────────────────────────
 *
 * 1. O NOME. Era "Organizador Financeiro", que descrevia a categoria e não o
 *    produto. FINCASH é o nome, e ele aparece inteiro em maiúscula porque é
 *    assim que vive no catálogo (`lib/apps.ts`) e no menu do app.
 *
 * 2. O RÓTULO DE OBRA SAIU. A versão anterior marcava faturas, metas,
 *    investimentos e projeção como "em construção". As quatro foram
 *    construídas e estão no ar; manter o aviso seria a mentira invertida,
 *    tão cara quanto a outra. O único item que ainda tem ressalva é o
 *    assistente de WhatsApp, e ele ganhou seção própria em vez de virar
 *    uma pastilha cinza no rodapé de uma lista.
 *
 * 3. O RITMO. Eram oito seções com o mesmo esqueleto (título centrado, grade
 *    de cards) e cinco blocos de tela idênticos em sequência. Uma página que
 *    repete a mesma forma sete vezes ensina o olho a pular. Aqui cada seção
 *    tem uma FAMÍLIA de layout própria: conta aberta, tabela, trilha, mosaico
 *    de produto, conversa, linhas de declaração, oferta.
 *
 * 4. UM ACENTO SÓ. O ciano saiu da página (fitas, chapéus, linhas de
 *    exemplo). Navy é a estrutura, laranja é o acento, e ponto. Verde e âmbar
 *    sobrevivem apenas DENTRO das prévias de dado, onde a cor não decora:
 *    ela é o dado (entrou, estourou o limite, ficou negativo).
 *
 * 5. AS FOTOS DO PRODUTO. A página inteira era desenho: prévias remontadas em
 *    HTML dentro de uma moldura. Elas provavam a linguagem visual do app e não
 *    provavam o APP, porque uma remontagem honesta nunca traz a barra lateral
 *    com as quinze telas, o menu do rodapé no celular, o velocímetro de renda
 *    comprometida nem o resumo automático apontando as contas vencidas. Agora
 *    nove capturas reais entram, cada uma colada na frase que ela prova. As
 *    prévias em HTML que sobreviveram estão explicadas em `Molduras.tsx`: a
 *    conta aberta é aritmética e não tela, e a conversa do WhatsApp descreve o
 *    que ainda não foi ligado.
 *
 * 6. DÍVIDAS GANHOU SEÇÃO PRÓPRIA, com peso de argumento e não de item de
 *    lista. É o que a casa tem e o concorrente não: lá dívida é um indicador
 *    solto num painel; aqui é amortização Price e SAC, ordem de pagamento
 *    comparada entre avalanche e bola de neve, e a simulação do aporte extra.
 *
 * 7. UM SISTEMA DE RAIO SÓ: `rounded-3xl` para contêiner, `rounded-xl` para
 *    peça interna e botão, `rounded-full` para pílula. Nada de `2xl`/`lg`
 *    soltos (os que aparecem vêm de dentro de `SecoesVenda`, que é
 *    compartilhado com as outras landings e não se reescreve por aqui).
 *
 * 8. O HERÓI PASSOU A TER MARCA E A TER PRODUTO NO PLURAL. Ele abria com
 *    uma pergunta, um botão e um celular, e não dizia de quem era aquilo nem
 *    como o produto se chama: quem vinha de anúncio saía sem o nome. Entrou o
 *    lockup NOVARE | FINCASH acima do título, em escala menor que ele de
 *    propósito (a marca identifica, o título vende), e o celular único deu
 *    lugar ao leque de três telas da `<Vitrine />`. Uma captura prova que
 *    existe UMA tela; três provam que existe um app.
 *
 * 9. DEZESSETE SEÇÕES VIRARAM TREZE (ver o item 16), por fusão e nunca por corte de fato.
 *    Quatro pares diziam a mesma coisa duas vezes, e o que saiu foi sempre
 *    cabeçalho duplicado e rodeio, nunca informação:
 *      • a dor do extrato + o comparativo (o mesmo argumento, contado duas
 *        vezes: o banco só sabe do passado);
 *      • as telas de decisão + "o resto na mão" (dois blocos de recurso
 *        separados por duas seções de assunto alheio no meio);
 *      • dívidas + projeção (o mesmo motor, o futuro do dinheiro, em duas
 *        telas);
 *      • os sócios + a credibilidade (ambas respondem "por que confiar na
 *        casa", e estavam separadas pela ponte).
 *    ⚠️ NENHUMA RESSALVA FOI SUAVIZADA NA FUSÃO. A pastilha do assistente que
 *    ainda não está ligado, a linha que diz que nada responde hoje, o
 *    enquadramento dos depoimentos como clientes da CONSULTORIA e a recusa de
 *    citar número de usuários continuam palavra por palavra. Vender melhor
 *    aqui é hierarquia, ritmo e prova — nunca promessa nova.
 *
 * 10. O CTA DEIXOU DE APARECER SÓ DUAS VEZES. Entre o herói e o fecho havia
 *    onze seções sem nada para clicar: quem se convencia no meio da página
 *    tinha de rolar até o fim procurando. Entraram três faixas de `FaixaComecar`
 *    (depois da dor, depois do futuro do dinheiro e depois da prova humana),
 *    com o MESMO botão e sem nenhuma frase que não esteja provada na seção
 *    logo acima delas.
 *
 * ══ A REVISÃO DO JEFFERSON, 11/09/2026 ═══════════════════════════════════
 *
 * O Jefferson é sócio da Novare, e a tese dele numa frase: "enfatizar a venda
 * da TRANSFORMAÇÃO que ele proporciona". A página descrevia o que o produto
 * FAZ; ele quer que ela venda o que muda na vida de quem assina. As frases em
 * bloco abaixo são dele e estão na página literais, palavra por palavra —
 * quem for reescrever alguma está editando a voz da casa, não um rascunho.
 *
 * 11. A TESE SUBIU PARA O `<h1>`. "Quanto você REALMENTE pode gastar este
 *    mês?" no lugar de "quanto ainda dá para gastar até o fim do mês". A
 *    diferença é uma palavra, e é a palavra que a página inteira existe para
 *    provar: a primeira versão é uma pergunta que o extrato também acha que
 *    responde. O porquê está escrito por extenso no herói.
 *
 * 12. O PREÇO DEIXOU DE SER SEGREDO ATÉ A DÉCIMA QUARTA SEÇÃO. Ele aparecia
 *    como uma linha de 12px em cinza embaixo do botão, e inteiro lá embaixo.
 *    Agora a primeira dobra traz o plano anual, o que ele custaria pago mês a
 *    mês, a economia e a garantia — os quatro vindos de `lib/assinatura`,
 *    nenhum digitado. E a garantia passou a repetir embaixo de CADA
 *    `FaixaComecar`, que é onde a pessoa hesita.
 *
 * 13. TRÊS SEÇÕES TROCARAM MECÂNICA POR TRANSFORMAÇÃO, com as frases dele:
 *    dívidas ("saiba como sair das dívidas mais rápido", no lugar de "dívida
 *    aqui não é um número no painel"), projeção ("veja o futuro financeiro
 *    antes que ele aconteça", no lugar de "ver em setembro como o ano
 *    termina") e a seção de planos, que passou a abrir dizendo que o que se
 *    compra não é um aplicativo, é uma estrutura com acompanhamento.
 *
 * 14. A SEGURANÇA GANHOU SEÇÃO (a 11). "Sem senha bancária, sem conexão
 *    automática, sem Open Finance" era o item DO MEIO de uma lista de três
 *    declarações — o argumento que mais separa este app de todo concorrente
 *    que exige Open Finance, com peso de nota de rodapé. Ele mudou de lugar,
 *    não foi inventado: saiu de `PROVAS`, que ficou com duas linhas.
 *
 * 15. TRÊS PEÇAS NOVAS ENTRARAM, e duas velhas saíram porque elas faziam o
 *    mesmo trabalho pior. `<Calculo />` (as duas barras da mesma régua)
 *    substituiu o `ContaAberta`; `<Comparativo />` de TRÊS colunas substituiu
 *    o de duas de `SecoesVenda`; e `<ParaQuem />` substituiu a lista de três
 *    situações. As notas de cada troca estão onde as constantes antigas
 *    moravam — e nenhum fato foi perdido em nenhuma das três, só o lugar
 *    dele mudou.
 *
 * 16. TREZE SEÇÕES VIRARAM DEZESSEIS, e desta vez o total subiu. Não é
 *    contradição com o item 9: lá o que caiu foi cabeçalho duplicado, aqui o
 *    que subiu foi assunto que estava escondido dentro de outro (o "para quem
 *    é", o comparativo e a segurança). O texto CORRIDO encolheu — nove
 *    parágrafos foram cortados entre um quarto e um terço, sempre tirando
 *    rodeio e enumeração repetida, nunca fato.
 *
 * ⚠️ E NADA DISTO AUTORIZOU UMA PROMESSA NOVA. A pastilha do assistente que
 * ainda não está ligado, a linha que diz que nada responde hoje, o
 * enquadramento dos depoimentos como clientes da CONSULTORIA e a recusa de
 * citar número de usuário continuam palavra por palavra. O pedido de "provas
 * sociais (antes e depois)" foi atendido só na metade que é verdade: o antes
 * e depois VISUAL (extrato contra painel) está na `<Calculo />` e no
 * comparativo. Depoimento de usuário do app continua não existindo, porque
 * não há nenhum coletado.
 *
 * ══ A REESTRUTURAÇÃO DE 12/09/2026: DEZESSEIS SEÇÕES VIRARAM DEZ ══════════
 *
 * 17. O MOTIVO NÃO FOI TAMANHO DE ARQUIVO, FOI CONTAGEM DE CABEÇALHOS. Uma
 *    landing com dezesseis títulos de seção pede dezesseis decisões de "vale
 *    a pena continuar?" a quem rola. Cada fusão abaixo juntou seções que
 *    respondiam à MESMA pergunta do leitor, e o que saiu foi sempre cabeçalho
 *    e respiro entre elas — nunca fato, nunca ressalva, nunca número.
 *
 *      1. Herói ← herói + a faixa de quatro garantias, que era seção própria
 *         de uma linha e agora é a linha fina no pé do navy. Mesmos quatro
 *         selos, mesmas quatro frases.
 *      2. Você reconhece isto ← a dor do saldo + a `<Calculo />` + o
 *         `<ParaQuem />`. As três eram o mesmo movimento em três cabeçalhos:
 *         reconhecer, entender o porquê, ver a conta.
 *      3. Banco × Planilha × FINCASH ← intacta.
 *      4. O produto, em telas ← o painel fotografado + as telas por peso.
 *         Duas seções que abriam a mesma promessa ("é um app inteiro") e a
 *         provavam com capturas da mesma conta.
 *      5. O futuro do dinheiro ← já era uma fusão (dívida + projeção), e
 *         ganhou a `<DividaAteZerar />`.
 *      6. Direto no WhatsApp ← o assistente + a segurança. A dúvida "quanto
 *         da minha vida vocês pegam?" NASCE na seção que diz que um
 *         assistente vai ler as suas mensagens: a resposta passou a morar na
 *         pergunta em vez de uma seção depois.
 *      7. Você não está comprando um app ← a casa (sócios) + o Ciclo Novare +
 *         a ponte com o Planejamento + o `<Pacote />`. As quatro respondem
 *         "o que eu levo além do software", e estavam espalhadas da sexta à
 *         décima terceira seção.
 *      8. Antes e depois ← o `<AntesDepois />` + a metade de credibilidade
 *         que morava colada nos sócios (as duas declarações e as aspas).
 *      9. Planos e garantia ← intacta, menos a frase do Jefferson, que subiu
 *         para abrir a 7 (é o assunto dela inteiro, e lá ela abre em vez de
 *         explicar).
 *     10. Dúvidas e fecho ← FAQ + CTA final.
 *
 * 18. "AS DOZE TELAS" ERA FALSO, E A CONTA FOI REFEITA À MÃO. São QUINZE:
 *    catorze subpastas com `page.tsx` em `src/app/fincash/app/` mais o painel
 *    da raiz. A lista da FAQ esquecia três que existem e funcionam — Meus
 *    dados, a ponte com o Planejamento e a do assistente. ⚠️ A tela do
 *    WhatsApp EXISTE e está contada; o que não existe é a linha oficial da
 *    Meta, e a frase da FAQ continua dizendo as duas coisas separadamente.
 *    Subestimar o produto custa venda tanto quanto superestimá-lo.
 *
 * 19. OS SEIS ÍCONES 3D (`public/fincash/icones/`) ENTRARAM EM QUATRO
 *    SEÇÕES, e não em dez. ⚠️ O CORPO DELES É NAVY: sobre os blocos navy da
 *    página eles somem e sobra o detalhe laranja. Por isso só aparecem em
 *    fundo claro, ou dentro de um chip branco quando o fundo é navy (é o caso
 *    do `chat.webp`, no cabeçalho do assistente). E NÃO substituem os ícones
 *    de traço das listas internas: quarenta adesivos 3D transformariam a
 *    página num catálogo. Onde eles entram, eles NOMEIAM o assunto do bloco.
 */

/**
 * O navy da marca com as duas luzes do Hub, o mesmo palco da /planejamento.
 * Vive nas duas páginas porque é a moldura dos produtos pagos: o navy separa
 * "isto é o produto" de "isto é conteúdo" sem precisar escrever PRO em nada.
 */
const PALCO_NAVY: React.CSSProperties = {
  background: [
    "radial-gradient(42rem 24rem at 84% -14%, hsl(16 85% 55% / 0.32), transparent 62%)",
    "radial-gradient(34rem 22rem at 2% 106%, hsl(215 60% 40% / 0.30), transparent 60%)",
    "linear-gradient(155deg, hsl(215 50% 17%) 0%, hsl(215 55% 10%) 100%)",
  ].join(","),
};

/**
 * O MESMO NAVY, EM OUTRA ESCALA — para o cartão do plano em destaque.
 *
 * Não é um segundo tema nem uma segunda cor: são as mesmas paradas do
 * `PALCO_NAVY`, com o raio das luzes medido para uma peça de 26rem em vez de
 * um bloco de 62rem. Reaproveitar o palco aqui não daria "o mesmo fundo
 * menor": um brilho de 42rem sobre um cartão de 26rem cobre o cartão inteiro,
 * e o navy que separa o destacado do comum some dentro do próprio destaque.
 *
 * A luz vem do alto à direita, como no palco, para os dois lerem como a mesma
 * fonte de luz na mesma página.
 */
const CARTAO_NAVY: React.CSSProperties = {
  background: [
    "radial-gradient(17rem 11rem at 88% -12%, hsl(16 85% 55% / 0.34), transparent 64%)",
    "linear-gradient(155deg, hsl(215 50% 17%) 0%, hsl(215 55% 10%) 100%)",
  ].join(","),
};

/**
 * Onde a pessoa cria a conta e cai DENTRO do FINCASH.
 *
 * Não é a rota do `BotaoAssinarPlano`, que leva à trilha do Planejamento:
 * quem clicou aqui quer lançar o gasto de hoje, e receber um questionário de
 * oito blocos no lugar disso é perder a pessoa na porta. O pop-up de oferta
 * também não entra: a oferta INTEIRA já está nesta página, e nesse caso ele
 * só cobraria um clique a mais (é o mesmo motivo do modo `direto` na landing
 * /assinar).
 *
 * ⚠️ Apontava para `/organizador/app`, rota que deixou de existir na
 * renomeação. O destino errado só aparece DEPOIS do login, que é o pior
 * momento possível para um 404.
 */
const ROTA_COMECAR = "/login?modo=criar&proximo=%2Ffincash%2Fapp";

/** Os selos da faixa de credibilidade: só o que é verdade sobre a Novare. */
const SELOS: { icone: LucideIcon; texto: string }[] = [
  { icone: Lock, texto: "Nada para conectar no banco" },
  { icone: BadgeCheck, texto: "Sem comissão de corretora" },
  { icone: Gift, texto: "Uma assinatura libera tudo" },
  { icone: ShieldCheck, texto: "Cancele quando quiser" },
];

/*
 * ── ONDE FORAM PARAR `SITUACOES`, `CONTA_LINHAS` E `COMPARATIVO` ──────────
 *
 * `SITUACOES` eram três cenas de reconhecimento ("o salário evapora", "a
 * fatura é surpresa", "a planilha durou até fevereiro"). Saíram porque a
 * página passou a ter a `<ParaQuem />`, que faz o MESMO trabalho com sete
 * frases escritas pelo sócio da casa — e dez itens de reconhecimento em
 * sequência ensinam o olho a pular a segunda leva. Nenhum fato foi perdido
 * junto: a fatura que chega somada vive na seção 8 ("A fatura deixa de ser
 * surpresa"), e a planilha abandonada em fevereiro continua escrita por
 * extenso na abertura do comparativo, que é o único lugar da página que
 * explica por que a planilha falha mesmo estando certa.
 *
 * `CONTA_LINHAS` alimentava o `ContaAberta`: três linhas e um resultado,
 * 2.392 − 1.926 + 600 = 1.066. A `<Calculo />` diz a MESMA aritmética com as
 * duas barras da mesma régua, e diz melhor — o argumento vira geometria em
 * vez de virar lista. Manter as duas seria contar a tese da página duas vezes
 * na mesma rolagem. Os dois fatos que só o `ContaAberta` carregava foram
 * para onde ainda são verdade: as duas contas vencidas (R$ 533) estão no
 * cartão do painel, na seção 7, e os valores brutos do mês (R$ 7.184 que
 * entraram, R$ 4.793 que saíram) viraram a linha logo abaixo da `Calculo`.
 *
 * `COMPARATIVO` era a lista de 11 critérios do comparativo de DUAS colunas.
 * O novo `<Comparativo />` traz as próprias linhas, em três colunas, com a
 * fonte de cada uma conferida dentro dele.
 */

/**
 * O CICLO NOVARE, o método da casa, em cinco passos.
 *
 * A ORDEM É O MÉTODO. Quase todo mundo começa pelo passo 3 (registrar), e é
 * por isso que abandona: sem estruturar antes, o segundo mês pede que se
 * digite tudo de novo. E sem reservar antes de gastar, o que sobra no fim do
 * mês é o resto, que nunca é o bastante.
 *
 * ── "REORGANIZAR O CICLO", 11/09/2026: O QUE MUDOU FOI O TEXTO ───────────
 * O pedido veio sem detalhe, e a conclusão depois de olhar a seção é que a
 * ESTRUTURA está certa e não devia ser mexida: cinco passos numerados com
 * denominador (01 de 05, que diz desde o primeiro que o processo é curto e
 * tem fim), a ordem que é o próprio argumento, e a peça de fechamento que
 * transforma a escada em ciclo. Trocar isso por abas, por acordeão ou por uma
 * trilha horizontal custaria JavaScript numa página que não manda nenhum, e
 * resolveria um problema que a seção não tem.
 *
 * O que ela TINHA era volume: cinco parágrafos de três a quatro linhas, todos
 * com a mesma cadência, num bloco creme de quase mil pixels no celular — o
 * ponto exato em que a pessoa rola sem ler. Cada passo foi reescrito para
 * abrir pela AÇÃO e fechar no ganho, e o que saiu foi rodeio.
 *
 * ⚠️ O ÚNICO FATO QUE SAIU INTEIRO foi "sobra que ignora a parcela de
 * novembro é sobra falsa", do passo Registre. Não sumiu da página: é a tese
 * que a `<Calculo />` agora desenha em duas barras, quatro seções acima, e
 * repeti-la aqui em uma linha era a versão fraca do mesmo argumento.
 */
const CICLO: { icone: LucideIcon; titulo: string; texto: string }[] = [
  {
    icone: Layers,
    titulo: "Estruture",
    texto:
      "Cadastre uma vez o que se repete todo mês: as contas com o saldo de hoje, o salário, o aluguel, a escola, o streaming. O mês que vem já abre preenchido.",
  },
  {
    icone: PiggyBank,
    titulo: "Reserve",
    texto:
      "Decida antes de gastar: contas fixas, limite de cada categoria e aporte de cada meta saem na frente. E o limite não é chute — o app mostra o mínimo, a média e o máximo que você já gastou ali.",
  },
  {
    icone: ListPlus,
    titulo: "Registre",
    texto:
      "Lance no dia, não no fim do mês. Marcar a conta de luz como paga é um toque, e um parcelamento em 12x já nasce com as doze parcelas na linha do tempo.",
  },
  {
    icone: Gauge,
    titulo: "Confira",
    texto:
      "Uma vez por semana, um número só: quanto ainda dá para gastar até o fim do mês, contando o que falta sair. É o aviso que chega enquanto ainda dá para mudar de ideia, e não no dia da fatura.",
  },
  {
    icone: RefreshCw,
    titulo: "Ajuste",
    texto:
      "No fim do mês, compare o planejado com o que aconteceu: corrija o limite que não coube, corte a assinatura que ninguém usa e recomece com números que já provaram funcionar na sua vida.",
  },
];

/**
 * As telas que trabalham no bastidor.
 *
 * A lista encolheu de seis para quatro, e não porque o app diminuiu: quatro
 * das antigas (lançamentos, orçamento, metas e investimentos) agora aparecem
 * FOTOGRAFADAS mais acima, e repetir por escrito o que a imagem já mostrou é
 * cobrar duas vezes a atenção da mesma pessoa. O que sobrou aqui é o trabalho
 * que ninguém fotografa com orgulho e que decide se o segundo mês acontece:
 * o que se repete sozinho, onde o dinheiro está parado, de onde ele é
 * importado e como ele é classificado.
 */
const TELAS_LISTA: { icone: LucideIcon; nome: string; texto: string }[] = [
  {
    icone: CalendarClock,
    nome: "Contas fixas",
    texto:
      "Aluguel, escola, internet e salário cadastrados uma vez. O mês seguinte já abre preenchido, e sempre como previsto: o app não afirma que a conta foi paga sem alguém ter pagado.",
  },
  {
    icone: Banknote,
    nome: "Contas",
    texto:
      "Com o saldo inicial de cada conta, o app deixa de responder “quanto gastei” e passa a responder “quanto eu tenho”. Na captura do painel são R$ 16.106 divididos em duas contas.",
  },
  {
    icone: FileUp,
    nome: "Importar extrato",
    texto:
      "O arquivo OFX que o seu banco exporta entra aqui, e você confere linha por linha antes de gravar. O que já foi lançado uma vez não entra de novo: a deduplicação compara data, valor e identificador do banco.",
  },
  {
    icone: Tags,
    nome: "Categorias e subcategorias",
    texto:
      "Mercado é uma categoria; feira, açougue e delivery são subcategorias dela. Serve para descobrir onde o limite estoura sem transformar a lista de categorias numa lista de trinta itens.",
  },
];

/**
 * O QUE O ASSISTENTE DE WHATSAPP FAZ, item a item.
 *
 * ⚠️ TUDO AQUI ESTÁ SOB A MESMA RESSALVA, e ela não é um detalhe de rodapé: a
 * linha oficial da Meta não está ligada, então NENHUMA destas linhas responde
 * hoje, nem as mais antigas nem as mais novas. A tentação de escrever a lista
 * em dois tons ("isto já vai, isto vem depois") existe e foi recusada: dois
 * tons na mesma lista ensinam a pessoa a ler a ressalva como enfeite do item
 * fraco, e ela passa a acreditar que o resto atende. Ou a pastilha vale para a
 * lista inteira, ou ela não vale para nada.
 *
 * DE ONDE VEM CADA LINHA. As sete primeiras saem do interpretador que já
 * existe (`src/lib/fincash/whatsapp.ts`, e a mesma lista está na tela do app
 * em `whatsapp/guia.tsx`); o alerta de estouro sai de
 * `respostaDeConsultaCategoria`, que compara o total da categoria com o
 * orçamento e devolve quanto passou. Áudio e foto entram agora porque
 * deixaram de ser recusa de produto e viraram obra em andamento: a estrutura
 * de mídia já está em `whatsapp-midia.ts` e o motor está sendo escrito.
 *
 * ⚠️ E O TAMANHO DA PROMESSA DE MÍDIA É O DE UM ASSISTENTE DE GASTO, não o de
 * um leitor de documento. Áudio é você dizendo o gasto em voz alta; foto é o
 * valor do comprovante. "Lê qualquer documento" e "entende qualquer imagem"
 * são a promessa que transforma uma boa entrega em reclamação, porque a
 * primeira folha que ele não lê vira a prova de que a página mentiu.
 */
const CAPACIDADES: { icone: LucideIcon; titulo: string; exemplo: string }[] = [
  {
    icone: ListPlus,
    titulo: "Lançar um gasto escrevendo",
    exemplo: "“Uber 35”, “mercado R$ 280 ontem”, “farmácia 47,90 no nubank”",
  },
  {
    icone: Banknote,
    titulo: "Lançar o que entrou",
    exemplo: "“recebi 5000 de salário”, e ele grava como receita, não como gasto",
  },
  {
    icone: Mic,
    titulo: "Falar o gasto em vez de digitar",
    exemplo: "Um áudio dizendo o gasto, e ele registra o que você falou",
  },
  {
    icone: Camera,
    titulo: "Mandar a foto do comprovante",
    exemplo: "Ele lê o valor da foto e lança, com você confirmando antes",
  },
  {
    icone: Tags,
    titulo: "Perguntar quanto foi numa categoria",
    exemplo: "“quanto gastei com alimentação esse mês?”, e também no mês passado",
  },
  {
    icone: Wallet,
    titulo: "Consultar o saldo das contas",
    exemplo: "“saldo”, e vem cada conta separada mais o total",
  },
  {
    icone: Gauge,
    titulo: "Pedir o resumo do mês",
    exemplo: "“resumo”: entrou, saiu, sobrou e o que ainda falta pagar",
  },
  {
    icone: RefreshCw,
    titulo: "Desfazer o último lançamento",
    exemplo: "“desfazer” apaga o que ele acabou de criar, e só o que foi dele",
  },
  {
    icone: TrendingDown,
    titulo: "Ser avisado quando a categoria estoura",
    exemplo: "O aviso vem junto da confirmação do gasto que cruzou o limite",
  },
];

/**
 * O QUE ELE NÃO FAZ, e esta lista é metade do argumento.
 *
 * A seção do concorrente mais direto termina prometendo; esta termina
 * mostrando a borda. O motivo é o mesmo que vale dentro do app
 * (`whatsapp/guia.tsx` reserva uma caixa inteira para isso): num app de
 * dinheiro, o limite descoberto no mês em que a conta não fecha custa a
 * assinatura, e o limite escrito na página de venda custa nada.
 *
 * ⚠️ TRÊS DELAS SÃO RECUSA DELIBERADA DO INTERPRETADOR, não buraco: número
 * por extenso, data vaga e parcelamento ele devolve como pergunta em vez de
 * chutar. Escrever isso como defeito seria mentir ao contrário.
 */
const NAO_FAZ: { frase: string; porque: string }[] = [
  {
    frase: "“mil e duzentos”",
    porque:
      "Número por extenso ele pergunta em vez de gravar. Chutar entre 1.200 e 1.000 é o erro que ninguém revisa.",
  },
  {
    frase: "“300 em 3x”",
    porque:
      "Parcelamento se faz na tela de lançamentos, onde dá para conferir as três parcelas antes de gravar.",
  },
  {
    frase: "“na terça retrasada”",
    porque:
      "De data ele entende hoje, ontem, anteontem, “dia 12” e “12/03”. Adivinhar joga o gasto no mês errado.",
  },
];


/**
 * Por que confiar na casa, sem inventar número de usuário nem depoimento.
 *
 * Deixaram de ser três cards lado a lado e viraram três DECLARAÇÕES em linha,
 * separadas por régua. Card é para o que a pessoa compara; aqui não há o que
 * comparar, há o que afirmar, e afirmação em linha larga se lê como parágrafo
 * de contrato em vez de item de catálogo.
 */
/**
 * ⚠️ LEIA ANTES DE MEXER: ESTA GENTE NÃO USOU O FINCASH.
 *
 * São clientes da CONSULTORIA da Novare, e os depoimentos estão publicados no
 * site oficial da casa (diagnostico.novareapp.com.br/carteira-pontual). Nome
 * abreviado, profissão e estado são o que há; o texto é copiado palavra por
 * palavra e não se edita.
 *
 * O QUE ELES PROVAM, e é a única coisa que a página pode dizer que provam:
 * que existe consultor de verdade do outro lado, e que ele não empurra
 * produto. NÃO provam que o app é bom. Apresentar isso numa página de venda
 * de app sem dizer de onde vieram faria o leitor entender que são usuários do
 * produto, e a página inteira foi construída sobre não fazer isso.
 *
 * POR QUE ESTES QUATRO dos seis: são os que falam do que a página já afirma
 * duas seções acima, a independência. "Não teve produto sendo empurrado",
 * "sem vender nada", "vale por vários anos de conversa com gerente" e a
 * leitura crítica da carteira. Os outros dois falam de custo e de ajuste de
 * carteira, que é assunto de consultoria e não desta assinatura.
 */
const DEPOIMENTOS: { texto: string; nome: string; quem: string }[] = [
  {
    texto:
      "O melhor: não teve produto sendo empurrado. Foi análise honesta.",
    nome: "João P.",
    quem: "engenheiro, MG",
  },
  {
    texto:
      "A devolutiva foi um divisor. Pela primeira vez alguém sentou comigo explicando meu patrimônio inteiro, sem pressa e sem vender nada.",
    nome: "Felipe A.",
    quem: "executivo, SP",
  },
  {
    texto: "Vale por vários anos de conversa com gerente.",
    nome: "Ana B.",
    quem: "empresária, PR",
  },
  {
    texto:
      "Achei que ia receber um resumo bonito. Recebi uma leitura crítica que mudou como eu enxergava metade da minha carteira.",
    nome: "Ricardo M.",
    quem: "empresário, SP",
  },
];

/**
 * ⚠️ ERAM TRÊS, E A DO MEIO NÃO FOI APAGADA: FOI MUDADA DE LUGAR.
 *
 * "Nenhuma conta bancária conectada" morava aqui, no meio das declarações de
 * como a casa ganha dinheiro, e é o argumento de SEGURANÇA da página — o
 * único diferencial que vale contra todo concorrente que exige Open Finance.
 * Enterrado como item do meio de uma lista de três, ele tinha peso de nota de
 * rodapé. Virou bloco próprio — hoje a metade de baixo da seção 6, colada no
 * assistente de WhatsApp, que é onde a dúvida nasce —, com o fato inteiro que ele
 * carregava: sem senha do banco, sem Open Finance e, por consequência,
 * funcionando com qualquer banco brasileiro.
 *
 * O que sobra aqui é o que a seção realmente responde, que é como a casa se
 * paga: nenhuma comissão, e uma mensalidade só.
 */
const PROVAS: { destaque: string; titulo: string; texto: string }[] = [
  {
    destaque: "Zero",
    titulo: "comissão de banco ou corretora",
    texto:
      "A Novare é consultoria independente: não vende produto de banco e não recebe nada por onde o seu dinheiro é alocado. A única receita nessa relação é a sua assinatura, à vista de todos.",
  },
  {
    destaque: "Uma",
    titulo: "mensalidade para a casa inteira",
    texto:
      "Não há versão básica nem versão turbinada. Quem assina leva este app, o Planejamento Financeiro, a Íris e todas as calculadoras, pelo mesmo valor, do primeiro dia ao último.",
  },
];

/**
 * AS TRÊS RECUSAS QUE VIRARAM O ARGUMENTO DE SEGURANÇA.
 *
 * ⚠️ AS TRÊS FORAM CONFERIDAS ANTES DE VIRAREM PROMESSA DE VITRINE, porque
 * aqui a página está afirmando o que ela NÃO faz — e afirmação negativa é a
 * mais fácil de desmentir com uma tela. As três batem com o produto e com o
 * que a própria FAQ desta página responde: não existe campo de senha de banco
 * em lugar nenhum, não existe Open Finance nem agregador, e não existe nada
 * buscando dado no fundo. O único caminho de entrada automática é o arquivo
 * OFX que VOCÊ exporta do seu banco e confere linha por linha antes de gravar
 * — e é por isso que a quarta linha existe: sem ela, "sem conexão" se lê como
 * "digite tudo à mão", que seria mentir ao contrário.
 *
 * A CONSEQUÊNCIA VEM JUNTO E NÃO É DECORAÇÃO: é justamente por não depender
 * de conexão que o app funciona com qualquer banco brasileiro, inclusive com
 * a conta que nenhum agregador consegue ler. Este fato veio da lista `PROVAS`,
 * onde ele vivia enterrado no item do meio.
 */
const SEGURANCA: { titulo: string; texto: string }[] = [
  {
    titulo: "Sem senha bancária",
    texto:
      "Não existe campo para a senha do seu banco no FINCASH. Nunca vai existir.",
  },
  {
    titulo: "Sem conexão automática",
    texto:
      "Nada fica buscando movimentação na sua conta. Quem decide o que entra é você.",
  },
  {
    titulo: "Sem Open Finance",
    texto:
      "Não é uma etapa que ficou para depois: é a escolha que faz o app funcionar com qualquer banco.",
  },
  {
    titulo: "E sem digitar tudo à mão",
    texto:
      "O extrato em OFX que o seu banco exporta entra pela tela de importação, conferido linha por linha antes de gravar.",
  },
];

/**
 * O CTA da página.
 *
 * Vive aqui, e não no `BotaoAssinarPlano`, por causa do destino: aquele
 * componente leva à trilha do Planejamento (ver o comentário em
 * `ROTA_COMECAR`). Como é um link, a página inteira continua sendo server
 * component: nenhum JavaScript sai daqui para o navegador.
 *
 * O RÓTULO É UM SÓ EM TODA A PÁGINA, e curto o bastante para nunca quebrar em
 * duas linhas. Dois rótulos para a mesma intenção ("Começar" no herói,
 * "Criar conta" no preço) é como uma página de venda passa a parecer duas.
 *
 * ⚠️ ELE DIZIA "COMEÇAR GRÁTIS", e não podia mais: a oferta deixou de ser
 * teste grátis e virou garantia de reembolso — paga-se e devolve-se se não
 * servir. Um botão prometendo "grátis" acima de um cartão de preço não é
 * detalhe de redação, é a contradição que faz a pessoa desconfiar do resto da
 * página. O rótulo passou a dizer o que o clique faz de verdade: abre a tela
 * de criar conta.
 *
 * ⚠️ E ELE NÃO É O BOTÃO DOS PLANOS. Este leva ao cadastro; o dos cartões de
 * preço leva ao checkout, por `assinaturaCheckout(plano)`. São dois destinos
 * diferentes de propósito, e por isso dois componentes.
 *
 * ── O RÓTULO: "QUERO COMEÇAR AGORA" ──────────────────────────────────────
 * Pedido do Jefferson, sócio da casa, em 11/09/2026: um CTA principal único,
 * repetido do começo ao fim. "Criar minha conta" descreve a MECÂNICA do
 * clique; "Quero começar agora" é a frase na primeira pessoa de quem decidiu.
 * É a diferença entre rotular o botão e dar voz a quem aperta.
 *
 * ⚠️ UM RÓTULO SÓ, NA PÁGINA INTEIRA. O ganho do CTA único é o
 * reconhecimento: na sexta vez que a pessoa passa por ele, ela não lê mais,
 * reconhece. Trocar a frase em uma das ocorrências "para variar" desfaz
 * exatamente isso. Se precisar mudar, muda aqui e muda em todas.
 */
function BotaoComecar({
  variante = "principal",
}: {
  /** `clara` é para usar sobre os blocos navy. */
  variante?: "principal" | "clara";
}) {
  const estilo =
    variante === "clara"
      ? "bg-white text-primary hover:bg-white/90"
      : "bg-accent-btn text-white hover:bg-accent-strong";

  return (
    <Link
      href={ROTA_COMECAR}
      className={`cta-varredura group inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl px-5 py-3 text-sm font-bold transition-all hover:-translate-y-0.5 ${estilo}`}
    >
      Quero começar agora
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

/**
 * A CHAMADA DO MEIO DA PÁGINA, e ela existe porque a página é alta.
 *
 * O CTA vivia em dois lugares: o herói e o fecho. Entre um e outro havia onze
 * seções, e quem se convence na quinta não tem o que clicar — rola até o fim
 * procurando, ou fecha a aba. Uma landing desta altura precisa de uma chamada
 * a cada duas ou três seções, e são três faixas: depois da dor, depois dos
 * recursos e depois da prova humana.
 *
 * ⚠️ O BOTÃO É O MESMO `BotaoComecar`, e isso não é reuso por economia: dois
 * rótulos para a mesma intenção é como uma página de venda passa a parecer
 * duas. O que muda de faixa para faixa é a FRASE, e ela é sempre o que a seção
 * imediatamente acima acabou de provar — nunca uma promessa nova. Quem for
 * escrever uma quarta: se a frase não estiver escrita em alguma seção acima
 * dela, ela não pode entrar aqui.
 *
 * ── POR QUE CLARA, E NÃO NAVY ─────────────────────────────────────────────
 * A página já tem três blocos navy (herói, assistente e fecho), e eles dizem
 * "isto aqui é o produto". Uma quarta, quinta e sexta superfície escura
 * gastariam esse significado até ele não valer nada. O que marca a faixa como
 * ação é o anel aceso do `fin-anel` e o laranja cheio do botão, não a cor do
 * fundo.
 *
 * ⚠️ E É GELO, NÃO CREME, por uma razão medida na tela e não escolhida no
 * papel: a primeira faixa cai imediatamente antes do bloco do Ciclo Novare,
 * que é creme. Em creme, as duas peças encostavam e liam como um bloco só de
 * quatrocentos pixels no celular — a chamada desaparecia dentro da seção
 * seguinte, que é exatamente o oposto do que ela existe para fazer. O creme
 * continua reservado ao que é da CASA (o Ciclo e as duas molduras de textura).
 */
/* ⚠️ A GARANTIA ENTROU AQUI, E É FIXA — não é prop, e não deve virar uma.
   Pedido do Jefferson em 11/09/2026: a reversão de risco era uma linha
   discreta perdida no cartão de preço, no fim da página. O lugar dela é
   colado em CADA convite a clicar, porque é ali que a pessoa hesita — e a
   frase só é curta o bastante para caber embaixo do botão porque ela vem
   pronta da fonte (`ASSINATURA_GARANTIA`), em vez de ser reescrita a cada
   ocorrência. Três faixas, três vezes a mesma frase, palavra por palavra:
   quem lê duas vezes reconhece, quem lê duas versões desconfia. */
function FaixaComecar({ frase }: { frase: string }) {
  return (
    <div className="pt-12 sm:pt-16">
      <div className="fin-anel flex flex-col items-start gap-5 rounded-3xl border border-border bg-gelo p-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:p-7">
        <p className="max-w-xl font-display text-base font-semibold leading-snug text-primary sm:text-lg">
          {frase}
        </p>
        <div className="shrink-0">
          <BotaoComecar />
          <p className="mt-2 flex items-center gap-1.5 text-2xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-accent-strong" />
            {ASSINATURA_GARANTIA}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * A TEXTURA DA CASA — a mesma linguagem do quadro que aparece atrás dos sócios
 * na fotografia e do fundo do site oficial (diagnostico.novareapp.com.br).
 *
 * ⚠️ ELA É PONTE VISUAL, NÃO ENFEITE, e por isso aparece DUAS vezes e só nos
 * dois lugares em que a página fala da casa e não do app: a seção dos sócios e
 * o bloco de preço. Espalhada por seis seções, ela deixa de dizer "isto é da
 * Novare" e passa a dizer "isto é um papel de parede".
 *
 * ⚠️ E NUNCA SOB TEXTO CORRIDO SEM ANTEPARO. Ela é clara e tem ondas de
 * contraste médio: o texto das duas seções mora em cartão branco ou creme POR
 * CIMA dela, nunca direto na textura. Onde ela aparece sozinha é margem.
 * A opacidade baixa não é timidez — é o que impede a onda de competir com a
 * linha de base do texto.
 */
const TEXTURA_CASA: React.CSSProperties = {
  backgroundImage: "url(/fincash/textura-novare.webp)",
  backgroundSize: "cover",
  backgroundPosition: "center",
};

/**
 * Quantos itens da lista o cartão mostra abertos.
 *
 * São onze ao todo. Onze abertos dão um cartão de quase mil pixels a 390px, e
 * dois cartões assim viram cinco telas de rolagem entre o primeiro preço e o
 * segundo botão: a pessoa desiste antes de comparar, que é o oposto do que uma
 * seção de planos existe para fazer. Seis é o que cabe sem o cartão deixar de
 * ser cartão.
 *
 * E são os seis PRIMEIROS porque `ASSINATURA_INCLUI` já vem ordenado por força
 * de argumento: a revisão do consultor na frente (o item que não é software), o
 * que apenas confirma a compra no fim. Recolher pelo fim é recolher o que menos
 * convence.
 *
 * O resto não some: vai para um `<details>` nativo, que abre no Enter, entra na
 * ordem de tabulação sozinho e é anunciado como expansível por leitor de tela.
 * Escrever isso à mão com estado em React custaria JavaScript numa página que
 * hoje não manda nenhum, e ainda teria de reimplementar o que o navegador já
 * acerta.
 */
const ITENS_ABERTOS = 6;

/**
 * Uma linha da lista do que entra, nos dois tons de superfície.
 *
 * O TIQUE É LARANJA, e não verde como era quando a lista morava fora do
 * cartão. Dois motivos: o verde era a única cor fora do sistema num arquivo
 * que declara "um acento só" no cabeçalho, e agora a lista aparece sobre as
 * duas superfícies, onde um verde só não serve para as duas.
 *
 * MEDIDO EM PIXEL, e não estimado sobre a cor de fundo declarada: o cartão
 * navy é degradê com uma luz laranja no alto à direita, então "o fundo" é uma
 * faixa de cores e não uma. O método foi esconder a lista, fotografar a área
 * que ela ocupava, varrer um pixel a cada quatro e guardar o PIOR caso:
 *   • texto `white/85` sobre o navy: 11,96:1 no pior pixel, 12,82:1 no melhor;
 *   • tique `accent-claro` sobre o mesmo navy: 6,80:1 no pior, contra os 3:1
 *     que a WCAG pede de gráfico que carrega significado;
 *   • no cartão branco, texto `foreground` dá 16,92:1 e tique `accent-strong`
 *     dá 6,49:1.
 *
 * O `white/70` que o resto do cartão usa daria 8,51:1 e também passaria. A
 * lista subiu para 85% mesmo assim porque ela é o texto que a pessoa varre
 * item a item com o dedo, e não o rodapé de uma caixa lido uma vez: aprovado
 * na régua não é o mesmo que confortável no polegar.
 */
function LinhaInclui({
  texto,
  destaque,
}: {
  texto: string;
  /** Cartão navy. */
  destaque: boolean;
}) {
  return (
    <li
      className={`flex items-start gap-2.5 text-sm leading-snug ${
        destaque ? "text-white/85" : "text-foreground"
      }`}
    >
      <Check
        className={`mt-[0.15rem] h-4 w-4 shrink-0 ${
          destaque ? "text-accent-claro" : "text-accent-strong"
        }`}
        strokeWidth={2.5}
      />
      <span>{texto}</span>
    </li>
  );
}

/**
 * O CARTÃO DE UM PLANO — e os dois saem desta mesma função.
 *
 * ⚠️ NADA AQUI ESCREVE PREÇO, NOME NEM PERÍODO. Tudo vem de
 * `ASSINATURA_PLANOS`, que por sua vez deriva dos dois únicos números do
 * `lib/assinatura`. Uma landing que digita "R$ 19,90" no meio da marcação é
 * uma landing que continua anunciando o preço velho no dia seguinte ao
 * aumento, e é para isso que existe o guardião `testar-nada-a-venda.mjs`.
 *
 * O QUE DISTINGUE O DESTACADO É SUPERFÍCIE, NUNCA CONTEÚDO. Os dois planos
 * entregam o produto inteiro, então o cartão do anual não pode ganhar um
 * tique a mais nem uma linha de recurso que o outro não tenha: a diferença é
 * navy contra branco, laranja cheio contra contorno, e o selo. Inventar
 * diferença de funcionalidade aqui seria construir na página a escada de
 * planos que a casa decidiu não ter.
 *
 * ⚠️ E É POR ISSO QUE A LISTA ENTROU AQUI DENTRO, idêntica nos dois cartões.
 * Ela vivia num bloco separado abaixo, com o título "o que vem junto nos
 * dois" — informação certa no lugar errado, porque quem compara preço compara
 * dentro do cartão e ninguém rola para baixo para descobrir o que o número de
 * cima compra. Stripe, Notion e Linear põem a lista entre o preço e o botão, e
 * o concorrente também.
 *
 * A repetição não é desperdício, é o argumento virando imagem: duas colunas de
 * tiques rigorosamente iguais provam num olhar o que o parágrafo abaixo levava
 * cinco linhas para afirmar. Por isso a declaração encolheu para uma linha, e
 * a lista ganhou um título que diz a mesma coisa em quatro palavras. No dia em
 * que alguém quiser tirar um item de um dos cartões, é esta a linha a ler
 * antes.
 *
 * POR QUE O NÚMERO GRANDE DOS DOIS É UM "POR MÊS": é a única comparação que a
 * pessoa faz sozinha. Pôr R$ 238,80 no lugar do número grande do anual faria
 * o plano mais barato parecer oito vezes o outro. O total cobrado de uma vez
 * vem logo abaixo, inteiro e sem letra miúda — escondê-lo seria a pegadinha
 * que esta página passou dez seções dizendo que não pratica.
 *
 * ⚠️ É UM `<a>`, e não um botão com `onClick`: o destino já vem resolvido de
 * `assinaturaCheckout(plano)` (Hotmart quando a oferta existe, `/assinar/em-breve`
 * quando ainda não), então o `href` sai pronto do servidor. A página inteira
 * segue sem mandar um byte de JavaScript próprio para o navegador, que é o que
 * mantém esta landing leve mesmo com nove capturas dentro dela.
 */
function CartaoPlano({
  plano,
  itens,
}: {
  plano: (typeof ASSINATURA_PLANOS)[number];
  /**
   * A lista chega pronta de fora, e não importada aqui, porque um dos itens
   * carrega o contador de ferramentas exclusivas: `lib/assinatura` é fonte de
   * preço e não pode depender do catálogo de apps para não virar um nó de
   * importação entre os dois. Quem faz a troca é a página, uma vez só.
   */
  itens: string[];
}) {
  const destaque = plano.destaque;
  const abertos = itens.slice(0, ITENS_ABERTOS);
  const guardados = itens.slice(ITENS_ABERTOS);

  return (
    <div
      className={`relative flex h-full flex-col rounded-3xl p-6 sm:p-7 ${
        /* ⚠️ O DESTACADO VEM PRIMEIRO NO CELULAR, e só no celular.
           Empilhados, os cartões ficam com quase setecentos pixels cada: quem
           rola encontra o mensal inteiro, lê R$ 29,90 e decide ali, sem nunca
           ter visto que existe metade disso logo abaixo. No desktop a ordem da
           fonte volta a valer, porque lado a lado a comparação acontece da
           esquerda para a direita e o caro antes do barato é o que faz o
           desconto aparecer.

           A ordem do DOM não muda (mensal, anual): são dois elementos, e a
           tabulação continua percorrendo a seção na ordem em que ela foi
           escrita. */
        destaque ? "order-first lg:order-none " : ""
      }${
        /* ⚠️ `border-transparent` NO DESTACADO, pelo mesmo motivo do botão:
           o cartão claro tem contorno de 1px e o navy só tem `ring`, que
           desenha por fora e não entra no cálculo da caixa. Sem esta borda os
           dois cartões têm a mesma altura mas conteúdos deslocados em 1px, e
           os dois botões do pé nascem em linhas diferentes. */
        destaque
          ? "border border-transparent text-white ring-1 ring-accent-claro/25"
          : "border border-border bg-card shadow-subtle"
      }`}
      style={destaque ? CARTAO_NAVY : undefined}
    >
      {/* O LED, e SÓ no cartão destacado.

          É o único efeito caro da página, e é caro de propósito: este é o
          único lugar onde a página toma partido sobre qual plano comprar, e a
          luz correndo diz isso antes de a primeira palavra ser lida. Um
          segundo LED em qualquer outro lugar e este aqui deixa de significar
          alguma coisa — está escrito na documentação da classe, em
          `cinema.css`.

          ⚠️ ELE SUBSTITUIU A `borda-viva`, não se soma a ela: a `borda-viva`
          do `globals.css` só acende no `:hover`, que num cartão de preço visto
          por quem rola com o dedo nunca acontece, e as duas desenhando 1px no
          mesmo lugar viram uma borda de 2px mal registrada. */}
      {destaque ? <span aria-hidden className="fin-led" /> : null}

      {/* O selo de recomendado pousa NA BORDA, meio dentro e meio fora: é o
          que faz o cartão parecer levantado em relação ao vizinho sem precisar
          de escala nem de sombra colorida. O anel que pulsa em volta é o mesmo
          `selo-pulsa` do resto da casa, e ele já desliga sozinho em
          `prefers-reduced-motion`.

          ⚠️ `w-fit` NÃO É ENFEITE. Filho absoluto de um contêiner flex herda o
          `align-self: stretch` do pai no eixo transversal, e num flex em
          coluna o eixo transversal é a horizontal: sem isto, a pílula deixa de
          ter o tamanho do texto e atravessa o cartão de ponta a ponta. */}
      {destaque && (
        <span className="selo-pulsa absolute -top-3 left-6 w-fit rounded-full bg-accent-btn px-3 py-1 text-2xs font-bold uppercase tracking-[0.14em] text-white">
          Recomendado
        </span>
      )}

      <div className="flex flex-wrap items-center gap-2.5">
        <p
          className={`font-display text-base font-semibold ${
            destaque ? "text-white" : "text-primary"
          }`}
        >
          {plano.nome}
        </p>
        {/* O selo da economia vem da fonte, com o valor já formatado. */}
        {plano.selo && (
          <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-accent-claro ring-1 ring-accent-claro/30">
            {plano.selo}
          </span>
        )}
      </div>

      {/* A HIERARQUIA DE PREÇO: o número manda, e manda por tamanho, não por
          cor. Quase três vezes o corpo do texto, `tabular-nums` para os dois
          cartões alinharem a vírgula na mesma coluna, e o "/mês" preso à base
          do número em peso menor — é sufixo, não segunda informação. */}
      <p className="mt-4 flex items-end gap-1.5">
        <span
          className={`font-display text-[2.9rem] font-extrabold leading-none tracking-tight tabular-nums sm:text-[3.25rem] ${
            destaque ? "text-white" : "text-primary"
          }`}
        >
          {plano.valorRotulo}
        </span>
        <span
          className={`pb-1.5 text-base font-semibold ${
            destaque ? "text-white/60" : "text-muted-foreground"
          }`}
        >
          {plano.periodo}
        </span>
      </p>

      <p
        className={`mt-2.5 text-sm leading-relaxed ${
          destaque ? "text-white/70" : "text-muted-foreground"
        }`}
      >
        {plano.detalhe}
      </p>

      {/* A CAIXA DO MEIO existe nos DOIS cartões, e é o que os deixa da mesma
          altura sem esticar um deles com espaço vazio. No anual ela carrega o
          tamanho do desconto; no mensal, o motivo de ele existir. */}
      {destaque ? (
        <div className="mt-5 rounded-xl bg-white/[0.06] p-4 ring-1 ring-white/10">
          <p className="text-sm leading-relaxed tabular-nums text-white/70">
            De{" "}
            <span className="line-through decoration-white/40">
              {ASSINATURA_ANUAL_REFERENCIA_ROTULO}
            </span>{" "}
            por{" "}
            <span className="font-display font-bold text-white">
              {ASSINATURA_PRECO_ANUAL_ROTULO}
            </span>
            .
          </p>
          {/* ⚠️ AS DUAS LEITURAS DA MESMA ECONOMIA, e as duas saem da fonte: o
              selo acima diz em reais, esta linha diz em porcentagem e em
              mensalidades. "Cerca de" está embutido na constante, e não é
              modéstia: a conta exata dá quatro mensalidades e mais quarenta
              centavos a favor de quem assina. */}
          <p className="mt-2 text-xs leading-relaxed text-white/60">
            {ASSINATURA_ANUAL_DESCONTO_ROTULO} de desconto, ou{" "}
            {ASSINATURA_ANUAL_ECONOMIA_MESES_ROTULO} que você deixa de pagar.
          </p>
        </div>
      ) : (
        <div className="mt-5 rounded-xl border border-border bg-gelo p-4">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Sem compromisso de prazo: o mês que você paga é o mês que você usa,
            e no mês seguinte a decisão volta a ser sua.
          </p>
        </div>
      )}

      {/* ═══ O QUE ENTRA, DENTRO DO CARTÃO E ENTRE O PREÇO E O BOTÃO ═══
          O lugar não é gosto: é onde a lista responde a pergunta que o número
          grande acabou de abrir ("o que isso compra?") e onde ela ainda está
          na frente quando a mão vai para o botão.

          O TÍTULO DIZ "NOS DOIS PLANOS" nos DOIS cartões. Lido no de cima,
          promete; lido no de baixo, confirma. É a frase que substituiu o
          parágrafo de cinco linhas que ficava embaixo da seção explicando que
          nada fica trancado no plano barato.

          Ele NÃO é caixa alta de propósito. Os rótulos em versalete desta
          página vivem todos acima de um título de seção, e um aqui, no meio de
          um cartão, os transformaria em decoração de lista. */}
      <div
        className={`mt-6 border-t pt-5 ${
          destaque ? "border-white/10" : "border-border"
        }`}
      >
        <p
          className={`font-display text-sm font-semibold ${
            destaque ? "text-white" : "text-primary"
          }`}
        >
          Tudo isto, nos dois planos
        </p>

        <ul className="mt-3.5 space-y-2.5">
          {abertos.map((linha) => (
            <LinhaInclui key={linha} texto={linha} destaque={destaque} />
          ))}
        </ul>

        {guardados.length > 0 && (
          /* O `<details>` NATIVO, e não um acordeão de biblioteca: ele já
             chega focável, já responde a Enter e a barra de espaço, e o leitor
             de tela já anuncia recolhido/expandido sem uma linha de ARIA. O
             que a marcação precisa fazer é só tirar o triângulo padrão do
             navegador (que é diferente em cada um) e pôr uma seta que gira.

             A CONTAGEM É CALCULADA. Cravar "e mais 5" aqui é o mesmo erro que
             cravar o preço: no dia em que `ASSINATURA_INCLUI` ganhar um item,
             o cartão passaria a mentir um número pequeno, que é o tipo de
             mentira que ninguém revisa. */
          <details className="group mt-3">
            <summary
              className={`flex w-fit cursor-pointer list-none items-center gap-1.5 rounded-lg text-sm font-semibold outline-none [&::-webkit-details-marker]:hidden ${
                destaque
                  ? "text-accent-claro focus-visible:ring-2 focus-visible:ring-accent-claro focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
                  : "text-accent-strong focus-visible:ring-2 focus-visible:ring-accent-strong focus-visible:ring-offset-2 focus-visible:ring-offset-card"
              }`}
            >
              <ChevronDown
                aria-hidden
                className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none"
              />
              e mais {guardados.length} itens
            </summary>

            <ul className="mt-3 space-y-2.5">
              {guardados.map((linha) => (
                <LinhaInclui key={linha} texto={linha} destaque={destaque} />
              ))}
            </ul>
          </details>
        )}
      </div>

      {/* `mt-auto` no INVÓLUCRO, e o respiro no `pt-6` dele: o automático
          empurra o botão para o pé dos dois cartões (para o olho comparar
          preço com preço e ação com ação), e a margem de cima continua
          existindo no cartão que não sobrou espaço nenhum — que é o que
          acontece no celular, onde cada cartão tem a altura do próprio
          conteúdo. */}
      <div className="mt-auto pt-6">
        <a
          href={plano.checkout}
          /* A BORDA TRANSPARENTE NO DESTACADO não é sobra de copiar e colar: o
             botão do mensal tem contorno de 1px e o do anual não tinha,
             então um media 50px de altura e o outro 48. Lado a lado, com os
             dois presos no pé do cartão pelo `mt-auto`, a diferença aparecia
             como dois pixels de desalinho no topo dos botões, que é
             exatamente o defeito que esta seção não pode ter. Reservar a
             mesma caixa nos dois é mais barato do que cravar altura. */
          className={`flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl border px-5 py-3 text-sm font-bold transition-all ${
            destaque
              ? "cta-varredura border-transparent bg-accent-btn text-white hover:-translate-y-0.5 hover:bg-accent-strong"
              : "border-border bg-card text-primary hover:border-primary/25 hover:bg-muted"
          }`}
        >
          Assinar o {plano.nome.toLowerCase()}
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}

/*
 * ONDE FORAM PARAR AS PEÇAS DE PRÉVIA.
 *
 * A `Moldura`, o `Telefone` e a `Foto` vivem em `./Molduras`, junto com o
 * catálogo das capturas e o texto alternativo de cada uma: a moldura deixou de
 * vestir uma peça só e ficou grande demais para morar no meio do argumento de
 * venda.
 *
 * A `PreviaPainel`, a `CurvaProjecao` e a `LinhaValor` foram embora, e é a
 * mudança mais cara desta versão. Elas remontavam em HTML o painel, a curva de
 * doze meses e as linhas de fatura, e faziam isso bem: nítidas em qualquer
 * tela, legíveis a 390px, sempre em dia com os tokens. O que nunca
 * conseguiram foi provar que o app existe. A remontagem mostrava cinco números
 * escolhidos aqui dentro; a captura mostra a barra lateral com as telas todas,
 * o velocímetro de renda comprometida, o resumo automático apontando as contas
 * vencidas e o gráfico de saldo mês a mês com a legenda inteira. Onde a foto
 * entrega mais argumento que o desenho, o desenho sai, mesmo tendo sido
 * defendido por escrito na versão anterior desta página.
 */

/**
 * UM DOS SEIS ÍCONES 3D, no tamanho em que eles foram desenhados para viver.
 *
 * ⚠️ A RESTRIÇÃO QUE MANDA NESTA PEÇA É DE COR, e ela foi medida na tela: o
 * CORPO dos seis é navy, então sobre os blocos navy da página eles somem e
 * sobra só o detalhe laranja — o desenho vira um rabisco. Por isso `chip`
 * existe: onde o fundo é escuro, o ícone entra dentro de um quadrado branco,
 * que é o que devolve a silhueta. Em fundo claro o chip é desperdício de
 * caixa, e o ícone entra solto.
 *
 * ⚠️ NADA DE `unoptimized`. São webp de 256×256 e uns dez quilobytes cada: o
 * otimizador do Next serve exatamente a densidade que a tela pede, e desligá-lo
 * aqui faria o celular baixar 256px para desenhar 44. (O `unoptimized` que
 * aparece duas vezes nesta página é dos SVG, e o motivo está escrito lá.)
 *
 * O `alt` é SEMPRE vazio, sem exceção: cada um deles fica a dois centímetros
 * de um título que diz a mesma coisa em palavras. Descrever "uma carteira
 * tridimensional" faria o leitor de tela anunciar o assunto duas vezes antes
 * de chegar na frase que importa.
 */
function Icone3D({
  nome,
  tamanho = 48,
  chip = false,
}: {
  nome: "carteira" | "cartao" | "projecao" | "divida" | "escudo" | "chat";
  tamanho?: number;
  /** Obrigatório sobre navy. Ver a nota de cor acima. */
  chip?: boolean;
}) {
  const img = (
    <Image
      src={`/fincash/icones/${nome}.webp`}
      alt=""
      width={256}
      height={256}
      style={{ width: tamanho, height: tamanho }}
      className="shrink-0"
    />
  );

  if (!chip) return img;

  return (
    <span className="inline-flex items-center justify-center rounded-xl bg-white p-1.5 ring-1 ring-white/25">
      {img}
    </span>
  );
}

export default function FincashPage() {
  const inclui = ASSINATURA_INCLUI.map((i) =>
    i.replace("{EXCLUSIVAS}", String(CONTAGEM.exclusivasAssinante)),
  );

  return (
    <div className="aurora-clara min-h-[100dvh] bg-gradient-to-b from-muted/50 via-background to-background">
      <Cabecalho
        direita={
          <Link
            href="/"
            className="text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Voltar ao Hub
          </Link>
        }
      />

      <main>
        {/* ============================================== 1. HERÓI ====== */}
        {/* QUATRO ELEMENTOS DE TEXTO, e não mais: título, uma linha de apoio,
            o botão e a oferta. A versão anterior tinha pílula de categoria,
            parágrafo de três linhas, preço em display, um segundo selo, dois
            botões e uma lista de três tiques. Nada disso cabia na primeira
            tela do celular, e o CTA ficava abaixo da dobra bem na página em
            que ele é a única coisa a fazer. O que a pessoa precisa ver aqui é
            a pergunta, a resposta, o produto e quanto custa.

            ── O QUE MUDOU, e nenhum item é enfeite ──────────────────────────
            1. A MICROCÓPIA DE TRÊS LINHAS VIROU UMA PEÇA DE OFERTA. Ela
               imprimia a oferta por extenso (os dois preços, o total do ano, o
               prazo, a garantia e o cancelamento) em cinza claro a 12px, e
               três linhas assim logo abaixo do botão não são lidas: são um
               bloco que o olho contorna a caminho da imagem. Encolheu uma vez
               para `ASSINATURA_OFERTA_CURTA` mais a garantia, e na revisão do
               Jefferson (11/09/2026) virou a caixa com contorno que está aqui
               — mesma informação, hierarquia de peça de venda. O porquê e a
               conta de altura estão escritos nela.
            2. A GRADE DE FUNDO (`cine-grade`, a mesma da /assinar): o palco
               era um degradê liso, e degradê liso atrás de um aparelho faz o
               aparelho parecer recortado e colado. A grade some nas bordas por
               máscara e desliga sozinha em `prefers-reduced-motion`. Ela é
               `::before` posicionado, então o conteúdo precisa vir num filho
               `relative` para não ficar embaixo dela.
            3. O APARELHO GANHOU CHÃO E DEIXOU DE ESTICAR A DOBRA. A 22rem de
               largura, a captura de celular passava de 760px de altura e
               sozinha definia a altura do herói: sobravam quase 300px de navy
               vazio de cada lado do texto, e num monitor de 900px o fim da
               seção já não cabia. A 19rem a composição fecha na primeira tela,
               e o halo por trás resolve o recorte sem tocar na foto. */}
        <section
          className="cine-grade fin-palco relative isolate overflow-hidden text-white"
          style={PALCO_NAVY}
        >
          {/* ⚠️ ERA `lg:py-16`, E OS VINTE E QUATRO PIXELS DE CADA LADO FORAM COMPRADOS
              PARA A FAIXA DE SELOS CABER NA MESMA DOBRA. O herói tem orçamento
              de altura fechado: 768px, medido, que é o notebook mais comum de
              quem lê isto no trabalho. Trazer a faixa para dentro do navy
              custou 47px, e o herói passou a terminar em 815 — quarenta e sete
              pixels abaixo do corte, ou seja, invisível exatamente para quem a
              página foi calibrada.

              O QUE ENCOLHEU FOI O RESPIRO DO BLOCO, e não o conteúdo: nenhuma
              frase saiu, o `<h1>` não mudou de escala e a caixa de oferta
              continua com as três linhas dela. Se um dia faltar altura de
              novo, é por aqui que se busca — e depois pelo lockup, nunca pelo
              CTA nem pelo preço. */}
          <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-14 lg:py-10">
            <div className="grid gap-9 lg:grid-cols-[minmax(0,1fr)_minmax(0,35rem)] lg:items-center lg:gap-10">
              <div className="surgir">
                {/* ── O LOCKUP DA CASA E DO PRODUTO ───────────────────────
                    O herói não dizia de quem era o produto nem como ele se
                    chama: quem chegava por anúncio via uma pergunta, um botão
                    e um celular, e saía sem o nome. Agora a primeira coisa
                    lida é NOVARE | FINCASH, na ordem em que a compra acontece
                    (a casa responde pelo produto, e é a casa que já tem nome
                    no mercado).

                    ⚠️ A ESCALA É DELIBERADAMENTE MENOR QUE A DO `<h1>`: 24px
                    de altura de logo contra um título de até 48px. A marca
                    IDENTIFICA, o título VENDE, e um lockup do tamanho do
                    título rouba a primeira leitura para uma informação que
                    não convence ninguém a assinar. Se um dia faltar altura na
                    primeira tela, é ESTE bloco que encolhe, nunca o CTA.

                    ⚠️ `unoptimized` no SVG é obrigatório neste projeto — o
                    otimizador do Next recusa SVG por padrão. O mesmo já vale
                    para o `ia.svg` da seção do assistente, e o motivo está
                    escrito lá por extenso.

                    O `alt` do logo é "Novare" e o do emblema é vazio: o nome
                    FINCASH está em texto ao lado, e descrever o desenho
                    faria o leitor de tela anunciar a marca duas vezes. */}
                <div className="mb-6 flex items-center gap-3 sm:gap-4">
                  <Image
                    src="/marca/logo-novare-branca.png"
                    alt="Novare"
                    width={884}
                    height={256}
                    priority
                    className="h-5 w-auto sm:h-6"
                  />
                  <span aria-hidden className="h-6 w-px bg-white/25" />
                  <span className="flex items-center gap-2">
                    <Image
                      src="/fincash/marca.svg"
                      alt=""
                      width={26}
                      height={26}
                      unoptimized
                      className="h-6 w-6 sm:h-7 sm:w-7"
                    />
                    <span className="font-display text-sm font-bold uppercase leading-none tracking-[0.24em] text-white sm:text-base">
                      Fincash
                    </span>
                  </span>
                </div>

                {/* ── O TÍTULO, E A PALAVRA QUE ELE GANHOU ────────────────
                    Era "Quanto ainda dá para gastar até o fim do mês?", e o
                    que entrou no lugar é a frase do Jefferson, sócio da casa,
                    pedida na revisão de 11/09/2026.

                    A DIFERENÇA ENTRE AS DUAS É UMA PALAVRA, e é a palavra que
                    a página inteira existe para provar: REALMENTE. "Quanto
                    ainda dá para gastar" é uma pergunta que o extrato também
                    acha que responde — quem lê aquilo pensa no saldo e segue
                    em frente. "Quanto você REALMENTE pode gastar" abre uma
                    distância entre dois números e admite que o primeiro está
                    errado, que é a tese do produto. É por isso que o acento
                    de cor foi para ela, e não para o prazo: o prazo é
                    circunstância, o advérbio é o argumento.

                    ⚠️ "ESTE MÊS" E NÃO "ATÉ O FIM DO MÊS", também dele, e o
                    ganho é de leitura no celular: a frase fecha em três linhas
                    a 390px em vez de quatro, e o botão sobe junto. */}
                <h1 className="font-display text-[1.75rem] font-extrabold leading-[1.1] tracking-tight sm:text-[2.6rem] lg:text-[3rem]">
                  Quanto você{" "}
                  <span className="text-accent-claro">realmente</span> pode
                  gastar este mês?
                </h1>

                {/* ── A LINHA DE APOIO É UMA FUSÃO, E ISSO FOI DELIBERADO ──
                    O Jefferson ofereceu duas: "Seu saldo mostra quanto você
                    tem. O FINCASH mostra quanto você realmente pode gastar." e
                    "Descubra quanto você realmente pode gastar sem comprometer
                    o seu futuro financeiro."

                    A PRIMEIRA NÃO PODIA VIR INTEIRA PARA CÁ, e o motivo é que
                    ela JÁ ESTÁ na página, palavra por palavra: é a frase que a
                    peça `<Calculo />` carrega em cima das duas barras, duas
                    dobras abaixo. Repetida aqui, a pessoa leria treze palavras
                    idênticas duas vezes em trinta segundos — e a segunda vez,
                    que é onde a prova está desenhada, chegaria como coisa já
                    lida. A metade que ela empresta ao herói é a primeira ("o
                    seu saldo mostra quanto você tem"), que é a PERGUNTA; a
                    metade da resposta fica guardada para a peça que a prova.

                    A SEGUNDA NÃO PODIA VIR INTEIRA porque repetiria "realmente
                    pode gastar" a dois centímetros do `<h1>` que acabou de
                    dizer isso.

                    O QUE FICOU FORA DAS DUAS E CONTINUA AQUI: "sem conectar
                    banco nenhum". É o único fato do herói, é o diferencial
                    contra todo concorrente que exige Open Finance, e a seção
                    de segurança lá embaixo existe para sustentá-lo. */}
                <p className="mt-5 max-w-lg text-base leading-relaxed text-white/80 sm:text-lg">
                  O seu saldo mostra quanto você tem. O FINCASH desconta o que
                  ainda vai sair, soma o que ainda entra e mostra o que sobra de
                  verdade — sem conectar banco nenhum.
                </p>

                {/* `mt-6` e não `mt-7`: quatro pixels comprados para o herói
                    inteiro caber em 1366×768. Ver a nota da peça de oferta. */}
                <div className="mt-6">
                  <BotaoComecar variante="clara" />
                </div>

                {/* ══ A OFERTA NA PRIMEIRA DOBRA ═══════════════════════════
                    Pedido do Jefferson em 11/09/2026, e ele usou a palavra
                    "antecipar": o preço só aparecia como uma linha de 12px em
                    cinza claro embaixo do botão, e inteiro a treze seções
                    daqui. Quem chega de anúncio decide em duas perguntas —
                    "isto resolve o meu problema?" e "quanto custa?" — e a
                    segunda ficava sem resposta até a página inteira ter sido
                    rolada.

                    ⚠️ NENHUM NÚMERO AQUI É DIGITADO. Os quatro (o preço do
                    anual, o que ele custaria mês a mês, a economia e o prazo
                    da garantia) saem de `lib/assinatura`, que deriva tudo de
                    dois inteiros em centavos. Uma peça de venda com preço
                    escrito à mão é uma peça que anuncia o valor velho no dia
                    seguinte ao aumento, e esta é a peça mais vista da página.

                    ⚠️ E O NÚMERO GRANDE É O TOTAL DO ANO, NÃO O "POR MÊS" —
                    ao contrário do cartão de preço da seção 9, onde o grande
                    é o mensal equivalente. Não é incoerência, são duas
                    perguntas diferentes: lá a pessoa COMPARA dois planos, e
                    "por mês" é a única régua que serve para os dois; aqui ela
                    ainda não sabe se cabe no bolso dela, e o que responde isso
                    é o que a fatura vai cobrar. O riscado ao lado é o que o
                    mesmo ano custaria pago mês a mês, e a economia é a
                    subtração dos dois — as três coisas na mesma linha, sem
                    letra miúda nenhuma explicando depois.

                    ⚠️ A GARANTIA FICA COLADA NO PREÇO, e não numa linha
                    separada: o trabalho dela é desarmar o susto do número que
                    está logo acima. Separada dele por um respiro, ela vira
                    mais uma promessa solta de herói. */}
                {/* ⚠️ TRÊS LINHAS, E A CONTA DE PIXEL É O MOTIVO. A primeira
                    versão desta peça tinha cinco (selo, preço, economia, os
                    dois mensais, garantia) e empurrava o pé do herói para
                    809px — cabia em 1440×900 e estourava em 1366×768, que é
                    justamente o notebook mais comum de quem lê isto no
                    trabalho. Cada par que ficou na mesma linha ficou por
                    caber com folga na coluna: selo + economia, e garantia +
                    os dois mensais.

                    ⚠️ E NENHUMA DAS TRÊS USA "·" ENTRE DUAS METADES. Um
                    separador no meio de um `flex-wrap` vira ponto pendurado no
                    fim da linha assim que a segunda metade desce, e isso
                    acontece no celular em todas elas. Onde há duas metades,
                    quem separa é `justify-between` no desktop e a própria
                    quebra no celular. */}
                <div className="mt-4 max-w-lg rounded-2xl bg-white/[0.07] p-4 ring-1 ring-white/15">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <p className="inline-flex items-center gap-1.5 rounded-full bg-accent-btn px-2.5 py-1 text-2xs font-bold uppercase tracking-[0.12em] text-white">
                      <BadgeCheck className="h-3.5 w-3.5" />
                      Plano mais recomendado
                    </p>
                    <p className="text-xs font-semibold tabular-nums text-accent-claro">
                      Economize {ASSINATURA_ANUAL_ECONOMIA_ROTULO} por ano
                    </p>
                  </div>

                  <p className="mt-3 flex flex-wrap items-baseline gap-x-2.5 gap-y-1 tabular-nums">
                    <span className="text-sm font-semibold text-white/70">
                      Plano anual
                    </span>
                    <span className="font-display text-2xl font-extrabold leading-none tracking-tight text-white sm:text-[1.75rem]">
                      {ASSINATURA_PRECO_ANUAL_ROTULO}
                    </span>
                    <span className="text-sm text-white/50 line-through decoration-white/40">
                      {ASSINATURA_ANUAL_REFERENCIA_ROTULO}
                    </span>
                  </p>

                  <p className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-white/10 pt-2.5 text-xs tabular-nums">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-white/85">
                      <ShieldCheck className="h-4 w-4 shrink-0 text-accent-claro" />
                      {ASSINATURA_GARANTIA}
                    </span>
                    {/* 70% de branco, e não 60: a 12px sobre este navy o 60 dá
                        pouco mais de 4,5:1 — passa na régua e cansa no polegar.
                        O resto do herói já usa 70 pelo mesmo motivo. */}
                    <span className="text-white/70">
                      {ASSINATURA_OFERTA_CURTA}
                    </span>
                  </p>
                </div>
              </div>

              {/* O PRODUTO NA PRIMEIRA DOBRA, e agora são TRÊS telas.
                  Era um celular só. Uma captura sozinha prova que existe UMA
                  tela, e a objeção de quem chega numa landing de finanças não
                  é "isto é bonito?", é "isto é um app inteiro ou um formulário
                  com nome?". O leque responde isso sem uma frase a mais.

                  ⚠️ NÃO REDESENHE O LEQUE AQUI. Ele é a `<Vitrine />`, que já
                  traz a rotação, o escalonamento, o halo e a regra de sumir os
                  laterais abaixo de 640px. O halo em `<span>` que ficava neste
                  lugar saiu porque virou duplicata do que a vitrine já desenha
                  por dentro — duas luzes empilhadas deixavam o palco leitoso.

                  ⚠️ E É O `import` DELA QUE ENTREGA O `vitrine.css` À PÁGINA.
                  As classes `.fin-relevo`, `.fin-anel`, `.fin-escada`,
                  `.fin-lustro` e `.fin-halo` são usadas em meia dúzia de
                  seções abaixo e morrem todas juntas se alguém tirar a vitrine
                  daqui sem mover o import. Está escrito no topo do CSS.

                  A PRIORIDADE CONTINUA SENDO UMA SÓ: a vitrine marca só o
                  aparelho do centro, que é a mesma captura do painel. */}
              <div className="surgir">
                <Vitrine className="mx-auto" />
              </div>
            </div>
          </div>

          {/* ══ A FAIXA DE GARANTIAS, QUE ERA A SEÇÃO 2 ═══════════════════
              Ela vivia logo abaixo do navy, em `bg-card/70`, com borda e
              respiro próprios: uma seção inteira de cabeçalho zero e uma linha
              de conteúdo. Quatro frases de cinco palavras não são um assunto,
              são a legenda do que acabou de ser prometido — e legenda mora
              colada no que ela legenda.

              ⚠️ O QUE ESTA MUDANÇA CUSTA É ALTURA DE DOBRA, e o herói tem
              orçamento fechado: ele foi calibrado para caber em 768px, que é o
              notebook mais comum de quem lê isto no trabalho. Por isso a faixa
              entrou como UMA LINHA (`py-3.5`, ícone de 14px, texto de 12px) e
              não como a grade de dois andares que era antes — e por isso ela
              fica FORA do `max-w-6xl` do miolo, atravessando o navy de ponta a
              ponta: faixa que atravessa lê como rodapé de bloco, faixa
              centrada lê como mais um parágrafo do herói.

              ⚠️ O ÍCONE CONTINUA SENDO DE TRAÇO, e nenhum dos seis 3D entra
              aqui: o corpo deles é navy, e sobre este fundo eles sumiriam —
              sobraria o detalhe laranja boiando. Ver a nota em `Icone3D`.

              `text-white/85` e não `/70`: a 12px sobre este navy o 70 passa
              raspando na régua, e esta linha é justamente a que a pessoa varre
              com o olho em um segundo, sem parar em nenhum item. */}
          <div className="relative border-t border-white/10">
            <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-5 gap-y-2.5 px-4 py-2.5 sm:grid-cols-4 sm:px-6">
              {SELOS.map((selo) => (
                <div key={selo.texto} className="flex items-center gap-2">
                  <selo.icone className="h-3.5 w-3.5 shrink-0 text-accent-claro" />
                  <span className="text-2xs font-semibold leading-snug text-white/85 sm:text-xs">
                    {selo.texto}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
          {/* ===================== 2. VOCÊ RECONHECE ISTO ============== */}
          {/* TRÊS SEÇÕES VIRARAM UMA, e elas eram o mesmo movimento contado em
              três cabeçalhos: a dor do saldo ("o banco mente por omissão"), a
              `<Calculo />` que desenha a distância entre os dois números, e o
              `<ParaQuem />` com as sete frases de reconhecimento. Separadas,
              a pessoa recebia três vezes o convite a se reconhecer e respondia
              "sim" três vezes, cada uma com menos força que a anterior.

              A ORDEM INTERNA É PROMESSA → PROVA → DETALHE: o título nomeia a
              omissão, a `<Calculo />` mostra a conta que falta, e só então a
              pergunta "isso é comigo?" aparece por escrito. Perguntar isso
              ANTES da prova é perguntar para quem ainda não sabe do que se
              trata; perguntar dez seções depois é perguntar para quem já
              decidiu.

              ⚠️ A SEÇÃO MUDOU DE PEÇA CENTRAL UMA VEZ, E ISSO NÃO SE DESFAZ.
              Ela já foi: a dor em três linhas de um lado, o `ContaAberta` (três
              linhas e um resultado) flutuando sobre uma fotografia do outro, e
              o comparativo de duas colunas grudado no pé. Três argumentos
              diferentes dentro de uma seção só, e a tese da página — que o
              saldo e o disponível são números diferentes — cabendo numa coluna
              de 23rem no canto direito. Hoje a tese ocupa a largura inteira,
              desenhada.

              A FOTOGRAFIA FICOU, e ficou por cima e não por baixo: a cena da
              mesa com as contas espalhadas é o momento que o título descreve,
              e ela emoldura o título em vez de servir de fundo para um cartão
              branco.

              ⚠️ O `ParaQuem` TRAZ A PRÓPRIA `<section>` E O PRÓPRIO `<h2>`,
              e é por isso que ele pode conviver com o `<h2>` desta seção sem
              furar o sumário: dois `h2` IRMÃOS dentro da mesma seção anunciam
              duas seções para quem navega por leitor de tela; um `h2` dentro
              de uma `<section>` aninhada anuncia uma subseção, que é o que ele
              é. A mesma regra vale para o `<Pacote />`, na seção 7. */}
          <section className="pt-14 sm:pt-20">
            <div className="grid gap-8 lg:grid-cols-[1fr_minmax(0,22rem)] lg:items-center lg:gap-12">
              <div>
                {/* ÍCONE 3D 1 DE 6. A carteira com a seta é literalmente o
                    assunto desta seção: o que sobra, e para onde ele vai. Ela
                    está sobre o fundo claro da página, que é a única
                    superfície em que o corpo navy do desenho aparece. */}
                <Icone3D nome="carteira" tamanho={52} />
                <div className="mt-4">
                  <TituloSecao
                    centro={false}
                    titulo="O saldo do banco mente por omissão"
                    apoio="Ele mostra o que já saiu. Não mostra o aluguel do dia 5, a parcela do notebook que vai até dezembro nem a fatura que fecha semana que vem. A diferença entre os dois é o que estoura o mês."
                  />
                </div>
              </div>

              {/* ⚠️ Sem legenda, aqui e nas outras fotografias de pessoas da
                  página. O motivo está escrito em `Pessoas.tsx`. */}
              <div className="overflow-hidden rounded-3xl">
                <Pessoa
                  quem="casalPreocupado"
                  qualidade={62}
                  sizes="(max-width: 1024px) 100vw, 22rem"
                  className="aspect-[4/3]"
                />
              </div>
            </div>

            {/* A PEÇA TRAZ O PRÓPRIO CARTÃO BRANCO E A PRÓPRIA FRASE, e não
                traz título de seção: o nível de cabeçalho é decidido por quem
                encaixa, senão o sumário da página é furado por dentro de um
                componente. O título desta seção é o de cima. */}
            <Calculo className="mt-9" />

            {/* ⚠️ ESTA LINHA EXISTE PARA RESPONDER QUEM CONFERE, e ela é a
                correção de um resíduo publicado.

                O texto anterior dizia "Entraram R$ 7.184, saíram R$ 4.793" como
                explicação dos R$ 2.392 — e 7.184 menos 4.793 dá 2.391. Não é
                erro de digitação nem número inventado: os três valores estão
                assim, exatamente assim, na captura de `lancamentos-desktop.webp`,
                porque a tela arredonda CADA linha ao real antes de mostrar. A
                conta com centavos fecha (o salário da conta de demonstração é
                R$ 7.184,36, em `lib/fincash/demo.ts`); a conta com os três
                números já arredondados, não.

                Trocar um dos números para os dois "baterem" faria a página
                desmentir a própria captura, que está logo acima nesta mesma
                rolagem — e é a captura que manda. O que dava para consertar era
                o silêncio: quem subtrai os dois agora encontra a explicação no
                mesmo parágrafo, em vez de encontrar um erro. */}
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              Em setembro entraram R$ 7.184 e saíram R$ 4.793 nessa conta de
              demonstração. Cada linha da tela é arredondada ao real, e é por
              isso que a diferença aparece como R$ 2.392 e não como R$ 2.391.
            </p>

            {/* AS SETE FRASES SÃO DO JEFFERSON, sócio da casa, e estão
                literais dentro do componente. Elas ocupam o lugar da lista de
                três situações que vivia aqui: eram o mesmo trabalho — a pessoa
                se reconhecer — e dez itens de reconhecimento em sequência
                ensinam o olho a pular a segunda leva. */}
            <ParaQuem className="pt-12 sm:pt-16" />
          </section>

          {/* ============= 3. BANCO × PLANILHA × FINCASH ================ */}
          {/* Quando o comparativo tinha DUAS colunas ("app do banco ou
              planilha" contra FINCASH), ele repetia o argumento que a dor
              acabava de dar, e por isso morava grudado nela sem título. O de
              três colunas não repete nada: ele separa o banco da planilha, e
              cada um passa a ganhar onde de fato ganha (o banco tem o dado na
              fonte e não cobra nada; a planilha aceita qualquer formato e
              funciona com qualquer banco). Isso é assunto próprio, e assunto
              próprio tem cabeçalho próprio — é a única das dez que atravessou
              a reestruturação sem perder nem ganhar nada.

              ⚠️ O COMPARATIVO NÃO É UMA `<table>`, e isso está resolvido dentro
              do componente: três colunas de veredito não cabem em 390px, e
              `<table>` trata `width` como mínimo. Ele troca de FORMA por
              largura, com uma marcação só. A página nunca ganha rolagem
              lateral por causa dele.

              ⚠️ NENHUM ÍCONE 3D AQUI, de propósito: a peça desta seção é uma
              comparação de três colunas, e qualquer desenho grande no
              cabeçalho disputaria com ela a primeira leitura. Ícone entra onde
              NOMEIA o assunto; aqui o assunto já está nomeado três vezes, no
              alto de cada coluna. */}
          <section className="pt-14 sm:pt-20">
            <h2 className="max-w-3xl font-display text-3xl font-semibold leading-[1.12] tracking-tight text-primary sm:text-[2.6rem]">
              A culpa não é da sua disciplina
            </h2>
            <p className="mt-3.5 max-w-3xl text-base leading-relaxed text-muted-foreground">
              O extrato é um retrovisor: conta o que já aconteceu, quando não dá
              mais para decidir nada. A planilha faz a conta certa, mas cobra
              que você lembre de abrir, de repetir o aluguel todo mês e de
              inventar sozinho um método — e é por isso que a de janeiro quase
              nunca é aberta de novo em fevereiro.
            </p>

            <Comparativo className="mt-8" />
          </section>
          <FaixaComecar frase="A conta que falta é a do que ainda vai sair. O FINCASH faz essa conta desde o primeiro lançamento." />

          {/* ======================= 4. O PRODUTO, EM TELAS ============= */}
          {/* DUAS SEÇÕES VIRARAM UMA, e as duas abriam a MESMA promessa: que
              isto é um app inteiro, e não um formulário com nome. A primeira
              provava com a captura larga do painel; a segunda, com as telas
              agrupadas por peso de uso. Separadas por um cabeçalho, a pessoa
              lia "recursos" duas vezes e não somava as duas metades.

              A ORDEM INTERNA É PROMESSA → PROVA → DETALHE: o número de telas e
              o que o painel responde (promessa), a captura larga com as três
              leituras dela (prova), e então as telas por peso de uso, das duas
              que se abre antes de gastar às quatro de bastidor (detalhe).

              ⚠️ "DOZE TELAS" ERA FALSO E VIROU QUINZE. A conta foi refeita à
              mão: catorze subpastas com `page.tsx` em `src/app/fincash/app/`
              mais o painel da raiz. O número aparecia em quatro lugares desta
              página, e os quatro foram corrigidos — inclusive a lista da FAQ,
              que esquecia Meus dados, a ponte com o Planejamento e a tela do
              assistente.

              FAMÍLIA: foto larga com as leituras embaixo, e depois texto de um
              lado e foto do outro DUAS VEZES E PONTO. Com 21 capturas na
              pasta, esta é a armadilha fácil da página: dá para encher dez
              seções assim sem escrever uma frase nova, e a partir da terceira o
              olho já sabe o que vem e pula. */}
          <section className="pt-14 sm:pt-20">
            <TituloSecao
              sobre="Por dentro"
              titulo="Quinze telas, e a que você abre amanhã é esta"
              apoio="O número grande do topo não é quanto você gastou, porque isso é passado e passado não muda comportamento. É como o mês termina se nada mudar, já descontando o que ainda vai sair."
            />

            <div className="mt-9">
              <Foto
                tela="painelDesktop"
                aparelho="janela"
                barra="FINCASH · Painel de setembro"
                sizes="(max-width: 1024px) 100vw, 62rem"
              />
            </div>

            {/* As leituras da mesma imagem, na ordem em que o olho bate nela.
                Sem isto a foto vira enfeite: quem não usa o app não sabe que
                86% é renda comprometida e não porcentagem do mês.

                GRÁFICO VIVO 1 DE 3, e ele ocupa o lugar do card do meio. O
                velocímetro que estava chapado na captura passa a andar de zero
                até 86 quando entra na tela, com o entalhe dos 85% marcado na
                escala. É a mesma peça do app (`app/pecas.tsx`), não uma
                imitação: quem assinar vai reencontrar este desenho no painel,
                com o número dele no lugar do número da demonstração. */}
            {/* `fin-escada` NO `<ul>`, e não em cada `<li>`: a classe escalona
                a mesma `.surgir` da casa nos filhos, com atraso crescente. A
                lista aparece como uma leitura depois da outra, que é a ordem
                em que o olho bate na captura logo acima — e não como três
                cartões nascendo juntos.

                ⚠️ `shadow-subtle` SAIU DOS TRÊS. Duas sombras na mesma caixa
                não somam relevo: a mais fraca some dentro da mais forte e o
                que sobra é o custo de pintar as duas. O `fin-relevo` é a
                mesma escada de sombra do app, com o degrau de hover que o
                `shadow-subtle` não tem. */}
            <ul className="fin-escada mt-6 grid gap-4 sm:grid-cols-3">
              <li className="fin-relevo rounded-3xl border border-border bg-card p-5">
                <p className="font-display text-base font-semibold tabular-nums text-primary">
                  R$ 1.066
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  O que resta em setembro depois de tudo o que já saiu e do que
                  ainda está previsto sair. É o número da decisão de hoje.
                </p>
              </li>

              <li className="fin-relevo flex flex-col items-center justify-center rounded-3xl border border-border bg-card p-5">
                <MedidorRenda />
              </li>

              <li className="fin-relevo rounded-3xl border border-border bg-card p-5">
                {/* ⚠️ O "R$ 533" VEIO DE OUTRO LUGAR DA PÁGINA, e não é
                    enfeite: era a observação da segunda linha do `ContaAberta`
                    ("duas delas já venceram sem pagamento, R$ 533"), que saiu
                    quando a `<Calculo />` tomou o lugar daquela peça. O fato
                    continua verdadeiro e continua conferível na captura logo
                    acima — então ele mudou de lugar em vez de ser cortado. */}
                <p className="font-display text-base font-semibold tabular-nums text-primary">
                  2 contas atrasadas, R$ 533
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  O resumo do mês aponta o que venceu sem pagamento, com o valor
                  somado e o atalho para resolver, em vez de esperar você
                  procurar.
                </p>
              </li>
            </ul>

            {/* ── O QUE ERA A SEÇÃO "AS TELAS, DA DECISÃO AO BASTIDOR" ─────
                O TÍTULO DESCEU DE `h2` PARA `h3`, e só isso: dois `h2` irmãos
                na mesma seção fariam a estrutura do documento anunciar duas
                seções onde há uma. O tamanho caiu um degrau junto, para o olho
                ler o que a marcação passou a dizer — as telas são a segunda
                metade deste argumento, não um assunto novo. */}
            <div className="pt-12 sm:pt-16">
              <h3 className="max-w-3xl font-display text-[1.75rem] font-semibold leading-[1.12] tracking-tight text-primary sm:text-[2.2rem]">
                As telas que decidem o gasto de hoje, e as que sustentam o mês
              </h3>
              <p className="mt-3.5 max-w-3xl text-base leading-relaxed text-muted-foreground">
                Duas delas você abre antes de gastar; as outras três, uma vez
                por semana. Juntas são o produto que a assinatura entrega, e
                cada uma aparece aqui fotografada da mesma conta de
                demonstração.
              </p>

              <div className="mt-9 space-y-4">
                <article className="fin-relevo grid items-center gap-7 rounded-3xl border border-border bg-card p-6 sm:p-8 lg:grid-cols-[1fr_minmax(0,21rem)] lg:gap-12">
                  <div>
                    {/* ÍCONE 3D 2 DE 6, e ele SUBSTITUI o chip laranja com o
                        ícone de traço que morava aqui — não se soma a ele.
                        Dois emblemas para o mesmo assunto no mesmo canto é o
                        começo do catálogo de adesivos que esta página recusa.
                        O cartão é o assunto literal deste bloco, o fundo é
                        branco, e o desenho aparece inteiro. */}
                    <Icone3D nome="cartao" tamanho={48} />
                    <h4 className="mt-4 font-display text-xl font-semibold leading-snug text-primary sm:text-2xl">
                      A fatura deixa de ser surpresa
                    </h4>
                    {/* ⚠️ TRÊS FATOS, TRÊS ORAÇÕES, e nenhum deles saiu: o que a
                        fatura já comprometeu, quantas venceram, e o ciclo por
                        extenso. O que saiu foi o rodeio em volta deles. */}
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                      O susto não vem de esquecer uma compra: vem das parcelas
                      de três compras diferentes caindo no mesmo mês. A tela
                      abre com quanto falta pagar, quantas faturas venceram e
                      quanto do mês que vem já está comprometido antes de você
                      comprar qualquer coisa. O ciclo aparece por extenso: é a
                      única coisa do app cujo período não é o mês do calendário.
                    </p>
                  </div>
                  {/* COMPOSIÇÃO 2 DE 4: foto e tela LADO A LADO, alinhadas pela
                      base. A cena é alguém conferindo o celular no meio da
                      rotina, que é exatamente quando a pergunta "posso comprar
                      isto?" aparece; ao lado dela, a tela que responde.
                      Separadas por uma calha e não sobrepostas, porque aqui as
                      duas imagens têm o mesmo peso de argumento: uma é a hora,
                      a outra é a resposta.

                      A foto é a coluna estreita e alta (3:4): recorte de
                      retrato ao lado de um telefone dá duas peças verticais
                      irmãs, e a faixa larga brigaria com o formato do
                      aparelho. */}
                  <div className="grid grid-cols-2 items-end gap-3 sm:gap-5">
                    <div className="overflow-hidden rounded-xl">
                      <Pessoa
                        quem="cozinhaCelular"
                        sizes="(max-width: 1024px) 45vw, 10rem"
                        className="aspect-[3/4]"
                      />
                    </div>
                    <Foto
                      tela="cartoesCelular"
                      aparelho="telefone"
                      sizes="(max-width: 1024px) 45vw, 10rem"
                    />
                  </div>
                </article>

                <article className="fin-relevo grid items-center gap-7 rounded-3xl border border-border bg-card p-6 sm:p-8 lg:grid-cols-[minmax(0,26rem)_1fr] lg:gap-10">
                  {/* No desktop a foto vem primeiro; no celular ela cai para
                      baixo do texto, porque na tela pequena quem chega precisa
                      da frase antes da imagem, sempre. */}
                  <div className="order-2 lg:order-1">
                    <Foto
                      tela="orcamentoDesktop"
                      aparelho="janela"
                      barra="Orçamento de setembro"
                      sizes="(max-width: 1024px) 100vw, 26rem"
                    />
                  </div>
                  <div className="order-1 lg:order-2">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-tint text-accent-strong">
                      <Wallet className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <h4 className="mt-4 font-display text-xl font-semibold leading-snug text-primary sm:text-2xl">
                      O limite não é chute, e não é digitado duas vezes
                    </h4>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                      Antes de você escrever qualquer número, cada categoria
                      mostra o mínimo, a média e o máximo que você já gastou ali
                      nos últimos seis meses. O que é sempre igual você marca
                      como fixo e nunca mais digita. Quem passou do limite
                      aparece em vermelho com o quanto passou, e o topo já diz
                      quantas linhas estouraram.
                    </p>
                  </div>

                  {/* GRÁFICO VIVO 2 DE 3, atravessando as duas colunas por
                      baixo da captura e do texto. Ele responde a pergunta que a
                      captura ao lado não responde: para onde o dinheiro foi, em
                      proporção. O furo da rosca traz o mesmo total da imagem, e
                      esse total sobre a renda é o 86% do velocímetro logo
                      acima. É aí que as três peças de desenho da página deixam
                      de ser três enfeites e viram uma conta só.

                      ⚠️ A PEÇA MUDOU, O DADO NÃO. Era a `OrcamentoPorCategoria`
                      (dez fatias numeradas mandando o olho ir e voltar entre o
                      anel e a lista); é a `ParaOndeFoiOMes`, que nomeia a fatia
                      dominante DENTRO do desenho. As duas leem a mesma
                      `SETEMBRO` em `Graficos.tsx`, então o total é o mesmo e a
                      legenda abaixo continua verdadeira ao centavo. Quem
                      quiser trazer a antiga de volta: leia primeiro o aviso no
                      alto de `ParaOndeFoiOMes`, que proíbe as duas na mesma
                      página. */}
                  <figure className="order-3 rounded-3xl border border-border bg-gelo p-5 sm:p-6 lg:col-span-2">
                    <figcaption className="mb-4 text-sm leading-relaxed text-muted-foreground">
                      <b className="font-semibold text-foreground">
                        Para onde foram os R$ 6.718 de setembro.
                      </b>{" "}
                      É o mesmo total da captura desta seção, e ele sobre os R$
                      7.784 de renda prevista dá os 86% do velocímetro logo
                      acima.
                    </figcaption>
                    <ParaOndeFoiOMes />
                  </figure>
                </article>
              </div>

              {/* O TRIO DE TELEFONES: três telas que se abre uma vez por
                  semana, e não por dia, entram como vitrine, com uma frase
                  cada — quem chegou até aqui já entendeu o método e agora quer
                  medir a extensão do produto.

                  ⚠️ A ESCOLHA FOI GRADE, E NÃO ABAS, e a razão é estrutural
                  antes de ser estética: esta página não manda um byte de
                  JavaScript próprio para o navegador, e aba com estado o
                  exigiria. A alternativa sem script seria um `<details>` por
                  tela, que ESCONDE captura — e captura escondida numa landing
                  de app é a prova que ninguém abre. */}
              <div className="fin-escada mt-8 grid gap-8 sm:grid-cols-3">
                {[
                  {
                    tela: "lancamentosCelular" as const,
                    titulo: "Lançamentos",
                    texto:
                      "O gasto de hoje em segundos e um toque para marcar como pago. Previsto e realizado na mesma lista, com o que venceu sem pagamento escrito por extenso.",
                  },
                  {
                    tela: "metasCelular" as const,
                    titulo: "Metas",
                    texto:
                      "Quanto separar por mês para chegar na data, meta a meta, e a soma de todas contra a sua renda. Metas razoáveis demais somam meio salário e nenhuma acontece.",
                  },
                  {
                    tela: "investimentosCelular" as const,
                    titulo: "Investimentos",
                    texto:
                      "A carteira por classe e por instituição, com meses de reserva. Selic, CDI e IPCA vêm do Banco Central, e a tela diz de onde vieram.",
                  },
                ].map((v) => (
                  <div key={v.titulo}>
                    <div className="mx-auto w-full max-w-[13rem] sm:max-w-none">
                      <Foto
                        tela={v.tela}
                        aparelho="telefone"
                        sizes="(max-width: 640px) 208px, 20vw"
                      />
                    </div>
                    <h4 className="mt-5 font-display text-lg font-semibold text-primary">
                      {v.titulo}
                    </h4>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {v.texto}
                    </p>
                  </div>
                ))}
              </div>

              {/* As telas de bastidor, em linha. Lista curta e conferível vale
                  mais que quatro capturas a mais de tela sem número grande. */}
              <div className="fin-relevo mt-8 overflow-hidden rounded-3xl border border-border bg-card">
                {TELAS_LISTA.map((t) => (
                  <div
                    key={t.nome}
                    className="flex gap-4 border-b border-border/60 p-5 last:border-0 sm:gap-5 sm:p-6"
                  >
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/[0.06] text-primary">
                      <t.icone className="h-4 w-4" strokeWidth={1.75} />
                    </span>
                    <div className="min-w-0">
                      <h4 className="font-display text-base font-semibold text-primary">
                        {t.nome}
                      </h4>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {t.texto}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ============ 5. O FUTURO DO DINHEIRO: DÍVIDA E PROJEÇÃO ==== */}
          {/* O DIFERENCIAL DECLARADO DO PRODUTO, e por isso a única seção com
              forma exclusiva. No concorrente, dívida é um indicador solto no
              painel: quanto você deve. Aqui é um módulo com amortização Price e
              SAC, ordem de pagamento comparada e simulação de aporte extra.

              DÍVIDA E PROJEÇÃO eram duas seções porque são duas TELAS. São o
              mesmo MOTOR: o futuro do dinheiro que já está decidido. A
              amortização diz em que mês cai a última parcela; a projeção diz o
              que sobra nos doze meses depois de essa parcela e todas as outras
              saírem.

              A ORDEM INTERNA É PROMESSA → PROVA → DETALHE, e foi por isso que a
              `<DividaAteZerar />` entrou ONDE entrou: o título promete sair da
              dívida mais rápido, as duas estratégias explicam como, o desenho
              do saldo caindo até zerar PROVA que existe uma data — e só então
              vêm os detalhes (Price ou SAC, aporte extra, renda comprometida) e
              a captura da tela. Posto depois da captura, o gráfico viraria
              rodapé de uma seção que já tinha terminado.

              COMPOSIÇÃO 3 DE 4 (a fotografia), e é a única seção da página com
              DUAS imagens de naturezas diferentes no mesmo cartão, que é o
              privilégio que o diferencial do produto merece: a faixa de 21:9
              abre, porque dívida é a conversa que duas pessoas têm com os
              papéis na mão, e a captura FECHA, entrando pelo pé do cartão e
              sendo cortada pela borda dele.

              ⚠️ O CORTE É O QUE IMPEDE A REPETIÇÃO. Posta inteira num quadro,
              a captura daria a mesma família de "texto e tela lado a lado" que
              a seção 4 já usa duas vezes em sequência.

              As duas estratégias são o argumento inteiro em duas colunas, e as
              frases são as mesmas do produto (`EXPLICACAO_ESTRATEGIA`, em
              lib/fincash/dividas.ts): a landing não pode ser mais otimista que
              a tela que a pessoa vai abrir depois de assinar. */}
          <section className="pt-14 sm:pt-20">
            <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-subtle">
              <Pessoa
                quem="casalContas"
                qualidade={62}
                sizes="(max-width: 1024px) 100vw, 62rem"
                className="aspect-[16/9] sm:aspect-[21/9]"
              />

              <div className="p-6 sm:p-9">
                <div className="max-w-2xl">
                  {/* ÍCONE 3D 3 DE 6: a corrente partida, sobre o branco do
                      cartão. Substitui o chip com o `TrendingDown` de traço que
                      morava aqui — e não se soma a ele. */}
                  <Icone3D nome="divida" tamanho={52} />
                  {/* ⚠️ O TÍTULO ERA UMA COMPARAÇÃO, E VIROU UM VERBO.
                      Dizia "Dívida aqui não é um número no painel, é um plano
                      de saída" — uma frase sobre a diferença entre este app e o
                      concorrente, que é assunto do comparativo e não daqui.
                      Quem chega nesta seção não quer saber o que o FINCASH não
                      é; quer sair da dívida. O título do Jefferson (11/09/2026)
                      diz isso com um verbo e um advérbio: SAIR, e MAIS RÁPIDO.

                      As três frases dele entraram inteiras, e o que elas
                      substituíram foi a versão em torneio da mesma ideia.
                      Nenhum fato saiu: a ordem de pagamento, o juro de cada
                      ordem, o mês da última parcela, Price e SAC, e as duas
                      estratégias lado a lado continuam no parágrafo. */}
                  <h2 className="mt-4 font-display text-2xl font-semibold leading-tight text-primary sm:text-[2rem]">
                    Saiba como sair das dívidas mais rápido
                  </h2>
                  <p className="mt-3.5 text-base leading-relaxed text-muted-foreground">
                    Não basta saber quanto você deve. O FINCASH transforma a sua
                    dívida em um plano de saída: em que ordem pagar, quanto de
                    juro cada ordem custa e em que mês cai a última parcela.
                    Cada dívida é amortizada parcela a parcela, em Price ou SAC,
                    e as duas estratégias que funcionam ficam lado a lado, com o
                    preço de cada uma.
                  </p>
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl border border-primary/20 bg-gelo p-5">
                    <p className="font-display text-lg font-semibold text-primary">
                      Avalanche
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      Ataca primeiro a dívida de maior juro. É a que custa menos
                      dinheiro, e pode demorar a dar a primeira vitória.
                    </p>
                    <p className="mt-4 border-t border-border pt-3 text-xs font-semibold text-primary">
                      Sai mais barato
                    </p>
                  </div>

                  <div className="rounded-3xl border border-accent-soft bg-accent-tint p-5">
                    <p className="font-display text-lg font-semibold text-primary">
                      Bola de neve
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      Ataca primeiro o menor saldo. Custa um pouco mais de juro,
                      mas elimina uma dívida cedo, e é isso que sustenta o
                      hábito de quem já desistiu antes.
                    </p>
                    <p className="mt-4 border-t border-accent-soft pt-3 text-xs font-semibold text-accent-strong">
                      Termina uma dívida antes
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  A tela diz, em reais, quanto a avalanche economiza de juro e
                  quantos meses ela adianta, e também em quanto tempo cada uma
                  derruba a primeira dívida. Escolher a mais cara continua sendo
                  uma escolha legítima: o app mostra o preço e deixa a decisão
                  com você.
                </p>

                {/* ══ A PEÇA NOVA: O SALDO DEVEDOR ATÉ ZERAR ═══════════════
                    É a única peça da página inteira que mostra o produto
                    entregando ALÍVIO em vez de medir: as outras dizem quanto
                    comprometeu, quanto passou do plano, quanto sobra — e medir
                    é o que todo concorrente faz. Esta diz a DATA em que a coisa
                    termina, e é por isso que ela vale a largura toda do cartão.

                    ⚠️ OS NÚMEROS NÃO SÃO DESENHADOS A OLHO. Saem do motor de
                    verdade (`simularEstrategia()`, em lib/fincash/dividas.ts),
                    com aporte extra ZERO e estratégia avalanche, sobre as três
                    dívidas da conta de demonstração — e foram conferidos contra
                    a captura que fecha esta mesma seção em três números
                    independentes. O caminho está escrito por extenso no
                    comentário da peça.

                    ⚠️ A LEGENDA DELA NÃO PODE SAIR, e ela vem de dentro do
                    componente: a mesma captura logo abaixo diz, em letra
                    grande, "no ritmo de hoje não há data de saída". As duas
                    frases são verdadeiras ao mesmo tempo, e a diferença entre
                    elas é o produto inteiro — o plano não paga mais, ele só não
                    deixa cair o valor pago. Sem essa legenda, o desenho passa a
                    prometer que o app quita dívida, que é coisa que app nenhum
                    faz. */}
                <div className="mt-8 rounded-3xl border border-border bg-gelo p-5 sm:p-6">
                  <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                    <b className="font-semibold text-foreground">
                      As mesmas três dívidas, com um plano em cima delas.
                    </b>{" "}
                    O desenho abaixo é o saldo devedor da conta de demonstração
                    mês a mês, com a parcela de hoje e nenhum centavo a mais.
                  </p>
                  <DividaAteZerar />
                </div>

                <dl className="mt-7 grid gap-4 border-t border-border pt-6 sm:grid-cols-3">
                  {[
                    {
                      t: "Price ou SAC",
                      d: "Parcela fixa ou amortização fixa com a parcela caindo mês a mês. A tabela sai parcela a parcela, com juro e amortização separados.",
                    },
                    {
                      t: "Aporte extra",
                      d: "Quanto um valor a mais por mês corta de juro e antecipa a última parcela. É simulação, e não grava nada.",
                    },
                    {
                      t: "Renda comprometida",
                      d: "Quanto do que entra já vai para dívida hoje, e quanto de juro você ainda vai pagar até a última parcela se nada mudar.",
                    },
                  ].map((i) => (
                    <div key={i.t}>
                      <dt className="font-display text-base font-semibold text-primary">
                        {i.t}
                      </dt>
                      <dd className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                        {i.d}
                      </dd>
                    </div>
                  ))}
                </dl>

                {/* A CAPTURA QUE FECHA O CARTÃO.
                    Os números da legenda saem TODOS da imagem ao lado dela, e é
                    por isso que eles estão escritos: a seção passou a página
                    inteira afirmando que o app faz uma conta que o concorrente
                    não faz, e um visitante atento confere um número antes de
                    acreditar numa promessa.

                    A ALTURA FIXA É O CORTE. A janela tem a largura do cartão e
                    a moldura recorta o que passa dela, então a tela continua
                    para fora da peça em vez de caber inteira num quadro.
                    `top-0` porque o que importa está no alto: o alarme
                    vermelho, o quanto se deve e o velocímetro da renda.

                    ⚠️ `sizes` MENOR QUE A LARGURA DO CARTÃO de propósito. A
                    janela é a peça mais larga da seção, mas a imagem servida
                    não precisa da largura do contêiner: no celular o corte
                    mostra meia tela, e pedir 100vw traria o dobro do arquivo
                    para desenhar o mesmo pedaço. */}
                <figure className="-mx-6 -mb-6 mt-9 border-t border-border bg-gelo px-6 pt-7 sm:-mx-9 sm:-mb-9 sm:px-9 sm:pt-9">
                  <figcaption className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                    <b className="font-semibold text-foreground">
                      A tela avisa antes de consolar.
                    </b>{" "}
                    Nesta conta de demonstração o rotativo do cartão custa R$
                    502,79 de juro no mês e a parcela paga é de R$ 468,35, então
                    o saldo sobe mesmo com a parcela em dia. É a primeira coisa
                    que a tela diz, com o valor exato que faz a dívida parar de
                    crescer.
                  </figcaption>
                  {/* DUAS CAPTURAS, UMA POR LARGURA, e a escondida não custa
                      nada: `display:none` nunca entra em viewport, então o
                      `loading="lazy"` do Next jamais busca o arquivo. Quem abre
                      no celular baixa só o telefone, quem abre no computador só
                      a janela.

                      E é obrigatório: a tela de 1440 reduzida a 330 pixels de
                      largura vira um borrão de números que ninguém lê, e a
                      captura existe justamente para ser conferida. O app muda
                      de layout de verdade abaixo de `md` (o trilho lateral vira
                      barra do polegar), então a foto do celular não é a mesma
                      imagem menor: é a outra tela. */}
                  <div className="relative mx-auto mt-6 h-[22rem] max-w-3xl overflow-hidden sm:hidden">
                    <div className="absolute inset-x-0 top-0 mx-auto w-52">
                      <Foto
                        tela="dividasCelular"
                        aparelho="telefone"
                        sizes="208px"
                      />
                    </div>
                  </div>

                  <div className="relative mx-auto mt-6 hidden max-w-3xl overflow-hidden sm:block sm:h-80 lg:h-[26rem]">
                    <div className="absolute inset-x-0 top-0">
                      <Foto
                        tela="dividasDesktop"
                        aparelho="janela"
                        barra="FINCASH · Dívidas"
                        sizes="(max-width: 1024px) 88vw, 44rem"
                      />
                    </div>
                  </div>
                </figure>
              </div>
            </div>

            {/* ── A PROJEÇÃO, QUE ERA A SEÇÃO SEGUINTE ────────────────────
                ⚠️ NADA FOI CORTADO NA JUNÇÃO. A composição da fotografia como
                palco, o gráfico vivo dos doze meses com a legenda que assume a
                proporção das colunas e o parágrafo do primeiro mês negativo
                continuam inteiros, na mesma ordem.

                O TÍTULO DESCEU DE `h2` PARA `h3`, e só isso: dois `h2` irmãos
                na mesma seção fariam a estrutura do documento anunciar duas
                seções onde há uma. O tamanho caiu um degrau junto, para o olho
                ler o que a marcação passou a dizer — a projeção é a segunda
                metade deste argumento, não um assunto novo.

                A FORMA CONTINUA SENDO A QUE ELA TINHA: foto larga com a
                leitura só em texto. Repetir aqui o trio de cartões da seção 4
                faria as duas virarem a mesma seção duas vezes. */}
            <div className="pt-12 sm:pt-16">
              <div className="max-w-2xl">
                {/* ÍCONE 3D 4 DE 6, e é o SEGUNDO desta seção — a exceção à
                    regra de um por seção, e ela tem motivo: esta seção é uma
                    FUSÃO de dois assuntos, cada um com título próprio, e o
                    ícone é justamente o que avisa o olho de que começou o
                    segundo. Sem ele, a projeção lê como continuação da dívida,
                    que é o defeito que a fusão poderia ter introduzido. */}
                <Icone3D nome="projecao" tamanho={48} />
                {/* ⚠️ ERA "VER EM SETEMBRO COMO O ANO TERMINA", que descrevia a
                    MECÂNICA da tela (escolhe um mês, olha para a frente). As
                    duas frases do Jefferson, de 11/09/2026, dizem o que a
                    pessoa ganha com isso, e a segunda nomeia a pergunta que
                    ninguém faz em voz alta: o meu dinheiro vai dar?

                    ⚠️ O QUE SAIU FOI "todo app de finanças mostra o que já
                    aconteceu", e saiu por redundância e não por ser falso: é
                    exatamente a primeira linha do comparativo de três colunas,
                    duas seções acima, onde o banco leva "Sim" e é o único lugar
                    em que ele leva. */}
                <h3 className="mt-4 font-display text-[1.75rem] font-semibold leading-[1.12] tracking-tight text-primary sm:text-[2.2rem]">
                  Veja o futuro financeiro antes que ele aconteça
                </h3>
                <p className="mt-3.5 text-base leading-relaxed text-muted-foreground">
                  Saiba antecipadamente se o seu dinheiro será suficiente para
                  os seus compromissos e objetivos. A tela projeta os doze meses
                  seguintes com o que você já cadastrou: as contas fixas, as
                  parcelas em aberto e os aportes das metas. Saldo positivo o
                  ano inteiro não é o mesmo que folga — por isso o destaque é o
                  menor saldo do período, o mês em que um imprevisto doeria
                  mais.
                </p>
              </div>

              {/* COMPOSIÇÃO 4 DE 4: a foto vira PALCO e a tela pousa em cima
                  dela. É a composição mais cara da página, e por isso está na
                  seção que vale mais: planejar doze meses é a promessa grande,
                  e aqui a cena de alguém sentado com o notebook em casa e a
                  tela do produto aparecem no mesmo enquadramento, que é o que
                  as outras três não fazem.

                  O navy por cima da foto é obrigatório, não estético: a captura
                  é clara e cheia de números miúdos, e sem escurecer o fundo a
                  textura da fotografia atravessaria a borda da moldura e comeria
                  a legibilidade do gráfico que a página está pedindo para a
                  pessoa ler. */}
              <div className="relative mt-8 overflow-hidden rounded-3xl">
                <Pessoa
                  quem="mesaNotebook"
                  qualidade={50}
                  sizes="(max-width: 1024px) 100vw, 62rem"
                  className="absolute inset-0 h-full"
                />
                {/* O véu é o ajuste fino desta composição: opaco esconde a
                    fotografia e não sobra palco nenhum, transparente demais e a
                    textura da cena atravessa a borda da moldura e come os
                    números da captura. 55% é onde a cena ainda se lê e a tela
                    continua sendo a coisa mais nítida do bloco. */}
                <span aria-hidden className="absolute inset-0 bg-primary/55" />
                {/* A respiração generosa é o que faz a composição existir: com
                    quatro pixels de margem a fotografia vira uma borda e a peça
                    lê como moldura escura qualquer. O ar em volta é onde a cena
                    aparece. */}
                <div className="relative px-5 py-10 sm:px-10 sm:py-14 lg:px-16 lg:py-20">
                  <Foto
                    tela="projecaoDesktop"
                    aparelho="janela"
                    barra="Projeção · próximos 12 meses"
                    sizes="(max-width: 1024px) 88vw, 48rem"
                  />
                </div>
              </div>

              {/* GRÁFICO VIVO 3 DE 3. A captura acima mostra a curva do saldo;
                  este desenho mostra o que a curva esconde, que é a sobra de
                  cada mês, coluna por coluna.

                  ⚠️ AS COLUNAS SÃO BAIXAS, E ISSO NÃO É DEFEITO. Elas dividem a
                  régua com um saldo de quarenta e oito mil, então três mil de
                  sobra viram um filete. A tentação seria dar um segundo eixo às
                  colunas para elas ficarem bonitas, e é exatamente o gráfico
                  mais desonesto que existe: quem desenha passa a escolher onde
                  a curva cruza a barra. A peça se recusa a fazer isso, e a
                  legenda abaixo assume a proporção em vez de disfarçá-la. */}
              <figure className="mt-4 rounded-3xl border border-border bg-card p-5 shadow-subtle sm:p-6">
                <figcaption className="mb-4 text-sm leading-relaxed text-muted-foreground">
                  <b className="font-semibold text-foreground">
                    Os doze meses da mesma projeção.
                  </b>{" "}
                  A coluna é o que sobra em cada mês e a curva é o saldo
                  acumulado, os dois na mesma régua. Cada mês empurra pouco, e é
                  a repetição que leva o saldo de R$ 14.991 a R$ 48.847.
                  Dezembro é o único que tira em vez de pôr, e por isso vira
                  para baixo, em vermelho.
                </figcaption>
                <ProjecaoDozeMeses />
              </figure>

              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Quando algum mês fecha no vermelho, ele é marcado como o
                primeiro mês negativo, e esse é o aviso que chega enquanto ainda
                dá para cancelar uma assinatura ou adiar uma compra. Tocar num
                mês abre a conta dele, linha por linha, e o simulador de
                hipóteses não grava nada.
              </p>
            </div>
          </section>

          <FaixaComecar frase="Dívida com data de fim e doze meses à frente: o app calcula os dois com o que você já cadastrou." />

          {/* ==================== 6. DIRETO NO WHATSAPP ================= */}
          {/* ⚠️ A SEÇÃO MAIS DELICADA DA PÁGINA, e agora também a mais alta.

              O assistente é o item que mais separa a Novare do concorrente
              mais direto, que cobra a mais para ter o mesmo. E é o único que
              ainda não está de pé inteiro: o interpretador, o vínculo do
              número e a tela existem, a linha oficial da Meta não.

              ── A SEGURANÇA ENTROU AQUI, E O MOTIVO É A ORDEM DA DÚVIDA ────
              Ela era seção própria, logo abaixo. O bloco navy acima acaba de
              dizer que um assistente vai ler as suas mensagens, os seus áudios
              e as fotos dos seus comprovantes: é o ponto EXATO da página em que
              alguém pensa "espera, quanto desta minha vida vocês pegam?".
              Separada por um cabeçalho, a resposta chegava depois que a
              pergunta já tinha passado. Colada, ela responde na pergunta.
              Nenhuma das quatro recusas foi reescrita, e a caixa que admite
              que a equipe LÊ os seus lançamentos continua palavra por palavra.

              ── POR QUE O ASSISTENTE VIROU UM BLOCO NAVY ──────────────────
              Ele estava do mesmo tamanho visual que "Contas fixas": card
              branco, título de 2xl, uma foto ao lado. O argumento mais forte
              da página tinha o peso de um item de lista. O navy não é um
              segundo tema: é a mesma moldura do herói e do CTA final, que a
              página já usa duas vezes para dizer "isto aqui é o produto". A
              terceira vez é para dizer "isto aqui é o produto onde você já
              vive".

              ⚠️ ISSO NÃO AUTORIZA UM SEGUNDO ACENTO. Dentro do navy o laranja
              continua sendo o único destaque, e branco continua sendo texto
              sobre navy, nunca sobre laranja.

              ⚠️ E É POR SER A MAIS PERSUASIVA QUE ELA É A MAIS PERIGOSA. A
              conversa é composição, não print de um número que responde hoje.
              A pastilha "Construído, ainda não ligado" e a linha de ressalva
              ficam COLADAS na imagem, dentro do mesmo bloco: separadas por uma
              coluna, a imagem viaja em print, em story e em anúncio sem a
              ressalva junto, e aí a página passa a prometer o que não entrega.

              ⚠️ E A RESSALVA VALE PARA A LISTA INTEIRA, incluindo áudio e
              foto. A tentação era marcar as duas como "em breve" e deixar o
              resto parecendo pronto; a verdade é que nada responde hoje, porque
              falta credencial da Meta, e uma lista em dois tons ensina a ler a
              ressalva como enfeite do item fraco. Quando a linha for ligada,
              sai a pastilha, sai a linha de ressalva, e não sai mais nada. */}
          <section className="pt-14 sm:pt-20">
            <div
              className="fin-palco relative isolate overflow-hidden rounded-3xl p-6 text-white sm:p-10"
              style={PALCO_NAVY}
            >
              {/* O CABEÇALHO DA SEÇÃO, e ele é o único lugar da página em que
                  dois ícones aparecem somados.

                  Os dois selos com o "+" no meio não são enfeite: eles contam
                  a peça inteira antes da primeira frase ser lida, que é o que
                  um título de duas linhas sozinho não consegue. O interpretador
                  fica de um lado, o aplicativo onde ele mora fica do outro, e a
                  soma é o produto. Quem só passa o olho já entendeu. */}
              <div className="flex items-center gap-3">
                {/* O EMBLEMA DO INTERPRETADOR, e ele é arquivo, não ícone de
                    biblioteca: `public/fincash/ia.svg`, desenhado para este
                    par. Um ícone genérico de "brilho" dizia inteligência com o
                    vocabulário de qualquer app; o emblema tem a superfície de
                    um produto, e é isso que o põe no mesmo nível do selo do
                    WhatsApp ao lado, em vez de um degrau abaixo.

                    ⚠️ `unoptimized` é obrigatório, não preguiça: o otimizador
                    de imagem do Next recusa SVG por padrão (é executável de
                    fato, e liberar isso seria mexer na configuração do site
                    inteiro por causa de um emblema de 1,5 kB). Assim o arquivo
                    é servido direto de `public`, sem passar por `/_next/image`
                    — e SVG não tem o que otimizar. */}
                <Image
                  src="/fincash/ia.svg"
                  alt=""
                  width={44}
                  height={44}
                  unoptimized
                  className="h-11 w-11 rounded-xl ring-1 ring-white/15"
                />
                <span
                  aria-hidden
                  className="font-display text-xl font-medium text-white/40"
                >
                  +
                </span>
                {/* ÍCONE 3D 5 DE 6, E O ÚNICO SOBRE NAVY DA PÁGINA INTEIRA —
                    por isso ele vem em `chip`, dentro de um quadrado branco. O
                    corpo do desenho é navy: solto aqui, ele sumiria no fundo e
                    sobrariam o microfone e a câmera laranja boiando. O chip
                    também é o que o mantém do mesmo tamanho do emblema do
                    interpretador, ao lado, e a soma só se lê se as duas metades
                    tiverem o mesmo peso.

                    ⚠️ E O DESENHO NÃO É GENÉRICO: é um balão com microfone e
                    câmera, que é exatamente o que esta seção promete (lançar
                    por áudio e por foto do comprovante) e exatamente o que a
                    pastilha logo abaixo diz que ainda não responde. */}
                <Icone3D nome="chat" tamanho={32} chip />
              </div>

              {/* ESCALA, e é onde esta seção ganha presença sem trocar de
                  fonte. Sora em 500 e `tracking-tight` num tamanho que chega a
                  3,25rem no desktop: o título de seção mais alto da página
                  depois do herói, e pela mesma razão do herói. Peso 500, não
                  800, porque em corpo grande o negrito fecha a contraforma das
                  letras e vira anúncio; leve e grande lê como publicação. */}
              <h2 className="mt-6 max-w-2xl font-display text-[1.9rem] font-medium leading-[1.08] tracking-tight sm:text-[2.6rem] lg:text-[3.25rem]">
                O gasto de hoje cabe
                <br className="hidden sm:block" />{" "}
                <span className="font-semibold text-accent-claro">
                  numa mensagem
                </span>
                .
              </h2>

              {/* A DOR EM TEXTO CORRIDO, e não em bullet.

                  A frase descreve um momento contínuo (sair do restaurante,
                  não abrir o app, esquecer), e momento contínuo picado em três
                  tiques deixa de ser cena e vira especificação. É a única
                  caixa de texto puro da seção, e ela existe para a lista de
                  capacidades logo abaixo chegar depois do problema, e não
                  antes. */}
              <p className="mt-6 max-w-2xl rounded-2xl bg-white/[0.06] p-5 text-sm leading-relaxed text-white/75 ring-1 ring-white/10 sm:text-base">
                O gasto que some é sempre o mesmo: o do almoço de terça, o da
                farmácia na volta para casa, o do Uber que você pegou com
                pressa. Ninguém abre um aplicativo de finanças na fila do caixa.
                O WhatsApp, esse você já abriu quatro vezes hoje.
              </p>

              <div className="mt-10 space-y-12">
                {/* ── A PEÇA DO ASSISTENTE ────────────────────────────────
                    Antes daqui viviam uma fotografia em coluna estreita e três
                    balões em HTML flutuando por cima dela. Entraram no lugar de
                    uma peça única, montada fora, que já traz o aparelho, a
                    conversa e os balões no mesmo arquivo — e por isso ela ocupa
                    a largura inteira do bloco, e não um terço dele: a 25rem o
                    texto que ela carrega não se lê.

                    ⚠️ O TEXTO DESTA IMAGEM NÃO EXISTE PARA O SITE. Título,
                    recursos e balões estão rasterizados: leitor de tela não lê,
                    busca não indexa e tradutor não traduz. É por isso que a
                    lista de capacidades logo abaixo CONTINUA em HTML e continua
                    completa — ela não é repetição da imagem, ela é a única
                    versão que a máquina enxerga. Quem apagar a lista por achar
                    que "a imagem já diz" apaga a seção inteira aos olhos do
                    Google e de quem navega por leitor.

                    ⚠️ O `overflow-x-auto` não é descuido de layout. A peça é um
                    infográfico de 1536px; espremida em 390px cada item viraria
                    uma linha de 4px de altura. Abaixo de `sm` ela mantém 40rem
                    e arrasta na horizontal, que é como infográfico se lê no
                    celular. O contêiner é quem rola, nunca a página.

                    ⚠️ A pastilha e a ressalva continuam COLADAS na peça, e pela
                    mesma razão de antes: a conversa é composição, e a imagem
                    viaja em print e em story sem a coluna de texto junto. */}
                <figure className="relative">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80 ring-1 ring-white/15">
                    <Smartphone className="h-3.5 w-3.5" />
                    Construído, ainda não ligado
                  </span>

                  <div className="mt-4 overflow-x-auto overflow-y-hidden rounded-2xl bg-white ring-1 ring-white/10">
                    <Image
                      src="/fincash/whatsapp-peca.webp"
                      width={1536}
                      height={1024}
                      alt="Peça do assistente do FINCASH no WhatsApp. Uma mão segura um celular com a conversa aberta: o assistente se apresenta, a pessoa pede “quero ver meus gastos deste mês” e recebe um resumo de R$ 2.480,00, 12% abaixo do mês passado, repartido em Moradia 42%, Alimentação 28%, Transporte 15%, Lazer 10% e Outros 5%. Ao redor, cinco recursos: registro por foto do comprovante, registro por áudio, registro por texto, consulta instantânea de saldos e metas, e lembretes semanais das contas a vencer."
                      sizes="(max-width: 640px) 40rem, (max-width: 1024px) 92vw, 64rem"
                      className="h-auto w-[40rem] max-w-none sm:w-full"
                    />
                  </div>

                  {/* A dica de arrastar existe só onde há o que arrastar.
                      `sm:hidden` e não um gradiente na borda: gradiente sugere
                      corte para quem vê, e não diz nada para quem não vê. */}
                  <p
                    aria-hidden
                    className="mt-2 text-2xs text-white/45 sm:hidden"
                  >
                    Arraste a imagem para o lado para ver a peça inteira.
                  </p>

                  <figcaption className="mt-5 max-w-3xl text-2xs leading-snug text-white/60">
                    Conversa de demonstração, montada com as frases que o
                    interpretador já reconhece e com os números da conta de
                    exemplo. A linha oficial do WhatsApp ainda não está ligada,
                    e nada nesta seção responde hoje.
                  </figcaption>
                </figure>

                {/* A LISTA DE CAPACIDADES, com o ícone à esquerda.

                    Duas colunas a partir de `sm` porque são nove linhas, e
                    nove linhas empilhadas numa coluna só viram um rolar longo
                    que a pessoa abandona no sexto item. O exemplo vem embaixo
                    do título em mono: é o que ela vai digitar, e texto que se
                    digita tem de parecer texto que se digita.

                    ⚠️ OS NOVE ÍCONES AQUI CONTINUAM SENDO DE TRAÇO, e nenhum
                    dos seis 3D encosta nesta lista: são nove itens em duas
                    colunas, e nove adesivos tridimensionais no mesmo bloco
                    trocariam uma lista de capacidades por uma cartela de
                    figurinhas. O 3D desta seção é UM, no cabeçalho, e ele
                    nomeia o assunto inteiro. */}
                <div>
                  <h3 className="font-display text-lg font-semibold tracking-tight text-white">
                    O que dá para fazer por lá
                  </h3>

                  <dl className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2">
                    {CAPACIDADES.map((c) => (
                      <div key={c.titulo} className="flex gap-3">
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/10 text-accent-claro ring-1 ring-white/10">
                          <c.icone className="h-4 w-4" strokeWidth={1.75} />
                        </span>
                        <div>
                          <dt className="font-display text-sm font-semibold leading-snug text-white">
                            {c.titulo}
                          </dt>
                          <dd className="mt-1 text-xs leading-relaxed tabular-nums text-white/60">
                            {c.exemplo}
                          </dd>
                        </div>
                      </div>
                    ))}
                  </dl>

                  {/* O BLOCO DE FECHAMENTO, e ele fecha pelo avesso.

                      É o único lugar da seção com fundo de acento, e o que
                      está escrito nele é o que o assistente NÃO faz. A escolha
                      é deliberada: o espaço mais destacado de uma seção de
                      venda normalmente carrega a promessa maior, e aqui ele
                      carrega a borda. Quem lê isto antes de assinar não é
                      surpreendido depois, e num app de dinheiro a surpresa
                      custa a assinatura inteira. */}
                  <div className="mt-8 rounded-2xl bg-accent-btn/15 p-5 ring-1 ring-accent-claro/25">
                    <p className="font-display text-sm font-semibold text-accent-claro">
                      E o que ele devolve como pergunta, em vez de gravar
                    </p>
                    <dl className="mt-3 space-y-2.5">
                      {NAO_FAZ.map((n) => (
                        <div key={n.frase} className="sm:flex sm:gap-3">
                          <dt className="font-mono text-xs font-semibold text-white/80 sm:w-40 sm:shrink-0">
                            {n.frase}
                          </dt>
                          <dd className="mt-0.5 text-xs leading-relaxed text-white/60 sm:mt-0">
                            {n.porque}
                          </dd>
                        </div>
                      ))}
                    </dl>
                    <p className="mt-3.5 border-t border-white/10 pt-3 text-xs leading-relaxed text-white/60">
                      É a regra da casa, e vale também para a foto e para o
                      áudio: quando ele não tem certeza do valor, ele pergunta.
                      Registro errado gravado calado custa mais caro que uma
                      mensagem a mais.
                    </p>
                  </div>

                  {/* A LINHA DE ESTADO, escrita por extenso e sem "em breve".
                      "Em breve" é uma data que ninguém assina; o que está aqui
                      é o que falta, de quem depende e o que a pessoa paga por
                      isso, que é nada.

                      ⚠️ ERA `white/55`, e era a única reprova de contraste da
                      página inteira no axe: 4,34:1 a 13px, contra os 4,5:1 que
                      a régua pede. O parágrafo mais honesto da landing, aquele
                      que admite o que ainda não está pronto, não pode ser o
                      único que alguém não consegue ler. A 65% dá 5,4:1 e
                      continua secundário. */}
                  <p className="mt-6 text-xs leading-relaxed text-white/65">
                    Dentro do app já existem o interpretador, a tela do
                    assistente e o vínculo do seu número, confirmado por um
                    código de dez minutos que você manda pelo WhatsApp. Falta
                    plugar a linha oficial, e essa parte não depende de código.
                    Enquanto ela não estiver no ar, você não paga nada a mais
                    por isso, e não vai encontrar esta promessa marcada como
                    pronta em lugar nenhum desta página. Quando ligar, entra
                    para quem já assina.
                  </p>
                </div>
              </div>
            </div>

            {/* ── A SEGURANÇA, QUE ERA A SEÇÃO 11 ─────────────────────────
                ⚠️ O FATO DELA NÃO É NOVO: ele estava enterrado. "Nenhuma conta
                bancária conectada" era o item DO MEIO de uma lista de três
                declarações, entre "zero comissão" e "uma mensalidade". É o
                argumento que mais separa este app de todo concorrente que exige
                Open Finance, e ele tinha peso de nota de rodapé. Pedido do
                Jefferson em 11/09/2026: destaque próprio. A frase do título é
                dele, palavra por palavra.

                ⚠️ E ELA É UMA PROMESSA NEGATIVA, o tipo mais fácil de
                desmentir: basta UMA tela pedindo senha de banco para a página
                inteira virar mentira. As quatro linhas foram conferidas contra
                o produto antes de subirem — não existe campo de senha bancária
                no FINCASH, não existe integração de Open Finance nem agregador,
                e nada busca movimentação no fundo. A FAQ desta mesma página
                responde as três do mesmo jeito, e é de propósito: promessa que
                muda de tamanho entre a vitrine e a resposta é promessa
                quebrada.

                ⚠️ A QUARTA LINHA NÃO É UM "SEM", E ESSE É O PONTO DELA. Três
                recusas seguidas fazem a pessoa concluir que vai digitar o
                extrato inteiro à mão, e a conclusão é falsa: o OFX que o banco
                exporta entra pela tela de importação. Vender a segurança
                escondendo o custo dela seria a mesma desonestidade, ao
                contrário.

                O TÍTULO DESCEU DE `h2` PARA `h3` na fusão, e nada mais mudou:
                dois `h2` irmãos na mesma seção anunciariam duas seções para
                quem navega por leitor de tela.

                FAMÍLIA DE LAYOUT: declaração larga com quatro travas em filete,
                a mesma da fita da ponte — e de propósito: as duas fazem o mesmo
                trabalho, que é LIMITAR uma promessa, e limite não pede cartão
                com sombra. */}
            <div className="pt-12 sm:pt-16">
              <div className="fin-relevo rounded-3xl border border-border bg-card p-6 sm:p-9">
                {/* ÍCONE 3D 6 DE 6: o escudo com fechadura, sobre o branco do
                    cartão. Substitui o chip com o cadeado de traço que morava
                    aqui. Ele é o único 3D que sobrevive ao vizinho navy logo
                    acima justamente porque NÃO está sobre ele. */}
                <Icone3D nome="escudo" tamanho={52} />

                <h3 className="mt-5 max-w-2xl font-display text-2xl font-semibold leading-tight tracking-tight text-primary sm:text-[2rem]">
                  Seus dados financeiros continuam sob o seu controle
                </h3>

                <p className="mt-3.5 max-w-2xl text-base leading-relaxed text-muted-foreground">
                  O FINCASH não se conecta ao seu banco. Você lança, ele calcula
                  — e é essa recusa, e não uma integração a mais, que faz o app
                  funcionar com qualquer banco brasileiro, inclusive com a conta
                  que nenhum agregador consegue ler.
                </p>

                <dl className="mt-8 grid divide-y divide-border border-y border-border sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
                  {SEGURANCA.map((s) => (
                    <div
                      key={s.titulo}
                      className="py-5 sm:px-5 sm:first:pl-0 lg:first:pl-0"
                    >
                      <dt className="font-display text-sm font-semibold text-primary">
                        {s.titulo}
                      </dt>
                      <dd className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                        {s.texto}
                      </dd>
                    </div>
                  ))}
                </dl>

                {/* ⚠️ QUEM LÊ O QUE VOCÊ LANÇA, ESCRITO AQUI E NÃO SÓ NA FAQ.
                    A equipe da Novare ABRE os lançamentos de quem assina — é a
                    regra do banco de dados, e é com eles que a revisão
                    trimestral é escrita. Uma seção inteira sobre controle de
                    dados que omitisse isso seria pior que não existir: a pessoa
                    descobriria depois de pagar, e descobriria sozinha. */}
                <p className="mt-6 flex items-start gap-3 rounded-2xl border border-border bg-gelo p-4">
                  <ShieldCheck
                    className="mt-0.5 h-4 w-4 shrink-0 text-accent-strong"
                    strokeWidth={1.75}
                  />
                  <span className="text-xs leading-relaxed text-muted-foreground">
                    <span className="font-display font-semibold text-primary">
                      O que a Novare vê, e por quê.
                    </span>{" "}
                    Seus lançamentos ficam na sua conta, com regra de banco de
                    dados que amarra cada linha ao seu usuário. A equipe pode
                    abri-los para escrever a revisão trimestral do seu plano: é
                    para isso, e para mais nada. A casa não vende dado e não
                    recebe comissão de banco nenhum.
                  </span>
                </p>
              </div>
            </div>
          </section>

          {/* ============ 7. VOCÊ NÃO ESTÁ COMPRANDO UM APP ============= */}
          {/* QUATRO SEÇÕES VIRARAM UMA, e todas as quatro respondiam a mesma
              pergunta: o que eu levo além do software. Elas estavam espalhadas
              da sexta à décima terceira posição, com três assuntos alheios no
              meio — o método da casa (o Ciclo Novare), quem é a casa (os
              sócios), o que o app faz pela casa (a ponte com o Planejamento) e
              o que a mensalidade abre (o `<Pacote />`). Lidas separadas, cada
              uma parecia um adendo; lidas juntas, são o argumento que o
              concorrente não copia escrevendo código.

              A ORDEM INTERNA É UM ARGUMENTO, E NÃO UMA ARRUMAÇÃO:
                1. tem gente do outro lado (os sócios, com nome e endereço);
                2. essa gente tem um método (o Ciclo, que se repete todo mês);
                3. o app entrega o seu mês a esse método (a ponte);
                4. e a mensalidade abre a casa inteira (o Pacote).
              Invertida, a ponte viraria recurso de software e o Pacote viraria
              lista de preço — que é exatamente o que elas eram quando moravam
              longe umas das outras.

              ⚠️ A FRASE QUE ABRE A SEÇÃO É DO JEFFERSON, sócio da casa, e ela
              MUDOU DE LUGAR: vivia na seção de planos, onde explicava o que a
              pessoa estava comprando a três centímetros do botão. Aqui ela ABRE
              o assunto em vez de explicá-lo no fim, e é a seção inteira que a
              prova — o que a tornou uma promessa com quatro provas embaixo, em
              vez de um parágrafo de consolo antes do preço. Ela não foi
              duplicada: na seção 9 ficou o fato que a página é OBRIGADA a
              dizer (não existe plano do FINCASH, existe a assinatura da casa),
              que é outra frase e outro trabalho.

              ⚠️ O `<Pacote />` TRAZ A PRÓPRIA `<section>` E O PRÓPRIO `<h2>`.
              Ele é subseção, não seção: o `h2` dele mora dentro da `<section>`
              dele, que é a estrutura correta, e por isso não furá o sumário
              desta. A mesma regra do `<ParaQuem />` na seção 2.

              ⚠️ NENHUM ÍCONE 3D AQUI. Esta seção já tem a fotografia real dos
              sócios, a textura da casa, cinco cartões numerados do Ciclo, a
              passagem costurada da ponte e a caixa do Pacote: é a seção mais
              densa da página, e um adesivo a mais seria o que a faz virar
              colagem. */}
          <section className="pt-14 sm:pt-20">
            {/* ══ A FRASE DO JEFFERSON, PALAVRA POR PALAVRA ═══════════════
                Ela vem em corpo grande e em `text-primary`, e não em cinza de
                apoio, porque é uma REDEFINIÇÃO do produto e não um detalhe
                dele. E vem SEM ASPAS, de propósito: é a voz da página, não uma
                citação de terceiro. As únicas aspas desta landing são as dos
                clientes da consultoria, na seção 8, e gastá-las aqui
                confundiria as duas coisas. */}
            <p className="mx-auto max-w-3xl text-center font-display text-[1.5rem] font-semibold leading-[1.2] tracking-tight text-primary sm:text-[2rem]">
              Você não está apenas adquirindo um aplicativo financeiro. Está
              tendo acesso a{" "}
              <span className="text-accent-strong">
                uma estrutura para organizar sua vida financeira
              </span>
              , projetar decisões e contar com acompanhamento da Novare.
            </p>

            {/* ── 7.1 A CASA: OS SÓCIOS ───────────────────────────────────
                ⚠️ DE ONDE VEM CADA FATO INSTITUCIONAL DAQUI, porque esta é a
                página que se recusa a inventar prova social uma seção adiante:
                o site oficial da casa (novareinvestimentos.com.br). "Mais de
                cinco anos" é o "5+ anos" do Quem Somos, escrito por extenso e
                sem ano de fundação de propósito, para envelhecer bem caso a
                página de lá fique parada. A origem do nome em "renovar" é a
                própria marca que conta. A consultoria independente é o primeiro
                pilar do site. O endereço é o da Rua Seara, 26, em Sumaré. Os
                perfis citados são os seis que o site lista como atendidos.

                ⚠️ SÓCIOS DA NOVARE, PARCEIROS DA NORD — e a diferença não é
                preciosismo de redação. Uma versão anterior desta legenda dizia
                "sócios da Novare Investimentos e da Nord Wealth B2B", o que
                afirma que os dois têm sociedade na Nord. O site não diz isso em
                lugar nenhum: diz parceria técnica, que é outra coisa. Atribuir
                sociedade numa casa de análise a duas pessoas reais, numa página
                pública, é afirmação sobre terceiro que a Novare não pode fazer.

                A PARCERIA COM A NORD ganhou bloco próprio, com os números NO
                NOME DELA. "Uma das maiores casas de análise independente do
                Brasil", "10+ anos" e "1 milhão de investidores impactados" são
                da Nord, não da Novare, e a frase que abre o bloco diz isso
                antes de qualquer número aparecer. Número emprestado sem dono
                vira número inflado duas seções adiante.

                ⚠️ O QUE CONTINUA FORA, e continua de propósito: cargo, formação
                e certificação dos sócios, ano de fundação, quantidade de
                consultores, número de clientes, patrimônio sob gestão e prêmio.
                Nada disso está escrito em lugar nenhum que dê para conferir, e
                inventar aqui derrubaria a seção inteira.

                A TEXTURA DA CASA COMO MOLDURA, e só como moldura. É a mesma
                linguagem do quadro que aparece atrás dos dois na fotografia e
                do fundo do site oficial: quem chega aqui vindo do site
                reconhece a superfície antes de ler o primeiro nome. Ela aparece
                só na margem — o cartão branco cobre o miolo inteiro —, que é a
                regra escrita em `TEXTURA_CASA`: nenhuma linha de texto desta
                página pousa em cima da onda. */}
            <div
              className="relative mt-9 overflow-hidden rounded-[1.75rem] p-2.5 sm:p-4"
              style={TEXTURA_CASA}
            >
              <span aria-hidden className="absolute inset-0 bg-background/45" />
              <div className="fin-relevo relative grid items-center gap-8 rounded-3xl border border-border bg-card p-6 sm:p-9 lg:grid-cols-[minmax(0,20rem)_1fr] lg:gap-12">
                <div>
                  <div className="relative aspect-[5/4] w-full overflow-hidden rounded-2xl lg:aspect-square">
                    <Pessoa
                      quem="socios"
                      sizes="(max-width: 640px) 92vw, (max-width: 1024px) 60vw, 20rem"
                      className="absolute inset-0 h-full"
                    />
                  </div>

                  {/* A LEGENDA DA FOTO, e ela existe porque a página passou a
                      ter os nomes. O site oficial da casa apresenta os dois
                      como sócios da NOVARE, em parceria técnica com a Nord
                      Wealth — e é só isso que está escrito aqui: cargo,
                      formação e certificação não aparecem em lugar nenhum que
                      dê para conferir, então não aparecem aqui. Nome e vínculo
                      é o que há.

                      ⚠️ NÃO ESCREVA "sócios da Nord". Eles são sócios da
                      Novare; com a Nord há parceria técnica.

                      A ORDEM DOS NOMES SEGUE A ORDEM DOS ROSTOS na foto, e por
                      isso a legenda diz "da esquerda para a direita": Jefferson
                      é o de óculos, à esquerda. Conferido rosto a rosto contra
                      os dois retratos legendados do site oficial. Quem trocar a
                      foto tem de refazer essa conferência ANTES de publicar. */}
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                    <span className="font-display font-semibold text-primary">
                      Jefferson Freitas e Leonardo Freitas
                    </span>
                    , da esquerda para a direita, sócios da NOVARE, em parceria
                    técnica com a Nord Wealth.
                  </p>

                  {/* Linha fina com filete, nunca número grande: destaque
                      numérico aqui viraria a mesma família das declarações de
                      independência, que agora moram na seção 8. */}
                  <dl className="mt-5 divide-y divide-border border-t border-border text-sm">
                    <div className="flex items-start gap-3 py-3">
                      <CalendarClock
                        className="mt-0.5 h-4 w-4 shrink-0 text-accent-strong"
                        strokeWidth={1.75}
                      />
                      <div>
                        <dt className="font-display font-semibold text-primary">
                          Mais de cinco anos de mercado
                        </dt>
                        <dd className="text-muted-foreground">
                          A Novare não nasceu com este app.
                        </dd>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 py-3">
                      <ShieldCheck
                        className="mt-0.5 h-4 w-4 shrink-0 text-accent-strong"
                        strokeWidth={1.75}
                      />
                      <div>
                        <dt className="font-display font-semibold text-primary">
                          Consultoria independente
                        </dt>
                        <dd className="text-muted-foreground">
                          Sem comissão de banco e sem comissão de corretora.
                        </dd>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 py-3">
                      <MapPin
                        className="mt-0.5 h-4 w-4 shrink-0 text-accent-strong"
                        strokeWidth={1.75}
                      />
                      <div>
                        <dt className="font-display font-semibold text-primary">
                          Rua Seara, 26, Sumaré, São Paulo
                        </dt>
                        <dd className="text-muted-foreground">
                          Endereço de escritório, não de perfil.
                        </dd>
                      </div>
                    </div>
                  </dl>
                </div>

                <div>
                  <h2 className="font-display text-[1.75rem] font-semibold leading-[1.12] tracking-tight text-primary sm:text-[2.2rem]">
                    Do outro lado do app tem consultor.
                  </h2>

                  {/* ⚠️ "MAIS DE CINCO ANOS" E "SUMARÉ" SAÍRAM DAQUI porque
                      estão na ficha ao lado, na mesma dobra, em linha própria e
                      com ícone. Ler o mesmo par de fatos duas vezes em dois
                      centímetros não reforça: ensina a pular o parágrafo. */}
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
                    A Novare é uma consultoria financeira independente, e atende
                    de médico e engenheira a atleta, empresário e influenciador:
                    contas bem diferentes e sempre a mesma pergunta na entrada —
                    para onde foi o dinheiro do mês passado. O FINCASH é a
                    ferramenta que ela abriu para quem quer responder isso
                    sozinho.
                  </p>

                  {/* ⚠️ A DESCRIÇÃO DA REVISÃO TRIMESTRAL SAIU DESTE PARÁGRAFO,
                      e não da página: ela está duas linhas abaixo, citada de
                      `ASSINATURA_INCLUI[0]`, na caixa de acento. Dizê-la aqui
                      em palavras próprias e ali na palavra da fonte era ter
                      duas versões da mesma promessa a três linhas uma da outra,
                      que é o jeito mais barato de perder quem compara. */}
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
                    O nome da casa vem de renovar, e é literalmente o serviço:
                    quem chega afogado em fatura não precisa de mais um gráfico,
                    precisa recomeçar a contagem com alguém junto. E esse alguém
                    escreve — não é um relatório que o sistema gera às três da
                    manhã.
                  </p>

                  {/* A LINHA CITADA DA FONTE, e ela é citação mesmo: o texto
                      sai de `ASSINATURA_INCLUI[0]`, o mesmo que a lista de
                      preço da seção 9 imprime. */}
                  <p className="mt-5 flex items-start gap-3 rounded-2xl border border-accent-soft bg-accent-tint p-4">
                    <PenLine
                      className="mt-0.5 h-4 w-4 shrink-0 text-accent-strong"
                      strokeWidth={1.75}
                    />
                    <span className="font-display text-sm font-semibold leading-snug text-primary">
                      {ASSINATURA_INCLUI[0]}
                    </span>
                  </p>

                  <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                    Independente, aqui, é regra de caixa antes de ser palavra
                    bonita: a casa não recebe nada de banco, corretora ou
                    gestora por onde o seu dinheiro para. É por isso que o app
                    organiza e projeta, mas não indica ativo, produto nem fundo,
                    e que a revisão comenta o seu plano sem empurrar nada. É o
                    único item desta assinatura que software nenhum entrega.
                  </p>

                  {/* A PARCERIA COM A NORD. Três linhas separadas por filete
                      vertical, e nunca número grande em laranja: o destaque
                      numérico desta página é o das declarações de
                      independência, na seção 8, e repeti-lo aqui faria os
                      números da Nord parecerem da Novare. A frase de cima é
                      obrigatória e não é letra miúda: são números da Nord. */}
                  <div className="mt-5 rounded-2xl border border-border bg-gelo p-4">
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      <span className="font-display font-semibold text-primary">
                        A casa é parceira da Nord Wealth.
                      </span>{" "}
                      Os três números abaixo são da Nord, e não da Novare nem
                      deste app. Eles dizem com quem a casa anda, e nada sobre
                      quantas pessoas usam o FINCASH.
                    </p>
                    <dl className="mt-3 grid gap-3 border-t border-border pt-3 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-border">
                      {[
                        {
                          chave: "Uma das maiores",
                          valor: "casas de análise independente do Brasil",
                        },
                        {
                          chave: "10+ anos",
                          valor: "de análise independente no mercado brasileiro",
                        },
                        {
                          chave: "1 milhão",
                          valor: "de investidores impactados pelo conteúdo Nord",
                        },
                      ].map((n) => (
                        <div key={n.chave} className="sm:px-4 sm:first:pl-0">
                          <dt className="font-display text-sm font-semibold leading-snug text-primary">
                            {n.chave}
                          </dt>
                          <dd className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                            {n.valor}
                          </dd>
                        </div>
                      ))}
                    </dl>
                    <p className="mt-3 border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground">
                      Renato Breia e Marília Fontes aparecem pela Nord Wealth.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── 7.2 O MÉTODO: O CICLO NOVARE ────────────────────────────
                Encaixotado em creme, e é o único bloco da página com fundo
                próprio no meio do branco: o método é o que a Novare tem e um
                app de banco não tem, e um respiro de cor faz esse ponto sem
                precisar de um selo escrito "exclusivo".

                ⚠️ ELE MUDOU DE LUGAR, NÃO DE CONTEÚDO. Morava na sexta posição,
                entre o comparativo e as capturas do produto — ou seja, no meio
                do argumento de SOFTWARE, onde ele lia como "mais um recurso".
                Aqui ele é a segunda prova de que existe casa por trás: os
                sócios são quem, o Ciclo é como. Os cinco passos, a ordem, o
                denominador "01 de 05" e a peça de fechamento continuam
                intactos.

                A ORDEM É O MÉTODO. Quase todo mundo começa pelo passo 3
                (registrar), e é por isso que abandona: sem estruturar antes, o
                segundo mês pede que se digite tudo de novo. E sem reservar
                antes de gastar, o que sobra no fim do mês é o resto, que nunca
                é o bastante. Trocar a escada por abas, acordeão ou trilha
                horizontal custaria JavaScript numa página que não manda nenhum,
                e resolveria um problema que a seção não tem.

                O TÍTULO DESCEU DE `h2` PARA `h3` na fusão, e só isso. */}
            <div id="ciclo" className="scroll-mt-20 pt-12 sm:pt-16">
              <div className="rounded-3xl border border-creme-forte bg-creme p-6 sm:p-10">
                <div className="mx-auto max-w-2xl text-center">
                  <p className="text-2xs font-semibold uppercase tracking-[0.18em] text-accent-strong">
                    Metodologia
                  </p>
                  <h3 className="mt-2 font-display text-3xl font-semibold leading-[1.12] tracking-tight text-primary sm:text-[2.2rem]">
                    O Ciclo Novare
                  </h3>
                  <p className="mt-3.5 text-base leading-relaxed text-muted-foreground">
                    Cinco passos que se repetem todo mês. A ordem é o método:
                    quase todo mundo começa a registrar antes de estruturar, e
                    por isso desiste no segundo mês, quando percebe que teria de
                    digitar o aluguel de novo.
                  </p>
                </div>

                <ol className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {CICLO.map((passo, i) => (
                    <Etapa
                      key={passo.titulo}
                      numero={i + 1}
                      total={CICLO.length}
                      titulo={passo.titulo}
                      texto={passo.texto}
                      icone={passo.icone}
                      tom={i % 2 === 0 ? "navy" : "laranja"}
                    />
                  ))}

                  {/* O ciclo fecha: sem esta peça a lista pareceria uma escada
                      que termina no quinto degrau, e o argumento é justamente
                      que o mês seguinte começa melhor que o anterior. */}
                  <li className="flex h-full flex-col justify-center rounded-3xl border border-dashed border-accent-soft bg-accent-tint p-6">
                    <RefreshCw
                      className="h-6 w-6 text-accent-strong"
                      strokeWidth={1.75}
                    />
                    <p className="mt-4 font-display text-lg font-semibold leading-snug text-primary">
                      E recomeça
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      Todo mês o ciclo roda de novo, com menos esforço: o que
                      você estruturou uma vez continua valendo, e o orçamento
                      fica mais perto da sua vida a cada volta.
                    </p>
                  </li>
                </ol>
              </div>
            </div>

            {/* ── 7.3 A PONTE PARA O PLANEJAMENTO ─────────────────────────
                É O ÚNICO ARGUMENTO DA PÁGINA QUE NÃO SE COPIA ESCREVENDO
                CÓDIGO. O concorrente tem IA e tem planilha, e ligar o medido ao
                plano ele também ligaria em um release. O que ele não versiona é
                a pessoa que assina embaixo do plano do outro lado da ponte — e
                é por isso que a ponte só faz sentido DEPOIS dos sócios e do
                método, que é onde ela ficou.

                FAMÍLIA DE LAYOUT: a passagem. Dois painéis com uma costura no
                meio (o lado medido e o lado planejado) e, embaixo, uma fita de
                quatro travas separada por filete. Não repete família nenhuma da
                página. Também não tem foto: não existe captura desta tela, e
                remontar uma prévia em HTML de algo que ninguém fotografou seria
                desenhar produto, que é justamente o que `Molduras.tsx` proíbe.

                ⚠️ CADA FRASE DAQUI SAI DE `lib/fincash/ponte-planejamento.ts` E
                DA TELA `app/planejamento/page.tsx`: um mês por vez; receitas,
                despesas por categoria, dívidas e patrimônio; divergente
                nascendo desmarcado; lote recusado inteiro se algum divergente
                for marcado sem escolha; nada apagado; lote reversível; nenhuma
                sincronização no fundo; e o que não casa ficando fora da soma em
                vez de cair em "Outros". Nada além disso é prometido, porque
                nada além disso existe.

                ⚠️ A EXIGÊNCIA DE FICHA ESTÁ ESCRITA, NÃO ESCONDIDA. Quem usa o
                FINCASH sem ficha no Planejamento vê uma explicação, não um
                botão (o ramo `sem-ficha` da tela). Guardar isso para depois da
                assinatura transformaria o melhor argumento da página em
                pegadinha, e a página inteira se sustenta em não ter nenhuma.

                O TÍTULO DESCEU DE `h2` PARA `h3` na fusão, e só isso. */}
            <div className="pt-12 sm:pt-16">
              <div className="rounded-3xl border border-border bg-card p-6 shadow-subtle sm:p-9">
                <div className="max-w-3xl">
                  <h3 className="font-display text-[1.75rem] font-semibold leading-[1.12] tracking-tight text-primary sm:text-[2.2rem]">
                    A revisão do consultor passa a ser escrita sobre o seu mês,
                    e não sobre a sua memória
                  </h3>
                  {/* ⚠️ A LISTA DO QUE ATRAVESSA SAIU DESTE PARÁGRAFO —
                      receitas, despesas por categoria, dívidas e patrimônio — e
                      está logo abaixo, no painel da esquerda, item a item e com
                      tique. Escrita nos dois lugares, ela era a mesma
                      enumeração duas vezes em meia tela; e a versão em prosa
                      era a pior das duas, porque uma lista de quatro itens
                      dentro de um parágrafo de seis linhas não se lê como
                      lista. */}
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
                    Até hoje os dois lados da casa não se falavam. Ao montar o
                    plano, você estimava: gasto uns oitocentos no mercado. E era
                    sobre essa estimativa que o consultor escrevia a revisão do
                    trimestre — enquanto, do outro lado da parede, o FINCASH
                    media o mesmo gasto lançamento a lançamento. A ponte derruba
                    a parede: você escolhe um mês e o leva para o seu plano. O
                    que a pessoa lê antes de escrever sobre a sua vida deixa de
                    ser o que você lembra e passa a ser o que aconteceu.
                  </p>
                </div>

                {/* A PASSAGEM: a costura no meio é o argumento inteiro em uma
                    peça. À esquerda o que foi MEDIDO, à direita o plano que o
                    consultor lê e a pergunta que antecede qualquer gravação. É
                    desenho declarado, com a palavra "exemplo" em cima: a linha
                    de comparação existe mesmo na tela, os valores são
                    ilustração. */}
                <div className="mt-8 grid gap-px overflow-hidden rounded-3xl border border-border bg-border lg:grid-cols-2">
                  <div className="bg-gelo p-5 sm:p-6">
                    <p className="font-display text-sm font-semibold text-primary">
                      De um lado, o mês medido
                    </p>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                      Um mês por vez, escolhido por você. Atravessa isto, e só
                      isto:
                    </p>
                    <ul className="mt-4 space-y-2">
                      {[
                        "Receitas do mês",
                        "Despesas por categoria",
                        "Dívidas em aberto",
                        "Patrimônio investido",
                      ].map((item) => (
                        <li
                          key={item}
                          className="flex items-center gap-2.5 text-sm text-primary"
                        >
                          <Check
                            className="h-4 w-4 shrink-0 text-accent-strong"
                            strokeWidth={2.25}
                          />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-accent-tint p-5 sm:p-6">
                    <p className="font-display text-sm font-semibold text-primary">
                      Do outro, o seu plano, e a pergunta antes de gravar
                    </p>
                    <div className="mt-4 rounded-xl border border-accent-soft bg-card p-4">
                      <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        Exemplo
                      </p>
                      <p className="mt-2 font-display text-sm font-semibold text-primary">
                        Alimentação
                      </p>
                      <dl className="mt-2.5 grid grid-cols-2 gap-3">
                        <div>
                          <dt className="text-xs text-muted-foreground">
                            No seu plano hoje
                          </dt>
                          <dd className="mt-0.5 font-display text-sm font-semibold tabular-nums text-muted-foreground">
                            R$ 800,00
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-muted-foreground">
                            O FINCASH mediu
                          </dt>
                          <dd className="mt-0.5 font-display text-sm font-semibold tabular-nums text-accent-strong">
                            R$ 1.037,60
                          </dd>
                        </div>
                      </dl>
                      <p className="mt-3 border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground">
                        Item divergente chega desmarcado e continua desmarcado
                        até você olhar os dois números e decidir. A escolha é de
                        um em um, e nenhum deles vai de carona.
                      </p>
                    </div>
                  </div>
                </div>

                {/* A FITA DE TRAVAS. Filete no lugar de quatro cartõezinhos: o
                    que estas quatro frases fazem é LIMITAR a promessa de cima, e
                    promessa limitada não pede caixa com sombra. */}
                <dl className="mt-8 grid divide-y divide-border border-y border-border sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
                  {[
                    {
                      titulo: "Nada entra calado",
                      texto:
                        "Onde já existe valor no plano, os dois números aparecem lado a lado. Se algum divergente seguir marcado sem a sua escolha, o envio inteiro é recusado.",
                    },
                    {
                      titulo: "Nada é apagado",
                      texto:
                        "A ponte não apaga nada do seu plano, e o que ela grava é reversível: o valor anterior fica guardado e um botão desfaz o envio.",
                    },
                    {
                      titulo: "Quem puxa é você",
                      texto:
                        "Não existe sincronização automática nem nada rodando no fundo. Sem o seu toque no botão, nenhum número atravessa.",
                    },
                    {
                      titulo: "O que não casa fica de fora",
                      texto:
                        "Categoria que você inventou, ou lançamento sem categoria, não vai para Outros: sai numa lista à parte, com nome e valor, e fora da soma até você decidir.",
                    },
                  ].map((trava) => (
                    <div
                      key={trava.titulo}
                      className="py-5 sm:px-5 sm:first:pl-0 lg:first:pl-0"
                    >
                      <dt className="font-display text-sm font-semibold text-primary">
                        {trava.titulo}
                      </dt>
                      <dd className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                        {trava.texto}
                      </dd>
                    </div>
                  ))}
                </dl>

                {/* A BORDA DA PROMESSA, colada no argumento e não numa letra
                    miúda de rodapé. */}
                <p className="mt-7 flex items-start gap-3 rounded-2xl border border-border bg-gelo p-4">
                  <Lock
                    className="mt-0.5 h-4 w-4 shrink-0 text-accent-strong"
                    strokeWidth={1.75}
                  />
                  <span className="text-xs leading-relaxed text-muted-foreground">
                    <span className="font-display font-semibold text-primary">
                      A ponte pede uma ficha no Planejamento Financeiro.
                    </span>{" "}
                    O FINCASH funciona sozinho, com a sua conta. O Planejamento
                    trabalha sobre uma ficha de cliente, e ela nasce quando você
                    abre o Planejamento pela primeira vez. Enquanto ela não
                    existir, a tela da ponte mostra como abri-la, e não um botão
                    que finge funcionar. Contas de equipe da Novare não têm
                    ficha e, por isso, não têm ponte.
                  </span>
                </p>
              </div>
            </div>

            {/* ── 7.4 O PACOTE ────────────────────────────────────────────
                A PEÇA QUE FECHA O ARGUMENTO DA SEÇÃO, e ela é a resposta
                literal ao título: o que a mensalidade abre além deste app. Vem
                por último de propósito — depois de a página ter provado que
                existe casa (7.1), método (7.2) e ponte (7.3), a caixa com tudo
                dentro lê como consequência; posta antes, leria como tabela de
                preço adiantada, e a seção 9 é que vende preço.

                ⚠️ ELA TRAZ A PRÓPRIA `<section>` E O PRÓPRIO `<h2>`, e por isso
                é subseção desta e não uma décima primeira seção. Nada nela é
                digitado à mão: os produtos saem de `lib/apps`, as promessas de
                `ASSINATURA_INCLUI` e os preços de `lib/assinatura` — e toda
                linha que nenhum nó reivindicar cai no rodapé "E ainda" em vez
                de sumir, que é o que faz a peça acompanhar sozinha quando a
                assinatura mudar.

                ⚠️ O ASSISTENTE DE WHATSAPP NÃO ESTÁ NELA, e isso é regra
                escrita dentro do componente: numa peça cujo trabalho é ser
                entendida numa olhada, o único item com asterisco ou some (e a
                peça mente) ou fica (e o item duvidoso ganha o mesmo peso dos
                que estão no ar). Ele tem a seção 6 inteira, com a ressalva por
                extenso. */}
            <Pacote className="pt-12 sm:pt-16" />
          </section>

          <FaixaComecar frase="A assinatura é uma só e libera a casa inteira. Dá para começar agora e decidir depois, dentro da garantia." />

          {/* ========================= 8. ANTES E DEPOIS ================ */}
          {/* ⚠️ O QUE ESTA SEÇÃO PROVA, E O QUE ELA SE RECUSA A PROVAR.
              O "antes e depois" daqui é de DOCUMENTO, não de pessoa: o extrato
              do banco de setembro e o painel do FINCASH do mesmo setembro, com
              os números batendo. Não existe, e não vai existir enquanto não for
              colhido, depoimento de usuário do app — e o título e o apoio desta
              seção estão escritos para que ninguém leia "antes e depois" como
              promessa de transformação de cliente.

              ── A ORDEM PROVA × EXPLICAÇÃO, E POR QUE ELA FICOU ASSIM ─────
              O autor do `<AntesDepois />` deixou avisado que ele é a PROVA
              (dois documentos lado a lado) e a `<Calculo />` é a EXPLICAÇÃO (a
              geometria da subtração), e que prova antes de explicação funciona
              melhor. A regra é boa e vale quando as duas peças disputam a mesma
              rolagem. Aqui elas estão a seis seções de distância, e nessa
              escala não são um par: são dois momentos diferentes do argumento.
              A `<Calculo />` na seção 2 é o que ABRE o problema para quem
              acabou de chegar; o `<AntesDepois />` aqui é o que FECHA com os
              dois documentos depois de a pessoa já ter visto o painel por
              dentro, na seção 4 — e reconhecer a tela do lado direito é metade
              da força desta peça. Posta na seção 2, ela mostraria uma captura
              que o leitor ainda não sabe ler.

              ⚠️ E HÁ UM MOTIVO MECÂNICO QUE FECHA A QUESTÃO: os rótulos "O que
              o banco te mostra" (desta peça) e "O que o extrato te mostra" (da
              `Calculo`) são quase a mesma frase, e os DOIS moram dentro dos
              componentes, que não se editam a partir daqui. Vizinhos, eles
              seriam lidos como erro de repetição. A distância é a única
              correção disponível, e ela é gratuita.

              ⚠️ SUBIR A PEÇA PARA A SEÇÃO 2 TAMBÉM ESVAZIARIA ESTA. O que
              sobraria aqui seriam as aspas dos clientes da CONSULTORIA — que,
              pela regra editorial da casa, não provam nada sobre o app. A
              seção ficaria sem o único argumento que fala do produto.

              ── POR QUE AS DECLARAÇÕES DE INDEPENDÊNCIA VIERAM PARA CÁ ────
              Elas moravam coladas nos sócios. O conteúdo das aspas é a prova
              viva do "sem comissão" que elas afirmam ("não teve produto sendo
              empurrado", "sem vender nada"), e é por isso que as duas coisas
              andam juntas. O que ficou na seção 7 é quem a casa é; o que está
              aqui é como ela se paga, e quem já sentou com ela. */}
          <section className="pt-14 sm:pt-20">
            {/* ⚠️ O TÍTULO NÃO PODE DIZER "EXTRATO", e a razão é vocabulário e
                não gosto: "o extrato é um retrovisor" abre a seção 3, e "O que
                o extrato te mostra" é o rótulo que a `<Calculo />` imprime na
                seção 2 — os dois de dentro de peças que não se editam a partir
                daqui. Um terceiro "extrato" em posição de cabeçalho faria a
                página parecer contar a mesma coisa pela terceira vez. Aqui a
                palavra é BANCO, que é justamente o que o lado esquerdo da peça
                desenha.

                ⚠️ E O APOIO DIZ, ANTES DA PEÇA, QUE ISTO NÃO É DEPOIMENTO.
                "Antes e depois" é a forma que toda landing de finanças usa para
                anunciar transformação de cliente, e esta página não tem nenhuma
                para mostrar. O que ela tem são dois DOCUMENTOS do mesmo mês, da
                mesma conta de demonstração — e isso está escrito em corpo de
                texto, não em letra miúda. */}
            <TituloSecao
              centro={false}
              sobre="Antes e depois"
              titulo="O mesmo setembro, contado duas vezes"
              apoio="Não é depoimento de ninguém: são dois documentos do mesmo mês. À esquerda, como o banco conta — datas, descrições opacas e um saldo. À direita, o mesmo setembro no FINCASH, com o que ainda vence já descontado. Os dois lados saem da conta de demonstração, e os números batem entre si."
            />

            {/* ⚠️ A PEÇA PRESSUPÕE FUNDO CLARO e traz o próprio cartão do lado
                do extrato. A ponte do meio é transparente de propósito, e os
                contrastes dela foram medidos contra a superfície clara mais
                escura da casa. Encaixada sobre navy, caem todos de uma vez —
                por isso ela não entra em bloco escuro nenhum. */}
            <AntesDepois className="mt-9" />

            {/* ── A CREDIBILIDADE ─────────────────────────────────────────
                ⚠️ NADA FOI SUAVIZADO NA MUDANÇA DE SEÇÃO, e esta é a parte em
                que isso mais importa. A frase que diz que NÃO há depoimento de
                usuário do app, a que recusa número de usuários, o
                enquadramento que diz que quem fala é cliente da CONSULTORIA e a
                atribuição repetida embaixo de cada aspa continuam palavra por
                palavra.

                OS DEPOIMENTOS SÃO DA CONSULTORIA, e a página diz isso no título
                do bloco, em corpo de texto, antes de qualquer aspa. Não em
                letra miúda embaixo: quem lê só os títulos precisa sair sabendo
                que essa gente não usou o FINCASH. Eles provam que existe
                consultor de verdade do outro lado, e não que o app é bom.

                FAMÍLIA DE LAYOUT: a citação em coluna, com filete no topo de
                cada uma e nenhuma caixa. Não repete os cartões da seção 4 nem
                os painéis da 6, e de propósito não tem foto de cliente:
                inventar rosto de cliente de consultoria seria a mesma fraude
                que esta metade recusa. */}
            <div className="pt-12 sm:pt-16">
              <h3 className="font-display text-2xl font-semibold leading-tight tracking-tight text-primary sm:text-[2rem]">
                Sem número inflado e sem depoimento de app
              </h3>
              <p className="mt-3.5 max-w-3xl text-base leading-relaxed text-muted-foreground">
                Não vamos dizer quantos milhares de pessoas usam o FINCASH:
                seria fácil de escrever e impossível de conferir. Nenhuma aspa
                desta página fala do app, porque não há depoimento de usuário
                coletado. O que dá para mostrar é como a casa ganha dinheiro, e
                quem já sentou com ela.
              </p>

              <dl className="mt-8 divide-y divide-border border-y border-border">
                {PROVAS.map((p) => (
                  <div
                    key={p.titulo}
                    className="grid gap-2 py-6 sm:grid-cols-[minmax(0,13rem)_1fr] sm:gap-8"
                  >
                    <dt>
                      <span className="font-display text-3xl font-bold leading-none tracking-tight text-accent-strong">
                        {p.destaque}
                      </span>
                      <span className="mt-1.5 block font-display text-base font-semibold leading-snug text-primary">
                        {p.titulo}
                      </span>
                    </dt>
                    <dd className="text-sm leading-relaxed text-muted-foreground">
                      {p.texto}
                    </dd>
                  </div>
                ))}
              </dl>

              {/* O ENQUADRAMENTO VEM ANTES DAS ASPAS, sempre. */}
              <div className="mt-10">
                <h3 className="font-display text-xl font-semibold leading-snug tracking-tight text-primary sm:text-2xl">
                  Quem fala aqui é cliente da consultoria, não do app.
                </h3>
                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                  As quatro falas abaixo estão publicadas no site da Novare e
                  são de gente que contratou a consultoria da casa. Nenhuma
                  dessas pessoas usou o FINCASH, e por isso elas não provam nada
                  sobre o app. Elas provam a única coisa que software nenhum
                  entrega e que esta página vende: existe consultor de verdade
                  do outro lado, e ele não vive de comissão. Repare no que eles
                  contam sem serem perguntados.
                </p>

                <ul className="mt-7 grid gap-x-8 gap-y-7 sm:grid-cols-2">
                  {DEPOIMENTOS.map((d) => (
                    <li key={d.nome} className="border-t border-border pt-5">
                      <blockquote className="font-display text-base leading-relaxed text-primary">
                        &ldquo;{d.texto}&rdquo;
                      </blockquote>
                      <p className="mt-3 text-xs text-muted-foreground">
                        <span className="font-semibold text-primary">
                          {d.nome}
                        </span>
                        , {d.quem}. Cliente da consultoria da Novare.
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <FaixaComecar frase="O painel da direita é o que abre na sua conta no primeiro lançamento, com os seus números no lugar dos da demonstração." />

          {/* ====================== 9. PLANOS E GARANTIA ================ */}
          {/* A SEÇÃO QUE A PÁGINA INTEIRA ESTAVA CONSTRUINDO, e ela mudou de
              natureza: era um bloco de OFERTA (um preço, uma lista, um botão)
              e virou uma ESCOLHA entre dois prazos. Quem chega aqui já foi
              convencido; o que falta é decidir como paga, e decisão pede duas
              colunas para comparar, não um parágrafo para ler.

              ⚠️ O QUE SAIU DAQUI, e é a mudança mais cara de uma versão
              anterior: o "7 dias grátis" que ocupava o título. A oferta deixou
              de ser teste e passou a ser garantia, e as duas são promessas
              OPOSTAS. No teste ninguém pedia cartão e o produto abria antes de
              qualquer cobrança; na garantia a pessoa paga, usa e recebe de
              volta se desistir dentro do prazo. Cada frase de "grátis" que
              sobrevivesse aqui venderia uma coisa que o checkout não faz.

              ⚠️ E A FRASE DO JEFFERSON SUBIU PARA ABRIR A SEÇÃO 7. Ela dizia
              aqui que o que se compra não é um aplicativo, é uma estrutura com
              acompanhamento — e virou o título e o assunto inteiro de uma seção
              que tem quatro provas embaixo dela. Repeti-la aqui seria ler duas
              vezes a mesma redefinição em duas rolagens. O que ficou é o fato
              que esta página é OBRIGADA a dizer, e que é outra coisa: não
              existe plano do FINCASH, existe a assinatura da casa.

              ── A FORMA, E POR QUE ELA NÃO REPETE NENHUMA DA PÁGINA ────────
              É a única seção com dois cartões IRMÃOS e assimétricos: mesma
              estrutura, superfícies diferentes. O contraste de superfície faz o
              trabalho que em página de venda costuma ser feito com tamanho: o
              destacado é navy sobre o creme da seção, o comum é branco, e o
              destacado não precisa crescer nem ganhar sombra colorida para ser
              o primeiro que o olho encontra.

              ── A HIERARQUIA DE AÇÃO ──────────────────────────────────────
              Laranja cheio no anual, contorno no mensal. Dois botões do mesmo
              peso empatam a decisão, e empate numa página de venda é a pessoa
              adiando. Os dois levam ao checkout do próprio plano, resolvido em
              `assinaturaCheckout`: enquanto a oferta da Hotmart não existir, o
              destino é a tela de "em breve", nunca um `href` vazio.

              ⚠️ E OS DOIS DÃO O MESMO PRODUTO. É a linha que separa esta
              página da concorrência, que parte a funcionalidade em dois níveis
              e cobra o nível de cima: aqui muda o prazo e muda o preço, mais
              nada.

              ⚠️ O RÓTULO EM CAIXA ALTA DESTA SEÇÃO É O ÚLTIMO DA PÁGINA, e a
              contagem deles mudou com a reestruturação — de três em dezesseis
              seções para sete em dez, porque três vieram de dentro de peças
              montadas fora (`<ParaQuem />`, `<Pacote />`) e duas eram de seções
              que agora moram dentro de outras (o Ciclo e o Pacote, na 7). Sete
              já não é exceção: é padrão de cabeçalho. Quem for mexer na
              hierarquia desta página de novo, comece por aqui — o candidato
              natural a sair é o desta seção, porque o `<h2>` logo abaixo dele
              ("Dois prazos. O mesmo produto inteiro.") já diz o que ele diz. */}
          <section className="pt-14 sm:pt-20">
            {/* A MESMA MOLDURA DE TEXTURA DA SEÇÃO DOS SÓCIOS, e o segundo e
                último uso dela na página. Os dois lugares em que ela aparece
                são os dois em que a página fala da CASA e não do app: de quem
                se assina e quanto custa assinar. Uma terceira aparição a
                transformaria em papel de parede. */}
            <div
              className="relative overflow-hidden rounded-[2rem] p-2.5 sm:p-4"
              style={TEXTURA_CASA}
            >
              <span aria-hidden className="absolute inset-0 bg-background/45" />
              <div className="relative overflow-hidden rounded-3xl border border-accent-soft bg-accent-tint p-6 sm:p-9">
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      "radial-gradient(30rem 16rem at 92% -22%, hsl(16 85% 55% / 0.20), transparent 65%)",
                  }}
                />

                <div className="relative">
                  <Chapeu tom="navy">Uma assinatura para a casa inteira</Chapeu>

                  <h2 className="mt-4 max-w-2xl font-display text-2xl font-extrabold leading-tight text-primary sm:text-3xl">
                    Dois prazos. O mesmo produto inteiro.
                  </h2>

                  {/* A frase que esta página não pode omitir: assinar o FINCASH
                      é assinar o Workspace. Ela vem em corpo maior que o cinza
                      de apoio porque, com a redefinição do produto tendo subido
                      para a seção 7, é ela que carrega sozinha o que a pessoa
                      está levando pelo número que está prestes a ler. */}
                  <p className="mt-3 max-w-2xl font-display text-base font-medium leading-relaxed text-primary sm:text-lg">
                    Não existe plano do FINCASH: existe a assinatura da Novare, e
                    ela libera este app junto com o Planejamento Financeiro, a
                    Íris e as calculadoras da casa. Sem taxa de entrada, sem
                    fidelidade e sem comissão embutida em produto nenhum.
                  </p>

                  {/* ⚠️ O `.map` é o ponto inteiro: os planos, a ordem, os
                      valores e o destaque vêm de `ASSINATURA_PLANOS`. Nenhum
                      cartão é escrito à mão aqui, e por isso nenhum deles
                      envelhece sozinho quando o preço mudar.

                      `items-stretch` é o que mantém os dois da mesma altura no
                      desktop, com o botão de cada um na mesma linha. */}
                  <div className="mt-8 grid items-stretch gap-4 lg:grid-cols-2 lg:gap-5">
                    {ASSINATURA_PLANOS.map((plano) => (
                      <CartaoPlano
                        key={plano.chave}
                        plano={plano}
                        itens={inclui}
                      />
                    ))}
                  </div>

                  {/* A DECLARAÇÃO, AGORA COMO LEGENDA E NÃO COMO ARGUMENTO.
                      Ela tinha cinco linhas e carregava sozinha a ideia de que
                      nada fica trancado no plano barato. Não carrega mais: as
                      duas listas idênticas dentro dos cartões acabaram de
                      provar isso, e quem já viu não precisa ler de novo. */}
                  <p className="mt-4 flex items-start justify-center gap-2.5 text-center text-sm leading-relaxed text-muted-foreground sm:items-center">
                    <Layers
                      className="mt-0.5 h-4 w-4 shrink-0 text-accent-strong sm:mt-0"
                      strokeWidth={1.75}
                    />
                    <span>
                      <span className="font-semibold text-primary">
                        As duas listas são iguais porque o produto é o mesmo.
                      </span>{" "}
                      Muda o prazo, muda o preço, e acaba aí.
                    </span>
                  </p>

                  {/* A GARANTIA, EM DESTAQUE E COMO FATO OPERACIONAL, COLADA NO
                      PREÇO. Quem devolve é a plataforma, automaticamente, e é
                      por isso que ela pode ser escrita como fato e não como
                      promessa da casa: cancelar dentro do prazo é o que dispara
                      o estorno, sem ninguém da Novare no meio do caminho.

                      ⚠️ SÃO DOIS ELEMENTOS ANINHADOS, E ISSO É OBRIGATÓRIO.
                      O `fin-anel` desenha o contorno aceso num `::before` de
                      `inset: -1px`; o `fin-lustro` precisa de `overflow: hidden`
                      para a lâmina de luz não vazar da peça. Numa caixa só, o
                      `overflow` do lustro recorta justamente o pixel que o anel
                      pinta, e o contorno some sem erro nenhum aparecer. Fora, o
                      anel; dentro, o lustro.

                      E é aqui, e não no cartão do plano, porque o cartão em
                      destaque tem o selo "Recomendado" pousado meio fora da
                      borda: `overflow: hidden` nele decapitaria a pílula. */}
                  <div className="fin-anel mt-4 rounded-2xl">
                    <div className="fin-lustro flex flex-col gap-4 rounded-2xl border border-accent-soft bg-card p-5 sm:flex-row sm:items-start sm:p-7">
                      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-accent-soft bg-accent-tint">
                        <ShieldCheck
                          className="h-6 w-6 text-accent-strong"
                          strokeWidth={1.75}
                        />
                      </span>
                      <div>
                        <p className="font-display text-lg font-bold leading-snug text-primary">
                          Risco zero: {ASSINATURA_GARANTIA}
                        </p>
                        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                          {ASSINATURA_GARANTIA_FRASE} Quem devolve é a própria
                          Hotmart, automaticamente: você cancela dentro do prazo
                          e a plataforma estorna, sem passar por ninguém da
                          Novare. Depois dos {ASSINATURA_GARANTIA_DIAS} dias,
                          cancelar continua sendo um clique, e a cobrança para na
                          hora, sem multa.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* A SAÍDA DE QUEM AINDA NÃO DECIDIU. Peso baixo de
                      propósito: é a alternativa a fechar a aba, não um segundo
                      caminho competindo com os dois botões acima. */}
                  <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
                    <p className="flex items-center gap-1.5 text-center text-xs text-muted-foreground sm:text-left">
                      <Lock className="h-3 w-3 shrink-0" />
                      Pagamento pela Hotmart. Cancele quando quiser, sem multa
                      nem fidelidade.
                    </p>
                    <a
                      href={falarNoWhatsApp(
                        "Olá! Tenho dúvidas sobre o FINCASH da Novare antes de assinar.",
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-accent-soft bg-card px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-accent-tint"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Falar com um consultor antes
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ======================= 10. DÚVIDAS E FECHO ================ */}
          {/* DUAS SEÇÕES VIRARAM UMA, e elas já eram o mesmo momento: o último
              obstáculo e o último convite. Um cabeçalho entre a resposta final
              e o botão final é um respiro que só serve para a pessoa decidir
              fechar a aba no meio.

              ⚠️ O `OQueSignifica` TRAZ A PRÓPRIA `<section>` E O PRÓPRIO `<h2>`
              ("Perguntas frequentes"): ele é a subseção, e o `h2` desta seção é
              o do fecho. É a mesma estrutura do `<ParaQuem />` na 2 e do
              `<Pacote />` na 7. */}
          <section className="pt-14 sm:pt-20">
            <OQueSignifica
              titulo="Perguntas frequentes"
              itens={[
                {
                  pergunta: "Preciso conectar a minha conta do banco?",
                  resposta:
                    "Não, e não é uma etapa que ficou para depois: o app não pede a senha do seu banco nem usa Open Finance. Você lança, ele calcula. Em troca disso, funciona com qualquer banco brasileiro, inclusive com a conta que nenhum agregador consegue ler.",
                },
                {
                  pergunta: "O que já está pronto?",
                  /* ⚠️ ERA "AS DOZE TELAS", E ERAM QUINZE. A conta foi refeita
                     à mão em 12/09/2026: catorze subpastas com `page.tsx` em
                     `src/app/fincash/app/` mais o painel da raiz. A lista velha
                     esquecia três telas que existem e funcionam — Meus dados, a
                     ponte com o Planejamento e a do assistente —, e uma landing
                     que subestima o produto custa venda tanto quanto uma que o
                     superestima.

                     ⚠️ A TELA DO WHATSAPP ESTÁ NA CONTA, E A RESSALVA CONTINUA
                     INTEIRA, porque as duas coisas são verdade ao mesmo tempo:
                     a tela existe dentro do app (é onde se vincula o número), e
                     o assistente não responde porque falta a linha oficial da
                     Meta. Contar a tela e omitir a ressalva seria prometer o
                     que não entrega; omitir a tela seria mentir ao contrário. A
                     frase diz as duas em orações separadas, de propósito. */
                  resposta:
                    "As quinze telas estão no ar: Painel, Lançamentos, Cartões e faturas, Contas fixas, Contas, Importar extrato, Orçamento, Dívidas, Metas, Investimentos, Projeção de 12 meses, Categorias, Meus dados, a ponte que leva o seu mês ao Planejamento e a do assistente de WhatsApp, onde você vincula o seu número. As capturas desta página saíram todas do app, de uma conta de demonstração. O que ainda falta não é tela: é a linha oficial do WhatsApp, e enquanto ela não estiver plugada o assistente não responde.",
                },
                {
                  pergunta: "Preciso digitar tudo à mão?",
                  /* A pergunta existe porque a resposta anterior ("não
                     conectamos banco") deixava a impressão de que só havia o
                     teclado. O OFX é o meio-termo honesto: sem senha de banco,
                     sem Open Finance, e sem digitar o extrato inteiro. */
                  resposta:
                    "Não precisa. O extrato em OFX que o seu banco exporta entra pela tela de importação, e você confere linha por linha antes de gravar: o que já foi lançado uma vez não entra de novo. Continua sem conectar conta nenhuma e sem pedir a senha do banco, porque quem traz o arquivo é você.",
                },
                {
                  pergunta: "Tenho dívida. O app ajuda ou só mostra o rombo?",
                  resposta:
                    "Ajuda, e é o módulo em que o FINCASH vai mais longe que os concorrentes: cada dívida é amortizada parcela a parcela, em Price ou SAC, com juro e amortização separados. O app compara as duas ordens de pagamento que funcionam, a avalanche e a bola de neve, diz quanto de juro cada uma custa e quantos meses ela adianta, e simula o que acontece se você conseguir pagar um pouco a mais por mês.",
                },
                {
                  pergunta: "O assistente de WhatsApp funciona hoje?",
                  resposta:
                    "Ainda não, e isso vale para tudo o que a seção dele lista, inclusive o áudio e a foto do comprovante: nada responde enquanto a linha oficial do WhatsApp não estiver plugada. O interpretador, o vínculo do número e a tela do assistente já estão prontos dentro do app. Quando a linha entrar no ar, vale para quem já assina, sem custo adicional.",
                },
                {
                  pergunta: "Funciona no celular?",
                  resposta:
                    "Sim. É uma página web feita para a tela pequena primeiro, com o menu no rodapé, onde o polegar alcança. Dá para salvar o atalho na tela inicial e usar como qualquer outro aplicativo. Não existe app nas lojas, e quando existir estará escrito aqui.",
                },
                {
                  pergunta: "Quanto tempo isso vai me tomar por semana?",
                  resposta:
                    "O registro do dia é questão de segundos, e marcar uma conta como paga é um clique. A conferida semanal é olhar um número só. O trabalho de verdade é o do começo: cadastrar as contas e o que se repete todo mês, e é o único que você faz uma vez.",
                },
                {
                  pergunta: "Preciso entender de finanças para usar?",
                  resposta:
                    "Não. Se você sabe quanto ganha e quer saber quanto pode gastar, é o bastante. As categorias já vêm criadas na primeira visita e são todas editáveis: o app começa funcionando e você ajusta ao seu jeito depois.",
                },
                {
                  pergunta:
                    "Já assino o Planejamento Financeiro. Preciso pagar de novo?",
                  resposta:
                    "Não. A casa tem uma mensalidade só, e ela libera tudo. Se você já assina, o FINCASH já está liberado na sua conta: é só entrar.",
                },
                {
                  /* ⚠️ ERA "COMO FUNCIONAM OS 7 DIAS GRÁTIS?". Não é a mesma
                     pergunta com outro nome: lá a pessoa usava antes de pagar,
                     aqui ela paga e recebe de volta se desistir. A resposta diz
                     quem executa o estorno, porque garantia sem responsável é
                     promessa, e promessa de dinheiro de volta que depende de
                     alguém responder um e-mail não tranquiliza ninguém. */
                  pergunta: `E se eu não gostar? Como funciona a garantia de ${ASSINATURA_GARANTIA_DIAS} dias?`,
                  resposta: `Você assina, usa o produto completo e tem ${ASSINATURA_GARANTIA_DIAS} dias para pedir o dinheiro de volta. O estorno é automático, feito pela própria Hotmart, e ninguém pergunta o motivo nem cobra taxa. No mensal são ${ASSINATURA_PRECO_ROTULO} por mês; no anual, ${ASSINATURA_PRECO_ANUAL_MENSAL_ROTULO} por mês cobrados de uma vez, o que economiza ${ASSINATURA_ANUAL_ECONOMIA_ROTULO} no ano.`,
                },
                {
                  pergunta: "Como faço para cancelar?",
                  resposta: `Pela Hotmart, onde a assinatura é cobrada, ou avisando a gente: a cobrança para, sem multa e sem fidelidade. Dentro dos ${ASSINATURA_GARANTIA_DIAS} dias de garantia, o valor ainda volta integral.`,
                },
                {
                  pergunta: "E os meus dados?",
                  /* A resposta honesta inclui o que a maioria dos concorrentes
                     omite: a equipe LÊ os lançamentos (é a regra do banco de
                     dados, `org: equipe le`), porque é com eles que a revisão
                     do consultor é escrita. Esconder isso aqui e a pessoa
                     descobrir depois vale menos que a assinatura. */
                  resposta:
                    "Ficam na sua conta do Workspace, com regra de banco de dados que amarra cada linha ao seu usuário. A equipe da Novare pode abrir os seus lançamentos para escrever a revisão do seu plano: é para isso, e para mais nada. A Novare não vende dado e não recebe comissão de banco nenhum.",
                },
              ]}
            />

            {/* ── O FECHO ─────────────────────────────────────────────────
                Ele leva o `<h2>` desta seção porque é o que a seção existe para
                fazer: a FAQ é o obstáculo, o fecho é a saída. */}
            <div className="pt-12 sm:pt-16">
              <div
                className="fin-palco palco-cta relative isolate overflow-hidden rounded-3xl p-7 text-white sm:flex sm:items-center sm:justify-between sm:gap-8 sm:p-10"
                style={PALCO_NAVY}
              >
                <div className="space-y-3">
                  <h2 className="max-w-md font-display text-2xl font-extrabold leading-tight sm:text-3xl">
                    Comece pelo mês que já está correndo.
                  </h2>
                  {/* ⚠️ O FECHO DIZIA "SEM PAGAR NADA E SEM CARTÃO". Ele lidera
                      pelo anual porque é o plano que a casa quer vender, e a
                      reversão de risco vem colada: o último parágrafo da página
                      é onde a pessoa decide se rola de volta até os cartões ou
                      fecha a aba. */}
                  <p className="max-w-lg text-sm leading-relaxed text-white/75">
                    Cadastre as contas, jogue o que se repete todo mês e veja,
                    em poucos minutos, quanto ainda dá para gastar até o dia 30.
                    A partir de {ASSINATURA_PRECO_ANUAL_MENSAL_ROTULO} ao mês no
                    plano anual, com o Workspace inteiro liberado e{" "}
                    {ASSINATURA_GARANTIA}.
                  </p>
                </div>

                <div className="mt-6 flex shrink-0 flex-col gap-2.5 sm:mt-0 sm:w-64">
                  <BotaoComecar variante="clara" />
                  <Link
                    href="/assinar"
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-white/25 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                  >
                    Ver tudo o que vem junto
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <p className="text-center text-2xs text-white/70">
                    Cancele quando quiser, sem multa.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <RodapeNovare aviso="servico" />
    </div>
  );
}
