/**
 * FINCASH — sair do app com os dados na mão.
 *
 * POR QUE ISTO EXISTE
 * Quem vem de planilha só confia num app de finanças se puder sair dele. App
 * que prende o dado é app que a pessoa testa por duas semanas e abandona, e o
 * dado preso não é vantagem competitiva nenhuma: é o motivo de ela não ter
 * lançado os outros dez meses.
 *
 * POR QUE CSV E NÃO `.xlsx`
 * Gerar xlsx de verdade exige uma biblioteca (SheetJS e afins passam de 400 KB)
 * para um botão que a pessoa toca uma vez por semestre. E CSV bem feito abre
 * com dois cliques no Excel, no Google Sheets e no LibreOffice. O que faz um
 * CSV "não abrir" no Brasil não é o formato — é o dialeto, que este arquivo
 * trata linha a linha logo abaixo.
 *
 * AS QUATRO ARMADILHAS DO CSV BRASILEIRO, todas resolvidas aqui:
 *   1. **Separador.** O Excel em português espera PONTO E VÍRGULA. Com vírgula,
 *      a planilha inteira cai numa coluna só e a pessoa conclui que o app está
 *      quebrado (ela não vai abrir o assistente de importação; ela vai desistir).
 *   2. **Decimal.** `1234.50` é lido como texto — ou, pior, como data. O número
 *      sai `1234,50`, sem separador de milhar, que é o que o Excel-pt entende.
 *   3. **Acento.** Sem o BOM UTF-8 no começo do arquivo, o Excel assume a
 *      codificação do sistema e "Alimentação" vira "AlimentaÃ§Ã£o".
 *   4. **Data.** `2026-03-05` vira "5 de março" em alguns locales e texto em
 *      outros. `05/03/2026` é o que o Excel-pt lê como data, sempre.
 *
 * E A QUINTA, que não é de formatação e sim de segurança: **injeção de fórmula**.
 * Uma célula começada com `=`, `+`, `-` ou `@` é executada pelo Excel ao abrir.
 * A descrição do lançamento é texto que o USUÁRIO controla — e num app com
 * consultor, esse CSV é aberto por outra pessoa, na máquina dela. `=cmd|...`
 * numa descrição é um vetor real, não teórico. Ver `escaparCampo`.
 *
 * TUDO AQUI É FUNÇÃO PURA: entra dado, sai string. Nada de `document`, nada de
 * `fetch`. É o que permite testar o arquivo inteiro no Node
 * (`scripts/testar-exportar.mjs`) sem navegador — e um gerador de CSV que não
 * tem teste é um gerador que só se descobre errado no Excel do cliente. O único
 * pedaço que toca o navegador é `baixarCsv`, no fim, isolado de propósito.
 */

import type { Lancamento, Conta, Cartao, Categoria } from "./modelo";
import type { Orcamento } from "./categorias";
import type { Meta } from "./metas";
import type { Investimento } from "./investimentos";

// ── O dialeto ───────────────────────────────────────────────────────────────

/** Ponto e vírgula. Ver a armadilha nº 1 no topo do arquivo. */
export const SEPARADOR = ";";

/** BOM UTF-8. Três bytes que decidem se o acento aparece ou vira lixo. */
export const BOM = "﻿";

/** CRLF, e não `\n`: é o que o Excel espera, e o que faz a quebra de linha
    DENTRO de um campo entre aspas ser lida como parte do campo. */
const FIM_DE_LINHA = "\r\n";

/* Os caracteres que o Excel trata como início de fórmula. O `\t` e o `\r`
   entram na lista porque também disparam a interpretação em algumas versões
   quando são o primeiro caractere da célula. */
const INICIO_DE_FORMULA = ["=", "+", "-", "@", "\t", "\r"];

