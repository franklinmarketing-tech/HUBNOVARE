import { RECURSOS } from "./config";

/**
 * O GUIA DE PRIMEIRO USO DO NOVARECASH (05/11/2026, pedido do dono: "ser intuitivo
 * como primeiro uso, ajudando com guideline").
 *
 * Mesmo espírito de `src/lib/manuais` (o tour do FINCASH e das ferramentas): cada
 * passo tem `alvo`, `titulo` e `explica`. A diferença é COMO o alvo é achado: aqui
 * ele é o atributo `data-guia="..."` posto na tela (e na casca), e não o começo do
 * texto do elemento. A casca do NovareCash (trilho, barra do polegar, avatar) fica
 * FORA do `<main>` e muda de forma entre computador e celular — texto não serve.
 *
 * Regras do alvo (ver `TourNovareCash.tsx`):
 *   • vale o PRIMEIRO elemento visível com aquele `data-guia` (o computador e o
 *     celular desenham peças diferentes com o mesmo nome);
 *   • `"a|b"` = alternativas, na ordem;
 *   • `tela-<ícone>` cai sozinho no grupo recolhido do trilho e no "Mais" do celular;
 *   • passo sem alvo visível é pulado (a tela vazia não tem lista, por exemplo).
 *
 * ⚠️ HONESTIDADE: banco e WhatsApp só aparecem como "libera em", lidos de
 * `RECURSOS` (config.ts). Ligou o recurso? O texto muda sozinho.
 * ⚠️ CVM: o guia ensina a ORGANIZAR. Nunca fala em investir em produto.
 */

export type PassoGuia = {
  /** Valor de `data-guia` na tela; alternativas separadas por "|". */
  alvo: string;
  titulo: string;
  /** 1 ou 2 frases. */
  explica: string;
  /** Texto do celular, quando o jeito de chegar lá é outro (a lupa no lugar do Ctrl K). */
  explicaCelular?: string;
};

export type Guia = { titulo: string; passos: PassoGuia[] };

const recurso = (chave: "banco" | "whatsapp") => RECURSOS.find((r) => r.chave === chave);
const libera = (chave: "banco" | "whatsapp") => recurso(chave)?.liberaEm ?? "breve";
const noAr = (chave: "banco" | "whatsapp") => recurso(chave)?.noAr ?? false;

/** "O banco e o WhatsApp lançam sozinhos…", com a data de quem ainda não está no ar. */
export function fraseDasConexoes(): string {
  const b = noAr("banco");
  const w = noAr("whatsapp");
  if (b && w) return "O banco e o WhatsApp lançam sozinhos, assim que você ligar.";
  if (!b && !w) {
    return libera("banco") === libera("whatsapp")
      ? `O banco e o WhatsApp vão lançar sozinhos: os dois liberam em ${libera("banco")}.`
      : `O banco (libera em ${libera("banco")}) e o WhatsApp (libera em ${libera("whatsapp")}) vão lançar sozinhos.`;
  }
  return b
    ? `O banco já lança sozinho; o WhatsApp libera em ${libera("whatsapp")}.`
    : `O WhatsApp já lança sozinho; o banco libera em ${libera("banco")}.`;
}

/** O TOUR DO APP: a casca, nos dois tamanhos. Aparece depois das boas-vindas. */
export const TOUR_APP: PassoGuia[] = [
  {
    alvo: "lancar",
    titulo: "Lançar gasto",
    explica: "O botão mais importante: registre um gasto ou uma entrada em dois toques.",
  },
  {
    alvo: "busca",
    titulo: "Busca rápida",
    explica: "Ache qualquer tela ou ação digitando o nome. Aperte Ctrl K de qualquer lugar.",
    explicaCelular: "Toque na lupa e digite o nome de qualquer tela ou ação.",
  },
  {
    alvo: "tela-extrato",
    titulo: "Extrato",
    explica: "Tudo o que entrou e saiu, dia a dia. É aqui que você edita um lançamento ou troca a categoria.",
  },
  {
    alvo: "tela-cartoes",
    titulo: "Cartões",
    explica: "A fatura de cada cartão, as parcelas que vêm por aí e quanto do limite está livre.",
  },
  {
    alvo: "tela-contas",
    titulo: "Contas a pagar",
    explica: "Aluguel, luz, escola: veja o que vence no mês e marque como paga.",
  },
  {
    alvo: "tela-orcamento",
    titulo: "Orçamento",
    explica: "Um limite por mês para cada categoria. O NovareCash avisa quando passar de 80% e de 100%.",
  },
  {
    alvo: "tela-ia",
    titulo: "IA",
    explica: "Pergunte sobre o seu dinheiro em português. Ela responde com os seus números e não recomenda investimento.",
  },
  {
    alvo: "tela-banco",
    titulo: "Banco",
    explica: noAr("banco")
      ? "Conecte a sua conta pelo Open Finance: saldo e extrato entram sozinhos, só leitura."
      : `A conexão pelo Open Finance libera em ${libera("banco")}. Até lá, lance à mão ou importe o extrato do banco.`,
  },
  {
    alvo: "usuario",
    titulo: "Sua conta",
    explica: "Troque entre o tema claro e o escuro, fale com um consultor da Novare e refaça este tour quando quiser.",
  },
];

