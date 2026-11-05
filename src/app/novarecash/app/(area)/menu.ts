import { falarNoWhatsApp } from "@/lib/contato";

/**
 * O MAPA DAS TELAS DO NOVARECASH — um só, para o trilho, a barra do polegar, a
 * folha "Mais", a paleta (Ctrl K) e o ícone do cabeçalho de cada tela.
 *
 * ⚠️ É AQUI, E SÓ AQUI, que uma tela nova entra no menu. Uma tela que existe e
 * não está nesta lista fica invisível (e sem ícone no cabeçalho).
 *
 * Módulo COMUM (sem "use client"): serve ao servidor e ao navegador.
 */

/** Os 16 ícones 3D de `public/novarecash/icones/` (Magnific, 04/11/2026). */
export type NomeIcone =
  | "inicio"
  | "extrato"
  | "cartoes"
  | "contas"
  | "orcamento"
  | "metas"
  | "relatorios"
  | "patrimonio"
  | "ia"
  | "alertas"
  | "banco"
  | "conversa"
  | "importar"
  | "ajustes"
  | "consultor"
  | "compartilhada";

export type Tela = {
  href: string;
  rotulo: string;
  icone: NomeIcone;
  /** Só a rota exata conta como ativa (o Início, que é prefixo de todas). */
  exato?: boolean;
  /** Palavras a mais para a busca da paleta achar a tela pelo que ela faz. */
  palavras?: string;
};

export const GRUPOS: { titulo: string; telas: Tela[] }[] = [
  {
    titulo: "Dia a dia",
    telas: [
      { href: "/novarecash/app", rotulo: "Início", icone: "inicio", exato: true, palavras: "painel resumo saldo" },
      { href: "/novarecash/app/extrato", rotulo: "Extrato", icone: "extrato", palavras: "lançamentos gastos entradas" },
      { href: "/novarecash/app/cartoes", rotulo: "Cartões", icone: "cartoes", palavras: "fatura crédito" },
      { href: "/novarecash/app/contas", rotulo: "Contas a pagar", icone: "contas", palavras: "boletos vencimento fixas" },
    ],
  },
  {
    titulo: "Planejar",
    telas: [
      { href: "/novarecash/app/orcamento", rotulo: "Orçamento", icone: "orcamento", palavras: "limite categorias" },
      { href: "/novarecash/app/metas", rotulo: "Metas", icone: "metas", palavras: "objetivo juntar guardar" },
      { href: "/novarecash/app/relatorios", rotulo: "Relatórios", icone: "relatorios", palavras: "gráficos meses comparar" },
      { href: "/novarecash/app/patrimonio", rotulo: "Patrimônio", icone: "patrimonio", palavras: "investimentos bens dívidas" },
    ],
  },
  {
    titulo: "Inteligência",
    telas: [
      { href: "/novarecash/app/ia", rotulo: "IA", icone: "ia", palavras: "assistente perguntar chat" },
      { href: "/novarecash/app/alertas", rotulo: "Alertas", icone: "alertas", palavras: "avisos notificações" },
    ],
  },
  {
    titulo: "Conectar",
    telas: [
      { href: "/novarecash/app/banco", rotulo: "Banco", icone: "banco", palavras: "open finance conectar" },
      { href: "/novarecash/app/whatsapp", rotulo: "WhatsApp", icone: "conversa", palavras: "mensagem áudio foto nota" },
      { href: "/novarecash/app/importar", rotulo: "Importar extrato", icone: "importar", palavras: "ofx csv arquivo" },
      { href: "/novarecash/app/ajustes", rotulo: "Ajustes", icone: "ajustes", palavras: "categorias assinatura compartilhar" },
    ],
  },
];

export const TODAS = GRUPOS.flatMap((g) => g.telas);

/** As quatro da barra do polegar; o resto vai para "Mais". */
export const NA_BARRA = ["/novarecash/app", "/novarecash/app/extrato", "/novarecash/app/cartoes", "/novarecash/app/ia"];

/** O botão principal da casca: lançar um gasto em dois toques. */
export const LANCAR_GASTO = "/novarecash/app/extrato?novo=1";

/** O trunfo da casa: gente de verdade do outro lado (04/11/2026). */
export const CONSULTOR = falarNoWhatsApp("Olá! Sou assinante do NovareCash e quero falar com um consultor da Novare.");

export function estaAtivo(caminho: string, t: Tela) {
  return t.exato ? caminho === t.href : caminho === t.href || caminho.startsWith(`${t.href}/`);
}

/** A tela de um caminho (o ícone do cabeçalho sai daqui). */
export function telaDaRota(caminho: string): Tela | undefined {
  return TODAS.find((t) => estaAtivo(caminho, t));
}

/** "Franklin Castriani" → "FC"; um nome só → as duas primeiras letras. */
export function iniciais(nome?: string | null): string {
  const partes = (nome ?? "").trim().split(/\s+/).filter(Boolean);
  if (!partes.length) return "N";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}