/* A EXCEÇÃO QUE SALVA A COLUNA DE VALOR, e ela veio de um teste que falhou:
   `-540,30` começa com `-`, entrava na regra da fórmula, saía como `'-540,30`
   e o Excel passava a ler a coluna inteira de dinheiro como TEXTO — adeus
   `soma()`, que é a razão de a pessoa ter exportado. Um campo que é INTEIRAMENTE
   um número não pode ser fórmula (não há operador nem referência de célula
   possível), então neutralizá-lo é puro dano. "-350 estorno", que é texto de
   verdade começando com sinal, continua neutralizado. */
const SO_NUMERO = /^-?\d+(,\d+)?$/;

/**
 * Um valor vira uma célula segura.
 *
 * A ORDEM DAS DUAS DEFESAS IMPORTA e é onde quase todo mundo erra: primeiro
 * neutraliza a fórmula, DEPOIS envolve em aspas. Invertido, o apóstrofo entraria
 * fora das aspas e o campo sairia malformado.
 *
 * A NEUTRALIZAÇÃO É UM APÓSTROFO À FRENTE (`'=1+1`), e não a remoção do sinal.
 * Remover mudaria o dado da pessoa: "-350 no cartão" viraria "350 no cartão",
 * e um app de dinheiro que edita silenciosamente o que o cliente escreveu é pior
 * que um que mostra um apóstrofo a mais. O apóstrofo é a convenção que o Excel e
 * o Google Sheets entendem como "isto é texto literal".
 *
 * AS ASPAS ENTRAM SEMPRE que houver separador, aspas, quebra de linha ou espaço
 * nas pontas — e a aspa interna é dobrada, que é a regra do RFC 4180 e a única
 * que o Excel implementa direito.
 */
export function escaparCampo(valor: unknown): string {
  if (valor === null || valor === undefined) return "";

  let texto = String(valor);

  if (
    texto.length > 0 &&
    INICIO_DE_FORMULA.includes(texto[0]) &&
    !SO_NUMERO.test(texto)
  ) {
    texto = `'${texto}`;
  }

  const precisaAspas =
    texto.includes(SEPARADOR) ||
    texto.includes('"') ||
    texto.includes("\n") ||
    texto.includes("\r") ||
    texto !== texto.trim();

  return precisaAspas ? `"${texto.replace(/"/g, '""')}"` : texto;
}

/**
 * Número no dialeto brasileiro: vírgula decimal, duas casas, SEM milhar.
 *
 * Sem separador de milhar de propósito: "1.234,50" com ponto de milhar é lido
 * como número só se o locale do Excel bater exatamente com o nosso. Sem o ponto,
 * funciona em qualquer locale que use vírgula decimal — e no que não usa, o
 * estrago é um campo, não a coluna inteira.
 */
export function numeroBr(valor: number | null | undefined, casas = 2): string {
  if (valor === null || valor === undefined || !Number.isFinite(valor)) return "";
  // `toFixed` já arredonda meio-para-cima; o `-0` vira "0,00" porque "-0,00"
  // num extrato é o tipo de coisa que faz a pessoa ligar perguntando.
  const n = Object.is(valor, -0) ? 0 : valor;
  return n.toFixed(casas).replace(".", ",");
}

/** `2026-03-05` → `05/03/2026`. Ver a armadilha nº 4.
 *
 *  Fatiado por string, e não por `new Date`: `new Date("2026-03-05")` é lido
 *  como UTC e, no Brasil, volta como dia 4. É o mesmo bug que o `modelo.ts`
 *  evita nas datas do mês, e ele reapareceria aqui de graça. */
export function dataBr(iso: string | null | undefined): string {
  if (!iso) return "";
  const [ano, mes, dia] = iso.slice(0, 10).split("-");
  if (!ano || !mes || !dia) return iso;
  return `${dia}/${mes}/${ano}`;
}