const ativacaoBanco: PassoGuia = {
  alvo: "ativacao",
  titulo: "Conexão com o banco",
  explica: `Libera em ${libera("banco")}. Quando liberar, saldo e extrato entram sozinhos, só leitura: ninguém movimenta dinheiro por aqui.`,
};

/** O "?" DE CADA TELA: a chave é a rota (a mesma de `menu.ts`). */
export const GUIAS: Record<string, Guia> = {
  "/novarecash/app": {
    titulo: "Início",
    passos: [
      {
        alvo: "inicio-passos",
        titulo: "Primeiros passos",
        explica: "As tarefas para deixar o NovareCash pronto. Cada uma se marca sozinha quando você faz.",
      },
      {
        alvo: "inicio-saldo",
        titulo: "O seu mês",
        explica: "O saldo de hoje nas suas contas e o que entrou, saiu e sobrou no mês.",
      },
      {
        alvo: "lancar",
        titulo: "Lançar gasto",
        explica: "Registre um gasto ou uma entrada em dois toques. O Início se atualiza na hora.",
      },
      {
        alvo: "inicio-recursos",
        titulo: "Banco, WhatsApp e IA",
        explica: "O estado de cada recurso. O que ainda não está no ar mostra a data em que libera.",
      },
      {
        alvo: "inicio-assinatura",
        titulo: "Minha assinatura",
        explica: "O seu plano e até quando ele vale.",
      },
    ],
  },
  "/novarecash/app/extrato": {
    titulo: "Extrato",
    passos: [
      {
        alvo: "extrato-novo",
        titulo: "Novo lançamento",
        explica: "Registre um gasto ou uma entrada à mão, com valor, data e categoria.",
      },
      {
        alvo: "extrato-contas",
        titulo: "Minhas contas",
        explica: "Crie as suas contas e cartões com o saldo de hoje. O saldo acompanha cada lançamento.",
      },
      {
        alvo: "extrato-mes",
        titulo: "O mês",
        explica: "Troque de mês nas setas. Entradas, saídas e sobra são do mês escolhido.",
      },
      {
        alvo: "extrato-filtros",
        titulo: "Busca e categoria",
        explica: "Ache um lançamento pela descrição ou veja só uma categoria.",
      },
      {
        alvo: "extrato-lista",
        titulo: "Os lançamentos",
        explica: "Agrupados por dia. Toque num lançamento para editar, ou troque a categoria direto na lista.",
      },
    ],
  },
  "/novarecash/app/cartoes": {
    titulo: "Cartões",
    passos: [
      {
        alvo: "cartoes-vazio",
        titulo: "Cadastrar cartão",
        explica: "Informe o dia em que a fatura fecha e o dia em que vence. Daí em diante, cada compra cai na fatura certa.",
      },
      {
        alvo: "cartoes-seletor",
        titulo: "Os seus cartões",
        explica: "Escolha o cartão para ver a fatura dele, ou toque em “+ Cartão” para cadastrar outro.",
      },
      {
        alvo: "cartoes-limite",
        titulo: "Limite usado e livre",
        explica: "Quanto do limite já está usado, contando as parcelas que ainda vão cair.",
      },
      {
        alvo: "cartoes-fatura",
        titulo: "A fatura",
        explica: "Cada compra da fatura, com o total e o vencimento. Pagar a fatura não conta como gasto de novo.",
      },
      {
        alvo: "cartoes-proximas",
        titulo: "Próximas faturas",
        explica: "As parcelas que já estão marcadas para os próximos meses.",
      },
    ],
  },
  "/novarecash/app/contas": {
    titulo: "Contas a pagar",
    passos: [
      {
        alvo: "contas-nova",
        titulo: "Nova conta a pagar",
        explica: "Cadastre uma conta fixa (aluguel, luz, escola) ou uma que vence uma vez só, como o IPVA.",
      },
      {
        alvo: "contas-mes",
        titulo: "O mês",
        explica: "Quanto falta pagar, o que atrasou e o que já foi pago. Troque de mês nas setas.",
      },
      {
        alvo: "contas-lista",
        titulo: "As contas do mês",
        explica: "Separadas por situação. Ao marcar “Paguei”, o gasto entra sozinho no Extrato.",
      },
    ],
  },
  "/novarecash/app/orcamento": {
    titulo: "Orçamento",
    passos: [
      {
        alvo: "orcamento-resumo",
        titulo: "O mês no orçamento",
        explica: "Quanto já saiu nas categorias com limite, perto do total que você definiu.",
      },
      {
        alvo: "orcamento-com-limite",
        titulo: "Com limite",
        explica: "Cada categoria com a barra do mês. Acima de 80% ela fica amarela; passou de 100%, vermelha.",
      },
      {
        alvo: "orcamento-sem-limite",
        titulo: "Sem limite",
        explica: "Toque em “+ Limite” para dizer quanto quer gastar por mês nessa categoria. Vale todo mês até você mudar.",
      },
    ],
  },
  "/novarecash/app/metas": {
    titulo: "Metas",
    passos: [
      {
        alvo: "metas-resumo",
        titulo: "As suas metas",
        explica: "Quanto você quer juntar e até quando. O NovareCash mostra quanto guardar por mês para chegar no prazo.",
      },
      {
        alvo: "metas-lista",
        titulo: "Cada meta",
        explica: "O progresso e o prazo. Toque em “Guardei mais” sempre que separar dinheiro para ela.",
      },
      {
        alvo: "metas-aviso",
        titulo: "Onde guardar",
        explica: "A meta só acompanha o valor; onde guardar é decisão sua. Na dúvida, fale com um consultor da Novare.",
      },
    ],
  },
  "/novarecash/app/relatorios": {
    titulo: "Relatórios",
    passos: [
      {
        alvo: "relatorios-mes",
        titulo: "Mês e downloads",
        explica: "Escolha o mês nas setas. Baixe em planilha (CSV) ou imprima em PDF.",
      },
      {
        alvo: "relatorios-vazio",
        titulo: "Ainda sem lançamentos",
        explica: "Os relatórios se montam sozinhos com o que você lançar ou importar.",
      },
      {
        alvo: "relatorios-mes-a-mes",
        titulo: "Mês a mês",
        explica: "Entradas, gastos e sobra dos últimos 6 meses, lado a lado.",
      },
      {
        alvo: "relatorios-categorias",
        titulo: "Por categoria",
        explica: "Para onde o dinheiro foi no mês, categoria por categoria.",
      },
      {
        alvo: "relatorios-maiores",
        titulo: "Maiores gastos",
        explica: "Os lançamentos que mais pesaram no mês escolhido.",
      },
    ],
  },
  "/novarecash/app/patrimonio": {
    titulo: "Patrimônio",
    passos: [
      {
        alvo: "patrimonio-total",
        titulo: "Patrimônio líquido",
        explica: "O que você tem menos o que deve: saldos, investimentos lançados e faturas em aberto.",
      },
      {
        alvo: "patrimonio-classes",
        titulo: "Divisão por classe",
        explica: "Quanto você tem em cada tipo. É um retrato para organizar, não uma recomendação.",
      },
      {
        alvo: "patrimonio-tem",
        titulo: "O que você tem",
        explica: "Cada conta e investimento. Atualize o valor de um investimento sempre que quiser.",
      },
      {
        alvo: "ativacao",
        titulo: "Investimentos pelo banco",
        explica: noAr("banco")
          ? "Os investimentos das contas conectadas entram sozinhos."
          : `Libera em ${libera("banco")}. Até lá, lance os seus investimentos à mão.`,
      },
    ],
  },
  "/novarecash/app/ia": {
    titulo: "IA",
    passos: [
      {
        alvo: "ia-aviso",
        titulo: "O que a IA faz",
        explica: "Organiza e explica o seu dinheiro com os seus números. Não recomenda investimento.",
      },
      {
        alvo: "ia-sugestoes",
        titulo: "Perguntas prontas",
        explica: "Toque numa delas para começar.",
      },
      {
        alvo: "ia-pergunta",
        titulo: "A sua pergunta",
        explica: "Escreva como falaria com uma pessoa e envie. A resposta sai do seu extrato e do seu orçamento.",
      },
      {
        alvo: "ativacao",
        titulo: "IA sendo ligada",
        explica: "Enquanto a IA liga, o extrato, o orçamento e as metas funcionam normalmente.",
      },
    ],
  },
  "/novarecash/app/alertas": {
    titulo: "Alertas",
    passos: [
      {
        alvo: "alertas-vazio",
        titulo: "Ainda sem o que analisar",
        explica: "Os alertas aparecem quando o extrato tiver lançamentos. Com 2 ou 3 meses, eles ficam certeiros.",
      },
      {
        alvo: "alertas-contador",
        titulo: "O que pode estar saindo",
        explica: "A soma por mês de assinaturas, cobranças repetidas e tarifas achadas no seu extrato.",
      },
      {
        alvo: "alertas-filtro",
        titulo: "Filtro por tipo",
        explica: "Veja só um tipo de alerta por vez.",
      },
      {
        alvo: "alertas-lista",
        titulo: "Cada alerta",
        explica: "Mostra os números e os lançamentos que levaram a ele. “Já resolvi” tira o alerta da lista.",
      },
    ],
  },
  "/novarecash/app/banco": {
    titulo: "Banco",
    passos: [
      ativacaoBanco,
      {
        alvo: "banco-conectar",
        titulo: "Conectar o banco",
        explica: "Autorize o seu banco pelo Open Finance, o sistema oficial do Banco Central. Só leitura.",
      },
      {
        alvo: "banco-conexoes",
        titulo: "Bancos conectados",
        explica: "As conexões ativas. Dá para atualizar ou desligar quando quiser.",
      },
      {
        alvo: "tela-importar",
        titulo: "Enquanto isso: importar",
        explica: "Baixe o extrato em OFX ou CSV no app do banco e traga em Importar extrato.",
      },
    ],
  },
  "/novarecash/app/whatsapp": {
    titulo: "WhatsApp",
    passos: [
      {
        alvo: "ativacao",
        titulo: "Assistente no WhatsApp",
        explica: noAr("whatsapp")
          ? "Ligue o seu número e lance gastos por mensagem."
          : `Libera em ${libera("whatsapp")}. Até lá, use o botão Lançar gasto: são dois toques.`,
      },
      {
        alvo: "whatsapp-ligar",
        titulo: "Ligar o seu número",
        explica: "Gere um código de seis dígitos e mande pelo WhatsApp para ligar o seu número.",
      },
      {
        alvo: "whatsapp-recentes",
        titulo: "Registrado pelo WhatsApp",
        explica: "O que chegou por mensagem aparece aqui e no Extrato.",
      },
      {
        alvo: "whatsapp-exemplos",
        titulo: "O que mandar",
        explica: "Exemplos de texto, áudio e foto da nota que o assistente entende.",
      },
    ],
  },
  "/novarecash/app/importar": {
    titulo: "Importar extrato",
    passos: [
      {
        alvo: "importar-ultima",
        titulo: "Última importação",
        explica: "Importou o arquivo errado? “Desfazer” tira todos os lançamentos daquele arquivo.",
      },
      {
        alvo: "importar-arquivo",
        titulo: "Escolher o arquivo",
        explica: "OFX ou CSV, até 5 MB. O arquivo é lido no seu aparelho e você confere tudo antes de gravar.",
      },
      {
        alvo: "importar-onde",
        titulo: "Onde achar o arquivo",
        explica: "No app do banco, abra o extrato, escolha o período e procure “exportar” ou “baixar”.",
      },
    ],
  },
  "/novarecash/app/ajustes": {
    titulo: "Ajustes",
    passos: [
      {
        alvo: "ajustes-categorias",
        titulo: "Categorias personalizadas",
        explica: "Crie categorias além das do app. Elas aparecem nos lançamentos e na importação.",
      },
      {
        alvo: "ajustes-compartilhar",
        titulo: "Conta compartilhada",
        explica: "Convide quem divide as contas com você: os dois veem e lançam no mesmo NovareCash.",
      },
      {
        alvo: "ajustes-assinatura",
        titulo: "Minha assinatura",
        explica: "O seu plano, até quando ele vale e como cancelar.",
      },
    ],
  },
};

/** O guia da tela aberta (rota exata, sem barra no fim). */
export function guiaDaRota(caminho: string): Guia | undefined {
  return GUIAS[caminho.replace(/\/$/, "")];
}