/** `2026-03-05T14:22:00Z` → `05/03/2026 11:22`. Para as colunas de carimbo. */
export function dataHoraBr(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** "Sim"/"Não" em vez de true/false: a planilha é lida por gente. */
const simNao = (v: boolean | null | undefined) => (v ? "Sim" : "Não");

// ── O montador ──────────────────────────────────────────────────────────────

/** Uma coluna: o título que a pessoa lê e como extrair o valor da linha. */
export type Coluna<T> = {
  titulo: string;
  valor: (item: T) => string;
};

/**
 * Colunas + linhas → o arquivo inteiro, pronto para virar Blob.
 *
 * O BOM entra AQUI e não em `baixarCsv` porque ele é parte do conteúdo do
 * arquivo, não do transporte: um teste que compara o texto tem de ver o mesmo
 * que o Excel vai ver. Se ele morasse no download, o teste passaria e o cliente
 * abriria acentos quebrados.
 *
 * LISTA VAZIA GERA O CABEÇALHO, e não uma string vazia. Arquivo de 0 byte parece
 * download que falhou; arquivo com o cabeçalho diz "não há nada aqui" e ainda
 * serve de modelo para quem quiser preencher à mão e reimportar depois.
 */
export function montarCsv<T>(colunas: Coluna<T>[], linhas: T[]): string {
  const cabecalho = colunas.map((c) => escaparCampo(c.titulo)).join(SEPARADOR);
  const corpo = linhas.map((item) =>
    colunas.map((c) => escaparCampo(c.valor(item))).join(SEPARADOR),
  );
  // A quebra final existe: sem ela, alguns leitores engolem a última linha.
  return BOM + [cabecalho, ...corpo].join(FIM_DE_LINHA) + FIM_DE_LINHA;
}

// ── Os apoios que as tabelas de lançamento precisam ─────────────────────────

/**
 * O contexto para resolver id em nome.
 *
 * A EXPORTAÇÃO GRAVA NOME, NÃO UUID. Uma planilha com
 * `a3f1e2c0-...` na coluna de categoria é ilegível e inútil — e o objetivo do
 * arquivo é justamente ser lido fora do app, onde nenhum id significa nada.
 */
export type Dicionario = {
  contas: Conta[];
  cartoes: Cartao[];
  categorias: Categoria[];
};

const nomePor = (lista: { id: string; nome: string }[]) => {
  const mapa = new Map(lista.map((i) => [i.id, i.nome]));
  return (id: string | null | undefined) => (id ? (mapa.get(id) ?? "") : "");
};

// ── As tabelas ──────────────────────────────────────────────────────────────

/**
 * Lançamentos — a tabela que interessa.
 *
 * O VALOR SAI COM SINAL (despesa negativa), ao contrário de como ele é guardado.
 * No banco o valor é sempre positivo e o sinal vem de `tipo`, porque somar o
 * sinal duas vezes é o defeito clássico. Na planilha a regra se inverte: quem
 * abre isso quer arrastar o `soma()` na coluna e ver o resultado do mês. Por
 * isso a coluna `Tipo` continua ali ao lado — o dado não se perde, ele só ganha
 * a forma que a ferramenta de destino usa.
 */
export function csvLancamentos(lancamentos: Lancamento[], dic: Dicionario): string {
  const conta = nomePor(dic.contas);
  const cartao = nomePor(dic.cartoes);
  const categoria = nomePor(dic.categorias);

  return montarCsv<Lancamento>(
    [
      { titulo: "Data", valor: (l) => dataBr(l.data) },
      { titulo: "Descrição", valor: (l) => l.descricao },
      { titulo: "Tipo", valor: (l) => (l.tipo === "receita" ? "Receita" : "Despesa") },
      {
        titulo: "Valor",
        valor: (l) => numeroBr(l.tipo === "receita" ? l.valor : -l.valor),
      },
      { titulo: "Categoria", valor: (l) => categoria(l.categoria_id) },
      { titulo: "Subcategoria", valor: (l) => categoria(l.subcategoria_id) },
      { titulo: "Conta", valor: (l) => conta(l.conta_id) },
      { titulo: "Cartão", valor: (l) => cartao(l.cartao_id) },
      /* "Estado" e não "Pago": o campo vale para receita também, e "Pago: Não"
         num salário que ainda vai cair é confuso de ler. */
      { titulo: "Estado", valor: (l) => (l.pago ? "Realizado" : "Previsto") },
      {
        titulo: "Parcela",
        valor: (l) =>
          l.parcela_num && l.parcela_total ? `${l.parcela_num}/${l.parcela_total}` : "",
      },
      { titulo: "Observação", valor: (l) => l.observacao ?? "" },
      { titulo: "Recorrente", valor: (l) => simNao(!!l.recorrencia_id) },
    ],
    lancamentos,
  );
}

const ROTULO_TIPO_CONTA: Record<string, string> = {
  corrente: "Conta corrente",
  poupanca: "Poupança",
  carteira: "Carteira",
  investimento: "Investimento",
};

/** Contas. `saldo` entra quando a tela souber dizê-lo — sem ele o arquivo
    ainda vale, com ele vale muito mais, e é por isso que é opcional em vez de
    obrigar a tela a uma consulta a mais só para exportar. */
export function csvContas(contas: Conta[], saldos: Record<string, number> = {}): string {
  return montarCsv<Conta>(
    [
      { titulo: "Conta", valor: (c) => c.nome },
      { titulo: "Tipo", valor: (c) => ROTULO_TIPO_CONTA[c.tipo] ?? c.tipo },
      { titulo: "Saldo inicial", valor: (c) => numeroBr(c.saldo_inicial) },
      {
        titulo: "Saldo atual",
        valor: (c) => (c.id in saldos ? numeroBr(saldos[c.id]) : ""),
      },
      { titulo: "Arquivada", valor: (c) => simNao(c.arquivada) },
    ],
    contas,
  );
}

export function csvCartoes(cartoes: Cartao[], contas: Conta[] = []): string {
  const conta = nomePor(contas);
  return montarCsv<Cartao>(
    [
      { titulo: "Cartão", valor: (c) => c.nome },
      { titulo: "Limite", valor: (c) => numeroBr(c.limite) },
      { titulo: "Dia do fechamento", valor: (c) => String(c.dia_fechamento) },
      { titulo: "Dia do vencimento", valor: (c) => String(c.dia_vencimento) },
      { titulo: "Paga pela conta", valor: (c) => conta(c.conta_pagamento_id) },
      { titulo: "Arquivado", valor: (c) => simNao(c.arquivado) },
    ],
    cartoes,
  );
}

const ROTULO_GRUPO: Record<string, string> = {
  necessidades: "Necessidades",
  estilo: "Estilo de vida",
  futuro: "Futuro",
};

/**
 * Categorias, com a subcategoria na coluna ao lado.
 *
 * UMA LINHA POR CATEGORIA E POR SUBCATEGORIA, com a coluna "Categoria mãe"
 * preenchida nas filhas. Um arquivo por nível obrigaria a pessoa a cruzar dois
 * arquivos para entender a própria árvore; a coluna a mais resolve com um
 * filtro na planilha.
 */
export function csvCategorias(categorias: Categoria[]): string {
  const mae = nomePor(categorias);
  return montarCsv<Categoria>(
    [
      { titulo: "Categoria", valor: (c) => c.nome },
      { titulo: "Categoria mãe", valor: (c) => mae(c.pai_id) },
      { titulo: "Tipo", valor: (c) => (c.tipo === "receita" ? "Receita" : "Despesa") },
      { titulo: "Grupo (50/30/20)", valor: (c) => (c.grupo ? ROTULO_GRUPO[c.grupo] : "") },
      { titulo: "Cor", valor: (c) => c.cor },
      { titulo: "Arquivada", valor: (c) => simNao(c.arquivada) },
    ],
    categorias,
  );
}

/** Orçamento. O `mes_ref` sai como "03/2026" e não "2026-03": mês sem dia é o
    único caso em que o Excel-pt aceita bem a barra, e "2026-03" ele leria como
    texto ou, pior, como 3 de 2026. */
export function csvOrcamento(orcamentos: Orcamento[], categorias: Categoria[]): string {
  const nome = nomePor(categorias);
  return montarCsv<Orcamento>(
    [
      { titulo: "Categoria", valor: (o) => nome(o.categoria_id) },
      { titulo: "Subcategoria", valor: (o) => nome(o.subcategoria_id) },
      { titulo: "Modo", valor: (o) => (o.modo === "fixo" ? "Fixo (todo mês)" : "Do mês") },
      {
        titulo: "Mês",
        valor: (o) => {
          if (!o.mes_ref) return "";
          const [ano, mes] = o.mes_ref.split("-");
          return `${mes}/${ano}`;
        },
      },
      { titulo: "Valor planejado", valor: (o) => numeroBr(o.valor) },
    ],
    orcamentos,
  );
}

const ROTULO_STATUS_META: Record<string, string> = {
  ativa: "Ativa",
  pausada: "Pausada",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

const ROTULO_PRIORIDADE_META: Record<string, string> = {
  alta: "Alta",
  media: "Média",
  baixa: "Baixa",
};

/** Metas. O "guardado" vem calculado de fora (`valor_inicial` + aportes), porque
    quem sabe somar aporte é `metas.ts` — repetir a soma aqui é como as duas
    contas passam a divergir. */
export function csvMetas(metas: Meta[], guardado: Record<string, number> = {}): string {
  return montarCsv<Meta>(
    [
      { titulo: "Meta", valor: (m) => m.nome },
      { titulo: "Objetivo", valor: (m) => numeroBr(m.valor_alvo) },
      {
        titulo: "Guardado",
        valor: (m) => numeroBr(m.id in guardado ? guardado[m.id] : m.valor_inicial),
      },
      {
        titulo: "Falta",
        valor: (m) => {
          const tem = m.id in guardado ? guardado[m.id] : m.valor_inicial;
          return numeroBr(Math.max(0, m.valor_alvo - tem));
        },
      },
      { titulo: "Prazo", valor: (m) => dataBr(m.prazo) },
      {
        titulo: "Prioridade",
        valor: (m) => ROTULO_PRIORIDADE_META[m.prioridade] ?? m.prioridade,
      },
      { titulo: "Situação", valor: (m) => ROTULO_STATUS_META[m.status] ?? m.status },
      { titulo: "Observação", valor: (m) => m.observacao ?? "" },
    ],
    metas,
  );
}

const ROTULO_CLASSE_INV: Record<string, string> = {
  renda_fixa: "Renda fixa",
  renda_variavel: "Renda variável",
  fundo: "Fundos",
  previdencia: "Previdência",
  cripto: "Cripto",
  outro: "Outros",
};

const ROTULO_LIQUIDEZ: Record<string, string> = {
  diaria: "Diária",
  carencia: "Após carência",
  vencimento: "No vencimento",
};

/** Investimentos. O "Rendimento" sai em reais E em percentual: quem confere
    extrato quer o real, quem compara aplicações quer o percentual, e calcular
    um a partir do outro na planilha é exatamente o trabalho que o arquivo devia
    poupar. */
export function csvInvestimentos(investimentos: Investimento[]): string {
  return montarCsv<Investimento>(
    [
      { titulo: "Investimento", valor: (i) => i.nome },
      { titulo: "Instituição", valor: (i) => i.instituicao },
      { titulo: "Classe", valor: (i) => ROTULO_CLASSE_INV[i.classe] ?? i.classe },
      {
        titulo: "Indexador",
        valor: (i) => (i.indexador ? i.indexador.toUpperCase() : ""),
      },
      { titulo: "Taxa", valor: (i) => numeroBr(i.taxa) },
      { titulo: "Aplicado", valor: (i) => numeroBr(i.valor_aplicado) },
      { titulo: "Valor atual", valor: (i) => numeroBr(i.valor_atual) },
      {
        titulo: "Rendimento",
        valor: (i) => numeroBr(i.valor_atual - i.valor_aplicado),
      },
      {
        titulo: "Rendimento (%)",
        valor: (i) =>
          i.valor_aplicado > 0
            ? numeroBr(((i.valor_atual - i.valor_aplicado) / i.valor_aplicado) * 100)
            : "",
      },
      { titulo: "Aplicado em", valor: (i) => dataBr(i.data_aplicacao) },
      { titulo: "Atualizado em", valor: (i) => dataBr(i.data_atualizacao) },
      { titulo: "Vencimento", valor: (i) => dataBr(i.vencimento) },
      { titulo: "Liquidez", valor: (i) => ROTULO_LIQUIDEZ[i.liquidez] ?? i.liquidez },
      { titulo: "Arquivado", valor: (i) => simNao(i.arquivado) },
    ],
    investimentos,
  );
}

/** A lixeira também se exporta. Parece exagero e não é: é a única prova, fora do
    app, do que foi apagado e quando — e é o que salva quem vai perder o prazo de
    30 dias do expurgo e quer guardar o registro antes. */
export function csvLixeira(lancamentos: Lancamento[], dic: Dicionario): string {
  const categoria = nomePor(dic.categorias);
  const conta = nomePor(dic.contas);
  const cartao = nomePor(dic.cartoes);

  return montarCsv<Lancamento>(
    [
      { titulo: "Apagado em", valor: (l) => dataHoraBr(l.apagado_em) },
      { titulo: "Data", valor: (l) => dataBr(l.data) },
      { titulo: "Descrição", valor: (l) => l.descricao },
      { titulo: "Tipo", valor: (l) => (l.tipo === "receita" ? "Receita" : "Despesa") },
      {
        titulo: "Valor",
        valor: (l) => numeroBr(l.tipo === "receita" ? l.valor : -l.valor),
      },
      { titulo: "Categoria", valor: (l) => categoria(l.categoria_id) },
      { titulo: "Origem", valor: (l) => conta(l.conta_id) || cartao(l.cartao_id) },
    ],
    lancamentos,
  );
}

// ── Nome do arquivo ─────────────────────────────────────────────────────────

/**
 * `fincash-lancamentos-2026-09-10.csv`.
 *
 * A DATA NO NOME, em ISO, e por dois motivos práticos: o navegador não
 * sobrescreve o download da semana passada (ele viraria "(1)", "(2)"…) e a pasta
 * de Downloads ordena sozinha por nome, que é a ordem certa. ISO aqui e não
 * dd/mm porque barra não pode e porque nome de arquivo é para a máquina ordenar,
 * não para a pessoa ler como data.
 */
export function nomeArquivo(base: string, quando = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  const dia = `${quando.getFullYear()}-${p(quando.getMonth() + 1)}-${p(quando.getDate())}`;
  return `fincash-${base}-${dia}.csv`;
}

// ── O download ──────────────────────────────────────────────────────────────

/**
 * Salva o CSV na máquina da pessoa.
 *
 * NÃO PASSA PELO SERVIDOR, e isso é decisão de privacidade, não de performance:
 * o dado já está no navegador (a tela acabou de carregá-lo do Supabase), e
 * mandá-lo para uma rota nossa só para ele voltar significaria o extrato inteiro
 * do cliente trafegando de novo, aparecendo em log de servidor e passando por
 * uma máquina que não precisava tê-lo visto. Blob + link resolve sem nada disso.
 *
 * `type` com `charset=utf-8` COMBINADO com o BOM: o charset serve ao navegador,
 * o BOM serve ao Excel, e nenhum dos dois substitui o outro.
 *
 * O `revokeObjectURL` no fim não é higiene opcional: sem ele, cada exportação
 * segura o arquivo inteiro na memória da aba até a página ser recarregada — e a
 * exportação "tudo" gera oito de uma vez.
 */
export function baixarCsv(nome: string, conteudo: string): void {
  const blob = new Blob([conteudo], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  a.rel = "noopener";
  /* Fora da árvore não funciona no Firefox — o clique num nó solto é ignorado.
     Entra escondido, clica, sai. */
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();

  /* O revoke imediato cancela o download no Safari, que só lê o Blob depois do
     tique seguinte do loop. O atraso é o preço de funcionar nos quatro. */
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
